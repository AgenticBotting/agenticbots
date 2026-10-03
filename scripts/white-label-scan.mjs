// Scans the built browser bundles (.next/static) for runtime branding and
// secret-shaped strings. Run after `npm run build`; part of `npm run test:white-label`.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = ".next/static";
if (!existsSync(ROOT)) {
  console.log("white-label-scan: no build output (.next/static) — run `npm run build` first. Skipping bundle scan.");
  process.exit(0);
}
const TERMS = [/hermes/i, /nousresearch/i, /nous research/i, /\b8642\b/, /HERMES_HOME/, /API_SERVER_KEY/, /PLATFORM_SERVER_SECRET/, /\.runtime\.agenticbots\.dev/, /arn:aws:/, /AKIA[0-9A-Z]{16}/];
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const hits = [];
for (const f of walk(ROOT).filter((f) => /\.(js|css|html|json)$/.test(f))) {
  const s = readFileSync(f, "utf8");
  for (const re of TERMS) {
    const m = s.match(re);
    if (m) hits.push(`${f}: ${m[0]}`);
  }
}
if (hits.length) {
  console.error("✖ white-label-scan: forbidden strings in browser bundles:\n" + hits.join("\n"));
  process.exit(1);
}
console.log(`✔ white-label-scan: ${walk(ROOT).length} bundle files clean`);
