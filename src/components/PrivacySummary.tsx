import type { AppCopy } from "../app/i18n";

interface PrivacySummaryProps {
  onClose: () => void;
  onBack: () => void;
  copy: AppCopy;
}

export function PrivacySummary({ onClose, onBack, copy }: PrivacySummaryProps) {
  return (
    <main className="page-wrap privacy-page" aria-labelledby="privacy-heading">
      <button className="text-button back-button" type="button" onClick={onBack}>
        <span aria-hidden="true">←</span> {copy.back}
      </button>
      <p className="eyebrow">{copy.privacyEyebrow}</p>
      <h1 id="privacy-heading">{copy.privacyHeading}</h1>
      <div className="privacy-body">
        <p>
          <strong>Anonymous sessions</strong> are never stored anywhere. Nothing you type is saved on
          this device, on our server, or with any analytics or third-party service. Closing the tab
          or clearing the session erases the conversation completely, because it was never written
          down in the first place.
        </p>
        <p>
          <strong>Identified support</strong> is optional, and you choose it yourself by creating an
          account. If you do, your conversation is saved so you can pick it up again later, from any
          device — but only you can see it: it lives behind your own password, which is never stored
          in readable form, only as a one-way security hash. We do not share it with analytics,
          advertisers, or anyone else. Logging out ends your signed-in session on that device; your
          account and its history stay exactly as you left them for next time.
        </p>
        <p>
          <strong>Escalation records</strong> contain only the minimum information needed for a
          human support role to follow up. They do not contain conversation content.
        </p>
        <p>
          If you have questions about how your data is handled, please contact the organisation's
          Data Protection Officer.
        </p>
      </div>
      <button className="secondary-button" type="button" onClick={onClose}>
        {copy.returnToSession}
      </button>
    </main>
  );
}
