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
import type { Citation, ConversationLanguage, NavigationInput, Region } from "../api/types";
import { z } from "zod";
import { THERAPY_SYSTEM_PROMPT } from "../therapy-prompt";
import {
  clearSession,
  getSession,
  recordExchange,
  MAX_HISTORY_ENTRIES,
  type ChatMessage,
  type Session,
} from "./session";
import {
  appendMessage,
  createUser,
  EmailAlreadyRegisteredError,
  getUserById,
  loadHistory,
  verifyCredentials,
} from "./db";

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
  "take my own life", "ending it", "no reason to live", "can't go on",
  "i wan die", "i want die", "make i die", "i no wan live", "i no want live",
  "life no worth am", "life no get meaning", "i don tire for life",
  "everything don finish", "i go kill myself", "i fit kill myself",
];

const UNSAFE_OUTPUT_SIGNALS = [
  /\bhow to (kill|hurt) yourself\b/i,
  /\bmethods? (for|of) suicide\b/i,
  /\bgo ahead and (kill|hurt) yourself\b/i,
  /\byou should (die|kill yourself)\b/i,
  /\bdo it[,!] you have nothing to lose\b/i,
];

const INTENT_TO_MESSAGE: Record<string, string> = {
  TALK_THROUGH:     "I need to talk to someone. There's something on my mind.",
  ANXIETY:          "I've been feeling really anxious lately.",
  LOW_MOOD:         "I've been feeling low and down.",
  BURNOUT:          "I'm experiencing burnout and work stress.",
  SLEEP:            "I've been having a lot of trouble sleeping.",
  BOOK_COUNSELLOR:  "I'd like to book a session with a counsellor.",
  GRIEF:            "I've experienced a loss and would like to talk about it.",
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

const PIDGIN_FALLBACK_RESPONSES = [
  "Thank you say you reach out. I dey here with you. Wetin make you decide to talk today?",
  "E sound like this matter don dey weigh you down. How long e don dey like this, and e dey get worse or e stay the same?",
  "I wan understand how this matter dey affect your everyday life. How your sleep, work, concentration, or people around you dey go?",
  "Wetin you share matter. You get person wey you trust wey know wetin you dey face, or you dey carry am alone?",
];

function promptLanguage(region: Region = "NG", language: ConversationLanguage = "eng", languageName = "English"): string {
  if (language === "pcm" && region === "NG") {
    return "The user prefers Nigerian Pidgin. Every sentence of your reply must be in clear, compassionate Nigerian Pidgin, not standard English. Use natural wording like 'I dey hear you', 'wetin dey happen', and 'you no need carry am alone' when appropriate. Do not parody, exaggerate, or force slang; preserve the user's dignity and keep safety instructions unmistakably clear.";
  }
  if (region === "NG" && language === "eng") {
    return "The user prefers Nigerian English. Reply in clear, warm Nigerian workplace English with natural local phrasing where appropriate. Do not imitate or exaggerate errors, and keep safety instructions unmistakably clear.";
  }
  return `Selected language: ${languageName} (${language}). This is the ONLY language you may write in. Do not answer in English and do not answer in Nigerian Pidgin, even though the shortcut prompts or app scaffolding you see may be written in English - that English text describes a topic, it is not a request to reply in English. Switch away from ${languageName} only if the user's own latest typed message is itself written in a different language than ${languageName}; in that case, and only that case, reply in the language they just used. Preserve names, numbers, dates, technical terms, proper nouns, safety wording, and approved service names accurately. Use natural native phrasing, not literal translation, and keep safety instructions unmistakably clear. Before answering, silently check: is every sentence I am about to write actually in ${languageName}? If not, rewrite it so that it is.`;
}

/**
 * A short reminder appended to the outgoing user turn only (never stored or
 * displayed). Models weight the most recent text more heavily than an
 * earlier system instruction, and a shortcut's English topic label in the
 * visible "user" turn (e.g. "I'm experiencing burnout and work stress.") can
 * otherwise pull a reply back into English even with a system-level
 * language policy already in place.
 */
function languageReminder(region: Region = "NG", language: ConversationLanguage = "eng", languageName = "English"): string {
  if (language === "pcm" && region === "NG") return "(Reply in Nigerian Pidgin.)";
  if (region === "NG" && language === "eng") return "(Reply in Nigerian English.)";
  return `(Reply only in ${languageName}. Not English, not Pidgin, unless this exact message is itself written in another language.)`;
}

function containsUnsafeOutput(message: string): boolean {
  return UNSAFE_OUTPUT_SIGNALS.some((signal) => signal.test(message));
}

/**
 * Rebuilds the copy object shape from `source` (the English original),
 * taking each leaf from `translated` when it is present and looks like a
 * real translation, and falling back to the English original leaf-by-leaf
 * otherwise.
 *
 * A single dropped or malformed key from the model must not throw away an
 * otherwise-good translation of the other ~90 keys: that all-or-nothing
 * behaviour was the main reason language selection felt unreliable - a
 * translation that was 95% complete was being discarded entirely instead of
 * shown as a translation with one or two English leftovers.
 */
function mergeTranslatedShape(source: unknown, translated: unknown): unknown {
  if (typeof source === "string") {
    return typeof translated === "string" && translated.trim().length > 0 ? translated : source;
  }
  if (source && typeof source === "object" && !Array.isArray(source)) {
    const sourceRecord = source as Record<string, unknown>;
    const translatedRecord = translated && typeof translated === "object" && !Array.isArray(translated)
      ? (translated as Record<string, unknown>)
      : {};
    const merged: Record<string, unknown> = {};
    for (const key of Object.keys(sourceRecord)) {
      merged[key] = mergeTranslatedShape(sourceRecord[key], translatedRecord[key]);
    }
    return merged;
  }
  return source;
}

function parseModelJson(raw: string): unknown {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(cleaned);
}

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
  maxTokens = 800,
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
    max_tokens: maxTokens,
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

const uiTranslationInputSchema = z.object({
  languageCode: z.string().min(2).max(20),
  languageName: z.string().min(1).max(100),
  copy: z.record(z.unknown()),
});

const navigationInputSchema = z.object({
  message: z.string().optional(),
  intent: z.string().optional(),
  region: z.string().min(2).optional(),
  language: z.string().min(2).optional(),
  languageName: z.string().min(1).optional(),
});

export function parseNavigationInput(input: Record<string, unknown>): NavigationInput | null {
  const parsed = navigationInputSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}

const authInputSchema = z.object({
  email: z.string().trim().min(3).max(200).email(),
  password: z.string().min(8).max(200),
});

export function parseAuthInput(input: Record<string, unknown>): { email: string; password: string } | null {
  const parsed = authInputSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}

const escalation = (reasonCode: string): ApiResult => ({
  status: 200,
  body: { kind: "escalation", message: "", reasonCode, humanRoute: HUMAN_ROUTE },
});

export type AuthResult = { status: number; body: unknown; userId?: string };

export interface ThrapApi {
  navigate(input: NavigationInput, session: Session): Promise<ApiResult>;
  translateUi(input: { languageCode: string; languageName: string; copy: Record<string, unknown> }): Promise<ApiResult>;
  humanRoute(): ApiResult;
  clear(sessionId: string): ApiResult;
  signup(email: string, password: string): AuthResult;
  login(email: string, password: string): AuthResult;
  me(userId: string | null): ApiResult;
  history(userId: string | null): ApiResult;
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
  const translatedUiCopy = new Map<string, Record<string, unknown>>();
  const getRetriever = () => (retrieverPromise ??= buildRetriever(config.embed));

  return {
    hasKey,
    ready: getRetriever,
    humanRoute: () => escalation("crisis"),

    async translateUi(input) {
      if (!hasKey) return { status: 503, body: { error: "translation_unavailable" } };

      const parsed = uiTranslationInputSchema.safeParse(input);
      if (!parsed.success) return { status: 400, body: { error: "invalid_request" } };
      const cacheKey = `${parsed.data.languageCode}:${parsed.data.languageName}`;
      const cached = translatedUiCopy.get(cacheKey);
      if (cached) return { status: 200, body: { copy: cached } };

      // Automatic translation on language choice only feels reliable if an
      // occasional malformed model response doesn't sink the whole request:
      // retry once before giving up, on top of the leaf-level merge below.
      const TRANSLATE_ATTEMPTS = 2;
      let lastError: unknown;

      for (let attempt = 0; attempt < TRANSLATE_ATTEMPTS; attempt++) {
        try {
          const raw = await callChatModel(
            config.apiKey,
            config.model,
            `Translate the supplied Thrap interface copy into ${parsed.data.languageName} (ISO 639-3 code: ${parsed.data.languageCode}). For Ibo specifically, use standard modern Ibo (Asusu Ibo), not Yoruba, Hausa, Nigerian Pidgin, or English. Return JSON only - no markdown code fences, no commentary before or after it - preserving exactly the same keys and nested structure as the input. Translate every user-facing string naturally and completely; do not skip, merge, or omit any key. Do not translate proper nouns such as Thrap, preserve placeholders, and do not add or remove keys. This is interface copy for a mental health service, so keep privacy, consent, crisis, and safety wording accurate and respectful.`,
            [],
            JSON.stringify(parsed.data.copy),
            8000,
          );
          const translated = parseModelJson(raw);
          const merged = mergeTranslatedShape(parsed.data.copy, translated) as Record<string, unknown>;
          translatedUiCopy.set(cacheKey, merged);
          return { status: 200, body: { copy: merged } };
        } catch (error) {
          lastError = error;
        }
      }

      console.error("[Thrap] UI translation failed:", lastError instanceof Error ? lastError.message : lastError);
      return { status: 502, body: { error: "translation_failure" } };
    },

    clear(sessionId) {
      clearSession(sessionId);
      return { status: 200, body: { ok: true } };
    },

    signup(email, password) {
      try {
        const user = createUser(email, password);
        return { status: 200, body: { ok: true, email: user.email }, userId: user.id };
      } catch (error) {
        if (error instanceof EmailAlreadyRegisteredError) {
          return { status: 409, body: { error: "email_already_registered" } };
        }
        console.error("[Thrap] Signup failed:", error instanceof Error ? error.message : error);
        return { status: 500, body: { error: "signup_failed" } };
      }
    },

    login(email, password) {
      const user = verifyCredentials(email, password);
      if (!user) return { status: 401, body: { error: "invalid_credentials" } };
      return { status: 200, body: { ok: true, email: user.email }, userId: user.id };
    },

    me(userId) {
      const user = userId ? getUserById(userId) : null;
      return { status: 200, body: { user: user ? { email: user.email } : null } };
    },

    history(userId) {
      if (!userId) return { status: 200, body: { messages: [] } };
      const messages = loadHistory(userId, MAX_HISTORY_ENTRIES);
      return { status: 200, body: { messages } };
    },

    async navigate(input, session) {
      // Resolve the user-facing message (shortcut intents -> natural language)
      const userMessage = input.message?.trim() ||
        (input.intent ? INTENT_TO_MESSAGE[input.intent] ?? "I need some support." : "I need some support.");

      // Crisis detection - deterministic, never reaches the model
      const lc = userMessage.toLowerCase();
      if (CRISIS_SIGNALS.some((s) => lc.includes(s))) return escalation("crisis");

      session.turnCount++;

      // Seed an identified account's in-memory history from its stored
      // conversation once per session, so the model has continuity across a
      // refresh or a new device without re-reading the database every turn.
      if (session.userId && !session.historyHydrated) {
        const stored = loadHistory(session.userId, MAX_HISTORY_ENTRIES);
        session.history = stored.map((entry) => ({ role: entry.role, content: entry.content }));
        session.historyHydrated = true;
      }

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
            ? `${THERAPY_SYSTEM_PROMPT}\n\n${promptLanguage(input.region, input.language, input.languageName)}\n\n${contextBlock}`
            : `${THERAPY_SYSTEM_PROMPT}\n\n${promptLanguage(input.region, input.language, input.languageName)}`;

          const rawReply = await callChatModel(
            config.apiKey, config.model, systemInstruction, session.history,
            `${userMessage}\n\n${languageReminder(input.region, input.language, input.languageName)}`,
          );

          const grounded = extractCitations(rawReply, results);
          message = grounded.message;
          citations = grounded.citations;
        } else {
          await new Promise((r) => setTimeout(r, 900 + Math.random() * 700));

          const grounded = input.language === "eng" ? groundedFallback(results) : null;
          if (grounded) {
            message = grounded.message;
            citations = grounded.citations;
          } else if (input.language === "pcm" && input.region === "NG") {
            message = PIDGIN_FALLBACK_RESPONSES[
              Math.min(session.fallbackIndex++, PIDGIN_FALLBACK_RESPONSES.length - 1)
            ];
            citations = [];
          } else if (input.language === "eng") {
            message = FALLBACK_RESPONSES[
              Math.min(session.fallbackIndex++, FALLBACK_RESPONSES.length - 1)
            ];
            citations = [];
          } else {
            return escalation("backend_failure");
          }
        }

        const bookingPrompt = message.includes(BOOKING_TOKEN);
        message = message.replace(BOOKING_TOKEN, "").trim();

        // Output guard: an unapproved placeholder must never reach a person.
        if (containsUnresolvedPlaceholder(message) || containsUnsafeOutput(message)) {
          console.warn("[Thrap] Output guard: unsafe or unresolved reply, escalating.");
          return escalation("output_guard");
        }

        recordExchange(session, userMessage, message);
        if (session.userId) {
          appendMessage(session.userId, "user", userMessage);
          appendMessage(session.userId, "assistant", message);
        }

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

export { getSession, createSessionId, attachUser } from "./session";
export { createRetriever };
