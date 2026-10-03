import "server-only";
import type { RunStatus, Usage } from "@/lib/platform/types";
import type {
  AutomationInput,
  RuntimeAdapter,
  RuntimeAutomation,
  RuntimeCapabilities,
  RuntimeConversation,
  RuntimeEvent,
  RuntimeHealthReport,
  RuntimeRunState,
  RuntimeSkill,
  RuntimeTarget,
  RuntimeToolset,
  StartRunInput,
} from "../adapter";
import { RuntimeError } from "../errors";
import { SKILLS } from "@/config/skills";
import { randomUUID } from "node:crypto";

/**
 * DemoRuntimeAdapter — a believable runtime with no network and no model.
 *
 * Runs progress on a timeline measured from their start time, so polling,
 * streaming, reloads and multiple tabs all see the same state. Tasks that
 * would send, publish or change something park in waiting_for_approval
 * until approved, exactly like the real runtime. Nothing here can reach an
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

interface DemoState {
  runs: Map<string, DemoRun>;
  byKey: Map<string, string>;
  jobs: Map<string, RuntimeAutomation & { profile: string; prompt: string }>;
  sessions: Map<string, RuntimeConversation & { profile: string }>;
  /** Runtimes the demo control plane has "stopped" (suspension). */
  stopped: Set<string>;
  /** Profiles that are parked (Bot disabled). key = runtimeId:profile */
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

function usageFor(task: string): Usage {
  const base = 1800 + (task.length * 37) % 2400;
  return { inputTokens: base * 4, outputTokens: Math.round(base * 0.6), cacheReadTokens: base * 2, cacheWriteTokens: Math.round(base / 3) };
}

function key(t: RuntimeTarget): string {
  return `${t.runtimeId}:${t.profile ?? "default"}`;
}

function assertUp(t: RuntimeTarget): void {
  const st = demoState();
  if (st.stopped.has(t.runtimeId)) throw new RuntimeError("runtime_unreachable", "Demo runtime is stopped", undefined, true);
  if (t.profile && st.parked.has(key(t))) throw new RuntimeError("runtime_not_found", "Demo Bot is parked");
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

function timeline(r: DemoRun): { at: number; ev: Omit<RuntimeEvent, "at"> }[] {
  const acts = ACTIONS[r.profile] ?? ["web_search", "browser_navigate", "document_draft"];
  const ev: { at: number; ev: Omit<RuntimeEvent, "at"> }[] = [
    { at: 0, ev: { type: "run.queued", raw: "run.queued" } },
    { at: T.start, ev: { type: "run.started", raw: "run.started" } },
    { at: T.act1, ev: { type: "action.started", raw: "tool.started", action: acts[0] } },
    { at: T.act1 + 900, ev: { type: "action.completed", raw: "tool.completed", action: acts[0], durationS: 0.9, error: false } },
    { at: T.act2, ev: { type: "action.started", raw: "tool.started", action: acts[1] } },
    { at: T.act2 + 1200, ev: { type: "action.completed", raw: "tool.completed", action: acts[1], durationS: 1.2, error: false } },
    { at: T.act3, ev: { type: "action.started", raw: "tool.started", action: acts[2] } },
    { at: T.act3 + 700, ev: { type: "action.completed", raw: "tool.completed", action: acts[2], durationS: 0.7, error: false } },
  ];
  if (r.stoppedAt) {
    return [...ev.filter((e) => e.at <= r.stoppedAt! - r.startedAt), { at: r.stoppedAt - r.startedAt, ev: { type: "run.cancelled", raw: "run.cancelled" } }];
  }
  if (r.needsApproval) {
    ev.push({ at: T.approval, ev: { type: "approval.requested", raw: "approval.request", approval: { requestId: `req_${r.id.slice(0, 8)}`, description: "Send the prepared messages" } } });
    if (r.approved || r.denied) {
      const at = (r.approvalAt ?? Date.now()) - r.startedAt;
      ev.push({ at, ev: { type: "approval.resolved", raw: "approval.responded" } });
      ev.push({ at: at + T.afterApproval, ev: { type: "run.completed", raw: "run.completed", usage: usageFor(r.task), text: r.denied ? "Stopped before sending: the approval was declined." : OUTPUTS[r.profile] } });
    }
    return ev;
  }
  ev.push({ at: T.done, ev: r.fail ? { type: "run.failed", raw: "run.failed", text: "Provider returned an error" } : { type: "run.completed", raw: "run.completed", usage: usageFor(r.task), text: OUTPUTS[r.profile] } });
  return ev;
}

export class DemoRuntimeAdapter implements RuntimeAdapter {
  readonly kind = "demo" as const;

  async getCapabilities(t: RuntimeTarget): Promise<RuntimeCapabilities> {
    assertUp(t);
    return {
      runs: true, runEvents: true, runStop: true, runApproval: true, idempotency: true,
      conversations: true, automations: true, skills: true, toolsets: true, detailedHealth: true,
      raw: { run_submission: true, run_status: true, run_events_sse: true, run_stop: true, run_approval: true },
    };
  }

  async getHealth(t: RuntimeTarget): Promise<RuntimeHealthReport> {
    return this.getDetailedHealth(t);
  }

  async getDetailedHealth(t: RuntimeTarget): Promise<RuntimeHealthReport> {
    const st = demoState();
    if (st.stopped.has(t.runtimeId)) {
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

  async listBots(t: RuntimeTarget, profiles: string[]) {
    const st = demoState();
    return profiles.map((profile) => ({
      profile,
      reachable: !st.stopped.has(t.runtimeId) && !st.parked.has(`${t.runtimeId}:${profile}`),
    }));
  }

  async getBot(t: RuntimeTarget) {
    assertUp(t);
    return { profile: t.profile ?? "default", reachable: true, modelAlias: t.profile };
  }

  async startBotRun(t: RuntimeTarget, input: StartRunInput) {
    assertUp(t);
    const st = demoState();
    const k = `${key(t)}:${input.idempotencyKey}`;
    const existing = st.byKey.get(k);
    if (existing) return { runtimeRunId: existing, replayed: true };
    const id = `demo_run_${randomUUID().slice(0, 12)}`;
    st.runs.set(id, {
      id,
      profile: t.profile ?? "default",
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
    if (!r) throw new RuntimeError("runtime_not_found", "Unknown demo run");
    return r;
  }

  async getRun(t: RuntimeTarget, runtimeRunId: string): Promise<RuntimeRunState> {
    const r = this.run(runtimeRunId);
    const status = statusOf(r);
    const terminal = status === "completed" || status === "failed" || status === "cancelled";
    return {
      runtimeRunId,
      status,
      output: status === "completed" ? (r.denied ? "Stopped before sending: the approval was declined." : OUTPUTS[r.profile]) : undefined,
      usage: terminal ? usageFor(r.task) : undefined,
      provider: "demo",
      model: "demo-model",
      error: status === "failed" ? "Provider returned an error" : undefined,
      pendingApproval: status === "waiting_for_approval" ? { requestId: `req_${r.id.slice(0, 8)}`, description: "Send the prepared messages" } : undefined,
    };
  }

  async *streamRunEvents(_t: RuntimeTarget, runtimeRunId: string, signal?: AbortSignal): AsyncIterable<RuntimeEvent> {
    const r = this.run(runtimeRunId);
    let emitted = 0;
    const deadline = Date.now() + 60_000;
    while (!signal?.aborted && Date.now() < deadline) {
      const now = Date.now() - r.startedAt;
      const events = timeline(r);
      while (emitted < events.length && events[emitted].at <= now) {
        const e = events[emitted++];
        yield { ...e.ev, at: new Date(r.startedAt + e.at).toISOString() } as RuntimeEvent;
        if (["run.completed", "run.failed", "run.cancelled"].includes(e.ev.type)) return;
      }
      await new Promise((res) => setTimeout(res, 400));
    }
  }

  /** Synchronous snapshot of all events that have happened so far — used by the sync worker. */
  eventsSoFar(runtimeRunId: string): RuntimeEvent[] {
    const r = this.run(runtimeRunId);
    const now = Date.now() - r.startedAt;
    return timeline(r)
      .filter((e) => e.at <= now)
      .map((e) => ({ ...e.ev, at: new Date(r.startedAt + e.at).toISOString() }) as RuntimeEvent);
  }

  async stopRun(_t: RuntimeTarget, runtimeRunId: string) {
    const r = this.run(runtimeRunId);
    r.stoppedAt ??= Date.now();
  }

  async approveRun(_t: RuntimeTarget, runtimeRunId: string) {
    const r = this.run(runtimeRunId);
    r.approved = true;
    r.approvalAt = Date.now();
  }

  async denyRun(_t: RuntimeTarget, runtimeRunId: string) {
    const r = this.run(runtimeRunId);
    r.denied = true;
    r.approvalAt = Date.now();
  }

  async listConversations(t: RuntimeTarget) {
    return [...demoState().sessions.values()].filter((s) => s.profile === (t.profile ?? "default"));
  }

  async createConversation(t: RuntimeTarget, title: string) {
    assertUp(t);
    const c = { runtimeId: `demo_sess_${randomUUID().slice(0, 10)}`, title, messages: [], profile: t.profile ?? "default" };
    demoState().sessions.set(c.runtimeId, c);
    return c;
  }

  async getConversation(_t: RuntimeTarget, runtimeId: string) {
    const c = demoState().sessions.get(runtimeId);
    if (!c) throw new RuntimeError("runtime_not_found", "Unknown demo conversation");
    return c;
  }

  async listAutomations(t: RuntimeTarget) {
    return [...demoState().jobs.values()].filter((j) => j.profile === (t.profile ?? "default"));
  }

  async createAutomation(t: RuntimeTarget, input: AutomationInput) {
    assertUp(t);
    const job = {
      runtimeJobId: `demo_job_${randomUUID().slice(0, 10)}`,
      name: input.name,
      schedule: input.schedule,
      enabled: true,
      profile: t.profile ?? "default",
      prompt: input.prompt,
    };
    demoState().jobs.set(job.runtimeJobId, job);
    return job;
  }

  private job(id: string) {
    const st = demoState();
    let j = st.jobs.get(id);
    if (!j) {
      // Demo state is in memory; after a dev-server restart, recreate the
      // job record the stored automation points at.
      j = { runtimeJobId: id, name: id, schedule: "", enabled: true, profile: "default", prompt: "" };
      st.jobs.set(id, j);
    }
    return j;
  }

  async updateAutomation(_t: RuntimeTarget, id: string, input: Partial<AutomationInput>) {
    const j = this.job(id);
    Object.assign(j, { name: input.name ?? j.name, schedule: input.schedule ?? j.schedule, prompt: input.prompt ?? j.prompt });
    return j;
  }
  async pauseAutomation(_t: RuntimeTarget, id: string) {
    this.job(id).enabled = false;
  }
  async resumeAutomation(_t: RuntimeTarget, id: string) {
    this.job(id).enabled = true;
  }
  async runAutomationNow(_t: RuntimeTarget, id: string) {
    const j = this.job(id);
    j.lastRunAt = new Date().toISOString();
    j.lastStatus = "succeeded";
  }
  async deleteAutomation(_t: RuntimeTarget, id: string) {
    demoState().jobs.delete(id);
  }

  async listSkills(): Promise<RuntimeSkill[]> {
    return SKILLS.map((s) => ({ name: s.key, description: s.description, category: "agenticbots" }));
  }

  async listToolsets(): Promise<RuntimeToolset[]> {
    return [
      { name: "web", label: "Web research", enabled: true, tools: ["web_search", "web_extract"] },
      { name: "browser", label: "Browser", enabled: true, tools: ["browser_navigate", "browser_snapshot"] },
      { name: "files", label: "Files", enabled: true, tools: ["read_file", "write_file"] },
      { name: "terminal", label: "Sandboxed compute", enabled: false, tools: ["terminal", "execute_code"] },
    ];
  }
}
