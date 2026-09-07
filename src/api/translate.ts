import type { AppCopy } from "../app/i18n";
import { ServiceRequestError } from "./errors";

const REQUEST_TIMEOUT_MS = 15_000;
const CACHE_PREFIX = "thrap-ui-copy:v2:";
const pendingTranslations = new Map<string, Promise<AppCopy>>();

function readCachedCopy(languageName: string): AppCopy | null {
  try {
    const cached = window.localStorage.getItem(`${CACHE_PREFIX}${languageName}`);
    return cached ? JSON.parse(cached) as AppCopy : null;
  } catch {
    return null;
  }
}

function cacheCopy(languageName: string, copy: AppCopy): void {
  try {
    window.localStorage.setItem(`${CACHE_PREFIX}${languageName}`, JSON.stringify(copy));
  } catch {
    // Storage can be unavailable in private browsing; the request still works.
  }
}

export async function requestTranslatedCopy(languageCode: string, languageName: string, copy: AppCopy): Promise<AppCopy> {
  const cacheKey = `${languageCode}:${languageName}`;
  const cached = readCachedCopy(cacheKey);
  if (cached) return cached;

  const pending = pendingTranslations.get(cacheKey);
  if (pending) return pending;

  const request = requestTranslatedCopyFromServer(languageCode, languageName, copy);
  pendingTranslations.set(cacheKey, request);
  try {
    const translated = await request;
    cacheCopy(cacheKey, translated);
    return translated;
  } finally {
    pendingTranslations.delete(cacheKey);
  }
}

async function requestTranslatedCopyFromServer(languageCode: string, languageName: string, copy: AppCopy): Promise<AppCopy> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("/api/translate-ui", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ languageCode, languageName, copy }),
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw new ServiceRequestError("http");

    const payload = await response.json() as { copy?: AppCopy };
    if (!payload.copy) throw new ServiceRequestError("invalid_response");
    return payload.copy;
  } catch (error) {
    if (error instanceof ServiceRequestError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw new ServiceRequestError("timeout");
    throw new ServiceRequestError("network");
  } finally {
    window.clearTimeout(timeout);
  }
}
