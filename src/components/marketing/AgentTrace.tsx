"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

/**
 * The recorded agent trace — a timed, scrubbable replay of one real
 * unit of work: tool calls and reasoning visible (Phase 5 hero asset).
 *
 * Deliberately a recording, not a live API call: same persuasion,
 * none of the latency lottery or prompt-injection surface.
 * `prefers-reduced-motion` renders the full trace statically.
 */

type Step = {
  t: number; // seconds from start
  kind: "event" | "reasoning" | "tool" | "result";
  label: string;
  detail?: string;
};

const TRACE: Step[] = [
  { t: 0.0,  kind: "event",     label: "inbound.missed_call", detail: "+1 ••• ••• 8214 · 2 rings · 8:42:01 pm" },
  { t: 0.8,  kind: "reasoning", label: "Caller is not in the CRM. Number matches the Google Ads call extension — this is a paid lead. Response SLA applies." },
  { t: 1.9,  kind: "tool",      label: "crm.search", detail: "phone: •••8214 → no match" },
  { t: 2.7,  kind: "tool",      label: "sms.send", detail: "“Hi — you just called about roof repair. What's going on with the roof?”" },
  { t: 4.2,  kind: "event",     label: "sms.reply", detail: "“leak over the garage, getting worse when it rains”" },
  { t: 5.0,  kind: "reasoning", label: "Active leak = urgency high. Qualify service area, then offer the two earliest slots rather than asking an open question." },
  { t: 6.1,  kind: "tool",      label: "sms.send", detail: "“We can help. What's the property zip?”" },
  { t: 7.4,  kind: "event",     label: "sms.reply", detail: "“33140”" },
  { t: 8.0,  kind: "tool",      label: "coverage.check", detail: "33140 → in service area · crew 2" },
  { t: 8.8,  kind: "tool",      label: "calendar.query", detail: "crew 2, next 48h → Thu 10:00, Thu 15:30" },
  { t: 9.6,  kind: "tool",      label: "sms.send", detail: "“We can be out Thursday 10am or 3:30pm — which works?”" },
  { t: 11.2, kind: "event",     label: "sms.reply", detail: "“10 works”" },
  { t: 12.0, kind: "tool",      label: "calendar.book", detail: "Thu 10:00 · confirmed · reminder scheduled" },
  { t: 12.8, kind: "tool",      label: "crm.create", detail: "lead → Estimates · assigned Marco · transcript attached" },
  { t: 13.6, kind: "result",    label: "Booked in 2m 12s of real time. No human touched it.", detail: "Escalation rules held: pricing was never quoted — that's Marco's call." },
];

const DURATION = 14.2;
const SPEED_LABEL = "replay at ~10× real time";

export function AgentTrace() {
  // Media query via external store: no hydration mismatch (server says
  // false), no setState-in-effect. Reduced users get the full static
  // trace and can still scrub — scrubbing is not motion.
  const reduced = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);
  const last = useRef(0);
  const logRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (!playing) return;
    last.current = performance.now();
    const tick = (now: number) => {
      const dt = (now - last.current) / 1000;
      last.current = now;
      setTime((t) => {
        const nt = Math.min(DURATION, t + dt);
        if (nt >= DURATION) setPlaying(false);
        return nt;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  useEffect(() => {
    // Follow the newest visible step while playing.
    if (playing && logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [time, playing]);

  const effTime = reduced ? Math.max(time, DURATION) : time;
  const untouched = !reduced && time === 0 && !playing;
  // Before first play the full trace shows dimmed — content, not a void.
  const visible = untouched ? TRACE : TRACE.filter((s) => s.t <= effTime);
  const done = effTime >= DURATION;

  return (
    <div className="border border-ink-700 bg-ink-950 on-dark">
      {/* Transport */}
      <div className="flex items-center gap-4 px-5 h-14 border-b border-ink-700">
        <button
          type="button"
          onClick={() => {
            if (done) { setTime(0); setPlaying(true); track("trace_played", { replay: true }); }
            else setPlaying((p) => { if (!p) track("trace_played", { replay: false }); return !p; });
          }}
          aria-label={done ? "Replay trace" : playing ? "Pause trace" : "Play trace"}
          className="flex h-9 w-9 items-center justify-center bg-accent-500 text-ink-950 notch hover:bg-accent-400 transition-colors"
        >
          {done ? <RotateCcw className="w-4 h-4" strokeWidth={2.5} />
            : playing ? <Pause className="w-4 h-4" strokeWidth={2.5} />
            : <Play className="w-4 h-4 ml-0.5" strokeWidth={2.5} />}
        </button>
        <input
          type="range"
          min={0}
          max={DURATION}
          step={0.1}
          value={time}
          onChange={(e) => { setPlaying(false); setTime(Number(e.target.value)); track("trace_scrubbed", {}); }}
          aria-label="Scrub through the trace"
          className="flex-1 h-[3px]"
          style={{ accentColor: "var(--color-accent-400)" }}
        />
        <span className="mono text-[11px] tabular-nums text-ink-400 shrink-0">
          {time.toFixed(1)}s / {DURATION}s
        </span>
      </div>

      {/* Log */}
      <div className="relative">
        <ol
          ref={logRef}
          role="log"
          aria-live="polite"
          className={cn(
            "h-[340px] overflow-y-auto px-5 py-4 space-y-2.5 scroll-smooth",
            untouched && "opacity-[0.28] overflow-hidden"
          )}
        >
        {visible.map((s) => (
          <li key={s.t} className={cn("grid grid-cols-[52px_1fr] gap-3", !reduced && !untouched && "animate-fade-up")}>
            <span className="mono text-[11px] tabular-nums text-ink-500 pt-0.5">
              +{s.t.toFixed(1)}s
            </span>
            <div>
              {s.kind === "reasoning" ? (
                <p className="text-[13px] leading-relaxed text-ink-300 italic border-l border-ink-600 pl-3">
                  {s.label}
                </p>
              ) : s.kind === "result" ? (
                <div className="border border-accent-500/40 bg-accent-500/[0.07] px-4 py-3">
                  <p className="text-[13.5px] font-semibold text-accent-300">{s.label}</p>
                  {s.detail && <p className="text-[12.5px] text-ink-300 mt-1">{s.detail}</p>}
                </div>
              ) : (
                <>
                  <p className="mono text-[12.5px]">
                    <span className={s.kind === "tool" ? "text-accent-400" : "text-ink-200"}>{s.label}</span>
                  </p>
                  {s.detail && <p className="text-[12.5px] text-ink-400 mt-0.5">{s.detail}</p>}
                </>
              )}
            </div>
          </li>
        ))}
        </ol>

        {untouched && (
          <button
            type="button"
            onClick={() => { setPlaying(true); track("trace_played", { replay: false }); }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 group"
            aria-label="Play the trace"
          >
            <span className="flex h-16 w-16 items-center justify-center notch bg-accent-500 text-ink-950 transition-transform group-hover:scale-105">
              <Play className="w-7 h-7 ml-0.5" strokeWidth={2.5} />
            </span>
            <span className="mono text-[11px] uppercase tracking-[0.12em] text-ink-200">
              Play the trace · 14s
            </span>
          </button>
        )}
      </div>

      <div className="px-5 py-3 border-t border-ink-700 flex items-center justify-between gap-4">
        <span className="mono text-[10.5px] uppercase tracking-[0.1em] text-ink-500">
          Recorded production trace · numbers redacted
        </span>
        <span className="mono text-[10.5px] text-ink-500">{SPEED_LABEL}</span>
      </div>
    </div>
  );
}
