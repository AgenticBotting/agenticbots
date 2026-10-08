import Link from "next/link";
import type { Metric } from "@/lib/catalog";
import { Container, BotPattern, CountUp } from "@/components/ui";
import { PlanCta } from "./PlanCta";
import { ActivityLog } from "./ProductUI";
import { Check } from "lucide-react";

/**
 * Wireframe section library (conversion anatomy pass, Sept 2026).
 *
 * The geo landers follow the classic SaaS landing skeleton the user
 * supplied as wireframes: hero + product-mockup cluster → trust strip →
 * big-number stat split → checklist feature cards → alternating zig-zag
 * deep dives → centered join band → form. Every "screenshot" here is
 * coded UI — deterministic, server-rendered, no hydration surface.
 *
 * HONEST-DATA RULE: feed rows and mini panels are illustrative UI and
 * are labeled as such in-place. No fabricated client results.
 */

/* ────────────────────────── Agent console ────────────────────────── */

const FEED: Record<string, (p: string[]) => { t: string; body: string }[]> = {
  ppc: (p) => [
    { t: "2m", body: `Read 214 search terms · ${p[0]} campaign — 6 negatives added` },
    { t: "9m", body: "Paused an ad set running 2.1× target CPA" },
    { t: "31m", body: `Budget shifted toward ${p[1] ?? p[0]} · after-hours searches` },
    { t: "1h", body: "New headline variant rotated in — old one retired" },
  ],
  seo: (p) => [
    { t: "4m", body: "Crawled 312 URLs · 3 broken internal links repaired" },
    { t: "22m", body: `Published a new page targeting ${p[0]} searches` },
    { t: "48m", body: `Internal links wired → ${p[1] ?? p[0]} page` },
    { t: "1h", body: "Schema re-validated across the site · 0 errors" },
  ],
  crm: (p) => [
    { t: "1m", body: `Call logged → “${p[0]}” deal updated, next step set` },
    { t: "12m", body: "14 stale deals flagged and queued for follow-up" },
    { t: "40m", body: "Quote sent → stage moved, reminder scheduled" },
    { t: "1h", body: "9 duplicate contacts found and merged" },
  ],
  "speed-to-lead": (p) => [
    { t: "38s", body: `Missed call from ${p[0]} → texted back in 38 seconds` },
    { t: "6m", body: "Form lead → phone call placed in 44 seconds" },
    { t: "52m", body: "After-hours quote request answered and booked" },
    { t: "1h", body: "No-show rescheduled — confirmation sent" },
  ],
};

const FALLBACK_FEED = (p: string[]) => [
  { t: "2m", body: `Inbound lead from ${p[0]} answered in under a minute` },
  { t: "18m", body: "Follow-up sequence advanced · 12 open quotes touched" },
  { t: "44m", body: `Campaign check across ${p[1] ?? p[0]} — budget on pace` },
  { t: "1h", body: "Daily report written and filed" },
];

/**
 * The hero mockup cluster — the wireframes' "product screenshot",
 * rendered as a live-looking agent console with a floating metric card.
 */
export function AgentConsole({
  botName,
  cityName,
  places,
  stat,
  feed,
}: {
  /** Offer-specific rows; falls back to the legacy keyed feeds. */
  feed?: (p: string[]) => { t: string; body: string }[];
  botName: string;
  /** Localizes the console header; omit on national pages. */
  cityName?: string;
  /** Real place names (districts or surrounding cities) woven into rows. */
  places: string[];
  /** The floating card. */
  stat: Metric;
}) {
  const key = botName === "Ads Bot" ? "ppc" : botName === "SEO Bot" ? "seo"
    : botName === "CRM Bot" ? "crm" : botName === "Speed-to-Lead Bot" ? "speed-to-lead" : "";
  const p = places.length ? places : ["your area"];
  const rows = (feed ?? FEED[key] ?? FALLBACK_FEED)(p);

  return (
    <ActivityLog
      title={botName}
      crumb={cityName}
      rows={rows}
      summary={[{ label: stat.label.length > 30 ? stat.label.slice(0, 28) + "…" : stat.label, value: stat.value }, { label: "Status", value: "Live" }]}
    />
  );
}

/* ─────────────────────────── Stack strip ─────────────────────────── */

const STACK = ["Approved source systems", "Client-owned data", "Authority policy", "Approval queue", "BOT ACTIVITY", "Management reporting"];

/** The wireframes' logo bar, kept honest: the tools the bots deploy into. */
export function StackStrip({ tools = STACK, label = "Operating architecture" }: { tools?: string[]; label?: string } = {}) {
  return (
    <div className="border-b border-[var(--border)] bg-white">
      <Container className="py-5 flex flex-wrap items-center gap-x-8 gap-y-3">
        <p className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)] shrink-0">
          {label}
        </p>
        <ul className="flex flex-wrap items-center gap-x-7 gap-y-2">
          {tools.map((s) => (
            <li key={s} className="text-[13px] font-semibold tracking-[-0.01em] text-[var(--text-secondary)] whitespace-nowrap">
              {s}
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
}

/* ─────────────────────────── Stat split ──────────────────────────── */

/** 2×2 big-number grid beside a heading + CTA — wireframe #2/#3's core block. */
export function StatSplit({
  eyebrow,
  heading,
  body,
  stats,
  source,
  note,
}: {
  eyebrow: string;
  heading: React.ReactNode;
  body: string;
  stats: Metric[];
  source: string;
  note?: string;
}) {
  return (
    <section className="border-b border-[var(--border)] bg-white">
      <Container className="section-pad">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-12 lg:gap-20 items-center">
          <dl className="grid grid-cols-2 gap-px bg-[var(--border)] border border-[var(--border)]">
            {stats.slice(0, 4).map((s) => (
              <div key={s.label} className="bg-white p-7 sm:p-8">
                <dt className="text-[2rem] font-semibold tracking-[-0.035em] leading-none tabular-nums">
                  <CountUp value={s.value} />
                </dt>
                <dd className="mt-3 text-[13px] leading-snug text-[var(--text-secondary)]">{s.label}</dd>
              </div>
            ))}
          </dl>
          <div>
            <p className="eyebrow mb-4">{eyebrow}</p>
            <h2 className="display-xl text-balance">{heading}</h2>
            <p className="body-lg mt-5 max-w-[52ch]">{body}</p>
            <div className="mt-8"><PlanCta source={source} /></div>
            {note && <p className="body-sm mt-4">{note}</p>}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ────────────────────────── Feature triad ────────────────────────── */

export interface TriadItem {
  index: string;
  title: string;
  body: string;
  bullets: string[];
  href?: string;
  linkLabel?: string;
}

/** Centered heading + three checklist cards — the wireframes' icon-card row, numerals instead of icons. */
export function FeatureTriad({
  eyebrow,
  heading,
  sub,
  items,
}: {
  eyebrow: string;
  heading: React.ReactNode;
  sub?: string;
  items: TriadItem[];
}) {
  return (
    <section className="border-b border-[var(--border)] bg-[var(--bg-alt)]">
      <Container className="section-pad">
        <div className="max-w-[62ch] mx-auto text-center">
          <p className="eyebrow mb-4">{eyebrow}</p>
          <h2 className="display-xl text-balance">{heading}</h2>
          {sub && <p className="body-lg mt-5 text-pretty">{sub}</p>}
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)]">
          {items.map((it) => (
            <div key={it.title} className="bg-white p-7 sm:p-8 flex flex-col">
              <p className="mono text-[11px] tracking-[0.08em] text-[var(--accent-text)]">{it.index}</p>
              <p className="display-md mt-3">{it.title}</p>
              <p className="body-sm mt-2.5">{it.body}</p>
              <ul className="mt-5 space-y-2.5 flex-1">
                {it.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-[var(--text-body)]">
                    <svg viewBox="0 0 12 12" className="w-3 h-3 shrink-0 mt-[3px]" aria-hidden>
                      <path d="M2 6.5 5 9.5 10 3" fill="none" stroke="var(--color-accent-600)" strokeWidth="1.8" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
              {it.href && (
                <Link href={it.href} className="mt-6 inline-block text-[13px] font-semibold text-[var(--accent-text)] hover:underline underline-offset-4">
                  {it.linkLabel ?? "Learn more"} →
                </Link>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ──────────────────────────── Zig-zag ────────────────────────────── */

export interface ZigRow {
  label: string;
  title: string;
  today: string;
  after: string;
}

/** Alternating deep-dive rows — the wireframes' mockup-left / copy-right zig-zag. */
export function ZigZag({
  eyebrow,
  heading,
  botName,
  rows,
}: {
  eyebrow: string;
  heading: React.ReactNode;
  botName: string;
  rows: ZigRow[];
}) {
  return (
    <section className="border-b border-[var(--border)] bg-white">
      <Container className="section-pad">
        <div className="max-w-[62ch]">
          <p className="eyebrow mb-4">{eyebrow}</p>
          <h2 className="display-xl text-balance">{heading}</h2>
        </div>
        {/* A straight before/after table. Honest, scannable, and the same
            shape on every page — no illustrative mockups standing in for proof. */}
        <div className="mt-12 border border-[var(--border-strong)] bg-white">
          <div className="hidden md:grid grid-cols-[0.8fr_1fr_1fr] border-b border-[var(--border)] bg-[var(--bg-alt)] text-[12px] font-semibold text-[var(--text-secondary)]">
            <span className="px-6 py-3">What changes</span>
            <span className="px-6 py-3 border-l border-[var(--border)]">Today</span>
            <span className="px-6 py-3 border-l border-[var(--border)] text-[var(--accent-text)]">With {botName}</span>
          </div>
          {rows.map((r) => (
            <div key={r.title} className="grid md:grid-cols-[0.8fr_1fr_1fr] border-b border-[var(--border)] last:border-b-0">
              <p className="px-6 pt-5 md:py-5 display-md">{r.title}</p>
              <p className="px-6 pt-2 md:py-5 md:border-l border-[var(--border)] text-[14px] leading-relaxed text-[var(--text-secondary)]">
                <span className="md:hidden font-semibold">Today: </span>{r.today}
              </p>
              <p className="px-6 pt-2 pb-5 md:py-5 md:border-l border-[var(--border)] text-[14px] leading-relaxed text-[var(--foreground)] flex gap-2.5">
                <Check className="w-4 h-4 mt-[3px] shrink-0 text-[var(--accent-text)]" strokeWidth={2.5} />
                <span>{r.after}</span>
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ─────────────────────────── Join band ───────────────────────────── */

/** Centered dark CTA band — the wireframes' "join" closer before the form. */
export function JoinBand({
  heading,
  sub,
  source,
  note = "Request a proposal · no payment required",
}: {
  heading: React.ReactNode;
  sub?: string;
  source: string;
  note?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-ink-950 on-dark border-b border-ink-700">
      <div className="h-px rule-agent opacity-60" />
      <BotPattern className="absolute inset-0 opacity-[0.5]" position="right" />
      <Container className="section-pad relative text-center">
        <h2 className="display-xl text-balance max-w-[26ch] mx-auto">{heading}</h2>
        {sub && <p className="body-lg mt-5 max-w-[52ch] mx-auto !text-ink-300">{sub}</p>}
        <div className="mt-9 flex justify-center"><PlanCta source={source} /></div>
        <p className="mono text-[10.5px] uppercase tracking-[0.1em] text-ink-400 mt-5">{note}</p>
      </Container>
    </section>
  );
}
