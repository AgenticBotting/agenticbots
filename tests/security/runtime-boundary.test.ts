import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Enforces the runtime translator boundary:
 *
 *   UI → AgenticBots server → BotRuntime → RuntimeAdapter → engine
 *
 * Engine names, engine endpoints and adapter internals may appear only in
 * the runtime layer. Anything else must go through @/server/runtime.
 */
const ROOT = join(__dirname, "..", "..");
const SRC = join(ROOT, "src");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return files(p);
    return /\.(ts|tsx|js|mjs|css)$/.test(name) ? [p] : [];
  });
}

const ALL = files(SRC).map((p) => ({ path: relative(ROOT, p).replaceAll("\\", "/"), text: readFileSync(p, "utf8") }));

/** Files outside the runtime layer that may name the engine, and why. */
const ENGINE_NAME_ALLOWED = new Set([
  "src/server/redact.ts", // the deny-list that scrubs the engine's name from client text
  "src/lib/platform/types.ts", // RuntimeProvider union value
]);

const inRuntimeLayer = (p: string) => p.startsWith("src/server/runtime/");
const inEngineFolder = (p: string) => p.startsWith("src/server/runtime/hermes/");

describe("runtime boundary", () => {
  it("the engine is named only inside the runtime layer", () => {
    const offenders = ALL.filter((f) => !inRuntimeLayer(f.path) && !ENGINE_NAME_ALLOWED.has(f.path) && /hermes/i.test(f.text)).map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it("engine endpoints, ports and headers appear only in the engine folder", () => {
    const ENGINE_WIRE = /\/v1\/runs|\/api\/jobs|\/api\/sessions|\/v1\/capabilities|\/v1\/toolsets|\/health\/detailed|\b8642\b|CF-Access-Client|\/p\/\$\{/;
    const offenders = ALL.filter((f) => !inEngineFolder(f.path) && f.path !== "src/server/redact.ts" && ENGINE_WIRE.test(f.text)).map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it("only the runtime layer imports adapter internals", () => {
    const INTERNAL = /from\s+["']@\/server\/runtime\/(hermes|RuntimeAdapter|runtime-factory)/;
    const offenders = ALL.filter((f) => !inRuntimeLayer(f.path) && INTERNAL.test(f.text)).map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it("only the demo control plane touches the demo runtime directly", () => {
    const allowed = new Set(["src/server/demo/seed.ts", "src/server/aws/control.ts"]);
    const offenders = ALL.filter((f) => !inRuntimeLayer(f.path) && !allowed.has(f.path) && /from\s+["']@\/server\/runtime\/demo/.test(f.text)).map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it("client components never import the runtime", () => {
    const client = ALL.filter((f) => /^\s*["']use client["']/.test(f.text));
    const offenders = client.filter((f) => /from\s+["']@\/server\//.test(f.text)).map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it("the shared adapter contract stays engine-neutral", () => {
    const suite = readFileSync(join(ROOT, "tests/contract/runtime-adapter.contract.ts"), "utf8");
    expect(suite).not.toMatch(/hermes/i);
  });
});
