import { useEffect, useRef, useState } from "react";
import type { Citation, TurnState } from "../api/types";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";

export interface ConversationMessage {
  id: string;
  author: "user" | "service";
  text: string;
  citations?: Citation[];
  bookingPrompt?: boolean;
}

const SHORTCUTS: { icon: string; label: string; desc: string; intent: string }[] = [
  { icon: "💬", label: "I need to talk",       desc: "Share what's on your mind",         intent: "TALK_THROUGH" },
  { icon: "😰", label: "Feeling anxious",       desc: "Explore anxiety and stress",        intent: "ANXIETY" },
  { icon: "😔", label: "Feeling low",           desc: "Talk about low mood or sadness",    intent: "LOW_MOOD" },
  { icon: "🔋", label: "Burnout & work stress", desc: "Workplace pressure and exhaustion", intent: "BURNOUT" },
  { icon: "😴", label: "Sleep & rest",          desc: "Trouble sleeping or recovering",    intent: "SLEEP" },
  { icon: "🤝", label: "Talk to a counsellor",  desc: "Connect with a professional now",   intent: "BOOK_COUNSELLOR" },
];

interface ConversationViewProps {
  messages: ConversationMessage[];
  turn: TurnState;
  onSubmit: (text: string) => void;
  onShortcut: (intent: string) => void;
  disabled: boolean;
  isTyping: boolean;
}

export function ConversationView({ messages, turn, onSubmit, onShortcut, disabled, isTyping }: ConversationViewProps) {
  const remaining = Math.max(turn.limit - turn.used, 0);

  const [draft, setDraft] = useState("");
  const [readAloud, setReadAloud] = useState(false);

  const speech = useSpeechRecognition();
  const voice = useSpeechSynthesis();
  const listening = speech.status === "listening";

  // Text already in the composer when dictation began, so speech appends to it
  // rather than replacing what the person typed.
  const baseDraft = useRef("");

  // Dictated words land in the composer for the person to read and edit. The
  // message is only ever sent by an explicit press, so a mis-transcription is
  // visible and correctable before it reaches the service.
  useEffect(() => {
    if (speech.transcript) setDraft(`${baseDraft.current}${speech.transcript}`);
  }, [speech.transcript]);

  // Read the newest service reply when the person has asked for it.
  const lastSpokenId = useRef<string | null>(null);
  useEffect(() => {
    if (!readAloud) return;
    const latest = [...messages].reverse().find((message) => message.author === "service");
    if (!latest || latest.id === lastSpokenId.current) return;
    lastSpokenId.current = latest.id;
    voice.speak(latest.text);
  }, [messages, readAloud, voice]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    speech.stop();
    speech.reset();
    setDraft("");
    onSubmit(text);
  }

  function toggleListening() {
    if (listening) {
      speech.stop();
      return;
    }
    // Anchor to what is already typed so dictation continues from it.
    baseDraft.current = draft.trim() ? `${draft.trim()} ` : "";
    speech.reset();
    speech.start();
  }

  function toggleReadAloud() {
    setReadAloud((current) => {
      if (current) voice.cancel();
      return !current;
    });
  }

  return (
    <main className="page-wrap conversation" aria-labelledby="conversation-heading">
      <div className="conversation-heading-row">
        <div>
          <p className="eyebrow">Therapy support</p>
          <h1 id="conversation-heading">How are you feeling today?</h1>
        </div>
        <span className="turn-status" role="status">
          {remaining} {remaining === 1 ? "exchange" : "exchanges"} remaining
        </span>
      </div>

      {messages.length === 0 ? (
        <>
          <p className="shortcut-intro">Choose a topic to begin, or type your own message below.</p>
          <div className="shortcut-grid" aria-label="Conversation starters">
            {SHORTCUTS.map(({ icon, label, desc, intent }) => (
              <button
                className="shortcut"
                type="button"
                key={intent}
                onClick={() => onShortcut(intent)}
                disabled={disabled}
              >
                <span className="shortcut-icon" aria-hidden="true">{icon}</span>
                <span className="shortcut-label">{label}</span>
                <span className="shortcut-desc">{desc}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="messages-wrap">
          <div className="messages" aria-live="polite" aria-label="Conversation">
            {messages.map((message) => (
              <article className={`message message--${message.author}`} key={message.id}>
                <div className="message__bubble">
                  {message.text}
                  {message.citations && message.citations.length > 0 && (
                    <div className="citations" aria-label="Sources">
                      <strong>Sources</strong>
                      {message.citations.map((c) => (
                        <span key={`${c.documentTitle}-${c.section}`}>
                          {c.documentTitle}, {c.section}{c.version ? ` (${c.version})` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {message.bookingPrompt && (
                  <div className="booking-prompt" role="complementary" aria-label="Book a session">
                    <p className="booking-prompt__heading">Ready to take the next step?</p>
                    <p className="booking-prompt__body">
                      Booking a session is confidential and usually available within 48 hours.
                    </p>
                    <a className="booking-prompt__btn" href="#eap-booking" id="book-session-link">
                      Book a counsellor session
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </a>
                  </div>
                )}
                <p className="message__meta">{message.author === "user" ? "You" : "Thrap"}</p>
              </article>
            ))}
            {isTyping && (
              <div className="message message--service" aria-label="Thrap is responding">
                <div className="typing-indicator" aria-hidden="true">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
                <p className="message__meta">Thrap</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="composer-wrap">
        <form className="composer" onSubmit={handleSubmit}>
          <label className="composer-label" htmlFor="message">
            Share what's on your mind
          </label>
          <div className="composer-row">
            <input
              className="composer-input"
              id="message"
              name="message"
              maxLength={1000}
              disabled={disabled}
              autoComplete="off"
              placeholder={listening ? "Listening…" : "Type or use the microphone…"}
              value={listening && speech.interim ? `${draft}${speech.interim}` : draft}
              onChange={(event) => {
                setDraft(event.target.value);
                baseDraft.current = event.target.value;
              }}
            />

            {speech.status !== "unsupported" && (
              <button
                className={`mic-button${listening ? " mic-button--live" : ""}`}
                type="button"
                onClick={toggleListening}
                disabled={disabled}
                aria-pressed={listening}
                aria-label={listening ? "Stop dictating" : "Dictate your message"}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="7.25" y="2.5" width="5.5" height="9.5" rx="2.75" stroke="currentColor" strokeWidth="1.75"/>
                  <path d="M4.5 9.25a5.5 5.5 0 0 0 11 0M10 14.75v2.75" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                </svg>
              </button>
            )}

            <button className="send-button" type="submit" disabled={disabled || !draft.trim()} aria-label="Send message">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 10L17 10M17 10L11 4M17 10L11 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Voice status is announced, never only shown, and never replaces the
              send action: dictation always ends with the person pressing send. */}
          <p className="voice-status" role="status" aria-live="polite" aria-label="Voice input status">
            {speech.error
              ? speech.error
              : listening
              ? "Listening. Your words appear above — check them, then send."
              : ""}
          </p>

          <div className="composer-footer">
            <p className="composer-hint">Not a crisis service. If you're in danger, contact emergency services.</p>
            {voice.supported && (
              <button
                className="text-button text-button--sm"
                type="button"
                onClick={toggleReadAloud}
                aria-pressed={readAloud}
              >
                {readAloud ? "Turn off read aloud" : "Read replies aloud"}
              </button>
            )}
          </div>

          {speech.status !== "unsupported" && (
            <p className="voice-note">
              Dictation uses your browser's speech service, which may send audio to your
              browser provider. Type instead if you would rather it did not.
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
