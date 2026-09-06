import type { ConversationLanguage } from "../api/types";

export interface AppCopy {
  welcomeEyebrow: string;
  welcomeHeading: string;
  welcomeIntro: string;
  whatYouCanDo: string;
  whatYouCanDoBody: string;
  whatThisIsNot: string;
  whatThisIsNotBody: string;
  yourPrivacy: string;
  yourPrivacyBody: string;
  urgentHelp: string;
  urgentHelpBody: string;
  important: string;
  importantBody: string;
  regionLabel: string;
  languageLabel: string;
  selectRegion: string;
  selectLanguage: string;
  beginSession: string;
  translationLoading: string;
  privacy: string;
  talkToPerson: string;
  clearSession: string;
  consentEyebrow: string;
  consentHeading: string;
  consentBody: string;
  anonymous: string;
  back: string;
  privacyNote: string;
  anonymousModeNote: string;
  privacyEyebrow: string;
  privacyHeading: string;
  returnToSession: string;
  conversationEyebrow: string;
  conversationHeading: string;
  exchangeOne: string;
  exchangeMany: string;
  shortcutIntro: string;
  shortcuts: Record<string, { label: string; desc: string }>;
  composerLabel: string;
  composerPlaceholder: string;
  listeningPlaceholder: string;
  send: string;
  readAloudOn: string;
  readAloudOff: string;
  voiceNote: string;
  crisisHint: string;
  user: string;
  sources: string;
  bookingHeading: string;
  bookingBody: string;
  bookingAction: string;
  turnLimitEyebrow: string;
  turnLimitHeading: string;
  turnLimitBody: string;
  connectCounsellor: string;
  humanSupportEyebrow: string;
  escalationHeading: string;
  escalationBody: string;
  emergencyServices: string;
  emergencyServicesBody: string;
  maniHelpline: string;
  maniHelplineBody: string;
  contact: string;
  escalationNote: string;
}

const ENGLISH_COPY: AppCopy = {
  welcomeEyebrow: "Welcome",
  welcomeHeading: "A space to talk things through",
  welcomeIntro: "This is a supportive conversation tool. You can share how you're feeling, explore what's on your mind, and find your way to the right help. There's no judgment here.",
  whatYouCanDo: "What you can do here",
  whatYouCanDoBody: "Talk about how you're feeling, explore stressful situations, find coping strategies, and get connected to professional support.",
  whatThisIsNot: "What this is not",
  whatThisIsNotBody: "This is not a licensed therapist or crisis service. It cannot diagnose, prescribe, or replace professional mental health care.",
  yourPrivacy: "Your privacy",
  yourPrivacyBody: "Your conversation is not stored on this device. You can use this service anonymously.",
  urgentHelp: "When to seek urgent help",
  urgentHelpBody: "If you're in immediate danger or crisis, please contact emergency services or your organisation's duty counsellor now.",
  important: "Important:",
  importantBody: "This tool supports, but does not replace, professional therapy. If you're experiencing a mental health emergency, please contact a trained professional immediately.",
  regionLabel: "Select your country",
  languageLabel: "Select your language",
  selectRegion: "Choose a country",
  selectLanguage: "Choose a language",
  beginSession: "I understand — begin session",
  translationLoading: "Translating this app into your selected language…",
  privacy: "Privacy",
  talkToPerson: "Talk to a person",
  clearSession: "Clear session",
  consentEyebrow: "Privacy choice",
  consentHeading: "How should we handle your information?",
  consentBody: "You can use this service completely anonymously. Nothing is stored on your device and no one can identify you. If you need more support, you can use the external emergency or human-support contacts without sharing information here.",
  anonymous: "Continue anonymously",
  back: "Back",
  privacyNote: "Read the privacy summary for full details before choosing.",
  anonymousModeNote: "This session is anonymous. We will not ask for your name, email, phone number, or other identifying details.",
  privacyEyebrow: "Privacy summary",
  privacyHeading: "What happens to your information",
  returnToSession: "Return to session",
  conversationEyebrow: "Therapy support",
  conversationHeading: "How are you feeling today?",
  exchangeOne: "exchange remaining",
  exchangeMany: "exchanges remaining",
  shortcutIntro: "Choose a topic to begin, or type your own message below.",
  shortcuts: {
    TALK_THROUGH: { label: "I need to talk", desc: "Share what's on your mind" },
    ANXIETY: { label: "Feeling anxious", desc: "Explore anxiety and stress" },
    LOW_MOOD: { label: "Feeling low", desc: "Talk about low mood or sadness" },
    GRIEF: { label: "Loss or grief", desc: "Talk about someone or something you've lost" },
    BURNOUT: { label: "Burnout & work stress", desc: "Workplace pressure and exhaustion" },
    SLEEP: { label: "Sleep & rest", desc: "Trouble sleeping or recovering" },
    BOOK_COUNSELLOR: { label: "Talk to a counsellor", desc: "Connect with a professional now" },
  },
  composerLabel: "Share what's on your mind",
  composerPlaceholder: "Type or use the microphone…",
  listeningPlaceholder: "Listening…",
  send: "Send message",
  readAloudOn: "Turn off read aloud",
  readAloudOff: "Read replies aloud",
  voiceNote: "Dictation uses your browser's speech service, which may send audio to your browser provider. Type instead if you would rather it did not.",
  crisisHint: "Not a crisis service. If you're in danger, contact emergency services.",
  user: "You",
  sources: "Sources",
  bookingHeading: "Ready to take the next step?",
  bookingBody: "Booking a session is confidential and usually available within 48 hours.",
  bookingAction: "Book a counsellor session",
  turnLimitEyebrow: "Session complete",
  turnLimitHeading: "You've reached the end of this session",
  turnLimitBody: "Thank you for opening up today. Continuing this conversation with a trained professional can help you go deeper. A licensed counsellor is here to support you.",
  connectCounsellor: "Connect with",
  humanSupportEyebrow: "Human support route",
  escalationHeading: "Let's get you real support",
  escalationBody: "It sounds like what you're going through deserves more than I can safely offer here. A licensed counsellor is available now and can provide the professional care you deserve.",
  emergencyServices: "Nigeria emergency support",
  emergencyServicesBody: "Call 112 or 767 if you are in immediate danger or need urgent help.",
  maniHelpline: "MANI helpline",
  maniHelplineBody: "Call 0809 210 6493. The Mentally Aware Nigeria Initiative helpline is available Monday to Friday.",
  contact: "Contact",
  escalationNote: "This session is closed. Your wellbeing matters — please reach out to the human support below.",
};

const PIDGIN_COPY: AppCopy = {
  ...ENGLISH_COPY,
  welcomeEyebrow: "Welcome",
  welcomeHeading: "Place wey you fit talk your mind",
  welcomeIntro: "This na supportive conversation tool. You fit share how you dey feel, talk about wetin dey your mind, and find the right help. Nobody dey judge you here.",
  whatYouCanDo: "Wetin you fit do here",
  whatYouCanDoBody: "Talk about how you dey feel, explore things wey dey stress you, find ways to cope, and connect with professional support.",
  whatThisIsNot: "Wetin this no be",
  whatThisIsNotBody: "This no be licensed therapist or crisis service. E no fit diagnose, prescribe, or replace professional mental health care.",
  yourPrivacy: "Your privacy",
  yourPrivacyBody: "Your conversation no dey stay for this device. You fit use this service anonymous.",
  urgentHelp: "When you need urgent help",
  urgentHelpBody: "If you dey immediate danger or crisis, abeg contact emergency services or your organisation duty counsellor now.",
  important: "Important:",
  importantBody: "This tool dey support you, but e no replace professional therapy. If you dey experience mental health emergency, abeg contact trained professional immediately.",
  regionLabel: "Choose your country",
  languageLabel: "Choose your language",
  selectRegion: "Choose a country",
  selectLanguage: "Choose a language",
  beginSession: "I understand — begin session",
  translationLoading: "I dey translate this app to the language wey you choose…",
  privacy: "Privacy",
  talkToPerson: "Talk to person",
  clearSession: "Clear session",
  consentEyebrow: "Privacy choice",
  consentHeading: "How you want make we handle your information?",
  consentBody: "You fit use this service completely anonymous. Nothing wey you type dey stay for your device, and nobody fit know say na you. If you need more support, you fit use the external emergency or human-support contacts without sharing information here.",
  anonymous: "Continue anonymously",
  back: "Go back",
  privacyNote: "Read the privacy summary before you choose.",
  anonymousModeNote: "This session anonymous. We no go ask for your name, email, phone number, or other identifying details.",
  privacyEyebrow: "Privacy summary",
  privacyHeading: "Wetin dey happen to your information",
  returnToSession: "Go back to session",
  conversationEyebrow: "Therapy support",
  conversationHeading: "How you dey feel today?",
  exchangeOne: "exchange remain",
  exchangeMany: "exchanges remain",
  shortcutIntro: "Choose topic to start, or type wetin dey your mind below.",
  shortcuts: {
    TALK_THROUGH: { label: "I need to talk", desc: "Share wetin dey your mind" },
    ANXIETY: { label: "I dey anxious", desc: "Talk about anxiety and stress" },
    LOW_MOOD: { label: "I dey feel low", desc: "Talk about low mood or sadness" },
    GRIEF: { label: "Loss or grief", desc: "Talk about person or thing wey you lose" },
    BURNOUT: { label: "Burnout and work stress", desc: "Work pressure and tiredness" },
    SLEEP: { label: "Sleep and rest", desc: "Trouble sleeping or recovering" },
    BOOK_COUNSELLOR: { label: "Talk to counsellor", desc: "Connect with professional now" },
  },
  composerLabel: "Share wetin dey your mind",
  composerPlaceholder: "Type or use microphone…",
  listeningPlaceholder: "I dey listen…",
  send: "Send message",
  readAloudOn: "Turn off read aloud",
  readAloudOff: "Read replies aloud",
  voiceNote: "Dictation dey use your browser speech service, and e fit send audio to your browser provider. Type instead if you no want that.",
  crisisHint: "This no be crisis service. If you dey danger, contact emergency services.",
  user: "You",
  sources: "Sources",
  bookingHeading: "You ready to take the next step?",
  bookingBody: "Booking session dey confidential and e dey usually available within 48 hours.",
  bookingAction: "Book counsellor session",
  turnLimitEyebrow: "Session don complete",
  turnLimitHeading: "You don reach the end of this session",
  turnLimitBody: "Thank you say you open up today. Talking with trained professional fit help you go deeper. Licensed counsellor dey here to support you.",
  connectCounsellor: "Connect with",
  humanSupportEyebrow: "Human support route",
  escalationHeading: "Make we connect you to real support",
  escalationBody: "Wetin you dey go through need more than wetin I fit safely offer here. Licensed counsellor dey available now to give you the professional care wey you deserve.",
  emergencyServices: "Nigeria emergency support",
  emergencyServicesBody: "Call 112 or 767 if you dey immediate danger or need urgent help.",
  maniHelpline: "MANI helpline",
  maniHelplineBody: "Call 0809 210 6493. Mentally Aware Nigeria Initiative helpline dey available Monday to Friday.",
  contact: "Contact",
  escalationNote: "This session don close. Your wellbeing matter — abeg reach out to the human support below.",
};

export function getAppCopy(language: ConversationLanguage): AppCopy {
  return language === "pcm" ? PIDGIN_COPY : ENGLISH_COPY;
}
