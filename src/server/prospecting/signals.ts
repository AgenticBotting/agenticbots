import "server-only";
import type { Provenance, Signal } from "@/lib/prospecting/types";
import type { GraphTx, ProspectGraphStore } from "./store";
import type { ObservedSignal } from "./providers/types";
import { signalExpiry } from "./freshness";
import { stableId } from "./ontology/normalize";

/**
 * SignalEngine — "why now".
 *
 * A signal exists only if a source OBSERVED it: every row carries the
 * provenance of the source that reported it. Nothing here infers or
 * fabricates a signal; if no source reports one, a prospect simply has no
 * timing evidence and its Timing score is 0 with "no observed signal".
 */
export const SIGNAL_VERSION = "signals/1.0.0";

export function ingestSignals(
  tx: GraphTx,
  existing: Signal[],
  companyId: string,
  observed: ObservedSignal[],
  base: Omit<Provenance, "observedAt" | "confidence" | "sourceUrl" | "externalId">,
): Signal[] {
  const out: Signal[] = [];
  const have = new Set(existing.map((s) => s.id));
  for (const o of observed) {
    if (!o.summary || !Number.isFinite(Date.parse(o.observedAt))) continue;
    const id = stableId(`sig_${companyId}_${o.type}_${o.externalId ?? o.summary}`);
    if (have.has(id)) continue;
    have.add(id);
    out.push(tx.insert("pg_signals", {
      id,
      companyId,
      type: o.type,
      summary: o.summary.slice(0, 300),
      observedAt: o.observedAt,
      relevance: clamp01(o.relevance),
      confidence: clamp01(o.confidence),
      nicheTags: [],
      buyerTypeIds: [],
      expiresAt: signalExpiry(o.type, o.observedAt),
      provenance: { ...base, observedAt: o.observedAt, confidence: clamp01(o.confidence), sourceUrl: o.sourceUrl, externalId: o.externalId },
    }));
  }
  return out;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));

export async function activeSignals(store: ProspectGraphStore, companyId: string, now: Date): Promise<Signal[]> {
  const all = await store.list("pg_signals", { where: { companyId } });
  return all.filter((s) => Date.parse(s.expiresAt) > now.getTime() && Date.parse(s.observedAt) <= now.getTime());
}
