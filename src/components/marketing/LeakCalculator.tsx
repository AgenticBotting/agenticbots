"use client";

import { ProposalLink } from "@/components/marketing/ProposalLink";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics";

/**
 * Lead leak calculator. Rough by design: the visitor's own numbers times a
 * stated assumption about how many leads go cold at each response speed.
 * The assumptions are printed under the result — nothing hidden.
 */

const SPEEDS = [
  { v: "under5", label: "Under 5 minutes", lost: 0.05 },
  { v: "hour", label: "Within the hour", lost: 0.2 },
  { v: "sameday", label: "Same day", lost: 0.35 },
  { v: "nextday", label: "Next day or later", lost: 0.5 },
] as const;

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function LeakCalculator() {
  const [leads, setLeads] = useState(60);
  const [job, setJob] = useState(2500);
  const [close, setClose] = useState(30);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]["v"]>("sameday");
  const [touched, setTouched] = useState(false);

  const { lostLeads, lostJobs, monthly } = useMemo(() => {
    const s = SPEEDS.find((x) => x.v === speed)!;
    const lostLeads = leads * s.lost;
    const lostJobs = lostLeads * (close / 100);
    return { lostLeads, lostJobs, monthly: lostJobs * job };
  }, [leads, job, close, speed]);

  function touch() {
    if (!touched) { setTouched(true); track("cta_clicked", { source: "calculator", label: "used" }); }
  }

  return (
    <div className="grid lg:grid-cols-[1.05fr_0.95fr] border border-[var(--border-strong)] bg-white">
      <div className="p-6 sm:p-9 space-y-7 border-b lg:border-b-0 lg:border-r border-[var(--border)]">
        <Slider label="New leads a month" value={leads} min={10} max={400} step={5}
          display={String(leads)} onChange={(v) => { touch(); setLeads(v); }} />
        <Slider label="Average job value" value={job} min={250} max={50000} step={250}
          display={usd(job)} onChange={(v) => { touch(); setJob(v); }} />
        <Slider label="Close rate when you reach them" value={close} min={5} max={80} step={1}
          display={`${close}%`} onChange={(v) => { touch(); setClose(v); }} />
        <fieldset>
          <legend className="text-[13.5px] font-medium text-[var(--text-secondary)]">
            How fast does a new lead hear back today?
          </legend>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {SPEEDS.map((s) => (
              <button key={s.v} type="button" aria-pressed={speed === s.v}
                onClick={() => { touch(); setSpeed(s.v); }}
                className={
                  "px-3 py-2.5 border text-left text-[13.5px] font-medium transition-colors " +
                  (speed === s.v ? "border-ink-950 bg-ink-950 text-white" : "border-[var(--border)] hover:border-ink-950")
                }>
                {s.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="p-6 sm:p-9 bg-ink-950 on-dark flex flex-col">
        <p className="mono text-[10.5px] uppercase tracking-[0.12em] text-ink-300">Estimated revenue leaking</p>
        <p className="mt-3 text-[clamp(2.6rem,5vw,3.6rem)] font-semibold tracking-[-0.045em] leading-none tabular-nums text-accent-400">
          {usd(monthly)}
          <span className="text-[0.4em] text-ink-300 font-medium tracking-normal"> / month</span>
        </p>
        <p className="mt-2 text-[15px] text-ink-200 tabular-nums">{usd(monthly * 12)} a year</p>

        <dl className="mt-7 grid grid-cols-2 gap-px bg-ink-700 border border-ink-700">
          <div className="bg-ink-900 px-4 py-4">
            <dt className="mono text-[10px] uppercase tracking-[0.1em] text-ink-400">Leads going cold</dt>
            <dd className="mt-1.5 text-[1.5rem] font-semibold tabular-nums text-white">{Math.round(lostLeads)}<span className="text-[13px] text-ink-400 font-normal"> /mo</span></dd>
          </div>
          <div className="bg-ink-900 px-4 py-4">
            <dt className="mono text-[10px] uppercase tracking-[0.1em] text-ink-400">Jobs that implies</dt>
            <dd className="mt-1.5 text-[1.5rem] font-semibold tabular-nums text-white">{lostJobs.toFixed(1)}<span className="text-[13px] text-ink-400 font-normal"> /mo</span></dd>
          </div>
        </dl>

        <ProposalLink
          className="btn btn-primary mt-8 self-start">
          Begin Step-1 <ArrowRight className="w-4 h-4" />
        </ProposalLink>
        <p className="mt-auto pt-7 text-[11.5px] leading-relaxed text-ink-400">
          Rough estimate. Assumes roughly 5% of leads go cold with an under-5-minute reply, 20% within the hour,
          35% same day and 50% next day. The audit measures your actual response time.
        </p>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, display, onChange }: {
  label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-4">
        <span className="text-[13.5px] font-medium text-[var(--text-secondary)]">{label}</span>
        <span className="text-[1.25rem] font-semibold tracking-[-0.02em] tabular-nums">{display}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-[var(--color-accent-500)]" />
    </label>
  );
}
