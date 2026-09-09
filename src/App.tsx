import { useRef, useState } from "react";
import { requestHumanRoute } from "./api/client";
import { requestNavigation } from "./api/navigate";
import { requestTranslatedCopy } from "./api/translate";
import type { EscalationResponse, TurnState } from "./api/types";
import type { ConversationLanguage, NavigationInput, Region } from "./api/types";
import { localHumanRoute } from "./app/client-config";
import { getAppCopy, type AppCopy } from "./app/i18n";
import { ConsentStep } from "./components/ConsentStep";
import { ConversationView, type ConversationMessage } from "./components/ConversationView";
import { EscalationScreen } from "./components/EscalationScreen";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { PrivacySummary } from "./components/PrivacySummary";
import { TurnLimitNotice } from "./components/TurnLimitNotice";
import "./styles/index.css";

export function App() {
  const [stage, setStage] = useState<"onboarding" | "consent" | "ready" | "privacy">("onboarding");
  const [privacyReturnStage, setPrivacyReturnStage] = useState<"onboarding" | "consent" | "ready">("ready");
  const [identifiedProcessing, setIdentifiedProcessing] = useState(false);
  const [humanRouteReturnStage, setHumanRouteReturnStage] = useState<"onboarding" | "consent" | "ready">("ready");
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
          <span className="header-brand-dot" aria-hidden="true" />
          <p className="service-mark">Thrap</p>
        </div>
        <div className="header-actions">
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
          onAcknowledge={(settings) => { setRegion(settings.region); setLanguage(settings.language); setLanguageName(settings.languageName); setStage("consent"); }}
        />
      )}
      {!terminalView && stage === "consent" && (
        <ConsentStep
          copy={copy}
          onBack={() => setStage("onboarding")}
          onChoose={(identified) => { setIdentifiedProcessing(identified); setStage("ready"); }}
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
        />
      )}

      {(stage === "ready" || terminalView) && (
        <button className="clear-session" type="button" onClick={clearSession} disabled={submitting}>
          {copy.clearSession}
        </button>
      )}
    </div>
  );
}
