#!/usr/bin/env node
/**
 * Run a command with variables loaded from an env file, e.g.
 *   node scripts/with-env.mjs .env.staging -- next dev -p 3004
 * Values from the file override the shell AND Next.js's own .env.local,
 * because Next never overrides variables that are already set.
 */
import { readFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";

const [file, sep, ...cmd] = process.argv.slice(2);
if (!file || sep !== "--" || cmd.length === 0) {
  console.error("usage: node scripts/with-env.mjs <env-file> -- <command> [args…]");
  process.exit(2);
}
if (!existsSync(file)) {
  console.error(`✖ ${file} not found. Copy ${file}.example to ${file} and fill it in.`);
  process.exit(2);
}
const vars = {};
for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
  const line = raw.trim();
  if (!line || line.startsWith("#")) continue;
  const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (!m) continue;
  let v = m[2];
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  else v = v.replace(/\s+#.*$/, "");
  vars[m[1]] = v;
}
// A per-command ALLOW_CLOUD_CHANGES from the shell wins over the file.
const env = { ...process.env, ...vars };
if (process.env.ALLOW_CLOUD_CHANGES) env.ALLOW_CLOUD_CHANGES = process.env.ALLOW_CLOUD_CHANGES;
if (process.env.PROVIDER_API_KEY) env.PROVIDER_API_KEY = process.env.PROVIDER_API_KEY;
const child = spawn(cmd[0], cmd.slice(1), { stdio: "inherit", env, shell: process.platform === "win32" });
child.on("exit", (code, signal) => process.exit(signal ? 1 : (code ?? 1)));
