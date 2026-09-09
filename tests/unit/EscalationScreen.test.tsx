import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getAppCopy } from "../../src/app/i18n";
import { EscalationScreen } from "../../src/components/EscalationScreen";

describe("EscalationScreen", () => {
  it("renders the reviewed terminal structure", () => {
    render(<EscalationScreen copy={getAppCopy("eng")} region="NG" />);

    expect(screen.getByRole("heading", { name: "Contact support now" })).toHaveFocus();
    expect(screen.getByRole("link", { name: /112.*emergency services/i })).toHaveAttribute("href", "tel:112");
    expect(screen.getByRole("link", { name: /767.*emergency services/i })).toHaveAttribute("href", "tel:767");
    expect(screen.getByRole("link", { name: /0809 210 6493.*mani helpline/i })).toHaveAttribute("href", "tel:08092106493");
    expect(screen.getByRole("link", { name: /contact licensed counsellor.*confidential eap support portal/i })).toBeVisible();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /retry|try again|dismiss|close/i })).not.toBeInTheDocument();
  });

  it("uses the selected country's support contacts", () => {
    render(<EscalationScreen copy={getAppCopy("eng")} region="US" />);

    expect(screen.getByRole("heading", { name: "United States emergency support" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /911.*emergency services/i })).toHaveAttribute("href", "tel:911");
    expect(screen.getByRole("link", { name: /988.*suicide.*crisis lifeline/i })).toHaveAttribute("href", "tel:988");
    expect(screen.queryByRole("link", { name: /0809 210 6493/i })).not.toBeInTheDocument();
  });

  it("renders a back action when the route is manually opened", () => {
    const onBack = vi.fn();
    render(<EscalationScreen copy={getAppCopy("eng")} region="NG" onBack={onBack} />);

    screen.getByRole("button", { name: /back/i }).click();

    expect(onBack).toHaveBeenCalledOnce();
  });
});
