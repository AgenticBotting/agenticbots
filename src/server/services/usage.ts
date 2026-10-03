import "server-only";
import type { ProviderConfiguration, Usage } from "@/lib/platform/types";
import type { Repository } from "@/server/db/repository";
import { Tx } from "@/server/db/repository";
import { monthKey } from "./common";

export const ZERO_USAGE: Usage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 };

export function addUsage(a: Usage, b: Usage): Usage {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    cacheReadTokens: a.cacheReadTokens + b.cacheReadTokens,
    cacheWriteTokens: a.cacheWriteTokens + b.cacheWriteTokens,
  };
}

/**
 * Model cost estimate from operator-entered rates (USD per million
 * tokens). Cached input is priced at the cache rate when one is set, so a
 * heavily cached Bot is not over-reported. Unknown model = 0 + flagged.
 */
export function estimateCost(
  usage: Usage,
  provider: string | undefined,
  model: string | undefined,
  providers: ProviderConfiguration[],
): { usd: number; priced: boolean } {
  const p = providers.find((x) => x.provider === provider);
  const m = p?.models.find((x) => x.id === model);
  if (!m) return { usd: 0, priced: false };
  const uncachedInput = Math.max(0, usage.inputTokens - usage.cacheReadTokens);
  const usd =
    (uncachedInput * m.inputPerM +
      usage.outputTokens * m.outputPerM +
      usage.cacheReadTokens * (m.cacheReadPerM ?? m.inputPerM) +
      usage.cacheWriteTokens * (m.cacheWritePerM ?? m.inputPerM)) /
    1_000_000;
  return { usd: Math.round(usd * 10000) / 10000, priced: true };
}

/** Fold one finished run into the Bot's monthly rollup. */
export async function recordRunUsage(
  r: Repository,
  tx: Tx,
  input: { orgId: string; botId: string; usage: Usage; costUsd: number; failed: boolean; at?: Date },
): Promise<void> {
  const period = monthKey(input.at);
  const existing = (await r.list("usage_rollups", { orgId: input.orgId, where: { botId: input.botId, period } }))[0];
  if (existing) {
    tx.patch("usage_rollups", existing, {
      runs: existing.runs + 1,
      failedRuns: existing.failedRuns + (input.failed ? 1 : 0),
      usage: addUsage(existing.usage, input.usage),
      modelCostUsd: Math.round((existing.modelCostUsd + input.costUsd) * 10000) / 10000,
    });
  } else {
    tx.insert("usage_rollups", {
      orgId: input.orgId,
      botId: input.botId,
      period,
      runs: 1,
      failedRuns: input.failed ? 1 : 0,
      usage: input.usage,
      modelCostUsd: input.costUsd,
    });
  }
}
