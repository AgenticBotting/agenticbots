import type { ResultMetric } from "./types";

/** Client-facing labels for countable results. Results are always sums of
 *  numbers a Bot actually reported — never estimates or projections. */
export const RESULT_METRICS: Record<ResultMetric, { label: string; order: number }> = {
  qualified_opportunities: { label: "Qualified opportunities", order: 1 },
  prospects_researched: { label: "Prospects researched", order: 2 },
  followups_prepared: { label: "Follow-ups prepared", order: 3 },
  reviews_requested: { label: "Review requests prepared", order: 4 },
  crm_records_updated: { label: "CRM records updated", order: 5 },
  seo_opportunities_found: { label: "SEO opportunities found", order: 6 },
  ad_issues_detected: { label: "Ad issues detected", order: 7 },
  content_completed: { label: "Content pieces completed", order: 8 },
  customers_identified: { label: "Past customers identified", order: 9 },
  proposals_drafted: { label: "Proposals drafted", order: 10 },
  automations_completed: { label: "Automations completed", order: 11 },
};

export const RESULT_METRIC_KEYS = Object.keys(RESULT_METRICS) as ResultMetric[];

export function isResultMetric(k: string): k is ResultMetric {
  return k in RESULT_METRICS;
}
