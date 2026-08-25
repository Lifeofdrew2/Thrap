import { useState } from "react";
import { requestHumanRoute } from "./api/client";
import { requestNavigation } from "./api/navigate";
import type { EscalationResponse, TurnState } from "./api/types";
import { localHumanRoute } from "./app/client-config";
import { ConsentStep } from "./components/ConsentStep";
import { ConversationView, type ConversationMessage } from "./components/ConversationView";
import { EscalationScreen } from "./components/EscalationScreen";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { PrivacySummary } from "./components/PrivacySummary";
import { TurnLimitNotice } from "./components/TurnLimitNotice";
import "./styles/index.css";

export function App() {
  const [stage, setStage] = useState<"onboarding" | "consent" | "ready" | "privacy">("onboarding");
  const [terminal, setTerminal] = useState<EscalationResponse | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [turn, setTurn] = useState<TurnState>({ used: 0, limit: 20 });
  const [turnLimitRoute, setTurnLimitRoute] = useState<EscalationResponse["humanRoute"] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  async function openHumanRoute() {
    setSubmitting(true);
    try {
      setTerminal(await requestHumanRoute());
    } catch {
      setTerminal({
        kind: "escalation",
        message: "",
        reasonCode: "human_route_failure",
        humanRoute: localHumanRoute,
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function submitNavigation(input: { message?: string; intent?: string }) {
    if (submitting || terminal || turnLimitRoute || turn.used >= turn.limit) return;
    setSubmitting(true);

    if (input.message) {
      setMessages((current) => [
        ...current,
        { id: `${Date.now()}-user`, author: "user", text: input.message! },
      ]);
    }

    // Show typing indicator after a short pause
    const typingTimer = window.setTimeout(() => setIsTyping(true), 200);

    try {
      const response = await requestNavigation(input);
      clearTimeout(typingTimer);
      setIsTyping(false);

      if (response.kind === "escalation") {
        setTerminal(response);
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
    } finally {
      setSubmitting(false);
    }
  }

  function clearSession() {
    setStage("onboarding");
    setTerminal(null);
    setTurnLimitRoute(null);
    setMessages([]);
    setTurn({ used: 0, limit: 20 });
    setIsTyping(false);
  }

  const terminalView = terminal
    ? <EscalationScreen humanRoute={terminal.humanRoute} />
    : turnLimitRoute
    ? <TurnLimitNotice humanRoute={turnLimitRoute} />
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
            <button className="text-button" type="button" onClick={() => setStage("privacy")}>
              Privacy
            </button>
          )}
          {!terminal && !turnLimitRoute && stage !== "privacy" && (
            <button className="primary-button" type="button" onClick={openHumanRoute} disabled={submitting}>
              Talk to a person
            </button>
          )}
        </div>
      </header>

      {terminalView}

      {!terminalView && stage === "onboarding" && (
        <OnboardingScreen onAcknowledge={() => setStage("consent")} />
      )}
      {!terminalView && stage === "consent" && (
        <ConsentStep onChoose={() => setStage("ready")} />
      )}
      {!terminalView && stage === "privacy" && (
        <PrivacySummary onClose={() => setStage("ready")} />
      )}
      {!terminalView && stage === "ready" && (
        <ConversationView
          messages={messages}
          turn={turn}
          disabled={submitting}
          isTyping={isTyping}
          onShortcut={(intent) => void submitNavigation({ intent })}
          onSubmit={(message) => void submitNavigation({ message })}
        />
      )}

      {(stage === "ready" || terminalView) && (
        <button className="clear-session" type="button" onClick={clearSession} disabled={submitting}>
          Clear session
        </button>
      )}
    </div>
  );
}
