import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@/": fileURLToPath(new URL("./src/", import.meta.url)),
      "@convex/": fileURLToPath(new URL("./convex/", import.meta.url)),
      // `server-only` throws outside a React Server Component bundle; in
      // Node tests every module is server-side by definition.
      "server-only": fileURLToPath(new URL("./tests/support/empty.ts", import.meta.url)),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts", "tests/security/**/*.test.ts"],
    environment: "node",
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: { DEMO_MODE: "true", DEMO_PERSIST: "false" },
    pool: "forks",
  },
});
