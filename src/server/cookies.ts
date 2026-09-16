/**
 * Cookie helpers shared by the dev-server plugin (vite.config.ts) and the
 * production server (server/index.ts), so the two never drift on how the
 * session and identified-login cookies are read or written.
 */

import type { IncomingMessage } from "node:http";
import { signCookieValue, verifyCookieValue } from "./auth";

export const SESSION_COOKIE_NAME = "thrap_sid";
const SESSION_COOKIE_MAX_AGE = 60 * 60;

export const AUTH_COOKIE_NAME = "thrap_uid";
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function readCookie(req: IncomingMessage, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;

  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function resolveUserId(req: IncomingMessage): string | null {
  const cookie = readCookie(req, AUTH_COOKIE_NAME);
  return cookie ? verifyCookieValue(cookie) : null;
}

function secureSuffix(): string {
  return process.env.NODE_ENV === "production" ? "; Secure" : "";
}

export function buildSessionCookie(id: string): string {
  return `${SESSION_COOKIE_NAME}=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_COOKIE_MAX_AGE}${secureSuffix()}`;
}

export function buildAuthCookie(userId: string): string {
  return `${AUTH_COOKIE_NAME}=${signCookieValue(userId)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${AUTH_COOKIE_MAX_AGE}${secureSuffix()}`;
}

export function buildAuthClearCookie(): string {
  return `${AUTH_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}
