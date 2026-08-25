interface PrivacySummaryProps {
  onClose: () => void;
}

export function PrivacySummary({ onClose }: PrivacySummaryProps) {
  return (
    <main className="page-wrap privacy-page" aria-labelledby="privacy-heading">
      <p className="eyebrow">Privacy summary</p>
      <h1 id="privacy-heading">What happens to your information</h1>
      <div className="privacy-body">
        <p>
          <strong>Anonymous sessions</strong> are never stored as identifiable conversations. Nothing
          you type is saved on this device. Your conversation content is not shared with analytics
          or third-party services.
        </p>
        <p>
          <strong>Identified processing</strong> is a separate, optional choice. If you opt in,
          your name, work email, and preferred contact method may be used solely to arrange a
          counsellor booking or human follow-up. This data is retained only for the period
          approved by the organisation's privacy policy.
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
        Return to session
      </button>
    </main>
  );
}
