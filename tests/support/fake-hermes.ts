import { createServer, type IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";

/**
 * In-process fake of the Hermes API server (pinned v2026.9.24 surface used
 * by AgenticBots). Only Hermes-specific tests import this file.
 *
 * Runs do not progress on their own: call `advance(runId)` to move one step
 * (queued → completed, or → waiting_for_approval for write tasks, then →
 * completed once approved/denied).
 */
type J = Record<string, unknown>;

interface FakeRun {
  id: string;
  profile: string;
  input: string;
  status: string;
  approval?: { request_id: string; description: string; command: string };
  decided?: "once" | "deny";
  events: J[];
  output?: string;
}

export interface FakeHermes {
  url: string;
  keys: Record<string, string>;
  runs: Map<string, FakeRun>;
  /** Profiles whose gateway is stopped (Bot disabled). */
  parked: Set<string>;
  advance(runId: string): void;
  close(): Promise<void>;
}

const WRITE = /\b(send|email|publish)\b/i;

export async function startFakeHermes(keys: Record<string, string> = { seo: "key-seo", default: "key-default" }): Promise<FakeHermes> {
  const runs = new Map<string, FakeRun>();
  const byIdem = new Map<string, string>();
  const sessions = new Map<string, { id: string; title: string; profile: string }>();
  const jobs = new Map<string, J & { profile: string }>();
  const parked = new Set<string>();
  let seq = 0;
  const now = () => Math.floor(Date.now() / 1000);
  const push = (r: FakeRun, e: J) => r.events.push({ ...e, run_id: r.id, timestamp: now() });

  function advance(runId: string) {
    const r = runs.get(runId);
    if (!r) return;
    if (r.status === "started") {
      push(r, { event: "run.started" });
      push(r, { event: "tool.started", tool: "web_search", preview: "local roofers" });
      push(r, { event: "tool.completed", tool: "web_search", duration: 0.4, error: false });
      if (WRITE.test(r.input)) {
        r.status = "waiting_for_approval";
        r.approval = { request_id: `req_${r.id}`, description: "Send the prepared email", command: "send_email to=customer" };
        push(r, { event: "approval.request", request_id: r.approval.request_id, description: r.approval.description });
        return;
      }
      r.status = "completed";
    } else if (r.status === "waiting_for_approval" && r.decided) {
      push(r, { event: "approval.responded", choice: r.decided });
      r.approval = undefined;
      r.status = "completed";
    } else return;
    r.output = r.decided === "deny" ? "Stopped before sending." : "Done.";
    push(r, { event: "run.completed", output: r.output, usage: { input_tokens: 120, output_tokens: 40 } });
  }

  const server = createServer(async (req, res) => {
    const u = new URL(req.url ?? "/", "http://x");
    let path = u.pathname;
    let profile = "default";
    const m = path.match(/^\/p\/([^/]+)(\/.*)$/);
    if (m) {
      profile = decodeURIComponent(m[1]);
      path = m[2];
    }
    const send = (status: number, body?: unknown, headers: Record<string, string> = {}) => {
      res.writeHead(status, { "content-type": "application/json", ...headers });
      res.end(body === undefined ? "" : JSON.stringify(body));
    };
    if (path === "/health") return send(200, { status: "ok" });
    if (path === "/health/detailed") {
      const active = [...runs.values()].filter((r) => ["started", "waiting_for_approval"].includes(r.status)).length;
      return send(200, { status: "ok", readiness: { checks: { config: { status: "ok" }, state_db: { status: "ok" } }, active_runs: active } });
    }
    if (!(profile in keys) || parked.has(profile)) return send(404, { error: { message: "unknown profile" } });
    if (req.headers.authorization !== `Bearer ${keys[profile]}`) return send(401, { error: { message: "invalid api key" } });

    const body = await readBody(req);
    const method = req.method ?? "GET";
    let mm: RegExpMatchArray | null;

    if (path === "/v1/models") return send(200, { object: "list", data: [{ id: "hermes-agent" }] });
    if (path === "/v1/capabilities") {
      return send(200, {
        version: "v2026.9.24",
        features: { run_submission: true, run_status: true, run_events_sse: true, run_stop: true, session_create: true },
        endpoints: { run_approval: "/v1/runs/{id}/approval", skills: "/v1/skills", toolsets: "/v1/toolsets" },
      });
    }
    if (path === "/v1/skills") return send(200, { skills: [{ name: "local-seo-audit", description: "Audit", category: "agenticbots" }] });
    if (path === "/v1/toolsets") return send(200, { toolsets: [{ name: "web", label: "Web", enabled: true, tools: ["web_search"] }] });

    if (path === "/v1/runs" && method === "POST") {
      const idem = String(req.headers["idempotency-key"] ?? "");
      const prior = idem && byIdem.get(`${profile}:${idem}`);
      if (prior) return send(202, { run_id: prior, status: runs.get(prior)!.status }, { "Idempotency-Replayed": "true" });
      const id = `run_${++seq}`;
      const r: FakeRun = { id, profile, input: String(body.input ?? ""), status: "started", events: [] };
      push(r, { event: "run.queued" });
      runs.set(id, r);
      if (idem) byIdem.set(`${profile}:${idem}`, id);
      return send(202, { run_id: id, status: "started" });
    }
    if ((mm = path.match(/^\/v1\/runs\/([^/]+)(\/[a-z]+)?$/))) {
      const r = runs.get(decodeURIComponent(mm[1]));
      if (!r || r.profile !== profile) return send(404, { error: { message: "run not found" } });
      const sub = mm[2];
      if (!sub && method === "GET") {
        return send(200, { object: "hermes.run", run_id: r.id, status: r.status, output: r.output, approval: r.approval, usage: r.status === "completed" ? { input_tokens: 120, output_tokens: 40 } : undefined, runtime: { provider: "openai", model: "gpt-x" } });
      }
      if (sub === "/stop" && method === "POST") {
        if (!["completed", "cancelled"].includes(r.status)) {
          r.status = "cancelled";
          push(r, { event: "run.cancelled" });
        }
        return send(200, { run_id: r.id, status: r.status });
      }
      if (sub === "/approval" && method === "POST") {
        if (r.status !== "waiting_for_approval") return send(409, { error: { message: "no pending approval" } });
        if (body.request_id && body.request_id !== r.approval?.request_id) return send(404, { error: { message: "unknown request" } });
        r.decided = body.choice === "deny" ? "deny" : "once";
        return send(200, { object: "hermes.run.approval_response", choice: r.decided });
      }
      if (sub === "/events" && method === "GET") {
        res.writeHead(200, { "content-type": "text/event-stream" });
        res.write(": keepalive\n\n");
        for (const e of r.events) res.write(`data: ${JSON.stringify(e)}\n\n`);
        res.end();
        return;
      }
    }
    if (path === "/api/sessions" && method === "GET") return send(200, { sessions: [...sessions.values()].filter((s) => s.profile === profile) });
    if (path === "/api/sessions" && method === "POST") {
      const s = { id: `sess_${++seq}`, title: String(body.title ?? ""), profile };
      sessions.set(s.id, s);
      return send(201, { session: s });
    }
    if ((mm = path.match(/^\/api\/sessions\/([^/]+)(\/messages)?$/))) {
      const s = sessions.get(decodeURIComponent(mm[1]));
      if (!s || s.profile !== profile) return send(404, { error: "session not found" });
      return mm[2] ? send(200, { messages: [{ role: "user", content: "hi", timestamp: now() }, { role: "tool", content: "x" }] }) : send(200, { session: s });
    }
    if (path === "/api/jobs" && method === "GET") return send(200, { jobs: [...jobs.values()].filter((j) => j.profile === profile) });
    if (path === "/api/jobs" && method === "POST") {
      const j = { id: `job_${++seq}`, name: body.name, schedule: { expr: body.schedule, display: String(body.schedule) }, enabled: true, state: "scheduled", profile };
      jobs.set(j.id, j);
      return send(201, { job: j });
    }
    if ((mm = path.match(/^\/api\/jobs\/([^/]+)(\/(pause|resume|run))?$/))) {
      const j = jobs.get(decodeURIComponent(mm[1]));
      if (!j || j.profile !== profile) return send(404, { error: "job not found" });
      if (method === "DELETE") {
        jobs.delete(String(j.id));
        return send(200, { ok: true });
      }
      if (method === "PATCH") {
        if (body.name) j.name = body.name;
        if (body.schedule) j.schedule = { expr: body.schedule, display: String(body.schedule) };
        return send(200, { job: j });
      }
      if (mm[3] === "pause") { j.enabled = false; j.state = "paused"; }
      if (mm[3] === "resume") { j.enabled = true; j.state = "scheduled"; }
      if (mm[3] === "run") { j.last_run_at = now(); j.last_status = "ok"; }
      return send(200, { job: j });
    }
    send(404, { error: "no route" });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    keys,
    runs,
    parked,
    advance,
    close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(() => r()); }),
  };
}

async function readBody(req: IncomingMessage): Promise<J> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as J;
  } catch {
    return {};
  }
}

