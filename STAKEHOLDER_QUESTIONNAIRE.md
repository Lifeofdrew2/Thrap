# Employee Wellbeing Navigation Agent
## Stakeholder questionnaire: ownership, legal review, and clinical copy

**Purpose:** confirm that the proposed navigation service has a real, accountable human safety endpoint before anyone relies on it.

**Requested response owner:** [SPONSOR NAME / ROLE]

**Requested response date:** [DATE]

**Organisation:** [ORGANISATION NAME]

This questionnaire deliberately starts with crisis ownership because the service is only as safe as the human route behind it. We cannot safely release it without a named owner, out-of-hours cover, a backup role, and a response SLA. Please answer with named roles and approved channels, not individual names or phone numbers in this document unless the organisation's privacy process requires them.

Please answer honestly, including **“we don't have that”** where it is true. A gap can be designed around, escalated for a decision, or used to stop the project. It cannot be guessed at or hidden behind an aspirational process.

---

## 1. Decision question: who owns crisis escalation?

### 1.1 Primary owner

- What exact **human role** owns crisis escalation from this service?
- What team or function is accountable for ensuring that role is staffed and trained?
- What approved channel receives an escalation notification?
- During what days and hours is the primary owner actively monitoring that channel?
- What is the target acknowledgement SLA for:
  - an immediate safety concern;
  - a high-risk concern;
  - an elevated but non-immediate concern?
- What does “acknowledged” mean operationally? For example, does it mean the notification was received, assigned, or that a human has made contact?

**Answer:**

- Primary human role: `[REQUIRED]`
- Owning team/function: `[REQUIRED]`
- Approved channel: `[REQUIRED]`
- Monitoring hours/time zone: `[REQUIRED]`
- Acknowledgement SLA: `[REQUIRED]`
- Definition of acknowledgement: `[REQUIRED]`

### 1.2 Out-of-hours cover

- Who owns an escalation at night, on weekends, and on public holidays?
- What happens at 11pm on a Sunday?
- Is there a named backup human role if the primary owner does not acknowledge within the SLA?
- What channel alerts the backup role?
- How is a failed notification, bounced message, unavailable mailbox, or missed SLA detected?
- Who reviews the separate escalation audit record and how quickly?

**Answer:**

- Out-of-hours human role: `[REQUIRED]`
- Backup human role: `[REQUIRED]`
- Out-of-hours channel: `[REQUIRED]`
- Failed-handoff procedure: `[REQUIRED]`
- Audit reviewer: `[REQUIRED]`
- Out-of-hours SLA: `[REQUIRED]`

### 1.3 Capacity and accountability

- What volume of escalations can the human service handle per day and at peak times?
- Who is accountable if that capacity is exceeded?
- What is the process for transferring an escalation between human roles?
- What training and authority does the receiving role have?
- Is there an existing EAP, occupational health, HR, safeguarding, or emergency process this service must follow?
- Does every escalation path terminate at a human role, rather than a channel or number alone?

**Go / no-go decision:**

- [ ] Named owner, backup, hours, and SLA confirmed
- [ ] Existing process and capacity confirmed
- [ ] Failed-handoff procedure confirmed
- [ ] We do not currently have this; design or operating-model work is needed before release

If any answer is not yet available, please say so and name the person who will resolve it. The purpose of this section is to protect employees and the organisation from a service that appears to offer help but routes to nobody accountable.

---

## 2. Legal and privacy thread: offshore model processing

Please route this section to the DPO, privacy counsel, procurement, and information-security owner as appropriate. This question should run in parallel with the operational ownership decision because it may change the architecture.

- May employee text be sent to Anthropic or another offshore LLM provider?
- If yes, for which navigator intents and under what restrictions?
- What lawful basis and transparent notice support that processing?
- What categories of personal or sensitive personal data may be transferred?
- What redaction or minimisation is required before transfer?
- Which processing regions, subprocessors, retention settings, and contractual safeguards are approved?
- Is a data processing agreement, transfer assessment, privacy impact assessment, or other approval required?
- Are there restrictions that require the provider integration to remain disabled in production?
- Can the service operate with deterministic classification, approved retrieval, and fixed human escalation while this decision is pending?
- Who owns the final written decision, and by what date?

**Legal decision:**

- [ ] Offshore processing approved
- [ ] Approved only with conditions: `[DETAILS]`
- [ ] Not approved
- [ ] Decision pending

**Required conditions, controls, and owner:**

`[RESPONSE]`

**Decision owner:** `[ROLE]`

**Target decision date:** `[DATE]`

---

## 3. Clinical review of crisis and refusal copy

Please nominate a Nigerian mental health professional, preferably the clinical lead of the selected EAP provider or another appropriately qualified reviewer. The reviewer should assess the wording, not approve the technical architecture.

- Reviewer name and professional role: `[REQUIRED]`
- Affiliation/EAP provider: `[REQUIRED]`
- Review date: `[REQUIRED]`
- Who signs off the final wording: `[REQUIRED]`

Please review these questions:

- Does `I can't help with this safely here` communicate a clear boundary without sounding abandoning or dismissive?
- Is the instruction to contact the named human role practical and understandable during acute distress?
- Is the immediate-danger wording appropriate for the organisation's Nigerian operating context?
- Does the copy avoid implying diagnosis, treatment, reassurance, or a promise that help has been reached?
- Is the distinction between the navigation service, the human support role, and emergency services clear?
- Are there Nigerian English or Pidgin interpretations that could make the wording confusing, shaming, or unsafe?
- What wording should be used for a third-party disclosure about a friend, colleague, or family member?
- What copy should appear when notification delivery fails or the human acknowledgement SLA is missed?

**Clinical review outcome:**

- [ ] Approved as written
- [ ] Approved with changes: `[DETAILS]`
- [ ] Not approved; replacement copy required
- [ ] Review pending

**Approved escalation copy:**

```text
[PASTE CLINICALLY REVIEWED COPY HERE]
```

**Approved immediate-danger instruction:**

```text
[PASTE ORGANISATIONALLY AND CLINICALLY REVIEWED INSTRUCTION HERE]
```

---

## 4. Interpretation rule

We cannot safely release a service that presents a human route without a named human owner, out-of-hours plan, backup role, acknowledgement SLA, and failed-handoff procedure. If the organisation does not have those today, that is a useful and actionable finding: the operating model needs to be designed before employees are directed to it.

Until Section 2 has a written legal decision, offshore model calls remain disabled by design. Until Section 3 is clinically reviewed, placeholder copy must not be used with employees.

For the next round, use [STAKEHOLDER_QUESTIONNAIRE_ROUND_2.md](STAKEHOLDER_QUESTIONNAIRE_ROUND_2.md), which covers service configuration, approved content, retention, evaluation, and launch ownership.
