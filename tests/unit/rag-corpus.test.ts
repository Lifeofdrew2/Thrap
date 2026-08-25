import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { chunkDocument } from "../../src/rag/markdown";
import { createRetriever, type Retriever } from "../../src/rag/retrieve";
import type { Chunk } from "../../src/rag/types";

/**
 * Retrieval quality gate for the real knowledge corpus.
 *
 * Runs lexical-only so it is deterministic and needs no API key in CI. The
 * semantic half can only improve on these results, so a lexical pass is a
 * meaningful floor: if BM25 alone finds the right document, the hybrid will.
 */

// Resolved from the working directory rather than import.meta.url: under the
// jsdom test environment import.meta.url is not a file: URL.
const KNOWLEDGE_DIR = path.resolve(process.cwd(), "knowledge");

function loadChunks(directory: string): Chunk[] {
  const chunks: Chunk[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(directory, entry.name);

    if (entry.isDirectory()) chunks.push(...loadChunks(full));
    else if (entry.name.endsWith(".md")) {
      const relative = path.relative(KNOWLEDGE_DIR, full).split(path.sep).join("/");
      chunks.push(...chunkDocument(readFileSync(full, "utf8"), relative).chunks);
    }
  }

  return chunks;
}

let chunks: Chunk[];
let retriever: Retriever;

beforeAll(() => {
  chunks = loadChunks(KNOWLEDGE_DIR);
  retriever = createRetriever(chunks);
});

describe("knowledge corpus", () => {
  it("indexes every document into retrievable chunks", () => {
    expect(chunks.length).toBeGreaterThan(40);
  });

  it("gives every chunk a document title, section, and version for citation", () => {
    for (const chunk of chunks) {
      expect(chunk.documentTitle).not.toBe("");
      expect(chunk.section).not.toBe("");
      expect(chunk.version).not.toBe("unversioned");
    }
  });

  it("uses unique chunk ids", () => {
    expect(new Set(chunks.map((chunk) => chunk.id)).size).toBe(chunks.length);
  });
});

describe("retrieval quality (lexical floor)", () => {
  // A plausible employee message paired with the document that should answer it.
  const cases: [query: string, expected: string][] = [
    ["will my employer find out that I used this service?", "confidentiality"],
    ["is anything I say here kept private?", "confidentiality"],
    ["how do I book a session with a counsellor?", "booking-a-counsellor"],
    ["what happens in the first counselling session?", "booking-a-counsellor"],
    ["do I have to pay for the counselling sessions?", "coverage-and-cost"],
    ["I cannot sleep and I keep waking up in the night", "sleep"],
    ["I am exhausted by work and dread every morning", "burnout"],
    ["my manager keeps undermining me in front of the team", "workplace-relationships"],
    ["my father died recently and I am struggling", "grief-and-loss"],
    ["are you a therapist? can you diagnose me?", "service-boundary"],
  ];

  // Recall, not precision, is the contract: every retrieved source is handed to
  // the model, which picks among them. The right document being present is what
  // matters; which one ranked first is not.
  it.each(cases)("retrieves %s -> %s", (query, expected) => {
    const documents = retriever.retrieve(query).map((result) => result.chunk.documentId);
    expect(documents).toContain(expected);
  });

  it("ranks the right document first for at least half of the cases", () => {
    const topOne = cases.filter(
      ([query, expected]) => retriever.retrieve(query)[0]?.chunk.documentId === expected,
    );

    // A floor, not a target. Lexical scoring cannot bridge vocabulary gaps such
    // as "pay" -> "cost"; the semantic half of the hybrid exists for those. If
    // this regresses, lexical retrieval has genuinely got worse.
    expect(topOne.length / cases.length).toBeGreaterThanOrEqual(0.5);
  });

  it("retrieves nothing for a message with no approved answer", () => {
    // Off-topic questions must not be answered from the corpus, and a bare
    // greeting must not drag policy text into a supportive conversation.
    expect(retriever.retrieve("what is the capital of France")).toEqual([]);
    expect(retriever.retrieve("hello")).toEqual([]);
  });

  it("never returns more than the configured number of sources", () => {
    for (const [query] of cases) {
      expect(retriever.retrieve(query).length).toBeLessThanOrEqual(4);
    }
  });
});
