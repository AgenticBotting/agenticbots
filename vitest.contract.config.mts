import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/** Optional live contract test against a real runtime. Never runs in demo. */
export default defineConfig({
  resolve: {
    alias: {
      "@/": fileURLToPath(new URL("./src/", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/support/empty.ts", import.meta.url)),
    },
  },
  test: { include: ["tests/contract/**/*.test.ts"], environment: "node", testTimeout: 180_000, env: { DEMO_MODE: "false" } },
});
