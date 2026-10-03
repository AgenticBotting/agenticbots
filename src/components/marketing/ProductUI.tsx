import { Check, Phone, FileText, MapPin, Mail, MessageSquare, Calendar, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Product UI primitives. Every graphic on the site is a rendering of the
 * product itself — real labels, real numbers, legible type — in one
 * visual language:
 *
 *   · white surface, 1px --border, one --shadow-lift, square corners
 *   · 44px title bar: app breadcrumb left, status right
 *   · 13px Geist for content, 12px for meta; no placeholder bars
 *   · green only for state (live, booked, done) and for data
 *   · 20px internal gutter, rows on a 44px rhythm
 *
 * ILLUSTRATIVE data, stated once in the window footer.
 */

export function Window({ title, crumb, status, children, footer = "Sample account · illustrative data", className }: {
  title: string; crumb?: string; status?: React.ReactNode; children: React.ReactNode; footer?: string | null; className?: string;
}) {
  return (
    <figure className={cn("bg-white border border-[var(--border-strong)] shadow-lift", className)}>
      <div className="flex items-center justify-between gap-4 h-11 px-5 border-b border-[var(--border)]">
        <span className="flex items-center gap-2 min-w-0 text-[13px]">
          <span className="font-semibold text-[var(--foreground)] truncate">{title}</span>
          {crumb && <span className="text-[var(--text-muted)] truncate">/ {crumb}</span>}
        </span>
        {status && <span className="shrink-0 text-[12px] text-[var(--text-secondary)]">{status}</span>}
      </div>
      {children}
      {footer && (
        <figcaption className="px-5 h-9 flex items-center border-t border-[var(--border)] text-[11.5px] text-[var(--text-muted)]">
          {footer}
        </figcaption>
      )}
    </figure>
  );
}

export function Live({ children = "Live" }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-500)]" />
      {children}
    </span>
  );
}

type Tone = "done" | "active" | "neutral";
export function Pill({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={cn(
      "inline-flex items-center h-[22px] px-2 text-[11.5px] font-medium whitespace-nowrap border",
      tone === "done" && "bg-[var(--bg-tint)] border-[var(--border-tint)] text-[var(--accent-text)]",
      tone === "active" && "bg-white border-[var(--border-strong)] text-[var(--foreground)]",
      tone === "neutral" && "bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text-secondary)]",
    )}>{children}</span>
  );
}

/** A row of summary figures across the top of a window. */
export function Summary({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="grid border-b border-[var(--border)]" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((it, i) => (
        <div key={it.label} className={cn("px-5 py-3.5", i > 0 && "border-l border-[var(--border)]")}>
          <dt className="text-[11.5px] text-[var(--text-muted)] truncate">{it.label}</dt>
          <dd className="mt-1 text-[1.375rem] font-semibold tracking-[-0.03em] leading-none tabular-nums text-[var(--foreground)]">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ───────────────────────── Homepage hero: lead inbox ───────────────────────── */

const SOURCE_ICON = { Call: Phone, Form: FileText, LSA: MapPin, Text: MessageSquare } as const;
const LEADS: { name: string; job: string; source: keyof typeof SOURCE_ICON; at: string; reply: string; status: string; tone: Tone }[] = [
  { name: "Maria Gomez", job: "Roof leak, garage", source: "Call", at: "8:42 pm", reply: "38s", status: "Booked Thu 10am", tone: "done" },
  { name: "Devon Ruiz", job: "Full re-roof quote", source: "Form", at: "7:15 pm", reply: "41s", status: "Quote sent", tone: "active" },
  { name: "Kim Patel", job: "Storm damage inspection", source: "LSA", at: "6:02 pm", reply: "29s", status: "Booked Fri 8am", tone: "done" },
  { name: "Grant Lee", job: "Gutter replacement", source: "Text", at: "4:47 pm", reply: "33s", status: "Following up", tone: "neutral" },
  { name: "Ana Ortiz", job: "Skylight repair", source: "Call", at: "1:20 pm", reply: "44s", status: "Booked Mon 9am", tone: "done" },
];

export function LeadInbox() {
  return (
    <Window title="Speed-to-Lead" crumb="Reyes Roofing" status={<Live>Answering</Live>}>
      <Summary items={[
        { label: "Leads today", value: "14" },
        { label: "Median first reply", value: "38s" },
        { label: "Booked", value: "9" },
      ]} />
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-5 h-9 items-center border-b border-[var(--border)] text-[11.5px] text-[var(--text-muted)]">
        <span>Lead</span><span className="w-14 text-right">Reply</span><span className="w-[124px]">Status</span>
      </div>
      <ul>
        {LEADS.map((l) => {
          const Icon = SOURCE_ICON[l.source];
          return (
            <li key={l.name} className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-5 h-[52px] items-center border-b border-[var(--border)] last:border-b-0">
              <span className="flex items-center gap-3 min-w-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-[var(--bg-alt)] border border-[var(--border)]">
                  <Icon className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium text-[var(--foreground)] truncate">{l.name}</span>
                  <span className="block text-[11.5px] text-[var(--text-muted)] truncate">{l.job} · {l.at}</span>
                </span>
              </span>
              <span className="w-14 text-right text-[13px] font-medium tabular-nums text-[var(--foreground)]">{l.reply}</span>
              <span className="w-[124px]"><Pill tone={l.tone}>{l.status}</Pill></span>
            </li>
          );
        })}
      </ul>
    </Window>
  );
}

/* ───────────────────────── Activity log (per offer / per city) ───────────────────────── */

export function ActivityLog({ title, crumb, rows, summary }: {
  title: string; crumb?: string;
  rows: { t: string; body: string }[];
  summary?: { label: string; value: string }[];
}) {
  return (
    <Window title={title} crumb={crumb} status={<Live>Running</Live>}>
      {summary && <Summary items={summary} />}
      <ol>
        {rows.map((r, i) => (
          <li key={i} className="grid grid-cols-[20px_1fr_auto] gap-x-3 px-5 py-3.5 items-start border-b border-[var(--border)] last:border-b-0">
            <span className={cn("mt-[3px] flex h-[14px] w-[14px] items-center justify-center", i === 0 ? "bg-[var(--color-accent-500)]" : "border border-[var(--border-strong)]")}>
              {i === 0 ? <CircleDot className="w-2.5 h-2.5 text-white" /> : <Check className="w-2.5 h-2.5 text-[var(--accent-text)]" strokeWidth={3} />}
            </span>
            <span className="text-[13px] leading-snug text-[var(--text-body)]">{r.body}</span>
            <span className="text-[11.5px] tabular-nums text-[var(--text-muted)] whitespace-nowrap pt-px">{r.t} ago</span>
          </li>
        ))}
      </ol>
    </Window>
  );
}

/* ───────────────────────── Homepage steps ───────────────────────── */

export function StepScorecard() {
  const rows = [
    ["First reply to a web form", "3h 12m"],
    ["After-hours call answered", "No"],
    ["Quote followed up", "Once"],
    ["Est. revenue leaking", "$15,750/mo"],
  ];
  return (
    <Window title="Lead leak scorecard" status="Day 2" footer={null}>
      <ul>
        {rows.map(([k, v]) => (
          <li key={k} className="flex items-center justify-between gap-4 px-5 h-11 border-b border-[var(--border)] last:border-b-0 text-[13px]">
            <span className="text-[var(--text-body)]">{k}</span>
            <span className="font-semibold tabular-nums text-[var(--foreground)]">{v}</span>
          </li>
        ))}
      </ul>
    </Window>
  );
}

export function StepConnected() {
  const rows: [string, React.ElementType][] = [["Phone line", Phone], ["Website forms", FileText], ["Calendar", Calendar], ["CRM", Mail]];
  return (
    <Window title="Connections" status="4 of 4" footer={null}>
      <ul>
        {rows.map(([k, Icon]) => (
          <li key={k} className="flex items-center justify-between gap-4 px-5 h-11 border-b border-[var(--border)] last:border-b-0 text-[13px]">
            <span className="flex items-center gap-2.5 text-[var(--text-body)]"><Icon className="w-3.5 h-3.5 text-[var(--text-muted)]" />{k}</span>
            <Pill tone="done">Connected</Pill>
          </li>
        ))}
      </ul>
    </Window>
  );
}

export function StepBooked() {
  const rows = [["Mon", "Ana Ortiz", "9:00"], ["Tue", "Grant Lee", "1:30"], ["Thu", "Maria Gomez", "10:00"], ["Fri", "Kim Patel", "8:00"]];
  return (
    <Window title="Booked this week" status="9 jobs" footer={null}>
      <ul>
        {rows.map(([d, n, t]) => (
          <li key={n} className="grid grid-cols-[40px_1fr_auto] items-center gap-3 px-5 h-11 border-b border-[var(--border)] last:border-b-0 text-[13px]">
            <span className="text-[var(--text-muted)]">{d}</span>
            <span className="text-[var(--text-body)] truncate">{n}</span>
            <span className="font-semibold tabular-nums text-[var(--foreground)]">{t}</span>
          </li>
        ))}
      </ul>
    </Window>
  );
}

/* ───────────────────────── Service area card (city pages) ───────────────────────── */

export function ServiceArea({ city, stateAbbr, areas }: { city: string; stateAbbr: string; areas: string[] }) {
  return (
    <Window title="Service area" crumb={`${city}, ${stateAbbr}`} status={<Live>{`${areas.length} areas`}</Live>} footer={null}>
      <ul className="grid sm:grid-cols-2">
        {areas.map((a, i) => (
          <li key={a} className={cn("flex items-center gap-2.5 px-5 h-11 border-b border-[var(--border)] text-[13px] text-[var(--text-body)]", i % 2 === 0 && "sm:border-r")}>
            <MapPin className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0" />
            <span className="truncate">{a}</span>
          </li>
        ))}
      </ul>
    </Window>
  );
}
