import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// High-confidence, local-only supplement to CI's broader scanner. Never prints
// matching contents. Scan tracked sources plus new non-ignored files.
const files = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" }).split("\0").filter(Boolean);
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{36,}\b/,
  /\bsk-(?:live-|proj-)?[A-Za-z0-9_-]{40,}\b/,
];
const issues = [];
for (const path of new Set(files)) {
  if (/(^|\/)\.env(?:\.|$)/.test(path) && !path.endsWith(".example")) { issues.push(`${path}: environment file must not be tracked`); continue; }
  if (!/\.(?:[cm]?[jt]sx?|json|ya?ml|tf|sh|md|toml|example)$/.test(path) || path.startsWith("tests/")) continue;
  let source;
  try { source = readFileSync(path, "utf8"); } catch { continue; }
  source.split("\n").forEach((line, i) => { if (patterns.some(p => p.test(line))) issues.push(`${path}:${i + 1}: potential credential — inspect privately`); });
  if (/^\s*["']use client["']/.test(source) && /process\.env\.(?!NEXT_PUBLIC_|NODE_ENV)[A-Z][A-Z0-9_]*/.test(source)) issues.push(`${path}: private environment access in a client component`);
}
if (issues.length) { console.error(issues.join("\n")); process.exit(1); }
console.log(`Source secret scan passed (${new Set(files).size} files; no secret values printed).`);
