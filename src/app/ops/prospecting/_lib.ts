import "server-only";
import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { lookups } from "@/server/services/lookups";
import { asUser, ctxOf } from "@/server/prospecting/access";
import { ensureDemoMarket } from "@/server/prospecting/demo-seed";

/** Shared loader for Prospect Graph operator pages. */
export async function pageCtx() {
  const actor = await requireOperatorPage();
  const r = await repo();
  await ensureDemoMarket(r);
  const ctx = ctxOf(r, asUser(actor));
  const L = await lookups(r, actor);
  return { actor, r, ctx, L };
}

export const pct = (n: number) => `${Math.round(n * 100)}%`;
