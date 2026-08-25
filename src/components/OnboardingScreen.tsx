interface OnboardingScreenProps {
  onAcknowledge: () => void;
}

export function OnboardingScreen({ onAcknowledge }: OnboardingScreenProps) {
  return (
    <main className="page-wrap onboarding" aria-labelledby="onboarding-heading">
      <p className="eyebrow">Welcome</p>
      <h1 id="onboarding-heading">A space to talk things through</h1>
      <p className="onboarding-intro">
        This is a supportive conversation tool. You can share how you're feeling, explore what's
        on your mind, and find your way to the right help. There's no judgment here.
      </p>

      <div className="onboarding-grid">
        <div className="onboarding-card">
          <h2>What you can do here</h2>
          <p>Talk about how you're feeling, explore stressful situations, find coping strategies, and get connected to professional support.</p>
        </div>
        <div className="onboarding-card">
          <h2>What this is not</h2>
          <p>This is not a licensed therapist or crisis service. It cannot diagnose, prescribe, or replace professional mental health care.</p>
        </div>
        <div className="onboarding-card">
          <h2>Your privacy</h2>
          <p>Your conversation is not stored on this device. You choose whether to use this anonymously or with identified processing.</p>
        </div>
        <div className="onboarding-card">
          <h2>When to seek urgent help</h2>
          <p>If you're in immediate danger or crisis, please contact emergency services or your organisation's duty counsellor now.</p>
        </div>
      </div>

      <div className="disclaimer-strip" role="note">
        <svg className="disclaimer-strip-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
        </svg>
        <span>
          <strong>Important:</strong> This tool supports, but does not replace, professional therapy. If you're
          experiencing a mental health emergency, please contact a trained professional immediately.
        </span>
      </div>

      <button className="primary-button" type="button" onClick={onAcknowledge}>
        I understand — begin session
      </button>
    </main>
  );
}
