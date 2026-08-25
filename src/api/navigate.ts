import { serviceResponseSchema } from "./schemas";
import { ServiceRequestError } from "./errors";
import type { ServiceResponse } from "./types";

const REQUEST_TIMEOUT_MS = 8_000;

export async function requestNavigation(input: { message?: string; intent?: string }): Promise<ServiceResponse> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("/api/navigate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw new ServiceRequestError("http");
    const parsed = serviceResponseSchema.safeParse(await response.json());
    if (!parsed.success) throw new ServiceRequestError("invalid_response");
    return parsed.data;
  } catch (error) {
    if (error instanceof ServiceRequestError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw new ServiceRequestError("timeout");
    throw new ServiceRequestError("network");
  } finally {
    window.clearTimeout(timeout);
  }
}
