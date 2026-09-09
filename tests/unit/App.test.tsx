import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/App";
import { LANGUAGE_OPTIONS } from "../../src/app/regions";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("App framing", () => {
  it("offers Igbo, Yoruba, and Hausa for translated sessions", () => {
    expect(LANGUAGE_OPTIONS).toEqual(expect.arrayContaining([
      { value: "ibo", label: "Ibo" },
      { value: "yor", label: "Yoruba" },
      { value: "hau", label: "Hausa" },
    ]));
  });

  it("keeps anonymous navigation available when selected", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Select your country"), { target: { value: "NG" } });
    fireEvent.change(screen.getByLabelText("Select your language"), { target: { value: "eng" } });
    fireEvent.click(screen.getByRole("button", { name: "Stay anonymous" }));
    fireEvent.click(screen.getByRole("button", { name: "I understand — begin session" }));

    expect(screen.getByRole("heading", { name: "How are you feeling today?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Talk to a counsellor/ })).toBeEnabled();
  });

  it("does not render message content optimistically", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
    render(<App />);

    fireEvent.change(screen.getByLabelText("Select your country"), { target: { value: "NG" } });
    fireEvent.change(screen.getByLabelText("Select your language"), { target: { value: "eng" } });
    fireEvent.click(screen.getByRole("button", { name: "Stay anonymous" }));
    fireEvent.click(screen.getByRole("button", { name: "I understand — begin session" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Check my coverage" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    expect(screen.getByText("Check my coverage")).toBeInTheDocument();
    expect(screen.queryByText("I can't help with this safely here")).not.toBeInTheDocument();
  });

  it("keeps the privacy choice on the onboarding page", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Select your country"), { target: { value: "NG" } });
    fireEvent.change(screen.getByLabelText("Select your language"), { target: { value: "eng" } });
    fireEvent.click(screen.getByRole("button", { name: "Allow identified support" }));

    expect(screen.getByRole("button", { name: "Allow identified support" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "I understand — begin session" })).toBeEnabled();
  });

  it("explains the selected processing mode in the conversation", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Select your country"), { target: { value: "NG" } });
    fireEvent.change(screen.getByLabelText("Select your language"), { target: { value: "eng" } });
    fireEvent.click(screen.getByRole("button", { name: "Allow identified support" }));
    fireEvent.click(screen.getByRole("button", { name: "I understand — begin session" }));

    expect(screen.getByText(/Identified support is allowed only/i)).toBeInTheDocument();
  });

  it("requires country and language before starting", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: "I understand — begin session" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Select your country"), { target: { value: "US" } });
    expect(screen.getByRole("button", { name: "I understand — begin session" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Select your language"), { target: { value: "eng" } });
    expect(screen.getByRole("button", { name: "I understand — begin session" })).toBeEnabled();
  });
});
