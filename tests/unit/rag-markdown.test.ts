import { describe, expect, it } from "vitest";
import { chunkDocument, parseFrontmatter } from "../../src/rag/markdown";

const DOC = `---
id: sample-doc
title: Sample document
version: draft-0.2
category: service
---

# Sample document

Preamble text that should not be indexed on its own.

## First section

Body of the first section, long enough to stand as its own chunk of retrievable
content about confidentiality and booking.

## Second section

Body of the second section, also long enough to be a chunk in its own right and
to carry a distinct topic for retrieval.
`;

describe("parseFrontmatter", () => {
  it("reads flat key/value pairs and strips the block from the body", () => {
    const { meta, body } = parseFrontmatter(DOC);
    expect(meta.id).toBe("sample-doc");
    expect(meta.version).toBe("draft-0.2");
    expect(body.startsWith("# Sample document")).toBe(true);
  });

  it("tolerates a document with no front matter", () => {
    const { meta, body } = parseFrontmatter("## Only a heading\n\nText.");
    expect(meta).toEqual({});
    expect(body).toContain("Only a heading");
  });

  it("handles CRLF line endings", () => {
    const { meta } = parseFrontmatter("---\r\nid: crlf-doc\r\n---\r\n\r\n## Heading\r\n\r\nText.");
    expect(meta.id).toBe("crlf-doc");
  });
});

describe("chunkDocument", () => {
  it("produces one chunk per section, carrying document metadata", () => {
    const { meta, chunks } = chunkDocument(DOC, "service/sample.md");

    expect(meta).toMatchObject({ id: "sample-doc", title: "Sample document", version: "draft-0.2" });
    expect(chunks).toHaveLength(2);
    expect(chunks.map((chunk) => chunk.section)).toEqual(["First section", "Second section"]);
    expect(chunks[0]).toMatchObject({
      id: "sample-doc#first-section",
      documentId: "sample-doc",
      documentTitle: "Sample document",
      version: "draft-0.2",
    });
  });

  it("prepends the heading to chunk text so the topic is searchable", () => {
    const { chunks } = chunkDocument(DOC, "service/sample.md");
    expect(chunks[0].text.startsWith("First section")).toBe(true);
  });

  it("drops the preamble above the first section heading", () => {
    const { chunks } = chunkDocument(DOC, "service/sample.md");
    expect(chunks.some((chunk) => chunk.text.includes("Preamble text"))).toBe(false);
  });

  it("indexes a document with no section headings as a single chunk", () => {
    const { chunks } = chunkDocument("---\nid: flat\ntitle: Flat\n---\n\nJust prose.", "flat.md");
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toContain("Just prose.");
  });

  it("splits an over-long section on paragraph boundaries", () => {
    const paragraph = `${"word ".repeat(120).trim()}.`;
    const long = `---\nid: long\ntitle: Long\n---\n\n## Big section\n\n${paragraph}\n\n${paragraph}\n\n${paragraph}`;

    const { chunks } = chunkDocument(long, "long.md");

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.map((chunk) => chunk.id)).toEqual(
      chunks.map((_, index) => `long#big-section-${index + 1}`),
    );
    // No chunk may end mid-sentence: splitting happens between paragraphs.
    for (const chunk of chunks) expect(chunk.text.trim().endsWith(".")).toBe(true);
  });

  it("falls back to the file path when front matter omits an id", () => {
    const { meta } = chunkDocument("## Heading\n\nText.", "service/no-frontmatter.md");
    expect(meta.id).toBe("service-no-frontmatter-md");
    expect(meta.version).toBe("unversioned");
  });
});
