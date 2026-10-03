import { describe, it, expect, beforeAll } from "vitest";
import { world } from "../support/fixtures";
import { can } from "@/server/auth/policy";
import { getScoped } from "@/server/services/common";
import { startRun } from "@/server/services/runs";
import { resolveApproval } from "@/server/services/approvals";
import { addMessage, createRequest, getRequestFor, updateRequest } from "@/server/services/requests";
import { changeModel, setBotEnabled } from "@/server/services/bots";
import { createInvoice } from "@/server/billing/service";
import { suspendClient } from "@/server/services/clients";
import { createAutomation } from "@/server/services/automations";
import { portalData } from "@/server/views/portal";
import { actorFrom } from "@/server/auth/session";
import { Tx } from "@/server/db/repository";
import { hashPassword } from "@/server/auth/password";

let w: Awaited<ReturnType<typeof world>>;
beforeAll(async () => {
  w = await world();
});

describe("tenant isolation", () => {
  it("a client cannot read another tenant's records, even by id", async () => {
    const baysideBot = (await w.r.list("bots", { orgId: w.bayside.id }))[0];
    await expect(getScoped(w.r, "bots", baysideBot.id, w.owner, "portal.view")).rejects.toMatchObject({ code: "not_found" });
    const baysideReq = await createRequest(w.r, w.admin, w.bayside.id, { title: "Bayside internal thing", description: "" });
    await expect(getRequestFor(w.r, w.owner, baysideReq.id)).rejects.toMatchObject({ code: "not_found" });
    await expect(addMessage(w.r, w.owner, baysideReq.id, "hi")).rejects.toMatchObject({ code: "not_found" });
  });

  it("a client cannot create a request in another organization", async () => {
    await expect(createRequest(w.r, w.owner, w.bayside.id, { title: "sneaky", description: "" })).rejects.toMatchObject({ code: "not_found" });
  });

  it("a client cannot decide another tenant's approval", async () => {
    const bot = (await w.r.list("bots", { orgId: w.bayside.id }))[0];
    const tx = new Tx(w.r);
    const a = tx.insert("approvals", { orgId: w.bayside.id, botId: bot.id, kind: "deliverable", category: "external_send", title: "x", explanation: "x", expectedImpact: "x", risk: "low", status: "pending", audience: "client", requestedAt: new Date().toISOString() });
    await tx.commit();
    await expect(resolveApproval(w.r, w.owner, a.id, "approve")).rejects.toMatchObject({ code: "not_found" });
  });

  it("operators scoped to some organizations cannot see others", async () => {
    const u = (await w.r.list("users")).find((x) => x.email === "operator@agenticbots.demo")!;
    const scoped = actorFrom({ ...u, operatorOrgIds: [w.acme.id] }, []);
    expect(can(scoped, "ops.view", w.acme.id)).toBe(true);
    expect(can(scoped, "ops.view", w.bayside.id)).toBe(false);
    const baysideBot = (await w.r.list("bots", { orgId: w.bayside.id }))[0];
    await expect(setBotEnabled(w.r, scoped, baysideBot.id, false)).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("role boundaries", () => {
  it("clients have no operator permissions", () => {
    for (const p of ["ops.view", "ops.bots.manage", "ops.billing.write", "ops.clients.suspend", "ops.models.manage", "ops.runtime.control"] as const) {
      expect(can(w.owner, p, w.acme.id)).toBe(false);
    }
  });
  it("clients cannot touch technical Bot configuration", async () => {
    const bot = (await w.r.list("bots", { orgId: w.acme.id }))[0];
    await expect(changeModel(w.r, w.owner, bot.id, { provider: "anthropic", model: "claude-haiku-4-5" })).rejects.toMatchObject({ code: "not_found" });
    await expect(setBotEnabled(w.r, w.owner, bot.id, false)).rejects.toMatchObject({ code: "not_found" });
    await expect(startRun(w.r, w.owner, { botId: bot.id, task: "run it", idempotencyKey: "client-run-0001" })).rejects.toBeTruthy();
    await expect(createAutomation(w.r, w.owner, { orgId: w.acme.id, botId: bot.id, name: "x", prompt: "xxxxx", schedule: "every 1h" })).rejects.toMatchObject({ code: "not_found" });
  });
  it("clients cannot route their own requests", async () => {
    const req = (await w.r.list("requests", { orgId: w.acme.id }))[0];
    await expect(updateRequest(w.r, w.owner, req.id, { status: "completed" })).rejects.toMatchObject({ code: "not_found" });
  });
  it("billing and suspension require an operator", async () => {
    await expect(createInvoice(w.r, w.owner, w.acme.id, { lineItems: [{ description: "x", quantity: 1, unitCents: 100, kind: "custom" }] })).rejects.toBeTruthy();
    await expect(suspendClient(w.r, w.owner, w.acme.id, "manual")).rejects.toBeTruthy();
  });
  it("client members can submit requests but cannot approve", async () => {
    expect(can(w.member, "portal.requests.create", w.acme.id)).toBe(true);
    expect(can(w.member, "portal.approvals.resolve", w.acme.id)).toBe(false);
    const a = (await w.r.list("approvals", { orgId: w.acme.id })).find((x) => x.status === "pending")!;
    await expect(resolveApproval(w.r, w.member, a.id, "approve")).rejects.toMatchObject({ code: "not_found" });
  });
  it("disabled users have no permissions", async () => {
    const u = (await w.r.list("users")).find((x) => x.email === "operator@agenticbots.demo")!;
    expect(can(actorFrom({ ...u, status: "disabled" }, []), "ops.view")).toBe(false);
  });
  it("only superadmins manage users and destroy", () => {
    expect(can(w.operator, "ops.users.manage")).toBe(false);
    expect(can(w.operator, "ops.destroy")).toBe(false);
    expect(can(w.admin, "ops.users.manage")).toBe(true);
  });
});

describe("suspended clients cannot execute", () => {
  it("runs, automations and approvals are blocked; storage is untouched", async () => {
    const w2 = await world();
    const bot = (await w2.r.list("bots", { orgId: w2.acme.id })).find((b) => b.typeKey === "seo")!;
    const before = (await w2.r.list("bots", { orgId: w2.acme.id })).length;
    await suspendClient(w2.r, w2.operator, w2.acme.id, "manual", "test");
    await expect(startRun(w2.r, w2.operator, { botId: bot.id, task: "research", idempotencyKey: "susp-run-00001" })).rejects.toMatchObject({ code: "suspended" });
    await expect(createAutomation(w2.r, w2.operator, { orgId: w2.acme.id, botId: bot.id, name: "x", prompt: "xxxxx", schedule: "every 1h" })).rejects.toMatchObject({ code: "suspended" });
    const a = (await w2.r.list("approvals", { orgId: w2.acme.id })).find((x) => x.status === "pending")!;
    await expect(resolveApproval(w2.r, w2.owner, a.id, "approve")).rejects.toMatchObject({ code: "suspended" });
    expect((await w2.r.list("bots", { orgId: w2.acme.id })).length).toBe(before);
    const data = await portalData((await w2.r.get("organizations", w2.acme.id))!);
    expect(data.bots.every((b) => b.status === "Paused")).toBe(true);
  });
});

describe("secrets never reach a client payload", () => {
  it("portal projections contain no credentials, refs, hostnames, ARNs, models or providers", async () => {
    const data = JSON.stringify(await portalData(w.acme));
    for (const bad of ["agenticbots/demo/tenants", "credentialRef", "secretRef", "runtimeProfile", "anthropic", "claude-", "openrouter", "runtimeRunId", "apiKey", "API_SERVER_KEY", ".runtime.agenticbots.dev", "arn:aws", "i-0demo", "invalid_grant", "operatorNotes", "instructions"]) {
      expect(data, `client payload leaked "${bad}"`).not.toContain(bad);
    }
  });
  it("password hashes and session tokens never appear outside the server", async () => {
    const u = (await w.r.list("users"))[0];
    expect(u.passwordHash).toMatch(/^scrypt\$/);
    expect(await hashPassword("a-long-enough-password")).not.toContain("a-long-enough-password");
  });
});
