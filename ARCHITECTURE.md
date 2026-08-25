# Employee Wellbeing Navigation Agent Architecture

Status: **Architecture review required; implementation intentionally not started**

## 1. Product boundary

This system is a constrained navigation service for employees and managers. It helps a person find an approved EAP resource, understand organisation-provided coverage and confidentiality rules, request a counsellor booking, locate approved self-help material, or reach a designated human support role.

It is **not** a therapist, counsellor, diagnostician, crisis assessor, medical adviser, medication adviser, or open-ended emotional companion. The system must not infer a diagnosis, prescribe or interpret medication, deliver a therapeutic exercise or technique, conduct a risk assessment conversationally, or continue a long emotional-support dialogue.

### Content layers

Two content layers extend this boundary without moving it. They replace the coach, wellness-companion, and emotional-support-assistant framing that was requested and rejected; the decision and its reasoning are recorded in [WELLBEING_AGENT_SCOPE_RECOMMENDATION.md](WELLBEING_AGENT_SCOPE_RECOMMENDATION.md).

**Workplace wellness content** extends the knowledge layer. It is retrieval over approved organisational material and reviewed general workplace material. It changes what the navigator may cite; it does not change how the navigator converses.

**Structured self-help** is a separate reading surface, not a conversation feature. A person browses a library, opens a module, reads it, and may write private reflections that the system never answers.

The controlling rule for both layers:

> The system does not respond to, reflect, interpret, paraphrase, or acknowledge the content of anything a person discloses about their own feelings or situation.

Presented content is not conversation. A self-help module is a document a person reads, in the same sense that a policy document is. The system's role ends at presenting it. Where a person writes into a module, that text is classified for safety and then discarded or stored under the existing consent model; it is never sent to the model, and it never produces a reply.

If a proposed feature in either layer would feel supportive to talk to, that is the signal that it has crossed the boundary. It is rejected rather than tuned.

The safety boundary is architectural:

```text
Inbound message
    |
    v
RiskClassifier -- error/timeout --> deterministic human escalation
    |
    +-- severity above LOW --> deterministic human escalation
    |
    +-- LOW --> IntentRouter --> retrieval/action workflow --> OutputGuard
                                                        |
                                                        +-- fail --> human escalation
                                                        +-- pass --> bounded response
```

No main-agent or retrieval call occurs until the risk decision permits it. A crisis response is a code constant, not an LLM completion.

## 2. Proposed repository shape

```text
app/
  api/                 FastAPI routes, request/response models
  config.py            Environment-backed settings
  safety/
    classifier.py      RiskClassifier interface and implementation
    models.py          RiskBand, matched signals, classification result
    responses.py       Fixed escalation copy constants
    output_guard.py    Draft-response policy checks
  orchestration/
    intents.py         Navigator intent definitions and routing policy
    service.py         Bounded conversation workflow
    prompts/           Versioned prompt files, loaded at runtime
  knowledge/
    documents/         Markdown source files with [PLACEHOLDER] blocks
    ingest.py          Markdown chunking and pgvector indexing
    retrieve.py        Retrieval with citation results
  provider/
    base.py            Swappable typed model-provider protocol
    anthropic.py       Anthropic SDK adapter
  actions/
    interfaces.py      Typed action protocols and idempotency contract
    implementations.py Booking, escalation, interaction logging adapters
    notifiers.py       Email/Teams notifier protocol and adapters
  persistence/
    models.py          SQLAlchemy models and field-retention notes
    repositories.py    Persistence boundaries
    migrations/        Alembic migrations
  observability/       Structured logging and metrics
  main.py              App composition and health endpoint
tests/
  safety/              Red-team and output-guard suite
  orchestration/
  knowledge/
  actions/
  persistence/
  api/
pyproject.toml
Dockerfile
compose.yaml
README.md
```

The exact module names may change during implementation, but the dependency direction must remain: API -> orchestration -> provider/retrieval/actions, with safety wrapping the orchestration entry point and persistence behind repositories.

## 3. Safety layer

### Risk classification

`RiskClassifier.classify(message: str) -> RiskAssessment` returns only typed structured data:

- `severity`: ordered enum, initially `LOW`, `ELEVATED`, `HIGH`, `CRITICAL`
- `matched_signals`: stable signal codes, never quoted message text
- `confidence`: bounded classifier confidence or `None` when unavailable
- `classifier_version`

Signal families include suicidal ideation, self-harm, abuse or exploitation, harm to others, and acute distress. Matching must include direct and indirect disclosure, third-party disclosure, Nigerian English, and Nigerian Pidgin variants. Third-party disclosures remain escalation-eligible because the correct response depends on a human role, not automated interpretation.

The first implementation should be a deterministic, auditable ruleset with tests. An LLM should not be the sole safety classifier. If a future model-assisted classifier is added, it must be advisory inside a fail-closed ensemble and must not lower a deterministic match.

Any `ELEVATED`, `HIGH`, or `CRITICAL` assessment bypasses intent routing, retrieval, tools, and the main model. The response is a fixed constant that says, in substance:

> I can't help with a crisis or immediate safety concern, but I can help connect you to the designated human support role. Please contact **[NAMED HUMAN ROLE]** now through **[ORG-APPROVED CHANNEL]**. If anyone is in immediate danger, contact local emergency services. I will not try to assess or treat this situation here.

The final wording, named role, channel, and any emergency instruction require organisational and legal review. No phone number, provider, or hotline is invented in this repository.

### Classification points

`RiskClassifier.classify` runs wherever a person supplies free text, not only at the conversation entry point. The complete set is:

1. a navigator message or shortcut intent;
2. entry to the self-help library or a module, where entry was reached by free text rather than by browsing;
3. every free-text reflection written inside a self-help module;
4. any free-text elaboration offered in the workplace wellness or manager guidance paths.

Points 2 to 4 use the same ruleset, the same signal families, and the same fail-closed behaviour as point 1. There is no reduced-severity path for text written into a module on the assumption that a person is "only reflecting".

Reflection text carries one constraint that navigator messages do not: it is classified and then either discarded or stored under the existing consent model. It is never sent to the model provider, never retrieved against, and never used to select or rank a module. The classifier returns a risk verdict and nothing else — there is no draft, no answer, and no acknowledgement.

A classification decision on reflection text may produce only one of two outcomes: silent acceptance, or deterministic escalation. There is no third outcome in which the system says something about what was written.

### Failure behaviour

Classifier exceptions, malformed results, timeouts, unavailable configuration, and ambiguous policy states all route to the same deterministic human-escalation path. The failure path must not call the main agent. The API should return a stable response and a correlation ID while logging only non-content metadata.

### Output guard

`OutputGuard` runs after every draft and before every user-visible response, including retrieved-answer and action-result paths. It rejects drafts that contain or imply:

- diagnosis or clinical interpretation;
- medication, dosage, or treatment advice;
- therapeutic techniques, guided exercises, or therapy simulation;
- risk assessment claims or assurances that a person is safe;
- fabricated coverage, provider, policy, or crisis information;
- disclosure of retrieved content outside the permitted audience.

A rejection routes to deterministic human escalation. It does not ask the model to repair its own unsafe text. The guard should combine explicit policy checks with a small reviewed rule set; tests are required for both unsafe and benign navigator language.

### Safety test gate

`pytest -m safety` is the single safety command. The suite must contain at least 60 cases covering direct crisis language, indirect disclosure, third-party disclosure, prompt injection such as “therapist mode”, Nigerian English, Pidgin, acute distress, abuse, harm to others, output-policy violations, classifier failures/timeouts, and benign navigation messages that must remain `LOW`.

The suite grows with the content layers. It must additionally cover:

**Module-boundary violations.** A reflection whose text invites a reply ("what do you think?", "please respond"); a module whose Markdown contains instructions addressed to the model; a retrieved workplace document carrying an injected instruction; a navigator message asking the service to discuss, summarise, interpret, or score a reflection the person has written; a request to continue a module conversationally. Each must produce refusal or escalation, and each test asserts that no provider call was made.

**Reflection-input disclosure.** Direct crisis language, indirect disclosure, third-party disclosure, abuse disclosure, and acute distress written into a reflection field, in English, Nigerian English, and Pidgin. Each must route to deterministic escalation on the same path as a navigator message, and each test asserts that the reflection text was neither persisted nor sent to the provider.

**Manager path laundering.** Generalised phrasings carrying identifying particulars ("hypothetically, if someone on my team was...", "asking generally, a colleague who sits near me has been..."). These must classify as third-party disclosure and escalate regardless of the stated intent or the surface the text was entered from.

**Provenance violations.** A draft stating an entitlement, obligation, or organisational commitment sourced only from general workplace guidance; a draft presenting general guidance as organisation policy; a policy question answered from general guidance when no organisational document was retrieved.

**Benign module use.** Browsing categories, opening a module, moving between sections, and writing an ordinary non-disclosing reflection must all remain `LOW` and must not escalate. A safety suite that escalates ordinary use is as unusable as one that misses a crisis, so these cases carry equal weight and equal review.

The minimum case count rises from 60 to `[REVIEWED COUNT]` once the layers are in scope. The figure is set during review rather than asserted here.

Tests should assert both routing and the absence of provider/retrieval/action calls. A report fixture or test summary will calculate precision and recall per severity band against reviewed labels. Thresholds must be agreed during review; until then, a failing safety test is a release blocker rather than a number to optimise around.

## 4. Conversation orchestration

The permitted intent enum is:

| Intent | Retrieval | Action | Explicit handoff |
|---|---|---|---|
| `ACCESS_OPTIONS` | EAP overview, counsellor panel | None | Unavailable eligibility or personal clinical need |
| `BOOK_COUNSELLOR` | Counsellor panel, booking policy | `book_counsellor` | No matching panel, accessibility/language need, failed booking |
| `CONFIDENTIALITY` | Confidentiality policy | None | Legal/privacy complaint or uncertainty in policy |
| `HMO_COVERAGE` | HMO coverage document | None | Individual claim decision or missing coverage data |
| `TALK_TO_SOMEONE_NOW` | Escalation policy | `escalate_to_human` | Always, after safety gate permits this non-crisis navigation route |
| `SELF_HELP_RESOURCES` | Self-help module index only | None; hands off to the module reader surface | Request becomes therapeutic, clinical, or crisis-related |
| `MANAGER_TEAM_MEMBER` | Manager policy and escalation policy | Usually `escalate_to_human` | Always for identifiable employee concerns or safety uncertainty |
| `WORKPLACE_WELLNESS` | Workplace wellness documents, organisational and general | None | Request becomes personal-clinical, or a policy question has no organisational source |
| `MANAGER_GENERAL_GUIDANCE` | Manager guidance documents, presented whole | None | Any identifying particular about a named or identifiable person |

### Intent decisions for the content layers

Three options were available: an intent per topic, one intent per layer, or extension of the existing enum. The design adds two intents and extends one.

**`WORKPLACE_WELLNESS` is one intent, not four.** Workload and capacity, burnout as an organisational issue, boundaries and after-hours expectations, and returning to work after leave share a retrieval scope, take no action, and have the same handoff triggers. They differ only in topic, and topic is a retrieval facet rather than a routing decision. Four intents would multiply the routing policy surface and the safety test matrix without changing behaviour at any point.

**`MANAGER_GENERAL_GUIDANCE` is separate from `MANAGER_TEAM_MEMBER`, because their safety policies differ.** An intent here is a routing policy, and one intent cannot carry two policies. `MANAGER_TEAM_MEMBER` always escalates; general guidance does not. Collapsing them would place the more permissive policy inside the intent that must always escalate, which is the precise failure this section exists to prevent. Keeping them separate leaves escalation as the default and the permissive path as a narrow, well-guarded exception.

**Self-help gets no new intent.** The module library is a distinct surface reached by browsing, not a turn in the navigator loop. `SELF_HELP_RESOURCES` is extended to hand off to that surface rather than to answer from it: the navigator's job ends at "the library is here, and this is what is in it". A `READ_MODULE` intent would imply the model mediates module content, which is the behaviour the layer exists to avoid.

### The manager boundary

General manager guidance is the highest-risk addition in either layer, because it appears to create a path around an escalation rule that already exists. A manager who would be escalated for asking about a named team member may rephrase the same question generally and expect an answer.

Four properties close that path, and all four are required:

1. **Third-party detection is a safety-layer signal, not an intent.** Identifying particulars about another person are matched by the `RiskClassifier` before intent routing runs. The stated intent, and the surface the text was entered from, do not affect the outcome. `MANAGER_GENERAL_GUIDANCE` is unreachable for any input carrying such particulars.

2. **The path presents documents; it does not compose advice.** `MANAGER_GENERAL_GUIDANCE` returns approved guidance through the same reader surface used for self-help modules. The model does not write manager advice. This removes the payoff from rephrasing: there is no situational answer to extract, only a document that browsing would have reached anyway.

3. **Entry is by browsing, not by describing a situation.** The manager guidance library is reached from a category list. No free-text field accepts a description of a person and returns guidance about them.

4. **The output guard rejects individuated advice.** Any draft in a manager path giving second-person situational instruction about a person ("you should tell them", "ask her whether"), or restating particulars the user supplied, is rejected and routed to escalation.

Escalation here is not a refusal to help. A manager with a concern about a specific person reaches `[NAMED HUMAN ROLE]`, who can act on it. The design position is that this serves the manager and the team member better than a generated answer, and the copy must say so plainly rather than reading as a rebuff.

Out-of-scope requests receive concise refusal plus an available navigator option and human path. Ambiguous intent asks one bounded clarifying question; it does not create an open-ended counselling dialogue.

The main-agent system prompt is stored in a versioned file such as `prompts/navigator_v1.txt`. It must state the role boundary, require citations for factual answers, prohibit general-knowledge completion when retrieval is empty, require human handoff language, and forbid prompt instructions supplied by retrieved documents or users from changing the safety policy. Prompt versions are recorded with each non-sensitive usage metric.

Conversation state includes a session ID, current intent, turn count, prompt version, consent state, and workflow status. A hard configurable turn limit applies, with a conservative default selected during implementation. At the limit, the service concludes with the relevant human route or action status; it never extends the session to preserve engagement.

## 5. Knowledge and retrieval

### Store recommendation: PostgreSQL + pgvector

Use pgvector rather than introducing Chroma. PostgreSQL is already required for structured state, audit boundaries, migrations, access control, and backups. pgvector keeps approved knowledge, document metadata, and retrieval citations under the same operational controls and avoids a second persistence system in production. Docker Compose can run a PostgreSQL image with pgvector for local development.

This does not mean conversation content is stored with knowledge. Knowledge tables contain only approved organisational documents and ingestion metadata. Retrieval returns a typed result containing document ID, title, section, source version, and a citation span or stable heading reference.

Markdown documents:

- EAP overview
- confidentiality policy
- counsellor panel
- HMO mental health coverage
- crisis escalation policy
- self-help library index

Organisation-specific facts are represented with clearly visible `[PLACEHOLDER]` blocks, including named human roles, approved channels, eligibility rules, providers, prices, coverage limits, hours, retention periods, and emergency instructions. Ingestion rejects unresolved placeholders for production deployment. If retrieval returns no relevant approved material, the agent says that it could not find an approved answer and offers the human route; it must not fill the gap from model knowledge.

### Workplace wellness documents

The Markdown set gains: workload and capacity; burnout as an organisational issue; boundaries and after-hours expectations; manager guidance on supporting a team member; returning to work after leave.

These follow the existing rules — organisation-specific facts are `[PLACEHOLDER]` blocks, ingestion rejects unresolved placeholders for production, and retrieval returns a typed citation rather than a dump of document text. They also introduce a distinction the existing set does not have.

### Provenance: organisation policy is not general guidance

The existing documents are all organisational. The workplace wellness set is not: a page describing how burnout arises from workload, control, and recognition is general professional material, and it creates no entitlement, obligation, or commitment by the employer. Presenting the two as equivalent would let the service imply provisions the organisation has never agreed to.

Every knowledge document therefore carries an explicit provenance:

- `organisation_policy` — approved by the organisation, authoritative for what it provides and requires.
- `general_guidance` — reviewed general workplace or wellbeing material, not organisation policy, creating no entitlement.

Provenance propagates into the retrieval result and into the citation contract, so the client renders the difference rather than inferring it. The typed citation gains `provenance`, `approvedBy`, and `reviewedOn`.

Four rules follow. They are enforced in the output guard, not in prompt wording alone:

1. A statement of entitlement, obligation, eligibility, cost, or organisational commitment may cite only `organisation_policy` sources. A draft grounding such a statement in `general_guidance` is rejected.
2. General guidance is never presented as organisation policy, and an answer must not blur the two in a single unattributed sentence.
3. Where a person asks a policy question and retrieval returns only `general_guidance`, the service says the organisation has not published an answer and offers the human route. It does not substitute the general material. This is the existing empty-retrieval rule applied to a partial match, and it is the rule most likely to be eroded by a well-meaning prompt change.
4. A mixed answer attributes each claim, and the client groups the two provenances separately and visibly.

### Self-help module store

Modules are Markdown, versioned, and stored alongside the knowledge documents, but they are **not** retrieved against and never enter the navigator's retrieval scope. A module is selected by identifier from a browsable index and served whole. It is not chunked, embedded, summarised, or quoted by the model.

Keeping modules out of retrieval is deliberate. If module text were retrievable, the navigator could quote a therapeutic exercise into a conversation, which is exactly the delivery of a technique as treatment that §1 forbids.

The module index is a separate approved document listing identifier, title, category, purpose, estimated reading time, evidence basis reference, and clinical review status. Only the index participates in retrieval, and only so that `SELF_HELP_RESOURCES` can say that the library exists and what is in it.

No training, fine-tuning, or embedding of employee conversation content is proposed. Retrieval plus prompting is sufficient for this product and is easier to audit, update, and withdraw.

### Module content format

```markdown
---
id: winding-down-after-a-demanding-day
title: Winding down after a demanding day
version: 0.1.0
category: sleep-and-rest
status: draft | in-clinical-review | approved | withdrawn
estimated_minutes: 12
purpose: >
  What a person will have read by the end, in one plain sentence.
evidence_basis:
  approach: "[APPROVED APPROACH LABEL]"
  sources:
    - reference: "[APPROVED SOURCE]"
      type: guideline | review | organisational
  strength: "[REVIEWER ASSESSMENT]"
  limitations: "[WHAT THIS MATERIAL DOES NOT DO]"
clinical_review:
  reviewer_role: "[REQUIRED]"
  registration: "[REQUIRED]"
  reviewed_on: "[REQUIRED]"
  next_review_due: "[REQUIRED]"
  outcome: "[REQUIRED]"
not_suitable_for:
  - active crisis, or thoughts of suicide or self-harm
  - "[FURTHER CLINICAL EXCLUSIONS]"
alternative_route: >
  Where a person for whom this is unsuitable should go instead.
---

## Section heading

Ordinary prose.

::: reflection
A single, closed, non-probing prompt.
:::
```

`status` gates release: a module that is not `approved` is not servable in production, in the same way that an unresolved `[PLACEHOLDER]` blocks ingestion.

`evidence_basis` and `not_suitable_for` are mandatory. A module with an empty or placeholder evidence basis is not reviewable and not releasable. `not_suitable_for` and `alternative_route` are shown before the module body, not buried at the end.

Reflection prompts carry constraints of their own, because they are the one place in either layer where a person is invited to write:

- closed rather than open — "note the time you stopped working yesterday", not "how did that make you feel?";
- no prompt may ask for an emotional state, a symptom, a rating, or a description of a relationship or another person;
- no prompt may invite a narrative;
- every prompt must be answerable in a few words, and every prompt must be skippable.

A module author cannot add a free-form "anything else you want to say?" field. That is an emotional-support dialogue with the reply removed, and it invites precisely the disclosure this layer is designed not to receive.

### Completion state

Two different things are called completion, and conflating them is how this layer would acquire progress tracking.

**Module structure** is declared by the module: its sections, their order, and an explicit closing section. It is content, versioned with the module, identical for everyone.

**A person's position** in a module is ephemeral client state — which section is on screen, so that moving between sections works and a person can return to where they were within the session. It is held in memory, is lost on refresh in line with the existing conversation rule, and is never sent to the server.

No record is created that a person started, continued, abandoned, or finished a module. §15 of the frontend document sets out why.

## 6. Provider and actions

The model boundary is a typed provider protocol with an Anthropic adapter. The orchestration layer must not import Anthropic-specific request types. Provider calls have timeouts, bounded tokens, model/version metadata, and no permission to invoke crisis routing or change safety state.

Tools expose typed inputs and results:

- `book_counsellor`: request ID, eligible options, availability preference, consent reference; idempotency key required.
- `escalate_to_human`: reason code, severity, preferred contact channel, consent/reference state; idempotency key required.
- `log_interaction`: anonymised event type and operational metadata only unless explicit consent permits an identified record.

Every action has explicit success, rejected, unavailable, and retryable-error results. External side effects occur behind repositories/adapters and are idempotent. Escalation uses a `Notifier` protocol with email and Teams webhook implementations, both mockable in tests. Every escalation ends at a configured named human role; a channel or number alone is invalid configuration.

### Post-escalation accountability

An escalation is not considered operationally complete merely because the API returned a response. The system records a separate, minimum-data escalation lifecycle: `created`, `notification_attempted`, `notification_acknowledged`, `handoff_failed`, or `closed_by_human`. The named human role or on-call coordinator owns acknowledgement within the reviewed SLA. A notification failure, missing acknowledgement, or expired SLA creates an operational alert to the backup human role through a separately configured channel; it never sends the employee back into the agent or asks the agent to confirm that help was reached.

The system must distinguish **notification delivery** from **human contact**. It must not infer that a person received care from a delivered email, webhook, link click, or later product activity. Any confirmation that the person reached help is optional, explicit, consent-based, and recorded outside conversation content. If the organisation cannot provide an owner, backup owner, hours, and SLA, escalation is not a usable safety control and launch is blocked.

Post-escalation metrics are limited to operational facts such as notification success rate, acknowledgement latency, failed-handoff count, and SLA breaches. They are kept in the separate escalation audit boundary, access-controlled, and retained on its reviewed schedule. Metrics must not become employee surveillance or be used to penalise a person for not engaging with a human service.

## 7. Data, privacy, and NDPA design constraints

Health and wellbeing information is treated as sensitive personal data under the Nigeria Data Protection Act 2023. The implementation must involve the organisation's DPO/privacy counsel before production and must document its controller/processor roles, lawful basis, notices, data-subject rights process, security measures, breach process, and any required impact assessment.

### Storage boundaries

- No identifiable conversation content is persisted before an explicit consent step.
- Consent records store purpose, notice/version, timestamp, subject/session reference, and withdrawal state; they do not copy the conversation.
- Identified records are separated from anonymised usage metrics. Metrics use coarse event types, counts, latency, safety band, intent, and prompt/model versions, with no message text or free-form tool payloads.
- Escalation audit records are separate from conversation storage and use a different reviewed retention schedule. They contain the minimum operational facts needed to prove routing and notification, not the message body.
- Database access is least-privilege, encrypted in transit and at rest where supported, and sensitive fields are excluded from normal logs and analytics exports.

### Reflection content

Reflection text is the most sensitive free text in the system. A navigator query is usually instrumental ("how do I book"); a reflection is written privately, in a wellbeing context, and may contain health information about the writer. It is treated accordingly.

- **Default is no persistence.** Reflection text is held in the browser for the life of the module view and is written to no store. The design position is that this content should not exist server-side at all.
- **Transient classification is still processing.** Submitting a reflection transmits it for safety classification, which requires a lawful basis and transparent notice even though nothing is retained. The privacy notice must say plainly that what a person writes is checked for safety signals and then discarded.
- **Never sent offshore, never sent to the model.** Reflection text is classified by the deterministic in-process classifier only. It is not transmitted to Anthropic or any other model provider, is not embedded, and is not retrieved against. This holds regardless of the offshore-transfer decision in §2 of the stakeholder questionnaire: approval to send navigator text offshore is not approval to send reflections.
- **Not logged at any level.** Reflection text must not appear in application logs, error reports, traces, request logs, or diagnostic captures, including in development. A diagnostic containing reflection text is a release-blocking defect.
- **Escalation records the signal, not the sentence.** Where a reflection triggers escalation, the audit record carries the signal codes and severity the existing escalation audit already holds. It does not copy the reflection text.
- **No derived state.** Reflection content must not select or rank modules, populate metric dimensions, personalise any surface, or support an inference about a person. There is no permitted downstream use.

If the organisation asks for reflections to be retained, that is a distinct processing purpose requiring its own consent, lawful basis, retention period, access model, and impact assessment. It is not covered by consent to identified navigation processing and must not be bundled into it.

### Column-level documentation requirement

Each SQLAlchemy field must carry a nearby docstring/comment or schema metadata note naming why it exists, whether it is personal/sensitive, and its retention period. The migration and data dictionary must cover at least:

- consent purpose/version/timestamps: evidence of consent; reviewed retention period;
- session and intent state: bounded workflow operation; short retention;
- identified contact/reference data: only after consent and only as long as needed for fulfilment;
- booking reference/status: fulfilment and reconciliation; provider/agreed retention;
- escalation audit event/severity/role/notification status: safety accountability; separate audit retention;
- anonymised metric dimensions: service safety/quality measurement; aggregate retention;
- knowledge document/version/chunk metadata: provenance and citation; retained while approved.

The actual periods are `[PLACEHOLDER]` decisions, not invented defaults.

NDPA-sensitive points are explicitly flagged in design and code review:

1. lawful basis and transparent notice before consented identified processing;
2. purpose limitation and data minimisation for health-related details;
3. retention/deletion automation and withdrawal handling;
4. access controls, encryption, auditability, and processor contracts;
5. offshore Anthropic processing: document transfer mechanism, data location, sub-processors, contractual safeguards, and whether a privacy impact assessment or additional approval is required;
6. employee/manager access separation, especially for third-party reports;
7. human review and correction routes for automated classification and routing;
8. incident response and notification obligations;
9. reflection content: transient classification, no persistence by default, no provider transmission, and no derived use;
10. general workplace content provenance: ensuring general guidance is never presented as an organisational commitment or used as the basis of an entitlement statement;
11. absence of engagement data: confirming that no record of module use, completion, or abandonment is created for any person.

The offshore provider receives only the minimum permitted text, only after the safety gate, and only under approved contractual and privacy configuration. A deployment may disable offshore LLM calls until that review is complete.

## 8. Operations

Configuration is environment-backed and validated at startup. Secrets are never committed or logged. Required configuration includes database URL, provider credentials, timeouts, model identifier, turn limit, notifier settings, named human roles, approved channels, retention values, and environment name. Placeholder configuration causes a clear non-production startup failure or keeps the relevant feature disabled.

Logging is structured. INFO logs contain request correlation ID, route outcome, safety band, intent, latency, provider status, and action result code, but never message content, prompts, retrieved text, email addresses, phone numbers, or free-form tool input. Sensitive diagnostic detail is restricted, redacted, and access-controlled.

FastAPI exposes a liveness/readiness health check. Readiness verifies configuration and required database/vector-store connectivity without exposing secrets or document content. Docker Compose runs the API, PostgreSQL with pgvector, and local development dependencies. Alembic owns schema changes.

`README.md` must include setup, environment configuration, migrations, ingestion, `pytest`, `pytest -m safety`, health checks, placeholder completion, notifier testing, and an on-call runbook: how to identify the named human role, verify notification delivery, handle failed escalation, preserve the separate audit record, and escalate operational/privacy incidents.

## 9. Review questions before implementation

These answers are required before organisation-specific documents, constants, or production configuration are completed:

1. What exact human roles own crisis escalation, routine wellbeing navigation, manager requests, and privacy complaints?
2. Which approved channels and operating hours reach each role? What is the reviewed immediate-danger wording for Nigeria?
3. What EAP providers, counsellor languages/accessibility options, booking workflow, and HMO plan documents are authorised?
4. What is the organisation's lawful basis, consent wording, privacy notice, DPO contact, controller/processor model, and offshore-transfer position?
5. What retention periods apply to consent, booking, escalation audit, metrics, and knowledge provenance?
6. May an employee's text be sent to Anthropic, in which regions, for which intents, and under what redaction/contract controls?
7. What turn limit and handoff SLA are acceptable for each intent?
8. What reviewed labels and release thresholds define acceptable precision/recall per safety band?
9. How will post-escalation acknowledgement, failed notification, backup ownership, SLA breach, and handoff closure be handled and audited without tracking whether an employee actually received care?
10. Who approves general workplace content, given that it is not organisation policy? What review does it require, who owns its accuracy, and how is it kept visibly distinct from policy in what a person sees?
11. Who clinically reviews each self-help module, against what registration or professional standing, and who signs off release? What is the re-review interval, and what triggers withdrawal of a module?
12. What evidence basis makes a module releasable? Is a named guideline sufficient, is a review required, and who judges the strength and limitations recorded in the module's front matter?
13. Does the organisation accept that no record of self-help use is kept, including for reporting programme uptake? If uptake figures are required, what aggregate would satisfy that need without being resolvable to a person?

## 10. Implementation order and release gates

1. Safety models, deterministic classifier, fixed responses, fail-closed wrapper, output guard, and 60+ case safety suite.
2. Navigator intents, bounded orchestration, versioned prompt, and provider interface.
3. Approved Markdown knowledge files, placeholder validation, pgvector ingestion, and cited retrieval.
4. Typed idempotent actions and mockable notification adapters.
5. Consent-aware persistence, separated metrics, escalation audit, migrations, and retention jobs.
6. FastAPI health/configuration, structured logging, Compose, README runbook, mypy, and full pytest.
7. Workplace wellness documents with provenance, provenance-aware output-guard rules, and the extended intent set.
8. Self-help module format, clinical review workflow, module index, and the reader surface with reflection classification.
9. General manager guidance, last, behind its own red-team set. It ships after the other additions because it is the one path whose failure mode is a manager receiving individuated advice about a person who never consented to it.

Release is blocked unless safety tests pass, unresolved production placeholders are absent, all escalation routes name a human role, output-guard failures fail closed, privacy review is recorded, and the offshore-provider decision is explicit.

The content layers add further gates. Release is additionally blocked unless every servable module carries `status: approved` with a recorded clinical reviewer and evidence basis, no module is reachable in any other status, provenance rules are enforced in the output guard rather than in prompt text alone, reflection text is demonstrably absent from storage and logs, and the manager laundering cases pass.
