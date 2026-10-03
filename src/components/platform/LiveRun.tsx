"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { timeOnly } from "@/lib/platform/format";

interface Line {
  seq: number;
  at: string;
  kind: string;
  text: string;
}

/**
 * Live run timeline. Subscribes to the run's event stream, appends lines
 * as they arrive and refreshes the page when the run's status changes.
 * Reloading or leaving the page never affects the run itself.
 */
export function LiveRun({ runId, initial, active }: { runId: string; initial: Line[]; active: boolean }) {
  const [lines, setLines] = useState<Line[]>(initial);
  const [state, setState] = useState<"live" | "reconnecting" | "done">(active ? "live" : "done");
  const router = useRouter();
  const lastStatus = useRef<string | null>(null);
  const after = initial.length ? initial[initial.length - 1].seq : 0;

  useEffect(() => {
    if (!active) return;
    const es = new EventSource(`/api/runs/${runId}/events?after=${after}`);
    es.addEventListener("run-event", (ev) => {
      const line = JSON.parse((ev as MessageEvent).data) as Line;
      setLines((prev) => (prev.some((p) => p.seq === line.seq) ? prev : [...prev, line]));
      setState("live");
    });
    es.addEventListener("status", (ev) => {
      const { status, approvalState } = JSON.parse((ev as MessageEvent).data) as { status: string; approvalState: string };
      const key = `${status}:${approvalState}`;
      if (lastStatus.current && lastStatus.current !== key) router.refresh();
      lastStatus.current = key;
    });
    es.addEventListener("done", () => {
      setState("done");
      es.close();
      router.refresh();
    });
    es.onerror = () => setState((s) => (s === "done" ? s : "reconnecting"));
    return () => es.close();
  }, [runId, active, after, router]);

  return (
    <div>
      {active && (
        <div className="pf-small mb-2" role="status" aria-live="polite">
          <span className={`pf-status ${state === "live" ? "live" : state === "done" ? "good" : "watch"}`}>
            {state === "live" ? "Live" : state === "done" ? "Finished" : "Reconnecting…"}
          </span>
        </div>
      )}
      <ol className="pf-timeline" aria-live="polite">
        {lines.length === 0 && <li><span /><span className="pf-muted">{active ? "Waiting for the first event…" : "No step-by-step events were recorded for this run."}</span></li>}
        {lines.map((l) => (
          <li key={l.seq}>
            <time dateTime={l.at}>{timeOnly(l.at)}</time>
            <span className={l.kind === "error" ? "err" : undefined}>{l.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
