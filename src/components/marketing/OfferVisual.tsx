import { cn } from "@/lib/utils";

/**
 * Minimal hero chart, one per offer: a single headline number, one line of
 * context, one quiet chart that draws itself once on load. Light surface,
 * hairline grid, the brand green as the only data color. Pure SVG + CSS
 * (no client JS); prefers-reduced-motion shows the finished state.
 */

type Spec = {
  label: string;
  value: string;
  delta: string;
  caption: string;
  kind: "line" | "bars";
  series: number[];
  /** Lower is better (cost, response time): the line falls. */
  axis: [string, string];
};

const SPECS: Record<string, Spec> = {
  "paid-media":      { label: "Paid-media change control", value: "Approved", delta: "Budget authority remains explicit", caption: "Analysis → proposal → approval → record", kind: "line", series: [1, 2, 2, 3, 4, 4, 5, 6], axis: ["Signal", "Decision record"] },
  seo:               { label: "Search operating roadmap", value: "Defined", delta: "Publishing remains approval-gated", caption: "Monitoring → priority → review → publish", kind: "line", series: [1, 1, 2, 3, 3, 4, 5, 6], axis: ["Observation", "Recorded action"] },
  content:           { label: "Editorial workflow", value: "Governed", delta: "Approved sources and review stages", caption: "Source → draft → review → distribution", kind: "line", series: [1, 2, 2, 3, 4, 5, 5, 6], axis: ["Source", "Distribution"] },
  email:             { label: "Lifecycle communication", value: "Controlled", delta: "Consent and suppression enforced", caption: "Audience → approval → delivery → response", kind: "bars", series: [1, 2, 3, 4, 5, 6], axis: ["Audience", "Handoff"] },
  cro:               { label: "Experiment program", value: "Documented", delta: "Implementation separately approved", caption: "Observe → prioritize → test → decide", kind: "line", series: [1, 2, 2, 3, 4, 4, 5, 6], axis: ["Hypothesis", "Decision"] },
  analytics:         { label: "Management reporting", value: "Reviewable", delta: "Definitions and assumptions remain visible", caption: "Source → reconcile → exception → report", kind: "bars", series: [1, 2, 3, 4, 5, 6], axis: ["Source", "Management view"] },
  "lead-generation": { label: "Prospecting mandate", value: "Qualified", delta: "ICP and budgets govern research", caption: "Market → account → buyer → handoff", kind: "bars", series: [1, 2, 3, 4, 5, 6], axis: ["Market", "Governed handoff"] },
  outbound:          { label: "Outbound authority", value: "Approved", delta: "Suppression checked before delivery", caption: "Audience → draft → approve → route", kind: "bars", series: [1, 2, 3, 4, 5, 6], axis: ["Audience", "Reply routing"] },
  inbound:           { label: "Inbound operating path", value: "Scoped", delta: "Channels and service levels are explicit", caption: "Signal → qualify → schedule → record", kind: "line", series: [1, 2, 2, 3, 4, 5, 5, 6], axis: ["Signal", "System of record"] },
  crm:               { label: "CRM write authority", value: "Controlled", delta: "Updates follow the approval policy", caption: "Detect → prepare → approve → write", kind: "line", series: [1, 1, 2, 3, 4, 4, 5, 6], axis: ["Exception", "Recorded update"] },
  enablement:        { label: "Proposal workflow", value: "Governed", delta: "Scope and pricing use approved inputs", caption: "Inputs → draft → review → deliver", kind: "line", series: [1, 2, 2, 3, 4, 5, 5, 6], axis: ["Approved inputs", "Status handoff"] },
  reviews:           { label: "Customer-care workflow", value: "Approved", delta: "Sensitive feedback routes to people", caption: "Eligibility → draft → review → publish", kind: "line", series: [1, 2, 2, 3, 4, 4, 5, 6], axis: ["Eligibility", "Recorded action"] },
  reactivation:      { label: "Reactivation mandate", value: "Eligible", delta: "History, consent and timing govern action", caption: "Review → segment → approve → route", kind: "bars", series: [1, 2, 3, 4, 5, 6], axis: ["History", "Response routing"] },
};

const W = 480, H = 160, PAD = 4;

function Line({ data }: { data: number[] }) {
  const lo = Math.min(...data), hi = Math.max(...data);
  const x = (i: number) => PAD + (i * (W - PAD * 2)) / (data.length - 1);
  const y = (v: number) => PAD + (1 - (v - lo) / (hi - lo || 1)) * (H - PAD * 2);
  const d = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const last = data.length - 1;
  return (
    <>
      <path d={`${d} L${x(last)} ${H} L${x(0)} ${H} Z`} fill="var(--color-accent-500)" className="ov-fade" opacity="0.07" />
      <path d={d} pathLength={1} fill="none" stroke="var(--color-accent-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ov-draw" vectorEffect="non-scaling-stroke" />
    </>
  );
}

function Bars({ data }: { data: number[] }) {
  const hi = Math.max(...data);
  const step = W / data.length, bw = step * 0.42;
  return (
    <>
      {data.map((v, i) => {
        const h = (v / hi) * (H - PAD);
        return (
          <rect
            key={i}
            x={step * i + (step - bw) / 2}
            y={H - h}
            width={bw}
            height={h}
            fill="var(--color-accent-500)"
            opacity={i === data.length - 1 ? 1 : 0.28}
            className="ov-grow"
            style={{ animationDelay: `${i * 60}ms` }}
          />
        );
      })}
    </>
  );
}

export function OfferVisual({ slug }: { slug: string }) {
  const s = SPECS[slug];
  if (!s) return null;
  return (
    <figure className="bg-white border border-[var(--border)] shadow-lift p-7 sm:p-8">
      <p className="text-[13px] text-[var(--text-secondary)]">{s.label}</p>
      <p className="mt-2 text-[2.75rem] font-semibold tracking-[-0.04em] leading-none tabular-nums text-[var(--foreground)]">{s.value}</p>
      <p className="mt-2 text-[13px] text-[var(--accent-text)]">{s.delta}</p>

      <div className="relative mt-8">
        {/* hairline grid */}
        <div aria-hidden className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3].map((i) => <span key={i} className="h-px bg-[var(--border)]" />)}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={cn("relative block w-full h-[160px] overflow-visible")} role="img"
          aria-label={`${s.label}: ${s.value}, ${s.delta}`}>
          {s.kind === "line" ? <Line data={s.series} /> : <Bars data={s.series} />}
        </svg>
        {s.kind === "line" && (() => {
          const lo = Math.min(...s.series), hi = Math.max(...s.series);
          const v = s.series[s.series.length - 1];
          const top = ((PAD + (1 - (v - lo) / (hi - lo || 1)) * (H - PAD * 2)) / H) * 100;
          return (
            <span aria-hidden className="ov-dot absolute h-2.5 w-2.5 rounded-full bg-[var(--color-accent-500)] ring-2 ring-white -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${((W - PAD) / W) * 100}%`, top: `${top}%` }} />
          );
        })()}
      </div>
      <div className="mt-3 flex justify-between text-[12px] text-[var(--text-muted)]">
        <span>{s.axis[0]}</span><span>{s.axis[1]}</span>
      </div>

      <figcaption className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between gap-4 text-[12px] text-[var(--text-muted)]">
        <span>{s.caption}</span>
        <span>Illustrative</span>
      </figcaption>
    </figure>
  );
}
