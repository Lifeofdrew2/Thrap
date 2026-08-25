import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { THERAPY_SYSTEM_PROMPT } from "./src/therapy-prompt";
import {
  buildContextBlock,
  containsUnresolvedPlaceholder,
  extractCitations,
} from "./src/rag/context";
import {
  DEFAULT_EMBEDDING_MODEL,
  embedTexts,
  type EmbeddingProvider,
} from "./src/rag/embeddings";
import { chunkDocument } from "./src/rag/markdown";
import { createRetriever, type Retriever } from "./src/rag/retrieve";
import type { Citation } from "./src/api/types";
import type { EmbeddedChunk, RagIndex, RetrievedChunk } from "./src/rag/types";

// --- Types -----------------------------------------------------------------

/** OpenAI chat message. History is stored in this shape. */
interface ChatMessage { role: "system" | "user" | "assistant"; content: string }

interface ChatResponse {
  choices?: { message: { content: string | null }; finish_reason?: string }[];
  error?: { message: string };
}

// --- Constants -------------------------------------------------------------

const DEFAULT_MODEL = "anthropic/claude-haiku-4.5";

/** OpenRouter speaks the OpenAI chat-completions dialect. */
const CHAT_BASE_URL = "https://openrouter.ai/api/v1";

/**
 * The embedding side is configured independently of the chat side, because the
 * two are not always available on the same key. Retrieval degrades to lexical
 * scoring when embedding is unavailable, so this only ever affects quality.
 */
interface EmbeddingConfig {
  provider: EmbeddingProvider;
  apiKey: string;
  model: string;
}

/** Identifies the index a cache was built with, so a provider swap invalidates it. */
const embeddingTag = (embed: EmbeddingConfig) =>
  embed.apiKey ? `${embed.provider}:${embed.model}` : null;

const HUMAN_ROUTE = {
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

// --- Knowledge index -------------------------------------------------------

/** Bump to invalidate every cached index after a chunking or format change. */
const INDEX_FORMAT_VERSION = 1;

const KNOWLEDGE_DIR = fileURLToPath(new URL("./knowledge", import.meta.url));
const INDEX_PATH = path.join(KNOWLEDGE_DIR, ".index.json");

/** Recursively collect the Markdown sources that make up the corpus. */
async function listKnowledgeFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listKnowledgeFiles(full)));
    else if (entry.name.endsWith(".md")) files.push(full);
  }

  return files.sort();
}

interface Corpus {
  chunks: EmbeddedChunk[];
  /** Hash of every source file, used to detect a stale cached index. */
  corpusHash: string;
  documentCount: number;
}

async function loadCorpus(): Promise<Corpus> {
  const files = await listKnowledgeFiles(KNOWLEDGE_DIR);
  const hash = createHash("sha256");
  const chunks: EmbeddedChunk[] = [];

  for (const file of files) {
    const raw = await readFile(file, "utf8");
    const relative = path.relative(KNOWLEDGE_DIR, file).split(path.sep).join("/");

    hash.update(relative);
    hash.update(raw);

    // Embeddings are attached later; lexical retrieval works without them.
    for (const chunk of chunkDocument(raw, relative).chunks) {
      chunks.push({ ...chunk, embedding: [] });
    }
  }

  return { chunks, corpusHash: hash.digest("hex"), documentCount: files.length };
}

async function readCachedIndex(corpus: Corpus, embeddingModel: string | null): Promise<EmbeddedChunk[] | null> {
  try {
    const cached = JSON.parse(await readFile(INDEX_PATH, "utf8")) as RagIndex;

    const usable =
      cached.formatVersion === INDEX_FORMAT_VERSION &&
      cached.corpusHash === corpus.corpusHash &&
      cached.embeddingModel === embeddingModel &&
      Array.isArray(cached.chunks) &&
      cached.chunks.length === corpus.chunks.length;

    return usable ? cached.chunks : null;
  } catch {
    // No cache yet, or an unreadable one. Rebuild.
    return null;
  }
}

/**
 * Build the retriever, embedding the corpus when a key is available and
 * caching the vectors on disk so a restart does not re-embed.
 *
 * Every failure degrades to lexical-only retrieval rather than disabling
 * retrieval: BM25 over the same corpus still grounds answers and citations.
 */
async function buildRetriever(embed: EmbeddingConfig): Promise<Retriever> {
  const corpus = await loadCorpus();
  const model = embeddingTag(embed);

  const cached = await readCachedIndex(corpus, model);
  if (cached) {
    console.info(
      `   [Thrap] Knowledge index loaded from cache ` +
      `(${corpus.documentCount} documents, ${cached.length} chunks${model ? `, ${model}` : ", lexical only"})`
    );
    return createRetriever(cached);
  }

  if (!embed.apiKey) {
    console.info(
      `   [Thrap] Knowledge index built lexically ` +
      `(${corpus.documentCount} documents, ${corpus.chunks.length} chunks; no embedding key, semantic search disabled)`
    );
    await persistIndex(corpus, null);
    return createRetriever(corpus.chunks);
  }

  try {
    const vectors = await embedTexts(
      corpus.chunks.map((chunk) => chunk.text),
      { provider: embed.provider, apiKey: embed.apiKey, model: embed.model, task: "RETRIEVAL_DOCUMENT" },
    );
    corpus.chunks.forEach((chunk, index) => { chunk.embedding = vectors[index]; });

    await persistIndex(corpus, model);
    console.info(
      `   [Thrap] Knowledge index embedded ` +
      `(${corpus.documentCount} documents, ${corpus.chunks.length} chunks, ${model})`
    );
    return createRetriever(corpus.chunks);
  } catch (error) {
    console.warn(
      `   [Thrap] Embedding failed (${error instanceof Error ? error.message : "unknown error"}). ` +
      `Falling back to lexical retrieval.`
    );
    for (const chunk of corpus.chunks) chunk.embedding = [];
    return createRetriever(corpus.chunks);
  }
}

async function persistIndex(corpus: Corpus, embeddingModel: string | null): Promise<void> {
  const index: RagIndex = {
    formatVersion: INDEX_FORMAT_VERSION,
    embeddingModel,
    corpusHash: corpus.corpusHash,
    chunks: corpus.chunks,
  };

  try {
    await writeFile(INDEX_PATH, JSON.stringify(index), "utf8");
  } catch (error) {
    // A non-writable cache is not fatal; it only costs a rebuild next start.
    console.warn(`   [Thrap] Could not cache knowledge index: ${error instanceof Error ? error.message : error}`);
  }
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
 * Deterministic grounded reply for the no-key fallback.
 *
 * Returns approved corpus text verbatim rather than composing anything, and
 * skips paragraphs holding unresolved placeholders so no unapproved value is
 * shown to a person.
 */
function groundedFallback(results: RetrievedChunk[]): { message: string; citations: Citation[] } | null {
  const top = results[0];
  if (!top || top.score < 0.5) return null;

  // The first paragraph is the section heading added at chunking time.
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

// --- Chat provider call ----------------------------------------------------

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
        // OpenRouter attribution. Local-only values: nothing is published, and
        // no conversation content is ever placed in a header.
        "HTTP-Referer": "http://localhost:5180",
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
    if (failed) {
      throw new Error(data.error?.message ?? `Chat API error ${res.status}`);
    }
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

// --- Fallback deterministic responses (used when no API key is set) --------

const FALLBACK_RESPONSES = [
  "Thank you for reaching out - that takes courage. I'm here and I have time. Can you tell me a bit more about what's been going on? What made you decide to reach out today?",
  "It sounds like this has been weighing on you. How long have things been feeling this way, and would you say it's been getting worse or staying about the same?",
  "I want to make sure I understand the full picture. How is this showing up day-to-day - things like sleep, work, concentration, or your relationships with people around you?",
  "Thank you for being so open with me. Do you have people around you - friends, family - who know what you're going through? Or has this mostly been something you've been carrying on your own?",
  "What you've shared today sounds significant, and you deserve proper, consistent support. I'd really like to help you book a session with a licensed counsellor who can work through this with you properly. Would you like to do that?",
  "I'm glad you're still here. Take as much time as you need - there's no rush. What else would you like to talk through?",
];

// --- Session state ---------------------------------------------------------

interface Session {
  history: ChatMessage[];
  turnCount: number;
  fallbackIndex: number;
}

const session: Session = { history: [], turnCount: 0, fallbackIndex: 0 };

function resetSession() {
  session.history = [];
  session.turnCount = 0;
  session.fallbackIndex = 0;
}

function recordExchange(userMessage: string, modelReply: string) {
  session.history.push(
    { role: "user",      content: userMessage },
    { role: "assistant", content: modelReply },
  );
  // Keep last 20 turns in context (40 entries) to avoid token runaway
  if (session.history.length > 40) session.history = session.history.slice(-40);
}

// --- Vite plugin -----------------------------------------------------------

function therapyApiPlugin(apiKey: string, model: string, embed: EmbeddingConfig): Plugin {
  const hasKey = Boolean(apiKey);

  if (!hasKey) {
    console.warn(
      "\n[!] [Thrap] No OPENROUTER_API_KEY found in .env.local - " +
      "running with deterministic fallback responses.\n" +
      "   Copy .env.example to .env.local and add your key to enable the real AI.\n"
    );
  } else {
    console.info(`\n[ok] [Thrap] OpenRouter connected (model: ${model})\n`);
  }

  // Built once, lazily, and shared across requests.
  let retrieverPromise: Promise<Retriever> | null = null;
  const getRetriever = () => (retrieverPromise ??= buildRetriever(embed));

  return {
    name: "therapy-api",
    configureServer(server) {
      // Warm the index at startup so the first message is not slowed by it.
      void getRetriever().catch(() => undefined);

      server.middlewares.use(async (req, res, next) => {
        if (req.method !== "POST" || !req.url) { next(); return; }

        const json = (payload: unknown) => {
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          res.end(JSON.stringify(payload));
        };

        const escalate = (reasonCode: string) =>
          json({ kind: "escalation", message: "", reasonCode, humanRoute: HUMAN_ROUTE });

        // -- Session clear --------------------------------------------------
        if (req.url === "/api/session/clear") {
          resetSession();
          json({ ok: true });
          return;
        }

        // -- Human route ----------------------------------------------------
        if (req.url === "/api/human-route") {
          escalate("crisis");
          return;
        }

        // -- Navigate -------------------------------------------------------
        if (req.url === "/api/navigate") {
          // Read body
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const body = JSON.parse(Buffer.concat(chunks).toString()) as {
            message?: string;
            intent?: string;
          };

          // Resolve the user-facing message (shortcut intents -> natural language)
          const userMessage = body.message?.trim() ||
            (body.intent ? INTENT_TO_MESSAGE[body.intent] ?? "I need some support." : "I need some support.");

          // Crisis detection - deterministic, never reaches the model
          const lc = userMessage.toLowerCase();
          if (CRISIS_SIGNALS.some((s) => lc.includes(s))) {
            escalate("crisis");
            return;
          }

          session.turnCount++;

          // Turn limit
          if (session.turnCount > TURN_LIMIT) {
            json({
              kind: "turn_limit", message: "",
              humanRoute: HUMAN_ROUTE,
              turn: { used: session.turnCount, limit: TURN_LIMIT },
            });
            return;
          }

          try {
            // -- Retrieval ---------------------------------------------------
            // Runs after the safety gate, so no message reaches the knowledge
            // layer or the provider until crisis routing has been ruled out.
            const retriever = await getRetriever();
            const queryEmbedding = retriever.hasEmbeddings
              ? await embedQuery(embed, userMessage)
              : undefined;
            const results = retriever.retrieve(userMessage, queryEmbedding);

            let message: string;
            let citations: Citation[];

            if (hasKey) {
              // -- Retrieval-augmented model response ------------------------
              const contextBlock = buildContextBlock(results);
              const systemInstruction = contextBlock
                ? `${THERAPY_SYSTEM_PROMPT}\n\n${contextBlock}`
                : THERAPY_SYSTEM_PROMPT;

              const rawReply = await callChatModel(
                apiKey, model, systemInstruction, session.history, userMessage,
              );

              const grounded = extractCitations(rawReply, results);
              message = grounded.message;
              citations = grounded.citations;
            } else {
              // -- Deterministic fallback ------------------------------------
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

            // Extract booking signal
            const bookingPrompt = message.includes(BOOKING_TOKEN);
            message = message.replace(BOOKING_TOKEN, "").trim();

            // Output guard: an unapproved placeholder must never reach a person.
            if (containsUnresolvedPlaceholder(message)) {
              console.warn("[Thrap] Output guard: unresolved placeholder in reply, escalating.");
              escalate("output_guard");
              return;
            }

            // Record exchange in history
            recordExchange(userMessage, message);

            json({
              kind: "answer",
              message,
              citations,
              turn: { used: session.turnCount, limit: TURN_LIMIT },
              ...(bookingPrompt ? { bookingPrompt: true } : {}),
            });

          } catch (err) {
            console.error("[Thrap] API error:", err);
            // On API failure -> escalate (fail-closed)
            escalate("backend_failure");
          }

          return;
        }

        next();
      });
    },
  };
}

// --- Export ----------------------------------------------------------------

export default defineConfig(({ mode }) => {
  // loadEnv loads .env, .env.local, .env.[mode], .env.[mode].local
  // The empty string prefix means ALL variables are loaded (not just VITE_*)
  const env = loadEnv(mode, process.cwd(), "");
  const apiKey = env.OPENROUTER_API_KEY ?? "";
  const model  = env.OPENROUTER_MODEL   ?? DEFAULT_MODEL;

  // Embedding defaults to the chat provider but can be pointed elsewhere, so a
  // key that serves chat while refusing embeddings does not cost us semantic
  // retrieval. Only the key for the selected provider is read.
  const embeddingProvider = (env.EMBEDDING_PROVIDER as EmbeddingProvider) || "openrouter";
  const embeddingKey: Record<EmbeddingProvider, string> = {
    openrouter: apiKey,
    openai: env.OPENAI_API_KEY ?? "",
    gemini: env.GEMINI_API_KEY ?? "",
  };
  const embed: EmbeddingConfig = {
    provider: embeddingProvider,
    apiKey: embeddingKey[embeddingProvider] ?? "",
    model: env.EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL[embeddingProvider],
  };

  return {
    plugins: [react(), therapyApiPlugin(apiKey, model, embed)],
    server: {
      // Bound to the loopback interface only: this service handles sensitive
      // wellbeing conversations and must not be exposed on the local network.
      // Bound by IPv4 address rather than the name "localhost": on Windows
      // that name resolves to ::1 first, which would leave 127.0.0.1 and
      // thrap.localhost pointing at whatever else holds the IPv4 port.
      host: "127.0.0.1",
      port: 5180,
      // Fail loudly rather than silently moving to another port, so the URL
      // people bookmark keeps working.
      strictPort: true,
      // Browsers resolve any *.localhost name to loopback without a hosts
      // entry, so thrap.localhost works once Vite accepts the Host header.
      allowedHosts: ["localhost", "thrap.localhost"],
    },
  };
});
