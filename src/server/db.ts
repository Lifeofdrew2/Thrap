/**
 * Persistent storage for identified accounts and their conversation history.
 *
 * This is a deliberate departure from the anonymous, nothing-persisted model
 * documented in ARCHITECTURE.md/FRONTEND.md: it exists only for people who
 * explicitly chose "Allow identified support" and then created or logged into
 * an account. Anonymous sessions never touch this file — see session.ts.
 *
 * Built on node:sqlite (stable in the Node version this project targets) so no
 * new dependency is needed for a single small embedded database.
 */

import { DatabaseSync } from "node:sqlite";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DB_PATH ?? path.resolve(process.cwd(), "data", "thrap.db");
mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS messages_user_id_idx ON messages(user_id);
`);

export interface StoredUser {
  id: string;
  email: string;
}

export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

const SCRYPT_KEYLEN = 64;

function hashPassword(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, SCRYPT_KEYLEN);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super("email_already_registered");
  }
}

export function createUser(email: string, password: string): StoredUser {
  const normalized = normalizeEmail(email);
  const existing = getUserByEmail(normalized);
  if (existing) throw new EmailAlreadyRegisteredError();

  const id = randomUUID();
  const salt = randomBytes(16);
  const hash = hashPassword(password, salt);

  db.prepare(
    "INSERT INTO users (id, email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(id, normalized, hash.toString("hex"), salt.toString("hex"), Date.now());

  return { id, email: normalized };
}

/** Returns the user only when the password matches; never throws on bad input. */
export function verifyCredentials(email: string, password: string): StoredUser | null {
  const row = db
    .prepare("SELECT id, email, password_hash, password_salt FROM users WHERE email = ?")
    .get(normalizeEmail(email)) as
    | { id: string; email: string; password_hash: string; password_salt: string }
    | undefined;
  if (!row) return null;

  const salt = Buffer.from(row.password_salt, "hex");
  const expected = Buffer.from(row.password_hash, "hex");
  const actual = hashPassword(password, salt);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  return { id: row.id, email: row.email };
}

export function getUserByEmail(email: string): StoredUser | null {
  const row = db.prepare("SELECT id, email FROM users WHERE email = ?").get(normalizeEmail(email)) as
    | { id: string; email: string }
    | undefined;
  return row ?? null;
}

export function getUserById(id: string): StoredUser | null {
  const row = db.prepare("SELECT id, email FROM users WHERE id = ?").get(id) as
    | { id: string; email: string }
    | undefined;
  return row ?? null;
}

export function appendMessage(userId: string, role: "user" | "assistant", content: string): void {
  db.prepare(
    "INSERT INTO messages (id, user_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(randomUUID(), userId, role, content, Date.now());
}

/**
 * Oldest-first, capped to the most recent `limit` entries.
 *
 * Ordered by rowid rather than created_at: two messages recorded in the same
 * exchange can share a millisecond timestamp, and rowid is the one column
 * guaranteed to increase in insertion order.
 */
export function loadHistory(userId: string, limit: number): StoredMessage[] {
  const rows = db
    .prepare(
      "SELECT role, content, created_at FROM messages WHERE user_id = ? ORDER BY rowid DESC LIMIT ?",
    )
    .all(userId, limit) as { role: "user" | "assistant"; content: string; created_at: number }[];

  return rows.reverse().map((row) => ({ role: row.role, content: row.content, createdAt: row.created_at }));
}
