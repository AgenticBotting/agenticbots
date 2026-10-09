import { afterEach, describe, expect, it, vi } from "vitest";
import { world } from "../support/fixtures";
import { Tx } from "@/server/db/repository";
import { createIntegration, signWebhook, webhookSecretFor } from "@/server/services/integrations";
import { POST } from "@/app/api/webhooks/[integrationId]/route";

afterEach(() => vi.unstubAllEnvs());

describe("signed webhook route", () => {
  it("accepts one signed event even when a retry changes the delivery header or timestamp", async () => {
    vi.stubEnv("DEMO_MODE", "true");
    const { r, admin, acme } = await world();
    const bot = (await r.list("bots", { orgId: acme.id })).find(b => b.status === "active")!;
    const created = await createIntegration(r, admin, { orgId: acme.id, provider: "webhook" });
    const tx = new Tx(r);
    const connected = tx.patch("integrations", created, { status: "connected", botIds: [bot.id] });
    const job = tx.insert("automation_jobs", { orgId: acme.id, botId: bot.id, name: "Review new enquiry", prompt: "Review this enquiry and prepare a response", schedule: "every 1h", scheduleLabel: "Every hour", status: "active", consecutiveFailures: 0, trigger: "webhook" });
    await tx.commit();
    const secret = await webhookSecretFor(connected, r);
    expect(secret).toBeTruthy();
    const raw = JSON.stringify({ eventId: "customer-event-123", content: "sample enquiry" });
    const ctx = { params: Promise.resolve({ integrationId: created.id }) };
    const send = (delivery: string, timestamp: string, signature = signWebhook(secret!, timestamp, raw)) =>
      POST(new Request(`http://localhost/api/webhooks/${created.id}`, { method: "POST", headers: { "x-agenticbots-timestamp": timestamp, "x-agenticbots-delivery": delivery, "x-agenticbots-signature": signature }, body: raw }), ctx);
    const now = String(Math.floor(Date.now() / 1000));
    expect((await send("first", now, "sha256=forged")).status).toBe(401);
    const first = await send("first", now);
    expect(first.status).toBe(202);
    const second = await send("new-transport-id", String(Number(now) + 1));
    expect(second.status).toBe(200);
    expect(await second.json()).toMatchObject({ duplicate: true, status: "completed" });
    expect((await r.list("runs", { orgId: acme.id })).filter(run => run.automationId === job.id)).toHaveLength(1);
    expect((await r.list("processed_webhooks", { orgId: acme.id }))).toHaveLength(1);
  });
});
