import { useState } from "react";
import type { ConversationLanguage, Region } from "../api/types";
import { LANGUAGE_OPTIONS, REGION_OPTIONS } from "../app/regions";
import type { AppCopy } from "../app/i18n";

interface OnboardingScreenProps {
  onAcknowledge: (settings: { region: Region; language: ConversationLanguage; languageName: string; identified: boolean }) => void;
  onLanguageChange: (language: ConversationLanguage, languageName: string) => void;
  copy: AppCopy;
  translationLoading: boolean;
}

export function OnboardingScreen({ onAcknowledge, onLanguageChange, copy, translationLoading }: OnboardingScreenProps) {
  const [region, setRegion] = useState<Region | "">("");
  const [language, setLanguage] = useState<ConversationLanguage | "">("");
  const [identified, setIdentified] = useState(false);
  return (
    <main className="page-wrap onboarding" aria-labelledby="onboarding-heading">
      <p className="eyebrow">{copy.welcomeEyebrow}</p>
      <h1 id="onboarding-heading">{copy.welcomeHeading}</h1>
      <p className="onboarding-intro">{copy.welcomeIntro}</p>

      <div className="onboarding-grid">
        <div className="onboarding-card">
          <h2>{copy.whatYouCanDo}</h2>
          <p>{copy.whatYouCanDoBody}</p>
        </div>
        <div className="onboarding-card">
          <h2>{copy.whatThisIsNot}</h2>
          <p>{copy.whatThisIsNotBody}</p>
        </div>
        <div className="onboarding-card">
          <h2>{copy.yourPrivacy}</h2>
          <p>{copy.yourPrivacyBody}</p>
        </div>
        <div className="onboarding-card">
          <h2>{copy.urgentHelp}</h2>
          <p>{copy.urgentHelpBody}</p>
        </div>
      </div>

      <div className="disclaimer-strip" role="note">
        <svg className="disclaimer-strip-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
        </svg>
        <span>
          <strong>{copy.important}</strong> {copy.importantBody}
        </span>
      </div>

      <div className="conversation-preferences">
        <div>
          <label htmlFor="region">{copy.regionLabel}</label>
          <select id="region" value={region} onChange={(event) => setRegion(event.target.value)} required>
            <option value="" disabled>{copy.selectRegion}</option>
            {REGION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="conversation-language">{copy.languageLabel}</label>
          <select
            id="conversation-language"
            value={language}
            required
            onChange={(event) => {
              const nextLanguage = event.target.value;
              const nextLanguageName = LANGUAGE_OPTIONS.find((option) => option.value === nextLanguage)?.label ?? nextLanguage;
              setLanguage(nextLanguage);
              onLanguageChange(nextLanguage, nextLanguageName);
            }}
          >
            <option value="" disabled>{copy.selectLanguage}</option>
            {LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
      </div>

      <section className="onboarding-privacy" aria-labelledby="privacy-choice-heading">
        <p className="eyebrow">{copy.consentEyebrow}</p>
        <h2 id="privacy-choice-heading">{copy.consentHeading}</h2>
        <p className="consent-body">{copy.consentBody}</p>
        <div className="choice-row">
          <button className={!identified ? "primary-button" : "secondary-button"} type="button" onClick={() => setIdentified(false)} aria-pressed={!identified}>
            {copy.anonymous}
          </button>
          <button className={identified ? "primary-button" : "secondary-button"} type="button" onClick={() => setIdentified(true)} aria-pressed={identified}>
            {copy.identified}
          </button>
        </div>
      </section>

      <button
        className="primary-button"
        type="button"
        disabled={!region || !language || translationLoading}
        onClick={() => {
          if (!region || !language) return;
          onAcknowledge({
            region,
            language,
            languageName: LANGUAGE_OPTIONS.find((option) => option.value === language)?.label ?? language,
            identified,
          });
        }}
      >
        {copy.beginSession}
      </button>
      {translationLoading && <p className="privacy-note" role="status">{copy.translationLoading}</p>}
    </main>
  );
}
