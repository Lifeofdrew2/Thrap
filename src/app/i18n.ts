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
  escalationGrounding: string;
  escalationTrustedContact: string;
  escalationClosing: string;
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
  escalationHeading: "Let's get you safe right now",
  escalationBody: "I hear you, and I'm glad you said something instead of keeping it in. I can't safely help with this here, but real, immediate support can reach you.",
  escalationGrounding: "Right now, please move somewhere safer — away from any edge, height, or road — and if you can, somewhere with people nearby.",
  escalationTrustedContact: "Then call someone you trust right away — family, a friend, a colleague. You don't need the right words, just something like: \"I'm not okay right now, please come or stay on the phone with me.\"",
  escalationClosing: "You don't have to explain everything. Just make sure you're not alone with this. I'm here with you.",
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
  musicOn: "Turn off healing piano music",
  musicOff: "Play healing piano music",
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
  escalationHeading: "Make we get you safe now",
  escalationBody: "Abeg hold on — I hear you, and I dey glad say you talk am out instead of keeping am inside. I no fit safely help with dis one here, but real help fit reach you sharp sharp.",
  escalationGrounding: "Right now, abeg waka go somewhere wey safer — comot from any edge, height, or road — go where people dey if you fit.",
  escalationTrustedContact: "Then call person wey you trust now now — family, friend, or colleague. You no need get right words, just tell them: \"I no dey okay, abeg come meet me or stay for phone with me.\"",
  escalationClosing: "You no need explain everything. Just make sure say you no dey alone with dis feeling. I dey here with you.",
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
  musicOn: "Turn off healing piano music",
  musicOff: "Play healing piano music",
};

const IGBO_COPY: AppCopy = {
  ...ENGLISH_COPY,
  welcomeEyebrow: "Nnọọ",
  welcomeHeading: "Ebe ị nwere ike ikwu ihe n'uche gị",
  welcomeIntro: "Nke a bụ ngwá ọrụ mkparịta ụka nkwado. Ị nwere ike ịkọ otú ị na-adị mma, chọpụta ihe dị n'uche gị, wee chọta ụzọ gaa n'enyemaka kwesịrị ekwesị. Ọ dịghị ikpe ọmụma ebe a.",
  whatYouCanDo: "Ihe ị nwere ike ime ebe a",
  whatYouCanDoBody: "Kwuo otú ị na-adị mma, nyochaa ọnọdụ na-agbagwoju anya, chọta ụzọ iji nagide ya, wee jikọọ na nkwado ndị ọkachamara.",
  whatThisIsNot: "Ihe nke a na-abụghị",
  whatThisIsNotBody: "Nke a abụghị dọkịta ahụike uche e nyere ikike ma ọ bụ ọrụ mberede. Ọ pụghị ịchọpụta ọrịa, nye ọgwụ, ma ọ bụ dochie nlekọta ahụike uche ọkachamara.",
  urgentHelp: "Mgbe ị kwesịrị ịchọ enyemaka ngwa ngwa",
  urgentHelpBody: "Ọ bụrụ na ị nọ n'ihe egwu ma ọ bụ mberede ozugbo, biko kpọtụrụ ndị ọrụ mberede ma ọ bụ onye nlekọta ọrụ nke ụlọ ọrụ gị ugbu a.",
  important: "Ihe dị mkpa:",
  importantBody: "Ngwá ọrụ a na-enye nkwado, ma ọ dịghị adochi nchịkọta ọgwụgwọ ọkachamara. Ọ bụrụ na ị na-enwe mberede ahụike uche, biko kpọtụrụ onye ọkachamara ozugbo.",
  regionLabel: "Họrọ obodo gị",
  languageLabel: "Họrọ asụsụ gị",
  selectRegion: "Họrọ otu obodo",
  selectLanguage: "Họrọ otu asụsụ",
  beginSession: "Aghọtala m — bido nnọkọ",
  translationLoading: "Na-atụgharị ngwa a n'asụsụ ị họrọrọ…",
  privacy: "Nzuzo",
  talkToPerson: "Gwa mmadụ okwu",
  clearSession: "Kpochapụ nnọkọ",
  consentEyebrow: "Nhọrọ nzuzo",
  consentHeading: "Họrọ nzuzo gị",
  consentBody: "Ime nzuzo bụ ntọala: ọ dịghị ihe ị kwuru ka a na-echekwa ebe ọ bụla, site n'aka onye ọ bụla. Nkwado a maara onye bụ bụ nhọrọ - ọ na-echekwa mkparịta ụka gị n'akaụntụ nchekwa gị nwere paswọọdụ, nke naanị gị na-ahụ, ka ị nwee ike ịga n'ihu ebe ị kwụsịrị.",
  identified: "Kwe ka amata onye m bụ",
  anonymous: "Nọgide na-ezughị aha",
  back: "Laghachi",
  privacyNote: "Gụọ nchịkọta nzuzo maka nkọwa zuru ezu tupu ị họrọ.",
  anonymousModeNote: "Nnọkọ a bụ nke ezughị aha. Anyị agaghị ajụ aha gị, email, nọmba ekwentị, ma ọ bụ nkọwa ọzọ nke ga-eme ka a mata onye ị bụ.",
  identifiedModeNote: "Ị banyela, ya mere mkparịta ụka a na-echekwa nke ọma n'akaụntụ gị — naanị gị na-ahụ ya — ọ ga-adịkwa mgbe ị banyekwuru ọzọ.",
  privacyEyebrow: "Nchịkọta nzuzo",
  privacyHeading: "Ihe na-emere ozi gị",
  returnToSession: "Laghachi na nnọkọ",
  conversationEyebrow: "Nkwado ọgwụgwọ",
  conversationHeading: "Kedu ka ị na-adị taa?",
  exchangeOne: "mgbanwe fọdụrụ",
  exchangeMany: "mgbanwe fọdụrụ",
  shortcutIntro: "Họrọ isiokwu iji bido, ma ọ bụ pịnye ozi gị n'okpuru.",
  shortcuts: {
    TALK_THROUGH: { label: "Achọrọ m ikwu okwu", desc: "Kọọ ihe dị n'uche gị" },
    ANXIETY: { label: "Ana m enwe nchegbu", desc: "Nyochaa nchegbu na nrụgide" },
    LOW_MOOD: { label: "Obi adịghị m mma", desc: "Kwuo maka mmụọ dara ma ọ bụ mwute" },
    GRIEF: { label: "Mfu ma ọ bụ iru ụjụ", desc: "Kwuo maka onye ma ọ bụ ihe ị furu" },
    BURNOUT: { label: "Ike ọgwụgwụ na nrụgide ọrụ", desc: "Nrụgide ọrụ na ike ọgwụgwụ" },
    SLEEP: { label: "Ụra na izu ike", desc: "Nsogbu ihi ụra ma ọ bụ izu ike" },
    BOOK_COUNSELLOR: { label: "Gwa onye ndụmọdụ okwu", desc: "Jikọọ na ọkachamara ugbu a" },
  },
  composerLabel: "Kọọ ihe dị n'uche gị",
  composerPlaceholder: "Pịnye ma ọ bụ jiri ngwa okwu…",
  listeningPlaceholder: "Na-ege ntị…",
  send: "Ziga ozi",
  readAloudOn: "Kwụsị ịgụpụta",
  readAloudOff: "Gụpụta azịza n'olu",
  voiceChoice: "Olu",
  femaleVoice: "Olu nwanyị",
  maleVoice: "Olu nwoke",
  voiceNote: "Ịkọwapụta olu na-eji ọrụ okwu nke ihe nchọgharị gị, nke nwere ike izipu ụda olu na onye na-enye ihe nchọgharị gị. Pịnye ozi kama ọ bụrụ na ị chọghị nke ahụ.",
  crisisHint: "Ọ bụghị ọrụ mberede. Ọ bụrụ na ị nọ n'ihe egwu, kpọtụrụ ndị ọrụ mberede.",
  user: "Gị",
  sources: "Isi mmalite",
  bookingHeading: "Ị dị njikere ime nzọụkwụ ọzọ?",
  bookingBody: "Ịdebe oge nnọkọ bụ ihe nzuzo ma ọ na-adịkarị nwa oge n'ime awa 48.",
  bookingAction: "Debe oge nnọkọ onye ndụmọdụ",
  turnLimitEyebrow: "Nnọkọ agwụla",
  turnLimitHeading: "Ị eruola n'ọgwụgwụ nnọkọ a",
  turnLimitBody: "Daalụ maka imeghe onwe gị taa. Ịga n'ihu na-akparịta ụka a na onye ọkachamara nwere ike inyere gị aka ịga n'ime ime. Onye ndụmọdụ e nyere ikike nọ ebe a iji kwado gị.",
  connectCounsellor: "Jikọọ na",
  escalationHeading: "Ka anyị mee ka ị nọrọ n'enweghị ize ndụ ugbu a",
  escalationBody: "Anụrụ m gị, aṅụrị na-atọ m na ị kwuru okwu kama ịkwụsị ya n'ime obi gị. Enweghị m ike inye aka n'ihe a n'enweghị ihe egwu ebe a, ma enyemaka ezigbo nwere ike iru gị ozugbo.",
  escalationGrounding: "Ugbu a, biko kwaga gaa ebe dị mma karịa — pụọ n'ebe ọ bụla dị ize ndụ — gaa ebe ndị mmadụ nọ ma ọ bụrụ na ị nwere ike.",
  escalationTrustedContact: "Mgbe ahụ, kpọtụrụ onye ị tụkwasịrị obi ozugbo — ezinụlọ, enyi, ma ọ bụ onye ọrụ ibe gị. Kwuo naanị: \"Adịghị m mma ugbu a, biko bịa zute m ma ọ bụ nọgide na ekwentị na m.\"",
  escalationClosing: "Ị chọghị ịchọta okwu ziri ezi. Naanị hụ na ị nọghị naanị gị na mmetụta a. Anọ m gị nso.",
  emergencyServices: "Nkwado mberede Naịjirịa",
  emergencyServicesBody: "Kpọọ 112 ma ọ bụ 767 ọ bụrụ na ị nọ n'ihe egwu ozugbo ma ọ bụ chọrọ enyemaka ngwa ngwa.",
  maniHelpline: "Ahịrị enyemaka MANI",
  maniHelplineBody: "Kpọọ 0809 210 6493. Ahịrị enyemaka Mentally Aware Nigeria Initiative na-arụ ọrụ Mọnde ruo Fraịde.",
  contact: "Kpọtụrụ",
  authEyebrow: "Nkwado a maara onye bụ",
  authIntro: "Mepụta akaụntụ ma ọ bụ banye iji chekwaa akụkọ mkparịta ụka gị ka ị nwee ike ịga n'ihu ọzọ.",
  signUpTab: "Debanye aha",
  logInTab: "Banye",
  emailLabel: "Email",
  passwordLabel: "Paswọọdụ",
  passwordHint: "Opekata mpe mkpụrụedemede 8",
  authContinue: "Gaa n'ihu",
  authErrorInvalidCredentials: "Email ma ọ bụ paswọọdụ ezighi ezi.",
  authErrorEmailTaken: "Akaụntụ nwere email a adịlarị. Nwaa banye kama.",
  authErrorGeneric: "Ihe adịghị mma. Biko nwaa ọzọ.",
  authErrorNetwork: "Enweghị ike iru ọrụ a. Lelee njikọ ịntanetị gị wee nwaa ọzọ.",
  loggedInAs: "Ị banyere dị ka",
  logOut: "Pụọ",
  musicOn: "Kwụsị egwu piano na-agwọ ahụ",
  musicOff: "Kpọọ egwu piano na-agwọ ahụ",
};

const YORUBA_COPY: AppCopy = {
  ...ENGLISH_COPY,
  welcomeEyebrow: "Káàbọ̀",
  welcomeHeading: "Ààyè láti sọ ohun tí ó wà lọ́kàn rẹ",
  welcomeIntro: "Èyí jẹ́ irinṣẹ́ ìjíròrò onátìlẹ́yìn. O lè pín bí ara rẹ ń rí, ṣàwárí ohun tí ó wà lọ́kàn rẹ, kí o sì rí ọ̀nà sí ìrànlọ́wọ́ tí ó tọ́. Kò sí ìdálẹ́bi níbí.",
  whatYouCanDo: "Ohun tí o lè ṣe níbí",
  whatYouCanDoBody: "Sọ bí ara rẹ ń rí, ṣàwárí àwọn ìṣòro tí ó ń fa másùnmáwo, rí àwọn ọ̀nà láti kojú u, kí o sì darapọ̀ mọ́ ìrànlọ́wọ́ akọ́ṣẹ́mọṣẹ́.",
  whatThisIsNot: "Ohun tí èyí kọ́",
  whatThisIsNotBody: "Èyí kọ́ dókítà ọpọlọ tí a fọwọ́ sí tàbí iṣẹ́ pàjáwírì. Kò lè ṣe ìwádìí àìsàn, kọ oògùn, tàbí rọ́pò ìtọ́jú ìlera ọpọlọ akọ́ṣẹ́mọṣẹ́.",
  urgentHelp: "Ìgbà tí o gbọ́dọ̀ wá ìrànlọ́wọ́ kánjú",
  urgentHelpBody: "Tí o bá wà nínú ewu tàbí pàjáwírì lọ́wọ́lọ́wọ́, jọ̀wọ́ kàn sí àwọn iṣẹ́ pàjáwírì tàbí adarí ìmọ̀ràn ilé-iṣẹ́ rẹ nísinsinyí.",
  important: "Ohun pàtàkì:",
  importantBody: "Irinṣẹ́ yìí ń ṣe ìrànlọ́wọ́, ṣùgbọ́n kò rọ́pò ìtọ́jú akọ́ṣẹ́mọṣẹ́. Tí o bá ń kojú pàjáwírì ìlera ọpọlọ, jọ̀wọ́ kàn sí akọ́ṣẹ́mọṣẹ́ tí a tọ́ ní kánjú.",
  regionLabel: "Yan orílẹ̀-èdè rẹ",
  languageLabel: "Yan èdè rẹ",
  selectRegion: "Yan orílẹ̀-èdè kan",
  selectLanguage: "Yan èdè kan",
  beginSession: "Mo gbọ́ — bẹ̀rẹ̀ ìpàdé",
  translationLoading: "Ń túmọ̀ app yìí sí èdè tí o yàn…",
  privacy: "Ìpamọ́",
  talkToPerson: "Sọ̀rọ̀ pẹ̀lú ẹnìkan",
  clearSession: "Pa ìpàdé rẹ́",
  consentEyebrow: "Àṣàyàn ìpamọ́",
  consentHeading: "Yan ìpamọ́ rẹ",
  consentBody: "Aláìdámọ̀ ni ìpéwọ̀n: kò sí ohun tí o sọ tí a ó fi pamọ́ níbikíbi, láti ọwọ́ ẹnikẹ́ni. Ìrànlọ́wọ́ tí a mọ ẹnìkan jẹ́ àṣàyàn - ó ń fi ìjíròrò rẹ pamọ́ sí àkántì ọ̀rọ̀ìpamọ́ tìrẹ, tí ìwọ nìkan lè rí i, kí o lè tẹ̀síwájú láti ibi tí o dúró sí.",
  identified: "Gba ìrànlọ́wọ́ tí a mọ ẹnìkan",
  anonymous: "Wà aláìdámọ̀",
  back: "Padà",
  privacyNote: "Ka àkópọ̀ ìpamọ́ fún àlàyé kíkún kí o tó yan.",
  anonymousModeNote: "Ìpàdé yìí jẹ́ aláìdámọ̀. A kì yóò béèrè orúkọ rẹ, í-méèlì, nọ́mbà fóònù, tàbí àwọn àlàyé mìíràn tí ó lè dá ọ mọ̀.",
  identifiedModeNote: "O ti wọlé, nítorí náà ìjíròrò yìí ni a fi pamọ́ dáradára sí àkántì rẹ — ìwọ nìkan ni yóò rí i — yóò sì wà níbí nígbà tí o bá tún wọlé.",
  privacyEyebrow: "Àkópọ̀ ìpamọ́",
  privacyHeading: "Ohun tí ó ń ṣẹlẹ̀ sí àlàyé rẹ",
  returnToSession: "Padà sí ìpàdé",
  conversationEyebrow: "Ìrànlọ́wọ́ ìtọ́jú",
  conversationHeading: "Báwo ni ara rẹ ń rí lónìí?",
  exchangeOne: "ìfọ̀rọ̀wérọ̀ tó ṣẹ́kù",
  exchangeMany: "àwọn ìfọ̀rọ̀wérọ̀ tó ṣẹ́kù",
  shortcutIntro: "Yan ọ̀rọ̀ kan láti bẹ̀rẹ̀, tàbí kọ ọ̀rọ̀ tìrẹ ní ìsàlẹ̀.",
  shortcuts: {
    TALK_THROUGH: { label: "Mo fẹ́ sọ̀rọ̀", desc: "Pín ohun tí ó wà lọ́kàn rẹ" },
    ANXIETY: { label: "Mo ní másùnmáwo", desc: "Ṣàwárí másùnmáwo àti ìdààmú" },
    LOW_MOOD: { label: "Mo ń rí ìsoríkọ́", desc: "Sọ nípa ìsoríkọ́ tàbí ìbànújẹ́" },
    GRIEF: { label: "Ìjábá tàbí ìbànújẹ́ ọkàn", desc: "Sọ nípa ẹnìkan tàbí ohun tí o ti sọnù" },
    BURNOUT: { label: "Àárẹ̀ iṣẹ́ àti másùnmáwo iṣẹ́", desc: "Ìdààmú ibi-iṣẹ́ àti àárẹ̀" },
    SLEEP: { label: "Oorun àti ìsinmi", desc: "Ìṣòro sísùn tàbí ìsinmi" },
    BOOK_COUNSELLOR: { label: "Sọ̀rọ̀ pẹ̀lú alámọ̀ràn", desc: "Darapọ̀ mọ́ akọ́ṣẹ́mọṣẹ́ nísinsinyí" },
  },
  composerLabel: "Pín ohun tí ó wà lọ́kàn rẹ",
  composerPlaceholder: "Kọ tàbí lo máìkúrófóònù…",
  listeningPlaceholder: "Ń gbọ́…",
  send: "Fi ọ̀rọ̀ ránṣẹ́",
  readAloudOn: "Dá kíkà dúró",
  readAloudOff: "Ka àwọn èsì sókè",
  voiceChoice: "Ohùn",
  femaleVoice: "Ohùn obìnrin",
  maleVoice: "Ohùn ọkùnrin",
  voiceNote: "Kíkọ ọ̀rọ̀ pẹ̀lú ohùn ń lo iṣẹ́ ohùn awakọ̀ ayélujára rẹ, tí ó lè fi ìró ránṣẹ́ sí olùpèsè awakọ̀ rẹ. Kọ ọ̀rọ̀ dípò bí o kò bá fẹ́ èyí.",
  crisisHint: "Kì í ṣe iṣẹ́ pàjáwírì. Tí o bá wà nínú ewu, kàn sí àwọn iṣẹ́ pàjáwírì.",
  user: "Ìwọ",
  sources: "Àwọn orísun",
  bookingHeading: "Ṣé o ti ṣetán láti gbé ìgbésẹ̀ tókàn?",
  bookingBody: "Ìdípàdé jẹ́ ìkọ̀kọ̀ àti pé ó sábà wà láàrin wákàtí 48.",
  bookingAction: "Ṣe ìdípàdé pẹ̀lú alámọ̀ràn",
  turnLimitEyebrow: "Ìpàdé parí",
  turnLimitHeading: "O ti dé òpin ìpàdé yìí",
  turnLimitBody: "A dúpẹ́ pé o ṣílẹ̀kùn ọkàn rẹ lónìí. Bíbá akọ́ṣẹ́mọṣẹ́ tí a tọ́ sọ̀rọ̀ síwájú lè ràn ọ́ lọ́wọ́ láti lọ jinlẹ̀. Alámọ̀ràn tí a fọwọ́ sí wà níbí láti ràn ọ́ lọ́wọ́.",
  connectCounsellor: "Darapọ̀ mọ́",
  escalationHeading: "Jẹ́ ká rí i pé o wà láìléwu nísinsinyí",
  escalationBody: "Mo gbọ́ ọ, inú mi sì dùn pé o sọ ọ jáde dípò kí o pa á mọ́ sínú. Mi ò lè ṣe ìrànlọ́wọ́ láìléwu lórí èyí níbí, ṣùgbọ́n ìrànlọ́wọ́ tòótọ́ lè dé bá ọ kíákíá.",
  escalationGrounding: "Nísinsinyí, jọ̀wọ́ lọ sí ibi tí ó ní ààbò jù — kúrò ní ibi tí ó léwu — lọ sí ibi tí ènìyàn wà bí ó bá ṣe é ṣe.",
  escalationTrustedContact: "Lẹ́yìn náà, kàn sí ẹnìkan tí o gbẹ́kẹ̀lé nísinsinyí — ẹbí, ọ̀rẹ́, tàbí alábàáṣiṣẹ́. Kàn sọ pé: \"Kò dára fún mi báyìí, jọ̀wọ́ wá pàdé mi tàbí dúró lórí fóònù pẹ̀lú mi.\"",
  escalationClosing: "Ò kò nílò láti ṣàlàyé ohun gbogbo. Kàn rí i dájú pé ìwọ kò dá wà pẹ̀lú ìmọ̀lára yìí. Mo wà pẹ̀lú rẹ.",
  emergencyServices: "Ìrànlọ́wọ́ pàjáwírì Nàìjíríà",
  emergencyServicesBody: "Pe 112 tàbí 767 tí o bá wà nínú ewu lọ́wọ́lọ́wọ́ tàbí tí o nílò ìrànlọ́wọ́ kánjú.",
  maniHelpline: "Ìlà ìrànlọ́wọ́ MANI",
  maniHelplineBody: "Pe 0809 210 6493. Ìlà ìrànlọ́wọ́ Mentally Aware Nigeria Initiative wà láti ọjọ́ Aje sí ọjọ́ Ẹtì.",
  contact: "Kàn sí",
  authEyebrow: "Ìrànlọ́wọ́ tí a mọ ẹnìkan",
  authIntro: "Ṣẹ̀dá àkántì tàbí wọlé láti pa ìtàn ìjíròrò rẹ mọ́ kí o lè tẹ̀síwájú láàyè.",
  signUpTab: "Ṣíwọlé",
  logInTab: "Wọlé",
  emailLabel: "Í-méèlì",
  passwordLabel: "Ọ̀rọ̀ìpamọ́",
  passwordHint: "Ó kéré tán àwọn àmì mẹ́jọ",
  authContinue: "Tẹ̀síwájú",
  authErrorInvalidCredentials: "Í-méèlì tàbí ọ̀rọ̀ìpamọ́ kò tọ́.",
  authErrorEmailTaken: "Àkántì kan pẹ̀lú í-méèlì yìí ti wà. Gbìyànjú láti wọlé dípò.",
  authErrorGeneric: "Ohun kan kò tọ́. Jọ̀wọ́ gbìyànjú lẹ́ẹ̀kansí.",
  authErrorNetwork: "A kò lè dé iṣẹ́ náà. Ṣàyẹ̀wò ìjọpọ̀ rẹ kí o sì gbìyànjú lẹ́ẹ̀kansí.",
  loggedInAs: "O ti wọlé gẹ́gẹ́ bí",
  logOut: "Jáde",
  musicOn: "Dá orin pianó afúnnilára dúró",
  musicOff: "Ṣe orin pianó afúnnilára",
};

const HAUSA_COPY: AppCopy = {
  ...ENGLISH_COPY,
  welcomeEyebrow: "Barka da zuwa",
  welcomeHeading: "Wurin da za ka iya yin magana game da abin da ke zuciyarka",
  welcomeIntro: "Wannan kayan aiki ne na tallafi don tattaunawa. Za ka iya raba yadda kake ji, bincika abin da ke zuciyarka, kuma ka sami hanyar zuwa taimako mai kyau. Babu hukunci a nan.",
  whatYouCanDo: "Abin da za ka iya yi a nan",
  whatYouCanDoBody: "Yi magana game da yadda kake ji, bincika yanayin damuwa, sami hanyoyin jurewa, kuma ka haɗu da tallafin ƙwararru.",
  whatThisIsNot: "Abin da wannan ba shi ba",
  whatThisIsNotBody: "Wannan ba likitan ƴan tabin hankali ne mai lasisi ko sabis na gaggawa ba. Ba zai iya gano cuta, ba da magani, ko maye gurbin kulawar lafiyar hankali ta ƙwararru ba.",
  urgentHelp: "Lokacin da ya kamata ka nemi taimako cikin gaggawa",
  urgentHelpBody: "Idan kana cikin haɗari ko rikici na gaggawa yanzu, don Allah tuntuɓi ma'aikatan gaggawa ko mai ba da shawara na hukumar ka yanzu.",
  important: "Muhimmi:",
  importantBody: "Wannan kayan aiki yana taimakawa, amma baya maye gurbin jinya ta ƙwararru. Idan kana fuskantar gaggawar lafiyar hankali, don Allah tuntuɓi ƙwararre nan take.",
  regionLabel: "Zaɓi ƙasarka",
  languageLabel: "Zaɓi harshenka",
  selectRegion: "Zaɓi ƙasa",
  selectLanguage: "Zaɓi harshe",
  beginSession: "Na fahimta — fara zama",
  translationLoading: "Ana fassara wannan manhaja zuwa harshen da ka zaɓa…",
  privacy: "Sirri",
  talkToPerson: "Yi magana da mutum",
  clearSession: "Share zama",
  consentEyebrow: "Zaɓin sirri",
  consentHeading: "Zaɓi tsarin sirrinka",
  consentBody: "Rashin bayyana kai shi ne tsohuwar zaɓi: babu abin da ka faɗa da za a ajiye a ko'ina, daga kowa. Tallafin sanin kai zaɓi ne kawai - yana ajiye tattaunawarka a asusunka na kalmar sirri, wanda kai kaɗai za ka iya gani, domin ka iya ci gaba daga inda ka tsaya.",
  identified: "Ba da izinin tallafin sanin kai",
  anonymous: "Ci gaba ba a san ka ba",
  back: "Koma baya",
  privacyNote: "Karanta taƙaitaccen bayanin sirri kafin ka zaɓa.",
  anonymousModeNote: "Wannan zama ba a san ka ba ne. Ba za mu tambaye ka suna, imel, lambar waya, ko wasu bayanan da za su bayyana ko wanene kai ba.",
  identifiedModeNote: "Kana cikin shiga, don haka ana ajiye tattaunawar nan lafiya a asusunka — kai kaɗai za ka iya gani — kuma za ta kasance a nan idan ka sāke shiga.",
  privacyEyebrow: "Taƙaitaccen bayanin sirri",
  privacyHeading: "Abin da ke faruwa da bayananka",
  returnToSession: "Koma zuwa zama",
  conversationEyebrow: "Tallafin jinya",
  conversationHeading: "Yaya kake ji yau?",
  exchangeOne: "sauran tattaunawa",
  exchangeMany: "sauran tattaunawa",
  shortcutIntro: "Zaɓi taken don farawa, ko rubuta saƙon naka a ƙasa.",
  shortcuts: {
    TALK_THROUGH: { label: "Ina son yin magana", desc: "Raba abin da ke zuciyarka" },
    ANXIETY: { label: "Ina jin damuwa", desc: "Bincika damuwa da tashin hankali" },
    LOW_MOOD: { label: "Jin ƴanƴana", desc: "Yi magana game da baƙin ciki ko rashin farin ciki" },
    GRIEF: { label: "Bakin ciki ko rashi", desc: "Yi magana game da wanda ko abin da ka rasa" },
    BURNOUT: { label: "Gajiya da matsin lambar aiki", desc: "Matsin lambar wurin aiki da gajiya" },
    SLEEP: { label: "Barci da hutawa", desc: "Matsalar barci ko farfaɗowa" },
    BOOK_COUNSELLOR: { label: "Yi magana da mai ba da shawara", desc: "Haɗu da ƙwararre yanzu" },
  },
  composerLabel: "Raba abin da ke zuciyarka",
  composerPlaceholder: "Rubuta ko yi amfani da makirifo…",
  listeningPlaceholder: "Ana saurara…",
  send: "Aika saƙo",
  readAloudOn: "Kashe karatun murya",
  readAloudOff: "Karanta amsoshi da murya",
  voiceChoice: "Murya",
  femaleVoice: "Muryar mace",
  maleVoice: "Muryar namiji",
  voiceNote: "Rubutu ta murya yana amfani da sabis na murya na burauzarku, wanda zai iya aika sauti zuwa mai ba da burauzarku. Rubuta maimakon idan ba ka son haka ba.",
  crisisHint: "Ba sabis na gaggawa ba ne. Idan kana cikin haɗari, tuntuɓi ma'aikatan gaggawa.",
  user: "Kai",
  sources: "Majiyoyi",
  bookingHeading: "Shirye don ɗaukar mataki na gaba?",
  bookingBody: "Yin ajiyar zama abu ne na sirri kuma yawanci ana samun sa cikin awa 48.",
  bookingAction: "Yi ajiyar zama da mai ba da shawara",
  turnLimitEyebrow: "Zaman ya ƙare",
  turnLimitHeading: "Ka kai ƙarshen wannan zaman",
  turnLimitBody: "Na gode da ka buɗe zuciyarka yau. Ci gaba da tattaunawar nan tare da ƙwararre zai taimaka maka ci gaba da zurfafa. Mai ba da shawara mai lasisi yana nan don tallafa maka.",
  connectCounsellor: "Haɗu da",
  escalationHeading: "Bari mu tabbatar da kai lafiya yanzu",
  escalationBody: "Na ji ka, kuma ina farin ciki da ka faɗi maimakon ka ɓoye shi a ciki. Ba zan iya taimaka maka lafiya kan wannan a nan ba, amma taimako na gaske zai iya kaiwa gare ka yanzu.",
  escalationGrounding: "Yanzu, don Allah koma zuwa wuri mafi aminci — nesa da wani wuri mai haɗari — je wurin da mutane suke idan zaka iya.",
  escalationTrustedContact: "Sannan ka tuntuɓi wanda ka amince da shi yanzu — dangi, aboki, ko abokin aiki. Kawai ka faɗi: \"Ba na jin daɗi yanzu, don Allah zo ka same ni ko ka zauna a waya tare da ni.\"",
  escalationClosing: "Ba ka bukatar bayyana komai. Kawai tabbatar ba ka kaɗai ba da wannan ji. Ina tare da kai.",
  emergencyServices: "Tallafin gaggawa na Najeriya",
  emergencyServicesBody: "Kira 112 ko 767 idan kana cikin haɗari na gaggawa ko kana buƙatar taimako cikin sauri.",
  maniHelpline: "Layin taimakon MANI",
  maniHelplineBody: "Kira 0809 210 6493. Layin taimakon Mentally Aware Nigeria Initiative yana samuwa Litinin zuwa Jumma'a.",
  contact: "Tuntuɓa",
  authEyebrow: "Tallafin sanin kai",
  authIntro: "Ƙirƙiri asusu ko shiga don adana tarihin tattaunawarka domin ka iya ci gaba daga baya.",
  signUpTab: "Yi rijista",
  logInTab: "Shiga",
  emailLabel: "Imel",
  passwordLabel: "Kalmar sirri",
  passwordHint: "Aƙalla haruffa 8",
  authContinue: "Ci gaba",
  authErrorInvalidCredentials: "Imel ko kalmar sirri ba daidai ba.",
  authErrorEmailTaken: "Asusu da wannan imel ya wanzu. Gwada shiga maimakon.",
  authErrorGeneric: "Wani abu ya yi kuskure. Don Allah sake gwadawa.",
  authErrorNetwork: "Ba a iya isa ga sabis ba. Duba haɗin intanet naka sannan sake gwadawa.",
  loggedInAs: "An shiga a matsayin",
  logOut: "Fita",
  musicOn: "Kashe kiɗan piano mai kwantar hankali",
  musicOff: "Kunna kiɗan piano mai kwantar hankali",
};

export function getAppCopy(language: ConversationLanguage): AppCopy {
  if (language === "pcm") return PIDGIN_COPY;
  if (language === "ibo") return IGBO_COPY;
  if (language === "yor") return YORUBA_COPY;
  if (language === "hau") return HAUSA_COPY;
  return ENGLISH_COPY;
}
