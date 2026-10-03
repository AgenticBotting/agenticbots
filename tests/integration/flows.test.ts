import { describe, it, expect } from "vitest";
import { world, wait } from "../support/fixtures";
import { createRequest, updateRequest, startRunForRequest, getRequestFor } from "@/server/services/requests";
import { syncRun, startRun } from "@/server/services/runs";
import { resolveApproval } from "@/server/services/approvals";
import { portalData } from "@/server/views/portal";
import { opsDashboard } from "@/server/services/queries";
import { setBotEnabled } from "@/server/services/bots";
import { createAutomation, automationAction, describeSchedule } from "@/server/services/automations";
import { checkIntegration, setIntegrationStatusManually, createIntegration } from "@/server/services/integrations";

describe("core request flow", () => {
  it("client requests → operator routes to a Bot → run needs approval → client approves → result → completed", async () => {
    const w = await world();
    const req = await createRequest(w.r, w.owner, w.acme.id, { title: "Follow up on old estimates", description: "Spring estimates", priority: "high" });
    expect(req.status).toBe("submitted");
    const outbound = (await w.r.list("bots", { orgId: w.acme.id })).find((b) => b.typeKey === "outbound")!;
    await updateRequest(w.r, w.operator, req.id, { status: "reviewing", assignedOperatorId: w.operator.user.id, assignedBotIds: [outbound.id] });
    const run = await startRunForRequest(w.r, w.operator, req.id, outbound.id, "Draft and send follow-up emails for spring estimates", "req-run-000001");
    expect((await getRequestFor(w.r, w.owner, req.id)).status).toBe("in_progress");

    await wait(8000);
    const parked = await syncRun(w.r, run.id);
    expect(parked.status).toBe("waiting_for_approval");
    const client = await portalData(w.acme);
    const approval = client.approvals.find((a) => a.status === "pending" && a.botName === "Outbound Bot" && !a.title.includes("12 follow-up"));
    expect(approval).toBeTruthy();

    await resolveApproval(w.r, w.owner, approval!.id, "approve");
    await wait(3000);
    const done = await syncRun(w.r, run.id);
    expect(done.status).toBe("completed");
    expect(done.usage.inputTokens).toBeGreaterThan(0);
    await updateRequest(w.r, w.operator, req.id, { deliverable: { label: "Follow-up list", url: "https://docs.example/x" }, status: "completed" });
    const view = (await portalData(w.acme)).requests.find((r) => r.id === req.id)!;
    expect(view.statusLabel).toBe("Completed");
    expect(view.deliverables).toHaveLength(1);
    expect(JSON.stringify(view)).not.toContain(outbound.id); // client never learns which Bot did it
    const activity = (await portalData(w.acme)).activity.map((a) => a.text).join("\n");
    expect(activity).toMatch(/Outbound Bot completed/);
  }, 40_000);

  it("double-submitting a run returns the same run", async () => {
    const w = await world();
    const bot = (await w.r.list("bots", { orgId: w.acme.id })).find((b) => b.typeKey === "seo")!;
    const a = await startRun(w.r, w.operator, { botId: bot.id, task: "Crawl the site", idempotencyKey: "dbl-click-0001" });
    const b = await startRun(w.r, w.operator, { botId: bot.id, task: "Crawl the site", idempotencyKey: "dbl-click-0001" });
    expect(b.id).toBe(a.id);
    expect((await w.r.list("runs", { orgId: w.acme.id, where: { idempotencyKey: "dbl-click-0001" } }))).toHaveLength(1);
  });
});

describe("operator controls", () => {
  it("dashboard shows what needs attention", async () => {
    const w = await world();
    const d = await opsDashboard(w.r, w.operator);
    expect(d.eligibleForReactivation.map((o) => o.name)).toContain("Coastal Air & Heat");
    expect(d.pastDue.map((o) => o.name)).toContain("Bayside Plumbing Co.");
    expect(d.pendingApprovals).toBeGreaterThan(0);
  });
  it("disabling a Bot blocks its runs; enabling restores it", async () => {
    const w = await world();
    const bot = (await w.r.list("bots", { orgId: w.acme.id })).find((b) => b.typeKey === "crm")!;
    await setBotEnabled(w.r, w.operator, bot.id, false);
    await expect(startRun(w.r, w.operator, { botId: bot.id, task: "update deals", idempotencyKey: "disabled-0001" })).rejects.toThrow(/disabled/);
    await setBotEnabled(w.r, w.operator, bot.id, true);
    const run = await startRun(w.r, w.operator, { botId: bot.id, task: "update deals", idempotencyKey: "disabled-0002" });
    expect(run.status).not.toBe("failed");
  });
  it("automations: create, pause, resume, run, delete — clients see plain-English schedules", async () => {
    const w = await world();
    const bot = (await w.r.list("bots", { orgId: w.acme.id })).find((b) => b.typeKey === "analytics")!;
    const job = await createAutomation(w.r, w.operator, { orgId: w.acme.id, botId: bot.id, name: "Weekly summary", prompt: "Summarize last week", schedule: "0 8 * * 1" });
    expect(job.scheduleLabel).toBe("Mondays at 8:00 AM");
    expect(describeSchedule("every 6h")).toBe("Every 6 hours");
    expect((await automationAction(w.r, w.operator, job.id, "pause"))!.status).toBe("paused");
    expect((await automationAction(w.r, w.operator, job.id, "resume"))!.status).toBe("active");
    await automationAction(w.r, w.operator, job.id, "run");
    expect(await automationAction(w.r, w.operator, job.id, "delete")).toBeNull();
    await expect(createAutomation(w.r, w.operator, { orgId: w.acme.id, botId: bot.id, name: "bad", prompt: "xxxxxx", schedule: "whenever" })).rejects.toThrow(/Schedule/);
  });
  it("integrations are never 'Connected' without proof", async () => {
    const w = await world();
    const i = await createIntegration(w.r, w.operator, { orgId: w.acme.id, provider: "salesforce", secretRef: "agenticbots/demo/tenants/acme-roofing-demo/integrations/salesforce" });
    expect(i.status).toBe("needs_attention");
    const checked = await checkIntegration(w.r, w.operator, i.id);
    expect(checked.status).not.toBe("connected");
    await expect(setIntegrationStatusManually(w.r, w.operator, i.id, "connected", "ok")).rejects.toThrow(/verified/);
    const v = await setIntegrationStatusManually(w.r, w.operator, i.id, "connected", "Created and deleted a test contact in Salesforce");
    expect(v).toMatchObject({ status: "connected", verifiedBy: "operator" });
  });
});
