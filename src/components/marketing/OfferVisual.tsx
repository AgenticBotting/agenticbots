import { Check, Phone, Star, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One signature dashboard per offer, used as the service hero visual.
 * Dark "instrument panel" surface, brand green as the single data hue,
 * neutral gray for baselines/"before". Thin marks, 2px lines, rounded
 * data-ends, recessive grid, native <title> hovers on every mark.
 * Coded SVG, server-rendered, ILLUSTRATIVE data — labeled in-frame.
 */

const G = "var(--color-accent-500)";     // data
const GL = "var(--color-accent-300)";    // highlight / end dot
const GRAY = "var(--color-ink-500)";     // baseline / before
const GRID = "var(--color-ink-700)";
const TXT = "var(--color-ink-400)";

/* ─────────────────────────────── shell ─────────────────────────────── */

function Frame({ title, status, children }: { title: string; status: string; children: React.ReactNode }) {
  return (
    <figure className="relative bg-ink-950 border border-ink-700 shadow-lift on-dark overflow-hidden">
      {/* soft green glow behind the data */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[var(--color-accent-500)] opacity-[0.10] blur-3xl" />
      <div className="relative flex items-center justify-between gap-4 px-5 h-11 border-b border-ink-700">
        <span className="flex items-center gap-2 min-w-0">
          <span className="h-1.5 w-1.5 shrink-0 bg-accent-400 animate-pulse-dot" />
          <span className="text-[12.5px] font-semibold tracking-[-0.01em] text-white truncate">{title}</span>
        </span>
        <span className="mono text-[10px] uppercase tracking-[0.1em] text-ink-400 shrink-0">{status}</span>
      </div>
      <div className="relative p-5 space-y-5">{children}</div>
      <figcaption className="relative px-5 py-2 border-t border-ink-700 mono text-[9.5px] uppercase tracking-[0.1em] text-ink-400">
        Illustrative data · how the dashboard reads when it runs
      </figcaption>
    </figure>
  );
}

/* ───────────────────────────── primitives ──────────────────────────── */

/** Hero number with a delta chip. `good` decides the chip tone, not the sign. */
function Kpi({ label, value, unit, delta, good = true, big }: {
  label: string; value: string; unit?: string; delta?: string; good?: boolean; big?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="mono text-[9.5px] uppercase tracking-[0.1em] text-ink-400 truncate">{label}</p>
      <p className="mt-1.5 flex items-baseline gap-1">
        <span className={cn("font-semibold tracking-[-0.045em] leading-none tabular-nums text-white", big ? "text-[2.6rem]" : "text-[1.6rem]")}>{value}</span>
        {unit && <span className={cn("font-semibold tracking-[-0.02em] text-accent-400", big ? "text-[1.2rem]" : "text-[0.95rem]")}>{unit}</span>}
      </p>
      {delta && (
        <span className={cn(
          "mt-2 inline-flex items-center gap-1 mono text-[10px] tabular-nums px-1.5 py-0.5",
          good ? "bg-[color-mix(in_oklab,var(--color-accent-500)_18%,transparent)] text-accent-300" : "bg-ink-800 text-ink-300",
        )}>
          {delta}
        </span>
      )}
    </div>
  );
}

function KpiRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-4 pb-5 border-b border-ink-800">{children}</div>;
}

/** Area + 2px line, end dot with a surface ring. Values plotted left→right. */
function AreaLine({ data, height = 96, base, labels, invert, id, unit = "" }: {
  data: number[]; height?: number; base?: number[]; labels?: string[]; invert?: boolean; id: string; unit?: string;
}) {
  const W = 320, H = height, P = 6;
  const all = [...data, ...(base ?? [])];
  const lo = Math.min(...all), hi = Math.max(...all);
  const x = (i: number) => P + (i * (W - P * 2)) / (data.length - 1);
  const y = (v: number) => {
    const t = (v - lo) / (hi - lo || 1);
    return P + (invert ? t : 1 - t) * (H - P * 2 - 14);
  };
  const path = (d: number[]) => d.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${path(data)} L${x(data.length - 1)} ${H - 14} L${x(0)} ${H - 14} Z`;
  const last = data.length - 1;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img">
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={G} stopOpacity="0.45" />
          <stop offset="100%" stopColor={G} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t} x1={P} x2={W - P} y1={P + t * (H - P * 2 - 14)} y2={P + t * (H - P * 2 - 14)} stroke={GRID} strokeDasharray="2 4" />
      ))}
      {base && <path d={path(base)} fill="none" stroke={GRAY} strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />}
      <path d={area} fill={`url(#g-${id})`} />
      <path d={path(data)} fill="none" stroke={G} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="9" fill="transparent"><title>{`${labels?.[i] ?? `#${i + 1}`}: ${v}${unit}`}</title></circle>
      ))}
      <circle cx={x(last)} cy={y(data[last])} r="4.5" fill={GL} stroke="var(--color-ink-950)" strokeWidth="2" />
      {labels && [0, Math.floor(last / 2), last].map((i) => (
        <text key={i} x={x(i)} y={H - 2} textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"} fontSize="9" fontFamily="var(--font-mono)" fill={TXT}>{labels[i]}</text>
      ))}
    </svg>
  );
}

/** Vertical bars: 4px rounded data-end, 2px gaps via thin bars, last bar highlighted. */
function Columns({ data, labels, height = 92, unit = "", highlightLast = true }: {
  data: number[]; labels: string[]; height?: number; unit?: string; highlightLast?: boolean;
}) {
  const W = 320, H = height, B = 14;
  const max = Math.max(...data);
  const step = W / data.length, bw = Math.min(26, step - 6);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img">
      <line x1="0" x2={W} y1={H - B} y2={H - B} stroke={GRID} />
      {data.map((v, i) => {
        const h = Math.max(3, (v / max) * (H - B - 14));
        const cx = step * i + step / 2;
        const hot = highlightLast && i === data.length - 1;
        return (
          <g key={i}>
            <title>{`${labels[i]}: ${v}${unit}`}</title>
            <path d={`M${cx - bw / 2} ${H - B} V${H - B - h + 4} Q${cx - bw / 2} ${H - B - h} ${cx - bw / 2 + 4} ${H - B - h} H${cx + bw / 2 - 4} Q${cx + bw / 2} ${H - B - h} ${cx + bw / 2} ${H - B - h + 4} V${H - B} Z`}
              fill={hot ? GL : G} opacity={hot ? 1 : 0.55} />
            {hot && <text x={cx} y={H - B - h - 4} textAnchor="middle" fontSize="10" fontWeight="600" fill="white" fontFamily="var(--font-mono)">{v}{unit}</text>}
            <text x={cx} y={H - 2} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill={TXT}>{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Horizontal bars with values; `muted` rows draw in neutral gray. */
function HBars({ rows, unit = "", max }: { rows: { label: string; value: number; muted?: boolean; note?: string; display?: string }[]; unit?: string; max?: number }) {
  const m = max ?? Math.max(...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[96px_1fr_auto] items-center gap-3" title={`${r.label}: ${unit === "$" ? "$" : ""}${r.value}${unit !== "$" ? unit : ""}`}>
          <span className="text-[12px] text-ink-300 truncate">{r.label}</span>
          <span className="h-[7px] bg-ink-800">
            <span className="block h-full rounded-r-[4px]" style={{ width: `${(r.value / m) * 100}%`, background: r.muted ? GRAY : G }} />
          </span>
          <span className="text-[12px] tabular-nums text-white text-right min-w-[44px]">
            {r.display ?? <>{unit === "$" ? "$" : ""}{r.value.toLocaleString("en-US")}{unit !== "$" ? unit : ""}</>}
            {r.note && <span className="ml-1.5 mono text-[9.5px] text-ink-400">{r.note}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Progress ring. */
function Ring({ pct, label, sub, size = 86 }: { pct: number; label: string; sub?: string; size?: number }) {
  const r = 34, c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 86 86" width={size} height={size} role="img" className="shrink-0">
        <title>{`${label}: ${pct}%`}</title>
        <circle cx="43" cy="43" r={r} fill="none" stroke="var(--color-ink-800)" strokeWidth="8" />
        <circle cx="43" cy="43" r={r} fill="none" stroke={G} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`} transform="rotate(-90 43 43)" />
        <text x="43" y="48" textAnchor="middle" fontSize="17" fontWeight="600" fill="white" className="tabular-nums">{pct}%</text>
      </svg>
      <div>
        <p className="text-[13px] font-medium text-white">{label}</p>
        {sub && <p className="text-[12px] text-ink-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const Legend = ({ items }: { items: { label: string; gray?: boolean; dashed?: boolean }[] }) => (
  <div className="flex items-center gap-4">
    {items.map((it) => (
      <span key={it.label} className="flex items-center gap-1.5 mono text-[9.5px] uppercase tracking-[0.08em] text-ink-400">
        <svg width="16" height="4" aria-hidden>
          <line x1="1" x2="15" y1="2" y2="2" stroke={it.gray || it.dashed ? GRAY : G} strokeWidth="2" strokeLinecap="round" strokeDasharray={it.dashed ? "3 3" : undefined} />
        </svg>
        {it.label}
      </span>
    ))}
  </div>
);

const SubHead = ({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) => (
  <div className="flex items-baseline justify-between gap-3 mb-2">
    <p className="mono text-[9.5px] uppercase tracking-[0.1em] text-ink-400">{children}</p>
    {right}
  </div>
);

const W12 = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"];

/* ───────────────────────────── the 13 views ────────────────────────── */

function Ads() {
  return (
    <Frame title="Ads Bot · Google Ads + LSA" status="214 terms read today">
      <KpiRow>
        <Kpi label="Cost / booked job" value="$80" delta="▼ 41% vs wk 1" />
        <Kpi label="Booked jobs" value="23" unit="/wk" delta="▲ 9" />
        <Kpi label="Wasted spend" value="$0" delta="▼ $612 cut" />
      </KpiRow>
      <div>
        <SubHead right={<Legend items={[{ label: "Cost / booked job" }]} />}>12 weeks under management</SubHead>
        <AreaLine id="ads" data={[136, 131, 119, 108, 101, 96, 92, 88, 86, 84, 81, 80]} labels={W12} unit="" invert={false} />
      </div>
      <ul className="space-y-1.5 text-[12px]">
        {[["emergency roof leak repair", "$64 / job", true], ["roofing jobs hiring", "negative added", false]].map(([t, v, ok]) => (
          <li key={t as string} className="flex justify-between gap-3">
            <span className={cn("truncate", ok ? "text-ink-200" : "text-ink-500 line-through")}>{t}</span>
            <span className={cn("mono text-[10px] tabular-nums", ok ? "text-accent-300" : "text-ink-400")}>{v}</span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

function Seo() {
  const rows: [string, number, number, number[]][] = [
    ["roofer west palm beach", 14, 3, [14, 12, 11, 8, 6, 4, 3]],
    ["emergency roof repair", 22, 6, [22, 20, 15, 12, 9, 7, 6]],
    ["metal roof installation", 31, 9, [31, 28, 22, 18, 13, 11, 9]],
  ];
  return (
    <Frame title="SEO Bot · rank tracker" status="checked daily">
      <KpiRow>
        <Kpi label="Avg position" value="3.2" delta="▲ from 14.8" />
        <Kpi label="Map pack" value="Top 3" delta="▲ 4 terms" />
        <Kpi label="Organic calls" value="61" unit="/mo" delta="▲ 2.6×" />
      </KpiRow>
      <div>
        <SubHead>Organic calls · 12 weeks</SubHead>
        <AreaLine id="seo" data={[18, 19, 22, 24, 27, 31, 35, 40, 44, 49, 55, 61]} labels={W12} />
      </div>
      <ul className="divide-y divide-ink-800">
        {rows.map(([t, a, b, d]) => (
          <li key={t} className="grid grid-cols-[1fr_64px_auto] items-center gap-3 py-2">
            <span className="text-[12px] text-ink-200 truncate">{t}</span>
            <MiniSpark data={d} invert />
            <span className="mono text-[11px] tabular-nums"><span className="text-ink-500">{a} → </span><span className="text-accent-300 font-semibold">#{b}</span></span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

function MiniSpark({ data, invert }: { data: number[]; invert?: boolean }) {
  const W = 64, H = 18;
  const lo = Math.min(...data), hi = Math.max(...data);
  const pts = data.map((v, i) => {
    const t = (v - lo) / (hi - lo || 1);
    return `${(i * W) / (data.length - 1)},${(invert ? t : 1 - t) * (H - 4) + 2}`;
  }).join(" ");
  return <svg viewBox={`0 0 ${W} ${H}`} className="w-16 h-[18px]" aria-hidden><polyline points={pts} fill="none" stroke={G} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function Content() {
  /* 4 weeks × 7 days, posts per day — single-hue sequential heat. */
  const grid = [
    [1, 0, 2, 1, 1, 0, 0], [1, 1, 2, 0, 2, 1, 0], [2, 1, 1, 1, 2, 0, 1], [1, 2, 2, 1, 3, 1, 0],
  ];
  const shade = ["var(--color-ink-800)", "var(--color-accent-900)", "var(--color-accent-700)", "var(--color-accent-500)"];
  return (
    <Frame title="Content Bot · publishing" status="5 queued this week">
      <KpiRow>
        <Kpi label="Posts this month" value="31" delta="▲ from 4" />
        <Kpi label="Profile views" value="8.4" unit="k" delta="▲ 3.1×" />
        <Kpi label="Calls from GBP" value="27" delta="▲ 12" />
      </KpiRow>
      <div>
        <SubHead right={<span className="flex items-center gap-1 mono text-[9px] text-ink-400">less{shade.map((c) => <span key={c} className="h-2.5 w-2.5" style={{ background: c }} />)}more</span>}>Posting cadence · last 4 weeks</SubHead>
        <div className="grid grid-cols-7 gap-[3px]">
          {grid.flatMap((w, wi) => w.map((v, di) => (
            <span key={`${wi}-${di}`} title={`Week ${wi + 1}, ${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][di]}: ${v} posts`} className="aspect-square rounded-[3px]" style={{ background: shade[Math.min(v, 3)] }} />
          )))}
        </div>
      </div>
      <div>
        <SubHead>Profile views · 12 weeks</SubHead>
        <AreaLine id="content" height={70} data={[2.1, 2.3, 2.2, 2.9, 3.4, 3.9, 4.6, 5.2, 6.1, 6.8, 7.5, 8.4]} labels={W12} unit="k" />
      </div>
    </Frame>
  );
}

function Email() {
  return (
    <Frame title="Email Bot · quote follow-up" status="sequence live">
      <KpiRow>
        <Kpi label="Quotes followed up" value="100" unit="%" delta="▲ from 22%" />
        <Kpi label="Reply rate" value="26" unit="%" delta="▲ 3.4×" />
        <Kpi label="Revived jobs" value="$41" unit="k" delta="▲ this qtr" />
      </KpiRow>
      <div>
        <SubHead>Last 30 days · 120 open quotes</SubHead>
        <HBars rows={[
          { label: "Sent", value: 120 },
          { label: "Opened", value: 74 },
          { label: "Replied", value: 31 },
          { label: "Booked", value: 12 },
        ]} />
      </div>
      <p className="flex items-center gap-2 text-[12px] text-ink-300"><Check className="w-3.5 h-3.5 text-accent-400" strokeWidth={2.5} /> Sequence stops the moment a customer replies</p>
    </Frame>
  );
}

function Cro() {
  const a = [3.0, 3.2, 3.1, 2.9, 3.1, 3.2, 3.0, 3.1, 3.2, 3.1, 3.0, 3.1];
  const b = [3.1, 3.6, 4.0, 4.3, 4.6, 4.8, 5.0, 5.1, 5.2, 5.3, 5.4, 5.4];
  return (
    <Frame title="Conversion Bot · quote form A/B" status="day 12 of 14">
      <KpiRow>
        <Kpi label="Variant B" value="5.4" unit="%" delta="▲ 74% vs A" />
        <Kpi label="Variant A" value="3.1" unit="%" good={false} delta="current form" />
        <Kpi label="Extra calls" value="+38" unit="/mo" delta="at same traffic" />
      </KpiRow>
      <div>
        <SubHead right={<Legend items={[{ label: "B · 4 fields" }, { label: "A · 9 fields", dashed: true }]} />}>Conversion rate by day</SubHead>
        <AreaLine id="cro" data={b} base={a} labels={["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10", "D11", "D12"]} unit="%" />
      </div>
      <Ring pct={94} label="Confidence B wins" sub="Ships automatically at 95%" size={72} />
    </Frame>
  );
}

function Analytics() {
  return (
    <Frame title="Analytics Bot · Monday report" status="emailed 7:00am">
      <KpiRow>
        <Kpi label="Booked jobs" value="31" delta="▲ 6 vs last wk" />
        <Kpi label="Spend" value="$2.4" unit="k" good={false} delta="flat" />
        <Kpi label="Return on spend" value="9.8" unit="×" delta="▲ 1.4×" />
      </KpiRow>
      <div>
        <SubHead>Cost per booked job, by channel</SubHead>
        <HBars unit="$" rows={[
          { label: "SEO", value: 22 },
          { label: "Google LSA", value: 54 },
          { label: "Google Ads", value: 86 },
          { label: "Meta", value: 140, muted: true, note: "−$300" },
        ]} />
      </div>
      <div>
        <SubHead>Booked jobs per week</SubHead>
        <Columns data={[19, 21, 20, 24, 23, 26, 25, 31]} labels={["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"]} height={84} />
      </div>
    </Frame>
  );
}

function Prospecting() {
  return (
    <Frame title="Prospecting Bot · weekly list" status="delivered Mon">
      <div className="grid grid-cols-[auto_1fr] gap-6 items-center pb-5 border-b border-ink-800">
        <Ring pct={88} label="42 of 48 verified" sub="6 bad emails removed" />
        <Kpi label="New permits matched" value="11" delta="▲ this week" />
      </div>
      <div>
        <SubHead>Accounts by buyer type</SubHead>
        <HBars rows={[
          { label: "Property mgmt", value: 18 },
          { label: "General contractors", value: 12 },
          { label: "Facilities", value: 8 },
          { label: "HOA mgmt", value: 4 },
        ]} />
      </div>
      <ul className="space-y-1.5 text-[12px]">
        {["Harbor Property Group · 14 sites", "Coastline Builders · permit filed Tue"].map((t) => (
          <li key={t} className="flex items-center gap-2 text-ink-200"><Check className="w-3.5 h-3.5 text-accent-400" strokeWidth={2.5} />{t}</li>
        ))}
      </ul>
    </Frame>
  );
}

function Outbound() {
  return (
    <Frame title="Outbound Bot · commercial outreach" status="3 replies today">
      <KpiRow>
        <Kpi label="Reply rate" value="9.4" unit="%" delta="▲ 2.1 pts" />
        <Kpi label="Walk-throughs" value="7" unit="/mo" delta="▲ from 1" />
        <Kpi label="Bid invites" value="12" delta="▲ 8" />
      </KpiRow>
      <div>
        <SubHead>Positive replies per week</SubHead>
        <Columns data={[2, 3, 3, 5, 4, 6, 7, 9]} labels={["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"]} height={84} />
      </div>
      <div className="border border-accent-700 bg-[color-mix(in_oklab,var(--color-accent-500)_10%,transparent)] p-3">
        <p className="mono text-[9.5px] uppercase tracking-[0.08em] text-accent-300">Reply · Tue 10:47am</p>
        <p className="mt-1 text-[12.5px] text-white">&ldquo;Good timing. Can you walk suite 210 Thursday?&rdquo;</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-ink-400"><Calendar className="w-3 h-3" /> Booked Thu 9:00am</p>
      </div>
    </Frame>
  );
}

function SpeedToLead() {
  return (
    <Frame title="Speed-to-Lead Bot · response time" status="last 30 days">
      <div className="grid grid-cols-[1.1fr_1fr] gap-5 pb-5 border-b border-ink-800">
        <Kpi big label="Median first reply" value="38" unit="sec" delta="▼ from 3h 12m" />
        <div className="grid grid-rows-2 gap-3">
          <Kpi label="Leads answered" value="100" unit="%" />
          <Kpi label="Booked from text" value="47" unit="%" />
        </div>
      </div>
      <div>
        <SubHead right={<Legend items={[{ label: "With bot" }, { label: "Before", gray: true }]} />}>Time to first reply</SubHead>
        <HBars rows={[
          { label: "Before", value: 192, muted: true, display: "3h 12m" },
          { label: "With bot", value: 0.63, display: "38s" },
        ]} max={192} />
      </div>
      <div className="space-y-1.5">
        <p className="flex items-center gap-2 text-[12px] text-ink-400"><Phone className="w-3.5 h-3.5" /> Missed call · 8:42pm</p>
        <p className="ml-auto w-fit max-w-[85%] bg-[var(--color-accent-500)] text-ink-950 px-3 py-2 text-[12.5px] font-medium">Sorry we missed you! What&rsquo;s going on with the roof?</p>
        <p className="flex items-center gap-1.5 text-[12px] font-medium text-accent-300"><Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Booked Thu 10:00am · 2m 12s after the call</p>
      </div>
    </Frame>
  );
}

function Crm() {
  return (
    <Frame title="CRM Bot · pipeline" status="synced 1m ago">
      <KpiRow>
        <Kpi label="Open pipeline" value="$184" unit="k" delta="▲ $22k" />
        <Kpi label="Stale estimates" value="0" delta="▼ from 14" />
        <Kpi label="Logged by hand" value="0" unit="%" delta="all automatic" />
      </KpiRow>
      <div>
        <SubHead>Pipeline value by stage</SubHead>
        <Columns highlightLast={false} unit="k" data={[62, 71, 33, 18]} labels={["New", "Estimate", "Booked", "Won"]} height={96} />
      </div>
      <p className="text-[12px] text-ink-300">Call with Ortiz logged → moved to <span className="text-white">Estimate</span>, follow-up set for Friday</p>
    </Frame>
  );
}

function Proposal() {
  return (
    <Frame title="Proposal Bot · quotes" status="quote #1042 opened 2×">
      <div className="grid grid-cols-[1.1fr_1fr] gap-5 pb-5 border-b border-ink-800">
        <Kpi big label="Time to quote" value="41" unit="min" delta="▼ from 3.2 days" />
        <Ring pct={46} label="Close rate" sub="▲ from 29%" size={72} />
      </div>
      <div>
        <SubHead>Quotes signed per week</SubHead>
        <Columns data={[4, 5, 5, 6, 8, 7, 9, 11]} labels={["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"]} height={84} />
      </div>
      <div className="flex items-center justify-between gap-3 text-[12px]">
        <span className="text-ink-300">Ortiz residence · re-roof</span>
        <span className="tabular-nums text-white font-semibold">$14,190</span>
        <span className="mono text-[9.5px] uppercase tracking-[0.08em] px-1.5 py-0.5 bg-ink-800 text-accent-300">follow-up 9am</span>
      </div>
    </Frame>
  );
}

function Reviews() {
  const dist = [{ s: 5, n: 94 }, { s: 4, n: 12 }, { s: 3, n: 4 }, { s: 2, n: 1 }, { s: 1, n: 1 }];
  return (
    <Frame title="Reviews Bot · Google reviews" status="100% replied">
      <div className="grid grid-cols-[auto_1fr] gap-6 items-center pb-5 border-b border-ink-800">
        <div>
          <p className="flex items-baseline gap-1"><span className="text-[2.8rem] font-semibold tracking-[-0.045em] leading-none tabular-nums text-white">4.8</span></p>
          <span className="mt-1.5 flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn("w-3.5 h-3.5", i < 5 ? "fill-[var(--color-accent-400)] text-[var(--color-accent-400)]" : "")} />)}</span>
          <p className="mt-1.5 mono text-[10px] text-ink-400 tabular-nums">112 reviews</p>
        </div>
        <ul className="space-y-1.5">
          {dist.map((d) => (
            <li key={d.s} className="grid grid-cols-[18px_1fr_24px] items-center gap-2" title={`${d.s} stars: ${d.n}`}>
              <span className="mono text-[10px] text-ink-400">{d.s}★</span>
              <span className="h-[6px] bg-ink-800"><span className="block h-full rounded-r-[4px]" style={{ width: `${(d.n / 94) * 100}%`, background: d.s >= 4 ? G : GRAY }} /></span>
              <span className="mono text-[10px] tabular-nums text-ink-300 text-right">{d.n}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <SubHead right={<span className="mono text-[10px] text-accent-300">▲ 48 in 6 months</span>}>Total reviews</SubHead>
        <AreaLine id="reviews" height={80} data={[64, 66, 69, 74, 80, 87, 93, 99, 104, 108, 112]} labels={["Apr", "", "May", "", "Jun", "", "Jul", "", "Aug", "", "Sep"]} />
      </div>
      <p className="flex items-center gap-2 text-[12px] text-ink-300"><span className="mono text-[9.5px] uppercase px-1.5 py-0.5 bg-ink-800 text-ink-200">3★ check-in</span> routed to you privately before it posted</p>
    </Frame>
  );
}

function Reactivation() {
  return (
    <Frame title="Reactivation Bot · fall campaigns" status="$0 ad spend">
      <KpiRow>
        <Kpi label="Revenue from list" value="$38" unit="k" delta="▲ this season" />
        <Kpi label="Jobs booked" value="29" delta="from 183 sent" />
        <Kpi label="Opt-outs" value="1.1" unit="%" good={false} delta="all honored" />
      </KpiRow>
      <div>
        <SubHead>Booked revenue by campaign</SubHead>
        <HBars unit="$" rows={[
          { label: "AC tune-up", value: 17400 },
          { label: "Water heater 8yr+", value: 11200 },
          { label: "Old estimates", value: 6900 },
          { label: "Dryer vent", value: 2900 },
        ]} />
      </div>
      <div>
        <SubHead>Jobs booked per week</SubHead>
        <Columns data={[2, 4, 3, 5, 6, 4, 5]} labels={["W1", "W2", "W3", "W4", "W5", "W6", "W7"]} height={76} />
      </div>
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
