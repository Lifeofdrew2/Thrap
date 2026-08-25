import type { Chunk } from "./types";

/**
 * BM25 lexical scoring.
 *
 * This is the half of the hybrid that survives without an API key: it keeps
 * retrieval (and therefore citations) working in the deterministic fallback
 * mode the dev server already uses when GEMINI_API_KEY is absent.
 */

const STOPWORDS = new Set([
  "a", "about", "am", "an", "and", "any", "are", "as", "at", "be", "been", "being",
  "but", "by", "can", "do", "does", "doing", "for", "from", "get", "got", "had",
  "has", "have", "how", "i", "if", "in", "into", "is", "it", "its", "just", "me",
  "my", "of", "on", "or", "so", "some", "than", "that", "the", "their", "them",
  "then", "there", "these", "they", "this", "those", "to", "up", "was", "we",
  "were", "what", "when", "where", "which", "who", "why", "will", "with", "you",
  "your",
]);

/**
 * Lowercase, split on non-letters, drop stopwords, and apply a conservative
 * suffix trim so "sleeping"/"sleeps" reach the same stem as "sleep".
 */
export function tokenize(text: string): string[] {
  const tokens: string[] = [];

  for (const raw of text.toLowerCase().split(/[^a-z0-9]+/)) {
    if (raw.length < 2 || STOPWORDS.has(raw)) continue;
    tokens.push(stem(raw));
  }

  return tokens;
}

function stem(word: string): string {
  if (word.length > 5 && word.endsWith("ing")) return word.slice(0, -3);
  if (word.length > 5 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && word.endsWith("ed")) return word.slice(0, -2);
  if (word.length > 4 && word.endsWith("es")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

const K1 = 1.5;
const B = 0.75;

export interface LexicalHit {
  /** Raw, unbounded BM25 score. */
  score: number;
  /**
   * Share of the query's *information* found in the chunk, 0..1: matched query
   * idf over total query idf. Weighting by idf rather than counting terms means
   * missing a low-information word like "cannot" costs far less than missing
   * the topic word, which keeps conversational phrasing usable.
   */
  coverage: number;
}

export interface LexicalIndex {
  score(query: string): Map<string, LexicalHit>;
}

/** Build a BM25 index over the chunk corpus. */
export function buildLexicalIndex(chunks: Chunk[]): LexicalIndex {
  const documents = chunks.map((chunk) => {
    const terms = tokenize(chunk.text);
    const frequencies = new Map<string, number>();
    for (const term of terms) frequencies.set(term, (frequencies.get(term) ?? 0) + 1);
    return { id: chunk.id, length: terms.length, frequencies };
  });

  const documentFrequency = new Map<string, number>();
  for (const document of documents) {
    for (const term of document.frequencies.keys()) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    }
  }

  const total = documents.length;
  const averageLength =
    total === 0 ? 0 : documents.reduce((sum, document) => sum + document.length, 0) / total;

  return {
    score(query) {
      const hits = new Map<string, LexicalHit>();
      if (total === 0 || averageLength === 0) return hits;

      const queryTerms = new Set(tokenize(query));
      if (queryTerms.size === 0) return hits;

      // Precompute idf per query term. Terms absent from the corpus entirely
      // are excluded: no chunk can match them, so charging every chunk for
      // them would only shift the threshold, never the ranking.
      const queryIdf = new Map<string, number>();
      let totalIdf = 0;

      for (const term of queryTerms) {
        const seenIn = documentFrequency.get(term) ?? 0;
        if (seenIn === 0) continue;

        // BM25 with the +1 smoothing that keeps idf non-negative for terms
        // appearing in most documents.
        const idf = Math.log(1 + (total - seenIn + 0.5) / (seenIn + 0.5));
        queryIdf.set(term, idf);
        totalIdf += idf;
      }

      if (totalIdf === 0) return hits;

      for (const document of documents) {
        let score = 0;
        let matchedIdf = 0;

        for (const [term, idf] of queryIdf) {
          const frequency = document.frequencies.get(term);
          if (!frequency) continue;

          matchedIdf += idf;
          const denominator =
            frequency + K1 * (1 - B + (B * document.length) / averageLength);

          score += idf * ((frequency * (K1 + 1)) / denominator);
        }

        if (score > 0) hits.set(document.id, { score, coverage: matchedIdf / totalIdf });
      }

      return hits;
    },
  };
}
