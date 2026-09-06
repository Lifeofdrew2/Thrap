import { afterEach, describe, expect, it, vi } from "vitest";
import { createRetriever } from "../../src/rag/retrieve";
import { createThrapApi, parseNavigationInput, type ThrapConfig } from "../../src/server/api";
import { getSession } from "../../src/server/session";

const config: ThrapConfig = {
  apiKey: "",
  model: "test-model",
  embed: { provider: "openrouter", apiKey: "", model: "test-embedding" },
};

const api = createThrapApi(config, async () => createRetriever([]));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("navigation safety and context", () => {
  it.each([
    "I wan die",
    "I no wan live again",
    "Life no worth am",
    "I don tire for life",
  ])("escalates Nigerian crisis wording: %s", async (message) => {
    const result = await api.navigate({ message, region: "NG", language: "pcm", languageName: "Nigerian Pidgin" }, getSession(crypto.randomUUID()));

    expect(result.body).toMatchObject({ kind: "escalation", reasonCode: "crisis" });
  });

  it("accepts only supported regional context", () => {
    expect(parseNavigationInput({ region: "NG", language: "pcm", languageName: "Nigerian Pidgin" })).toEqual({
      region: "NG",
      language: "pcm",
      languageName: "Nigerian Pidgin",
    });
    expect(parseNavigationInput({ region: "N", language: "x" })).toBeNull();
  });
});