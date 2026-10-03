import "server-only";
import type { ResultMetric } from "@/lib/platform/types";
import type { Repository } from "@/server/db/repository";
import { RESULT_METRICS, RESULT_METRIC_KEYS } from "@/lib/platform/metrics";

export interface ClientReport {
  periodLabel: string;
  from: string;
  to: string;
  results: { key: ResultMetric; label: string; value: number }[];
  workByBot: { botId: string; botName: string; activities: number; completedRuns: number }[];
  requests: { submitted: number; completed: number; open: number };
  approvals: { requested: number; approved: number; denied: number; expired: number };
  automations: { runs: number; successRatePct: number | null };
  weekly: { weekStart: string; activities: number }[];
}

/**
 * Client report — built entirely from stored records. Every number is a
 * count of things that happened; there is no revenue or ROI field because
 * no connected system supplies verified revenue yet. When a CRM or
 * accounting integration provides it, attribution belongs here as its own
 * clearly sourced section.
 */
export async function clientReport(r: Repository, orgId: string, days = 30): Promise<ClientReport> {
  const to = new Date();
  const from = new Date(to.getTime() - days * 86_400_000);
  const inRange = (iso: string) => iso >= from.toISOString() && iso <= to.toISOString();
  const [activity, runs, requests, approvals, bots, jobs] = await Promise.all([
    r.list("activity_events", { orgId }),
    r.list("runs", { orgId }),
    r.list("requests", { orgId }),
    r.list("approvals", { orgId }),
    r.list("bots", { orgId }),
    r.list("automation_jobs", { orgId }),
  ]);
  const act = activity.filter((a) => a.visibility === "client" && inRange(a.at));
  const sums = new Map<ResultMetric, number>();
  for (const a of act) for (const m of a.metrics ?? []) sums.set(m.key, (sums.get(m.key) ?? 0) + m.value);
  const results = RESULT_METRIC_KEYS.filter((k) => (sums.get(k) ?? 0) > 0)
    .sort((a, b) => RESULT_METRICS[a].order - RESULT_METRICS[b].order)
    .map((k) => ({ key: k, label: RESULT_METRICS[k].label, value: sums.get(k) ?? 0 }));

  const rr = runs.filter((x) => inRange(x.createdAt));
  const workByBot = bots
    .map((b) => ({
      botId: b.id,
      botName: b.name,
      activities: act.filter((a) => a.botId === b.id).length,
      completedRuns: rr.filter((x) => x.botId === b.id && x.status === "completed").length,
    }))
    .filter((x) => x.activities + x.completedRuns > 0)
    .sort((a, b) => b.activities - a.activities);

  const autoRuns = rr.filter((x) => x.automationId);
  const autoOk = autoRuns.filter((x) => x.status === "completed").length;
  const jobRunsFromState = jobs.filter((j) => j.lastRunAt && inRange(j.lastRunAt));
  const ap = approvals.filter((a) => a.audience === "client" && inRange(a.requestedAt));

  const weekly: { weekStart: string; activities: number }[] = [];
  for (let w = Math.ceil(days / 7) - 1; w >= 0; w--) {
    const start = new Date(to.getTime() - (w + 1) * 7 * 86_400_000);
    const end = new Date(to.getTime() - w * 7 * 86_400_000);
    weekly.push({
      weekStart: start.toISOString().slice(0, 10),
      activities: act.filter((a) => a.at >= start.toISOString() && a.at < end.toISOString()).length,
    });
  }

  return {
    periodLabel: `Last ${days} days`,
    from: from.toISOString(),
    to: to.toISOString(),
    results,
    workByBot,
    requests: {
      submitted: requests.filter((x) => inRange(x.submittedAt)).length,
      completed: requests.filter((x) => x.completedAt && inRange(x.completedAt)).length,
      open: requests.filter((x) => !["completed", "declined"].includes(x.status)).length,
    },
    approvals: {
      requested: ap.length,
      approved: ap.filter((a) => a.status === "approved").length,
      denied: ap.filter((a) => a.status === "denied").length,
      expired: ap.filter((a) => a.status === "expired").length,
    },
    automations: {
      runs: autoRuns.length + jobRunsFromState.length,
      successRatePct: autoRuns.length > 0 ? Math.round((autoOk / autoRuns.length) * 100) : jobRunsFromState.length > 0 ? Math.round((jobRunsFromState.filter((j) => j.lastStatus === "succeeded").length / jobRunsFromState.length) * 100) : null,
    },
    weekly,
  };
}

/** Results for the client Overview: totals over a window, from real counts. */
export async function clientResults(r: Repository, orgId: string, days = 30) {
  return (await clientReport(r, orgId, days)).results;
}
