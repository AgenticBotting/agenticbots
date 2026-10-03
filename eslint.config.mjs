import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Runtime boundary (docs/ARCHITECTURE.md → "Runtime translator layer"):
 *
 *   UI → AgenticBots server → BotRuntime (@/server/runtime) → adapter → engine
 *
 * Application code may import only the facade (@/server/runtime), the
 * neutral errors and the event translation registry. Adapter internals —
 * engine clients, wire types, mappers, auth, the factory — stay inside
 * src/server/runtime. UI components may not reach the runtime at all.
 */
const RUNTIME_INTERNALS = [
  {
    group: ["@/server/runtime/hermes", "@/server/runtime/hermes/*", "**/runtime/hermes/*"],
    message: "Engine-specific code is private to src/server/runtime. Use the BotRuntime facade from @/server/runtime.",
  },
  {
    group: ["@/server/runtime/RuntimeAdapter", "@/server/runtime/runtime-factory", "@/server/runtime/demo/*"],
    message: "Adapters are chosen by the runtime factory. Use the BotRuntime facade from @/server/runtime.",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/server/runtime/**", "src/server/demo/**", "src/server/aws/control.ts"],
    rules: { "no-restricted-imports": ["error", { patterns: RUNTIME_INTERNALS }] },
  },
  {
    // The demo control plane and demo seed drive the demo runtime's state
    // directly; they still may not touch engine-specific code.
    files: ["src/server/demo/**/*.{ts,tsx}", "src/server/aws/control.ts"],
    rules: { "no-restricted-imports": ["error", { patterns: [RUNTIME_INTERNALS[0]] }] },
  },
  {
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...RUNTIME_INTERNALS,
            { group: ["@/server/runtime", "@/server/runtime/*"], message: "UI components never talk to the runtime. Ask the AgenticBots server for a view." },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
