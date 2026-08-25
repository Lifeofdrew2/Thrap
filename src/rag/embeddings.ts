/**
 * Embedding client.
 *
 * Two providers are supported so that the embedding side can be pointed at a
 * key that works independently of the chat side. That is not hypothetical
 * flexibility: an OpenAI key without credits still serves some chat models
 * while refusing every embedding request, and retrieval should not be held
 * hostage to that.
 */

export type EmbeddingProvider = "openrouter" | "openai" | "gemini";

export const DEFAULT_EMBEDDING_MODEL: Record<EmbeddingProvider, string> = {
  openrouter: "openai/text-embedding-3-small",
  openai: "text-embedding-3-small",
  gemini: "gemini-embedding-001",
};

/** OpenRouter is OpenAI-compatible, so the two share a request and response shape. */
const OPENAI_COMPATIBLE_BASE: Record<string, string> = {
  openrouter: "https://openrouter.ai/api/v1",
  openai: "https://api.openai.com/v1",
};

/**
 * Dimensions to request. Both providers support Matryoshka truncation, so a
 * shortened vector stays meaningful, and cosine similarity normalises away the
 * magnitude change truncation introduces. 768 keeps the cached index small
 * without measurable retrieval loss on a corpus this size.
 */
export const DEFAULT_EMBEDDING_DIMENSIONS = 768;

/**
 * Gemini distinguishes document and query embeddings, and using the matching
 * task type on each side measurably improves retrieval. OpenAI has no
 * equivalent, so the value is ignored there.
 */
export type EmbeddingTask = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

/** Items per call. Small batches keep a retry cheap and stay inside free-tier metering. */
const MAX_BATCH = 25;

/** Retry budget per batch for rate limiting and transient upstream errors. */
const MAX_ATTEMPTS = 4;

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Providers state the wait they want; honouring it beats guessing. */
function retryDelayMs(message: string | undefined, attempt: number): number {
  const match = message ? /retry in ([\d.]+)s/i.exec(message) : null;
  if (match) return Math.ceil(Number.parseFloat(match[1]) * 1000) + 500;
  return 2 ** attempt * 1000;
}

export interface EmbedOptions {
  provider: EmbeddingProvider;
  apiKey: string;
  model?: string;
  task: EmbeddingTask;
  dimensions?: number;
  /** Injectable for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

interface ProviderRequest {
  url: string;
  headers: Record<string, string>;
  body: string;
}

interface OpenAiResponse {
  data?: { embedding: number[]; index: number }[];
  error?: { message: string };
}

interface GeminiResponse {
  embeddings?: { values: number[] }[];
  error?: { message: string; code: number };
}

function buildRequest(batch: string[], options: EmbedOptions): ProviderRequest {
  const model = options.model ?? DEFAULT_EMBEDDING_MODEL[options.provider];
  const dimensions = options.dimensions ?? DEFAULT_EMBEDDING_DIMENSIONS;

  const base = OPENAI_COMPATIBLE_BASE[options.provider];
  if (base) {
    return {
      url: `${base}/embeddings`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify({ model, input: batch, dimensions }),
    };
  }

  return {
    url:
      `https://generativelanguage.googleapis.com/v1beta/models/${model}` +
      `:batchEmbedContents?key=${options.apiKey}`,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: batch.map((text) => ({
        model: `models/${model}`,
        content: { parts: [{ text }] },
        taskType: options.task,
        outputDimensionality: dimensions,
      })),
    }),
  };
}

/** Pull vectors out of a provider response, in input order. */
function readVectors(payload: unknown, provider: EmbeddingProvider, expected: number): number[][] {
  if (OPENAI_COMPATIBLE_BASE[provider]) {
    const data = (payload as OpenAiResponse).data;
    if (!data || data.length !== expected) {
      throw new Error("Embedding API returned an unexpected number of vectors");
    }
    // `index` is authoritative; the array order is not guaranteed.
    return [...data].sort((a, b) => a.index - b.index).map((item) => item.embedding);
  }

  const embeddings = (payload as GeminiResponse).embeddings;
  if (!embeddings || embeddings.length !== expected) {
    throw new Error("Embedding API returned an unexpected number of vectors");
  }
  return embeddings.map((embedding) => embedding.values);
}

/** Embed a batch of texts, preserving input order. */
export async function embedTexts(texts: string[], options: EmbedOptions): Promise<number[][]> {
  if (texts.length === 0) return [];

  const doFetch = options.fetchImpl ?? fetch;
  const results: number[][] = [];

  for (let offset = 0; offset < texts.length; offset += MAX_BATCH) {
    const batch = texts.slice(offset, offset + MAX_BATCH);
    const request = buildRequest(batch, options);

    for (let attempt = 0; ; attempt++) {
      const response = await doFetch(request.url, {
        method: "POST",
        headers: request.headers,
        signal: options.signal,
        body: request.body,
      });

      const payload = (await response.json()) as OpenAiResponse & GeminiResponse;
      const failed = !response.ok || Boolean(payload.error);

      if (failed && RETRYABLE_STATUS.has(response.status) && attempt < MAX_ATTEMPTS - 1) {
        await sleep(retryDelayMs(payload.error?.message, attempt));
        continue;
      }
      if (failed) {
        throw new Error(payload.error?.message ?? `Embedding API error ${response.status}`);
      }

      results.push(...readVectors(payload, options.provider, batch.length));
      break;
    }
  }

  return results;
}

/** Cosine similarity. Returns 0 for mismatched or zero-length vectors. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
