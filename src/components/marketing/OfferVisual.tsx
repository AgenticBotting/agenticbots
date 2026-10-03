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
  "paid-media":      { label: "Cost per booked job", value: "$80", delta: "down 41% in 12 weeks", caption: "Search terms reviewed daily", kind: "line", series: [136, 131, 119, 108, 101, 96, 92, 88, 86, 84, 81, 80], axis: ["Week 1", "Week 12"] },
  seo:               { label: "Calls from Google", value: "61/mo", delta: "up from 18", caption: "Rankings checked daily", kind: "line", series: [18, 19, 22, 24, 27, 31, 35, 40, 44, 49, 55, 61], axis: ["Week 1", "Week 12"] },
  content:           { label: "Profile views", value: "8.4k", delta: "up 3.1× in 12 weeks", caption: "Posts published every week", kind: "line", series: [2.1, 2.3, 2.2, 2.9, 3.4, 3.9, 4.6, 5.2, 6.1, 6.8, 7.5, 8.4], axis: ["Week 1", "Week 12"] },
  email:             { label: "Quote reply rate", value: "26%", delta: "up from 8%", caption: "Every open quote followed up", kind: "bars", series: [8, 11, 13, 16, 18, 21, 23, 26], axis: ["Week 1", "Week 8"] },
  cro:               { label: "Form conversion", value: "5.4%", delta: "up from 3.1%", caption: "Tests run to significance", kind: "line", series: [3.1, 3.3, 3.6, 4.0, 4.3, 4.6, 4.8, 5.0, 5.1, 5.3, 5.4, 5.4], axis: ["Day 1", "Day 12"] },
  analytics:         { label: "Booked jobs per week", value: "31", delta: "up from 19", caption: "One report every Monday", kind: "bars", series: [19, 21, 20, 24, 23, 26, 25, 31], axis: ["Week 1", "Week 8"] },
  "lead-generation": { label: "Verified accounts", value: "42", delta: "delivered this week", caption: "Property managers, GCs, facilities", kind: "bars", series: [18, 24, 27, 31, 33, 36, 39, 42], axis: ["Week 1", "Week 8"] },
  outbound:          { label: "Positive replies", value: "9/wk", delta: "up from 2", caption: "Walk-throughs booked automatically", kind: "bars", series: [2, 3, 3, 5, 4, 6, 7, 9], axis: ["Week 1", "Week 8"] },
  inbound:           { label: "Median first reply", value: "38s", delta: "down from 3h 12m", caption: "Every call, form and text", kind: "line", series: [192, 120, 64, 22, 6, 2, 1.2, 0.9, 0.7, 0.66, 0.64, 0.63], axis: ["Before", "With the bot"] },
  crm:               { label: "Open pipeline", value: "$184k", delta: "every job up to date", caption: "Logged without anyone typing", kind: "line", series: [118, 124, 129, 133, 140, 146, 151, 158, 164, 171, 178, 184], axis: ["Week 1", "Week 12"] },
  enablement:        { label: "Time to quote", value: "41 min", delta: "down from 3.2 days", caption: "Followed up until signed", kind: "line", series: [77, 70, 58, 44, 30, 18, 9, 4, 2, 1.2, 0.8, 0.7], axis: ["Week 1", "Week 12"] },
  reviews:           { label: "Google rating", value: "4.8★", delta: "112 reviews, up from 64", caption: "Every finished job asked", kind: "line", series: [64, 66, 69, 74, 80, 87, 93, 99, 104, 108, 112], axis: ["April", "September"] },
  reactivation:      { label: "Revenue from past customers", value: "$38k", delta: "this season, no ad spend", caption: "Reminders timed to the season", kind: "bars", series: [2.1, 4.3, 3.8, 5.6, 6.4, 4.9, 5.5, 5.8], axis: ["Week 1", "Week 8"] },
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
