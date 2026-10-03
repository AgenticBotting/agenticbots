import "server-only";
import type { RuntimeAdapter } from "../RuntimeAdapter";
import type {
  AutomationConfig,
  BotEventType,
  BotRunEvent,
  RunStatus,
  RuntimeAutomation,
  RuntimeBot,
  RuntimeBotRun,
  RuntimeCapabilities,
  RuntimeConnection,
  RuntimeConversation,
  RuntimeHealthReport,
  RuntimeSkill,
  RuntimeToolset,
  StartBotRunInput,
  StartedBotRun,
  Usage,
} from "../runtime-types";
import { TERMINAL_EVENT_TYPES } from "../runtime-types";
import { BotNotFoundError, RunNotFoundError, RuntimeResourceNotFoundError, RuntimeUnavailableError } from "../runtime-errors";
import { SKILLS } from "@/config/skills";
import { randomUUID } from "node:crypto";

/**
 * DemoRuntimeAdapter — a believable runtime with no network and no model.
 *
 * Runs progress on a timeline measured from their start time, so polling,
 * streaming, reloads and multiple tabs all see the same state. Tasks that
 * would send, publish or change something park in waiting_for_approval
 * until approved, exactly like a real runtime. Nothing here can reach an
 * external system.
 */

interface DemoRun {
  id: string;
  profile: string;
  task: string;
  startedAt: number;
  needsApproval: boolean;
  approvalAt?: number;
  approved?: boolean;
  denied?: boolean;
  stoppedAt?: number;
  idempotencyKey: string;
  fail: boolean;
}

type DemoJob = RuntimeAutomation & { profile: string; prompt: string };

interface DemoState {
  runs: Map<string, DemoRun>;
  byKey: Map<string, string>;
  jobs: Map<string, DemoJob>;
  sessions: Map<string, RuntimeConversation & { profile: string }>;
  /** Runtimes the demo control plane has "stopped" (suspension). */
  stopped: Set<string>;
  /** Bots that are disabled. key = runtimeId:runtimeProfile */
  parked: Set<string>;
}

const g = globalThis as unknown as { __abDemoRuntime?: DemoState };
export function demoState(): DemoState {
  g.__abDemoRuntime ??= { runs: new Map(), byKey: new Map(), jobs: new Map(), sessions: new Map(), stopped: new Set(), parked: new Set() };
  return g.__abDemoRuntime;
}

const WRITE_WORDS = /\b(send|email|publish|post|launch|change|update|modify|delete|overwrite|pause campaign|bid|budget|outreach|sequence)\b/i;

/** Timeline offsets in ms. Kept short so a sales demo feels alive. */
const T = { start: 600, act1: 1800, act2: 3800, act3: 6000, approval: 7500, done: 9000, afterApproval: 2500 };

const ACTIONS: Record<string, [string, string, string]> = {
  ads: ["google_ads_search_terms", "analytics_report", "spreadsheet_compare"],
  seo: ["web_search", "browser_navigate", "search_console_query"],
  reviews: ["servicetitan_jobs", "business_profile_reviews", "email_draft"],
  content: ["web_search", "document_draft", "skill_view"],
  prospecting: ["web_search", "browser_navigate", "hubspot_search_companies"],
  outbound: ["hubspot_contacts", "email_draft", "calendar_availability"],
  reactivation: ["servicetitan_customers", "quickbooks_invoices", "email_draft"],
  crm: ["hubspot_deals", "hubspot_update_deal", "memory_recall"],
  analytics: ["ga4_report", "google_ads_report", "execute_code"],
  proposal: ["document_read", "pricebook_lookup", "document_draft"],
};

const OUTPUTS: Record<string, string> = {
  ads: "Reviewed recent search terms. Found irrelevant queries consuming budget and drafted negative keywords for review.",
  seo: "Completed a local-search pass. Identified content opportunities for service-area pages and two technical fixes.",
  reviews: "Matched recently completed jobs to customers and prepared review requests for approval.",
  content: "Drafted this week's content pieces from recent project notes, ready for review before publishing.",
  prospecting: "Researched commercial property managers and facilities contacts, qualified them against the target profile and added them to a list.",
  outbound: "Prepared follow-up messages for open estimates and queued them for approval before sending.",
  reactivation: "Identified past customers due for seasonal service and drafted reactivation messages for approval.",
  crm: "Updated stale opportunity stages, merged duplicates and set next steps where missing.",
  analytics: "Combined channel data into a weekly summary. Attribution is limited to connected sources.",
  proposal: "Drafted a proposal from the site notes and price book, ready for review.",
};

const DENIED_OUTPUT = "Stopped before sending: the approval was declined.";

function usageFor(task: string): Usage {
  const base = 1800 + ((task.length * 37) % 2400);
  return { inputTokens: base * 4, outputTokens: Math.round(base * 0.6), cacheReadTokens: base * 2, cacheWriteTokens: Math.round(base / 3) };
}

const profileOf = (c: RuntimeConnection) => c.runtimeProfile ?? "default";
const key = (c: RuntimeConnection) => `${c.runtimeId}:${profileOf(c)}`;

function assertUp(c: RuntimeConnection): void {
  const st = demoState();
  if (st.stopped.has(c.runtimeId)) throw new RuntimeUnavailableError("Demo runtime is stopped");
  if (c.runtimeProfile && st.parked.has(key(c))) throw new BotNotFoundError("Demo Bot is disabled");
}

function statusOf(r: DemoRun, now = Date.now()): RunStatus {
  const el = now - r.startedAt;
  if (r.stoppedAt) return "cancelled";
  if (r.denied) return "completed";
  if (el < T.start) return "queued";
  if (r.needsApproval && !r.approved) return el >= T.approval ? "waiting_for_approval" : "running";
  const doneAt = r.needsApproval && r.approvalAt ? r.approvalAt - r.startedAt + T.afterApproval : T.done;
  if (el < doneAt) return "running";
  return r.fail ? "failed" : "completed";
}

type Step = { at: number; ev: Omit<BotRunEvent, "at" | "sourceEvent"> };
const ev = (type: BotEventType, extra: Partial<BotRunEvent> = {}): Step["ev"] => ({ type, ...extra });

function timeline(r: DemoRun): Step[] {
  const acts = ACTIONS[r.profile] ?? ["web_search", "browser_navigate", "document_draft"];
  const steps: Step[] = [
    { at: 0, ev: ev("bot.run.queued") },
    { at: T.start, ev: ev("bot.run.started") },
    { at: T.act1, ev: ev("bot.action.started", { action: acts[0] }) },
    { at: T.act1 + 900, ev: ev("bot.action.completed", { action: acts[0], durationS: 0.9, error: false }) },
    { at: T.act2, ev: ev("bot.action.started", { action: acts[1] }) },
    { at: T.act2 + 1200, ev: ev("bot.action.completed", { action: acts[1], durationS: 1.2, error: false }) },
    { at: T.act3, ev: ev("bot.action.started", { action: acts[2] }) },
    { at: T.act3 + 700, ev: ev("bot.action.completed", { action: acts[2], durationS: 0.7, error: false }) },
  ];
  if (r.stoppedAt) {
    const at = r.stoppedAt - r.startedAt;
    return [...steps.filter((e) => e.at <= at), { at, ev: ev("bot.run.cancelled") }];
  }
  if (r.needsApproval) {
    steps.push({ at: T.approval, ev: ev("bot.approval.requested", { approval: { approvalId: approvalIdOf(r), description: "Send the prepared messages" } }) });
    if (r.approved || r.denied) {
      const at = (r.approvalAt ?? Date.now()) - r.startedAt;
      steps.push({ at, ev: ev("bot.approval.resolved") });
      steps.push({ at: at + T.afterApproval, ev: ev("bot.run.completed", { usage: usageFor(r.task), text: r.denied ? DENIED_OUTPUT : OUTPUTS[r.profile] }) });
    }
    return steps;
  }
  steps.push({
    at: T.done,
    ev: r.fail ? ev("bot.run.failed", { text: "Provider returned an error" }) : ev("bot.run.completed", { usage: usageFor(r.task), text: OUTPUTS[r.profile] }),
  });
  return steps;
}

const approvalIdOf = (r: DemoRun) => `appr_${r.id.slice(-8)}`;
const materialize = (r: DemoRun, s: Step): BotRunEvent => ({ ...s.ev, sourceEvent: `demo.${s.ev.type.slice(4)}`, at: new Date(r.startedAt + s.at).toISOString() });

export class DemoRuntimeAdapter implements RuntimeAdapter {
  readonly provider = "demo" as const;
  readonly traits = { eventReplay: true };

  async getHealth(c: RuntimeConnection): Promise<RuntimeHealthReport> {
    return this.getDetailedHealth(c);
  }

  async getDetailedHealth(c: RuntimeConnection): Promise<RuntimeHealthReport> {
    const st = demoState();
    if (st.stopped.has(c.runtimeId)) {
      return { status: "offline", ready: false, checks: [{ name: "runtime", status: "stopped" }], checkedAt: new Date().toISOString() };
    }
    const active = [...st.runs.values()].filter((r) => ["queued", "running", "waiting_for_approval"].includes(statusOf(r))).length;
    return {
      status: "healthy",
      ready: true,
      checks: [
        { name: "config", status: "ok" },
        { name: "state_db", status: "ok" },
        { name: "model", status: "ok" },
        { name: "disk", status: "ok" },
      ],
      activeRuns: active,
      diskFreePct: 71,
      checkedAt: new Date().toISOString(),
    };
  }

  async listBots(c: RuntimeConnection, runtimeProfiles: string[]): Promise<RuntimeBot[]> {
    const st = demoState();
    return runtimeProfiles.map((runtimeProfile) => ({
      runtimeProfile,
      status: st.stopped.has(c.runtimeId) ? "offline" : st.parked.has(`${c.runtimeId}:${runtimeProfile}`) ? "disabled" : this.busy(runtimeProfile) ? "working" : "active",
    }));
  }

  private busy(profile: string): boolean {
    return [...demoState().runs.values()].some((r) => r.profile === profile && ["queued", "running", "waiting_for_approval"].includes(statusOf(r)));
  }

  async getBot(c: RuntimeConnection): Promise<RuntimeBot> {
    assertUp(c);
    return { runtimeProfile: profileOf(c), status: this.busy(profileOf(c)) ? "working" : "active", modelAlias: "demo-model" };
  }

  async getBotCapabilities(c: RuntimeConnection): Promise<RuntimeCapabilities> {
    assertUp(c);
    return {
      runs: true, runEvents: true, runStop: true, runApproval: true, idempotency: true,
      conversations: true, automations: true, skills: true, toolsets: true, detailedHealth: true,
      eventReplay: true,
      reported: { runs: true, run_events: true, run_stop: true, run_approval: true },
    };
  }

  async listBotSkills(): Promise<RuntimeSkill[]> {
    return SKILLS.map((s) => ({ name: s.key, description: s.description, category: "agenticbots" }));
  }

  async listBotToolsets(): Promise<RuntimeToolset[]> {
    return [
      { name: "web", label: "Web research", enabled: true, tools: ["web_search", "web_extract"] },
      { name: "browser", label: "Browser", enabled: true, tools: ["browser_navigate", "browser_snapshot"] },
      { name: "files", label: "Files", enabled: true, tools: ["read_file", "write_file"] },
      { name: "compute", label: "Sandboxed compute", enabled: false, tools: ["execute_code"] },
    ];
  }

  async startBotRun(c: RuntimeConnection, input: StartBotRunInput): Promise<StartedBotRun> {
    assertUp(c);
    const st = demoState();
    const k = `${key(c)}:${input.idempotencyKey}`;
    const existing = st.byKey.get(k);
    if (existing) return { runtimeRunId: existing, replayed: true };
    const id = `demo_run_${randomUUID().slice(0, 12)}`;
    st.runs.set(id, {
      id,
      profile: profileOf(c),
      task: input.task,
      startedAt: Date.now(),
      needsApproval: WRITE_WORDS.test(input.task),
      idempotencyKey: input.idempotencyKey,
      fail: /\bfail\b/i.test(input.task),
    });
    st.byKey.set(k, id);
    return { runtimeRunId: id, replayed: false };
  }

  private run(id: string): DemoRun {
    const r = demoState().runs.get(id);
    if (!r) throw new RunNotFoundError("Unknown demo run");
    return r;
  }

  async getBotRun(_c: RuntimeConnection, runtimeRunId: string): Promise<RuntimeBotRun> {
    const r = this.run(runtimeRunId);
    const status = statusOf(r);
    const terminal = status === "completed" || status === "failed" || status === "cancelled";
    return {
      runtimeRunId,
      status,
      output: status === "completed" ? (r.denied ? DENIED_OUTPUT : OUTPUTS[r.profile]) : undefined,
      usage: terminal ? usageFor(r.task) : undefined,
      provider: "demo",
      model: "demo-model",
      error: status === "failed" ? "Provider returned an error" : undefined,
      pendingApproval: status === "waiting_for_approval" ? { approvalId: approvalIdOf(r), description: "Send the prepared messages" } : undefined,
    };
  }

  async stopBotRun(_c: RuntimeConnection, runtimeRunId: string): Promise<void> {
    const r = this.run(runtimeRunId);
    r.stoppedAt ??= Date.now();
  }

  async *streamBotRunEvents(_c: RuntimeConnection, runtimeRunId: string, signal?: AbortSignal): AsyncIterable<BotRunEvent> {
    const r = this.run(runtimeRunId);
    let emitted = 0;
    const deadline = Date.now() + 60_000;
    while (!signal?.aborted && Date.now() < deadline) {
      const now = Date.now() - r.startedAt;
      const steps = timeline(r);
      while (emitted < steps.length && steps[emitted].at <= now) {
        const s = steps[emitted++];
        yield materialize(r, s);
        if (TERMINAL_EVENT_TYPES.includes(s.ev.type)) return;
      }
      await new Promise((res) => setTimeout(res, 400));
    }
  }

  async listBotRunEvents(_c: RuntimeConnection, runtimeRunId: string): Promise<BotRunEvent[]> {
    const r = this.run(runtimeRunId);
    const now = Date.now() - r.startedAt;
    return timeline(r)
      .filter((s) => s.at <= now)
      .map((s) => materialize(r, s));
  }

  async approveBotRun(_c: RuntimeConnection, runtimeRunId: string): Promise<void> {
    const r = this.run(runtimeRunId);
    r.approved = true;
    r.approvalAt = Date.now();
  }

  async denyBotRun(_c: RuntimeConnection, runtimeRunId: string): Promise<void> {
    const r = this.run(runtimeRunId);
    r.denied = true;
    r.approvalAt = Date.now();
  }

  async listConversations(c: RuntimeConnection): Promise<RuntimeConversation[]> {
    return [...demoState().sessions.values()].filter((s) => s.profile === profileOf(c));
  }

  async createConversation(c: RuntimeConnection, title: string): Promise<RuntimeConversation> {
    assertUp(c);
    const conv = { runtimeConversationId: `demo_conv_${randomUUID().slice(0, 10)}`, title, messages: [], profile: profileOf(c) };
    demoState().sessions.set(conv.runtimeConversationId, conv);
    return conv;
  }

  async getConversation(_c: RuntimeConnection, runtimeConversationId: string): Promise<RuntimeConversation> {
    const conv = demoState().sessions.get(runtimeConversationId);
    if (!conv) throw new RuntimeResourceNotFoundError("Unknown demo conversation");
    return conv;
  }

  async listAutomations(c: RuntimeConnection): Promise<RuntimeAutomation[]> {
    return [...demoState().jobs.values()].filter((j) => j.profile === profileOf(c));
  }

  async createAutomation(c: RuntimeConnection, config: AutomationConfig): Promise<RuntimeAutomation> {
    assertUp(c);
    const job: DemoJob = {
      runtimeAutomationId: `demo_auto_${randomUUID().slice(0, 10)}`,
      name: config.name,
      schedule: config.schedule,
      status: "active",
      profile: profileOf(c),
      prompt: config.prompt,
    };
    demoState().jobs.set(job.runtimeAutomationId, job);
    return job;
  }

  private job(id: string): DemoJob {
    const st = demoState();
    let j = st.jobs.get(id);
    if (!j) {
      // Demo state is in memory; after a dev-server restart, recreate the
      // record the stored Automation points at.
      j = { runtimeAutomationId: id, name: id, schedule: "", status: "active", profile: "default", prompt: "" };
      st.jobs.set(id, j);
    }
    return j;
  }

  async updateAutomation(_c: RuntimeConnection, id: string, config: Partial<AutomationConfig>): Promise<RuntimeAutomation> {
    const j = this.job(id);
    Object.assign(j, { name: config.name ?? j.name, schedule: config.schedule ?? j.schedule, prompt: config.prompt ?? j.prompt });
    return j;
  }
  async pauseAutomation(_c: RuntimeConnection, id: string): Promise<void> {
    this.job(id).status = "paused";
  }
  async resumeAutomation(_c: RuntimeConnection, id: string): Promise<void> {
    this.job(id).status = "active";
  }
  async runAutomationNow(_c: RuntimeConnection, id: string): Promise<void> {
    const j = this.job(id);
    j.lastRunAt = new Date().toISOString();
    j.lastResult = "succeeded";
  }
  async deleteAutomation(_c: RuntimeConnection, id: string): Promise<void> {
    demoState().jobs.delete(id);
  }
}
