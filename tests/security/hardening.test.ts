import { afterEach, describe, expect, it, vi } from "vitest";
import { world } from "../support/fixtures";
import { Tx } from "@/server/db/repository";
import { claimWebhookDelivery, createIntegration } from "@/server/services/integrations";
import { sharedRateLimit } from "@/server/security/rate-limit";
import { claimSyncLease, finishSyncLease } from "@/server/security/leases";
import { requireExecutionRelease } from "@/server/security/release-gates";
import { can } from "@/server/auth/policy";
import { storeKind, platformMode } from "@/server/env";
import { boundedText, body } from "@/server/api";
import { sameOriginMutation } from "@/lib/request-security";
import { createDeliverableApproval, resolveApproval } from "@/server/services/approvals";
import { BotRuntime } from "@/server/runtime";
import { createPrivacyCase, decidePrivacyCase, ownPrivacyReceipts } from "@/server/services/privacy";
import { setOperatorScope } from "@/server/services/accounts";
import { graphOf } from "@/server/prospecting/store";
import { addSuppression, checkSuppression, liftSuppression } from "@/server/prospecting/compliance";

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("security remediation regression cases", () => {
  it("allows only one claimant for concurrent webhook deliveries", async () => {
    const { r, acme } = await world();
    const claims = await Promise.all(Array.from({ length: 20 }, () => claimWebhookDelivery(r, "signed-source", "signed-event", acme.id)));
    expect(claims.filter(Boolean)).toHaveLength(1);
    expect(await r.list("processed_webhooks", { orgId: acme.id })).toHaveLength(1);
  });
  it("fails closed instead of exceeding shared request limits in a race", async () => {
    const { r } = await world();
    const results = await Promise.all(Array.from({ length: 30 }, () => sharedRateLimit(r, "private-person@example.invalid", 5, 60_000)));
    expect(results.filter(r => r.allowed).length).toBeLessThanOrEqual(5);
    expect(results.some(r => r.allowed)).toBe(true);
    expect(JSON.stringify(await r.list("security_counters"))).not.toContain("private-person");
  });
  it("coordinates sync invocations and permits recovery after release", async () => {
    const { r } = await world();
    const claims = await Promise.all(Array.from({ length: 12 }, () => claimSyncLease(r)));
    const acquired = claims.filter(Boolean);
    expect(acquired).toHaveLength(1);
    await finishSyncLease(r, "other-worker");
    expect(await claimSyncLease(r)).toBeNull();
    await finishSyncLease(r, acquired[0]!.holder);
    expect(await claimSyncLease(r)).not.toBeNull();
  });
  it("rejects audit edits and tenant identity changes at the repository boundary", async () => {
    const { r, acme, bayside } = await world();
    const log = (await r.list("audit_logs"))[0];
    await expect(r.commit([{ type: "patch", table: "audit_logs", id: log.id, expectedVersion: log.version, patch: { detail: "rewritten" } }])).rejects.toThrow(/Immutable/);
    const bot = (await r.list("bots", { orgId: acme.id }))[0];
    await expect(r.commit([{ type: "patch", table: "bots", id: bot.id, expectedVersion: bot.version, patch: { orgId: bayside.id } }])).rejects.toThrow(/ownership/);
    expect((await r.get("bots", bot.id))?.orgId).toBe(acme.id);
  });
  it("does not grant default tenant access and revokes sessions on scope changes", async () => {
    const { r, admin, operator, acme, bayside } = await world();
    const unscoped = { ...operator, user: { ...operator.user, operatorAllOrgs: undefined, operatorOrgIds: undefined } };
    expect(can(unscoped, "ops.view", acme.id)).toBe(false);
    const tx = new Tx(r);
    const s = tx.insert("sessions", { userId: operator.user.id, tokenHash: "test-hash", expiresAt: new Date(Date.now() + 60_000).toISOString() });
    await tx.commit();
    await setOperatorScope(r, admin, operator.user.id, false, [acme.id]);
    const user = (await r.get("users", operator.user.id))!;
    expect(can({ ...operator, user }, "ops.view", acme.id)).toBe(true);
    expect(can({ ...operator, user }, "ops.view", bayside.id)).toBe(false);
    expect((await r.get("sessions", s.id))?.revokedAt).toBeTruthy();
  });
  it("requires recent staff verification for write permissions", async () => {
    const { admin, acme } = await world();
    const stale = { ...admin, authenticatedAt: new Date(Date.now() - 16 * 60_000).toISOString() };
    expect(can(stale, "ops.view", acme.id)).toBe(true);
    expect(can(stale, "ops.approvals.resolve", acme.id)).toBe(false);
    expect(can({ ...admin, authenticatedAt: "invalid" }, "ops.users.manage")).toBe(false);
  });
  it("binds integration credentials to the selected tenant and environment", async () => {
    const { r, admin, acme, bayside } = await world();
    await expect(createIntegration(r, admin, { orgId: acme.id, provider: "webhook", secretRef: `agenticbots/demo/tenants/${bayside.tenantId}/integrations/test` })).rejects.toThrow();
    await expect(createIntegration(r, admin, { orgId: acme.id, provider: "webhook", secretRef: `agenticbots/prod/tenants/${acme.tenantId}/integrations/test` })).rejects.toThrow();
    const item = await createIntegration(r, admin, { orgId: acme.id, provider: "webhook", secretRef: `agenticbots/demo/tenants/${acme.tenantId}/integrations/test` });
    expect(item.status).toBe("needs_attention");
    expect(item.webhookSecretRef).toBe(`agenticbots/demo/tenants/${acme.tenantId}/integrations/${item.id}/webhook`);
  });
  it("accepts a draft once without turning it into an arbitrary runtime instruction", async () => {
    const { r, admin, acme } = await world();
    const bot = (await r.list("bots", { orgId: acme.id }))[0];
    const start = vi.spyOn(BotRuntime.prototype, "startBotRun");
    const approval = await createDeliverableApproval(r, admin, { orgId: acme.id, botId: bot.id, category: "external_send", title: "Review draft", explanation: "Prepared example", expectedImpact: "Review only", risk: "low", preview: "Sample content" });
    const decisions = await Promise.allSettled([resolveApproval(r, admin, approval.id, "approve"), resolveApproval(r, admin, approval.id, "deny")]);
    expect(decisions.filter(d => d.status === "fulfilled")).toHaveLength(1);
    expect(start).not.toHaveBeenCalled();
  });
  it("strengthens existing soft opt-outs and prevents later overrides", async () => {
    const { r, admin, acme } = await world();
    const store = graphOf(r);
    const ctx = { r, store, p: { kind: "user" as const, actor: admin }, now: new Date() };
    await addSuppression(ctx, { orgId: acme.id, kind: "email", value: "sample@example.invalid", reason: "client_suppression", hard: false });
    const permanent = await addSuppression(ctx, { orgId: acme.id, kind: "email", value: "sample@example.invalid", reason: "unsubscribed", hard: false });
    expect(permanent.hard).toBe(true);
    expect((await checkSuppression(store, acme.id, { email: "sample@example.invalid" }))[0].hard).toBe(true);
    await expect(liftSuppression(ctx, permanent.id)).rejects.toThrow(/cannot be lifted/);
  });
  it("keeps real execution locked even when production is implicit", () => {
    vi.stubEnv("DEMO_MODE", "false"); vi.stubEnv("PLATFORM_ENV", undefined);
    expect(platformMode()).toBe("production");
    expect(requireExecutionRelease).toThrow(/not released/);
    vi.stubEnv("PLATFORM_STORE", "memory");
    expect(storeKind).toThrow(/only in demo/);
    vi.stubEnv("PLATFORM_ENV", "typo"); expect(platformMode).toThrow();
  });
  it("bounds chunked JSON bodies and rejects arrays", async () => {
    const request = new Request("http://localhost/api/example", { method: "POST", body: "x".repeat(65_000) });
    await expect(boundedText(request)).rejects.toMatchObject({ status: 413 });
    await expect(body(new Request("http://localhost/api/example", { method: "POST", headers: { "Content-Type": "application/json" }, body: "[]" }))).rejects.toMatchObject({ status: 400 });
  });
  it("rejects cross-site, missing-origin and unconfigured production mutations", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://agenticbots.dev");
    const req = (origin?: string) => new Request("https://agenticbots.dev/api/example", { method: "POST", headers: origin ? { Origin: origin } : {} });
    expect(sameOriginMutation(req("https://agenticbots.dev"))).toBe(true);
    expect(sameOriginMutation(req("https://attacker.invalid"))).toBe(false);
    expect(sameOriginMutation(req())).toBe(false);
    expect(sameOriginMutation(req("null"))).toBe(false);
  });
  it("isolates privacy receipts and requires verification before fulfillment", async () => {
    const { r, admin, owner, member, operator, acme, bayside } = await world();
    const item = await createPrivacyCase(r, owner, { orgId: acme.id, kind: "access", details: "My personal information" });
    expect(await ownPrivacyReceipts(r, member, acme.id)).toEqual([]);
    await expect(ownPrivacyReceipts(r, owner, bayside.id)).rejects.toThrow();
    await expect(decidePrivacyCase(r, operator, item.id, "verified", "Verified using account email.")).rejects.toThrow();
    await expect(decidePrivacyCase(r, admin, item.id, "completed", "Completed without checking identity.")).rejects.toThrow();
    await decidePrivacyCase(r, admin, item.id, "verified", "Verified using account email.");
    await decidePrivacyCase(r, admin, item.id, "completed", "Scoped export delivered securely; reference test.");
    await expect(decidePrivacyCase(r, admin, item.id, "verified", "Try rewriting the record.")).rejects.toThrow();
    expect(await ownPrivacyReceipts(r, owner, acme.id)).toEqual([expect.objectContaining({ status: "completed" })]);
  });
});
