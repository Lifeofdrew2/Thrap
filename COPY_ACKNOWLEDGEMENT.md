# Acknowledgement copy deck

Status: **Draft for clinical review. Not releasable.**

## Preface

This deck contains the navigator's responses when a person discloses something personal
at `LOW` risk band. It exists because the alternative — a service that answers a
disclosure with a bare menu — reads as rejection to someone who has just worked up the
nerve to speak.

**This copy requires clinical review before release**, per section 3 of
[STAKEHOLDER_QUESTIONNAIRE.md](STAKEHOLDER_QUESTIONNAIRE.md). The reviewer is asked to
assess the wording, not the routing. Specific questions for them are listed at the end.

Every entry is unreleasable until:

- a Nigerian mental health professional has reviewed the wording;
- `[NAMED HUMAN ROLE]`, `[ORG-APPROVED CHANNEL]`, and the other placeholders carry
  organisationally approved values;
- the safety suite covers the follow-up cases described at the end of this document.

### Scope

`LOW` band only. Every entry here assumes the `RiskClassifier` returned `LOW`. Anything
`ELEVATED` or above never reaches this deck — it receives the fixed crisis constant from
`safety/responses.py`, which is not copy that gets warmed up. If a reviewer finds an
entry here that they would want shown to someone at risk, that is a routing defect to
raise, not a wording change to make.

### Shape

Every response has three parts, in this order:

1. **Warm, specific acknowledgement** — one or two sentences that name what the person
   actually said.
2. **A plain statement that this service is not the right help** — stated as a fact
   about the service, never as a judgement about the person or their problem.
3. **A named human route, plus a concrete offer** where one applies.

Part 3 appears in every entry without exception. The referral is never conditional on
how the person replies, and never withheld pending more detail.

### Offers are declarative, not interrogative

Offers are written as statements ("I can put a session request through for you"), not
questions ("would you like me to?"). Two reasons: a question invites a reply and starts
a turn-taking pattern this service is not going to sustain, and a referral phrased as a
question is one the person can fail to answer. The route should stand whether or not
they say anything further.

### Banned patterns

These do not appear anywhere in this deck, and a reviewer should treat any instance as a
defect:

| Banned | Why |
|---|---|
| Any question about the feeling | "What has been weighing on you", "how long has this been going on" — opens a conversation the service will not continue |
| Reassurance | "It will get better", "you are doing fine" — a promise the service cannot keep |
| Motivation | "You are stronger than you think", "you have got this" |
| Reframing or silver linings | Recasting what the person said as something more manageable |
| Reflective listening | "It sounds like you are feeling..." — invites elaboration by design |
| Medical interpretation | Attributing a physical symptom to stress, or ruling anything out |
| Diagnosis or severity language | "That sounds like burnout", "this may be depression" |
| Praise for disclosing, repeated | One "thank you for saying so" is warmth; a pattern of it is a reward loop |

### Register

Nigerian workplace English. Plain, direct, adult. Not American-therapeutic: no "reach
out", "check in", "hold space", "sit with", "self-care", "journey", "I hear you". Some
formality is normal and reads as respect rather than coldness.

---

## 1. Work pressure

> Work pressure that does not let up wears people down, and it is one of the most common
> reasons people use the programme. I am not the right help for it — I cannot advise you
> on it or take it further myself. [NAMED HUMAN ROLE] can, through
> [ORG-APPROVED CHANNEL]. I can put a session request through for you now.

**Triggers:** "work is too much", "the pressure here is unrelenting", "I can't keep up
with the workload", "my job is crushing me", "too much on my plate".

**Risk band:** `LOW`. No hopelessness, no self-harm signal, no third-party risk.

**Deliberately does not say:** that the pressure will ease, that the person is coping
well, or anything about whether their workload is reasonable — that is a workplace
question the service has no standing to answer.

---

## 2. Low mood

> Thank you for saying that plainly; many people never do. Low mood that stays around is
> worth proper attention, and this is not where you will get it — I cannot counsel you or
> work out what sits behind it. [NAMED HUMAN ROLE] is who to speak to, through
> [ORG-APPROVED CHANNEL]. I can request a session for you now.

**Triggers:** "I have been feeling low", "I am down all the time", "nothing interests me
anymore", "I feel flat", "I have lost interest in everything".

**Risk band:** `LOW`. Loss of interest and flatness alone. Any hopelessness, worthlessness,
or reference to not wanting to be here moves this to the crisis constant.

**Deliberately does not say:** the word "depression", anything about severity or
duration, and anything encouraging. It does not tell the person their mood will lift.

---

## 3. Poor sleep

> Sleep that has gone wrong affects everything else, and it is a reasonable thing to want
> help with. I cannot advise you on it — not on the sleep itself, and not on anything
> medical behind it. A doctor should rule out a physical cause, and for the stress side of
> it [NAMED HUMAN ROLE] can help through [ORG-APPROVED CHANNEL]. I can request a session,
> and there is approved material on rest in the self-help library.

**Triggers:** "I can't sleep", "I am up all night", "I wake at 3am and that is it",
"I sleep and still wake up tired", "insomnia".

**Risk band:** `LOW`. Sleep disturbance alone.

**Deliberately does not say:** any sleep advice, anything about sleep hygiene, and above
all nothing about medication or sleep aids. It does not assume the cause is stress.

---

## 4. Conflict with a manager

> That is a difficult position to be in, and it is not one you can leave at the office.
> Two separate things could help here, and neither of them is me. For the effect it is
> having on you, [NAMED HUMAN ROLE] can support you through [ORG-APPROVED CHANNEL]. For
> the situation itself, there is a separate route — [APPROVED WORKPLACE ROUTE] — and using
> one does not stop you using the other. I can request a counselling session now.

**Triggers:** "my manager keeps undermining me", "my oga is impossible", "I dread every
one-on-one", "I am being treated unfairly by my supervisor".

**Risk band:** `LOW`. Conflict without allegation of harassment, discrimination, or
safety risk. Any of those goes to the workplace reporting route and, where a safety
signal is present, to escalation.

**Deliberately does not say:** anything about who is right, whether the behaviour is
acceptable, or whether it meets any policy definition. It does not advise the person on
how to handle the manager.

---

## 5. Feeling overwhelmed

> Thank you for telling me. Overwhelmed is a lot to be carrying while still turning up to
> work every day. I cannot help you with it — this is a navigation service, and what you
> are describing needs a person. [NAMED HUMAN ROLE], through [ORG-APPROVED CHANNEL], is
> who that is. I can put the session request through now.

**Triggers:** "everything is too much", "I am drowning", "I cannot cope", "it is all
piling up on me", "I don't know where to start".

**Risk band:** `LOW`. "I cannot cope" sits close to the boundary; where it appears with
hopelessness or any reference to giving up, it is not this entry.

**Deliberately does not say:** anything about prioritising, breaking things down, or
taking one thing at a time. Practical coping advice is a therapeutic technique and is
out of scope.

---

## 6. Grief or bereavement

> I am sorry. Losing someone is not something to carry alone, and it is not something this
> service can help you with. [NAMED HUMAN ROLE] can, through [ORG-APPROVED CHANNEL], and
> this is familiar ground for them. There is also leave and practical support under
> [APPROVED LEAVE POLICY] if you have not looked at that yet. I can request a session
> whenever you want it.

**Triggers:** "my father died", "I lost my mother last month", "we buried my brother",
"I am grieving", "someone close to me passed".

**Risk band:** `LOW`. Bereavement alone. Grief with any self-harm or suicidal content is
the crisis constant.

**Deliberately does not say:** anything about stages of grief, how long it takes, or
what the person should feel. No condolence formula beyond the opening, which is meant
plainly.

---

## 7. Money stress

> Money worry sits on top of everything else and is exhausting in its own right. I cannot
> advise you on finances, or on what your organisation offers for them. [NAMED HUMAN ROLE]
> can talk with you about the strain of it through [ORG-APPROVED CHANNEL], and
> [APPROVED FINANCIAL SUPPORT ROUTE] is where practical or financial assistance questions
> go. I can request a counselling session now.

**Triggers:** "I am broke and it is stressing me", "salary is not reaching", "I have debts
I cannot service", "school fees are killing me", "money wahala".

**Risk band:** `LOW`. Financial strain alone.

**Deliberately does not say:** any financial advice, any comment on pay, and nothing
about whether the organisation might help — that is for the approved route to answer.

---

## 8. Feeling isolated at work

> Feeling on your own at work is heavier than people give it credit for. I cannot help
> with it here, not in a way that would be worth anything to you. [NAMED HUMAN ROLE] can,
> through [ORG-APPROVED CHANNEL]. I can request a session for you now.

**Triggers:** "I have no one to talk to here", "I eat lunch alone every day", "nobody in
this office knows me", "I feel invisible at work", "I don't fit in".

**Risk band:** `LOW`. Isolation without hopelessness or withdrawal from all support.

**Deliberately does not say:** anything suggesting the person join things, socialise more,
or put themselves out there. It does not tell them people probably like them.

---

## 9. Returning from leave and struggling

> Coming back is often harder than people expect. This is not something I can help you
> work through. [NAMED HUMAN ROLE] can, through [ORG-APPROVED CHANNEL]. There may also be
> adjustments or a phased return available under [APPROVED LEAVE POLICY], and
> [NAMED HUMAN ROLE] can tell you what applies to you. I can request a session now.

**Triggers:** "I came back from leave and I am struggling", "since I resumed I cannot
settle", "I was off sick and now I cannot face it", "returning after maternity leave is
harder than I thought".

**Risk band:** `LOW`. Adjustment difficulty on return.

**Deliberately does not say:** that it will settle with time, that the difficulty is
normal, or anything implying the person returned too early or came back "wrong". An
earlier draft reassured on this point and it was cut — see the reviewer notes.

---

## 10. Physical symptoms attributed to stress

> Thank you for mentioning it. I have to be straight with you: I cannot tell you whether
> that is stress or something physical, and it would be wrong of me to guess. Please have
> a doctor look at it — that part comes first. If you also want to talk about the pressure
> you are under, [NAMED HUMAN ROLE] can help through [ORG-APPROVED CHANNEL], and
> [HMO PLAN DOCUMENT] sets out what your medical cover includes. I can request a
> counselling session alongside that.

**Triggers:** "I get chest pains when I think about work", "my stomach is always upset,
it must be stress", "I have headaches every day from this job", "my BP is up because of
this place".

**Risk band:** `LOW`. Symptom reported without acute emergency description. Chest pain
described as happening now, with breathlessness, is an emergency instruction case and
not this entry — the reviewer is asked to confirm that boundary.

**Deliberately does not say:** that the symptom is stress, that it is not stress, or
that it is likely to be anything. It does not reassure the person that it is probably
nothing.

---

## 11. Worry about a colleague

> It is good of you to be paying attention — many people would not. I cannot advise you on
> someone else's situation, and I should not, because what is right for them depends on
> things I cannot know. Two things do help: encourage them to contact the programme
> themselves through [ORG-APPROVED CHANNEL], and if you are worried about their wellbeing
> or safety, raise it with [NAMED HUMAN ROLE], who can act on it properly. If carrying
> this is weighing on you, the programme is open to you as well.

**Triggers:** "my colleague has not been herself", "someone on my team is struggling",
"I am worried about a co-worker", "my friend at work is going through something".

**Risk band:** `LOW`, and this is the narrowest entry in the deck. It applies only where
there is no risk signal about the third party. Any indication of harm, self-harm, abuse,
or danger is third-party disclosure and escalates — it does not reach this copy.

**Deliberately does not say:** anything about what the colleague might be experiencing,
and nothing that would have the person report details about an identifiable individual
into this service.

---

## 12. Burnout language

> Burnout is recognised as something that develops out of sustained work conditions over
> time. I cannot assess it or treat it, and I will not try. [NAMED HUMAN ROLE] can, through
> [ORG-APPROVED CHANNEL]. Because the causes are often in how work is set up rather than
> in the person, [APPROVED WORKPLACE ROUTE] is also open for workload or role concerns,
> separately from counselling. I can request a session now.

**Triggers:** "I am burnt out", "I have nothing left to give", "I am running on empty",
"I feel completely done with this job", "even after leave I came back tired".

**Risk band:** `LOW`. Exhaustion and cynicism about work. Where "nothing left" extends to
life rather than work, it is not this entry.

**Deliberately does not say:** that the person has burnout — that is a judgement the
service cannot make. It states what burnout is understood to be, without applying the
label. **This is the closest call in the deck** and the reviewer should look at it hardest;
see the notes below.

---

## 13. Anxiety about job security

> Not knowing where you stand is hard to carry, and it affects people more than they
> expect. I cannot tell you anything about your role or the organisation's plans, and I
> will not speculate. Questions about your position go to [APPROVED HR ROUTE]. For the
> strain of not knowing, [NAMED HUMAN ROLE] can help through [ORG-APPROVED CHANNEL]. I can
> request a session now.

**Triggers:** "I think I am going to be laid off", "there are rumours of restructuring
and I cannot sleep", "is my job safe", "I am scared of losing this job".

**Risk band:** `LOW`. Job insecurity worry.

**Deliberately does not say:** anything at all about the person's job, the organisation's
plans, or how likely any outcome is. It does not reassure them that their job is safe.

---

## 14. Difficulty concentrating

> Losing your concentration is frustrating, particularly when the work still has to be
> done. I cannot work out what is behind it — it could be a number of things, some of them
> medical. [NAMED HUMAN ROLE] can help you look at it through [ORG-APPROVED CHANNEL], and
> if it has come on alongside physical symptoms, see a doctor as well. I can request a
> session for you now.

**Triggers:** "I cannot focus on anything", "I read the same email five times", "my mind
keeps wandering in meetings", "I am making mistakes I never used to make".

**Risk band:** `LOW`. Concentration difficulty alone.

**Deliberately does not say:** that it is stress, that it is anxiety, or anything
resembling an attention-related diagnosis. No focus or productivity tips.

---

## 15. General "I'm not okay"

> Thank you for saying it. You do not have to explain it or put it into better words for
> me. I am not the right help — I cannot counsel you, and I will not pretend otherwise.
> [NAMED HUMAN ROLE] can, through [ORG-APPROVED CHANNEL], and you can go to them exactly
> as you are, with nothing prepared. I can put a session request through for you now.

**Triggers:** "I am not okay", "I am not fine", "something is wrong with me", "I need
help", "I don't know what is wrong but I am not alright".

**Risk band:** `LOW`, and this entry carries the most classifier weight in the deck. An
undifferentiated "I am not okay" is ambiguous by nature, and where any signal accompanies
it, the crisis constant applies instead.

**Deliberately does not say:** anything asking what is wrong. The whole point of this
entry is that the person does not have to produce a reason to be routed to help.

---

## Reviewer notes

### Questions for the clinical reviewer

1. Does the acknowledgement in each entry read as warm without implying the service will
   continue the conversation?
2. Entry 12 states what burnout is without applying the label. Is that distinction
   meaningful to a distressed reader, or does it function as a diagnosis anyway?
3. Entry 10 refuses to interpret a physical symptom. Is the wording clear enough that a
   person will actually see a doctor, without frightening them?
4. Entry 11 is the only entry about another person. Does it thread the gap between
   encouraging appropriate concern and inviting disclosure about an identifiable
   colleague?
5. Entry 15 deliberately asks for nothing. Does it read as supportive or as dismissive?
6. Are there Nigerian English or Pidgin readings of any entry that would be confusing,
   shaming, or unsafe?
7. Is "I am not the right help" the right framing throughout, or does repetition of it
   across a session begin to read as refusal?

### What I would flag

**Entry 12 is the closest to the boundary.** Stating what burnout is, in a reply to
someone who has just used the word, is very close to confirming they have it. The
distinction is real but thin. If the reviewer is uncomfortable, the safe version drops
the first sentence entirely and opens at "I cannot assess it or treat it."

**Entry 9 was reassuring in draft and was cut.** It originally said that struggling on
return "does not mean you came back wrong". That is reframing — it disputes the person's
own account of themselves — so it went. The entry is colder for it, and the reviewer may
judge that trade differently.

**Warmth and repetition are in tension.** Each entry reads well once. A person who
discloses three times in a session gets three acknowledgements built to the same
template, and the pattern will show. The likely fix is not more variants — that is a
chatbot with extra steps — but a turn limit that concludes the session earlier once
acknowledgements have been issued. That is a design question, not a copy question, and
it is not resolved here.

**This deck is in tension with an absolute rule I wrote into ARCHITECTURE.md §1.** That
rule currently reads that the system "does not respond to, reflect, interpret,
paraphrase, or acknowledge the content of anything a person discloses about their own
feelings or situation." Taken literally it forbids this entire deck. It was written to
govern the self-help reflection surface, where silence genuinely is the specification,
and it needs scoping to that surface before this copy can be adopted. Flagged here rather
than quietly edited, because which way it resolves is a real decision.

### Safety suite additions this deck requires

The deck creates a failure mode the existing suite does not cover: a person receiving a
warm acknowledgement and reasonably trying to continue the conversation.

- A user replying to an acknowledgement with more disclosure receives another
  acknowledgement-and-route, not an engaged reply, and never a follow-up question.
- A user replying with "can I just talk to you instead" receives a plain refusal with the
  route, and no negotiation.
- A user asking the service to explain, expand on, or justify its acknowledgement does
  not receive a therapeutic elaboration.
- Repeated disclosure across a session does not unlock a different register, a longer
  reply, or a warmer variant.
- No acknowledgement response is ever emitted for an `ELEVATED` or higher assessment;
  tests assert the crisis constant is returned and this deck is not consulted.
- Every entry's output includes a human route; a rendered acknowledgement without one is
  a release-blocking defect.
