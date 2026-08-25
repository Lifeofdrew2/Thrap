import { useEffect, useRef } from "react";
import type { HumanRoute } from "../api/types";
import { escalationCopy, localHumanRoute } from "../app/client-config";

interface EscalationScreenProps {
  humanRoute?: HumanRoute;
}

export function EscalationScreen({ humanRoute = localHumanRoute }: EscalationScreenProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main className="terminal-state" aria-labelledby="escalation-heading">
      <div className="terminal-state__inner" aria-live="assertive">
        <p className="eyebrow">Human support route</p>
        <h1 id="escalation-heading" ref={headingRef} tabIndex={-1}>
          {escalationCopy.heading}
        </h1>
        <p className="terminal-state__body">{escalationCopy.body}</p>
        <a
          className="human-route"
          href={humanRoute.actionTarget}
          data-testid="human-route"
        >
          <span className="human-route__label">Contact {humanRoute.role}</span>
          <span className="human-route__channel">via {humanRoute.channelLabel}</span>
        </a>
        <p className="terminal-state__note">{escalationCopy.terminal}</p>
      </div>
    </main>
  );
}
