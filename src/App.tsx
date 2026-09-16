import { useEffect, useRef, useState } from "react";
import { requestHumanRoute } from "./api/client";
import { requestNavigation } from "./api/navigate";
import { requestTranslatedCopy } from "./api/translate";
import { requestHistory, requestLogout, requestMe, type AuthUser } from "./api/auth";
import type { EscalationResponse, TurnState } from "./api/types";
import type { ConversationLanguage, NavigationInput, Region } from "./api/types";
import { localHumanRoute } from "./app/client-config";
import { getAppCopy, type AppCopy } from "./app/i18n";
import { AuthScreen } from "./components/AuthScreen";
import { ConversationView, type ConversationMessage } from "./components/ConversationView";
import { EscalationScreen } from "./components/EscalationScreen";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { PrivacySummary } from "./components/PrivacySummary";
import { TurnLimitNotice } from "./components/TurnLimitNotice";
import "./styles/index.css";

export type VoiceGender = "female" | "male";

const VOICE_GENDER_STORAGE_KEY = "thrap_voice_gender";

function loadStoredVoiceGender(): VoiceGender {
  try {
    const stored = window.localStorage.getItem(VOICE_GENDER_STORAGE_KEY);
    return stored === "male" ? "male" : "female";
  } catch {
    return "female";
  }
}

export function App() {
  const [stage, setStage] = useState<"onboarding" | "auth" | "ready" | "privacy">("onboarding");
  const [privacyReturnStage, setPrivacyReturnStage] = useState<"onboarding" | "auth" | "ready">("ready");
  const [identifiedProcessing, setIdentifiedProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [voiceGender, setVoiceGender] = useState<VoiceGender>(loadStoredVoiceGender);
  const [humanRouteReturnStage, setHumanRouteReturnStage] = useState<"onboarding" | "auth" | "ready">("ready");
  const [region, setRegion] = useState<Region | "">("");
  const [language, setLanguage] = useState<ConversationLanguage>("eng");
  const [languageName, setLanguageName] = useState("English");
  const [copy, setCopy] = useState<AppCopy>(() => getAppCopy("eng"));
  const [translationLoading, setTranslationLoading] = useState(false);
  const translationRequest = useRef(0);
  const [terminal, setTerminal] = useState<EscalationResponse | null>(null);
  const [terminalCanGoBack, setTerminalCanGoBack] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [turn, setTurn] = useState<TurnState>({ used: 0, limit: 20 });
  const [turnLimitRoute, setTurnLimitRoute] = useState<EscalationResponse["humanRoute"] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Restore a returning logged-in account so choosing "Allow identified
  // support" again skips straight back to the conversation instead of asking
  // them to log in a second time on the same browser.
  useEffect(() => {
    requestMe()
      .then(({ user }) => { if (user) setCurrentUser(user); })
      .catch(() => undefined);
  }, []);

  function changeVoiceGender(next: VoiceGender) {
    setVoiceGender(next);
    try {
      window.localStorage.setItem(VOICE_GENDER_STORAGE_KEY, next);
    } catch {
      // A private/blocked storage context just means the preference resets
      // next visit; the feature still works for the current one.
    }
  }

  async function enterConversation() {
    try {
      const { messages: history } = await requestHistory();
      if (history.length > 0) {
        setMessages(history.map((entry, index) => ({
          id: `history-${index}`,
          author: entry.role === "user" ? "user" : "service",
          text: entry.content,
        })));
      }
    } catch {
      // No history is not fatal - the person can still start a fresh conversation.
    }
    setStage("ready");
  }

  async function changeLanguage(nextLanguage: ConversationLanguage, nextLanguageName: string) {
    const requestId = ++translationRequest.current;
    setLanguage(nextLanguage);
    setLanguageName(nextLanguageName);
    const localCopy = getAppCopy(nextLanguage);
    setCopy(localCopy);
    if (nextLanguage === "eng" || nextLanguage === "pcm") {
      setTranslationLoading(false);
      return;
    }

    setTranslationLoading(true);
    try {
      const translated = await requestTranslatedCopy(nextLanguage, nextLanguageName, getAppCopy("eng"));
      if (requestId === translationRequest.current) setCopy(translated);
    } catch {
      if (requestId === translationRequest.current) setCopy(localCopy);
    } finally {
      if (requestId === translationRequest.current) setTranslationLoading(false);
    }
  }

  async function openHumanRoute() {
    if (!region) return;
    setHumanRouteReturnStage(stage === "privacy" ? "ready" : stage);
    setSubmitting(true);
    try {
      setTerminal(await requestHumanRoute());
      setTerminalCanGoBack(true);
    } catch {
      setTerminal({
        kind: "escalation",
        message: "",
        reasonCode: "human_route_failure",
        humanRoute: localHumanRoute,
      });
      setTerminalCanGoBack(true);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitNavigation(input: Omit<NavigationInput, "region" | "language" | "languageName">) {
    if (!region || submitting || terminal || turnLimitRoute || turn.used >= turn.limit) return;
    setSubmitting(true);

    const displayedPrompt = input.message ?? (input.intent ? copy.shortcuts[input.intent]?.label : undefined);
    if (displayedPrompt) {
      setMessages((current) => [
        ...current,
        { id: `${Date.now()}-user`, author: "user", text: displayedPrompt },
      ]);
    }

    // Show typing indicator after a short pause
    const typingTimer = window.setTimeout(() => setIsTyping(true), 200);

    try {
      const response = await requestNavigation({ ...input, region, language, languageName });
      clearTimeout(typingTimer);
      setIsTyping(false);

      if (response.kind === "escalation") {
        setTerminal(response);
        setTerminalCanGoBack(false);
      } else if (response.kind === "turn_limit") {
        setTurn(response.turn);
        setTurnLimitRoute(response.humanRoute);
      } else {
        setTurn(response.turn);
        setMessages((current) => [
          ...current,
          {
            id: `${Date.now()}-service`,
            author: "service",
            text: response.message,
            citations: response.kind === "answer" ? response.citations : undefined,
          },
        ]);
      }
    } catch {
      clearTimeout(typingTimer);
      setIsTyping(false);
      setTerminal({ kind: "escalation", message: "", reasonCode: "network_failure", humanRoute: localHumanRoute });
      setTerminalCanGoBack(false);
    } finally {
      setSubmitting(false);
    }
  }

  function clearSession() {
    setStage("onboarding");
    setPrivacyReturnStage("ready");
    setIdentifiedProcessing(false);
    setHumanRouteReturnStage("ready");
    setTerminalCanGoBack(false);
    setTerminal(null);
    setTurnLimitRoute(null);
    setMessages([]);
    setTurn({ used: 0, limit: 20 });
    setIsTyping(false);
  }

  async function logOut() {
    try {
      await requestLogout();
    } catch {
      // The cookie may not have cleared, but there is nothing further to do
      // client-side; the account view is dropped either way.
    }
    setCurrentUser(null);
    clearSession();
  }

  const terminalView = terminal
    ? <EscalationScreen
        humanRoute={terminal.humanRoute}
        region={region}
        onBack={terminalCanGoBack ? () => { setTerminal(null); setTerminalCanGoBack(false); setStage(humanRouteReturnStage); } : undefined}
        copy={copy}
      />
    : turnLimitRoute
    ? <TurnLimitNotice humanRoute={turnLimitRoute} copy={copy} />
    : null;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-brand">
          <span className="header-logo-wrap">
            <img className="header-logo" src="/logo-transparent.png" alt="Thrap" />
          </span>
        </div>
        <div className="header-actions">
          {currentUser && (
            <span className="header-account" title={currentUser.email}>
              {copy.loggedInAs} {currentUser.email}
            </span>
          )}
          {currentUser && stage !== "privacy" && (
            <button className="text-button" type="button" onClick={() => void logOut()}>
              {copy.logOut}
            </button>
          )}
          {!terminal && !turnLimitRoute && stage !== "privacy" && (
            <button className="text-button" type="button" onClick={() => { setPrivacyReturnStage(stage); setStage("privacy"); }}>
              {copy.privacy}
            </button>
          )}
          {!terminal && !turnLimitRoute && stage !== "privacy" && (
            <button className="primary-button" type="button" onClick={openHumanRoute} disabled={submitting || !region}>
              {copy.talkToPerson}
            </button>
          )}
        </div>
      </header>

      {terminalView}

      {!terminalView && stage === "onboarding" && (
        <OnboardingScreen
          copy={copy}
          translationLoading={translationLoading}
          onLanguageChange={(nextLanguage, nextLanguageName) => void changeLanguage(nextLanguage, nextLanguageName)}
          onAcknowledge={(settings) => {
            setRegion(settings.region);
            setLanguage(settings.language);
            setLanguageName(settings.languageName);
            setIdentifiedProcessing(settings.identified);
            if (settings.identified && !currentUser) {
              setStage("auth");
            } else if (settings.identified) {
              void enterConversation();
            } else {
              setStage("ready");
            }
          }}
        />
      )}
      {!terminalView && stage === "auth" && (
        <AuthScreen
          copy={copy}
          onBack={() => setStage("onboarding")}
          onAuthenticated={(email) => { setCurrentUser({ email }); void enterConversation(); }}
        />
      )}
      {!terminalView && stage === "privacy" && (
        <PrivacySummary copy={copy} onBack={() => setStage(privacyReturnStage)} onClose={() => setStage(privacyReturnStage)} />
      )}
      {!terminalView && stage === "ready" && (
        <ConversationView
          messages={messages}
          turn={turn}
          disabled={submitting}
          isTyping={isTyping}
          identifiedProcessing={identifiedProcessing}
          onShortcut={(intent) => void submitNavigation({ intent })}
          onSubmit={(message) => void submitNavigation({ message })}
          copy={copy}
          voiceGender={voiceGender}
          onVoiceGenderChange={changeVoiceGender}
        />
      )}

      {stage === "ready" && !terminalView && (
        <button className="clear-session" type="button" onClick={clearSession} disabled={submitting}>
          {copy.clearSession}
        </button>
      )}
    </div>
  );
}
