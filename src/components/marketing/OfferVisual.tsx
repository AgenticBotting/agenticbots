import { Check, Phone, Star, ArrowUpRight, Mail, Calendar, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One signature "screenshot" per offer, used as the service hero visual.
 * Coded UI, server-rendered, illustrative data — labeled as such.
 * Keyed by catalog category slug.
 */

function Frame({ title, status, children, className }: {
  title: string; status: string; children: React.ReactNode; className?: string;
}) {
  return (
    <figure className={cn("border border-[var(--border-strong)] bg-white shadow-lift", className)}>
      <div className="flex items-center justify-between gap-4 px-5 h-11 border-b border-[var(--border)] bg-[var(--bg-alt)]">
        <span className="flex items-center gap-2 min-w-0">
          <span className="h-1.5 w-1.5 shrink-0 bg-accent-500 animate-pulse-dot" />
          <span className="text-[12.5px] font-semibold tracking-[-0.01em] truncate">{title}</span>
        </span>
        <span className="mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] shrink-0">{status}</span>
      </div>
      <div className="p-5">{children}</div>
      <figcaption className="px-5 py-2 border-t border-[var(--border)] mono text-[9.5px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
        Illustrative · how it looks when it runs
      </figcaption>
    </figure>
  );
}

const Row = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <li className={cn("flex items-center justify-between gap-3 py-2.5 border-b border-[var(--border)] last:border-b-0 text-[13px]", className)}>{children}</li>
);
const Tag = ({ children, tone = "muted" }: { children: React.ReactNode; tone?: "good" | "bad" | "muted" | "dark" }) => (
  <span className={cn(
    "mono text-[9.5px] uppercase tracking-[0.08em] px-1.5 py-0.5 shrink-0",
    tone === "good" && "bg-[var(--bg-tint)] text-[var(--accent-text)]",
    tone === "bad" && "bg-[var(--bg-alt)] text-[var(--color-danger)]",
    tone === "muted" && "bg-[var(--bg-alt)] text-[var(--text-muted)]",
    tone === "dark" && "bg-ink-950 text-accent-400",
  )}>{children}</span>
);

function Ads() {
  const rows: [string, string, "good" | "bad"][] = [
    ["emergency roof leak repair", "$64 / booked", "good"],
    ["roofing jobs hiring", "negative added", "bad"],
    ["roof replacement near me", "$91 / booked", "good"],
    ["diy roof patch kit", "negative added", "bad"],
    ["metal roof installer", "bid +18%", "good"],
  ];
  return (
    <Frame title="Ads Bot · search terms today" status="214 read">
      <ul>{rows.map(([t, v, tone]) => (
        <Row key={t}><span className={cn("truncate", tone === "bad" && "line-through text-[var(--text-muted)]")}>{t}</span><Tag tone={tone}>{v}</Tag></Row>
      ))}</ul>
      <div className="mt-4 grid grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)] text-center">
        {[["$1,840", "spent"], ["23", "booked jobs"], ["$80", "per job"]].map(([v, l]) => (
          <div key={l} className="bg-white py-3"><p className="text-[1.15rem] font-semibold tabular-nums">{v}</p><p className="mono text-[9.5px] uppercase tracking-[0.08em] text-[var(--text-muted)]">{l}</p></div>
        ))}
      </div>
    </Frame>
  );
}

function Seo() {
  const rows: [string, number, number][] = [
    ["roofer west palm beach", 14, 3],
    ["emergency roof repair", 22, 6],
    ["metal roof installation", 31, 9],
    ["roof inspection cost", 48, 12],
  ];
  return (
    <Frame title="SEO Bot · rank tracker" status="updated daily">
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-5 text-[10px] mono uppercase tracking-[0.08em] text-[var(--text-muted)] pb-2 border-b border-[var(--border)]">
        <span>Search term</span><span>Was</span><span>Now</span>
      </div>
      <ul>{rows.map(([t, a, b]) => (
        <li key={t} className="grid grid-cols-[1fr_auto_auto] gap-x-5 items-center py-2.5 border-b border-[var(--border)] last:border-b-0 text-[13px]">
          <span className="truncate">{t}</span>
          <span className="tabular-nums text-[var(--text-muted)] w-6 text-right">{a}</span>
          <span className="flex items-center gap-1 tabular-nums font-semibold text-[var(--accent-text)] w-10 justify-end"><ArrowUpRight className="w-3.5 h-3.5" />{b}</span>
        </li>
      ))}</ul>
      <p className="mt-4 text-[12.5px] text-[var(--text-secondary)]">3 pages fixed this week · 1 new service page live</p>
    </Frame>
  );
}

function Content() {
  const days = [
    ["Mon", "Before/after · bathroom remodel", "Instagram"],
    ["Tue", "GBP post · fall gutter cleaning", "Google"],
    ["Wed", "Project story · 2,400 sq ft roof", "Blog"],
    ["Thu", "60s clip · crew walkthrough", "Facebook"],
    ["Fri", "Tip · signs your AC needs service", "Email"],
  ];
  return (
    <Frame title="Content Bot · this week" status="5 scheduled">
      <ul>{days.map(([d, t, c]) => (
        <Row key={d}>
          <span className="flex items-center gap-3 min-w-0"><span className="mono text-[10.5px] text-[var(--text-muted)] w-7">{d}</span><span className="truncate">{t}</span></span>
          <Tag tone="good">{c}</Tag>
        </Row>
      ))}</ul>
    </Frame>
  );
}

function Email() {
  const steps = [
    ["Day 0", "Your quote for the roof replacement", "sent"],
    ["Day 2", "Any questions on the estimate?", "opened"],
    ["Day 5", "Financing options, if they help", "replied"],
    ["Day 10", "Still thinking it over?", "stopped"],
  ];
  return (
    <Frame title="Email Bot · quote follow-up" status="1 of 1 replied">
      <ol className="relative pl-5 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-[var(--border-strong)]">
        {steps.map(([d, s, st]) => (
          <li key={d} className="relative py-2.5">
            <span className={cn("absolute -left-5 top-[15px] h-2.5 w-2.5", st === "stopped" ? "bg-[var(--border-strong)]" : "bg-accent-500")} />
            <span className="flex items-center justify-between gap-3">
              <span className="min-w-0"><span className="mono text-[10px] text-[var(--text-muted)] block">{d}</span><span className={cn("text-[13px] truncate block", st === "stopped" && "line-through text-[var(--text-muted)]")}>{s}</span></span>
              <Tag tone={st === "replied" ? "dark" : st === "stopped" ? "muted" : "good"}>{st}</Tag>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-2 flex items-center gap-2 text-[12.5px] text-[var(--text-secondary)]"><Mail className="w-3.5 h-3.5" /> Reply received → sequence stopped, you were notified</p>
    </Frame>
  );
}

function Cro() {
  return (
    <Frame title="Conversion Bot · quote form test" status="day 11 of 14">
      <div className="grid grid-cols-2 gap-3">
        {[["A · current", "9 fields", "3.1%", false], ["B · challenger", "4 fields + call button", "5.4%", true]].map(([n, d, r, win]) => (
          <div key={n as string} className={cn("border p-4", win ? "border-ink-950" : "border-[var(--border)]")}>
            <p className="mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">{n}</p>
            <div className="mt-3 space-y-1.5">{Array.from({ length: win ? 2 : 4 }).map((_, i) => <div key={i} className="h-2.5 bg-[var(--bg-alt)]" />)}</div>
            <div className={cn("mt-3 h-6", win ? "bg-accent-500" : "bg-ink-200")} />
            <p className="mt-3 text-[11.5px] text-[var(--text-secondary)]">{d}</p>
            <p className="mt-1 text-[1.4rem] font-semibold tabular-nums">{r}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[12.5px] text-[var(--text-secondary)]">B ahead at 94% confidence · ships at 95%</p>
    </Frame>
  );
}

function Analytics() {
  const bars: [string, number, string][] = [["Google Ads", 86, "$86"], ["LSA", 54, "$54"], ["SEO", 22, "$22"], ["Meta", 140, "$140"]];
  return (
    <Frame title="Analytics Bot · Monday report" status="emailed 7:00am">
      <p className="text-[13.5px] leading-relaxed">
        Last week: <b>31 booked jobs</b> from <b>$2,410</b> in spend. SEO is your cheapest source. Meta cost the most per job, so we moved $300 to LSA.
      </p>
      <p className="mt-4 mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Cost per booked job</p>
      <ul className="mt-2 space-y-2">{bars.map(([n, v, l]) => (
        <li key={n} className="grid grid-cols-[84px_1fr_44px] items-center gap-3 text-[12.5px]">
          <span>{n}</span><span className="h-2 bg-[var(--bg-alt)]"><span className={cn("block h-full", v > 100 ? "bg-ink-300" : "bg-accent-500")} style={{ width: `${(v / 140) * 100}%` }} /></span><span className="tabular-nums text-right">{l}</span>
        </li>
      ))}</ul>
    </Frame>
  );
}

function Prospecting() {
  const rows = [
    ["Harbor Property Group", "Property manager · 14 sites"],
    ["Coastline Builders", "GC · permit filed this week"],
    ["Palm Medical Facilities", "Facilities director"],
    ["Atlantic HOA Management", "38 communities"],
  ];
  return (
    <Frame title="Prospecting Bot · this week's list" status="42 verified">
      <ul>{rows.map(([n, d]) => (
        <Row key={n}><span className="min-w-0"><span className="block font-medium truncate">{n}</span><span className="block text-[12px] text-[var(--text-secondary)] truncate">{d}</span></span><Tag tone="good"><Check className="inline w-3 h-3 -mt-0.5" /> verified</Tag></Row>
      ))}</ul>
    </Frame>
  );
}

function Outbound() {
  return (
    <Frame title="Outbound Bot · inbox" status="3 replies today">
      <div className="border border-[var(--border)] p-4">
        <p className="mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Sent · Tue 8:12am</p>
        <p className="mt-1.5 text-[13px] font-semibold">Electrical contractor for your Q1 tenant build-outs</p>
        <p className="mt-1.5 text-[12.5px] text-[var(--text-secondary)] leading-relaxed">Hi Dana, saw Harbor has three suites turning over. We wire build-outs in 10 days…</p>
      </div>
      <div className="mt-3 border border-ink-950 bg-[var(--bg-tint)] p-4">
        <p className="mono text-[10px] uppercase tracking-[0.08em] text-[var(--accent-text)]">Reply · Tue 10:47am</p>
        <p className="mt-1.5 text-[13px]">&ldquo;Good timing. Can you walk suite 210 Thursday?&rdquo;</p>
      </div>
      <p className="mt-3 flex items-center gap-2 text-[12.5px] text-[var(--text-secondary)]"><Calendar className="w-3.5 h-3.5" /> Walk-through booked Thu 9:00am · you were pinged</p>
    </Frame>
  );
}

function SpeedToLead() {
  const msgs: [boolean, string, string][] = [
    [false, "Missed call · (561) •••-8214", "8:42pm"],
    [true, "Hi, sorry we missed you! What's going on with the roof?", "8:42pm"],
    [false, "Leak over the garage, worse when it rains", "8:44pm"],
    [true, "We can be out Thursday 10am or 3:30pm. Which works?", "8:44pm"],
    [false, "10 works", "8:45pm"],
  ];
  return (
    <Frame title="Speed-to-Lead Bot · text thread" status="booked in 2m 12s">
      <ul className="space-y-2">{msgs.map(([bot, t, at], i) => (
        <li key={i} className={cn("flex", bot ? "justify-end" : "justify-start")}>
          <span className={cn("max-w-[82%] px-3 py-2 text-[13px] leading-snug", bot ? "bg-ink-950 text-white" : "bg-[var(--bg-alt)]", i === 0 && "flex items-center gap-2 text-[var(--text-secondary)]")}>
            {i === 0 && <Phone className="w-3.5 h-3.5" />}{t}
            <span className={cn("block mono text-[9px] mt-1", bot ? "text-ink-400" : "text-[var(--text-muted)]")}>{at}</span>
          </span>
        </li>
      ))}</ul>
      <p className="mt-3 flex items-center gap-2 text-[12.5px] font-medium text-[var(--accent-text)]"><Check className="w-4 h-4" strokeWidth={2.5} /> Booked Thu 10:00am · saved to your CRM</p>
    </Frame>
  );
}

function Crm() {
  const cols: [string, string[]][] = [
    ["New lead", ["Reyes · AC repair", "Kim · panel upgrade"]],
    ["Estimate", ["Ortiz · re-roof", "Patel · water heater"]],
    ["Booked", ["Lee · duct cleaning"]],
    ["Won", ["Grant · remodel"]],
  ];
  return (
    <Frame title="CRM Bot · pipeline" status="synced 1m ago">
      <div className="grid grid-cols-4 gap-2">
        {cols.map(([c, cards]) => (
          <div key={c}>
            <p className="mono text-[9.5px] uppercase tracking-[0.08em] text-[var(--text-muted)] pb-2">{c}</p>
            <div className="space-y-1.5">{cards.map((k) => (
              <div key={k} className={cn("border px-2 py-2 text-[11.5px] leading-snug", c === "Won" ? "border-ink-950 bg-[var(--bg-tint)]" : "border-[var(--border)]")}>{k}</div>
            ))}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[12.5px] text-[var(--text-secondary)]">Call with Ortiz logged → moved to Estimate, follow-up set for Friday</p>
    </Frame>
  );
}

function Proposal() {
  const lines = [["Tear-off and disposal", "$3,200"], ["Architectural shingles · 24 sq", "$9,850"], ["Ridge vent + flashing", "$1,140"]];
  return (
    <Frame title="Proposal Bot · quote #1042" status="opened 2×">
      <div className="flex items-start justify-between gap-4">
        <div><p className="flex items-center gap-2 text-[13px] font-semibold"><FileText className="w-4 h-4" /> Ortiz residence · re-roof</p><p className="text-[12px] text-[var(--text-secondary)] mt-0.5">Sent 41 minutes after the site visit</p></div>
        <Tag tone="dark">awaiting signature</Tag>
      </div>
      <ul className="mt-4">{lines.map(([l, v]) => <Row key={l}><span>{l}</span><span className="tabular-nums">{v}</span></Row>)}</ul>
      <div className="mt-2 flex justify-between text-[14px] font-semibold"><span>Total</span><span className="tabular-nums">$14,190</span></div>
      <p className="mt-4 text-[12.5px] text-[var(--text-secondary)]">Opened twice tonight → friendly follow-up queued for 9am</p>
    </Frame>
  );
}

function Reviews() {
  const reviews: [number, string, string, boolean][] = [
    [5, "Maria G.", "Showed up on time, fixed the leak same day.", true],
    [5, "Devon R.", "Fair price and they cleaned up everything.", true],
    [3, "Private check-in", "Tech was late. Sent to the owner first.", false],
  ];
  return (
    <Frame title="Reviews Bot · this week" status="4.8★ · 112 reviews">
      <ul className="space-y-3">{reviews.map(([n, who, t, pub]) => (
        <li key={who} className={cn("border p-3", pub ? "border-[var(--border)]" : "border-ink-950 bg-[var(--bg-alt)]")}>
          <div className="flex items-center justify-between gap-3">
            <span className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn("w-3.5 h-3.5", i < n ? "fill-[var(--color-accent-500)] text-[var(--color-accent-500)]" : "text-[var(--border-strong)]")} />)}</span>
            <Tag tone={pub ? "good" : "dark"}>{pub ? "replied" : "routed to you"}</Tag>
          </div>
          <p className="mt-1.5 text-[13px]"><b>{who}</b> · {t}</p>
        </li>
      ))}</ul>
    </Frame>
  );
}

function Reactivation() {
  const rows: [string, string, string][] = [
    ["AC tune-up reminder", "86 customers", "11 booked"],
    ["Old estimates · spring", "12 quotes", "2 revived"],
    ["Water heater · 8+ years old", "34 customers", "4 replies"],
    ["Dryer vent · annual", "51 customers", "queued"],
  ];
  return (
    <Frame title="Reactivation Bot · fall campaigns" status="$0 ad spend">
      <ul>{rows.map(([c, n, r]) => (
        <Row key={c}><span className="min-w-0"><span className="block font-medium truncate">{c}</span><span className="block text-[12px] text-[var(--text-secondary)]">{n}</span></span><Tag tone={r === "queued" ? "muted" : "good"}>{r}</Tag></Row>
      ))}</ul>
      <p className="mt-3 flex items-center gap-2 text-[12.5px] text-[var(--text-secondary)]"><Calendar className="w-3.5 h-3.5" /> &ldquo;Yes, next week works&rdquo; → booked Thu 2:00pm</p>
    </Frame>
  );
}

const VISUALS: Record<string, () => React.ReactNode> = {
  "paid-media": Ads, seo: Seo, content: Content, email: Email, cro: Cro, analytics: Analytics,
  "lead-generation": Prospecting, outbound: Outbound, inbound: SpeedToLead, crm: Crm,
  enablement: Proposal, reviews: Reviews, reactivation: Reactivation,
};

export function OfferVisual({ slug }: { slug: string }) {
  const V = VISUALS[slug];
  return V ? <V /> : null;
}
