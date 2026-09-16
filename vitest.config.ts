import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/integration/**/*.test.{ts,tsx}"],
    // Never write a real database file from tests, and keep cookie signing
    // deterministic without needing a real AUTH_SECRET in CI.
    env: { DB_PATH: ":memory:", AUTH_SECRET: "test-secret" },
  },
});
