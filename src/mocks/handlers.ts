import { http, HttpResponse, delay } from "msw";

const humanRoute = {
  role: "Licensed counsellor",
  channelLabel: "confidential EAP support portal",
  actionTarget: "#eap-support-portal",
};

const THERAPY_RESPONSES: Record<string, string> = {
  TALK_THROUGH:
    "I'm here and I'm listening. Whatever's on your mind, this is a safe space to explore it. What's been weighing on you most lately?",
  ANXIETY:
    "Anxiety can feel really overwhelming — like your mind won't slow down. You're not alone in feeling this way. Can you tell me a bit more about what's been making you anxious? Is it something specific, or more of a constant background feeling?",
  LOW_MOOD:
    "I'm glad you reached out. Feeling low is hard, and it takes courage to talk about it. Can you describe what that's been like for you? Has something happened recently, or has this been building for a while?",
  BURNOUT:
    "Burnout is real and it's exhausting — not just physically, but emotionally too. It sounds like you've been carrying a lot. What does your day-to-day feel like right now?",
  SLEEP:
    "Sleep struggles can affect everything — your mood, your focus, your resilience. You're right to take it seriously. Are you finding it hard to fall asleep, stay asleep, or do you wake up still feeling drained?",
  BOOK_COUNSELLOR:
    "Connecting with a licensed counsellor is a really positive step. I can help point you in the right direction. Would you like me to connect you with the EAP duty counsellor, or would you prefer to explore some information first?",
};

const FOLLOWUP_RESPONSES = [
  "That sounds really difficult. It takes a lot to carry something like that — how long have you been feeling this way?",
  "Thank you for sharing that with me. I can hear how much this has been affecting you. What feels most important to talk about right now?",
  "You're not alone in this. Many people experience exactly what you're describing. What do you think would help you most today — exploring some coping strategies, or finding professional support?",
  "I appreciate you being so open. It sounds like there's a lot going on. When did you first notice things starting to feel this heavy?",
  "That makes a lot of sense given what you're going through. How are you taking care of yourself at the moment?",
  "It's okay to feel that way — your feelings are valid. Is there someone in your life you've been able to talk to about this, or has it felt hard to open up?",
];

let callCount = 0;

export const handlers = [
  http.post("/api/human-route", () =>
    HttpResponse.json({
      kind: "escalation" as const,
      message: "",
      reasonCode: "crisis" as const,
      humanRoute,
    })
  ),

  http.post("/api/navigate", async ({ request }) => {
    await delay(1200 + Math.random() * 600);

    const body = await request.json() as { message?: string; intent?: string };
    const turn = { used: ++callCount, limit: 20 };

    // Shortcut intents get specific responses
    if (body.intent && body.intent in THERAPY_RESPONSES) {
      return HttpResponse.json({
        kind: "answer",
        message: THERAPY_RESPONSES[body.intent as keyof typeof THERAPY_RESPONSES],
        citations: [],
        turn,
      });
    }

    // Crisis signal detection — deterministic, not LLM
    const text = (body.message ?? "").toLowerCase();
    const crisisSignals = [
      "kill myself", "end my life", "suicide", "want to die",
      "hurt myself", "self harm", "self-harm", "harming myself",
      "don't want to be here", "not worth living",
    ];
    if (crisisSignals.some((s) => text.includes(s))) {
      return HttpResponse.json({
        kind: "escalation",
        message: "",
        reasonCode: "crisis",
        humanRoute,
      });
    }

    // Turn limit
    if (turn.used >= turn.limit) {
      return HttpResponse.json({
        kind: "turn_limit",
        message: "We've reached the end of this session.",
        humanRoute,
        turn,
      });
    }

    // Conversational follow-up
    const reply = FOLLOWUP_RESPONSES[turn.used % FOLLOWUP_RESPONSES.length];
    return HttpResponse.json({
      kind: "answer",
      message: reply,
      citations: [],
      turn,
    });
  }),
];
