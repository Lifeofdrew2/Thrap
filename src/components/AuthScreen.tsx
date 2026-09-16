import { useState } from "react";
import { AuthRequestError, requestLogin, requestSignup, type AuthFailureCode } from "../api/auth";
import type { AppCopy } from "../app/i18n";

interface AuthScreenProps {
  onAuthenticated: (email: string) => void;
  onBack: () => void;
  copy: AppCopy;
}

function errorMessage(code: AuthFailureCode, copy: AppCopy): string {
  if (code === "invalid_credentials") return copy.authErrorInvalidCredentials;
  if (code === "email_already_registered") return copy.authErrorEmailTaken;
  if (code === "network" || code === "timeout") return copy.authErrorNetwork;
  return copy.authErrorGeneric;
}

export function AuthScreen({ onAuthenticated, onBack, copy }: AuthScreenProps) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      const result = mode === "signup"
        ? await requestSignup(email, password)
        : await requestLogin(email, password);
      onAuthenticated(result.email);
    } catch (err) {
      const code = err instanceof AuthRequestError ? err.code : "unknown";
      setError(errorMessage(code, copy));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-wrap auth" aria-labelledby="auth-heading">
      <button className="text-button back-button" type="button" onClick={onBack}>
        <span aria-hidden="true">←</span> {copy.back}
      </button>
      <p className="eyebrow">{copy.authEyebrow}</p>
      <h1 id="auth-heading">{mode === "signup" ? copy.signUpTab : copy.logInTab}</h1>
      <p className="consent-body">{copy.authIntro}</p>

      <div className="choice-row" role="tablist" aria-label={copy.authEyebrow}>
        <button
          className={mode === "signup" ? "primary-button" : "secondary-button"}
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          onClick={() => { setMode("signup"); setError(null); }}
        >
          {copy.signUpTab}
        </button>
        <button
          className={mode === "login" ? "primary-button" : "secondary-button"}
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          onClick={() => { setMode("login"); setError(null); }}
        >
          {copy.logInTab}
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="conversation-preferences">
          <div>
            <label htmlFor="auth-email">{copy.emailLabel}</label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="auth-password">{copy.passwordLabel}</label>
            <input
              id="auth-password"
              type="password"
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        </div>
        <p className="privacy-note">{copy.passwordHint}</p>

        {error && <p className="privacy-note" role="alert">{error}</p>}

        <button className="primary-button" type="submit" disabled={submitting}>
          {copy.authContinue}
        </button>
      </form>
    </main>
  );
}
