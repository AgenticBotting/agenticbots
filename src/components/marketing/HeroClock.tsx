"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Phone, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The homepage's one orchestrated moment. A stopwatch starts the instant
 * the page loads — a lead just called — and stops when the bot's first
 * text goes out at 0:38, against a 60-second ruler. Played back at 10×
 * real time and labeled as such. Reduced motion jumps to the end state.
 */

const STOP = 38;          // seconds, the first reply
const SPEED = 10;         // playback multiplier
const LIMIT = 60;

type Msg = { at: number; from: "lead" | "bot" | "sys"; text: string; stamp: string };
const THREAD: Msg[] = [
  { at: 0, from: "sys", text: "Missed call · (561) •••-8214", stamp: "8:42:01 pm" },
  { at: STOP, from: "bot", text: "Hi, sorry we missed you! What's going on with the roof?", stamp: "8:42:39 pm" },
  { at: STOP + 1, from: "lead", text: "Leak over the garage, worse when it rains", stamp: "8:43:47 pm" },
  { at: STOP + 2, from: "bot", text: "We can be out Thursday 10am or 3:30pm. Which works?", stamp: "8:43:58 pm" },
  { at: STOP + 3, from: "lead", text: "10 works", stamp: "8:44:13 pm" },
];

export function useClock(target: React.RefObject<HTMLElement | null>) {
  const [t, setT] = useState(0);          // elapsed "real" seconds, 0..STOP
  const [after, setAfter] = useState(0);  // post-stop reveal steps
  const raf = useRef<number | null>(null);
  const timers = useRef<number[]>([]);

  const run = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setT(0); setAfter(0);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setT(STOP); setAfter(4); return; }
    const start = performance.now() + 450; // a beat before the clock starts
    const tick = (now: number) => {
      const v = Math.max(0, ((now - start) / 1000) * SPEED);
      if (v >= STOP) {
        setT(STOP);
        [1, 2, 3, 4].forEach((n) => timers.current.push(window.setTimeout(() => setAfter(n), 520 * n)));
        return;
      }
      setT(v);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    /* Start when the numerals are actually on screen — immediately on a
       laptop, on first scroll on a phone — so nobody misses the run. */
    const el = target.current;
    const ts = timers.current;
    let first = 0;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { io.disconnect(); first = requestAnimationFrame(run); }
    }, { threshold: 0.25 });
    if (el) io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(first);
      if (raf.current) cancelAnimationFrame(raf.current);
      ts.forEach(clearTimeout);
    };
  }, [run, target]);

  return { t, after, done: t >= STOP, replay: run };
}

export function HeroClock({ children }: { children: React.ReactNode }) {
  const clockRef = useRef<HTMLDivElement>(null);
  const { t, after, done, replay } = useClock(clockRef);
  const secs = Math.floor(t);
  const centi = Math.floor((t - secs) * 100);
  const visible = THREAD.filter((m) => (m.at <= STOP ? m.at <= t : m.at - STOP <= after));

  return (
    <section className="relative overflow-hidden border-b border-[var(--border)] bg-white">
      <div className="container-site pt-10 sm:pt-12">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-14 items-start">
          <div>{children}</div>

          {/* The thread the clock is timing. */}
          <div className="relative bg-ink-950 border border-ink-700 text-white shadow-lift" aria-live="polite">
            <div className="flex items-center justify-between px-5 h-11 border-b border-ink-700">
              <span className="flex items-center gap-2 text-[12.5px] font-semibold">
                <span className={cn("h-1.5 w-1.5 bg-accent-400", !done && "animate-pulse-dot")} />
                Speed-to-Lead Bot
              </span>
              <span className="text-[11.5px] text-ink-400">Reyes Roofing · after hours</span>
            </div>
            <ul className="px-5 py-5 space-y-2.5 min-h-[210px] sm:min-h-[272px]">
              {visible.map((m, i) => (
                <li key={i} className={cn("flex animate-fade-up", m.from === "bot" ? "justify-end" : "justify-start")}>
                  {m.from === "sys" ? (
                    <span className="flex items-center gap-2 text-[12.5px] text-ink-400">
                      <Phone className="w-3.5 h-3.5" /> {m.text} <span className="tabular-nums text-ink-500">{m.stamp}</span>
                    </span>
                  ) : (
                    <span className={cn(
                      "max-w-[84%] px-3.5 py-2.5 text-[13.5px] leading-snug",
                      m.from === "bot" ? "bg-[var(--color-accent-500)] text-ink-950 font-medium" : "bg-ink-800 text-ink-100",
                    )}>
                      {m.text}
                      <span className={cn("block text-[10.5px] mt-1 tabular-nums", m.from === "bot" ? "text-ink-950/60" : "text-ink-500")}>{m.stamp}</span>
                    </span>
                  )}
                </li>
              ))}
              {!done && t > 4 && (
                <li className="flex justify-end">
                  <span className="flex gap-1 bg-ink-800 px-3.5 py-3" aria-label="Bot is typing">
                    {[0, 1, 2].map((d) => <span key={d} className="h-1.5 w-1.5 rounded-full bg-ink-400 animate-pulse-dot" style={{ animationDelay: `${d * 160}ms` }} />)}
                  </span>
                </li>
              )}
              {after >= 4 && (
                <li className="pt-1 flex items-center gap-2 text-[13px] font-semibold text-accent-300 animate-fade-up">
                  <Check className="w-4 h-4" strokeWidth={2.75} /> Booked Thursday 10:00am · saved to your CRM
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* The clock. Ruler first, then numerals too big for the room. */}
      <div className="container-site mt-8 sm:mt-10">
        <div className="relative" aria-hidden>
          <div className="relative h-8">
            {Array.from({ length: LIMIT / 5 + 1 }).map((_, i) => {
              const s = i * 5;
              const major = s % 15 === 0;
              return (
                <span key={s} className={cn("absolute bottom-0 flex flex-col", s === 0 ? "items-start" : s === LIMIT ? "items-end -translate-x-full" : "items-center -translate-x-1/2")} style={{ left: `${(s / LIMIT) * 100}%` }}>
                  {major && <span className="text-[11px] tabular-nums text-[var(--text-muted)] mb-1">{s === LIMIT ? "60s" : `${s}`}</span>}
                  <span className={cn("w-px bg-[var(--border-strong)]", major ? "h-3" : "h-1.5")} />
                </span>
              );
            })}
          </div>
          <div className="relative h-[6px] bg-[var(--bg-alt)]">
            <div className="absolute inset-y-0 left-0 bg-[var(--color-accent-500)]" style={{ width: `${(t / LIMIT) * 100}%` }} />
            <div
              className={cn("absolute -top-[7px] h-5 w-5 -translate-x-1/2 border-[3px] border-white bg-ink-950 transition-transform", done && "scale-110")}
              style={{ left: `${(t / LIMIT) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="container-site relative" ref={clockRef}>
        {/* Phone: the status rides above the numerals. */}
        <div className="md:hidden flex items-center justify-between gap-4 pt-5">
          <p className={cn("num-display text-[2.25rem]", done ? "text-[var(--accent-text)]" : "text-[var(--border-strong)]")}>
            {done ? "Answered." : "Ringing…"}
          </p>
          <button type="button" onClick={replay} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-body)]">
            <RotateCcw className="w-3.5 h-3.5" /> Replay at {SPEED}×
          </button>
        </div>
        <div className="flex items-end justify-between gap-6">
          <p
            className="num-display text-[clamp(8rem,27vw,25rem)] text-ink-950 select-none -mb-[0.2em] leading-[0.8]"
            aria-label={`First reply sent in ${STOP} seconds`}
          >
            0:{String(secs).padStart(2, "0")}
            <span className={cn("text-[0.22em] align-top ml-[0.06em] text-[var(--color-accent-500)] transition-opacity", done && "opacity-0")}>
              .{String(centi).padStart(2, "0")}
            </span>
          </p>
          <div className="hidden md:flex flex-col items-end gap-3 pb-10 shrink-0">
            <p className={cn("num-display text-[clamp(2.5rem,4vw,3.75rem)] transition-colors", done ? "text-[var(--accent-text)]" : "text-[var(--border-strong)]")}>
              {done ? "Answered." : "Ringing…"}
            </p>
            <p className="text-[13px] text-[var(--text-secondary)] text-right max-w-[26ch]">
              First reply to an after-hours call. Shown at {SPEED}× speed.
            </p>
            <button type="button" onClick={replay} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-body)] hover:text-[var(--accent-text)] transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Replay
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
