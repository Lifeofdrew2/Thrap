import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EscalationScreen } from "../../src/components/EscalationScreen";

describe("EscalationScreen", () => {
  it("renders the reviewed terminal structure", () => {
    render(<EscalationScreen />);

    expect(screen.getByRole("heading", { name: "Please contact a person" })).toHaveFocus();
    expect(screen.getByRole("link", { name: /employee assistance programme duty counsellor.*confidential eap support portal/i })).toBeVisible();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /retry|try again|dismiss|close/i })).not.toBeInTheDocument();
  });
});
