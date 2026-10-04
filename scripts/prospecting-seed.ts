/**
 * Load the Prospect Graph ontology (service niches, buyer types, and the
 * niche ↔ buyer relationships) into the platform store.
 *
 *   npm run prospecting:seed            (uses the configured store; Convex in staging/production)
 *   npm run prospecting:seed:staging    (loads .env.staging first)
 *
 * Safe to run any number of times: rows have stable ids, unchanged rows are
 * skipped, and relationships an operator approved, rejected or edited are
 * never touched. Every run is recorded as an ImportRun.
 *
 * It makes no third-party API calls and costs nothing.
 */
import { repo } from "@/server/db";
import { graphOf } from "@/server/prospecting/store";
import { seedOntology } from "@/server/prospecting/ontology/service";

async function main() {
  const r = await repo();
  const res = await seedOntology(graphOf(r), { id: "cli", name: "prospecting:seed" });
  const line = (label: string, s: { run: { rowsRead: number; inserted: number; updated: number; unchanged: number; duplicates: unknown[]; malformed: { row: number; reason: string }[] }; ok: boolean; error?: string }) => {
    console.log(`${label}: ${s.ok ? "ok" : `FAILED — ${s.error}`}  read ${s.run.rowsRead}, inserted ${s.run.inserted}, updated ${s.run.updated}, unchanged ${s.run.unchanged}, duplicates ${s.run.duplicates.length}, malformed ${s.run.malformed.length}`);
    for (const m of s.run.malformed.slice(0, 20)) console.log(`   row ${m.row}: ${m.reason}`);
  };
  line("Service niches", res.niches);
  line("Buyer types   ", res.buyers);
  const x = res.relationships;
  console.log(`Relationships : proposed ${x.proposed} (auto-approved ${x.autoApproved}, needs review ${x.needsReview}); inserted ${x.inserted}, updated ${x.updated}, unchanged ${x.unchanged}, operator-reviewed kept ${x.preservedReviewed}, stale removed ${x.removedStale}`);
  if (!res.niches.ok || !res.buyers.ok) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
