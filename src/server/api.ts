/**
 * Thrap API logic, shared by the Vite dev-server plugin and the production
 * server.
 *
 * The two entry points differ only in how they receive a request. Keeping the
 * safety logic here means the crisis gate, turn limit, and output guard cannot
 * drift between what is tested in development and what is served in
 * production.
 */

import {
  buildContextBlock,
  containsUnresolvedPlaceholder,
  extractCitations,
} from "../rag/context";
import { DEFAULT_EMBEDDING_MODEL, embedTexts, type EmbeddingProvider } from "../rag/embeddings";
import { createRetriever, type Retriever } from "../rag/retrieve";
import type { RetrievedChunk } from "../rag/types";
import type { Citation } from "../api/types";
import { THERAPY_SYSTEM_PROMPT } from "../therapy-prompt";
import {
  clearSession,
  getSession,
  recordExchange,
  type ChatMessage,
  type Session,
} from "./session";

// --- Configuration ---------------------------------------------------------

export const DEFAULT_MODEL = "anthropic/claude-haiku-4.5";

/** OpenRouter speaks the OpenAI chat-completions dialect. */
const CHAT_BASE_URL = "https://openrouter.ai/api/v1";

export const HUMAN_ROUTE = {
  role: "Licensed counsellor",
  channelLabel: "confidential EAP support portal",
  actionTarget: "#eap-support-portal",
};

const CRISIS_SIGNALS = [
  "kill myself", "end my life", "suicide", "want to die",
  "hurt myself", "self harm", "self-harm", "harming myself",
  "don't want to be here", "not worth living", "better off dead",
  "take my own life", "ending it",
];

const INTENT_TO_MESSAGE: Record<string, string> = {
  TALK_THROUGH:     "I need to talk to someone. There's something on my mind.",
  ANXIETY:          "I've been feeling really anxious lately.",
  LOW_MOOD:         "I've been feeling low and down.",
  BURNOUT:          "I'm experiencing burnout and work stress.",
  SLEEP:            "I've been having a lot of trouble sleeping.",
  BOOK_COUNSELLOR:  "I'd like to book a session with a counsellor.",
};

const TURN_LIMIT = 20;
const BOOKING_TOKEN = "[RECOMMEND_BOOKING]";

const FALLBACK_RESPONSES = [
  "Thank you for reaching out - that takes courage. I'm here and I have time. Can you tell me a bit more about what's been going on? What made you decide to reach out today?",
  "It sounds like this has been weighing on you. How long have things been feeling this way, and would you say it's been getting worse or staying about the same?",
  "I want to make sure I understand the full picture. How is this showing up day-to-day - things like sleep, work, concentration, or your relationships with people around you?",
  "Thank you for being so open with me. Do you have people around you - friends, family - who know what you're going through? Or has this mostly been something you've been carrying on your own?",
  "What you've shared today sounds significant, and you deserve proper, consistent support. I'd really like to help you book a session with a licensed counsellor who can work through this with you properly. Would you like to do that?",
  "I'm glad you're still here. Take as much time as you need - there's no rush. What else would you like to talk through?",
];

export interface EmbeddingConfig {
  provider: EmbeddingProvider;
  apiKey: string;
  model: string;
}

export interface ThrapConfig {
  apiKey: string;
  model: string;
  embed: EmbeddingConfig;
}

/** Build configuration from an environment map, so both entry points agree. */
export function configFromEnv(env: Record<string, string | undefined>): ThrapConfig {
  const apiKey = env.OPENROUTER_API_KEY ?? "";
  const provider = (env.EMBEDDING_PROVIDER as EmbeddingProvider) || "openrouter";

  const keyFor: Record<EmbeddingProvider, string> = {
    openrouter: apiKey,
    openai: env.OPENAI_API_KEY ?? "",
    gemini: env.GEMINI_API_KEY ?? "",
  };

  return {
    apiKey,
    model: env.OPENROUTER_MODEL ?? DEFAULT_MODEL,
    embed: {
      provider,
      apiKey: keyFor[provider] ?? "",
      model: env.EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL[provider],
    },
  };
}

// --- Chat provider ---------------------------------------------------------

interface ChatResponse {
  choices?: { message: { content: string | null }; finish_reason?: string }[];
  error?: { message: string };
}

/** Attempts per turn, including the first. Kept low so escalation stays prompt. */
const CHAT_MAX_ATTEMPTS = 3;

/** Overload and transient upstream failures. Never other 4xx, which will not improve. */
const CHAT_RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

/** Longest wait worth taking before escalating instead. */
const CHAT_MAX_RETRY_WAIT_MS = 4_000;

async function callChatModel(
  apiKey: string,
  model: string,
  systemInstruction: string,
  history: ChatMessage[],
  userMessage: string,
): Promise<string> {
  const body = {
    model,
    messages: [
      { role: "system", content: systemInstruction },
      ...history,
      { role: "user", content: userMessage },
    ],
    temperature: 0.75,
    top_p: 0.9,
    max_tokens: 800,
  };

  // A transient provider overload should not end someone's session at a
  // terminal escalation screen. Retrying the same call changes no safety
  // decision, and the fail-closed path still applies once the budget is spent.
  let data: ChatResponse;

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${CHAT_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Title": "Thrap",
      },
      body: JSON.stringify(body),
    });

    data = (await res.json()) as ChatResponse;
    const failed = !res.ok || Boolean(data.error);

    if (failed && CHAT_RETRYABLE_STATUS.has(res.status) && attempt < CHAT_MAX_ATTEMPTS - 1) {
      // Providers state the wait they want ("Please try again in 45.1s"). A long
      // wait means an exhausted quota rather than a passing spike: retrying then
      // only burns further requests and leaves the person watching a spinner, so
      // escalate immediately instead.
      const wait = /(?:retry|try again) in ([\d.]+)s/i.exec(data.error?.message ?? "");
      const waitMs = wait ? Number.parseFloat(wait[1]) * 1000 : 2 ** attempt * 600;

      if (waitMs <= CHAT_MAX_RETRY_WAIT_MS) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
    }
    if (failed) throw new Error(data.error?.message ?? `Chat API error ${res.status}`);
    break;
  }

  const choice = data.choices?.[0];

  // A reply cut off mid-sentence must never reach someone in distress.
  // Treat it as a provider failure so the caller escalates to a human.
  if (choice?.finish_reason === "length") {
    throw new Error("Model response was truncated before it completed");
  }
  if (choice?.finish_reason === "content_filter") {
    throw new Error("Model response was withheld by the provider content filter");
  }

  return choice?.message?.content ?? "";
}

/** Embed the user's turn so semantic retrieval can run. Never throws. */
async function embedQuery(embed: EmbeddingConfig, query: string): Promise<number[] | undefined> {
  try {
    const [vector] = await embedTexts([query], {
      provider: embed.provider,
      apiKey: embed.apiKey,
      model: embed.model,
      task: "RETRIEVAL_QUERY",
    });
    return vector;
  } catch {
    // Lexical scoring still runs; retrieval degrades rather than failing.
    return undefined;
  }
}

/**
 * Deterministic grounded reply for the no-key fallback. Returns approved corpus
 * text verbatim, skipping paragraphs holding unresolved placeholders so no
 * unapproved value is shown to a person.
 */
function groundedFallback(results: RetrievedChunk[]): { message: string; citations: Citation[] } | null {
  const top = results[0];
  if (!top || top.score < 0.5) return null;

  const paragraphs = top.chunk.text.split(/\n{2,}/).slice(1);
  const usable = paragraphs.find(
    (paragraph) => paragraph.length > 80 && !containsUnresolvedPlaceholder(paragraph),
  );
  if (!usable) return null;

  return {
    message: usable.replace(/\s+/g, " ").trim(),
    citations: [{
      documentTitle: top.chunk.documentTitle,
      section: top.chunk.section,
      version: top.chunk.version,
    }],
  };
}

// --- Public API ------------------------------------------------------------

export type ApiResult = { status: number; body: unknown };

const escalation = (reasonCode: string): ApiResult => ({
  status: 200,
  body: { kind: "escalation", message: "", reasonCode, humanRoute: HUMAN_ROUTE },
});

export interface ThrapApi {
  navigate(input: { message?: string; intent?: string }, session: Session): Promise<ApiResult>;
  humanRoute(): ApiResult;
  clear(sessionId: string): ApiResult;
  ready(): Promise<Retriever>;
  readonly hasKey: boolean;
}

export function createThrapApi(
  config: ThrapConfig,
  buildRetriever: (embed: EmbeddingConfig) => Promise<Retriever>,
): ThrapApi {
  const hasKey = Boolean(config.apiKey);

  // Built once, lazily, and shared across requests.
  let retrieverPromise: Promise<Retriever> | null = null;
  const getRetriever = () => (retrieverPromise ??= buildRetriever(config.embed));

  return {
    hasKey,
    ready: getRetriever,
    humanRoute: () => escalation("crisis"),

    clear(sessionId) {
      clearSession(sessionId);
      return { status: 200, body: { ok: true } };
    },

    async navigate(input, session) {
      // Resolve the user-facing message (shortcut intents -> natural language)
      const userMessage = input.message?.trim() ||
        (input.intent ? INTENT_TO_MESSAGE[input.intent] ?? "I need some support." : "I need some support.");

      // Crisis detection - deterministic, never reaches the model
      const lc = userMessage.toLowerCase();
      if (CRISIS_SIGNALS.some((s) => lc.includes(s))) return escalation("crisis");

      session.turnCount++;

      if (session.turnCount > TURN_LIMIT) {
        return {
          status: 200,
          body: {
            kind: "turn_limit", message: "",
            humanRoute: HUMAN_ROUTE,
            turn: { used: session.turnCount, limit: TURN_LIMIT },
          },
        };
      }

      try {
        // Retrieval runs after the safety gate, so no message reaches the
        // knowledge layer or the provider until crisis routing is ruled out.
        const retriever = await getRetriever();
        const queryEmbedding = retriever.hasEmbeddings
          ? await embedQuery(config.embed, userMessage)
          : undefined;
        const results = retriever.retrieve(userMessage, queryEmbedding);

        let message: string;
        let citations: Citation[];

        if (hasKey) {
          const contextBlock = buildContextBlock(results);
          const systemInstruction = contextBlock
            ? `${THERAPY_SYSTEM_PROMPT}\n\n${contextBlock}`
            : THERAPY_SYSTEM_PROMPT;

          const rawReply = await callChatModel(
            config.apiKey, config.model, systemInstruction, session.history, userMessage,
          );

          const grounded = extractCitations(rawReply, results);
          message = grounded.message;
          citations = grounded.citations;
        } else {
          await new Promise((r) => setTimeout(r, 900 + Math.random() * 700));

          const grounded = groundedFallback(results);
          if (grounded) {
            message = grounded.message;
            citations = grounded.citations;
          } else {
            message = FALLBACK_RESPONSES[
              Math.min(session.fallbackIndex++, FALLBACK_RESPONSES.length - 1)
            ];
            citations = [];
          }
        }

        const bookingPrompt = message.includes(BOOKING_TOKEN);
        message = message.replace(BOOKING_TOKEN, "").trim();

        // Output guard: an unapproved placeholder must never reach a person.
        if (containsUnresolvedPlaceholder(message)) {
          console.warn("[Thrap] Output guard: unresolved placeholder in reply, escalating.");
          return escalation("output_guard");
        }

        recordExchange(session, userMessage, message);

        return {
          status: 200,
          body: {
            kind: "answer",
            message,
            citations,
            turn: { used: session.turnCount, limit: TURN_LIMIT },
            ...(bookingPrompt ? { bookingPrompt: true } : {}),
          },
        };
      } catch (err) {
        console.error("[Thrap] API error:", err instanceof Error ? err.message : err);
        // On provider failure -> escalate (fail-closed)
        return escalation("backend_failure");
      }
    },
  };
}

export { getSession, createSessionId } from "./session";
export { createRetriever };
