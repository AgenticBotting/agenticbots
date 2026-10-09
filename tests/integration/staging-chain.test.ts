// Isolated loopback emulator only: exercise the adapter behind the unreleased live gate.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { vi } from "vitest";
import { MemoryRepository } from "@/server/db/memory";
import { setRepoForTesting } from "@/server/db";
import { Tx } from "@/server/db/repository";
import type { Actor } from "@/server/auth/policy";
import type { Bot, Organization, Runtime } from "@/lib/platform/types";
import { createClientOrg } from "@/server/services/accounts";
import { refreshRuntimeHealth } from "@/server/services/monitoring";
import { pumpRun, startRun, syncRun } from "@/server/services/runs";
import { resolveApproval } from "@/server/services/approvals";
import { leaksRuntime } from "@/server/redact";
import { startFakeHermes, type FakeHermes } from "../support/fake-hermes";

/**
 * The staging chain, minus AWS and Cloudflare:
 *
 *   AgenticBots services (staging mode, not demo)
 *     → BotRuntime → HermesRuntimeAdapter → HTTP
 *     → (fake) Hermes, profile "seo", per-profile key
 *     → Bot Run → result → database → client-safe projections
 *
 * Same code path as the real staging test; only the network hop differs
 * (RUNTIME_DEV_TARGETS instead of Secrets Manager + tunnel).
 */
const ops: Actor = {
  user: { id: "staging-test-operator", email: "ops@test", name: "Staging test", status: "active", platformRole: "superadmin" },
  platformRole: "superadmin",
  memberships: [],
} as unknown as Actor;

describe("staging chain: AgenticBots → Hermes adapter → runtime → result → database", () => {
  let fake: FakeHermes;
  let r: MemoryRepository;
  let org: Organization;
  let runtime: Runtime;
  let bot: Bot;
  const saved = { ...process.env };

  beforeAll(async () => {
    process.env.DEMO_MODE = "false";
    process.env.PLATFORM_ENV = "staging";
    process.env.PLATFORM_STORE = "memory";
    fake = await startFakeHermes({ seo: "key-seo-0123456789abcdef", default: "key-default-0123456789abcdef" });
    r = new MemoryRepository();
    setRepoForTesting(r);

    org = await createClientOrg(r, ops, { name: "AgenticBots Test Company" });
    runtime = (await r.list("runtimes", { orgId: org.id }))[0];
    expect(runtime.provider).toBe("hermes");
    expect(runtime.endpointRef).toBe(`agenticbots/staging/tenants/${org.tenantId}/runtime`);
    process.env.RUNTIME_DEV_TARGETS = JSON.stringify({ [runtime.id]: { baseUrl: fake.url, keys: fake.keys } });

    const tx = new Tx(r);
    tx.insert("provider_configurations", { provider: "openrouter", displayName: "OpenRouter", status: "unknown", models: [{ id: "test/model", label: "Test", inputPerM: 1, outputPerM: 2 }] });
    bot = tx.insert("bots", {
      orgId: org.id, typeKey: "seo", name: "SEO Bot", status: "active", runtimeId: runtime.id, runtimeProfile: "seo",
      provider: "openrouter", model: "test/model", capabilities: [], integrationIds: [],
      credentialRef: undefined, credentialStatus: "present",
    });
    tx.patch("organizations", org, { status: "active" });
    await tx.commit();
  });

  afterAll(async () => {
    await fake?.close();
    setRepoForTesting(undefined);
    process.env = saved;
  });

  it("runtime health check reaches the engine and marks the runtime ready", async () => {
    const rt = await refreshRuntimeHealth(r, runtime.id);
    expect(rt.health).toBe("healthy");
    expect(rt.ready).toBe(true);
    expect(rt.capabilities).toMatchObject({ runs: true, runStop: true, runApproval: true });
  });

  it("SEO Bot run: start → progress events → result stored in the database", async () => {
    let run = await startRun(r, ops, { botId: bot.id, task: "Research local SEO for roofers in Naples", idempotencyKey: "staging-chain-0001" });
    expect(run.status).toBe("running");
    expect(run.runtimeRunId).toBeTruthy();
    // The engine received the Bot's own profile and model.
    expect(fake.runs.get(run.runtimeRunId!)?.profile).toBe("seo");

    fake.advance(run.runtimeRunId!);
    run = await pumpRun(r, run.id, 3000);
    expect(run.status).toBe("completed");

    const stored = (await r.get("runs", run.id))!;
    expect(stored.resultSummary).toBeTruthy();
    expect(stored.usage?.inputTokens).toBeGreaterThan(0);
    const events = await r.list("run_events", { orgId: org.id, where: { runId: run.id } });
    expect(events.map((e) => e.clientText).filter(Boolean)).toEqual(expect.arrayContaining(["Researching", "Task complete"]));
    // Nothing engine-specific reaches client-facing text.
    for (const e of events) if (e.clientText) expect(leaksRuntime(e.clientText)).toBe(false);
  });

  it("idempotent: the same key never starts a second run", async () => {
    const a = await startRun(r, ops, { botId: bot.id, task: "Research again", idempotencyKey: "staging-chain-0002" });
    const b = await startRun(r, ops, { botId: bot.id, task: "Research again", idempotencyKey: "staging-chain-0002" });
    expect(b.id).toBe(a.id);
    expect([...fake.runs.values()].filter((x) => x.input === "Research again")).toHaveLength(1);
  });

  it("human approval: the run parks, the operator approves, the run completes", async () => {
    let run = await startRun(r, ops, { botId: bot.id, task: "Send the follow-up email to the customer", idempotencyKey: "staging-chain-0003" });
    fake.advance(run.runtimeRunId!);
    run = await syncRun(r, run.id);
    expect(run.status).toBe("waiting_for_approval");
    const approval = (await r.list("approvals", { orgId: org.id })).find((a) => a.runId === run.id)!;
    expect(approval.status).toBe("pending");
    expect(approval.runtimeApprovalId).toBeTruthy();

    await resolveApproval(r, ops, approval.id, "approve");
    expect(fake.runs.get(run.runtimeRunId!)?.decided).toBe("once");
    fake.advance(run.runtimeRunId!);
    run = await syncRun(r, run.id);
    expect(run.status).toBe("completed");
  });

  it("a wrong Bot key is refused by the engine and surfaced as a sanitized error", async () => {
    process.env.RUNTIME_DEV_TARGETS = JSON.stringify({ [runtime.id]: { baseUrl: fake.url, keys: { seo: "wrong-key-0123456789", default: fake.keys.default } } });
    const run = await startRun(r, ops, { botId: bot.id, task: "Research with a bad key", idempotencyKey: "staging-chain-0004" });
    expect(run.status).toBe("failed");
    const events = await r.list("run_events", { orgId: org.id, where: { runId: run.id } });
    expect(events[0].clientText).toBe("Bot temporarily unavailable.");
    process.env.RUNTIME_DEV_TARGETS = JSON.stringify({ [runtime.id]: { baseUrl: fake.url, keys: fake.keys } });
  });
});

vi.mock("@/server/security/release-gates", () => ({ requireExecutionRelease: () => {} }));
