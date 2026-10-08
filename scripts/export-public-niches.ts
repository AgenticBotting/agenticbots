/** Explicit local-only export; never connects to the configured cloud store. */
import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { MemoryRepository } from "../src/server/db/memory";
import { graphOf } from "../src/server/prospecting/store";
import { asUser } from "../src/server/prospecting/access";
import { publicNicheCatalog } from "../src/server/prospecting/public-catalog";

// MemoryRepository normally flushes on process exit. An export must never do so.
class ReadOnlySnapshot extends MemoryRepository {
  override flush(): void {}
  override reset(): never { throw new Error("Read-only export."); }
  override async commit(): Promise<never> { throw new Error("Read-only export."); }
}

async function main() {
  const file = process.argv.find(arg => arg.startsWith("--demo-state="))?.slice(13);
  const email = process.argv.find(arg => arg.startsWith("--operator-email="))?.slice(17);
  if (!file || !email || !existsSync(file)) throw new Error("Supply an existing --demo-state= path and --operator-email=. Cloud export is not supported.");
  const repository = new ReadOnlySnapshot(resolve(file));
  const user = (await repository.list("users", { where: { email } }))[0];
  if (!user || !user.platformRole || user.status !== "active") throw new Error("Active operator missing from local snapshot.");
  const catalog = await publicNicheCatalog(graphOf(repository), asUser({ user, platformRole: user.platformRole, memberships: [] }));
  if (!catalog.niches.length || !catalog.buyers.length) throw new Error("Empty catalog; export refused.");
  writeFileSync(resolve("src/data/public-niche-catalog.json"), JSON.stringify(catalog) + "\n");
  writeFileSync(resolve("src/data/public-niche-routes.json"), JSON.stringify(catalog.niches.map(niche => `/industries/niches/${niche.slug}`)) + "\n");
  const mapped = new Set(catalog.niches.flatMap(niche => niche.buyers.map(buyer => buyer.buyer)));
  console.log(`Public planning catalog: ${catalog.niches.length} niches, ${catalog.buyers.length} buyer types, ${catalog.buyers.length - mapped.size} buyer types without a niche relationship.`);
  console.log(`Niches without mappings: ${catalog.niches.filter(niche => !niche.buyers.length).length}. No source records changed.`);
}
main().catch(() => { console.error("Public catalog export failed. Check the local snapshot, active operator and distinct catalog names. Source records were not changed."); process.exitCode = 1; });
