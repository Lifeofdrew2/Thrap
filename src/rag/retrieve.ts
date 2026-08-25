import { cosineSimilarity } from "./embeddings";
import { buildLexicalIndex, type LexicalIndex } from "./lexical";
import type { Chunk, EmbeddedChunk, RetrievedChunk } from "./types";

export interface RetrieverOptions {
  /** Minimum combined score for a chunk to be offered to the model. */
  minScore?: number;
  /** Maximum chunks returned in total. */
  topK?: number;
  /** Maximum chunks from any single document, so one file cannot fill the context. */
  maxPerDocument?: number;
  /** Weight of the semantic half of the hybrid. The rest goes to lexical. */
  semanticWeight?: number;
}

const DEFAULTS = {
  minScore: 0.32,
  topK: 4,
  maxPerDocument: 2,
  semanticWeight: 0.65,
} satisfies Required<RetrieverOptions>;

/**
 * Cosine calibration bounds for `text-embedding-004`. Unrelated passages sit
 * near the floor and genuinely on-topic ones near the ceiling, so rescaling
 * between them turns a poorly-spread raw cosine into a usable 0..1 score.
 */
const COSINE_FLOOR = 0.35;
const COSINE_CEILING = 0.85;

/**
 * Saturation constant mapping an unbounded BM25 score to 0..1, chosen so that
 * two or three solid term matches land near 0.5 and a single incidental common
 * word stays below `minScore`. Saturating rather than normalising by the best
 * score in the set is what lets an entirely off-topic query return nothing.
 */
const BM25_SATURATION = 3;

/**
 * Floor of the term-coverage multiplier.
 *
 * BM25 alone rewards a single rare term very highly, which let "will my
 * employer find out" match a low-mood passage on the lone word "used".
 * Scaling by how much of the query a chunk actually covers suppresses that
 * without discarding the idf weighting that makes rare terms useful.
 */
const COVERAGE_FLOOR = 0.4;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export interface Retriever {
  /** True when semantic scoring is available; false in lexical-only mode. */
  readonly hasEmbeddings: boolean;
  readonly size: number;
  retrieve(query: string, queryEmbedding?: number[]): RetrievedChunk[];
}

export function createRetriever(
  chunks: (Chunk | EmbeddedChunk)[],
  options: RetrieverOptions = {},
): Retriever {
  const settings = { ...DEFAULTS, ...options };
  const lexical: LexicalIndex = buildLexicalIndex(chunks);

  const embeddings = new Map<string, number[]>();
  for (const chunk of chunks) {
    const embedding = (chunk as EmbeddedChunk).embedding;
    if (Array.isArray(embedding) && embedding.length > 0) embeddings.set(chunk.id, embedding);
  }

  const hasEmbeddings = embeddings.size > 0;

  return {
    hasEmbeddings,
    size: chunks.length,

    retrieve(query, queryEmbedding) {
      if (!query.trim() || chunks.length === 0) return [];

      const lexicalScores = lexical.score(query);
      const useSemantic = hasEmbeddings && Array.isArray(queryEmbedding) && queryEmbedding.length > 0;

      const scored: RetrievedChunk[] = chunks.map((chunk) => {
        const hit = lexicalScores.get(chunk.id);
        const saturated = hit ? hit.score / (hit.score + BM25_SATURATION) : 0;
        const coverage = hit
          ? COVERAGE_FLOOR + (1 - COVERAGE_FLOOR) * hit.coverage
          : 0;
        const lexicalScore = saturated * coverage;

        let semanticScore = 0;
        if (useSemantic) {
          const embedding = embeddings.get(chunk.id);
          if (embedding) {
            const cosine = cosineSimilarity(queryEmbedding!, embedding);
            semanticScore = clamp01((cosine - COSINE_FLOOR) / (COSINE_CEILING - COSINE_FLOOR));
          }
        }

        const score = useSemantic
          ? settings.semanticWeight * semanticScore + (1 - settings.semanticWeight) * lexicalScore
          : lexicalScore;

        return { chunk, score, lexicalScore, semanticScore };
      });

      const ranked = scored
        .filter((result) => result.score >= settings.minScore)
        .sort((a, b) => b.score - a.score);

      const selected: RetrievedChunk[] = [];
      const perDocument = new Map<string, number>();

      for (const result of ranked) {
        if (selected.length >= settings.topK) break;

        const used = perDocument.get(result.chunk.documentId) ?? 0;
        if (used >= settings.maxPerDocument) continue;

        perDocument.set(result.chunk.documentId, used + 1);
        selected.push(result);
      }

      return selected;
    },
  };
}
