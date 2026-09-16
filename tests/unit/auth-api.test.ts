import { describe, expect, it } from "vitest";
import { createRetriever } from "../../src/rag/retrieve";
import { createThrapApi, type ThrapConfig } from "../../src/server/api";
import { attachUser, getSession } from "../../src/server/session";

const config: ThrapConfig = {
  apiKey: "",
  model: "test-model",
  embed: { provider: "openrouter", apiKey: "", model: "test-embedding" },
};

function freshApi() {
  return createThrapApi(config, async () => createRetriever([]));
}

function uniqueEmail(): string {
  return `${crypto.randomUUID()}@example.com`;
}

describe("identified accounts", () => {
  it("signs a person up and lets them log back in", () => {
    const api = freshApi();
    const email = uniqueEmail();

    const signedUp = api.signup(email, "correct-horse-battery");
    expect(signedUp.status).toBe(200);
    expect(signedUp.userId).toBeTruthy();

    const loggedIn = api.login(email, "correct-horse-battery");
    expect(loggedIn.status).toBe(200);
    expect(loggedIn.userId).toBe(signedUp.userId);
  });

  it("rejects a second signup with the same email", () => {
    const api = freshApi();
    const email = uniqueEmail();

    api.signup(email, "correct-horse-battery");
    const second = api.signup(email, "a-different-password");

    expect(second.status).toBe(409);
    expect(second.userId).toBeUndefined();
  });

  it("rejects login with the wrong password", () => {
    const api = freshApi();
    const email = uniqueEmail();

    api.signup(email, "correct-horse-battery");
    const attempt = api.login(email, "wrong-password");

    expect(attempt.status).toBe(401);
    expect(attempt.userId).toBeUndefined();
  });

  it("persists an identified conversation across sessions", async () => {
    const api = freshApi();
    const email = uniqueEmail();
    const { userId } = api.signup(email, "correct-horse-battery");

    const firstSession = getSession(crypto.randomUUID());
    attachUser(firstSession, userId!);
    await api.navigate({ message: "I have been feeling low", region: "NG", language: "eng" }, firstSession);

    const history = api.history(userId!);
    expect(history.body).toMatchObject({
      messages: [
        { role: "user", content: "I have been feeling low" },
        { role: "assistant" },
      ],
    });

    // A brand-new in-memory session for the same account (e.g. a new device,
    // or the server having restarted) must see the same stored history rather
    // than starting the model with no context.
    const secondSession = getSession(crypto.randomUUID());
    attachUser(secondSession, userId!);
    await api.navigate({ message: "Any updates?", region: "NG", language: "eng" }, secondSession);

    expect(secondSession.history[0]).toMatchObject({ role: "user", content: "I have been feeling low" });
  });

  it("never writes anonymous conversations to the account store", async () => {
    const api = freshApi();
    const session = getSession(crypto.randomUUID());

    await api.navigate({ message: "This should stay ephemeral", region: "NG", language: "eng" }, session);

    expect(api.history(null).body).toEqual({ messages: [] });
  });
});
