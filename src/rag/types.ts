/** Core types for the Thrap retrieval layer. */

/** Front-matter metadata carried by every knowledge document. */
export interface DocumentMeta {
  id: string;
  title: string;
  version: string;
  category: string;
  /** Repository-relative source path, kept for provenance and staleness checks. */
  path: string;
}

/** A retrievable unit: one section (or section slice) of one document. */
export interface Chunk {
  /** Stable id: `${documentId}#${sectionSlug}` plus a part suffix when split. */
  id: string;
  documentId: string;
  documentTitle: string;
  version: string;
  category: string;
  /** The `##` heading this chunk came from. */
  section: string;
  text: string;
}

export interface EmbeddedChunk extends Chunk {
  embedding: number[];
}

/** The on-disk index artifact. */
export interface RagIndex {
  /** Index format version — bump to invalidate every cached index. */
  formatVersion: number;
  /** Embedding model used, or `null` when the index is lexical-only. */
  embeddingModel: string | null;
  /** Hash of the corpus the index was built from. */
  corpusHash: string;
  chunks: EmbeddedChunk[];
}

export interface RetrievedChunk {
  chunk: Chunk;
  /** Combined hybrid score in 0..1. */
  score: number;
  lexicalScore: number;
  semanticScore: number;
}
