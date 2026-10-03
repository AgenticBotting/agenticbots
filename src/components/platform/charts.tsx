"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { shortDate } from "@/lib/platform/format";

/**
 * Portal charts. Hand-built SVG so they match the brand exactly and ship no
 * chart library: one pastel-green area series (with the prior period as a
 * quiet gray reference line), a crosshair + tooltip on hover AND keyboard,
 * and a table view for every chart. Text never wears the series color.
 */

const fmt = (n: number) => n.toLocaleString("en-US");

/** Axis top with four equal, whole-number steps (0 / 5 / 10 / 15 / 20). */
function niceMax(v: number): number {
  const raw = Math.max(1, v) / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].filter((m) => Number.isInteger(m * pow));
  const step = Math.max(1, (steps.find((m) => m * pow >= raw) ?? 10) * pow);
  return step * 4;
}

/** Monotone cubic (Fritsch–Carlson): smooth, never overshoots below zero. */
function smoothPath(xs: number[], ys: number[]): string {
  const n = xs.length;
  if (n === 0) return "";
  if (n === 1) return `M${xs[0]},${ys[0]}`;
  const dx: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(xs[i + 1] - xs[i]);
    m.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  t.push(m[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], h = a * a + b * b;
    if (h > 9) { const k = 3 / Math.sqrt(h); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  let d = `M${xs[0]},${ys[0]}`;
  for (let i = 0; i < n - 1; i++) {
    const c = dx[i] / 3;
    d += ` C${xs[i] + c},${ys[i] + c * t[i]} ${xs[i + 1] - c},${ys[i + 1] - c * t[i + 1]} ${xs[i + 1]},${ys[i + 1]}`;
  }
  return d;
}

function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/* ───────────────────────────── Area chart ───────────────────────────── */

export function AreaChart({
  dates,
  points,
  previous,
  label,
  height = 260,
  unit = "day",
}: {
  dates: string[];
  points: number[];
  previous?: number[];
  label: string;
  height?: number;
  unit?: "day" | "week";
}) {
  const [ref, width] = useWidth<HTMLDivElement>(760);
  const gid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const M = { l: 40, r: 14, t: 14, b: 30 };
  const W = width, H = height;
  const iw = W - M.l - M.r, ih = H - M.t - M.b;
  const n = points.length;
  const max = niceMax(Math.max(1, ...points, ...(previous ?? [])));
  const x = (i: number) => M.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => M.t + ih - (v / max) * ih;
  const xs = points.map((_, i) => x(i));
  const line = useMemo(() => smoothPath(xs, points.map(y)), [W, H, points, max]); // eslint-disable-line react-hooks/exhaustive-deps
  const prevLine = useMemo(() => (previous ? smoothPath(xs, previous.map(y)) : ""), [W, H, previous, max]); // eslint-disable-line react-hooks/exhaustive-deps
  const area = n > 1 ? `${line} L${x(n - 1)},${M.t + ih} L${x(0)},${M.t + ih} Z` : "";
  const ticks = [0, max / 4, max / 2, (3 * max) / 4, max];
  const xTickCount = Math.min(n, W < 520 ? 4 : 6);
  const xTicks = Array.from(new Set(Array.from({ length: xTickCount }, (_, k) => Math.round((k / Math.max(1, xTickCount - 1)) * (n - 1)))));

  const pick = (e: PointerEvent<SVGRectElement>) => {
    const r = (e.currentTarget as SVGRectElement).getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * iw;
    setHover(Math.max(0, Math.min(n - 1, Math.round((px / iw) * (n - 1)))));
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") { e.preventDefault(); setHover((h) => Math.min(n - 1, (h ?? -1) + 1)); }
    if (e.key === "ArrowLeft") { e.preventDefault(); setHover((h) => Math.max(0, (h ?? n) - 1)); }
    if (e.key === "Escape") setHover(null);
  };
  const h = hover;
  const tipLeft = h === null ? 0 : x(h);
  const flip = tipLeft > W - 190;

  return (
    <div
      ref={ref}
      className="pf-chart"
      tabIndex={0}
      role="img"
      aria-label={`${label}, ${n} ${unit}s. Use the left and right arrow keys to read each ${unit}.`}
      onKeyDown={onKey}
      onBlur={() => setHover(null)}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <defs>
          <linearGradient id={`g${gid}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-200)" stopOpacity="0.75" />
            <stop offset="60%" stopColor="var(--color-accent-100)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-accent-50)" stopOpacity="0.05" />
          </linearGradient>
          <clipPath id={`c${gid}`}>
            <rect className="pf-chart-reveal" x="0" y="0" width={W} height={H} />
          </clipPath>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} className={t === 0 ? "pf-axis" : "pf-grid"} />
            <text x={M.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="pf-tick">{fmt(Math.round(t))}</text>
          </g>
        ))}
        {xTicks.map((i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} className="pf-tick">{shortDate(dates[i])}</text>
        ))}
        <g clipPath={`url(#c${gid})`}>
          {prevLine && <path d={prevLine} className="pf-line-prev" />}
          <path d={area} fill={`url(#g${gid})`} />
          <path d={line} className="pf-line" />
          {n > 0 && h === null && <circle cx={x(n - 1)} cy={y(points[n - 1])} r="4" className="pf-dot" />}
        </g>
        {h !== null && (
          <g>
            <line x1={x(h)} x2={x(h)} y1={M.t} y2={M.t + ih} className="pf-crosshair" />
            {previous && <circle cx={x(h)} cy={y(previous[h])} r="3.5" className="pf-dot-prev" />}
            <circle cx={x(h)} cy={y(points[h])} r="4.5" className="pf-dot" />
          </g>
        )}
        <rect
          x={M.l} y={M.t} width={iw} height={ih} fill="transparent"
          onPointerMove={pick} onPointerDown={pick} onPointerLeave={() => setHover(null)}
          style={{ touchAction: "pan-y" }}
        />
      </svg>
      {h !== null && (
        <div className="pf-tooltip" style={{ left: flip ? undefined : tipLeft + 12, right: flip ? W - tipLeft + 12 : undefined, top: M.t }} role="status">
          <div className="d">{unit === "week" ? `Week of ${shortDate(dates[h])}` : shortDate(dates[h])}</div>
          <div className="row"><i className="key" /><b>{fmt(points[h])}</b><span>{label}</span></div>
          {previous && <div className="row muted"><i className="key prev" /><b>{fmt(previous[h])}</b><span>same {unit}, prior period</span></div>}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── Metric explorer (tabs + chart) ─────────────────────── */

export interface ExplorerSeries {
  key: string;
  label: string;
  total: number;
  previous: number;
  points: number[];
  previousPoints: number[];
}

function delta(total: number, previous: number): { text: string; dir: "up" | "down" | "flat" | "new" } {
  if (previous === 0) return total > 0 ? { text: "New this period", dir: "new" } : { text: "No change", dir: "flat" };
  const pct = Math.round(((total - previous) / previous) * 100);
  if (pct === 0) return { text: "Same as prior period", dir: "flat" };
  return { text: `${pct > 0 ? "+" : ""}${pct}% vs prior period`, dir: pct > 0 ? "up" : "down" };
}

/** Long periods read better by week: sum 7-day bins, newest bin ends today. */
function binWeekly(dates: string[], xs: number[]): { dates: string[]; xs: number[] } {
  const out: number[] = [], ds: string[] = [];
  for (let end = xs.length; end > 0; end -= 7) {
    const start = Math.max(0, end - 7);
    out.unshift(xs.slice(start, end).reduce((a, b) => a + b, 0));
    ds.unshift(dates[start]);
  }
  return { dates: ds, xs: out };
}

const cumulative = (xs: number[]) => {
  let t = 0;
  return xs.map((v) => (t += v));
};

export function MetricExplorer({
  dates,
  series,
  periodLabel,
  maxTabs = 5,
}: {
  dates: string[];
  series: ExplorerSeries[];
  periodLabel: string;
  /** Metrics shown as tabs; the rest are one menu away. */
  maxTabs?: number;
}) {
  const [key, setKey] = useState(series[0]?.key);
  const [mode, setMode] = useState<"daily" | "running">("daily");
  const [showTable, setShowTable] = useState(false);
  const tabsId = useId();
  if (series.length === 0) {
    return (
      <div className="pf-explorer">
        <div className="pf-explorer-empty">Results appear here as your Bots report finished work. Nothing is estimated.</div>
      </div>
    );
  }
  const cur = series.find((s) => s.key === key) ?? series[0];
  const tabs = series.slice(0, maxTabs);
  const more = series.slice(maxTabs);
  const inMore = more.some((s) => s.key === cur.key);
  const weekly = dates.length > 45;
  const binned = weekly ? binWeekly(dates, cur.points) : { dates, xs: cur.points };
  const binnedPrev = weekly ? binWeekly(dates, cur.previousPoints).xs : cur.previousPoints;
  const hasPrev = cur.previous > 0;
  const xDates = binned.dates;
  const pts = mode === "daily" ? binned.xs : cumulative(binned.xs);
  const prevPts = mode === "daily" ? binnedPrev : cumulative(binnedPrev);
  const unit = weekly ? "week" : "day";
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).tagName === "SELECT") return;
    const i = tabs.findIndex((s) => s.key === cur.key);
    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const s = tabs[(next + tabs.length) % tabs.length];
    setKey(s.key);
    document.getElementById(`${tabsId}-${s.key}`)?.focus();
  };
  return (
    <div className="pf-explorer">
      <div className="pf-explorer-tabs" role="tablist" aria-label="Choose a result to chart" onKeyDown={onTabKey}>
        {tabs.map((s) => {
          const dl = delta(s.total, s.previous);
          const on = s.key === cur.key;
          return (
            <button
              key={s.key}
              id={`${tabsId}-${s.key}`}
              role="tab"
              type="button"
              aria-selected={on}
              aria-controls={`${tabsId}-panel`}
              tabIndex={on ? 0 : -1}
              className="pf-explorer-tab"
              onClick={() => setKey(s.key)}
            >
              <span className="l">{s.label}</span>
              <span className="v">{fmt(s.total)}</span>
              <span className={`d ${dl.dir}`}>{dl.text}</span>
            </button>
          );
        })}
        {more.length > 0 && (
          <label className={`pf-explorer-tab more${inMore ? " on" : ""}`}>
            <span className="l">{inMore ? "Showing" : `${more.length} more result${more.length === 1 ? "" : "s"}`}</span>
            {inMore ? <span className="v">{fmt(cur.total)}</span> : <span className="v muted">+{more.length}</span>}
            <select
              aria-label="More results"
              value={inMore ? cur.key : ""}
              onChange={(e) => e.target.value && setKey(e.target.value)}
            >
              <option value="" disabled>Choose a result</option>
              {more.map((s) => <option key={s.key} value={s.key}>{s.label} ({fmt(s.total)})</option>)}
            </select>
          </label>
        )}
      </div>
      <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${cur.key}`} className="pf-explorer-panel">
        <div className="pf-explorer-meta">
          <h3>{cur.label}{mode === "daily" ? `, by ${unit}` : ", running total"}</h3>
          <div className="pf-explorer-tools">
            <div className="pf-legend" aria-hidden="true">
              <span><i className="key" />{periodLabel}</span>
              {hasPrev && <span><i className="key prev" />Prior period</span>}
            </div>
            <div className="pf-seg" role="group" aria-label="Chart view">
              <button type="button" aria-pressed={mode === "daily"} onClick={() => setMode("daily")}>{weekly ? "Weekly" : "Daily"}</button>
              <button type="button" aria-pressed={mode === "running"} onClick={() => setMode("running")}>Running total</button>
            </div>
          </div>
        </div>
        <AreaChart key={`${cur.key}-${mode}-${xDates.length}`} dates={xDates} points={pts} previous={hasPrev ? prevPts : undefined} label={mode === "daily" ? cur.label : `${cur.label} so far`} unit={unit} />
        <button type="button" className="pf-table-toggle" aria-expanded={showTable} onClick={() => setShowTable((v) => !v)}>
          {showTable ? "Hide table" : "Show as table"}
        </button>
        {showTable && (
          <div className="pf-table-wrap mt-2 max-h-72 overflow-y-auto">
            <table className="pf-table text-[13px]">
              <thead><tr><th>{weekly ? "Week of" : "Day"}</th><th className="num">{cur.label}</th><th className="num">Prior period</th></tr></thead>
              <tbody>
                {xDates.map((d, i) => (
                  <tr key={d}><td>{shortDate(d)}</td><td className="num">{fmt(pts[i])}</td><td className="num">{fmt(prevPts[i])}</td></tr>
                )).reverse()}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────── Column chart ───────────────────────────── */

export function ColumnChart({ labels, values, label, height = 180 }: { labels: string[]; values: number[]; label: string; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(1, ...values));
  const last = values.length - 1;
  const peak = values.indexOf(Math.max(...values));
  return (
    <div className="pf-columns" style={{ height }} role="list" aria-label={label}>
      {values.map((v, i) => (
        <div
          key={labels[i]}
          role="listitem"
          tabIndex={0}
          className={`col${i === last ? " current" : ""}${hover === i ? " on" : ""}`}
          aria-label={`${labels[i]}: ${fmt(v)}`}
          onPointerEnter={() => setHover(i)}
          onPointerLeave={() => setHover(null)}
          onFocus={() => setHover(i)}
          onBlur={() => setHover(null)}
        >
          <div className="slot">
            {(i === last || i === peak || hover === i) && <span className="cap">{fmt(v)}</span>}
            <span className="bar" style={{ height: `${(v / max) * 100}%` }} />
          </div>
          <span className="x">{values.length <= 8 || i % 2 === (last % 2) ? labels[i] : "\u00a0"}</span>
        </div>
      ))}
    </div>
  );
}
