import { escalationResponseSchema } from "./schemas";
import { ServiceRequestError } from "./errors";
import type { EscalationResponse } from "./types";

const REQUEST_TIMEOUT_MS = 8_000;

export async function requestHumanRoute(): Promise<EscalationResponse> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("/api/human-route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent: "TALK_TO_SOMEONE_NOW" }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) throw new ServiceRequestError("http");

    const parsed = escalationResponseSchema.safeParse(await response.json());
    if (!parsed.success) throw new ServiceRequestError("invalid_response");

    return parsed.data;
  } catch (error) {
    if (error instanceof ServiceRequestError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ServiceRequestError("timeout");
    }
    throw new ServiceRequestError("network");
  } finally {
    window.clearTimeout(timeout);
  }
}
