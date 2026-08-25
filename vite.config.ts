import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import {
  configFromEnv,
  createSessionId,
  createThrapApi,
  getSession,
  type ThrapConfig,
} from "./src/server/api";
import { buildRetriever } from "./src/server/knowledge";

/**
 * Dev-server API.
 *
 * The request handling lives in `src/server/api.ts`, shared verbatim with the
 * production server, so the crisis gate, turn limit, and output guard cannot
 * drift between what is tested here and what is served to people.
 */
function therapyApiPlugin(config: ThrapConfig): Plugin {
  const api = createThrapApi(config, buildRetriever);

  if (!api.hasKey) {
    console.warn(
      "\n[!] [Thrap] No OPENROUTER_API_KEY found in .env.local - " +
      "running with deterministic fallback responses.\n" +
      "   Copy .env.example to .env.local and add your key to enable the real AI.\n"
    );
  } else {
    console.info(`\n[ok] [Thrap] OpenRouter connected (model: ${config.model})\n`);
  }

  // One session per dev server. Production keys sessions by cookie; a single
  // local developer does not need that, and a stable id keeps hot reloads from
  // resetting the conversation.
  const devSessionId = createSessionId();

  return {
    name: "therapy-api",
    configureServer(server) {
      // Warm the index at startup so the first message is not slowed by it.
      void api.ready().catch(() => undefined);

      server.middlewares.use(async (req, res, next) => {
        if (req.method !== "POST" || !req.url) { next(); return; }

        const send = (result: { status: number; body: unknown }) => {
          res.statusCode = result.status;
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          res.end(JSON.stringify(result.body));
        };

        if (req.url === "/api/session/clear") { send(api.clear(devSessionId)); return; }
        if (req.url === "/api/human-route")   { send(api.humanRoute()); return; }

        if (req.url === "/api/navigate") {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const body = JSON.parse(Buffer.concat(chunks).toString()) as {
            message?: string;
            intent?: string;
          };

          send(await api.navigate(body, getSession(devSessionId)));
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // loadEnv loads .env, .env.local, .env.[mode], .env.[mode].local
  // The empty string prefix means ALL variables are loaded (not just VITE_*)
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), therapyApiPlugin(configFromEnv(env))],
    server: {
      // Bound to the loopback interface only: this service handles sensitive
      // wellbeing conversations and must not be exposed on the local network.
      // Bound by IPv4 address rather than the name "localhost": on Windows
      // that name resolves to ::1 first, which would leave 127.0.0.1 and
      // thrap.localhost pointing at whatever else holds the IPv4 port.
      host: "127.0.0.1",
      port: 5180,
      // Fail loudly rather than silently moving to another port, so the URL
      // people bookmark keeps working.
      strictPort: true,
      // Browsers resolve any *.localhost name to loopback without a hosts
      // entry, so thrap.localhost works once Vite accepts the Host header.
      allowedHosts: ["localhost", "thrap.localhost"],
    },
  };
});
