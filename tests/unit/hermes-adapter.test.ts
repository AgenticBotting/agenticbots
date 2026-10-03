import { describe, it, expect, vi, afterEach } from "vitest";
import { HermesRuntimeAdapter, mapEvent, mapRunStatus, mapUsage } from "@/server/runtime/hermes/adapter";
import type { RuntimeTarget } from "@/server/runtime/adapter";

const target: RuntimeTarget = {
  runtimeId: "rt1", profile: "seo", baseUrl: "https://acme.runtime.agenticbots.dev", apiKey: "k".repeat(64),
  extraHeaders: { "CF-Access-Client-Id": "cid", "CF-Access-Client-Secret": "csecret" },
};

function mockFetch(handler: (url: string, init: RequestInit) => { status?: number; body?: unknown; headers?: Record<string, string> }) {
  const calls: { url: string; init: RequestInit }[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const r = handler(url, init);
    return new Response(r.body === undefined ? "" : JSON.stringify(r.body), { status: r.status ?? 200, headers: r.headers });
  }));
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

describe("HermesRuntimeAdapter (pinned v2026.9.24 contract)", () => {
  const a = new HermesRuntimeAdapter();

  it("routes per-profile through /p/<profile>/ with that profile's bearer key and tunnel headers", async () => {
    const calls = mockFetch(() => ({ status: 202, body: { run_id: "run_abc", status: "started" } }));
    await a.startBotRun(target, { task: "Research", idempotencyKey: "idem-12345678", correlationId: "cor_x", provider: "anthropic", model: "m", reasoning: "high" });
    expect(calls[0].url).toBe("https://acme.runtime.agenticbots.dev/p/seo/v1/runs");
    const h = calls[0].init.headers as Record<string, string>;
    expect(h.Authorization).toBe(`Bearer ${"k".repeat(64)}`);
    expect(h["Idempotency-Key"]).toBe("idem-12345678");
    expect(h["CF-Access-Client-Id"]).toBe("cid");
    expect(JSON.parse(String(calls[0].init.body))).toMatchObject({ input: "Research", provider: "anthropic", model: "m", model_options: { reasoning_effort: "high" } });
  });

  it("reports idempotent replays", async () => {
    mockFetch(() => ({ status: 202, body: { run_id: "run_abc" }, headers: { "Idempotency-Replayed": "true" } }));
    expect(await a.startBotRun(target, { task: "x", idempotencyKey: "idem-12345678", correlationId: "c" })).toEqual({ runtimeRunId: "run_abc", replayed: true });
  });

  it("maps run status, usage, served runtime and pending approval", async () => {
    mockFetch(() => ({ body: {
      object: "hermes.run", run_id: "run_abc", status: "waiting_for_approval", usage: { input_tokens: 50, output_tokens: 200, cache_read_tokens: 40, cache_write_tokens: 0 },
      runtime: { provider: "openai", model: "gpt-5", route_source: "global" }, approval: { request_id: "req1", description: "Send email", command: "send_email to=x" },
    } }));
    const s = await a.getRun(target, "run_abc");
    expect(s).toMatchObject({ status: "waiting_for_approval", provider: "openai", model: "gpt-5", usage: { inputTokens: 50, outputTokens: 200, cacheReadTokens: 40, cacheWriteTokens: 0 }, pendingApproval: { requestId: "req1", description: "Send email" } });
  });

  it("approval uses choice=once / deny with the request id", async () => {
    const calls = mockFetch(() => ({ body: { object: "hermes.run.approval_response" } }));
    await a.approveRun(target, "run_abc", "req1");
    await a.denyRun(target, "run_abc");
    expect(calls[0].url).toMatch(/\/p\/seo\/v1\/runs\/run_abc\/approval$/);
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ choice: "once", request_id: "req1" });
    expect(JSON.parse(String(calls[1].init.body))).toEqual({ choice: "deny" });
  });

  it("maps HTTP failures to typed, sanitizable errors", async () => {
    mockFetch(() => ({ status: 401, body: { error: "bad key" } }));
    await expect(a.getRun(target, "x")).rejects.toMatchObject({ code: "runtime_auth" });
    mockFetch(() => ({ status: 429, body: { error: "Too many concurrent runs (max 4)" } }));
    await expect(a.getRun(target, "x")).rejects.toMatchObject({ code: "runtime_overloaded", retryable: true });
  });

  it("discovers capabilities instead of assuming them", async () => {
    mockFetch(() => ({ body: { features: { run_submission: true, run_status: true, run_events_sse: true, run_stop: true, reasoning_streaming: true, session_create: true }, endpoints: { run_approval: "/v1/runs/{id}/approval", skills: "/v1/skills" } } }));
    const c = await a.getCapabilities(target);
    expect(c).toMatchObject({ runs: true, runEvents: true, runStop: true, runApproval: true, conversations: true, skills: true });
  });

  it("parses SSE, skipping keepalive comments", async () => {
    const sse = ": keepalive\n\ndata: {\"event\":\"run.started\",\"run_id\":\"r\",\"timestamp\":1700000000}\n\n: keepalive\n\ndata: {\"event\":\"tool.started\",\"tool\":\"web_search\",\"preview\":\"roofers\"}\n\ndata: {\"event\":\"run.completed\",\"output\":\"done\"}\n\n";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(sse, { status: 200, headers: { "content-type": "text/event-stream" } })));
    const types: string[] = [];
    for await (const e of a.streamRunEvents(target, "r")) types.push(e.type);
    expect(types).toEqual(["run.started", "action.started", "run.completed"]);
  });

  it("maps status and events defensively", () => {
    expect(mapRunStatus("stopping")).toBe("running");
    expect(mapRunStatus("interrupted")).toBe("interrupted");
    expect(mapEvent({ event: "tool.failed", tool: "terminal" })).toMatchObject({ type: "action.completed", error: true });
    expect(mapEvent({ event: "approval.request", request_id: "q", description: "x" })).toMatchObject({ type: "approval.requested", approval: { requestId: "q" } });
    expect(mapUsage({ prompt_tokens: 3, completion_tokens: 4 })).toMatchObject({ inputTokens: 3, outputTokens: 4 });
  });

  it("jobs map to automations", async () => {
    mockFetch(() => ({ body: { jobs: [{ id: "j1", name: "Daily", schedule: { expr: "0 7 * * 1-5", display: "weekdays 7am" }, enabled: true, state: "scheduled", last_status: "error", last_error: "boom" }] } }));
    const jobs = await a.listAutomations(target);
    expect(jobs[0]).toMatchObject({ runtimeJobId: "j1", schedule: "0 7 * * 1-5", enabled: true, lastStatus: "failed", lastError: "boom" });
  });
});
