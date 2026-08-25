/**
 * In-memory conversation sessions, keyed by an opaque session id.
 *
 * Conversation content is deliberately never persisted: it lives here for the
 * life of the process and is lost on restart, which matches the frontend rule
 * that a refresh loses the conversation. Nothing here reaches a database, a
 * log, or disk.
 *
 * A single shared session would be a privacy failure rather than a limitation:
 * on any multi-user deployment one person's disclosures would be replayed into
 * another person's prompt as history.
 */

/** One turn of conversation, in the provider's message shape. */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface Session {
  history: ChatMessage[];
  turnCount: number;
  fallbackIndex: number;
  lastSeen: number;
}

/** Idle sessions are dropped so abandoned conversations do not linger in memory. */
const SESSION_TTL_MS = 60 * 60 * 1000;

/** Hard cap on concurrent sessions, so the store cannot grow without bound. */
const MAX_SESSIONS = 5_000;

/** Turns kept in context. Twenty exchanges, as two entries each. */
const MAX_HISTORY_ENTRIES = 40;

const sessions = new Map<string, Session>();

function newSession(): Session {
  return { history: [], turnCount: 0, fallbackIndex: 0, lastSeen: Date.now() };
}

/** Drop expired sessions, then the oldest if still over the cap. */
function evict(): void {
  const cutoff = Date.now() - SESSION_TTL_MS;

  for (const [id, session] of sessions) {
    if (session.lastSeen < cutoff) sessions.delete(id);
  }

  if (sessions.size <= MAX_SESSIONS) return;

  const byAge = [...sessions.entries()].sort((a, b) => a[1].lastSeen - b[1].lastSeen);
  for (const [id] of byAge.slice(0, sessions.size - MAX_SESSIONS)) sessions.delete(id);
}

/** Fetch or create the session for an id, refreshing its idle timer. */
export function getSession(id: string): Session {
  evict();

  const existing = sessions.get(id);
  if (existing) {
    existing.lastSeen = Date.now();
    return existing;
  }

  const created = newSession();
  sessions.set(id, created);
  return created;
}

/** Discard a session's contents. Called by the clear-session endpoint. */
export function clearSession(id: string): void {
  sessions.delete(id);
}

export function recordExchange(session: Session, userMessage: string, modelReply: string): void {
  session.history.push(
    { role: "user", content: userMessage },
    { role: "assistant", content: modelReply },
  );

  if (session.history.length > MAX_HISTORY_ENTRIES) {
    session.history = session.history.slice(-MAX_HISTORY_ENTRIES);
  }
}

/** Opaque, unguessable session id. */
export function createSessionId(): string {
  return globalThis.crypto.randomUUID();
}

/** Exposed for health reporting; deliberately a count only, never contents. */
export const sessionCount = () => sessions.size;
