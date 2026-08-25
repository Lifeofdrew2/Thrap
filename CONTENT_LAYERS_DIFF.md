# Design additions: workplace wellness and structured self-help

Reviewable diff against the pre-change documents. Design only; no implementation.

## ARCHITECTURE.md

```diff
--- /tmp/thrap-base/ARCHITECTURE.md	2026-08-21 12:22:13.275058700 +0100
+++ ARCHITECTURE.md	2026-08-21 12:24:24.052579100 +0100
@@ -8,6 +8,22 @@
 
 It is **not** a therapist, counsellor, diagnostician, crisis assessor, medical adviser, medication adviser, or open-ended emotional companion. The system must not infer a diagnosis, prescribe or interpret medication, deliver a therapeutic exercise or technique, conduct a risk assessment conversationally, or continue a long emotional-support dialogue.
 
+### Content layers
+
+Two content layers extend this boundary without moving it. They replace the coach, wellness-companion, and emotional-support-assistant framing that was requested and rejected; the decision and its reasoning are recorded in [WELLBEING_AGENT_SCOPE_RECOMMENDATION.md](WELLBEING_AGENT_SCOPE_RECOMMENDATION.md).
+
+**Workplace wellness content** extends the knowledge layer. It is retrieval over approved organisational material and reviewed general workplace material. It changes what the navigator may cite; it does not change how the navigator converses.
+
+**Structured self-help** is a separate reading surface, not a conversation feature. A person browses a library, opens a module, reads it, and may write private reflections that the system never answers.
+
+The controlling rule for both layers:
+
+> The system does not respond to, reflect, interpret, paraphrase, or acknowledge the content of anything a person discloses about their own feelings or situation.
+
+Presented content is not conversation. A self-help module is a document a person reads, in the same sense that a policy document is. The system's role ends at presenting it. Where a person writes into a module, that text is classified for safety and then discarded or stored under the existing consent model; it is never sent to the model, and it never produces a reply.
+
+If a proposed feature in either layer would feel supportive to talk to, that is the signal that it has crossed the boundary. It is rejected rather than tuned.
+
 The safety boundary is architectural:
 
 ```text
@@ -94,6 +110,21 @@
 
 The final wording, named role, channel, and any emergency instruction require organisational and legal review. No phone number, provider, or hotline is invented in this repository.
 
+### Classification points
+
+`RiskClassifier.classify` runs wherever a person supplies free text, not only at the conversation entry point. The complete set is:
+
+1. a navigator message or shortcut intent;
+2. entry to the self-help library or a module, where entry was reached by free text rather than by browsing;
+3. every free-text reflection written inside a self-help module;
+4. any free-text elaboration offered in the workplace wellness or manager guidance paths.
+
+Points 2 to 4 use the same ruleset, the same signal families, and the same fail-closed behaviour as point 1. There is no reduced-severity path for text written into a module on the assumption that a person is "only reflecting".
+
+Reflection text carries one constraint that navigator messages do not: it is classified and then either discarded or stored under the existing consent model. It is never sent to the model provider, never retrieved against, and never used to select or rank a module. The classifier returns a risk verdict and nothing else — there is no draft, no answer, and no acknowledgement.
+
+A classification decision on reflection text may produce only one of two outcomes: silent acceptance, or deterministic escalation. There is no third outcome in which the system says something about what was written.
+
 ### Failure behaviour
 
 Classifier exceptions, malformed results, timeouts, unavailable configuration, and ambiguous policy states all route to the same deterministic human-escalation path. The failure path must not call the main agent. The API should return a stable response and a correlation ID while logging only non-content metadata.
@@ -115,6 +146,20 @@
 
 `pytest -m safety` is the single safety command. The suite must contain at least 60 cases covering direct crisis language, indirect disclosure, third-party disclosure, prompt injection such as “therapist mode”, Nigerian English, Pidgin, acute distress, abuse, harm to others, output-policy violations, classifier failures/timeouts, and benign navigation messages that must remain `LOW`.
 
+The suite grows with the content layers. It must additionally cover:
+
+**Module-boundary violations.** A reflection whose text invites a reply ("what do you think?", "please respond"); a module whose Markdown contains instructions addressed to the model; a retrieved workplace document carrying an injected instruction; a navigator message asking the service to discuss, summarise, interpret, or score a reflection the person has written; a request to continue a module conversationally. Each must produce refusal or escalation, and each test asserts that no provider call was made.
+
+**Reflection-input disclosure.** Direct crisis language, indirect disclosure, third-party disclosure, abuse disclosure, and acute distress written into a reflection field, in English, Nigerian English, and Pidgin. Each must route to deterministic escalation on the same path as a navigator message, and each test asserts that the reflection text was neither persisted nor sent to the provider.
+
+**Manager path laundering.** Generalised phrasings carrying identifying particulars ("hypothetically, if someone on my team was...", "asking generally, a colleague who sits near me has been..."). These must classify as third-party disclosure and escalate regardless of the stated intent or the surface the text was entered from.
+
+**Provenance violations.** A draft stating an entitlement, obligation, or organisational commitment sourced only from general workplace guidance; a draft presenting general guidance as organisation policy; a policy question answered from general guidance when no organisational document was retrieved.
+
+**Benign module use.** Browsing categories, opening a module, moving between sections, and writing an ordinary non-disclosing reflection must all remain `LOW` and must not escalate. A safety suite that escalates ordinary use is as unusable as one that misses a crisis, so these cases carry equal weight and equal review.
+
+The minimum case count rises from 60 to `[REVIEWED COUNT]` once the layers are in scope. The figure is set during review rather than asserted here.
+
 Tests should assert both routing and the absence of provider/retrieval/action calls. A report fixture or test summary will calculate precision and recall per severity band against reviewed labels. Thresholds must be agreed during review; until then, a failing safety test is a release blocker rather than a number to optimise around.
 
 ## 4. Conversation orchestration
@@ -128,8 +173,36 @@
 | `CONFIDENTIALITY` | Confidentiality policy | None | Legal/privacy complaint or uncertainty in policy |
 | `HMO_COVERAGE` | HMO coverage document | None | Individual claim decision or missing coverage data |
 | `TALK_TO_SOMEONE_NOW` | Escalation policy | `escalate_to_human` | Always, after safety gate permits this non-crisis navigation route |
-| `SELF_HELP_RESOURCES` | Self-help library index | None | Request becomes therapeutic, clinical, or crisis-related |
+| `SELF_HELP_RESOURCES` | Self-help module index only | None; hands off to the module reader surface | Request becomes therapeutic, clinical, or crisis-related |
 | `MANAGER_TEAM_MEMBER` | Manager policy and escalation policy | Usually `escalate_to_human` | Always for identifiable employee concerns or safety uncertainty |
+| `WORKPLACE_WELLNESS` | Workplace wellness documents, organisational and general | None | Request becomes personal-clinical, or a policy question has no organisational source |
+| `MANAGER_GENERAL_GUIDANCE` | Manager guidance documents, presented whole | None | Any identifying particular about a named or identifiable person |
+
+### Intent decisions for the content layers
+
+Three options were available: an intent per topic, one intent per layer, or extension of the existing enum. The design adds two intents and extends one.
+
+**`WORKPLACE_WELLNESS` is one intent, not four.** Workload and capacity, burnout as an organisational issue, boundaries and after-hours expectations, and returning to work after leave share a retrieval scope, take no action, and have the same handoff triggers. They differ only in topic, and topic is a retrieval facet rather than a routing decision. Four intents would multiply the routing policy surface and the safety test matrix without changing behaviour at any point.
+
+**`MANAGER_GENERAL_GUIDANCE` is separate from `MANAGER_TEAM_MEMBER`, because their safety policies differ.** An intent here is a routing policy, and one intent cannot carry two policies. `MANAGER_TEAM_MEMBER` always escalates; general guidance does not. Collapsing them would place the more permissive policy inside the intent that must always escalate, which is the precise failure this section exists to prevent. Keeping them separate leaves escalation as the default and the permissive path as a narrow, well-guarded exception.
+
+**Self-help gets no new intent.** The module library is a distinct surface reached by browsing, not a turn in the navigator loop. `SELF_HELP_RESOURCES` is extended to hand off to that surface rather than to answer from it: the navigator's job ends at "the library is here, and this is what is in it". A `READ_MODULE` intent would imply the model mediates module content, which is the behaviour the layer exists to avoid.
+
+### The manager boundary
+
+General manager guidance is the highest-risk addition in either layer, because it appears to create a path around an escalation rule that already exists. A manager who would be escalated for asking about a named team member may rephrase the same question generally and expect an answer.
+
+Four properties close that path, and all four are required:
+
+1. **Third-party detection is a safety-layer signal, not an intent.** Identifying particulars about another person are matched by the `RiskClassifier` before intent routing runs. The stated intent, and the surface the text was entered from, do not affect the outcome. `MANAGER_GENERAL_GUIDANCE` is unreachable for any input carrying such particulars.
+
+2. **The path presents documents; it does not compose advice.** `MANAGER_GENERAL_GUIDANCE` returns approved guidance through the same reader surface used for self-help modules. The model does not write manager advice. This removes the payoff from rephrasing: there is no situational answer to extract, only a document that browsing would have reached anyway.
+
+3. **Entry is by browsing, not by describing a situation.** The manager guidance library is reached from a category list. No free-text field accepts a description of a person and returns guidance about them.
+
+4. **The output guard rejects individuated advice.** Any draft in a manager path giving second-person situational instruction about a person ("you should tell them", "ask her whether"), or restating particulars the user supplied, is rejected and routed to escalation.
+
+Escalation here is not a refusal to help. A manager with a concern about a specific person reaches `[NAMED HUMAN ROLE]`, who can act on it. The design position is that this serves the manager and the team member better than a generated answer, and the copy must say so plainly rather than reading as a rebuff.
 
 Out-of-scope requests receive concise refusal plus an available navigator option and human path. Ambiguous intent asks one bounded clarifying question; it does not create an open-ended counselling dialogue.
 
@@ -156,8 +229,104 @@
 
 Organisation-specific facts are represented with clearly visible `[PLACEHOLDER]` blocks, including named human roles, approved channels, eligibility rules, providers, prices, coverage limits, hours, retention periods, and emergency instructions. Ingestion rejects unresolved placeholders for production deployment. If retrieval returns no relevant approved material, the agent says that it could not find an approved answer and offers the human route; it must not fill the gap from model knowledge.
 
+### Workplace wellness documents
+
+The Markdown set gains: workload and capacity; burnout as an organisational issue; boundaries and after-hours expectations; manager guidance on supporting a team member; returning to work after leave.
+
+These follow the existing rules — organisation-specific facts are `[PLACEHOLDER]` blocks, ingestion rejects unresolved placeholders for production, and retrieval returns a typed citation rather than a dump of document text. They also introduce a distinction the existing set does not have.
+
+### Provenance: organisation policy is not general guidance
+
+The existing documents are all organisational. The workplace wellness set is not: a page describing how burnout arises from workload, control, and recognition is general professional material, and it creates no entitlement, obligation, or commitment by the employer. Presenting the two as equivalent would let the service imply provisions the organisation has never agreed to.
+
+Every knowledge document therefore carries an explicit provenance:
+
+- `organisation_policy` — approved by the organisation, authoritative for what it provides and requires.
+- `general_guidance` — reviewed general workplace or wellbeing material, not organisation policy, creating no entitlement.
+
+Provenance propagates into the retrieval result and into the citation contract, so the client renders the difference rather than inferring it. The typed citation gains `provenance`, `approvedBy`, and `reviewedOn`.
+
+Four rules follow. They are enforced in the output guard, not in prompt wording alone:
+
+1. A statement of entitlement, obligation, eligibility, cost, or organisational commitment may cite only `organisation_policy` sources. A draft grounding such a statement in `general_guidance` is rejected.
+2. General guidance is never presented as organisation policy, and an answer must not blur the two in a single unattributed sentence.
+3. Where a person asks a policy question and retrieval returns only `general_guidance`, the service says the organisation has not published an answer and offers the human route. It does not substitute the general material. This is the existing empty-retrieval rule applied to a partial match, and it is the rule most likely to be eroded by a well-meaning prompt change.
+4. A mixed answer attributes each claim, and the client groups the two provenances separately and visibly.
+
+### Self-help module store
+
+Modules are Markdown, versioned, and stored alongside the knowledge documents, but they are **not** retrieved against and never enter the navigator's retrieval scope. A module is selected by identifier from a browsable index and served whole. It is not chunked, embedded, summarised, or quoted by the model.
+
+Keeping modules out of retrieval is deliberate. If module text were retrievable, the navigator could quote a therapeutic exercise into a conversation, which is exactly the delivery of a technique as treatment that §1 forbids.
+
+The module index is a separate approved document listing identifier, title, category, purpose, estimated reading time, evidence basis reference, and clinical review status. Only the index participates in retrieval, and only so that `SELF_HELP_RESOURCES` can say that the library exists and what is in it.
+
 No training, fine-tuning, or embedding of employee conversation content is proposed. Retrieval plus prompting is sufficient for this product and is easier to audit, update, and withdraw.
 
+### Module content format
+
+```markdown
+---
+id: winding-down-after-a-demanding-day
+title: Winding down after a demanding day
+version: 0.1.0
+category: sleep-and-rest
+status: draft | in-clinical-review | approved | withdrawn
+estimated_minutes: 12
+purpose: >
+  What a person will have read by the end, in one plain sentence.
+evidence_basis:
+  approach: "[APPROVED APPROACH LABEL]"
+  sources:
+    - reference: "[APPROVED SOURCE]"
+      type: guideline | review | organisational
+  strength: "[REVIEWER ASSESSMENT]"
+  limitations: "[WHAT THIS MATERIAL DOES NOT DO]"
+clinical_review:
+  reviewer_role: "[REQUIRED]"
+  registration: "[REQUIRED]"
+  reviewed_on: "[REQUIRED]"
+  next_review_due: "[REQUIRED]"
+  outcome: "[REQUIRED]"
+not_suitable_for:
+  - active crisis, or thoughts of suicide or self-harm
+  - "[FURTHER CLINICAL EXCLUSIONS]"
+alternative_route: >
+  Where a person for whom this is unsuitable should go instead.
+---
+
+## Section heading
+
+Ordinary prose.
+
+::: reflection
+A single, closed, non-probing prompt.
+:::
+```
+
+`status` gates release: a module that is not `approved` is not servable in production, in the same way that an unresolved `[PLACEHOLDER]` blocks ingestion.
+
+`evidence_basis` and `not_suitable_for` are mandatory. A module with an empty or placeholder evidence basis is not reviewable and not releasable. `not_suitable_for` and `alternative_route` are shown before the module body, not buried at the end.
+
+Reflection prompts carry constraints of their own, because they are the one place in either layer where a person is invited to write:
+
+- closed rather than open — "note the time you stopped working yesterday", not "how did that make you feel?";
+- no prompt may ask for an emotional state, a symptom, a rating, or a description of a relationship or another person;
+- no prompt may invite a narrative;
+- every prompt must be answerable in a few words, and every prompt must be skippable.
+
+A module author cannot add a free-form "anything else you want to say?" field. That is an emotional-support dialogue with the reply removed, and it invites precisely the disclosure this layer is designed not to receive.
+
+### Completion state
+
+Two different things are called completion, and conflating them is how this layer would acquire progress tracking.
+
+**Module structure** is declared by the module: its sections, their order, and an explicit closing section. It is content, versioned with the module, identical for everyone.
+
+**A person's position** in a module is ephemeral client state — which section is on screen, so that moving between sections works and a person can return to where they were within the session. It is held in memory, is lost on refresh in line with the existing conversation rule, and is never sent to the server.
+
+No record is created that a person started, continued, abandoned, or finished a module. §15 of the frontend document sets out why.
+
 ## 6. Provider and actions
 
 The model boundary is a typed provider protocol with an Anthropic adapter. The orchestration layer must not import Anthropic-specific request types. Provider calls have timeouts, bounded tokens, model/version metadata, and no permission to invoke crisis routing or change safety state.
@@ -190,6 +359,19 @@
 - Escalation audit records are separate from conversation storage and use a different reviewed retention schedule. They contain the minimum operational facts needed to prove routing and notification, not the message body.
 - Database access is least-privilege, encrypted in transit and at rest where supported, and sensitive fields are excluded from normal logs and analytics exports.
 
+### Reflection content
+
+Reflection text is the most sensitive free text in the system. A navigator query is usually instrumental ("how do I book"); a reflection is written privately, in a wellbeing context, and may contain health information about the writer. It is treated accordingly.
+
+- **Default is no persistence.** Reflection text is held in the browser for the life of the module view and is written to no store. The design position is that this content should not exist server-side at all.
+- **Transient classification is still processing.** Submitting a reflection transmits it for safety classification, which requires a lawful basis and transparent notice even though nothing is retained. The privacy notice must say plainly that what a person writes is checked for safety signals and then discarded.
+- **Never sent offshore, never sent to the model.** Reflection text is classified by the deterministic in-process classifier only. It is not transmitted to Anthropic or any other model provider, is not embedded, and is not retrieved against. This holds regardless of the offshore-transfer decision in §2 of the stakeholder questionnaire: approval to send navigator text offshore is not approval to send reflections.
+- **Not logged at any level.** Reflection text must not appear in application logs, error reports, traces, request logs, or diagnostic captures, including in development. A diagnostic containing reflection text is a release-blocking defect.
+- **Escalation records the signal, not the sentence.** Where a reflection triggers escalation, the audit record carries the signal codes and severity the existing escalation audit already holds. It does not copy the reflection text.
+- **No derived state.** Reflection content must not select or rank modules, populate metric dimensions, personalise any surface, or support an inference about a person. There is no permitted downstream use.
+
+If the organisation asks for reflections to be retained, that is a distinct processing purpose requiring its own consent, lawful basis, retention period, access model, and impact assessment. It is not covered by consent to identified navigation processing and must not be bundled into it.
+
 ### Column-level documentation requirement
 
 Each SQLAlchemy field must carry a nearby docstring/comment or schema metadata note naming why it exists, whether it is personal/sensitive, and its retention period. The migration and data dictionary must cover at least:
@@ -213,7 +395,10 @@
 5. offshore Anthropic processing: document transfer mechanism, data location, sub-processors, contractual safeguards, and whether a privacy impact assessment or additional approval is required;
 6. employee/manager access separation, especially for third-party reports;
 7. human review and correction routes for automated classification and routing;
-8. incident response and notification obligations.
+8. incident response and notification obligations;
+9. reflection content: transient classification, no persistence by default, no provider transmission, and no derived use;
+10. general workplace content provenance: ensuring general guidance is never presented as an organisational commitment or used as the basis of an entitlement statement;
+11. absence of engagement data: confirming that no record of module use, completion, or abandonment is created for any person.
 
 The offshore provider receives only the minimum permitted text, only after the safety gate, and only under approved contractual and privacy configuration. A deployment may disable offshore LLM calls until that review is complete.
 
@@ -240,6 +425,10 @@
 7. What turn limit and handoff SLA are acceptable for each intent?
 8. What reviewed labels and release thresholds define acceptable precision/recall per safety band?
 9. How will post-escalation acknowledgement, failed notification, backup ownership, SLA breach, and handoff closure be handled and audited without tracking whether an employee actually received care?
+10. Who approves general workplace content, given that it is not organisation policy? What review does it require, who owns its accuracy, and how is it kept visibly distinct from policy in what a person sees?
+11. Who clinically reviews each self-help module, against what registration or professional standing, and who signs off release? What is the re-review interval, and what triggers withdrawal of a module?
+12. What evidence basis makes a module releasable? Is a named guideline sufficient, is a review required, and who judges the strength and limitations recorded in the module's front matter?
+13. Does the organisation accept that no record of self-help use is kept, including for reporting programme uptake? If uptake figures are required, what aggregate would satisfy that need without being resolvable to a person?
 
 ## 10. Implementation order and release gates
 
@@ -249,5 +438,10 @@
 4. Typed idempotent actions and mockable notification adapters.
 5. Consent-aware persistence, separated metrics, escalation audit, migrations, and retention jobs.
 6. FastAPI health/configuration, structured logging, Compose, README runbook, mypy, and full pytest.
+7. Workplace wellness documents with provenance, provenance-aware output-guard rules, and the extended intent set.
+8. Self-help module format, clinical review workflow, module index, and the reader surface with reflection classification.
+9. General manager guidance, last, behind its own red-team set. It ships after the other additions because it is the one path whose failure mode is a manager receiving individuated advice about a person who never consented to it.
 
 Release is blocked unless safety tests pass, unresolved production placeholders are absent, all escalation routes name a human role, output-guard failures fail closed, privacy review is recorded, and the offshore-provider decision is explicit.
+
+The content layers add further gates. Release is additionally blocked unless every servable module carries `status: approved` with a recorded clinical reviewer and evidence basis, no module is reachable in any other status, provenance rules are enforced in the output guard rather than in prompt text alone, reflection text is demonstrably absent from storage and logs, and the manager laundering cases pass.
```

## FRONTEND.md

```diff
--- /tmp/thrap-base/FRONTEND.md	2026-08-21 12:22:13.283459600 +0100
+++ FRONTEND.md	2026-08-21 12:26:55.557446600 +0100
@@ -8,6 +8,10 @@
 
 It is not a therapist, crisis service, diagnostic tool, medical adviser, medication adviser, or emotional companion. The UI must not invite disclosure, reward prolonged use, imply that the system listens or cares, or present a persona. No name, avatar, typing indicator, thinking animation, emotional check-in, streak, rating prompt, or open-ended “tell me more” copy is permitted.
 
+Two content surfaces extend this without changing it: a **workplace wellness** extension to what the navigator may cite, and a **structured self-help library** that is a reading surface rather than a conversation. Neither is a companion feature. The reasoning is recorded in [WELLBEING_AGENT_SCOPE_RECOMMENDATION.md](WELLBEING_AGENT_SCOPE_RECOMMENDATION.md).
+
+The reading surfaces have no composer, and nothing a person writes into them produces a reply.
+
 The primary design objective is **trust through clear limits, provenance, privacy, and a reliable human route**.
 
 ## 2. Frontend invariants
@@ -24,6 +28,11 @@
 8. No conversation content is written to localStorage, sessionStorage, IndexedDB, URL parameters, browser history, analytics, telemetry, console output, or third-party services.
 9. Refusing identified-processing consent does not disable anonymous navigation.
 10. The turn limit concludes the session; it cannot be bypassed by starting another chat from the same client flow.
+11. Presented content is never conversation. The module reader and the guidance reader have no composer, no reply region, and no affordance implying the system will respond to what a person writes.
+12. A reflection never produces a response. Submitting one changes the interface only by accepting it. It never renders an acknowledgement, interpretation, summary, encouragement, or follow-up prompt.
+13. Reflection content never persists. It is not written to storage, URLs, logs, analytics, or error reports, and it is never sent to the model provider.
+14. Citation provenance is always visible. Organisation policy and general guidance are grouped and labelled separately, and never distinguished by colour alone.
+15. No surface contains scoring, progress tracking, streaks, completion nudges, reminders, or trend visualisation of any kind.
 
 ## 3. Proposed repository shape
 
@@ -55,6 +64,18 @@
     Composer.tsx
     ClearSessionButton.tsx
     OfflineBanner.tsx
+    ProvenanceGroup.tsx    Citation grouping by organisation policy vs general guidance
+    library/
+      LibraryScreen.tsx
+      CategoryList.tsx
+      ModuleCard.tsx
+      EvidenceBasisPanel.tsx
+    reader/
+      ModuleReader.tsx
+      ModuleSection.tsx
+      SuitabilityNotice.tsx
+      ReflectionField.tsx
+      ModuleExitScreen.tsx
   state/
     session-machine.ts     Explicit state machine, no optimistic safety state
     session-store.ts       In-memory store only
@@ -105,6 +126,22 @@
 
 The frontend must not claim or imply that a human has seen the request or that the employee has reached care. It may show a backend-confirmed notification status only when the contract explicitly permits that message and the wording has been reviewed. A notification failure, timeout, or missing acknowledgement keeps the terminal human route visible and is surfaced to the configured operational path; it never reopens the agent conversation.
 
+### Reading surfaces
+
+`LibraryScreen` presents categories and module cards. Categories are labelled by situation, never by emotional state or condition: "Sleep and rest", "Workload and capacity", "Working with others", "After time away". There is no field that asks what is wrong, and no recommender. A card shows title, purpose, estimated reading time, and a link to its evidence basis.
+
+An optional keyword filter may narrow the visible cards. It matches module titles and tags only, runs entirely in the client, and is never transmitted or classified, because it never leaves the browser. If that ever ceases to be true, the filter becomes a disclosure channel and must be removed.
+
+`ModuleReader` renders one module. `SuitabilityNotice` shows the module's `not_suitable_for` list and `alternative_route` **before** the body, not after it. `EvidenceBasisPanel` exposes approach, sources, strength, limitations, and the clinical review record; it is reachable from the card and from inside the module.
+
+`ReflectionField` accepts text against a single closed prompt. On submit it sends the text for classification and nothing else happens on success: the field shows the text as accepted, and no message, tick, encouragement, or next prompt appears. It is the one component where doing nothing visible is the specification rather than an omission.
+
+`ModuleExitScreen` closes a module. It offers the human route, a return to the library, and nothing that invites a person to say how the module went. There is no rating, no "was this helpful?", and no free-text feedback field, because feedback about a wellbeing module is disclosure by another name.
+
+`ProvenanceGroup` renders citations in two labelled groups: organisation policy, and general guidance marked as not organisation policy. Where only general guidance supports an answer, the label is the primary signal, not a footnote.
+
+The reader surfaces are routes distinct from the conversation. A person cannot be in a module and in the navigator conversation simultaneously, and entering the library consumes no navigator turn.
+
 ### Dependency budget
 
 Use React, React DOM, TypeScript, Vite, Tailwind, TanStack Query, Zod, MSW, Vitest, Testing Library, and Playwright as required by the stack. Bundle analysis is a release check. Any additional dependency estimated above 30 KB compressed must have a written reason, measured impact, and an accessibility/security review. Prefer platform APIs for focus, clipboard, storage prohibition, and network status.
@@ -138,8 +175,34 @@
 READY_* / TURN_LIMIT_REACHED / ESCALATED
   -> CLEARING
   -> ONBOARDING             after local state is cleared
+
+READY_*
+  -> LIBRARY_BROWSING       browse categories; consumes no navigator turn
+
+LIBRARY_BROWSING
+  -> MODULE_READING
+  -> READY_*
+
+MODULE_READING
+  -> REFLECTION_CHECKING    free text submitted for classification
+  -> MODULE_EXIT
+  -> ESCALATED
+
+REFLECTION_CHECKING
+  -> MODULE_READING         verdict clear; reflection accepted silently
+  -> ESCALATED              verdict escalate, classifier failure, timeout,
+                            network error, or any non-clear response
+
+MODULE_EXIT
+  -> LIBRARY_BROWSING
+  -> READY_*
+  -> ESCALATED
 ```
 
+`REFLECTION_CHECKING` is bounded and fails closed on every non-clear outcome, including a malformed or unrecognised verdict. It is the only state in the application whose successful resolution is invisible to the person: a cleared reflection returns to `MODULE_READING` with no announcement.
+
+Library and reader states hold no message content and no navigator turn state. Reflection text lives in component state for the life of the module view and is dropped on exit, refresh, or clear-session.
+
 The client may keep only non-content session state in memory: session reference, consent status, turn count, current intent, terminal status, contract version, and correlation ID. Message content exists only in active React memory long enough to render the current page and make the API request. A full page refresh therefore intentionally loses conversation content.
 
 TanStack Query cache persistence is disabled. Query retries are disabled for message submission and safety-relevant endpoints. A slow request shows a neutral progress state without “thinking” language; once the request timeout is reached, the UI renders `EscalationScreen` using local fallback configuration.
@@ -186,6 +249,21 @@
 | Human-route notification pending/failed | Same terminal `EscalationScreen`; optional reviewed status only | Disabled | Local route and backup instruction are primary | Not applicable |
 | Consent refused | Anonymous directory/navigation remains | Enabled for anonymous-safe routes | Persistent | Backend decides data availability |
 | Session cleared | Onboarding/framing screen | Disabled until framing complete | Visible from onboarding | None |
+| Workplace wellness answer, organisation policy | Plain answer with policy citation group | Enabled if turns remain | Persistent | Required; provenance shown as organisation policy |
+| Workplace wellness answer, general guidance only | Plain answer, citations grouped and labelled as general guidance, not organisation policy | Enabled if turns remain | Persistent | Required; the not-policy label is primary, not a footnote |
+| Workplace wellness answer, mixed provenance | Two visibly separate, separately labelled citation groups | Enabled if turns remain | Persistent | Required per claim |
+| Policy question, only general guidance retrieved | States the organisation has not published an answer; general material is not substituted | Enabled | Primary | No citation; substitution is a defect |
+| Manager general guidance | Presented document in the reader surface; no composed advice | No composer in reader | Persistent | Document provenance shown |
+| Manager input naming or identifying a person | `EscalationScreen` | Disabled | Named role/channel is primary | None |
+| Library browsing | Category list and module cards | No composer on this surface | Persistent | Not applicable |
+| Module opened | Suitability notice and alternative route shown before the body | No composer | Persistent | Evidence basis reachable |
+| Module reading | Sections and closed reflection prompts | No composer | Persistent | Not applicable |
+| Reflection accepted | Text shown as accepted; nothing else changes | Not applicable | Persistent | None |
+| Reflection classified as crisis | `EscalationScreen` | Not applicable | Named role/channel is primary | None |
+| Reflection classification fails, times out, or returns an unknown verdict | Same `EscalationScreen` | Not applicable | Local fallback route | None |
+| Module exit | Terminal-for-the-module exit screen with human route | No composer | Primary | None |
+
+The reflection rows deserve particular attention. A cleared reflection produces **no** visible system response beyond the field accepting the text. Any addition here — a tick, a "saved", a "thank you for reflecting", a next-step suggestion — reintroduces the acknowledgement loop the layer exists to prevent, and must be treated as a defect rather than a polish opportunity.
 
 The crisis, guard, timeout, backend-error, and network-failure rows must be visually and structurally identical except for non-user-visible telemetry. The user may see a short connection-status sentence in the network case only if it does not replace or weaken the human route; the escalation card, heading, primary action, disabled composer, and no-retry rule remain identical.
 
@@ -220,6 +298,19 @@
 11. mobile viewport assertion that the primary human route is visible without silent scrolling;
 12. absence of retry/dismiss/composer controls in every terminal path.
 
+Playwright must additionally cover the content layers:
+
+13. a reflection containing crisis language routes to the same `EscalationScreen` as a navigator message, from inside a module;
+14. a cleared reflection produces no acknowledgement, no status text, and no new live-region announcement;
+15. reflection classification timeout, 5xx, and unknown verdict each render the terminal escalation state;
+16. no module surface renders a composer, a retry-with-agent control, or a reply region;
+17. a manager free-text input naming a person escalates, from every surface that accepts free text;
+18. an answer supported only by general guidance renders the not-organisation-policy label, and a policy question with no organisational source renders the no-answer state rather than substituting general material;
+19. module suitability and alternative route are announced before the module body in DOM order and to a screen reader;
+20. reflection text does not appear in `localStorage`, `sessionStorage`, IndexedDB, the URL, the document title, the DOM outside its field, or any network request other than the classification call;
+21. exiting a module always exposes the human route;
+22. a page refresh inside a module discards reflection text and does not restore it.
+
 The tests should use the same fixture data for all terminal paths and assert the same accessible structure, not merely matching text. No test should rely on a real network, provider, analytics service, or browser storage.
 
 ## 9. Chat surface and interaction design
@@ -283,6 +374,13 @@
 - Clear in-memory content on tab close, refresh, terminal escalation, and explicit clear-session according to the reviewed policy.
 - Keep API responses same-origin where possible and use strict transport/security headers in deployment.
 
+Reflection content carries additional client rules:
+
+- Reflection text is sent to exactly one endpoint, the classification endpoint, and to no other. It is never included in a navigator request, an analytics event, or an error report.
+- The classification response contains a verdict only. A client that receives content back from that endpoint must treat the response as invalid and enter the terminal escalation state.
+- Reflection text is never written into a DOM `data-` attribute, `aria-label`, CSS selector, document title, or query parameter.
+- Reflection state is dropped on module exit, refresh, tab close, and clear-session, with no recovery path offered.
+
 These controls support the backend architecture's NDPA requirements: data minimisation, purpose limitation, consent/lawful-basis transparency, retention control, access separation, and review of any offshore provider transfer. Frontend consent copy cannot substitute for the organisation's privacy notice or DPO approval.
 
 ## 13. Copy deck for review
@@ -337,6 +435,38 @@
 
 The same visible copy and layout must be used for classifier escalation, output-guard rejection, timeout, backend 5xx, malformed response, and network failure. The client does not expose which internal path occurred.
 
+### Workplace wellness provenance
+
+**Policy group label:** `From your organisation's policy`
+
+**General group label:** `General workplace guidance - not your organisation's policy`
+
+**No organisational source:** `Your organisation hasn't published guidance on that. I can't answer it from general material, because that wouldn't tell you what your organisation actually provides. [NAMED HUMAN ROLE] can confirm it through [ORG-APPROVED CHANNEL].`
+
+### Self-help library and modules
+
+**Library heading:** `Self-help modules`
+
+**Library framing:** `These are written materials you read on your own. Nothing you write in them is answered, kept, or shared.`
+
+**Category labels:** situation-based only, for example `Sleep and rest`, `Workload and capacity`, `Working with others`, `After time away`. No category is named for an emotion or a condition.
+
+**Card metadata:** `[N] minutes to read` and `What this is based on`
+
+**Suitability notice:** `This module isn't suitable if [CLINICAL EXCLUSIONS]. If that's where you are right now, contact [NAMED HUMAN ROLE] through [ORG-APPROVED CHANNEL] instead.`
+
+**Reflection field label:** the module's own closed prompt, shown verbatim.
+
+**Reflection field help text:** `This stays on your device and isn't answered or kept. It's checked for safety signals and then discarded.`
+
+**Reflection accepted:** no copy. The absence is deliberate and is specified in §7.
+
+**Module exit heading:** `You've reached the end of this module`
+
+**Module exit body:** `You can go back to the library, or talk to a person. [NAMED HUMAN ROLE] is available through [ORG-APPROVED CHANNEL].`
+
+There is deliberately no copy for encouragement, completion, congratulation, streaks, progress, or a prompt to return. Copy review should treat any proposal to add such wording as a scope change requiring the same review as the original layer.
+
 ### Turn limit
 
 **Approaching:** `[N] navigator questions remaining in this session.`
@@ -388,6 +518,20 @@
 6. **Browser “offline” detection is not a safety oracle.** It is only a UX signal. The request timeout, invalid response, and backend failure paths must independently enter the same human route.
 7. **A delivered notification is not proof of a completed handoff.** The client must show only explicitly confirmed operational status, while the backend and named human owner manage acknowledgement and backup escalation. Product analytics must not track whether an employee obtained care.
 
+### Drift risks specific to the content layers
+
+8. **Workplace wellness content drifting from citation into advice.** The layer is retrieval, but the material is closer to advice than a coverage table is, and a model asked "what should I do about my workload?" will readily compose a plan. What prevents it: the answer must remain a cited navigation response, the output guard rejects individuated plans and second-person instruction, and the empty-retrieval rule holds for partial matches so general material is never substituted for absent policy. The warning sign is an answer that reads as useful without any citation carrying it.
+
+9. **Reflection prompts drifting open.** A closed prompt ("note the time you stopped working yesterday") is one edit away from an open one ("how did that feel?"). The open version will test better, because people find it more satisfying, and that is precisely the problem. What prevents it: prompt constraints are part of the module format and therefore part of clinical review, not a copy decision; a module containing an open prompt fails review rather than shipping and being tuned later.
+
+10. **A cleared reflection acquiring a response.** The strongest pull in the whole design is toward acknowledging what someone wrote, because silence feels cold. Any acknowledgement makes the field a conversation with one turn removed, and the next request will be for a second turn. What prevents it: §7 specifies the empty response as the contract, and a test asserts the absence of any acknowledgement, status text, or live-region announcement.
+
+11. **Manager guidance becoming a route around escalation.** Covered in the architecture document; the frontend contribution is that manager guidance has no free-text entry and is reached by browsing. The warning sign is any proposal to add "describe the situation" to that surface.
+
+12. **The library becoming a recommender.** "Based on what you said, try this module" is the single most likely feature request, and it requires modelling a person's emotional state from their disclosures — the exact capability the layer was created to avoid. What prevents it: module selection is browse-only, the keyword filter never leaves the client, and no conversation state may influence module ordering.
+
+13. **No scoring, streaks, nudges, or mood-trend charts.** These are excluded deliberately, and each for its own reason. *Scoring* implies a clinical measurement the service is not qualified to make and invites self-diagnosis from a number. *Streaks* manufacture engagement, when the product's success condition is that a person reaches a counsellor rather than keeps using the app. *Completion nudges* create obligation and reframe not returning as failure, which is a poor thing to tell someone who is struggling. *Mood-trend charts* require longitudinal mood data — the most sensitive store the system could hold — and imply the service is tracking clinical progress it cannot assess. All four convert absence of use into a signal about a person, which §6 of the architecture document already forbids for escalation metrics; there is no reason the rule should be weaker here. The organisation will nonetheless want engagement figures, which is why this is raised as a stakeholder question rather than left as an internal assumption.
+
 ## 16. Implementation order
 
 1. OpenAPI contract validation, Zod generation/check, MSW fixtures, and in-memory state machine.
@@ -395,5 +539,9 @@
 3. Plain chat surface, cited answers, refusals, bounded shortcuts, and turn-limit conclusion.
 4. Onboarding, separate consent, privacy summary, and clear-session/server termination.
 5. Privacy/security checks, offline/slow states, accessibility hardening, bundle analysis, and visual polish.
+6. Provenance rendering for workplace wellness citations, including the no-organisational-source state.
+7. Library browse, module reader, suitability notice, evidence basis panel, and module exit.
+8. Reflection field with classification, the empty-response contract, and its no-storage tests.
+9. Manager general guidance, last, after the manager laundering cases pass.
 
 No implementation code should be added until this document and the copy deck are reviewed.
```
