import { repo } from "@/server/db";
import { currentActor } from "@/server/auth/session";
import { can } from "@/server/auth/policy";
import { pumpRun, isTerminal } from "@/server/services/runs";
import { clientSafe } from "@/server/redact";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/runs/:runId/events — reconnectable Server-Sent Events.
 *
 * Each connection streams for ~25s then closes; EventSource reconnects with
 * Last-Event-ID, so a reload, a dropped network or a serverless timeout
 * never loses events and never touches the run itself (it keeps going on
 * the runtime). Operators receive operator lines; clients receive only
 * client-safe lines for runs in their own organization.
 */
export async function GET(req: Request, ctx: { params: Promise<{ runId: string }> }) {
  const actor = await currentActor();
  if (!actor) return new Response("Unauthorized", { status: 401 });
  const { runId } = await ctx.params;
  const r = await repo();
  const run = await r.get("runs", runId);
  const operator = !!run && can(actor, "ops.view", run.orgId);
  const client = !!run && can(actor, "portal.view", run.orgId);
  if (!run || (!operator && !client)) return new Response("Not found", { status: 404 });

  const lastId = Number(req.headers.get("last-event-id") ?? new URL(req.url).searchParams.get("after") ?? "0") || 0;
  const encoder = new TextEncoder();
  const deadline = Date.now() + 25_000;

  const stream = new ReadableStream({
    async start(controller) {
      let cursor = lastId;
      let closed = false;
      const send = (chunk: string) => {
        if (!closed) controller.enqueue(encoder.encode(chunk));
      };
      req.signal.addEventListener("abort", () => {
        closed = true;
      });
      send("retry: 2000\n\n");
      while (!closed && Date.now() < deadline) {
        let current;
        try {
          current = await pumpRun(r, runId, 4000, req.signal);
        } catch {
          current = await r.get("runs", runId);
        }
        const events = (await r.list("run_events", { orgId: run.orgId, where: { runId }, order: "asc" })).filter((e) => e.seq > cursor);
        for (const e of events) {
          cursor = e.seq;
          const text = operator ? e.operatorText : e.clientText ? clientSafe(e.clientText, 160) : undefined;
          if (!text) continue;
          send(`id: ${e.seq}\nevent: run-event\ndata: ${JSON.stringify({ seq: e.seq, at: e.at, kind: e.kind, text })}\n\n`);
        }
        if (current) {
          send(`event: status\ndata: ${JSON.stringify({ status: current.status, approvalState: current.approvalState })}\n\n`);
          if (isTerminal(current.status)) {
            send(`event: done\ndata: {}\n\n`);
            break;
          }
        }
        await new Promise((res) => setTimeout(res, 1500));
      }
      closed = true;
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
