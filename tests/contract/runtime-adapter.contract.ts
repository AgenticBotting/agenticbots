import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { RuntimeAdapter } from "@/server/runtime/RuntimeAdapter";
import { BOT_EVENT_TYPES, type BotRunEvent, type RuntimeConnection } from "@/server/runtime/runtime-types";
import { RunNotFoundError, RuntimeError, RuntimeUnavailableError } from "@/server/runtime/runtime-errors";

/**
 * The RuntimeAdapter contract: what AgenticBots relies on from ANY runtime.
 * Every adapter must pass this suite unchanged. It speaks only AgenticBots
 * vocabulary — no engine names, URLs, payloads or status strings.
 */
export interface ContractHarness {
  adapter: RuntimeAdapter;
  /** A working connection for one Bot. */
  bot: RuntimeConnection;
  /** A connection whose runtime cannot be reached. */
  unreachable: RuntimeConnection;
  /** Move a Run forward one step (the runtime's own pace, made instant). */
  advance(runtimeRunId: string): Promise<void>;
  teardown?(): Promise<void>;
}

const READ_TASK = "Research roofing contractors in Naples";
const WRITE_TASK = "Send the follow-up email to the customer";

export function describeRuntimeAdapterContract(name: string, makeHarness: () => Promise<ContractHarness>) {
  describe(`RuntimeAdapter contract: ${name}`, () => {
    let h: ContractHarness;
    let n = 0;
    const key = () => `contract-${name}-${Date.now()}-${++n}`;
    const start = (task: string, idempotencyKey = key()) => h.adapter.startBotRun(h.bot, { task, idempotencyKey, correlationId: "cor_contract" });

    beforeAll(async () => {
      h = await makeHarness();
    });
    afterAll(async () => {
      await h?.teardown?.();
    });

    it("connects and reports health", async () => {
      const basic = await h.adapter.getHealth(h.bot);
      expect(basic.status).toBe("healthy");
      expect(basic.ready).toBe(true);
      const detailed = await h.adapter.getDetailedHealth(h.bot);
      expect(["healthy", "degraded"]).toContain(detailed.status);
      expect(Array.isArray(detailed.checks)).toBe(true);
    });

    it("reports the Bot and discovers capabilities", async () => {
      const bot = await h.adapter.getBot(h.bot);
      expect(bot.runtimeProfile).toBe(h.bot.runtimeProfile);
      expect(["active", "working", "idle"]).toContain(bot.status);
      const listed = await h.adapter.listBots(h.bot, [h.bot.runtimeProfile!]);
      expect(listed).toHaveLength(1);
      const caps = await h.adapter.getBotCapabilities(h.bot);
      expect(caps).toMatchObject({ runs: true, runEvents: true, runStop: true, runApproval: true });
      expect(caps.eventReplay).toBe(h.adapter.traits.eventReplay);
    });

    it("discovers Skills and toolsets", async () => {
      const skills = await h.adapter.listBotSkills(h.bot);
      expect(skills.length).toBeGreaterThan(0);
      expect(typeof skills[0].name).toBe("string");
      expect(Array.isArray(await h.adapter.listBotToolsets(h.bot))).toBe(true);
    });

    it("starts a Bot Run idempotently and reads it to completion", async () => {
      const idem = key();
      const first = await start(READ_TASK, idem);
      expect(first.runtimeRunId).toBeTruthy();
      expect(first.replayed).toBe(false);
      const again = await start(READ_TASK, idem);
      expect(again).toEqual({ runtimeRunId: first.runtimeRunId, replayed: true });

      expect(["queued", "running"]).toContain((await h.adapter.getBotRun(h.bot, first.runtimeRunId)).status);
      await h.advance(first.runtimeRunId);
      const done = await h.adapter.getBotRun(h.bot, first.runtimeRunId);
      expect(done.status).toBe("completed");
      expect(done.output).toBeTruthy();
      expect(done.usage?.inputTokens ?? 0).toBeGreaterThan(0);
    });

    it("delivers normalized events", async () => {
      const { runtimeRunId } = await start(READ_TASK);
      await h.advance(runtimeRunId);
      const events: BotRunEvent[] = [];
      for await (const e of h.adapter.streamBotRunEvents(h.bot, runtimeRunId, AbortSignal.timeout(10_000))) events.push(e);
      const types = events.map((e) => e.type);
      for (const t of types) expect(BOT_EVENT_TYPES).toContain(t);
      expect(types).toContain("bot.action.started");
      expect(types).toContain("bot.action.completed");
      expect(types.at(-1)).toBe("bot.run.completed");
      const action = events.find((e) => e.type === "bot.action.started")!;
      expect(action.action).toBeTruthy();
      for (const e of events) {
        expect(typeof e.sourceEvent).toBe("string");
        expect(Number.isNaN(Date.parse(e.at))).toBe(false);
      }
    });

    it("event replay matches the adapter's declared trait", async () => {
      const { runtimeRunId } = await start(READ_TASK);
      if (h.adapter.traits.eventReplay) {
        expect((await h.adapter.listBotRunEvents(h.bot, runtimeRunId)).length).toBeGreaterThan(0);
      } else {
        await expect(h.adapter.listBotRunEvents(h.bot, runtimeRunId)).rejects.toMatchObject({ code: "capability_unavailable" });
      }
    });

    it("stops a Bot Run", async () => {
      const { runtimeRunId } = await start(READ_TASK);
      await h.adapter.stopBotRun(h.bot, runtimeRunId);
      expect((await h.adapter.getBotRun(h.bot, runtimeRunId)).status).toBe("cancelled");
    });

    it("pauses write actions for approval and resumes when approved", async () => {
      const { runtimeRunId } = await start(WRITE_TASK);
      await h.advance(runtimeRunId);
      const waiting = await h.adapter.getBotRun(h.bot, runtimeRunId);
      expect(waiting.status).toBe("waiting_for_approval");
      expect(waiting.pendingApproval?.description).toBeTruthy();
      await h.adapter.approveBotRun(h.bot, runtimeRunId, waiting.pendingApproval?.approvalId);
      await h.advance(runtimeRunId);
      expect((await h.adapter.getBotRun(h.bot, runtimeRunId)).status).toBe("completed");
    });

    it("a denied approval does not carry out the action", async () => {
      const { runtimeRunId } = await start(WRITE_TASK);
      await h.advance(runtimeRunId);
      const waiting = await h.adapter.getBotRun(h.bot, runtimeRunId);
      await h.adapter.denyBotRun(h.bot, runtimeRunId, waiting.pendingApproval?.approvalId);
      await h.advance(runtimeRunId);
      const end = await h.adapter.getBotRun(h.bot, runtimeRunId);
      expect(end.status).toBe("completed");
      expect(end.pendingApproval).toBeUndefined();
    });

    it("creates and reads a Conversation", async () => {
      const c = await h.adapter.createConversation(h.bot, "Contract conversation");
      expect(c.runtimeConversationId).toBeTruthy();
      const read = await h.adapter.getConversation(h.bot, c.runtimeConversationId);
      expect(read.runtimeConversationId).toBe(c.runtimeConversationId);
      expect(Array.isArray(read.messages)).toBe(true);
      for (const m of read.messages ?? []) expect(["user", "assistant"]).toContain(m.role);
      const all = await h.adapter.listConversations(h.bot);
      expect(all.some((x) => x.runtimeConversationId === c.runtimeConversationId)).toBe(true);
    });

    it("manages Automations", async () => {
      const a = await h.adapter.createAutomation(h.bot, { name: "Weekly crawl", prompt: "Crawl the site", schedule: "0 6 * * 1" });
      expect(a.runtimeAutomationId).toBeTruthy();
      expect(a.status).toBe("active");
      const id = a.runtimeAutomationId;
      expect((await h.adapter.listAutomations(h.bot)).some((x) => x.runtimeAutomationId === id)).toBe(true);
      const updated = await h.adapter.updateAutomation(h.bot, id, { name: "Weekly crawl v2" });
      expect(updated.name).toBe("Weekly crawl v2");
      await h.adapter.pauseAutomation(h.bot, id);
      expect((await h.adapter.listAutomations(h.bot)).find((x) => x.runtimeAutomationId === id)?.status).toBe("paused");
      await h.adapter.resumeAutomation(h.bot, id);
      await h.adapter.runAutomationNow(h.bot, id);
      const after = (await h.adapter.listAutomations(h.bot)).find((x) => x.runtimeAutomationId === id);
      expect(after?.status).toBe("active");
      expect(after?.lastResult).toBe("succeeded");
      await h.adapter.deleteAutomation(h.bot, id);
      expect((await h.adapter.listAutomations(h.bot)).some((x) => x.runtimeAutomationId === id)).toBe(false);
    });

    it("raises normalized errors", async () => {
      const missing = h.adapter.getBotRun(h.bot, "does-not-exist");
      await expect(missing).rejects.toBeInstanceOf(RunNotFoundError);
      const down = h.adapter.startBotRun(h.unreachable, { task: READ_TASK, idempotencyKey: key(), correlationId: "c" });
      await expect(down).rejects.toBeInstanceOf(RuntimeUnavailableError);
      // Nothing engine-shaped leaks through the error message.
      const err = await h.adapter.getBotRun(h.bot, "does-not-exist").catch((e) => e);
      expect(err).toBeInstanceOf(RuntimeError);
      expect(String(err.message)).not.toMatch(/Traceback|at \S+ \(/);
    });
  });
}
