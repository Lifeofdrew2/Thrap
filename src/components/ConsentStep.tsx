interface ConsentStepProps {
  onChoose: (identified: boolean) => void;
}

export function ConsentStep({ onChoose }: ConsentStepProps) {
  return (
    <main className="page-wrap consent" aria-labelledby="consent-heading">
      <p className="eyebrow">Privacy choice</p>
      <h1 id="consent-heading">How should we handle your information?</h1>
      <p className="consent-body">
        You can talk here completely anonymously — nothing is stored on your device and no one can
        identify you. If you'd like us to help arrange a counsellor booking or follow-up, we'll need
        to use some identifying information (your name, work email, and preferred contact method) for
        that purpose only, kept under the organisation's privacy policy.
      </p>
      <div className="choice-row">
        <button className="primary-button" type="button" onClick={() => onChoose(true)}>
          Allow identified processing
        </button>
        <button className="secondary-button" type="button" onClick={() => onChoose(false)}>
          Stay anonymous
        </button>
      </div>
      <p className="privacy-note">Read the privacy summary for full details before choosing.</p>
    </main>
  );
}
