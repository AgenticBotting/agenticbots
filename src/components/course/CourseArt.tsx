/**
 * The art for the course page, drawn rather than photographed.
 *
 * Every scene shows the actual artefact a module produces — a config
 * file, a morning report, a spend cap, the repo — because a photograph of
 * someone at a laptop tells a buyer nothing about what they are buying.
 * House rule on this site: coded scenes for systems, photography only for
 * humans and places, and there are neither on this page.
 *
 * All five are static markup. No canvas, no images, nothing to load.
 */

/* ── 01 · what this costs today ─────────────────────────────────── */

const COSTS = [
  { label: "Agency retainer", amount: "$1,500–3,000/mo", width: 100, tone: "flat" },
  { label: "Freelance audit", amount: "$400–800/mo", width: 34, tone: "flat" },
  { label: "Your own 5 hrs/wk", amount: "~$1,000/mo", width: 44, tone: "flat" },
  { label: "This course", amount: "$49 once", width: 3, tone: "accent" },
];

export function CostChart() {
  return (
    <figure className="border border-[var(--border)] bg-[var(--background)] p-6">
      <figcaption className="flex items-baseline justify-between gap-3 pb-4 border-b border-[var(--border)]">
        <span className="eyebrow">Cost of the daily review</span>
        <span className="mono text-[10.5px] text-[var(--text-muted)]">per month</span>
      </figcaption>

      <ul className="mt-5 space-y-4">
        {COSTS.map((row) => (
          <li key={row.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13.5px] font-semibold">{row.label}</span>
              <span
                className={`mono text-[12px] tabular-nums ${
                  row.tone === "accent" ? "text-[var(--accent-text)]" : "text-[var(--text-secondary)]"
                }`}
              >
                {row.amount}
              </span>
            </div>
            {/* The last bar is deliberately a sliver — the comparison is
                the argument, so it is drawn to scale rather than styled
                into a shape that flatters us. */}
            <div className="mt-1.5 h-2.5 bg-[var(--bg-sunk,#F1F4EF)]">
              <div
                className={`h-full ${row.tone === "accent" ? "bg-[var(--color-accent-500)]" : "bg-[var(--color-ink-700)]"}`}
                style={{ width: `${row.width}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <p className="body-xs mt-5 pt-4 border-t border-[var(--border)]">
        Drawn to scale. The course bar is 3% of the retainer bar.
      </p>
    </figure>
  );
}

/* ── 02 · the account as a file ─────────────────────────────────── */

export function ConfigScene() {
  return (
    <figure className="grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3 items-center">
      {/* The file you edit */}
      <div className="border border-[var(--border)] bg-[var(--color-ink-950)] min-w-0">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--dark-border)]">
          <span className="mono text-[10px] text-[var(--color-ink-400)]">campaign.yaml</span>
          <span className="mono text-[10px] text-[var(--color-accent-300)]">edited</span>
        </div>
        <pre className="overflow-x-auto p-3 text-[10.5px] leading-[1.7] mono text-[var(--color-ink-200)]">
{`campaign: Emergency Repair
budget: 120/day
locations: [Miami, Hialeah]
ad_groups:
  - name: Roof Leak
    keywords:
      - [exact] roof leak repair
      - [phrase] emergency roofer
    ads:
      - h1: Roof Leak? We Answer
        h2: 24/7 · Licensed`}
        </pre>
      </div>

      {/* The one command between them */}
      <div className="flex sm:flex-col items-center justify-center gap-2 py-2">
        <span className="mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] whitespace-nowrap">
          ads build
        </span>
        <span className="text-[var(--color-accent-500)] text-[18px] leading-none rotate-90 sm:rotate-0">→</span>
      </div>

      {/* What exists afterwards */}
      <div className="border border-[var(--border)] bg-[var(--background)] min-w-0">
        <div className="px-3 py-1.5 border-b border-[var(--border)] bg-[var(--bg-alt)]">
          <span className="mono text-[10px] text-[var(--text-muted)]">in the account</span>
        </div>
        <ul className="p-3 space-y-1.5 text-[12px]">
          {[
            { depth: 0, label: "Emergency Repair", meta: "campaign" },
            { depth: 1, label: "Roof Leak", meta: "ad group" },
            { depth: 2, label: "2 keywords", meta: "exact · phrase" },
            { depth: 2, label: "1 responsive ad", meta: "2 headlines" },
            { depth: 1, label: "$120/day", meta: "budget" },
          ].map((row) => (
            <li
              key={row.label}
              className="flex items-baseline justify-between gap-2"
              style={{ paddingLeft: `${row.depth * 12}px` }}
            >
              <span className="flex items-baseline gap-1.5 min-w-0">
                <span className="h-1 w-1 bg-[var(--color-accent-500)] shrink-0" />
                <span className="truncate font-medium">{row.label}</span>
              </span>
              <span className="mono text-[10px] text-[var(--text-muted)] shrink-0">{row.meta}</span>
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}

/* ── 03 · the morning report ────────────────────────────────────── */

export function ReportScene() {
  return (
    <figure className="border border-[var(--border)] bg-[var(--background)]">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-alt)]">
        <span className="text-[12.5px] font-semibold">Ridgeline — yesterday</span>
        <span className="mono text-[10px] text-[var(--text-muted)]">06:00</span>
      </div>

      <div className="grid grid-cols-3 gap-px bg-[var(--border)]">
        {[
          { v: "$284", l: "spent", delta: "−12%" },
          { v: "9", l: "calls", delta: "+2" },
          { v: "$31", l: "per call", delta: "−18%" },
        ].map((stat) => (
          <div key={stat.l} className="bg-[var(--background)] p-4">
            <p className="text-[22px] font-semibold tracking-[-0.04em] leading-none tabular-nums">{stat.v}</p>
            <p className="body-xs mt-1.5">{stat.l}</p>
            <p className="mono text-[10.5px] text-[var(--accent-text)] mt-0.5">{stat.delta}</p>
          </div>
        ))}
      </div>

      <div className="p-4 space-y-2.5">
        <p className="eyebrow">What changed</p>
        {[
          "Negated 12 terms that never convert — saves ~$63/day",
          "Moved $40/day into Emergency Repair (3.1x ROAS)",
          "Gutter Cleaning is over its cap — waiting on you",
        ].map((line, index) => (
          <p key={line} className="flex gap-2.5 text-[13px] leading-snug">
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 ${
                index === 2 ? "bg-[#B45309]" : "bg-[var(--color-accent-500)]"
              }`}
            />
            <span>{line}</span>
          </p>
        ))}
      </div>
    </figure>
  );
}

/* ── 04 · guardrails ────────────────────────────────────────────── */

export function GuardrailScene() {
  return (
    <figure className="border border-[var(--border)] bg-[var(--background)] p-6">
      <p className="eyebrow">Spend caps · enforced in code</p>

      <ul className="mt-5 space-y-4">
        {[
          { label: "Daily budget change", used: 62, cap: "±20% / day", ok: true },
          { label: "New keywords", used: 40, cap: "15 / day", ok: true },
          { label: "Campaign pause", used: 100, cap: "needs you", ok: false },
        ].map((rule) => (
          <li key={rule.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13.5px] font-semibold">{rule.label}</span>
              <span className={`mono text-[11px] ${rule.ok ? "text-[var(--text-muted)]" : "text-[#B45309]"}`}>
                {rule.cap}
              </span>
            </div>
            <div className="mt-1.5 h-2 bg-[var(--bg-sunk,#F1F4EF)] relative">
              <div
                className={`h-full ${rule.ok ? "bg-[var(--color-accent-500)]" : "bg-[#B45309]"}`}
                style={{ width: `${rule.used}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      {/* The approval queue is the point: an agent that asks is an agent
          you can leave running. */}
      <div className="mt-5 pt-4 border-t border-[var(--border)]">
        <p className="eyebrow">Waiting for a human</p>
        <div className="mt-2.5 flex items-center justify-between gap-3 border border-[var(--border)] bg-[var(--bg-alt)] px-3 py-2.5">
          <span className="text-[12.5px] min-w-0">
            <span className="block font-semibold truncate">Pause &quot;Gutter Cleaning&quot;</span>
            <span className="block body-xs">$0 conversions in 14 days · $210 spent</span>
          </span>
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="mono text-[10px] uppercase tracking-[0.08em] border border-[var(--border-strong)] px-1.5 py-1">
              Approve
            </span>
            <span className="mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)] px-1.5 py-1">
              Skip
            </span>
          </span>
        </div>
      </div>
    </figure>
  );
}

/* ── 05 · what you clone ────────────────────────────────────────── */

const TREE = [
  { depth: 0, name: "google-ads-agent/", note: "" },
  { depth: 1, name: "auth/", note: "refresh tokens that last" },
  { depth: 1, name: "build/", note: "campaign.yaml → account" },
  { depth: 1, name: "report/", note: "the 06:00 email" },
  { depth: 1, name: "daily/", note: "search terms, budgets, ads" },
  { depth: 1, name: "guardrails/", note: "caps and approvals" },
  { depth: 1, name: ".claude/skills/", note: "the Claude Code skill" },
  { depth: 1, name: "templates/", note: "queries, naming, checklists" },
];

export function RepoScene() {
  return (
    <figure className="border border-[var(--border)] bg-[var(--color-ink-950)]">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--dark-border)]">
        <span className="mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--color-ink-400)]">
          included · clone on day one
        </span>
        <span className="mono text-[10.5px] text-[var(--color-accent-300)]">node + python</span>
      </div>

      <ul className="p-4 space-y-1.5">
        {TREE.map((row) => (
          <li
            key={row.name}
            className="flex items-baseline justify-between gap-3 text-[12.5px]"
            style={{ paddingLeft: `${row.depth * 14}px` }}
          >
            <span className="mono text-[var(--color-ink-200)]">{row.name}</span>
            {row.note && (
              <span className="mono text-[10.5px] text-[var(--color-ink-400)] text-right">{row.note}</span>
            )}
          </li>
        ))}
      </ul>
    </figure>
  );
}
