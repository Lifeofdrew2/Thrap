/**
 * Cookie signing for the identified-account login cookie (`thrap_uid`).
 *
 * Kept separate from the anonymous session cookie in session.ts: `thrap_sid`
 * is opaque and unguessable on its own, but `thrap_uid` carries a real
 * database user id, so its value must be signed to stop a tampered cookie
 * from impersonating another account.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const FALLBACK_SECRET = process.env.NODE_ENV === "production" ? "" : randomBytes(32).toString("hex");

if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
  console.warn(
    "[Thrap] AUTH_SECRET is not set. Identified login is disabled until it is configured in production.",
  );
}

const SECRET = process.env.AUTH_SECRET ?? FALLBACK_SECRET;

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

export function signCookieValue(value: string): string {
  return `${value}.${sign(value)}`;
}

export function verifyCookieValue(signed: string): string | null {
  if (!SECRET) return null;

  const separator = signed.lastIndexOf(".");
  if (separator <= 0) return null;

  const value = signed.slice(0, separator);
  const signature = signed.slice(separator + 1);
  const expected = sign(value);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return value;
}
