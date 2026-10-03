import { describe, it, expect } from "vitest";
import { HermesRuntimeAdapter } from "@/server/runtime/hermes/HermesRuntimeAdapter";
import type { RuntimeConnection } from "@/server/runtime/runtime-types";

/**
 * Live, NON-DESTRUCTIVE contract test against a real runtime. Catches
 * upstream API changes before an upgrade reaches clients.
 *
 *   HERMES_CONTRACT_URL=https://staging-x.runtime.agenticbots.dev \
 *   HERMES_CONTRACT_KEY=<profile key> HERMES_CONTRACT_PROFILE=seo \
 *   [HERMES_CONTRACT_ACCESS_ID=… HERMES_CONTRACT_ACCESS_SECRET=…] \
 *   npm run test:hermes-contract
 *
 * Skipped unless configured. Use a staging runtime — the run it starts is a
 * harmless one-line question with no tools.
 */
const url = process.env.HERMES_CONTRACT_URL;
const key = process.env.HERMES_CONTRACT_KEY;
const configured = !!url && !!key;

const target: RuntimeConnection = {
  provider: "hermes",
  runtimeId: "contract",
  runtimeProfile: process.env.HERMES_CONTRACT_PROFILE,
  endpoint: url ?? "",
  credentials: {
    apiKey: key ?? "",
    accessClientId: process.env.HERMES_CONTRACT_ACCESS_ID,
    accessClientSecret: process.env.HERMES_CONTRACT_ACCESS_SECRET,
  },
};

describe.skipIf(!configured)("runtime contract (live)", () => {
  const a = new HermesRuntimeAdapter();
  it("health + detailed health", async () => {
    expect((await a.getHealth(target)).status).toBe("healthy");
    const d = await a.getDetailedHealth(target);
    expect(["healthy", "degraded"]).toContain(d.status);
  });
  it("capabilities advertise the features AgenticBots relies on", async () => {
    const c = await a.getBotCapabilities(target);
    expect(c).toMatchObject({ runs: true, runEvents: true, runStop: true });
  });
  it("conversation create + read", async () => {
    const c = await a.createConversation(target, "agenticbots contract test");
    expect(c.runtimeConversationId).toBeTruthy();
    expect((await a.getConversation(target, c.runtimeConversationId)).runtimeConversationId).toBe(c.runtimeConversationId);
  });
  it("run → completion, idempotent replay", async () => {
    const key = `contract-${Date.now()}`;
    const input = { task: "Reply with the single word OK. Do not use any tools.", idempotencyKey: key, correlationId: "cor_contract" };
    const first = await a.startBotRun(target, input);
    const replay = await a.startBotRun(target, input);
    expect(replay.runtimeRunId).toBe(first.runtimeRunId);
    expect(replay.replayed).toBe(true);
    let state = await a.getBotRun(target, first.runtimeRunId);
    for (let i = 0; i < 60 && ["queued", "running"].includes(state.status); i++) {
      await new Promise((r) => setTimeout(r, 2000));
      state = await a.getBotRun(target, first.runtimeRunId);
    }
    expect(state.status).toBe("completed");
    expect(state.usage?.inputTokens ?? 0).toBeGreaterThan(0);
  });
  it("jobs, skills and toolsets list", async () => {
    expect(Array.isArray(await a.listAutomations(target))).toBe(true);
    expect(Array.isArray(await a.listBotSkills(target))).toBe(true);
    expect(Array.isArray(await a.listBotToolsets(target))).toBe(true);
  });
});

describe.skipIf(configured)("runtime contract", () => {
  it("skipped — set HERMES_CONTRACT_URL and HERMES_CONTRACT_KEY to run", () => {
    expect(true).toBe(true);
  });
});
