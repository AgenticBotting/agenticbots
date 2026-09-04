"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The field: hundreds of agents, each one a cell. A cell lights green
 * while it works, flashes when it finishes, and goes back to idle —
 * continuously, so the band reads as a floor of work actually happening.
 *
 * Plain canvas 2D, no dependencies. Honest counter: it starts at zero
 * when you arrive and counts completions on this screen only.
 * Paused off-screen and on hidden tabs; static under reduced motion.
 */

type Cell = {
  x: number;
  y: number;
  /** 0 = idle · 1 = working · 2 = flash */
  state: 0 | 1 | 2;
  t: number;       // ms remaining in current state
  dur: number;     // total ms of current work
};

const PITCH = 16;
const SIZE = 5;
const WORKING_SHARE = 0.05;
const FPS_MS = 1000 / 30;

export function AgentField({ height = 260 }: { height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const countRef = useRef(0);
  const [shown, setShown] = useState({ done: 0, agents: 0 });
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(prefersReduced);

    const css = getComputedStyle(document.documentElement);
    const GREEN = css.getPropertyValue("--color-accent-500").trim() || "#7FA200";
    const FLASH = css.getPropertyValue("--color-accent-300").trim() || "#ADD44E";

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cells: Cell[] = [];
    let raf = 0;
    let last = 0;
    let acc = 0;
    let running = true;
    let visible = true;

    function layout() {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cells = [];
      const cols = Math.floor(w / PITCH);
      const rows = Math.floor(h / PITCH);
      const ox = (w - cols * PITCH) / 2 + (PITCH - SIZE) / 2;
      const oy = (h - rows * PITCH) / 2 + (PITCH - SIZE) / 2;
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          cells.push({ x: ox + c * PITCH, y: oy + r * PITCH, state: 0, t: 0, dur: 0 });
      // Seed a working population so the first frame is already alive.
      for (const cell of cells)
        if (Math.random() < WORKING_SHARE) start(cell, Math.random());
      setShown((s) => ({ ...s, agents: cells.length }));
    }

    function start(cell: Cell, progress = 0) {
      cell.state = 1;
      cell.dur = 900 + Math.random() * 2200;
      cell.t = cell.dur * (1 - progress);
    }

    function draw(dt: number) {
      if (!ctx || !canvas) return;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      let working = 0;
      for (const cell of cells) {
        if (cell.state === 1) {
          working++;
          cell.t -= dt;
          if (cell.t <= 0) {
            cell.state = 2;
            cell.t = 220;
            countRef.current++;
          }
        } else if (cell.state === 2) {
          cell.t -= dt;
          if (cell.t <= 0) { cell.state = 0; }
        }

        if (cell.state === 1) {
          const p = 1 - cell.t / cell.dur;
          ctx.globalAlpha = 0.35 + p * 0.65;
          ctx.fillStyle = GREEN;
        } else if (cell.state === 2) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = FLASH;
        } else {
          ctx.globalAlpha = 0.13;
          ctx.fillStyle = "#FFFFFF";
        }
        ctx.fillRect(cell.x, cell.y, SIZE, SIZE);
      }
      ctx.globalAlpha = 1;

      // Keep the working share topped up, one or two starts per frame.
      const target = Math.floor(cells.length * WORKING_SHARE);
      let deficit = target - working;
      let guard = 0;
      while (deficit > 0 && guard < 40) {
        const c = cells[(Math.random() * cells.length) | 0];
        if (c.state === 0) { start(c); deficit--; }
        guard++;
      }
    }

    function frame(now: number) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) { last = now; return; }
      const dt = now - last;
      last = now;
      acc += dt;
      if (acc < FPS_MS) return;
      draw(acc);
      acc = 0;
    }

    layout();

    if (prefersReduced) {
      draw(0); // one static frame — the field, not the motion
    } else {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    const counterTick = prefersReduced
      ? 0
      : window.setInterval(() => setShown((s) => ({ ...s, done: countRef.current })), 400);

    const ro = new ResizeObserver(() => { layout(); if (prefersReduced) draw(0); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      if (counterTick) clearInterval(counterTick);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <figure aria-label="Animated field of agent cells lighting up as work completes">
      <canvas ref={canvasRef} className="block w-full" style={{ height }} />
      <figcaption className="mt-3 flex items-center justify-between gap-4 px-1">
        <span className="mono text-[10.5px] uppercase tracking-[0.1em] text-ink-400">
          {shown.agents > 0 ? `${shown.agents.toLocaleString()} agents · each square is one` : ""}
        </span>
        {!reduced && (
          <span className="mono text-[10.5px] uppercase tracking-[0.1em] text-ink-400">
            jobs finished since you arrived:{" "}
            <span className="text-accent-400 tabular-nums">{shown.done.toLocaleString()}</span>
          </span>
        )}
      </figcaption>
    </figure>
  );
}
