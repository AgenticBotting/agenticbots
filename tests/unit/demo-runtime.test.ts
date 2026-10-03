import { describe, it, expect } from "vitest";
import { DemoRuntimeAdapter, demoState } from "@/server/runtime/demo/adapter";
import { wait } from "../support/fixtures";

const t = { runtimeId: "rt-demo", profile: "outbound", baseUrl: "demo://", apiKey: "demo", extraHeaders: {} };

describe("DemoRuntimeAdapter", () => {
  const a = new DemoRuntimeAdapter();
  it("is idempotent per key", async () => {
    const one = await a.startBotRun(t, { task: "Research prospects", idempotencyKey: "k-0001-aaaa", correlationId: "c" });
    const two = await a.startBotRun(t, { task: "Research prospects", idempotencyKey: "k-0001-aaaa", correlationId: "c" });
    expect(two).toEqual({ runtimeRunId: one.runtimeRunId, replayed: true });
  });
  it("parks write tasks for approval, resumes when approved", async () => {
    const { runtimeRunId } = await a.startBotRun(t, { task: "Send follow-up emails", idempotencyKey: "k-0002-bbbb", correlationId: "c" });
    demoState().runs.get(runtimeRunId)!.startedAt -= 8000;
    expect((await a.getRun(t, runtimeRunId)).status).toBe("waiting_for_approval");
    await a.approveRun(t, runtimeRunId);
    demoState().runs.get(runtimeRunId)!.approvalAt! -= 3000;
    expect((await a.getRun(t, runtimeRunId)).status).toBe("completed");
  });
  it("a stopped runtime refuses work (suspension)", async () => {
    demoState().stopped.add("rt-stopped");
    await expect(a.startBotRun({ ...t, runtimeId: "rt-stopped" }, { task: "x y z", idempotencyKey: "k-0003-cccc", correlationId: "c" })).rejects.toMatchObject({ code: "runtime_unreachable" });
    await wait(1);
  });
});
