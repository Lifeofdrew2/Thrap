/**
 * Production server: serves the built client and the Thrap API.
 *
 * Deliberately built on `node:http` with no framework. The routing surface is
 * three endpoints and a static directory, which does not justify a dependency
 * against the budget in FRONTEND.md.
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import {
  attachUser,
  configFromEnv,
  createSessionId,
  createThrapApi,
  getSession,
  parseAuthInput,
  parseNavigationInput,
  type ApiResult,
} from "./api";
import { buildRetriever } from "./knowledge";
import {
  buildAuthClearCookie,
  buildAuthCookie,
  buildSessionCookie,
  readCookie,
  resolveUserId,
  SESSION_COOKIE_NAME,
} from "./cookies";

const PORT = Number(process.env.PORT ?? 5180);
const HOST = process.env.HOST ?? "0.0.0.0";
const CLIENT_DIR = path.resolve(process.cwd(), process.env.CLIENT_DIR ?? "dist");

const config = configFromEnv(process.env);
const api = createThrapApi(config, buildRetriever);

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".json": "application/json; charset=utf-8",
};

/** Multiple Set-Cookie headers must coexist; res.setHeader alone overwrites. */
function appendSetCookie(res: ServerResponse, cookie: string): void {
  const existing = res.getHeader("Set-Cookie");
  if (!existing) res.setHeader("Set-Cookie", cookie);
  else if (Array.isArray(existing)) res.setHeader("Set-Cookie", [...existing, cookie]);
  else res.setHeader("Set-Cookie", [String(existing), cookie]);
}

/**
 * Resolve the caller's session, issuing an id when there is none.
 *
 * The cookie is httpOnly and SameSite=Lax so it is unreadable from script and
 * not sent cross-site. `Secure` is set in production; it is omitted locally
 * so plain-HTTP development still works.
 */
function resolveSession(req: IncomingMessage, res: ServerResponse): string {
  const existing = readCookie(req, SESSION_COOKIE_NAME);
  if (existing) return existing;

  const id = createSessionId();
  appendSetCookie(res, buildSessionCookie(id));
  return id;
}

function sendJson(res: ServerResponse, result: ApiResult): void {
  res.writeHead(result.status, {
    "Content-Type": "application/json; charset=utf-8",
    // Session-sensitive: never cached by a browser or an intermediary.
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(result.body));
}

/** Read a bounded JSON body. An oversized body is rejected rather than buffered. */
const MAX_BODY_BYTES = 32 * 1024;

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new Error("Request body too large");
    chunks.push(chunk as Buffer);
  }

  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
}

async function serveStatic(res: ServerResponse, urlPath: string): Promise<void> {
  // Resolve inside CLIENT_DIR and verify containment, so `..` cannot escape it.
  const requested = path.resolve(CLIENT_DIR, `.${urlPath}`);
  const target = requested.startsWith(CLIENT_DIR) ? requested : CLIENT_DIR;

  let file = target;
  try {
    const info = await stat(file);
    if (info.isDirectory()) file = path.join(file, "index.html");
  } catch {
    // Unknown path: hand back the SPA entry point.
    file = path.join(CLIENT_DIR, "index.html");
  }

  try {
    await stat(file);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }

  const extension = path.extname(file);
  const immutable = file.includes(`${path.sep}assets${path.sep}`);

  res.writeHead(200, {
    "Content-Type": MIME[extension] ?? "application/octet-stream",
    // Hashed asset filenames are safe to cache; index.html must not be.
    "Cache-Control": immutable ? "public, max-age=31536000, immutable" : "no-cache",
    "X-Content-Type-Options": "nosniff",
  });
  createReadStream(file).pipe(res);
}

const server = createServer(async (req, res) => {
  const urlPath = (req.url ?? "/").split("?")[0];

  try {
    if (urlPath === "/healthz") {
      // Readiness without exposing configuration or document content.
      const retriever = await api.ready();
      sendJson(res, {
        status: 200,
        body: {
          ok: true,
          chunks: retriever.size,
          semanticSearch: retriever.hasEmbeddings,
          modelConfigured: api.hasKey,
        },
      });
      return;
    }

    if (urlPath.startsWith("/api/")) {
      if (req.method !== "POST") {
        sendJson(res, { status: 405, body: { error: "method_not_allowed" } });
        return;
      }

      const sessionId = resolveSession(req, res);

      if (urlPath === "/api/session/clear") {
        sendJson(res, api.clear(sessionId));
        return;
      }
      if (urlPath === "/api/human-route") {
        sendJson(res, api.humanRoute());
        return;
      }
      if (urlPath === "/api/auth/signup" || urlPath === "/api/auth/login") {
        const parsed = parseAuthInput(await readJsonBody(req));
        if (!parsed) {
          sendJson(res, { status: 400, body: { error: "invalid_request" } });
          return;
        }
        const result = urlPath === "/api/auth/signup"
          ? api.signup(parsed.email, parsed.password)
          : api.login(parsed.email, parsed.password);
        if (result.userId) appendSetCookie(res, buildAuthCookie(result.userId));
        sendJson(res, { status: result.status, body: result.body });
        return;
      }
      if (urlPath === "/api/auth/logout") {
        appendSetCookie(res, buildAuthClearCookie());
        sendJson(res, { status: 200, body: { ok: true } });
        return;
      }
      if (urlPath === "/api/auth/me") {
        sendJson(res, api.me(resolveUserId(req)));
        return;
      }
      if (urlPath === "/api/history") {
        sendJson(res, api.history(resolveUserId(req)));
        return;
      }
      if (urlPath === "/api/translate-ui") {
        const body = await readJsonBody(req) as { languageCode?: string; languageName?: string; copy?: Record<string, unknown> };
        sendJson(res, await api.translateUi({ languageCode: body.languageCode ?? "", languageName: body.languageName ?? "", copy: body.copy ?? {} }));
        return;
      }
      if (urlPath === "/api/navigate") {
        const body = parseNavigationInput(await readJsonBody(req));
        if (!body) {
          sendJson(res, { status: 400, body: { error: "invalid_request" } });
          return;
        }
        const session = getSession(sessionId);
        attachUser(session, resolveUserId(req));
        sendJson(res, await api.navigate(body, session));
        return;
      }

      sendJson(res, { status: 404, body: { error: "not_found" } });
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405).end();
      return;
    }

    await serveStatic(res, urlPath);
  } catch (error) {
    // Never leak an error body to the client: the frontend treats any
    // non-conforming response as a terminal escalation, which is correct here.
    console.error("[Thrap] Request failed:", error instanceof Error ? error.message : error);
    if (!res.headersSent) sendJson(res, { status: 500, body: { error: "internal" } });
    else res.end();
  }
});

server.listen(PORT, HOST, () => {
  console.info(
    api.hasKey
      ? `[ok] [Thrap] OpenRouter connected (model: ${config.model})`
      : "[!] [Thrap] No OPENROUTER_API_KEY set - serving deterministic fallback responses",
  );
  console.info(`[ok] [Thrap] listening on http://${HOST}:${PORT}`);

  // Warm the index so the first message is not slowed by it.
  void api.ready().catch(() => undefined);
});

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
