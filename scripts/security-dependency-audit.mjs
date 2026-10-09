import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

// A narrow, expiring exception for one dev-only lint-tool advisory. Any new
// advisory, production finding, different package path, or stale waiver fails.
const waiver = {
  id: "GHSA-vfj7-8cjw-p6xm",
  expires: "2026-10-23",
  packages: new Set(["braces", "micromatch", "fast-glob", "@next/eslint-plugin-next", "eslint-config-next"]),
};
const audit = spawnSync("npm", ["audit", "--json"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
if (audit.error || !audit.stdout) throw new Error("Dependency audit could not complete; failing closed.");
let report;
try { report = JSON.parse(audit.stdout); }
catch { throw new Error("Dependency audit output was not valid JSON; failing closed."); }
if (!report.vulnerabilities) throw new Error("Dependency audit returned no vulnerability inventory.");
const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const findings = Object.entries(report.vulnerabilities);
if (!findings.length) { console.log("Dependency audit passed: no advisories."); process.exit(0); }
if (Date.now() >= Date.parse(`${waiver.expires}T00:00:00Z`)) throw new Error("The dev-only dependency exception expired; reevaluate the advisory.");
if (findings.length !== waiver.packages.size || findings.some(([name, finding]) =>
  !waiver.packages.has(name) || finding.severity !== "high" || !finding.nodes?.length ||
  finding.nodes.some(path => lock.packages?.[path]?.dev !== true))) {
  throw new Error("Dependency audit found an unwaived or production advisory.");
}
const root = report.vulnerabilities.braces.via;
if (!root.some(item => typeof item === "object" && item.url === `https://github.com/advisories/${waiver.id}`) ||
    findings.some(([name, finding]) => name !== "braces" && finding.via.some(item => typeof item === "object"))) {
  throw new Error("Dependency advisory graph changed; reevaluate the exception.");
}
console.log(`Dependency audit: ${findings.length} affected dev-only packages from ${waiver.id}; narrow exception expires ${waiver.expires}. Production findings: 0.`);
