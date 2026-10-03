import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ago, dateTime } from "@/lib/platform/format";
import { cn } from "@/lib/utils";

/**
 * Operator-console visual primitives (server-rendered, no client JS).
 * Tones follow the status vocabulary in platform.css; every colored mark
 * carries a word or number beside it, so nothing is color-only.
 */
export type Tone = "good" | "live" | "watch" | "bad" | "quiet" | "info";

/* ── KPI tile ── */
export function Kpi({
  value,
  label,
  href,
  icon: Icon,
  tone,
  hint,
  spark,
  meter,
}: {
  value: React.ReactNode;
  label: string;
  href?: string;
  icon?: LucideIcon;
  tone?: "bad" | "watch" | "good";
  hint?: React.ReactNode;
  spark?: number[];
  meter?: { pct: number; tone?: "watch" | "bad" };
}) {
  const body = (
    <>
      <div className="top">
        {Icon && <span className="ico" aria-hidden="true"><Icon /></span>}
        <span className="l">{label}</span>
        {tone && tone !== "good" && <span className={`flag ${tone}`} aria-hidden="true" />}
      </div>
      <div className="v">{value}</div>
      {meter && (
        <div className={cn("pf-kpi-meter", meter.tone)} aria-hidden="true">
          <span style={{ width: `${Math.max(0, Math.min(100, meter.pct))}%` }} />
        </div>
      )}
      {spark && <MiniBars values={spark} />}
      {hint && <div className="h">{hint}</div>}
    </>
  );
  const cls = cn("pf-kpi-tile", tone && `is-${tone}`);
  return href ? <Link href={href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}

export function KpiRow({ children, cols }: { children: React.ReactNode; cols?: number }) {
  return <div className="pf-kpi-row" style={cols ? ({ "--cols": cols } as React.CSSProperties) : undefined}>{children}</div>;
}

/* ── Tiny column sparkline (last N days) ── */
export function MiniBars({ values, label }: { values: number[]; label?: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="pf-minibars" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {values.map((v, i) => (
        <span key={i} className={i === values.length - 1 ? "now" : undefined} style={{ height: `${Math.max(v > 0 ? 12 : 4, (v / max) * 100)}%` }} />
      ))}
    </div>
  );
}

/* ── Part-to-whole bar with a legend ── */
export function SegBar({ items, label }: { items: { label: string; value: number; tone: Tone; href?: string }[]; label: string }) {
  const total = items.reduce((s, x) => s + x.value, 0);
  const shown = items.filter((x) => x.value > 0);
  return (
    <div className="pf-segbar">
      <div className="track" role="img" aria-label={`${label}: ${items.map((x) => `${x.value} ${x.label}`).join(", ")}`}>
        {total === 0 ? <span className="seg quiet" style={{ flex: 1 }} /> : shown.map((x) => <span key={x.label} className={`seg ${x.tone}`} style={{ flex: x.value }} />)}
      </div>
      <ul className="legend">
        {items.map((x) => {
          const inner = (
            <>
              <i className={`sw ${x.tone}`} aria-hidden="true" />
              <b>{x.value.toLocaleString("en-US")}</b>
              <span>{x.label}</span>
            </>
          );
          return <li key={x.label}>{x.href ? <Link href={x.href}>{inner}</Link> : inner}</li>;
        })}
      </ul>
    </div>
  );
}

/* ── Status lights (EC2 · Engine · Tunnel · Backup) ── */
export function Lights({ items }: { items: { label: string; tone: Tone; title?: string }[] }) {
  return (
    <ul className="pf-lights">
      {items.map((x) => (
        <li key={x.label} title={x.title}>
          <i className={`dot ${x.tone}`} aria-hidden="true" />
          <span>{x.label}</span>
          <span className="sr-only">{x.title ?? x.tone}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── Initials tile for a client ── */
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .replace(/[^A-Za-z0-9 &]/g, " ")
    .split(/\s+/)
    .filter((w) => w && w !== "&" && !/^(co|inc|llc)$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return <span className={`pf-avatar ${size}`} aria-hidden="true">{initials || "•"}</span>;
}

/* ── Horizontal bar rows ── */
export function BarRows({
  rows,
  max,
}: {
  rows: { key: string; label: React.ReactNode; sub?: React.ReactNode; value: number; display: React.ReactNode; tone?: "good" | "watch" | "bad" | "quiet"; href?: string }[];
  max?: number;
}) {
  const m = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="pf-barrows">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="who">
            <div className="n">{r.href ? <Link href={r.href}>{r.label}</Link> : r.label}</div>
            {r.sub && <div className="s">{r.sub}</div>}
          </div>
          <div className="track" aria-hidden="true"><span className={r.tone} style={{ width: `${Math.max(r.value > 0 ? 1.5 : 0, (r.value / m) * 100)}%` }} /></div>
          <div className="val">{r.display}</div>
        </li>
      ))}
    </ul>
  );
}

/* ── Vertical timeline ── */
export function TimelineList({ items, empty = "Nothing yet." }: { items: { key: string; at: string; title: React.ReactNode; sub?: React.ReactNode; tone?: Tone }[]; empty?: string }) {
  if (items.length === 0) return <p className="pf-muted pf-small px-4 py-6">{empty}</p>;
  return (
    <ol className="pf-tl">
      {items.map((x) => (
        <li key={x.key}>
          <i className={`dot ${x.tone ?? "quiet"}`} aria-hidden="true" />
          <div className="body">
            <div className="t">{x.title}</div>
            {x.sub && <div className="s">{x.sub}</div>}
          </div>
          <time dateTime={x.at} title={dateTime(x.at)}>{ago(x.at)}</time>
        </li>
      ))}
    </ol>
  );
}

/* ── Card shell used by grid pages ── */
export function Card({ children, href, tone, className }: { children: React.ReactNode; href?: string; tone?: Tone; className?: string }) {
  const cls = cn("pf-card-x", tone && `edge-${tone}`, className);
  return href ? <Link href={href} className={cls}>{children}</Link> : <div className={cls}>{children}</div>;
}

/** Map any status word onto a tone (mirrors status.tsx). */
export function toneFor(status: string | undefined): Tone {
  switch (status) {
    case "healthy": case "connected": case "active": case "completed": case "succeeded": case "paid": case "ok": case "deployed": case "running": case "approved": case "resolved":
      return "good";
    case "working": case "queued": case "provisioning": case "in_progress":
      return "live";
    case "degraded": case "needs_attention": case "pending": case "waiting_for_approval": case "due": case "partially_paid": case "medium": case "upcoming": case "investigating": case "reviewing": case "waiting_on_client": case "submitted":
      return "watch";
    case "offline": case "down": case "failed": case "past_due": case "suspended": case "critical": case "high": case "disconnected": case "interrupted": case "error":
      return "bad";
    default:
      return "quiet";
  }
}
