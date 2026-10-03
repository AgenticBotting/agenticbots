import "server-only";
import type { ResultMetric } from "@/lib/platform/types";
import type { Repository } from "@/server/db/repository";
import { RESULT_METRICS, RESULT_METRIC_KEYS } from "@/lib/platform/metrics";

/** One countable result over the period, day by day (oldest first). */
export interface MetricSeries {
  key: ResultMetric;
  label: string;
  total: number;
  /** Same-length period immediately before this one. */
  previous: number;
  points: number[];
  previousPoints: number[];
}

/** The number a Bot is judged by, for its card. */
const BOT_PRIMARY_METRIC: Partial<Record<string, ResultMetric>> = {
  ads: "ad_issues_detected",
  seo: "seo_opportunities_found",
  reviews: "reviews_requested",
  prospecting: "qualified_opportunities",
  outbound: "followups_prepared",
  crm: "crm_records_updated",
  reactivation: "customers_identified",
  content: "content_completed",
  proposal: "proposals_drafted",
};

export interface BotReportCard {
  botId: string;
  /** e.g. "SEO opportunities found"; null when the Bot reports no countable result. */
  metricLabel: string | null;
  value: number;
  /** Primary metric (or activity count) per day, oldest first. */
  points: number[];
  activities: number;
}

export interface ClientReport {
  periodLabel: string;
  days: number;
  from: string;
  to: string;
  /** ISO dates (YYYY-MM-DD) for each point in the series, oldest first. */
  dates: string[];
  results: { key: ResultMetric; label: string; value: number }[];
  series: MetricSeries[];
  bots: BotReportCard[];
  activityPoints: number[];
  runs: { completed: number; failed: number };
  approvalMedianHours: number | null;
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
  const DAY = 86_400_000;
  const to = new Date();
  const from = new Date(to.getTime() - days * DAY);
  const prevFrom = new Date(from.getTime() - days * DAY);
  const inRange = (iso: string) => iso >= from.toISOString() && iso <= to.toISOString();
  const inPrev = (iso: string) => iso >= prevFrom.toISOString() && iso < from.toISOString();
  /** Day bucket 0..days-1 (oldest first) for a timestamp inside a window ending at `end`. */
  const bucket = (iso: string, end: Date) => days - 1 - Math.floor((end.getTime() - Date.parse(iso)) / DAY);
  const dates = Array.from({ length: days }, (_, i) => new Date(to.getTime() - (days - 1 - i) * DAY).toISOString().slice(0, 10));
  const [activity, runs, requests, approvals, bots, jobs] = await Promise.all([
    r.list("activity_events", { orgId }),
    r.list("runs", { orgId }),
    r.list("requests", { orgId }),
    r.list("approvals", { orgId }),
    r.list("bots", { orgId }),
    r.list("automation_jobs", { orgId }),
  ]);
  const act = activity.filter((a) => a.visibility === "client" && inRange(a.at));
  const prevAct = activity.filter((a) => a.visibility === "client" && inPrev(a.at));
  const sums = new Map<ResultMetric, number>();
  for (const a of act) for (const m of a.metrics ?? []) sums.set(m.key, (sums.get(m.key) ?? 0) + m.value);
  const results = RESULT_METRIC_KEYS.filter((k) => (sums.get(k) ?? 0) > 0)
    .sort((a, b) => RESULT_METRICS[a].order - RESULT_METRICS[b].order)
    .map((k) => ({ key: k, label: RESULT_METRICS[k].label, value: sums.get(k) ?? 0 }));

  const daily = (rows: typeof act, end: Date, pick: (a: (typeof act)[number]) => number) => {
    const out = new Array<number>(days).fill(0);
    for (const a of rows) {
      const i = bucket(a.at, end);
      if (i >= 0 && i < days) out[i] += pick(a);
    }
    return out;
  };
  const metricOf = (k: ResultMetric) => (a: (typeof act)[number]) => (a.metrics ?? []).filter((m) => m.key === k).reduce((n, m) => n + m.value, 0);
  const series: MetricSeries[] = RESULT_METRIC_KEYS.map((k) => {
    const points = daily(act, to, metricOf(k));
    const previousPoints = daily(prevAct, from, metricOf(k));
    return {
      key: k,
      label: RESULT_METRICS[k].label,
      total: points.reduce((a, b) => a + b, 0),
      previous: previousPoints.reduce((a, b) => a + b, 0),
      points,
      previousPoints,
    };
  })
    .filter((x) => x.total > 0 || x.previous > 0)
    .sort((a, b) => RESULT_METRICS[a.key].order - RESULT_METRICS[b.key].order);
  const activityPoints = daily(act, to, () => 1);

  const botCards: BotReportCard[] = bots.map((b) => {
    const mine = act.filter((a) => a.botId === b.id);
    const key = BOT_PRIMARY_METRIC[b.typeKey];
    const points = key ? daily(mine, to, metricOf(key)) : daily(mine, to, () => 1);
    return {
      botId: b.id,
      metricLabel: key ? RESULT_METRICS[key].label : null,
      value: key ? points.reduce((x, y) => x + y, 0) : mine.length,
      points,
      activities: mine.length,
    };
  });

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
  const waits = ap
    .filter((a) => a.resolvedAt && (a.status === "approved" || a.status === "denied"))
    .map((a) => (Date.parse(a.resolvedAt!) - Date.parse(a.requestedAt)) / 3_600_000)
    .sort((a, b) => a - b);
  const approvalMedianHours = waits.length ? Math.round(waits[Math.floor((waits.length - 1) / 2)] * 10) / 10 : null;

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
    days,
    from: from.toISOString(),
    to: to.toISOString(),
    dates,
    results,
    series,
    bots: botCards,
    activityPoints,
    runs: { completed: rr.filter((x) => x.status === "completed").length, failed: rr.filter((x) => x.status === "failed").length },
    approvalMedianHours,
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
