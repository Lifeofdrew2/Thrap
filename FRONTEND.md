# Employee Wellbeing Navigation Agent Frontend

Status: **Frontend architecture review required; implementation intentionally not started**

## 1. Product boundary

This is a service directory with a constrained conversational input. It helps an employee find approved wellbeing resources, understand organisation-provided coverage and confidentiality policy, request a counsellor booking, find approved self-help material, or contact a designated human role.

It is not a therapist, crisis service, diagnostic tool, medical adviser, medication adviser, or emotional companion. The UI must not invite disclosure, reward prolonged use, imply that the system listens or cares, or present a persona. No name, avatar, typing indicator, thinking animation, emotional check-in, streak, rating prompt, or open-ended “tell me more” copy is permitted.

Two content surfaces extend this without changing it: a **workplace wellness** extension to what the navigator may cite, and a **structured self-help library** that is a reading surface rather than a conversation. Neither is a companion feature. The reasoning is recorded in [WELLBEING_AGENT_SCOPE_RECOMMENDATION.md](WELLBEING_AGENT_SCOPE_RECOMMENDATION.md).

The reading surfaces have no composer, and nothing a person writes into them produces a reply.

The primary design objective is **trust through clear limits, provenance, privacy, and a reliable human route**.

## 2. Frontend invariants

These rules are enforced in component boundaries and tests, not only in copy:

1. A response that is an escalation, backend failure, timeout, network failure, invalid contract, or unavailable configuration renders the same `EscalationScreen` state.
2. The escalation state is terminal for the current session. It cannot be dismissed, collapsed, retried with the agent, or silently scrolled away.
3. The named human role and approved channel are the largest primary action on that screen.
4. The composer is disabled and has no invitation to continue typing.
5. No agent message is rendered optimistically. A normal reply appears only after a successful, validated response.
6. No factual answer renders without citations. In development, an uncited factual response is a visible defect and a test failure; in production it routes to escalation.
7. Every state has a human route. There is no generic error-only state.
8. No conversation content is written to localStorage, sessionStorage, IndexedDB, URL parameters, browser history, analytics, telemetry, console output, or third-party services.
9. Refusing identified-processing consent does not disable anonymous navigation.
10. The turn limit concludes the session; it cannot be bypassed by starting another chat from the same client flow.
11. Presented content is never conversation. The module reader and the guidance reader have no composer, no reply region, and no affordance implying the system will respond to what a person writes.
12. A reflection never produces a response. Submitting one changes the interface only by accepting it. It never renders an acknowledgement, interpretation, summary, encouragement, or follow-up prompt.
13. Reflection content never persists. It is not written to storage, URLs, logs, analytics, or error reports, and it is never sent to the model provider.
14. Citation provenance is always visible. Organisation policy and general guidance are grouped and labelled separately, and never distinguished by colour alone.
15. No surface contains scoring, progress tracking, streaks, completion nudges, reminders, or trend visualisation of any kind.

## 3. Proposed repository shape

```text
src/
  app/
    App.tsx
    routes.tsx
    client-config.ts       Local human-route fallback and public settings
  api/
    client.ts              Fetch wrapper with timeout and no content logging
    schemas.ts             Zod schemas generated/validated from OpenAPI
    types.ts               Inferred contract types only
  components/
    AppShell.tsx
    PrivacySummary.tsx
    HumanRouteControl.tsx
    OnboardingScreen.tsx
    ConsentStep.tsx
    EmptyStateShortcuts.tsx
    ConversationView.tsx
    MessageList.tsx
    UserMessage.tsx
    AgentAnswer.tsx
    CitationList.tsx
    RefusalNotice.tsx
    EscalationScreen.tsx
    TurnLimitNotice.tsx
    Composer.tsx
    ClearSessionButton.tsx
    OfflineBanner.tsx
    ProvenanceGroup.tsx    Citation grouping by organisation policy vs general guidance
    library/
      LibraryScreen.tsx
      CategoryList.tsx
      ModuleCard.tsx
      EvidenceBasisPanel.tsx
    reader/
      ModuleReader.tsx
      ModuleSection.tsx
      SuitabilityNotice.tsx
      ReflectionField.tsx
      ModuleExitScreen.tsx
  state/
    session-machine.ts     Explicit state machine, no optimistic safety state
    session-store.ts       In-memory store only
    selectors.ts
  hooks/
    useSession.ts
    useSubmitMessage.ts
    useClearSession.ts
  styles/
    index.css
  main.tsx
  test-utils/
    server.ts              MSW setup
    fixtures.ts
mocks/
  handlers.ts
public/
  ...
tests/
  unit/
  integration/
  e2e/
  a11y/
openapi/
  backend.openapi.json    Generated or checked-in backend contract
playwright.config.ts
vitest.config.ts
vite.config.ts
```

The API contract is generated from the backend OpenAPI schema or checked in as a versioned generated artifact. Zod schemas are generated from that contract where practical; handwritten additions may wrap generated schemas but must not duplicate backend shapes silently. A CI check detects schema drift.

## 4. Component architecture

`AppShell` owns the persistent privacy summary link, the always-visible `Talk to a person` control, and the session lifecycle. It never owns message interpretation.

`OnboardingScreen` is shown on first use for the current browser session. It states the service limits, recording model, and human route before input is available. `ConsentStep` is a separate, unbundled decision. Accepting permits only the specifically named identified-processing purpose; refusing keeps the anonymous route available. Neither control is preselected.

`ConversationView` renders either the empty-state shortcut directory or the bounded conversation. `MessageList` renders ordinary user messages and validated answers. `AgentAnswer` requires citations for factual content. `RefusalNotice` is a non-chat policy response with a human route. `TurnLimitNotice` transitions to a terminal conclusion rather than adding another prompt.

`EscalationScreen` is the only renderer for all safety and availability failures. It is not a chat bubble and is not inside a dismissible dialog. It occupies the main content region, uses an assertive live region, focuses its heading on entry, and keeps the primary human route visible without scrolling. It may include a secondary “Clear session” action, but never an agent retry.

`Composer` is enabled only in `READY` and bounded `SUBMITTING` states. It is disabled for `ESCALATED`, `TURN_LIMIT_REACHED`, `OFFLINE_UNAVAILABLE`, and `SESSION_CLEARED`. A disabled composer must not suggest that typing could change the outcome.

`ClearSessionButton` calls the server session-termination endpoint, clears the in-memory store, removes any in-memory query cache, and returns to onboarding. On a failed termination request, it still clears local state and shows the human route; the failure is represented in the audit-safe operational path, not by retaining content locally.

`HumanRouteControl` is available from onboarding, the empty state, the privacy summary, normal answers, refusals, offline state, and turn-limit state. It triggers the backend `TALK_TO_SOMEONE_NOW` route when available, but its local configured fallback remains visible if the request cannot complete.

The frontend must not claim or imply that a human has seen the request or that the employee has reached care. It may show a backend-confirmed notification status only when the contract explicitly permits that message and the wording has been reviewed. A notification failure, timeout, or missing acknowledgement keeps the terminal human route visible and is surfaced to the configured operational path; it never reopens the agent conversation.

### Reading surfaces

`LibraryScreen` presents categories and module cards. Categories are labelled by situation, never by emotional state or condition: "Sleep and rest", "Workload and capacity", "Working with others", "After time away". There is no field that asks what is wrong, and no recommender. A card shows title, purpose, estimated reading time, and a link to its evidence basis.

An optional keyword filter may narrow the visible cards. It matches module titles and tags only, runs entirely in the client, and is never transmitted or classified, because it never leaves the browser. If that ever ceases to be true, the filter becomes a disclosure channel and must be removed.

`ModuleReader` renders one module. `SuitabilityNotice` shows the module's `not_suitable_for` list and `alternative_route` **before** the body, not after it. `EvidenceBasisPanel` exposes approach, sources, strength, limitations, and the clinical review record; it is reachable from the card and from inside the module.

`ReflectionField` accepts text against a single closed prompt. On submit it sends the text for classification and nothing else happens on success: the field shows the text as accepted, and no message, tick, encouragement, or next prompt appears. It is the one component where doing nothing visible is the specification rather than an omission.

`ModuleExitScreen` closes a module. It offers the human route, a return to the library, and nothing that invites a person to say how the module went. There is no rating, no "was this helpful?", and no free-text feedback field, because feedback about a wellbeing module is disclosure by another name.

`ProvenanceGroup` renders citations in two labelled groups: organisation policy, and general guidance marked as not organisation policy. Where only general guidance supports an answer, the label is the primary signal, not a footnote.

The reader surfaces are routes distinct from the conversation. A person cannot be in a module and in the navigator conversation simultaneously, and entering the library consumes no navigator turn.

### Dependency budget

Use React, React DOM, TypeScript, Vite, Tailwind, TanStack Query, Zod, MSW, Vitest, Testing Library, and Playwright as required by the stack. Bundle analysis is a release check. Any additional dependency estimated above 30 KB compressed must have a written reason, measured impact, and an accessibility/security review. Prefer platform APIs for focus, clipboard, storage prohibition, and network status.

## 5. State model

Use an explicit discriminated union or state machine. TanStack Query manages request lifecycle and cache metadata, but it must not decide safety states implicitly.

```text
ONBOARDING
  -> CONSENT_REQUIRED
  -> READY_ANONYMOUS
  -> READY_IDENTIFIED       only after explicit consent

READY_ANONYMOUS / READY_IDENTIFIED
  -> SUBMITTING
  -> HUMAN_ROUTE_REQUESTING
  -> CLEARING

SUBMITTING
  -> READY_*                only for a validated normal response
  -> ESCALATED              escalation response, invalid response, timeout,
                            network error, 5xx, provider-unavailable result,
                            or output-guard result
  -> TURN_LIMIT_REACHED     when server reports the final permitted turn

HUMAN_ROUTE_REQUESTING
  -> ESCALATED              successful or failed request; local human route
                            is always available

READY_* / TURN_LIMIT_REACHED / ESCALATED
  -> CLEARING
  -> ONBOARDING             after local state is cleared

READY_*
  -> LIBRARY_BROWSING       browse categories; consumes no navigator turn

LIBRARY_BROWSING
  -> MODULE_READING
  -> READY_*

MODULE_READING
  -> REFLECTION_CHECKING    free text submitted for classification
  -> MODULE_EXIT
  -> ESCALATED

REFLECTION_CHECKING
  -> MODULE_READING         verdict clear; reflection accepted silently
  -> ESCALATED              verdict escalate, classifier failure, timeout,
                            network error, or any non-clear response

MODULE_EXIT
  -> LIBRARY_BROWSING
  -> READY_*
  -> ESCALATED
```

`REFLECTION_CHECKING` is bounded and fails closed on every non-clear outcome, including a malformed or unrecognised verdict. It is the only state in the application whose successful resolution is invisible to the person: a cleared reflection returns to `MODULE_READING` with no announcement.

Library and reader states hold no message content and no navigator turn state. Reflection text lives in component state for the life of the module view and is dropped on exit, refresh, or clear-session.

The client may keep only non-content session state in memory: session reference, consent status, turn count, current intent, terminal status, contract version, and correlation ID. Message content exists only in active React memory long enough to render the current page and make the API request. A full page refresh therefore intentionally loses conversation content.

TanStack Query cache persistence is disabled. Query retries are disabled for message submission and safety-relevant endpoints. A slow request shows a neutral progress state without “thinking” language; once the request timeout is reached, the UI renders `EscalationScreen` using local fallback configuration.

## 6. API contract boundary

The backend response envelope must distinguish safe navigation data from terminal escalation without requiring the client to interpret free text. Suggested contract categories:

```ts
// Generated from OpenAPI; illustrative shape, not a handwritten source of truth.
type ServiceResponse =
  | { kind: "answer"; message: string; citations: Citation[]; turn: TurnState }
  | { kind: "refusal"; message: string; humanRoute: HumanRoute; turn: TurnState }
  | { kind: "escalation"; message: string; humanRoute: HumanRoute; reasonCode: string }
  | { kind: "turn_limit"; message: string; humanRoute: HumanRoute; turn: TurnState };
```

`HumanRoute` contains a named `role`, approved `channelLabel`, an action target or safe display instruction, and a correlation ID. The local fallback config contains the reviewed role and channel label, never an invented number or provider. Production startup/build validation rejects missing human-role configuration.

A response that fails Zod validation is not partially rendered. The client records an error code/correlation ID without content, then enters `ESCALATED`. A successful HTTP status is not sufficient: schema validation and response-kind policy must pass first.

Request cancellation is supported when clearing a session, but cancellation never re-enables the composer until the session state is known. The API client has bounded timeouts, an `AbortController`, `cache: "no-store"` where appropriate, and no request/response logging.

MSW handlers cover normal answers, cited answers, refusals, each escalation reason, malformed JSON, schema mismatch, 4xx, 5xx, delayed response, aborted response, and network failure. They are used by Vitest and Playwright without live model/provider calls.

## 7. Response-state matrix

| Backend/client state | User-visible treatment | Composer | Human route | Citation requirement |
|---|---|---|---|---|
| Empty, anonymous | Directory shortcuts and service limits | Enabled after framing | Persistent, one tap | None |
| Normal navigator answer | Plain answer, not persona chat | Enabled if turns remain | Persistent | Must show source document and section |
| Cited factual answer | Answer plus visibly grouped citations below it | Enabled if turns remain | Persistent | Required; missing citation is a defect |
| In-scope refusal | Plain refusal with available navigator options | Enabled only for a new bounded navigation request | Persistent and in refusal | None unless factual claims appear |
| Crisis classifier escalation | `EscalationScreen`, assertive announcement | Disabled | Named role/channel is primary | No generated crisis advice |
| Output-guard rejection | Same `EscalationScreen` | Disabled | Same local/backend route shape | No draft shown |
| Classifier timeout/error | Same `EscalationScreen` | Disabled | Same route shape | No partial response |
| Backend 5xx | Same `EscalationScreen` | Disabled | Local fallback route | No generic error |
| Network failure/offline | Same `EscalationScreen` plus concise connection status | Disabled | Local fallback route | No partial response |
| Malformed/invalid response | Same `EscalationScreen` | Disabled | Local fallback route | No partial response |
| Turn limit approaching | Visible count/status near composer; no engagement prompt | Enabled until final permitted turn | Persistent | Normal answer rules apply |
| Turn limit reached | Terminal conclusion screen with human route | Disabled | Primary | No further agent response |
| Human-route request succeeds | Terminal `EscalationScreen` | Disabled | Named role/channel | Not applicable |
| Human-route request fails | Still terminal `EscalationScreen` using local route | Disabled | Local route is primary | Not applicable |
| Human-route notification pending/failed | Same terminal `EscalationScreen`; optional reviewed status only | Disabled | Local route and backup instruction are primary | Not applicable |
| Consent refused | Anonymous directory/navigation remains | Enabled for anonymous-safe routes | Persistent | Backend decides data availability |
| Session cleared | Onboarding/framing screen | Disabled until framing complete | Visible from onboarding | None |
| Workplace wellness answer, organisation policy | Plain answer with policy citation group | Enabled if turns remain | Persistent | Required; provenance shown as organisation policy |
| Workplace wellness answer, general guidance only | Plain answer, citations grouped and labelled as general guidance, not organisation policy | Enabled if turns remain | Persistent | Required; the not-policy label is primary, not a footnote |
| Workplace wellness answer, mixed provenance | Two visibly separate, separately labelled citation groups | Enabled if turns remain | Persistent | Required per claim |
| Policy question, only general guidance retrieved | States the organisation has not published an answer; general material is not substituted | Enabled | Primary | No citation; substitution is a defect |
| Manager general guidance | Presented document in the reader surface; no composed advice | No composer in reader | Persistent | Document provenance shown |
| Manager input naming or identifying a person | `EscalationScreen` | Disabled | Named role/channel is primary | None |
| Library browsing | Category list and module cards | No composer on this surface | Persistent | Not applicable |
| Module opened | Suitability notice and alternative route shown before the body | No composer | Persistent | Evidence basis reachable |
| Module reading | Sections and closed reflection prompts | No composer | Persistent | Not applicable |
| Reflection accepted | Text shown as accepted; nothing else changes | Not applicable | Persistent | None |
| Reflection classified as crisis | `EscalationScreen` | Not applicable | Named role/channel is primary | None |
| Reflection classification fails, times out, or returns an unknown verdict | Same `EscalationScreen` | Not applicable | Local fallback route | None |
| Module exit | Terminal-for-the-module exit screen with human route | No composer | Primary | None |

The reflection rows deserve particular attention. A cleared reflection produces **no** visible system response beyond the field accepting the text. Any addition here — a tick, a "saved", a "thank you for reflecting", a next-step suggestion — reintroduces the acknowledgement loop the layer exists to prevent, and must be treated as a defect rather than a polish opportunity.

The crisis, guard, timeout, backend-error, and network-failure rows must be visually and structurally identical except for non-user-visible telemetry. The user may see a short connection-status sentence in the network case only if it does not replace or weaken the human route; the escalation card, heading, primary action, disabled composer, and no-retry rule remain identical.

## 8. Crisis/escalation rendering and tests

This is the first implementation slice. Styling beyond basic layout waits until these tests pass.

The `EscalationScreen` must:

- render as a full main-content state with a distinct alert treatment, never a chat bubble;
- put the named human role and approved channel in the largest interactive control;
- use an `aria-live="assertive"` region and move focus to its heading;
- keep the state present without a dismiss, collapse, close, or silent-scroll affordance;
- disable or remove the composer and expose no agent retry;
- retain the route after viewport changes and on small screens;
- support keyboard activation, visible focus, and a non-colour-only distinction;
- use local fallback route data when the API is unavailable;
- avoid exposing the backend reason code or classifier details to the employee.

Playwright critical paths must cover at least:

1. classifier escalation;
2. output-guard escalation;
3. classifier timeout;
4. backend timeout;
5. backend 5xx;
6. malformed response/schema validation failure;
7. network failure/offline;
8. failed human-route request with local fallback;
9. successful normal response followed by a safety escalation;
10. keyboard and screen-reader-visible focus/announcement assertions;
11. mobile viewport assertion that the primary human route is visible without silent scrolling;
12. absence of retry/dismiss/composer controls in every terminal path.

Playwright must additionally cover the content layers:

13. a reflection containing crisis language routes to the same `EscalationScreen` as a navigator message, from inside a module;
14. a cleared reflection produces no acknowledgement, no status text, and no new live-region announcement;
15. reflection classification timeout, 5xx, and unknown verdict each render the terminal escalation state;
16. no module surface renders a composer, a retry-with-agent control, or a reply region;
17. a manager free-text input naming a person escalates, from every surface that accepts free text;
18. an answer supported only by general guidance renders the not-organisation-policy label, and a policy question with no organisational source renders the no-answer state rather than substituting general material;
19. module suitability and alternative route are announced before the module body in DOM order and to a screen reader;
20. reflection text does not appear in `localStorage`, `sessionStorage`, IndexedDB, the URL, the document title, the DOM outside its field, or any network request other than the classification call;
21. exiting a module always exposes the human route;
22. a page refresh inside a module discards reflection text and does not restore it.

The tests should use the same fixture data for all terminal paths and assert the same accessible structure, not merely matching text. No test should rely on a real network, provider, analytics service, or browser storage.

## 9. Chat surface and interaction design

The empty state is a compact service directory, not a welcome conversation. Four prominent shortcuts are provided: `Check coverage`, `Book a counsellor`, `Confidentiality`, and `Self-help resources`. Each shortcut submits a known intent without requiring emotional disclosure. A short service-limits statement remains visible near the input.

The composer has a plain label such as `Ask about an approved wellbeing service`. It has a character limit, submit button, disabled state, and accessible error state. It does not use placeholder text that asks how the user feels or invites a story. User messages may be shown during the active session but are never persisted.

Factual responses display a citation group beneath the answer, with source document title, section, and version/date as provided by the backend. Citations are links only when the backend supplies an approved safe target; otherwise they are text references. Retrieved document text is not dumped into the UI by default.

The turn-limit indicator is quiet and factual, for example `2 navigator questions remaining in this session`. It becomes visible before the final permitted turn based on backend-provided state. At the limit, the UI says the navigation session has ended and presents the human route. It never offers “start a new chat”.

A persistent `Talk to a person` control is available in the app shell and remains one tap away on mobile. It must trigger the bounded human-route intent, not open a new free-text conversation.

## 10. Onboarding, consent, and privacy UI

### First-run framing

The first screen contains four short sections:

- **What this service can do:** find approved resources, explain organisation-provided policy, help request a booking, and connect the user to a person.
- **What it cannot do:** it is not a therapist, crisis service, diagnostic service, or medical adviser.
- **Who to contact instead:** `[NAMED HUMAN ROLE]` through `[ORG-APPROVED CHANNEL]`; immediate-danger wording is approved by the organisation before release.
- **What is recorded:** anonymous navigation is not stored as identifiable conversation; identified processing occurs only after the separate consent choice; operational escalation records and retention are explained plainly.

The user must acknowledge the framing to enter the service, but acknowledgement is not consent for identified processing.

### Consent

The consent screen has separate `Allow identified processing` and `Continue without identified processing` actions, both unselected initially. The notice names the purpose, categories of data, retention placeholder, human access, withdrawal path, and any offshore provider transfer. Refusal leaves coverage/policy/resource navigation available anonymously. Features that truly require identity, such as booking or escalation contact details, explain the limitation at the point of use and offer the human route.

A privacy summary is reachable from the shell, onboarding, consent, conversation, and terminal states. It opens as a full accessible page or non-dismissible route, not a buried footer. It contains the short summary and a link/reference to the approved full notice.

`Clear session` is prominent in the shell and privacy summary. It ends the server session, clears all active React state and TanStack Query cache, removes no content because none was persisted, and returns to onboarding. Browser back navigation must not restore a rendered conversation; the app must avoid putting message content in URLs or document titles.

## 11. Accessibility and resilience

Target WCAG 2.1 AA:

- semantic landmarks, one meaningful page heading, logical heading order;
- keyboard access for shortcuts, composer, citations, human route, privacy, and clear session;
- visible focus indicators and touch targets suitable for mobile;
- text and status not conveyed by colour alone;
- labels and error descriptions associated with controls;
- assertive live announcement and focus management for escalation;
- reduced-motion CSS path with no required animation;
- zoom/reflow and narrow viewport tests;
- no horizontal scrolling for terminal or consent states;
- screen-reader tests for the crisis heading, role/channel action, disabled composer, and terminal status.

The offline banner is factual and brief. It never says only `Something went wrong`; it always includes the local human route. Slow requests show a static status such as `Connecting to the service` and then the same terminal escalation route at timeout. Safety-relevant results are never optimistic.

## 12. Privacy and security implementation rules

- Do not use localStorage, sessionStorage, IndexedDB, URL query/hash state, service-worker caches, or persisted TanStack Query cache for message content.
- Use `Cache-Control: no-store` for session-sensitive API responses where supported.
- Do not set document titles, analytics labels, DOM data attributes, CSS classes, or accessibility labels from message content.
- Do not log content at any console level, including development diagnostics. Error reporting, if later approved, sends only allowlisted error codes and correlation IDs.
- Do not load third-party analytics, tag managers, session replay, advertising, remote fonts, or unreviewed external scripts.
- Treat any browser or network diagnostic containing request bodies as a release-blocking defect.
- Clear in-memory content on tab close, refresh, terminal escalation, and explicit clear-session according to the reviewed policy.
- Keep API responses same-origin where possible and use strict transport/security headers in deployment.

Reflection content carries additional client rules:

- Reflection text is sent to exactly one endpoint, the classification endpoint, and to no other. It is never included in a navigator request, an analytics event, or an error report.
- The classification response contains a verdict only. A client that receives content back from that endpoint must treat the response as invalid and enter the terminal escalation state.
- Reflection text is never written into a DOM `data-` attribute, `aria-label`, CSS selector, document title, or query parameter.
- Reflection state is dropped on module exit, refresh, tab close, and clear-session, with no recovery path offered.

These controls support the backend architecture's NDPA requirements: data minimisation, purpose limitation, consent/lawful-basis transparency, retention control, access separation, and review of any offshore provider transfer. Frontend consent copy cannot substitute for the organisation's privacy notice or DPO approval.

## 13. Copy deck for review

These are proposed product words, deliberately plain. Organisation-specific values remain placeholders.

### Service framing

**Heading:** `Wellbeing service navigation`

**Can do:** `Find approved wellbeing resources, explain your organisation's support policies, help request a counsellor booking, and connect you to a person.`

**Cannot do:** `This service is not a therapist, crisis service, diagnostic service, or medical adviser. It cannot assess emergencies or provide treatment or medication advice.`

**Human route:** `For personal support or anything this service cannot handle, contact [NAMED HUMAN ROLE] through [ORG-APPROVED CHANNEL].`

### Consent

**Heading:** `Choose how your information is used`

**Body:** `You can use anonymous navigation for approved resource and policy information. Identified processing is a separate choice used only for [APPROVED PURPOSE]. It may involve [APPROVED DATA CATEGORIES] and is kept for [RETENTION PERIOD].`

**Primary choice:** `Allow identified processing`

**Refusal choice:** `Continue without identified processing`

**Privacy link:** `Read the privacy summary`

### Normal navigation

**Composer label:** `Ask about an approved wellbeing service`

**Human control:** `Talk to a person`

**No result:** `I couldn't find an approved answer in the organisation's current support information. I can't fill that gap from general information. Here's who can help: [NAMED HUMAN ROLE] through [ORG-APPROVED CHANNEL].`

### Refusal

`I can't help with diagnosis, treatment, medication guidance, or therapy exercises. I can help you find an approved service or connect you with [NAMED HUMAN ROLE] through [ORG-APPROVED CHANNEL].`

### Escalation / unavailable service

**Heading:** `Please contact a person`

**Body:** `I can't help with this safely here, but [NAMED HUMAN ROLE] can help. Contact them through the approved channel below.`

**Primary action label:** `Contact [NAMED HUMAN ROLE] via [APPROVED CHANNEL]`

**Immediate danger line, pending review:** `If anyone is in immediate danger, follow your organisation's approved emergency instructions: [APPROVED INSTRUCTION].`

**Terminal note:** `This navigation session is closed. Please use the human route above.`

The same visible copy and layout must be used for classifier escalation, output-guard rejection, timeout, backend 5xx, malformed response, and network failure. The client does not expose which internal path occurred.

### Workplace wellness provenance

**Policy group label:** `From your organisation's policy`

**General group label:** `General workplace guidance - not your organisation's policy`

**No organisational source:** `Your organisation hasn't published guidance on that. I can't answer it from general material, because that wouldn't tell you what your organisation actually provides. [NAMED HUMAN ROLE] can confirm it through [ORG-APPROVED CHANNEL].`

### Self-help library and modules

**Library heading:** `Self-help modules`

**Library framing:** `These are written materials you read on your own. Nothing you write in them is answered, kept, or shared.`

**Category labels:** situation-based only, for example `Sleep and rest`, `Workload and capacity`, `Working with others`, `After time away`. No category is named for an emotion or a condition.

**Card metadata:** `[N] minutes to read` and `What this is based on`

**Suitability notice:** `This module isn't suitable if [CLINICAL EXCLUSIONS]. If that's where you are right now, contact [NAMED HUMAN ROLE] through [ORG-APPROVED CHANNEL] instead.`

**Reflection field label:** the module's own closed prompt, shown verbatim.

**Reflection field help text:** `This stays on your device and isn't answered or kept. It's checked for safety signals and then discarded.`

**Reflection accepted:** no copy. The absence is deliberate and is specified in §7.

**Module exit heading:** `You've reached the end of this module`

**Module exit body:** `You can go back to the library, or talk to a person. [NAMED HUMAN ROLE] is available through [ORG-APPROVED CHANNEL].`

There is deliberately no copy for encouragement, completion, congratulation, streaks, progress, or a prompt to return. Copy review should treat any proposal to add such wording as a scope change requiring the same review as the original layer.

### Turn limit

**Approaching:** `[N] navigator questions remaining in this session.`

**Reached:** `This navigation session has reached its limit and is now closed. For further help, contact [NAMED HUMAN ROLE] through [ORG-APPROVED CHANNEL].`

### Offline / slow connection

`The service is unavailable right now. Your message was not sent. Please use the human route below: [NAMED HUMAN ROLE] through [ORG-APPROVED CHANNEL].`

### Clear session

**Button:** `Clear session`

**Confirmation:** `Clear this session from this device and end the server session? The conversation will not be recoverable here.`

**After:** `Session cleared. No conversation is shown on this device.`

Copy review must confirm that “contact” actions are appropriate for the approved channel. The application must not invent Nigerian provider names, hotline numbers, coverage terms, operating hours, or emergency instructions.

## 14. Testing and release gates

Unit and integration tests use Vitest and React Testing Library for state transitions, contract validation, citation enforcement, consent branching, no-storage guarantees, clear-session behaviour, copy boundaries, and keyboard/focus behaviour. MSW provides deterministic API fixtures.

Playwright covers the critical terminal paths listed above on desktop and a mid-range mobile viewport, including offline mode, delayed responses, 5xx, malformed contracts, refresh/back navigation, keyboard operation, reduced motion, and accessibility assertions. A small bundle-size check runs in CI.

Post-escalation tests also cover notification pending, notifier failure, missing human acknowledgement, backup-route presentation, and duplicate submission/idempotency behaviour. They assert that the UI never says or implies that help was reached, never exposes internal reason codes, never reopens the composer, and preserves the human route while the operational handoff is unresolved. The frontend consumes delivery/acknowledgement status only as an explicit typed contract; it does not poll for or infer clinical outcomes.

Release is blocked unless:

- crisis rendering tests pass before visual polish is merged;
- every terminal/error path has a human route and no retry-with-agent affordance;
- the generated/validated OpenAPI contract and Zod schemas agree;
- no content reaches browser storage, URL, console, analytics, or error reporting;
- consent refusal preserves anonymous navigation;
- citations are present for every factual answer;
- accessibility checks pass at mobile and desktop viewports;
- all placeholders have approved organisation values before production;
- privacy/DPO review covers client storage, retention, access, and offshore processing;
- the copy deck is approved by the designated human-support and privacy owners.

## 15. Risks and intentionally challenged ideas

1. **Local fallback human-route config is necessary but dangerous.** A stale role or channel could misroute a user. It must be versioned, reviewed, environment-specific, and validated at build/startup; it should be treated as a safety-critical configuration artifact.
2. **One terminal UI for every error reduces diagnostic transparency for employees.** That is intentional for safety consistency, but operators still need correlation IDs and separate audit-safe reason codes outside the user-visible response.
3. **Keeping all conversation content in memory protects shared devices but makes refresh destructive.** This is an acceptable tradeoff for this product; the UI must state it plainly rather than add persistence that undermines privacy.
4. **A frontend output check cannot guarantee that a factual answer is true.** The backend must enforce retrieval and citations; the client only rejects missing/invalid contract evidence and never becomes a second clinical or factual model.
5. **A persistent human control may increase routine escalation volume.** That is preferable to trapping users in automation, but the organisation needs a handoff SLA, ownership, and capacity plan before launch.
6. **Browser “offline” detection is not a safety oracle.** It is only a UX signal. The request timeout, invalid response, and backend failure paths must independently enter the same human route.
7. **A delivered notification is not proof of a completed handoff.** The client must show only explicitly confirmed operational status, while the backend and named human owner manage acknowledgement and backup escalation. Product analytics must not track whether an employee obtained care.

### Drift risks specific to the content layers

8. **Workplace wellness content drifting from citation into advice.** The layer is retrieval, but the material is closer to advice than a coverage table is, and a model asked "what should I do about my workload?" will readily compose a plan. What prevents it: the answer must remain a cited navigation response, the output guard rejects individuated plans and second-person instruction, and the empty-retrieval rule holds for partial matches so general material is never substituted for absent policy. The warning sign is an answer that reads as useful without any citation carrying it.

9. **Reflection prompts drifting open.** A closed prompt ("note the time you stopped working yesterday") is one edit away from an open one ("how did that feel?"). The open version will test better, because people find it more satisfying, and that is precisely the problem. What prevents it: prompt constraints are part of the module format and therefore part of clinical review, not a copy decision; a module containing an open prompt fails review rather than shipping and being tuned later.

10. **A cleared reflection acquiring a response.** The strongest pull in the whole design is toward acknowledging what someone wrote, because silence feels cold. Any acknowledgement makes the field a conversation with one turn removed, and the next request will be for a second turn. What prevents it: §7 specifies the empty response as the contract, and a test asserts the absence of any acknowledgement, status text, or live-region announcement.

11. **Manager guidance becoming a route around escalation.** Covered in the architecture document; the frontend contribution is that manager guidance has no free-text entry and is reached by browsing. The warning sign is any proposal to add "describe the situation" to that surface.

12. **The library becoming a recommender.** "Based on what you said, try this module" is the single most likely feature request, and it requires modelling a person's emotional state from their disclosures — the exact capability the layer was created to avoid. What prevents it: module selection is browse-only, the keyword filter never leaves the client, and no conversation state may influence module ordering.

13. **No scoring, streaks, nudges, or mood-trend charts.** These are excluded deliberately, and each for its own reason. *Scoring* implies a clinical measurement the service is not qualified to make and invites self-diagnosis from a number. *Streaks* manufacture engagement, when the product's success condition is that a person reaches a counsellor rather than keeps using the app. *Completion nudges* create obligation and reframe not returning as failure, which is a poor thing to tell someone who is struggling. *Mood-trend charts* require longitudinal mood data — the most sensitive store the system could hold — and imply the service is tracking clinical progress it cannot assess. All four convert absence of use into a signal about a person, which §6 of the architecture document already forbids for escalation metrics; there is no reason the rule should be weaker here. The organisation will nonetheless want engagement figures, which is why this is raised as a stakeholder question rather than left as an internal assumption.

## 16. Implementation order

1. OpenAPI contract validation, Zod generation/check, MSW fixtures, and in-memory state machine.
2. `EscalationScreen`, local fallback route, terminal-state invariants, and Playwright tests for every safety/error path.
3. Plain chat surface, cited answers, refusals, bounded shortcuts, and turn-limit conclusion.
4. Onboarding, separate consent, privacy summary, and clear-session/server termination.
5. Privacy/security checks, offline/slow states, accessibility hardening, bundle analysis, and visual polish.
6. Provenance rendering for workplace wellness citations, including the no-organisational-source state.
7. Library browse, module reader, suitability notice, evidence basis panel, and module exit.
8. Reflection field with classification, the empty-response contract, and its no-storage tests.
9. Manager general guidance, last, after the manager laundering cases pass.

No implementation code should be added until this document and the copy deck are reviewed.
