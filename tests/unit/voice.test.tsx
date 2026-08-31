import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConversationView } from "../../src/components/ConversationView";

/**
 * Voice input must never become a way to reach the service without the person
 * seeing what will be sent. A mis-transcription has to be visible and
 * correctable, and the crisis gate should classify the words they meant.
 */

type Handler = ((event: unknown) => void) | null;

class MockRecognition {
  static instances: MockRecognition[] = [];
  lang = "";
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  started = false;
  onresult: Handler = null;
  onerror: Handler = null;
  onend: (() => void) | null = null;
  onstart: (() => void) | null = null;

  constructor() {
    MockRecognition.instances.push(this);
  }

  start() {
    this.started = true;
    this.onstart?.();
  }
  stop() {
    this.started = false;
    this.onend?.();
  }
  abort() {
    this.started = false;
  }

  /** Push a finalised phrase, as the browser would. */
  emitFinal(transcript: string) {
    this.onresult?.({
      resultIndex: 0,
      results: { length: 1, 0: { length: 1, isFinal: true, 0: { transcript, confidence: 0.9 } } },
    });
  }
}

const baseProps = {
  messages: [],
  turn: { used: 0, limit: 20 },
  onShortcut: vi.fn(),
  disabled: false,
  isTyping: false,
};

beforeEach(() => {
  MockRecognition.instances = [];
  (window as unknown as Record<string, unknown>).SpeechRecognition = MockRecognition;
});

afterEach(() => {
  delete (window as unknown as Record<string, unknown>).SpeechRecognition;
  vi.restoreAllMocks();
});

describe("voice input", () => {
  it("offers a microphone when the browser supports recognition", () => {
    render(<ConversationView {...baseProps} onSubmit={vi.fn()} />);
    expect(screen.getByRole("button", { name: /dictate your message/i })).toBeInTheDocument();
  });

  it("hides the microphone entirely when recognition is unavailable", () => {
    delete (window as unknown as Record<string, unknown>).SpeechRecognition;
    render(<ConversationView {...baseProps} onSubmit={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /dictate/i })).not.toBeInTheDocument();
  });

  it("puts the transcript in the composer without sending it", () => {
    const onSubmit = vi.fn();
    render(<ConversationView {...baseProps} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: /dictate your message/i }));
    act(() => MockRecognition.instances[0].emitFinal("I have been feeling low"));

    expect(screen.getByRole("textbox")).toHaveValue("I have been feeling low");
    // The safety-critical assertion: speech alone never reaches the service.
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("sends only on an explicit press, after the person has seen the text", () => {
    const onSubmit = vi.fn();
    render(<ConversationView {...baseProps} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: /dictate your message/i }));
    act(() => MockRecognition.instances[0].emitFinal("I cannot sleep"));
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith("I cannot sleep");
  });

  it("lets a mis-transcription be corrected before sending", () => {
    const onSubmit = vi.fn();
    render(<ConversationView {...baseProps} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: /dictate your message/i }));
    act(() => MockRecognition.instances[0].emitFinal("I cannot sheep"));

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "I cannot sleep" } });
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith("I cannot sleep");
  });

  it("appends dictation to text already typed rather than replacing it", () => {
    render(<ConversationView {...baseProps} onSubmit={vi.fn()} />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Since Monday" } });
    fireEvent.click(screen.getByRole("button", { name: /dictate your message/i }));
    act(() => MockRecognition.instances[0].emitFinal("I have not slept"));

    expect(screen.getByRole("textbox")).toHaveValue("Since Monday I have not slept");
  });

  it("announces listening state in a live region and on the control", () => {
    render(<ConversationView {...baseProps} onSubmit={vi.fn()} />);
    const mic = screen.getByRole("button", { name: /dictate your message/i });

    expect(mic).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(mic);

    expect(screen.getByRole("button", { name: /stop dictating/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status", { name: /voice input status/i })).toHaveTextContent(/listening/i);
  });

  it("surfaces a blocked microphone in plain language", () => {
    render(<ConversationView {...baseProps} onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /dictate your message/i }));

    act(() => { MockRecognition.instances[0].onerror?.({ error: "not-allowed" }); });

    expect(screen.getByRole("status", { name: /voice input status/i })).toHaveTextContent(/microphone access was blocked/i);
  });

  it("tells the person that dictation leaves the device", () => {
    render(<ConversationView {...baseProps} onSubmit={vi.fn()} />);
    expect(screen.getByText(/may send audio to your browser provider/i)).toBeInTheDocument();
  });

  it("keeps read-aloud off until it is switched on", () => {
    render(<ConversationView {...baseProps} onSubmit={vi.fn()} />);
    const toggle = screen.queryByRole("button", { name: /read replies aloud/i });
    if (toggle) expect(toggle).toHaveAttribute("aria-pressed", "false");
  });
});
