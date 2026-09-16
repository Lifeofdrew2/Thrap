const REQUEST_TIMEOUT_MS = 8_000;

export type AuthFailureCode =
  | "invalid_credentials"
  | "email_already_registered"
  | "invalid_request"
  | "network"
  | "timeout"
  | "unknown";

export class AuthRequestError extends Error {
  constructor(public readonly code: AuthFailureCode) {
    super(`auth_request_${code}`);
    this.name = "AuthRequestError";
  }
}

export interface AuthUser {
  email: string;
}

export interface StoredHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => null)) as (T & { error?: AuthFailureCode }) | null;

    if (!response.ok) {
      throw new AuthRequestError(data?.error && data.error !== "unknown" ? data.error : "unknown");
    }
    if (!data) throw new AuthRequestError("unknown");
    return data;
  } catch (error) {
    if (error instanceof AuthRequestError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw new AuthRequestError("timeout");
    throw new AuthRequestError("network");
  } finally {
    window.clearTimeout(timeout);
  }
}

export function requestSignup(email: string, password: string): Promise<{ ok: true; email: string }> {
  return postJson("/api/auth/signup", { email, password });
}

export function requestLogin(email: string, password: string): Promise<{ ok: true; email: string }> {
  return postJson("/api/auth/login", { email, password });
}

export function requestLogout(): Promise<{ ok: true }> {
  return postJson("/api/auth/logout", {});
}

export function requestMe(): Promise<{ user: AuthUser | null }> {
  return postJson("/api/auth/me", {});
}

export function requestHistory(): Promise<{ messages: StoredHistoryMessage[] }> {
  return postJson("/api/history", {});
}
