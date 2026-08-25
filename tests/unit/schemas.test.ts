import { describe, expect, it } from "vitest";
import { serviceResponseSchema } from "../../src/api/schemas";

describe("service response contract", () => {
  it("rejects a factual answer without a citation", () => {
    const result = serviceResponseSchema.safeParse({
      kind: "answer",
      message: "Coverage is available.",
      citations: [],
      turn: { used: 1, limit: 4 },
    });

    expect(result.success).toBe(false);
  });

  it("accepts a typed escalation response", () => {
    const result = serviceResponseSchema.safeParse({
      kind: "escalation",
      message: "",
      reasonCode: "backend_failure",
      humanRoute: {
        role: "Support role",
        channelLabel: "Approved channel",
        actionTarget: "#support",
      },
    });

    expect(result.success).toBe(true);
  });
});
