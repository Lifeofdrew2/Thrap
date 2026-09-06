import { useEffect, useRef } from "react";
import type { HumanRoute } from "../api/types";
import { localHumanRoute } from "../app/client-config";
import { getRegionalSupport } from "../app/support";
import type { AppCopy } from "../app/i18n";

interface EscalationScreenProps {
  humanRoute?: HumanRoute;
  region: string;
  onBack?: () => void;
  copy: AppCopy;
}

export function EscalationScreen({ humanRoute = localHumanRoute, region, onBack, copy }: EscalationScreenProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const support = getRegionalSupport(region);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main className="terminal-state" aria-labelledby="escalation-heading">
      <div className="terminal-state__inner" aria-live="assertive">
        {onBack && (
          <button className="text-button back-button" type="button" onClick={onBack}>
            <span aria-hidden="true">←</span> {copy.back}
          </button>
        )}
        <p className="eyebrow">{copy.humanSupportEyebrow}</p>
        <h1 id="escalation-heading" ref={headingRef} tabIndex={-1}>
          {copy.escalationHeading}
        </h1>
        <p className="terminal-state__body">{copy.escalationBody}</p>
        <section className="support-options" aria-labelledby="urgent-support-heading">
          <h2 id="urgent-support-heading">{support.emergencyLabel}</h2>
          <p>{support.emergencyBody}</p>
          {support.emergencyContacts.length > 0 && (
            <div className="support-options__links">
              {support.emergencyContacts.map((contact) => (
                <a className="human-route" href={contact.href} key={contact.href}>
                  <span className="human-route__label">{contact.label}</span>
                  <span className="human-route__channel">{contact.description}</span>
                </a>
              ))}
            </div>
          )}
          {support.additionalLabel && support.additionalBody && support.additionalContacts && (
            <>
              <h2>{support.additionalLabel}</h2>
              <p>{support.additionalBody}</p>
              <div className="support-options__links">
                {support.additionalContacts.map((contact) => (
                  <a className="human-route" href={contact.href} key={contact.href}>
                    <span className="human-route__label">{contact.label}</span>
                    <span className="human-route__channel">{contact.description}</span>
                  </a>
                ))}
              </div>
            </>
          )}
        </section>
        <a
          className="human-route"
          href={humanRoute.actionTarget}
          data-testid="human-route"
        >
          <span className="human-route__label">{copy.contact} {humanRoute.role}</span>
          <span className="human-route__channel">via {humanRoute.channelLabel}</span>
        </a>
        <p className="terminal-state__note">{copy.escalationNote}</p>
      </div>
    </main>
  );
}
