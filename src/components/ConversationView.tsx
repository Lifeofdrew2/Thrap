import type { Citation, TurnState } from "../api/types";

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("message");
    if (input instanceof HTMLInputElement && input.value.trim()) {
      onSubmit(input.value.trim());
      form.reset();
    }
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
              placeholder="Type here…"
            />
            <button className="send-button" type="submit" disabled={disabled} aria-label="Send message">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 10L17 10M17 10L11 4M17 10L11 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <p className="composer-hint">Not a crisis service. If you're in danger, contact emergency services.</p>
        </form>
      </div>
    </main>
  );
}
