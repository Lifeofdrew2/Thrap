import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/App";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("App framing", () => {
  it("keeps anonymous navigation available when consent is refused", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Continue to service navigation" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue without identified processing" }));

    expect(screen.getByRole("heading", { name: "Find the right wellbeing service" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check coverage" })).toBeEnabled();
  });

  it("does not render message content optimistically", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Continue to service navigation" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue without identified processing" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Check my coverage" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByText("Check my coverage")).toBeInTheDocument();
    expect(screen.queryByText("I can't help with this safely here")).not.toBeInTheDocument();
  });
});
