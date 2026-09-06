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
          <strong>Anonymous sessions</strong> are never stored as identifiable conversations. Nothing
          you type is saved on this device. Your conversation content is not shared with analytics
          or third-party services.
        </p>
        <p>
          This service does not collect names, email addresses, phone numbers, or other identifying
          details. Human-support links open an external phone or organisation-approved route if you
          choose to contact someone.
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
