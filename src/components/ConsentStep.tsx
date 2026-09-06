import type { AppCopy } from "../app/i18n";

interface ConsentStepProps {
  onContinue: () => void;
  onBack: () => void;
  copy: AppCopy;
}

export function ConsentStep({ onContinue, onBack, copy }: ConsentStepProps) {
  return (
    <main className="page-wrap consent" aria-labelledby="consent-heading">
      <button className="text-button back-button" type="button" onClick={onBack}>
        <span aria-hidden="true">←</span> {copy.back}
      </button>
      <p className="eyebrow">{copy.consentEyebrow}</p>
      <h1 id="consent-heading">{copy.consentHeading}</h1>
      <p className="consent-body">{copy.consentBody}</p>
      <div className="choice-row">
        <button className="primary-button" type="button" onClick={onContinue}>
          {copy.anonymous}
        </button>
      </div>
      <p className="privacy-note">{copy.privacyNote}</p>
    </main>
  );
}
