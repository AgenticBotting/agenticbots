/**
 * Vercel's Next adapter relocates prerendered artifacts during its
 * onBuildComplete hook, before npm's postbuild lifecycle runs. The same
 * artifact gates run against the untouched .next output locally and in
 * GitHub CI; Vercel previews therefore rely on the CI result for the exact
 * commit instead of reporting a misleading zero-page pass or failing on a
 * path the adapter has already moved.
 */
import { spawnSync } from "node:child_process";

if (process.env.VERCEL === "1") {
  console.log("postbuild artifact gates deferred to GitHub CI for this exact commit (Vercel relocated .next outputs).");
  process.exit(0);
}

for (const script of [
  "scripts/link-integrity.mjs",
  "scripts/seo-checks.mjs",
  "scripts/topic-gate.mjs",
  "scripts/search-publication-gate.mjs",
]) {
  const result = spawnSync(process.execPath, [script], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
