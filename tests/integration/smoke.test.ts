import { describe, it, expect } from "vitest";
import { world, wait } from "../support/fixtures";
import { startRun, syncRun } from "@/server/services/runs";
import { opsDashboard, clientRows } from "@/server/services/queries";
import { clientReport } from "@/server/services/reports";
import { billingOverview } from "@/server/billing/overview";

describe("smoke: seeded demo world", () => {
  it("seeds, runs a Bot end-to-end and reports", async () => {
    const w = await world();
    const rows = await clientRows(w.r, w.operator);
    expect(rows.map((x) => x.org.name)).toContain("Acme Roofing");
    const dash = await opsDashboard(w.r, w.operator);
    expect(dash.activeClients).toBeGreaterThan(0);
    const bot = (await w.r.list("bots", { orgId: w.acme.id })).find((b) => b.typeKey === "seo")!;
    const run = await startRun(w.r, w.operator, { botId: bot.id, task: "Research local search opportunities", idempotencyKey: "smoke-key-000001" });
    expect(run.runtimeRunId ?? (await w.r.get("runs", run.id))?.runtimeRunId).toBeTruthy();
    await wait(9500);
    const done = await syncRun(w.r, run.id);
    expect(done.status).toBe("completed");
    const events = await w.r.list("run_events", { orgId: w.acme.id, where: { runId: run.id } });
    expect(events.length).toBeGreaterThan(3);
    const rep = await clientReport(w.r, w.acme.id);
    expect(rep.results.length).toBeGreaterThan(0);
    const bill = await billingOverview(w.r, w.operator);
    expect(bill.metrics.mrrCents).toBeGreaterThan(0);
  });
});
