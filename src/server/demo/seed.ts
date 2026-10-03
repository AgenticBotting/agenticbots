import "server-only";
import type { AutomationStatus, Bot, BotStatus, Organization, PaymentMethod, ResultMetric, Runtime } from "@/lib/platform/types";
import type { BotTypeKey } from "@/config/bot-catalog";
import { botTypeOrThrow } from "@/config/bot-catalog";
import { getSkill } from "@/config/skills";
import type { Repository } from "@/server/db/repository";
import { Tx } from "@/server/db/repository";
import { hashPassword } from "@/server/auth/password";
import { correlationId } from "@/server/ids";
import { demoState } from "@/server/runtime/demo/DemoRuntimeAdapter";
import { estimateCost } from "@/server/services/usage";
import { describeSchedule } from "@/server/services/automations";
import { addDays, todayStr } from "@/server/billing/domain";

/**
 * Demo seed — fictional companies, fictional people, fictional numbers.
 * Only ever written into the in-process demo store (DEMO_MODE=true), never
 * into a production database. Every activity row is flagged `demo: true`.
 *
 * Demo sign-in (shown on the login page in demo mode only):
 *   admin@agenticbots.demo      superadmin
 *   operator@agenticbots.demo   operator
 *   owner@acmeroofing.demo      client admin (Acme Roofing)
 *   staff@acmeroofing.demo      client member (Acme Roofing)
 *   password for all:           agenticbots-demo
 */
export const DEMO_PASSWORD = "agenticbots-demo";
export const DEMO_ACCOUNTS = [
  { email: "admin@agenticbots.demo", label: "AgenticBots superadmin" },
  { email: "operator@agenticbots.demo", label: "AgenticBots operator" },
  { email: "owner@acmeroofing.demo", label: "Client admin — Acme Roofing" },
  { email: "staff@acmeroofing.demo", label: "Client member — Acme Roofing" },
] as const;

const DAY = 86_400_000;
const ago = (days: number, hours = 0) => new Date(Date.now() - days * DAY - hours * 3600_000).toISOString();

export async function seedDemo(r: Repository): Promise<void> {
  const tx = new Tx(r);
  const pw = await hashPassword(DEMO_PASSWORD);

  /* ── People ── */
  const admin = tx.insert("users", { email: "admin@agenticbots.demo", name: "Demo Admin", status: "active", platformRole: "superadmin", passwordHash: pw, createdAt: ago(120) });
  const operator = tx.insert("users", { email: "operator@agenticbots.demo", name: "Jordan Ellis", status: "active", platformRole: "operator", passwordHash: pw, createdAt: ago(90) });
  const owner = tx.insert("users", { email: "owner@acmeroofing.demo", name: "Dana Whitfield", status: "active", passwordHash: pw, createdAt: ago(60) });
  const staff = tx.insert("users", { email: "staff@acmeroofing.demo", name: "Marcus Lee", status: "active", passwordHash: pw, createdAt: ago(55) });

  /* ── Providers (operator-entered estimates; confirm real rates in Settings) ── */
  const providers = [
    tx.insert("provider_configurations", {
      provider: "anthropic", displayName: "Anthropic", status: "operational",
      models: [
        { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5", inputPerM: 3, outputPerM: 15, cacheReadPerM: 0.3, cacheWritePerM: 3.75 },
        { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", inputPerM: 1, outputPerM: 5, cacheReadPerM: 0.1, cacheWritePerM: 1.25 },
      ],
      note: "Demo rates — confirm against the provider's current price list.",
    }),
    tx.insert("provider_configurations", {
      provider: "openrouter", displayName: "OpenRouter", status: "operational",
      models: [{ id: "open-weights-large", label: "Open-weights (large)", inputPerM: 0.6, outputPerM: 2.4 }],
      note: "Fallback route. Demo rates.",
    }),
  ];

  /* ── Organizations ── */
  type OrgSpec = { name: string; slug: string; status: Organization["status"]; industry: string; contact: string; email: string; createdDaysAgo: number; suspension?: Organization["suspension"]; eligible?: boolean };
  const mkOrg = (o: OrgSpec) =>
    tx.insert("organizations", {
      name: o.name, slug: o.slug, status: o.status, tenantId: `${o.slug}-demo`, environment: "demo",
      industry: o.industry, website: `https://${o.slug}.example`, primaryContactName: o.contact, primaryContactEmail: o.email,
      timezone: "America/New_York", holds: { manual: false, security: false, billing: false },
      suspension: o.suspension, eligibleForReactivation: o.eligible, lastActivityAt: ago(0, 1), createdAt: ago(o.createdDaysAgo),
    });
  const acme = mkOrg({ name: "Acme Roofing", slug: "acme-roofing", status: "active", industry: "Commercial & residential roofing", contact: "Dana Whitfield", email: "owner@acmeroofing.demo", createdDaysAgo: 62 });
  const bayside = mkOrg({ name: "Bayside Plumbing Co.", slug: "bayside-plumbing", status: "past_due", industry: "Plumbing", contact: "Rob Alvarez", email: "rob@bayside.example", createdDaysAgo: 95 });
  const coastal = mkOrg({
    name: "Coastal Air & Heat", slug: "coastal-air", status: "suspended", industry: "HVAC", contact: "Priya Shah", email: "priya@coastal.example", createdDaysAgo: 140,
    suspension: { reason: "billing", at: ago(6), by: operator.id, note: "Two invoices unpaid after a call on the 12th." }, eligible: true,
  });

  tx.insert("memberships", { orgId: acme.id, userId: owner.id, role: "client_admin" });
  tx.insert("memberships", { orgId: acme.id, userId: staff.id, role: "client_member" });

  /* ── Runtimes ── */
  const mkRuntime = (org: Organization, suspended = false): Runtime =>
    tx.insert("runtimes", {
      orgId: org.id, provider: "demo", region: "us-east-1", instanceId: `i-0demo${org.slug.replace(/[^a-z]/g, "").slice(0, 8)}`, instanceType: "t3.medium",
      ec2State: "running", health: suspended ? "stopped" : "healthy", ready: !suspended, runtimeVersion: "1.0.0", engineVersion: "v2026.9.24",
      engineDigest: "sha256:pinned-at-deploy", endpointRef: `agenticbots/demo/tenants/${org.tenantId}/runtime`, diskUsedPct: suspended ? 41 : 29,
      lastHeartbeatAt: ago(0, 0.05), tunnel: suspended ? "down" : "connected", backup: { lastSnapshotAt: ago(0, 6), status: "ok", retentionDays: 30 },
      lastRestartAt: ago(9), restartCount24h: 0, deploymentState: suspended ? "suspended" : "deployed",
      capabilities: suspended ? undefined : { runs: true, runEvents: true, runStop: true, runApproval: true, conversations: true, automations: true },
      estimatedMonthlyCostUsd: 45, createdAt: ago(60),
    });
  const acmeRt = mkRuntime(acme);
  const baysideRt = mkRuntime(bayside);
  const coastalRt = mkRuntime(coastal, true);

  /* ── Bots ── */
  const mkBot = (org: Organization, rt: Runtime, key: BotTypeKey, status: BotStatus, lastResult?: string, lastActivityDays = 0.05): Bot => {
    const t = botTypeOrThrow(key);
    const bot = tx.insert("bots", {
      orgId: org.id, typeKey: key, name: t.displayName, status, runtimeId: rt.id, runtimeProfile: t.runtimeProfile,
      provider: "anthropic", model: key === "crm" || key === "reviews" ? "claude-haiku-4-5" : "claude-sonnet-5-5",
      fallbackProvider: "openrouter", fallbackModel: "open-weights-large", reasoning: key === "analytics" ? "high" : "medium",
      capabilities: t.defaultCapabilities, integrationIds: [], credentialRef: `agenticbots/demo/tenants/${org.tenantId}/profiles/${t.runtimeProfile}`,
      credentialStatus: "present", lastActivityAt: ago(lastActivityDays), lastResult,
      instructions: key === "prospecting" ? "Focus on commercial property managers, HOAs and facilities directors in Palm Beach and Broward." : undefined,
      createdAt: ago(58),
    });
    for (const s of t.defaultSkills) {
      const def = getSkill(s);
      if (def) tx.insert("skill_assignments", { orgId: org.id, botId: bot.id, skillKey: s, skillVersion: def.version, assignedBy: operator.id });
    }
    return bot;
  };
  const b = {
    ads: mkBot(acme, acmeRt, "ads", "idle", "Identified 6 irrelevant search terms."),
    seo: mkBot(acme, acmeRt, "seo", "active", "Found 14 local-search content opportunities."),
    reviews: mkBot(acme, acmeRt, "reviews", "active", "Prepared 17 review requests."),
    prospecting: mkBot(acme, acmeRt, "prospecting", "active", "Qualified 31 commercial-property prospects."),
    outbound: mkBot(acme, acmeRt, "outbound", "active", "Prepared 12 follow-ups."),
    crm: mkBot(acme, acmeRt, "crm", "active", "Updated 12 opportunity records."),
    analytics: mkBot(acme, acmeRt, "analytics", "active", "Weekly summary delivered."),
    reactivation: mkBot(acme, acmeRt, "reactivation", "active", "Identified 24 previous customers for follow-up.", 2),
    content: mkBot(acme, acmeRt, "content", "disabled", undefined, 21),
  };
  const bb = { seo: mkBot(bayside, baysideRt, "seo", "active", "Crawled 212 pages."), reviews: mkBot(bayside, baysideRt, "reviews", "active") };
  const cb = { ads: mkBot(coastal, coastalRt, "ads", "active"), crm: mkBot(coastal, coastalRt, "crm", "active") };

  /* ── Integrations ── */
  const mkInt = (org: Organization, provider: Parameters<typeof tx.insert<"integrations">>[1]["provider"], displayName: string, status: "connected" | "needs_attention" | "disconnected" | "not_configured", bots: Bot[], extra: Record<string, string> = {}, lastError?: string) =>
    tx.insert("integrations", {
      orgId: org.id, provider, displayName, status, capabilities: [], botIds: bots.map((x) => x.id),
      secretRef: status === "not_configured" ? undefined : `agenticbots/demo/tenants/${org.tenantId}/integrations/${provider}`,
      lastCheckAt: ago(0, 2), verifiedBy: status === "connected" ? "operator" : undefined, lastError,
      metadata: { demo: "true", ...extra },
    });
  const iAds = mkInt(acme, "google_ads", "Google Ads", "connected", [b.ads, b.analytics], { toolset: "google_ads" });
  const iGbp = mkInt(acme, "google_business_profile", "Google Business Profile", "connected", [b.reviews, b.seo]);
  const iHub = mkInt(acme, "hubspot", "HubSpot", "connected", [b.crm, b.outbound, b.prospecting, b.reactivation], { toolset: "hubspot" });
  const iGmail = mkInt(acme, "gmail", "Gmail", "connected", [b.outbound, b.reviews, b.reactivation]);
  const iSt = mkInt(acme, "servicetitan", "ServiceTitan", "needs_attention", [b.reviews, b.reactivation], {}, "OAuth refresh failed: invalid_grant (token revoked by ServiceTitan admin).");
  mkInt(acme, "meta", "Meta", "disconnected", []);
  mkInt(acme, "google_analytics", "Google Analytics", "connected", [b.analytics, b.seo]);
  mkInt(bayside, "google_business_profile", "Google Business Profile", "connected", [bb.reviews, bb.seo]);
  mkInt(coastal, "hubspot", "HubSpot", "connected", [cb.crm]);
  for (const [bot, ids] of [
    [b.ads, [iAds.id]], [b.analytics, [iAds.id]], [b.reviews, [iGbp.id, iGmail.id, iSt.id]], [b.seo, [iGbp.id]],
    [b.crm, [iHub.id]], [b.outbound, [iHub.id, iGmail.id]], [b.prospecting, [iHub.id]], [b.reactivation, [iHub.id, iGmail.id, iSt.id]],
  ] as [Bot, string[]][]) {
    bot.integrationIds = ids;
  }

  /* ── Activity (client feed) ── */
  type A = [number, number, Bot | undefined, string, [ResultMetric, number][]?];
  const acts: A[] = [
    [0, 1, b.ads, "Ads Bot identified 6 irrelevant search terms wasting budget.", [["ad_issues_detected", 6]]],
    [0, 3, b.prospecting, "Prospecting Bot qualified 31 commercial-property prospects.", [["prospects_researched", 31], ["qualified_opportunities", 9]]],
    [0, 5, b.crm, "CRM Bot updated 12 opportunity records.", [["crm_records_updated", 12]]],
    [1, 2, b.reviews, "Reviews Bot prepared 17 review requests.", [["reviews_requested", 17]]],
    [1, 6, b.outbound, "Outbound Bot prepared 12 follow-ups.", [["followups_prepared", 12]]],
    [2, 1, b.seo, "SEO Bot found 14 local-search content opportunities.", [["seo_opportunities_found", 14]]],
    [2, 8, b.reactivation, "Reactivation Bot identified 24 previous customers for follow-up.", [["customers_identified", 24]]],
    [3, 4, b.analytics, "Analytics Bot delivered the weekly channel summary."],
    [4, 2, b.prospecting, "Prospecting Bot researched 38 companies.", [["prospects_researched", 38], ["qualified_opportunities", 11]]],
    [5, 3, b.crm, "CRM Bot merged 9 duplicate contacts and set missing next steps.", [["crm_records_updated", 9]]],
    [6, 1, b.ads, "Ads Bot flagged 2 campaigns pacing over budget.", [["ad_issues_detected", 2]]],
    [7, 5, b.seo, "SEO Bot completed local search opportunity analysis.", [["seo_opportunities_found", 8]]],
    [8, 2, b.reviews, "Reviews Bot prepared 11 review requests.", [["reviews_requested", 11]]],
    [9, 4, b.outbound, "Outbound Bot prepared 15 follow-ups for open estimates.", [["followups_prepared", 15]]],
    [11, 2, b.prospecting, "Prospecting Bot qualified 22 facilities contacts.", [["prospects_researched", 22], ["qualified_opportunities", 6]]],
    [13, 6, b.crm, "CRM Bot updated 18 opportunity records.", [["crm_records_updated", 18]]],
    [15, 3, b.analytics, "Analytics Bot delivered the weekly channel summary."],
    [18, 2, b.ads, "Ads Bot identified 4 search terms wasting budget.", [["ad_issues_detected", 4]]],
    [21, 5, b.reviews, "Reviews Bot prepared 14 review requests.", [["reviews_requested", 14]]],
    [24, 1, b.seo, "SEO Bot found 9 content opportunities.", [["seo_opportunities_found", 9]]],
    [27, 3, b.reactivation, "Reactivation Bot identified 31 past customers due for inspections.", [["customers_identified", 31]]],
  ];
  // Steady day-to-day history since onboarding (~8 weeks ago), so charts have
  // a real shape: weekday rhythm, a ramp-up while Bots were tuned, and noise.
  // Deterministic, so every demo reset looks the same.
  let seed = 0x5eed;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  const taken = new Set(acts.map(([d, , bot]) => `${bot?.id}:${d}`));
  // Spread the hand-written headline days out a little less spikily.
  for (const a of acts) if (a[4]) a[4] = a[4].map(([k, v]) => [k, Math.max(1, Math.round(v * 0.6))] as [ResultMetric, number]);
  const cadence: [Bot, number, string, (n: number) => string, [ResultMetric, number][]][] = [
    [b.prospecting, 0.9, "prospecting", (n) => `Prospecting Bot researched ${n} companies.`, [["prospects_researched", 1], ["qualified_opportunities", 0.28]]],
    [b.seo, 0.7, "seo", (n) => `SEO Bot found ${n} local-search opportunities.`, [["seo_opportunities_found", 1]]],
    [b.reviews, 0.75, "reviews", (n) => `Reviews Bot prepared ${n} review requests.`, [["reviews_requested", 1]]],
    [b.outbound, 0.8, "outbound", (n) => `Outbound Bot prepared ${n} follow-ups.`, [["followups_prepared", 1]]],
    [b.crm, 0.85, "crm", (n) => `CRM Bot updated ${n} opportunity records.`, [["crm_records_updated", 1]]],
    [b.ads, 0.6, "ads", (n) => `Ads Bot flagged ${n} search terms wasting budget.`, [["ad_issues_detected", 1]]],
    [b.reactivation, 0.4, "reactivation", (n) => `Reactivation Bot identified ${n} past customers for follow-up.`, [["customers_identified", 1]]],
  ];
  const base: Record<string, number> = { prospecting: 9, seo: 3, reviews: 4, outbound: 4, crm: 5, ads: 2, reactivation: 6 };
  for (let d = 1; d <= 56; d++) {
    const weekday = new Date(Date.now() - d * DAY).getUTCDay();
    const weekend = weekday === 0 || weekday === 6;
    const ramp = Math.min(1, 0.6 + ((56 - d) / 56) * 0.55);
    for (const [bot, p, key, text, metrics] of cadence) {
      if (taken.has(`${bot.id}:${d}`)) continue;
      if (rand() > p * (weekend ? 0.3 : 1)) continue;
      const n = Math.max(1, Math.round(base[key] * ramp * (0.75 + rand() * 0.5)));
      acts.push([d, 1 + Math.floor(rand() * 9), bot, text(n), metrics.map(([k, f]) => [k, Math.max(f === 1 ? 1 : 0, Math.round(n * f))] as [ResultMetric, number]).filter(([, v]) => v > 0)]);
    }
    if (weekday === 1) acts.push([d, 2, b.analytics, "Analytics Bot delivered the weekly channel summary."]);
  }
  for (const [d, h, bot, text, metrics] of acts) {
    tx.insert("activity_events", {
      orgId: acme.id, at: ago(d, h), botId: bot?.id, text, visibility: "client", demo: true,
      metrics: metrics?.map(([key, value]) => ({ key, value })), createdAt: ago(d, h),
    });
  }
  tx.insert("activity_events", { orgId: bayside.id, at: ago(1), botId: bb.seo.id, text: "SEO Bot crawled 212 pages and repaired 3 broken links.", visibility: "client", demo: true, createdAt: ago(1) });

  /* ── Runs (finished history) ── */
  const mkRun = (bot: Bot, task: string, daysAgo: number, status: "completed" | "failed", mins: number, inTok: number, outTok: number, summary?: string, failure?: string, requestId?: string) => {
    const usage = { inputTokens: inTok, outputTokens: outTok, cacheReadTokens: Math.round(inTok * 0.4), cacheWriteTokens: Math.round(inTok * 0.05) };
    const cost = estimateCost(usage, bot.provider, bot.model, providers).usd;
    const start = ago(daysAgo);
    const runId = crypto.randomUUID();
    const at = (min: number) => new Date(Date.parse(start) + min * 60_000).toISOString();
    const steps: [number, "lifecycle" | "action" | "error", string | undefined, string][] = [
      [0, "lifecycle", "Started", "Run started"],
      [0.3, "action", "Researching", "Search · web_search"],
      [mins * 0.4, "action", "Reviewing source", "Browse · browser_navigate"],
      [mins * 0.7, "action", "Analyzing results", "Analytics · report_build"],
      [mins, status === "failed" ? "error" : "lifecycle", status === "failed" ? "Task could not be completed." : "Task complete", status === "failed" ? `Run failed — ${failure}` : "Run completed"],
    ];
    steps.forEach(([m, kind, clientText, operatorText], i) =>
      tx.insert("run_events", { orgId: bot.orgId, runId, seq: i + 1, at: at(m), kind, clientText, operatorText, createdAt: at(m) }),
    );
    return tx.insert("runs", {
      id: runId,
      orgId: bot.orgId, botId: bot.id, task, status, idempotencyKey: `seed-${bot.typeKey}-${daysAgo}-${task.length}`, correlationId: correlationId(),
      runtimeRunId: `demo_run_seed_${bot.typeKey}_${daysAgo}`, startedBy: operator.id, startedAt: start,
      endedAt: new Date(Date.parse(start) + mins * 60_000).toISOString(), provider: bot.provider, model: bot.model,
      usage, estimatedCostUsd: cost, approvalState: "none", resultSummary: summary, failureReason: failure, eventCursor: steps.length, requestId, createdAt: start,
    });
  };

  /* ── Requests ── */
  const reqList = tx.insert("requests", {
    orgId: acme.id, title: "Build a list of commercial property managers in Palm Beach County",
    description: "We want to start bidding re-roofs for office parks and HOAs. Who manages them, and how do we reach them?",
    priority: "high", status: "in_progress", submittedBy: owner.id, submittedAt: ago(2, 3), assignedOperatorId: operator.id,
    assignedBotIds: [b.prospecting.id], linkedRunIds: [], linkedApprovalIds: [], deliverables: [],
    messages: [{ at: ago(2, 1), by: operator.id, byName: "AgenticBots", fromAgenticBots: true, text: "On it — first batch by Thursday, focused on properties over 50,000 sq ft." }],
    attachments: [], createdAt: ago(2, 3),
  });
  const reqAds = tx.insert("requests", {
    orgId: acme.id, title: "Why are Google Ads leads more expensive this month?",
    description: "Cost per lead looks up about 30% since the start of the month. What changed?",
    priority: "normal", status: "reviewing", submittedBy: owner.id, submittedAt: ago(0, 6),
    assignedBotIds: [], linkedRunIds: [], linkedApprovalIds: [], deliverables: [], messages: [], attachments: [], createdAt: ago(0, 6),
  });
  tx.insert("requests", {
    orgId: acme.id, title: "Follow up on old estimates from the spring",
    description: "We sent about 40 estimates in March–May that never closed.", priority: "normal", status: "completed",
    submittedBy: staff.id, submittedAt: ago(12), completedAt: ago(6), assignedOperatorId: operator.id, assignedBotIds: [b.reactivation.id, b.outbound.id],
    linkedRunIds: [], linkedApprovalIds: [], deliverables: [{ label: "Estimate follow-up list (38 contacts)", url: "https://docs.example/acme-estimates", addedAt: ago(7) }],
    messages: [{ at: ago(6), by: operator.id, byName: "AgenticBots", fromAgenticBots: true, text: "Done. 38 follow-ups went out after your approval; 5 replies so far are in HubSpot." }],
    attachments: [], createdAt: ago(12),
  });
  tx.insert("requests", {
    orgId: acme.id, title: "Add our new metal roofing service to the website", description: "We started offering standing-seam metal roofs.",
    priority: "low", status: "waiting_on_client", submittedBy: owner.id, submittedAt: ago(4), assignedOperatorId: operator.id,
    assignedBotIds: [b.seo.id], linkedRunIds: [], linkedApprovalIds: [], deliverables: [],
    messages: [{ at: ago(3), by: operator.id, byName: "AgenticBots", fromAgenticBots: true, text: "Which areas do you install metal roofs in, and do you have 3–4 project photos we can use?" }],
    attachments: [], createdAt: ago(4),
  });

  const r1 = mkRun(b.prospecting, "Research commercial property managers in Palm Beach County (offices, HOAs > 50k sq ft)", 1, "completed", 14, 48200, 6100, "Researched 38 companies and qualified 31 against the target profile. METRICS {\"prospects_researched\": 38}", undefined, reqList.id);
  reqList.linkedRunIds = [r1.id];
  mkRun(b.ads, "Daily search-term review", 0.1, "completed", 6, 22100, 2400, "Found 6 irrelevant search terms; drafted negatives for approval.");
  mkRun(b.crm, "Nightly CRM hygiene sweep", 1, "failed", 2, 4100, 300, undefined, "provider_failure: upstream model overloaded (HTTP 529) — fallback not attempted");
  mkRun(b.seo, "Weekly local SEO crawl", 2, "completed", 22, 61000, 7400, "Found 14 local-search content opportunities and 2 technical fixes.");
  mkRun(b.reviews, "Prepare review requests for jobs closed this week", 1, "completed", 5, 15800, 2900, "Prepared 17 review requests for approval.");
  mkRun(b.outbound, "Draft follow-ups for open estimates", 1, "completed", 9, 26400, 5200, "Prepared 12 follow-ups for approval.");
  mkRun(b.analytics, "Weekly channel summary", 3, "completed", 11, 39000, 4800, "Delivered the weekly summary. Attribution limited to connected sources.");
  mkRun(bb.seo, "Weekly crawl", 1, "completed", 18, 44000, 5000, "Crawled 212 pages, repaired 3 broken links.");

  /* ── Approvals ── */
  const mkApproval = (bot: Bot, category: "external_send" | "publish" | "ad_change" | "crm_update", title: string, explanation: string, impact: string, preview: string, hoursAgo: number, requestId?: string) =>
    tx.insert("approvals", {
      orgId: bot.orgId, botId: bot.id, kind: "deliverable", category, title, explanation, expectedImpact: impact, risk: category === "ad_change" ? "medium" : "low",
      preview, status: "pending", audience: "client", requestedAt: ago(0, hoursAgo), expiresAt: new Date(Date.now() + 5 * DAY).toISOString(), requestId, createdAt: ago(0, hoursAgo),
    });
  // Decided in the last few weeks (history for reports).
  const decided: [Bot, "external_send" | "publish" | "ad_change" | "crm_update", string, number, number, "approved" | "denied"][] = [
    [b.ads, "ad_change", "Add 4 negative keywords to the Residential campaign", 18, 3.5, "approved"],
    [b.outbound, "external_send", "Send 9 follow-ups for September estimates", 14, 1.2, "approved"],
    [b.reviews, "external_send", "Send 11 review requests", 9, 6, "approved"],
    [b.content, "publish", "Publish the 'Hurricane season roof check' post", 7, 20, "denied"],
    [b.crm, "crm_update", "Close 6 stale opportunities as lost", 4, 2.4, "approved"],
  ];
  for (const [bot, category, title, daysAgo, waitH, status] of decided) {
    const at = ago(daysAgo);
    tx.insert("approvals", {
      orgId: bot.orgId, botId: bot.id, kind: "deliverable", category, title, explanation: title, expectedImpact: title, risk: "low",
      status, audience: "client", requestedAt: at, resolvedAt: new Date(Date.parse(at) + waitH * 3_600_000).toISOString(),
      resolvedBy: owner.id, createdAt: at,
    });
  }
  mkApproval(b.outbound, "external_send", "Send 12 follow-up emails for open estimates",
    "Outbound Bot drafted short follow-ups for estimates sent 2–6 weeks ago that have no reply.",
    "12 emails will be sent from your Gmail over the next two business days. Replies are routed to you.",
    "Subject: Your roof estimate for 1420 Commerce Pkwy\n\nHi Karen — following up on the re-roof estimate we sent on the 3rd. Happy to walk the roof again or adjust the scope. Would Tuesday or Wednesday work for a quick call?\n\n— Dana, Acme Roofing", 3);
  mkApproval(b.reviews, "external_send", "Send 17 review requests to recent customers",
    "Reviews Bot matched jobs completed this week to customers and wrote a short thank-you with your review link.",
    "17 texts/emails will be sent. Unhappy responses are routed to you privately before any public review.",
    "Hi Tom, thanks for choosing Acme Roofing for your repair on Elm St. If we earned it, a quick Google review helps a lot: [review link]", 5);
  mkApproval(b.ads, "ad_change", "Add 6 negative keywords to the Commercial Roofing campaign",
    "These searches triggered your ads but are not jobs you do (e.g. \"roofing jobs hiring\", \"diy roof patch\").",
    "Stops spend on these terms immediately. No other campaign settings change.",
    "roofing jobs hiring · diy roof patch · roof shingles wholesale · roofing school · free roof inspection scam · roofing calculator", 1);

  /* ── Automations ── */
  const mkJob = (bot: Bot, name: string, schedule: string, prompt: string, status: AutomationStatus = "active", failures = 0, lastError?: string) => {
    const job = tx.insert("automation_jobs", {
      orgId: bot.orgId, botId: bot.id, name, prompt, schedule, scheduleLabel: describeSchedule(schedule), status,
      runtimeAutomationId: `demo_auto_${name.toLowerCase().replace(/[^a-z]+/g, "_").slice(0, 24)}`,
      lastRunAt: ago(0, 6), lastStatus: failures > 0 ? "failed" : "succeeded", nextRunAt: new Date(Date.now() + 18 * 3600_000).toISOString(),
      consecutiveFailures: failures, lastError, trigger: "schedule",
    });
    demoState().jobs.set(job.runtimeAutomationId!, { runtimeAutomationId: job.runtimeAutomationId!, name, schedule, status, profile: bot.runtimeProfile, prompt });
    return job;
  };
  mkJob(b.ads, "Daily search-term review", "0 7 * * 1-5", "Review yesterday's search terms; propose negatives for approval.");
  mkJob(b.seo, "Weekly local SEO crawl", "0 6 * * 1", "Crawl the site, check rankings for target terms, list content opportunities.");
  mkJob(b.reviews, "Review requests after completed jobs", "every 6h", "Find jobs completed since last run and prepare review requests for approval.");
  mkJob(b.analytics, "Monday performance summary", "0 8 * * 1", "Summarize last week by channel from connected sources only. No estimates.");
  mkJob(b.crm, "Nightly CRM hygiene sweep", "0 23 * * *", "Find stale stages, duplicates and missing next steps; update with approval rules.", "failed", 2, "Model provider overloaded (529) on last two runs.");
  mkJob(b.content, "Weekly content draft", "0 9 * * 2", "Draft one project story from recent job notes.", "paused");

  /* ── Usage rollups (this month) ── */
  const month = new Date().toISOString().slice(0, 7);
  const roll = (bot: Bot, runs: number, inTok: number, outTok: number, failed = 0) => {
    const usage = { inputTokens: inTok, outputTokens: outTok, cacheReadTokens: Math.round(inTok * 0.45), cacheWriteTokens: Math.round(inTok * 0.04) };
    tx.insert("usage_rollups", { orgId: bot.orgId, botId: bot.id, period: month, runs, failedRuns: failed, usage, modelCostUsd: estimateCost(usage, bot.provider, bot.model, providers).usd });
  };
  roll(b.ads, 24, 610_000, 64_000); roll(b.seo, 6, 380_000, 45_000); roll(b.reviews, 14, 210_000, 38_000);
  roll(b.prospecting, 9, 520_000, 71_000); roll(b.outbound, 11, 290_000, 58_000); roll(b.crm, 26, 160_000, 21_000, 2);
  roll(b.analytics, 4, 180_000, 24_000); roll(b.reactivation, 3, 95_000, 16_000);
  roll(bb.seo, 5, 240_000, 30_000); roll(bb.reviews, 8, 90_000, 15_000); roll(cb.crm, 7, 60_000, 9_000);

  /* ── Billing ── */
  const today = todayStr();
  const firstOfMonth = `${today.slice(0, 7)}-01`;
  const prevMonth = (() => { const d = new Date(`${firstOfMonth}T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 10); })();
  const agreement = (org: Organization, name: string, monthly: number, impl: number, start: string, method: "ach" | "wire", status: "active" | "past_due" | "suspended" = "active") =>
    tx.insert("service_agreements", {
      orgId: org.id, name, monthlyValueCents: monthly, implementationFeeCents: impl, setupFeeCents: 0, billingFrequency: "monthly",
      paymentTermsDays: 5, preferredPaymentMethod: method, startDate: start, renewalDate: addDays(start, 365), status,
      gracePeriodDays: 7, autoSuspendEnabled: false, autoReactivateOnPayment: false, createdBy: admin.id,
      notes: "Demo agreement.", createdAt: ago(60),
    });
  const acmeAg = agreement(acme, "Acme Roofing — Managed Bot Operations", 750_000, 1_200_000, prevMonth, "ach");
  const baysideAg = agreement(bayside, "Bayside Plumbing — Growth Bots", 500_000, 600_000, addDays(prevMonth, -31), "ach", "past_due");
  const coastalAg = agreement(coastal, "Coastal Air & Heat — Full Stack", 950_000, 1_500_000, addDays(prevMonth, -62), "wire", "suspended");

  let n = 0;
  const inv = (org: Organization, ag: { id: string; name: string; monthlyValueCents: number; preferredPaymentMethod: PaymentMethod }, issue: string, items: { description: string; unitCents: number; kind: "recurring" | "implementation" }[], paid: number, sent = true) => {
    n++;
    const total = items.reduce((s, i) => s + i.unitCents, 0);
    const due = addDays(issue, 5);
    const status = paid >= total ? "paid" : today > due ? "past_due" : paid > 0 ? "partially_paid" : today === due ? "due" : "sent";
    return tx.insert("invoices", {
      orgId: org.id, invoiceNumber: `AB-${issue.slice(0, 4)}-${String(n).padStart(4, "0")}`, serviceAgreementId: ag.id, issueDate: issue, dueDate: due,
      currency: "USD", lineItems: items.map((i) => ({ ...i, quantity: 1 })), subtotalCents: total, taxCents: 0, totalCents: total,
      amountPaidCents: paid, balanceDueCents: total - paid, status, preferredPaymentMethod: ag.preferredPaymentMethod,
      sentAt: sent ? `${issue}T14:00:00.000Z` : undefined, createdBy: admin.id, createdAt: `${issue}T13:00:00.000Z`,
    });
  };
  const pay = (invoiceId: string, org: Organization, amount: number, date: string, method: "ach" | "wire", ref: string) =>
    tx.insert("payments", { orgId: org.id, invoiceId, amountCents: amount, dateReceived: date, method, source: method === "ach" ? "ach_received" : "wire_received", referenceNumber: ref, createdBy: operator.id, createdAt: `${date}T16:00:00.000Z` });

  const acmeImpl = inv(acme, acmeAg, prevMonth, [{ description: "Implementation fee", unitCents: 1_200_000, kind: "implementation" }], 1_200_000);
  pay(acmeImpl.id, acme, 1_200_000, addDays(prevMonth, 3), "wire", "FED-20260904-118");
  const acmePrev = inv(acme, acmeAg, prevMonth, [{ description: `${acmeAg.name} — previous month`, unitCents: 750_000, kind: "recurring" }], 750_000);
  pay(acmePrev.id, acme, 750_000, addDays(prevMonth, 4), "ach", "ACH-7731902");
  inv(acme, acmeAg, firstOfMonth, [{ description: `${acmeAg.name} — this month`, unitCents: 750_000, kind: "recurring" }], 0);

  const bayPast = inv(bayside, baysideAg, addDays(today, -17), [{ description: `${baysideAg.name} — monthly`, unitCents: 500_000, kind: "recurring" }], 0);
  void bayPast;
  const coastalA = inv(coastal, coastalAg, addDays(today, -48), [{ description: `${coastalAg.name} — monthly`, unitCents: 950_000, kind: "recurring" }], 950_000);
  const coastalB = inv(coastal, coastalAg, addDays(today, -18), [{ description: `${coastalAg.name} — monthly`, unitCents: 950_000, kind: "recurring" }], 950_000);
  pay(coastalA.id, coastal, 950_000, addDays(today, -1), "wire", "FED-COASTAL-0412");
  pay(coastalB.id, coastal, 950_000, addDays(today, -1), "wire", "FED-COASTAL-0413");

  for (const [org, type, detail, days] of [
    [acme, "agreement_created", "Acme agreement signed", 60], [acme, "payment_recorded", "Implementation fee by wire", 55],
    [bayside, "invoice_past_due", "Monthly invoice past due", 12], [bayside, "client_eligible_for_suspension", "17 days past due, grace 7", 0],
    [coastal, "client_suspended_for_billing", "Two invoices unpaid", 6], [coastal, "payment_recorded", "Both invoices paid by wire", 1],
    [coastal, "client_eligible_for_reactivation", "Balance cleared", 1],
  ] as [Organization, "agreement_created", string, number][]) {
    tx.insert("billing_events", { orgId: org.id, type, actorId: operator.id, correlationId: correlationId(), detail, createdAt: ago(days) });
  }

  /* ── Incidents ── */
  const inc = (org: Organization, type: "integration_failure" | "automation_failure" | "past_due_account" | "provider_failure", severity: "high" | "medium" | "low", title: string, detail: string, target: string, clientMessage?: string, extra: Record<string, string> = {}) =>
    tx.insert("incidents", {
      orgId: org.id, type, severity, title, detail, clientMessage, status: "open", firstSeenAt: ago(1), lastSeenAt: ago(0, 2), occurrences: 3,
      correlationIds: [correlationId()], fingerprint: `${type}:${target}`, ...extra,
    });
  inc(acme, "integration_failure", "medium", "ServiceTitan needs attention", "OAuth refresh failed: invalid_grant. Ask Acme's ServiceTitan admin to re-authorize.", iSt.id, "ServiceTitan connection needs attention.", { integrationId: iSt.id });
  inc(acme, "automation_failure", "medium", "Automation failing: Nightly CRM hygiene sweep", "Provider overloaded on the last two runs; fallback model not configured on the job.", b.crm.id, undefined, { botId: b.crm.id });
  inc(bayside, "past_due_account", "medium", "Bayside Plumbing Co.: 17 days past due — eligible for suspension", "Operator decision required. Auto-suspend is off.", bayside.id);

  /* ── Deployment history, notes, audit ── */
  for (const [org, rt, kind, detail, days] of [
    [acme, acmeRt, "provision", "Runtime provisioned (t3.medium, us-east-1, 100 GB encrypted)", 60],
    [acme, acmeRt, "deploy_bot", "Ads, SEO, Reviews, Prospecting, Outbound, CRM, Analytics deployed", 58],
    [acme, acmeRt, "deploy_bot", "Reactivation Bot deployed", 30],
    [acme, acmeRt, "restart", "Restart after engine config change", 9],
    [coastal, coastalRt, "suspend", "Runtime service stopped (billing). Storage preserved.", 6],
  ] as [Organization, Runtime, "provision", string, number][]) {
    tx.insert("deployment_events", { orgId: org.id, runtimeId: rt.id, kind, status: "succeeded", detail, engineVersion: "v2026.9.24", actorId: operator.id, correlationId: correlationId(), createdAt: ago(days) });
  }
  tx.insert("operator_notes", { orgId: acme.id, targetType: "client", targetId: acme.id, text: "Dana prefers a Friday summary call. Commercial work is the priority this quarter.", authorId: operator.id, authorName: operator.name, createdAt: ago(20) });
  tx.insert("operator_notes", { orgId: coastal.id, targetType: "client", targetId: coastal.id, text: "Paid both invoices by wire yesterday after the call. OK to reactivate once confirmed with Priya.", authorId: operator.id, authorName: operator.name, createdAt: ago(1) });
  for (const [who, action, org, days] of [
    [operator, "approval.create", acme, 0.1], [operator, "request.update", acme, 2], [operator, "billing.payment.record", coastal, 1],
    [operator, "client.suspend", coastal, 6], [admin, "bot.change_model", acme, 3], [operator, "bot.disable", acme, 21],
  ] as [typeof admin, string, Organization, number][]) {
    tx.insert("audit_logs", { orgId: org.id, actorId: who.id, actorName: who.name, action, targetType: "organization", targetId: org.id, result: "success", correlationId: correlationId(), createdAt: ago(days) });
  }

  // Bots were mutated above (integration ids) before commit — the insert ops hold
  // the original objects, so re-apply via the op list is unnecessary: Tx.insert
  // cloned them. Patch them in a second commit instead.
  await tx.commit();
  const tx2 = new Tx(r);
  for (const bot of [b.ads, b.analytics, b.reviews, b.seo, b.crm, b.outbound, b.prospecting, b.reactivation]) {
    const fresh = await r.get("bots", bot.id);
    if (fresh) tx2.patch("bots", fresh, { integrationIds: bot.integrationIds });
  }
  const req = await r.get("requests", reqList.id);
  if (req) tx2.patch("requests", req, { linkedRunIds: [r1.id] });
  void reqAds; void coastalAg;
  await tx2.commit();
  hydrateDemoRuntime(await r.list("runtimes"), await r.list("bots"));
}

/** Rebuild the demo runtime's in-memory switches (stopped runtimes, parked
 *  Bots) from stored state — needed after a dev-server restart. */
export function hydrateDemoRuntime(runtimes: Runtime[], bots: Bot[]): void {
  const st = demoState();
  for (const rt of runtimes) if (rt.deploymentState === "suspended") st.stopped.add(rt.id);
  for (const b of bots) if (b.status === "disabled") st.parked.add(`${b.runtimeId}:${b.runtimeProfile}`);
}
