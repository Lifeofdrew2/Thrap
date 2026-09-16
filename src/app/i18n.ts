import type { ConversationLanguage } from "../api/types";

export interface AppCopy {
  welcomeEyebrow: string;
  welcomeHeading: string;
  welcomeIntro: string;
  whatYouCanDo: string;
  whatYouCanDoBody: string;
  whatThisIsNot: string;
  whatThisIsNotBody: string;
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
  identified: string;
  anonymous: string;
  back: string;
  privacyNote: string;
  anonymousModeNote: string;
  identifiedModeNote: string;
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
  voiceChoice: string;
  femaleVoice: string;
  maleVoice: string;
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
  escalationHeading: string;
  escalationBody: string;
  emergencyServices: string;
  emergencyServicesBody: string;
  maniHelpline: string;
  maniHelplineBody: string;
  contact: string;
  authEyebrow: string;
  authIntro: string;
  signUpTab: string;
  logInTab: string;
  emailLabel: string;
  passwordLabel: string;
  passwordHint: string;
  authContinue: string;
  authErrorInvalidCredentials: string;
  authErrorEmailTaken: string;
  authErrorGeneric: string;
  authErrorNetwork: string;
  loggedInAs: string;
  logOut: string;
  musicOn: string;
  musicOff: string;
}

const ENGLISH_COPY: AppCopy = {
  welcomeEyebrow: "Welcome",
  welcomeHeading: "A space to talk things through",
  welcomeIntro: "This is a supportive conversation tool. You can share how you're feeling, explore what's on your mind, and find your way to the right help. There's no judgment here.",
  whatYouCanDo: "What you can do here",
  whatYouCanDoBody: "Talk about how you're feeling, explore stressful situations, find coping strategies, and get connected to professional support.",
  whatThisIsNot: "What this is not",
  whatThisIsNotBody: "This is not a licensed therapist or crisis service. It cannot diagnose, prescribe, or replace professional mental health care.",
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
  consentHeading: "Choose your privacy",
  consentBody: "Anonymous is the default: nothing you say is saved anywhere, by anyone. Identified support is optional — it saves your conversation to your own password-protected account, visible only to you, so you can continue where you left off later.",
  identified: "Allow identified support",
  anonymous: "Stay anonymous",
  back: "Back",
  privacyNote: "Read the privacy summary for full details before choosing.",
  anonymousModeNote: "This session is anonymous. We will not ask for your name, email, phone number, or other identifying details.",
  identifiedModeNote: "You're signed in, so this conversation is saved securely to your account — visible only to you — and will be here next time you log in.",
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
  voiceChoice: "Voice",
  femaleVoice: "Female voice",
  maleVoice: "Male voice",
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
  escalationHeading: "Contact support now",
  escalationBody: "This service cannot safely help with this. Use an emergency number or human support below.",
  emergencyServices: "Nigeria emergency support",
  emergencyServicesBody: "Call 112 or 767 if you are in immediate danger or need urgent help.",
  maniHelpline: "MANI helpline",
  maniHelplineBody: "Call 0809 210 6493. The Mentally Aware Nigeria Initiative helpline is available Monday to Friday.",
  contact: "Contact",
  authEyebrow: "Identified support",
  authIntro: "Create an account or log in to keep your conversation history so you can pick it up again later.",
  signUpTab: "Sign up",
  logInTab: "Log in",
  emailLabel: "Email",
  passwordLabel: "Password",
  passwordHint: "At least 8 characters",
  authContinue: "Continue",
  authErrorInvalidCredentials: "Incorrect email or password.",
  authErrorEmailTaken: "An account with that email already exists. Try logging in instead.",
  authErrorGeneric: "Something went wrong. Please try again.",
  authErrorNetwork: "Couldn't reach the service. Check your connection and try again.",
  loggedInAs: "Signed in as",
  logOut: "Log out",
  musicOn: "Turn off healing piano and water fountain music",
  musicOff: "Play healing piano and water fountain music",
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
  consentHeading: "Choose your privacy",
  consentBody: "Anonymous na the default: nothing wey you talk go save anywhere, by anybody. Identified support na optional - e go save your conversation to your own password-protected account, na only you fit see am, so you fit continue where you stop later.",
  identified: "Allow identified support",
  anonymous: "Stay anonymous",
  back: "Go back",
  privacyNote: "Read the privacy summary before you choose.",
  anonymousModeNote: "This session anonymous. We no go ask for your name, email, phone number, or other identifying details.",
  identifiedModeNote: "You dey sign in, so this conversation go save well-well to your account - na only you fit see am - and e go dey wait for you next time you log in.",
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
  voiceChoice: "Voice",
  femaleVoice: "Female voice",
  maleVoice: "Male voice",
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
  escalationHeading: "Contact support now",
  escalationBody: "This service no fit safely help with this. Use emergency number or human support below.",
  emergencyServices: "Nigeria emergency support",
  emergencyServicesBody: "Call 112 or 767 if you dey immediate danger or need urgent help.",
  maniHelpline: "MANI helpline",
  maniHelplineBody: "Call 0809 210 6493. Mentally Aware Nigeria Initiative helpline dey available Monday to Friday.",
  contact: "Contact",
  authEyebrow: "Identified support",
  authIntro: "Create account or log in so your conversation history go dey wait for you when you come back.",
  signUpTab: "Sign up",
  logInTab: "Log in",
  emailLabel: "Email",
  passwordLabel: "Password",
  passwordHint: "At least 8 characters",
  authContinue: "Continue",
  authErrorInvalidCredentials: "Email or password no correct.",
  authErrorEmailTaken: "Account with that email dey already. Try log in instead.",
  authErrorGeneric: "Something no work well. Abeg try again.",
  authErrorNetwork: "We no fit reach the service. Check your connection and try again.",
  loggedInAs: "You dey sign in as",
  logOut: "Log out",
  musicOn: "Turn off healing piano and water fountain music",
  musicOff: "Play healing piano and water fountain music",
};

export function getAppCopy(language: ConversationLanguage): AppCopy {
  return language === "pcm" ? PIDGIN_COPY : ENGLISH_COPY;
}
