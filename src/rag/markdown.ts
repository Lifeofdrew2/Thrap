import type { Chunk, DocumentMeta } from "./types";

/**
 * Minimal YAML front-matter reader. The knowledge corpus only uses flat
 * `key: value` pairs, so a full YAML parser would be an unnecessary dependency.
 */
export function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const normalised = raw.replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(normalised);
  if (!match) return { meta: {}, body: normalised.trim() };

  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (key) meta[key] = value;
  }

  return { meta, body: normalised.slice(match[0].length).trim() };
}

/** Target chunk size in characters. Sections above this are split on paragraphs. */
const MAX_CHUNK_CHARS = 1_100;
/** Sections below this are merged into the following one rather than stranded. */
const MIN_CHUNK_CHARS = 120;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Split an over-long section on paragraph boundaries, never mid-sentence. */
function splitSection(text: string): string[] {
  if (text.length <= MAX_CHUNK_CHARS) return [text];

  const parts: string[] = [];
  let current = "";

  for (const paragraph of text.split(/\n{2,}/)) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length > MAX_CHUNK_CHARS && current) {
      parts.push(current);
      current = paragraph;
    } else {
      current = candidate;
    }
  }
  if (current) parts.push(current);

  return parts;
}

/**
 * Split one Markdown document into section-scoped chunks.
 *
 * Sections are the `##` headings, which keeps each chunk on a single topic and
 * gives every citation a real section name to point at.
 */
export function chunkDocument(raw: string, path: string): { meta: DocumentMeta; chunks: Chunk[] } {
  const { meta: frontmatter, body } = parseFrontmatter(raw);

  const meta: DocumentMeta = {
    id: frontmatter.id || slugify(path),
    title: frontmatter.title || path,
    version: frontmatter.version || "unversioned",
    category: frontmatter.category || "uncategorised",
    path,
  };

  // Everything before the first `##` (the H1 and any preamble) is dropped: the
  // title already lives in metadata and preambles duplicate section content.
  const sections: { heading: string; text: string }[] = [];
  const pattern = /^##\s+(.+)$/gm;
  let match = pattern.exec(body);

  while (match) {
    const heading = match[1].trim();
    const start = match.index + match[0].length;
    match = pattern.exec(body);
    const text = body.slice(start, match ? match.index : undefined).trim();
    if (text) sections.push({ heading, text });
  }

  // A document with no `##` headings is indexed whole rather than skipped.
  if (sections.length === 0 && body) {
    sections.push({ heading: meta.title, text: body });
  }

  // Merge runt sections forward so a one-line heading is not its own chunk.
  const merged: { heading: string; text: string }[] = [];
  for (const section of sections) {
    const previous = merged[merged.length - 1];
    if (previous && previous.text.length < MIN_CHUNK_CHARS) {
      previous.text = `${previous.text}\n\n${section.heading}\n${section.text}`;
    } else {
      merged.push({ ...section });
    }
  }

  const chunks: Chunk[] = [];
  for (const section of merged) {
    const parts = splitSection(section.text);
    parts.forEach((text, partIndex) => {
      chunks.push({
        id: `${meta.id}#${slugify(section.heading)}${parts.length > 1 ? `-${partIndex + 1}` : ""}`,
        documentId: meta.id,
        documentTitle: meta.title,
        version: meta.version,
        category: meta.category,
        section: section.heading,
        // The heading is prepended to the embedded/indexed text so that the
        // section topic contributes to both lexical and semantic matching.
        text: `${section.heading}\n\n${text}`,
      });
    });
  }

  return { meta, chunks };
}
