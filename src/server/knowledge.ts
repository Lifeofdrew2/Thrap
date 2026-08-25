/**
 * Corpus loading and vector-index caching.
 *
 * Node-only: this module touches the filesystem and is excluded from the
 * browser TypeScript project.
 */

import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { embedTexts } from "../rag/embeddings";
import { chunkDocument } from "../rag/markdown";
import { createRetriever, type Retriever } from "../rag/retrieve";
import type { EmbeddedChunk, RagIndex } from "../rag/types";
import type { EmbeddingConfig } from "./api";

/** Bump to invalidate every cached index after a chunking or format change. */
const INDEX_FORMAT_VERSION = 1;

/**
 * Resolved from the working directory rather than the module URL: the
 * production bundle sits in a build directory, while `knowledge/` stays at the
 * project root. Render runs the process from the repository root.
 */
const KNOWLEDGE_DIR = process.env.KNOWLEDGE_DIR
  ? path.resolve(process.env.KNOWLEDGE_DIR)
  : path.resolve(process.cwd(), "knowledge");

const INDEX_PATH = path.join(KNOWLEDGE_DIR, ".index.json");

/** Identifies the index a cache was built with, so a provider swap invalidates it. */
const embeddingTag = (embed: EmbeddingConfig) =>
  embed.apiKey ? `${embed.provider}:${embed.model}` : null;

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

async function readCachedIndex(corpus: Corpus, model: string | null): Promise<EmbeddedChunk[] | null> {
  try {
    const cached = JSON.parse(await readFile(INDEX_PATH, "utf8")) as RagIndex;

    const usable =
      cached.formatVersion === INDEX_FORMAT_VERSION &&
      cached.corpusHash === corpus.corpusHash &&
      cached.embeddingModel === model &&
      Array.isArray(cached.chunks) &&
      cached.chunks.length === corpus.chunks.length;

    return usable ? cached.chunks : null;
  } catch {
    // No cache yet, or an unreadable one. Rebuild.
    return null;
  }
}

async function persistIndex(corpus: Corpus, model: string | null): Promise<void> {
  const index: RagIndex = {
    formatVersion: INDEX_FORMAT_VERSION,
    embeddingModel: model,
    corpusHash: corpus.corpusHash,
    chunks: corpus.chunks,
  };

  try {
    await writeFile(INDEX_PATH, JSON.stringify(index), "utf8");
  } catch (error) {
    // A read-only or ephemeral filesystem is not fatal; it only costs a rebuild
    // on the next start, which is the normal case on a container host.
    console.warn(`   [Thrap] Could not cache knowledge index: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Build the retriever, embedding the corpus when a key is available and
 * caching the vectors so a restart does not re-embed.
 *
 * Every failure degrades to lexical-only retrieval rather than disabling
 * retrieval: BM25 over the same corpus still grounds answers and citations.
 */
export async function buildRetriever(embed: EmbeddingConfig): Promise<Retriever> {
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
