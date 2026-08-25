# Thrap retrieval layer (RAG)

Status: **Implemented, with a draft knowledge corpus pending organisational and clinical review**

This document describes the retrieval-augmented generation layer that grounds Thrap's
answers in approved organisational content and produces the citations the frontend
already renders.

## 1. Why retrieval and not training

No model is trained or fine-tuned here, and none should be. [ARCHITECTURE.md](ARCHITECTURE.md)
states the position directly: *"No training, fine-tuning, or embedding of employee
conversation content is proposed. Retrieval plus prompting is sufficient for this
product and is easier to audit, update, and withdraw."*

That is the right call for this product:

- **Auditability.** A citation points at a specific document, section, and version. A
  fine-tuned weight cannot be traced back to an approved source.
- **Withdrawal.** Correcting a policy means editing one Markdown file. Correcting a
  fine-tuned model means retraining it.
- **Privacy.** Fine-tuning on employee conversations would be a fresh NDPA processing
  purpose requiring its own lawful basis. Retrieval touches only approved documents.
- **Review.** A clinician can read and sign off a Markdown corpus. They cannot review a
  checkpoint.

Only the *approved corpus* is embedded. Employee conversation content is never embedded,
indexed, or persisted.

## 2. Pipeline

```text
user message
    |
    v
crisis signals ---- match ----> deterministic escalation   (never reaches retrieval)
    |
    | no match
    v
turn limit ------- exceeded --> terminal human route
    |
    v
retrieve(message)
    |-- embed query (RETRIEVAL_QUERY)
    |-- hybrid score = 0.65 * semantic + 0.35 * lexical
    |-- gate at minScore, cap 2 chunks/document, top 4
    v
system prompt = THERAPY_SYSTEM_PROMPT + numbered [S1..S4] context block
    |
    v
Gemini generateContent
    |
    v
extract [S1] markers -> citations, strip markers from the message
    |
    v
output guard: unresolved [PLACEHOLDER] ---> escalation (output_guard)
    |
    v
{ kind: "answer", message, citations, turn }
```

Retrieval runs **after** the safety gate. No message reaches the knowledge layer or the
provider until crisis routing has been ruled out.

## 3. The corpus

Markdown files under [knowledge/](knowledge/), organised by category:

| Category | Documents | Purpose |
|---|---|---|
| `service/` | EAP overview, confidentiality, booking, coverage and cost | What the organisation provides |
| `psychoeducation/` | anxiety, low mood, burnout, sleep, grief and loss, workplace relationships | How difficulties commonly present, and when support helps |
| `practice/` | barriers to asking for support, service boundary | Framing and limits |

Each file carries front matter used for citation provenance:

```yaml
---
id: confidentiality
title: Confidentiality and what is recorded
version: draft-0.1
category: service
updated: 2026-08-20
---
```

### Content rules

The corpus is deliberately **non-clinical**. It describes how difficulties present and
what the service offers. It does not diagnose, assess severity, recommend treatment,
discuss medication, or deliver therapeutic techniques as treatment.

Organisation-specific facts are `[PLACEHOLDER]` blocks: named roles, channels, hours,
entitlements, waiting times, retention periods, emergency instructions. Nothing is
invented — no provider names, no hotline numbers, no prices, no coverage terms.

Placeholders are enforced twice. The prompt instructs the model never to read one out or
guess its value, and `containsUnresolvedPlaceholder` escalates as an output-guard failure
if one reaches the reply anyway.

### Chunking

Documents split on `##` headings, so each chunk is one section on one topic and every
citation has a real section name. Sections over ~1,100 characters split further on
paragraph boundaries, never mid-sentence. The heading is prepended to the chunk text so
the section topic contributes to both lexical and semantic matching.

## 4. Hybrid retrieval

Two scorers combine, because each covers the other's failure mode.

**Semantic** ([embeddings.ts](src/rag/embeddings.ts)) uses `gemini-embedding-001` at 768
dimensions, with `RETRIEVAL_DOCUMENT` for the corpus and `RETRIEVAL_QUERY` for the
message. It bridges vocabulary: "do I have to pay" finds a document about *cost*.

Raw cosine is poorly spread, so it is rescaled between a 0.35 floor and 0.85 ceiling to
give a usable 0..1 score.

**Lexical** ([lexical.ts](src/rag/lexical.ts)) is BM25 with stopword removal and
conservative stemming. It catches exact terms embeddings can blur, and is the half that
survives with no API key.

BM25 is saturated to 0..1 rather than normalised against the best score in the set. That
is what lets an entirely off-topic query return *nothing* instead of returning its
least-bad match.

BM25 alone over-rewards a single rare term — "will my employer find out" matched a
low-mood passage on the lone word "used". Scores are therefore scaled by **idf-weighted
term coverage**: how much of the query's information the chunk actually accounts for.
Weighting by idf rather than counting terms means missing a low-information word like
"cannot" costs far less than missing the topic word, so conversational phrasing stays
usable.

### Gating

- `minScore` 0.32 — below it nothing is retrieved, and the turn is ordinary supportive
  conversation with no citations.
- `maxPerDocument` 2 — one file cannot fill the context window.
- `topK` 4.

## 5. Citations

The model is given numbered sources and instructed to mark any sentence drawn from them
with `[S1]`. `extractCitations` strips the markers and converts them into `Citation`
objects.

A citation therefore asserts *"this sentence came from that section"*, not merely
*"something was retrieved"*. A purely reflective turn correctly carries no citations.
Markers pointing at sources that were never supplied are dropped rather than trusted,
since an out-of-range index is a hallucinated citation.

## 6. Index building and caching

The index builds lazily at dev-server startup and caches to `knowledge/.index.json`
(gitignored). It rebuilds automatically when the corpus hash, embedding model, or index
format version changes, so editing a Markdown file is enough to trigger a re-embed.

To force a rebuild, delete `knowledge/.index.json`.

Free-tier quota meters each item of a batch separately against 100 requests per minute,
so batches are capped at 25 and retried with backoff that honours the delay Google
returns in the error text.

### Degradation

Every failure degrades rather than disabling retrieval:

| Failure | Behaviour |
|---|---|
| No API key | Lexical-only retrieval; deterministic replies quote approved corpus text verbatim, skipping any paragraph holding a placeholder |
| Embedding call fails | Lexical-only retrieval; index not cached, so the next start retries |
| Query embedding fails | Lexical scoring still runs for that turn |
| Index cache unwritable | Warning only; costs a rebuild next start |
| Generation fails or truncates | Fail-closed escalation to the human route |

## 7. Evaluation

[tests/unit/rag-corpus.test.ts](tests/unit/rag-corpus.test.ts) runs ten realistic
employee messages against the real corpus, lexical-only so it is deterministic and needs
no API key in CI.

**Recall@4 is the contract**, not top-1: every retrieved source is handed to the model,
which picks among them, so the right document being *present* is what matters.

Current lexical floor: **recall@4 10/10**, top-1 5/10. The semantic half raises top-1 in
the live system; a lexical pass is a meaningful floor, because if BM25 alone finds the
document then the hybrid will.

The suite also asserts that off-topic messages and bare greetings retrieve nothing, so
policy text cannot leak into a supportive conversation.

## 8. Configuration

```bash
GEMINI_API_KEY=...                              # required for semantic retrieval
GEMINI_MODEL=gemini-3.6-flash                   # optional
GEMINI_EMBEDDING_MODEL=gemini-embedding-001     # optional
```

## 9. Known limitations and open decisions

1. **The corpus is draft content, not approved content.** It was authored to be safe and
   structurally correct, and every organisation-specific fact is a placeholder. It has
   had no clinical or organisational review, and must not be presented to employees
   until [STAKEHOLDER_QUESTIONNAIRE.md](STAKEHOLDER_QUESTIONNAIRE.md) section 3 is
   complete.
2. **Retrieval sends employee text to an offshore provider.** Both the query embedding
   and the generation call transmit the message. This is exactly the decision pending in
   [STAKEHOLDER_QUESTIONNAIRE.md](STAKEHOLDER_QUESTIONNAIRE.md) section 2. Until it is
   answered, the lexical-only path is the deployable configuration: it performs
   retrieval entirely in-process with no transfer.
3. **Session state is a module-level singleton** in the Vite plugin, shared by every
   client. That is a dev-server limitation inherited from the existing code rather than a
   property of the retrieval layer, and must be replaced before any multi-user use.
4. **Citations are self-reported by the model.** The marker contract makes them traceable
   and drops out-of-range indices, but it cannot prove the sentence faithfully represents
   the cited section. The frontend correctly treats citations as contract evidence, not
   as proof of truth.
5. **Retrieval thresholds are tuned by hand** against a 62-chunk corpus. They will need
   revisiting as the corpus grows, and the eval harness is the place to detect that.
