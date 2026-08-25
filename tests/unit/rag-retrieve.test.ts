import { describe, expect, it } from "vitest";
import { cosineSimilarity } from "../../src/rag/embeddings";
import { tokenize } from "../../src/rag/lexical";
import { createRetriever } from "../../src/rag/retrieve";
import type { Chunk, EmbeddedChunk } from "../../src/rag/types";

function chunk(id: string, section: string, text: string, documentId = id): Chunk {
  return {
    id,
    documentId,
    documentTitle: `Doc ${documentId}`,
    version: "draft-0.1",
    category: "service",
    section,
    text: `${section}\n\n${text}`,
  };
}

const CORPUS: Chunk[] = [
  chunk(
    "confidentiality#what-employer-sees",
    "What the organisation sees",
    "The organisation receives aggregate non-identifying information only. It does not receive names or session notes.",
    "confidentiality",
  ),
  chunk(
    "booking#how-booking-works",
    "How booking works",
    "A person can request a counsellor session through the approved channel. A request is not a confirmed appointment.",
    "booking",
  ),
  chunk(
    "sleep#what-people-describe",
    "What people describe",
    "Sleep difficulty takes several forms: trouble falling asleep, waking repeatedly, or waking unrefreshed after a full night.",
    "sleep",
  ),
];

describe("tokenize", () => {
  it("drops stopwords and normalises simple suffixes", () => {
    expect(tokenize("The sleeping and the sleeps")).toEqual(["sleep", "sleep"]);
  });

  it("keeps a double-s word intact", () => {
    expect(tokenize("stress")).toEqual(["stress"]);
  });
});

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors and 0 for orthogonal ones", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it("returns 0 for mismatched or empty vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2])).toBe(0);
    expect(cosineSimilarity([], [])).toBe(0);
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
});

describe("createRetriever (lexical only)", () => {
  const retriever = createRetriever(CORPUS);

  it("reports that semantic scoring is unavailable", () => {
    expect(retriever.hasEmbeddings).toBe(false);
    expect(retriever.size).toBe(3);
  });

  it("ranks the on-topic chunk first", () => {
    const results = retriever.retrieve("how do I book a session with a counsellor?");
    expect(results[0].chunk.documentId).toBe("booking");
  });

  it("matches an inflected query term against the indexed stem", () => {
    const results = retriever.retrieve("I keep waking up and cannot sleep");
    expect(results[0].chunk.documentId).toBe("sleep");
  });

  it("returns nothing for an off-topic message so no citation is offered", () => {
    expect(retriever.retrieve("what is the weather like today")).toEqual([]);
  });

  it("returns nothing for an empty query", () => {
    expect(retriever.retrieve("   ")).toEqual([]);
  });

  it("scores every result within 0..1", () => {
    for (const result of retriever.retrieve("counsellor session booking confidential")) {
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    }
  });
});

describe("createRetriever (hybrid)", () => {
  const embedded: EmbeddedChunk[] = [
    { ...CORPUS[0], embedding: [1, 0, 0] },
    { ...CORPUS[1], embedding: [0, 1, 0] },
    { ...CORPUS[2], embedding: [0, 0, 1] },
  ];

  it("lets a strong semantic match win when lexical overlap is absent", () => {
    const retriever = createRetriever(embedded);
    expect(retriever.hasEmbeddings).toBe(true);

    // No shared vocabulary with any chunk, but the vector points at chunk 3.
    const results = retriever.retrieve("restless nights", [0, 0, 1]);
    expect(results[0].chunk.documentId).toBe("sleep");
    expect(results[0].semanticScore).toBeGreaterThan(results[0].lexicalScore);
  });

  it("falls back to lexical scoring when no query vector is supplied", () => {
    const retriever = createRetriever(embedded);
    const results = retriever.retrieve("booking a counsellor session");
    expect(results[0].chunk.documentId).toBe("booking");
    expect(results[0].semanticScore).toBe(0);
  });
});

describe("createRetriever limits", () => {
  it("caps results per document so one file cannot fill the context", () => {
    const sameDocument: Chunk[] = [1, 2, 3, 4].map((index) =>
      chunk(`booking#section-${index}`, `Section ${index}`, "booking counsellor session request", "booking"),
    );

    // minScore is disabled so this exercises the cap, not the relevance gate:
    // a term present in every chunk carries no BM25 signal by design.
    const retriever = createRetriever(sameDocument, { maxPerDocument: 2, minScore: 0 });
    expect(retriever.retrieve("booking counsellor session")).toHaveLength(2);
  });

  it("honours topK", () => {
    const results = createRetriever(CORPUS, { topK: 1, minScore: 0 }).retrieve("counsellor session sleep organisation");
    expect(results).toHaveLength(1);
  });

  it("returns nothing when the corpus is empty", () => {
    expect(createRetriever([]).retrieve("anything")).toEqual([]);
  });
});
