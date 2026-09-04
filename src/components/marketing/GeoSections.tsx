import Link from "next/link";
import type { Metric } from "@/lib/catalog";
import { Container, BotPattern } from "@/components/ui";
import { PlanCta } from "./PlanCta";
import { cn } from "@/lib/utils";

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
}: {
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
  const rows = (FEED[key] ?? FALLBACK_FEED)(p);

  return (
    <div className="relative pb-16">
      <div className="border border-[var(--border-strong)] bg-white">
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-[var(--border)]">
          <p className="mono text-[10.5px] uppercase tracking-[0.11em] text-[var(--text-secondary)] truncate">
            {botName}{cityName ? ` · ${cityName}` : ""}
          </p>
          <span className="flex items-center gap-2 shrink-0">
            <span className="h-1.5 w-1.5 bg-accent-500" />
            <span className="mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--accent-text)]">Running</span>
          </span>
        </div>
        <ul>
          {rows.map((r) => (
            <li key={r.t} className="flex items-baseline gap-4 px-5 py-3.5 border-b border-[var(--border)] last:border-b-0">
              <span className="mono text-[10px] tabular-nums text-[var(--text-muted)] w-8 shrink-0 text-right">{r.t}</span>
              <span className="text-[13.5px] leading-snug text-[var(--text-body)]">{r.body}</span>
              <svg viewBox="0 0 12 12" className="w-3 h-3 shrink-0 self-center ml-auto" aria-hidden>
                <path d="M2 6.5 5 9.5 10 3" fill="none" stroke="var(--color-accent-600)" strokeWidth="1.8" />
              </svg>
            </li>
          ))}
        </ul>
      </div>

      {/* Floating metric card — the wireframes' overlapping stat chip. */}
      <div className="absolute bottom-2 right-0 border border-ink-950 bg-ink-950 on-dark px-6 py-4 max-w-[240px]">
        <p className="text-[1.6rem] font-semibold tracking-[-0.035em] leading-none tabular-nums text-signal-500">{stat.value}</p>
        <p className="mt-2 text-[11.5px] leading-snug text-ink-300">{stat.label}</p>
      </div>

      <p className="mono text-[9.5px] uppercase tracking-[0.1em] text-[var(--text-muted)] mt-3 max-w-[calc(100%-256px)]">
        Illustrative console — every real action is logged and reviewable
      </p>
    </div>
  );
}

/* ─────────────────────────── Stack strip ─────────────────────────── */

const STACK = ["Google Ads", "Meta", "HubSpot", "Salesforce", "Twilio", "Slack", "Google Analytics", "Stripe"];

/** The wireframes' logo bar, kept honest: the tools the bots deploy into. */
export function StackStrip() {
  return (
    <div className="border-b border-[var(--border)] bg-white">
      <Container className="py-5 flex flex-wrap items-center gap-x-8 gap-y-3">
        <p className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)] shrink-0">
          Deploys into the tools you already use
        </p>
        <ul className="flex flex-wrap items-center gap-x-7 gap-y-2">
          {STACK.map((s) => (
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
                  {s.value}
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

/** Deterministic mini mockups for the zig-zag media slots. */
function MiniPanel({ variant, label }: { variant: 0 | 1 | 2; label: string }) {
  return (
    <div className="border border-[var(--border-strong)] bg-white">
      <div className="px-5 py-3 border-b border-[var(--border)]">
        <p className="mono text-[10px] uppercase tracking-[0.11em] text-[var(--text-secondary)] truncate">{label}</p>
      </div>
      <div className="p-5">
        {variant === 0 && (
          <ul className="space-y-3">
            {["Reviewed", "Adjusted", "Reported"].map((s, i) => (
              <li key={s} className="flex items-center gap-3">
                <svg viewBox="0 0 12 12" className="w-3.5 h-3.5 shrink-0" aria-hidden>
                  <rect x="0.5" y="0.5" width="11" height="11" fill="none" stroke="var(--color-accent-600)" />
                  <path d="M3 6.5 5.2 8.8 9 3.5" fill="none" stroke="var(--color-accent-600)" strokeWidth="1.6" />
                </svg>
                <span className="h-2 bg-ink-100" style={{ width: `${74 - i * 16}%` }} />
                <span className="mono text-[9.5px] text-[var(--text-muted)] ml-auto">{s}</span>
              </li>
            ))}
          </ul>
        )}
        {variant === 1 && (
          <svg viewBox="0 0 260 96" className="w-full" aria-hidden>
            {[26, 38, 34, 52, 58, 72, 68, 84].map((h, i) => (
              <rect key={i} x={i * 33 + 2} y={96 - h} width="22" height={h}
                fill={i >= 5 ? "var(--color-accent-500)" : "var(--color-ink-100)"} />
            ))}
          </svg>
        )}
        {variant === 2 && (
          <div className="grid grid-cols-3 gap-3">
            {[["New", 3], ["Working", 2], ["Booked", 3]].map(([t, n]) => (
              <div key={t as string}>
                <p className="mono text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)] mb-2">{t}</p>
                <div className="space-y-1.5">
                  {Array.from({ length: n as number }).map((_, i) => (
                    <div key={i} className={cn("h-5 border border-[var(--border)]",
                      t === "Booked" ? "bg-accent-100 border-accent-500" : "bg-[var(--bg-alt)]")} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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
        <div className="mt-14 space-y-16 lg:space-y-20">
          {rows.map((r, i) => (
            <div key={r.title} className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
              <div className={cn(i % 2 === 1 && "lg:order-2")}>
                <MiniPanel variant={(i % 3) as 0 | 1 | 2} label={r.label} />
              </div>
              <div className={cn(i % 2 === 1 && "lg:order-1")}>
                <p className="mono text-[11px] tracking-[0.08em] text-[var(--accent-text)]">0{i + 1}</p>
                <p className="display-lg mt-3 text-balance">{r.title}</p>
                <p className="body-base mt-4">
                  <span className="font-semibold text-[var(--text-muted)]">Today: </span>{r.today}
                </p>
                <p className="body-base mt-3 !text-[var(--foreground)]">
                  <span className="font-semibold text-[var(--accent-text)]">With {botName}: </span>
                  <span className="font-medium">{r.after}</span>
                </p>
              </div>
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
  note = "Free plan back in one business day · no call required",
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
