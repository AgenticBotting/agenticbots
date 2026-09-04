"use client";

import { useCallback, useEffect, useState } from "react";
import { X, ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { CATALOG } from "@/lib/catalog";
import { BOT_PLAN_EVENT } from "@/lib/lead-flow";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { useDialog } from "@/hooks/useDialog";

/**
 * Full-screen multi-step bot plan flow.
 * Opened with `openBotPlan(source)` from anywhere.
 *
 * Steps: side of business → which bot → urgency → contact details.
 * Picking a card on steps 1–3 auto-advances; step 4 converts.
 * Card selection throughout — no dropdowns.
 */

type Picks = { side?: string; bot?: string; timing?: string };

const TIMING = [
  { value: "now", label: "Bleeding now", desc: "Losing leads this week" },
  { value: "quarter", label: "This quarter", desc: "Budgeted, planning the build" },
  { value: "exploring", label: "Exploring", desc: "Working out what it would take" },
];

const TOTAL = 4;

export function BotPlanFlow() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<Picks>({});
  const [source, setSource] = useState("site");
  const [form, setForm] = useState({ name: "", email: "", company: "" });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<{ source?: string }>).detail;
      setSource(detail?.source ?? "site");
      track("plan_flow_opened", { source: detail?.source ?? "site" });
      setOpen(true);
      setStep(0);
      setPicks({});
      setState("idle");
      setError("");
    }
    window.addEventListener(BOT_PLAN_EVENT, onOpen);
    return () => window.removeEventListener(BOT_PLAN_EVENT, onOpen);
  }, []);

  const close = useCallback(() => setOpen(false), []);
  const panelRef = useDialog(open, close);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const sidePillar = CATALOG.find((p) => p.name === picks.side);

  function pick<K extends keyof Picks>(key: K, value: string) {
    setPicks((p) => ({ ...p, [key]: value }));
    track("plan_flow_step_completed", { step, field: key, value, source });
    setStep((s) => s + 1);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          focus: picks.bot,
          goal: `Side: ${picks.side} · Timing: ${TIMING.find((t) => t.value === picks.timing)?.label ?? picks.timing}`,
          source: `flow:${source}`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Something went wrong."); setState("error"); return; }
      track("plan_flow_completed", { source, focus: picks.bot });
      setState("done");
    } catch {
      setError("Network error. Try again.");
      setState("error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] bg-ink-950/70 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="min-h-full flex items-start sm:items-center justify-center p-0 sm:p-6">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bot-plan-title"
          className="w-full max-w-[840px] bg-white sm:rounded-none shadow-mega min-h-screen sm:min-h-0"
        >
          {/* Bar */}
          <div className="flex items-center justify-between gap-4 px-5 sm:px-8 h-16 border-b border-[var(--border)]">
            <div className="flex items-center gap-3 min-w-0">
              {step > 0 && state !== "done" && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center justify-center w-8 h-8 rounded-none border border-[var(--border)] hover:border-ink-950 transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <span id="bot-plan-title" className="label-caps text-[var(--text-muted)] truncate">
                {state === "done" ? "Done" : `Get your bot plan — step ${step + 1} of ${TOTAL}`}
              </span>
            </div>
            <button
              onClick={close}
              className="flex items-center justify-center w-9 h-9 rounded-none hover:bg-[var(--bg-alt)] transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          {state !== "done" && (
            <div className="h-1 bg-[var(--border)]">
              <div
                className="h-full bg-signal-500 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ width: `${((step + 1) / TOTAL) * 100}%` }}
              />
            </div>
          )}

          <div className="px-5 sm:px-8 py-8 sm:py-10">
            {state === "done" ? (
              <div role="status" className="text-center py-6">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-none bg-[var(--bg-tint)] border border-[var(--border-tint)] text-[var(--accent-text)]">
                  <Check className="w-6 h-6" strokeWidth={2.5} />
                </span>
                <h2 className="display-xl mt-6">You are in the queue.</h2>
                <p className="body-base mt-4 max-w-[46ch] mx-auto">
                  Your bot plan lands at {form.email} within one business day. A real
                  person reads it first — no automated deck.
                </p>
                <button onClick={close} className="btn btn-secondary mt-8">
                  Back to the site
                </button>
              </div>
            ) : step === 0 ? (
              <Step title="Which side needs the most help?" sub="Pick the one that hurts more right now.">
                <div className="grid sm:grid-cols-2 gap-3">
                  {CATALOG.map((p) => (
                    <CardBtn
                      key={p.slug}
                      label={p.name}
                      desc={p.tagline}
                      onClick={() => pick("side", p.name)}
                    />
                  ))}
                  <CardBtn
                    label="Both"
                    desc="Leaking on both ends"
                    onClick={() => pick("side", "Both")}
                    className="sm:col-span-2"
                  />
                </div>
              </Step>
            ) : step === 1 ? (
              <Step title="What is actually broken?" sub="Closest match is fine — we will confirm in the plan.">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(sidePillar ? sidePillar.categories : CATALOG.flatMap((p) => p.categories)).map((c) => (
                    <CardBtn
                      key={`${c.pillar}-${c.slug}`}
                      label={c.botName}
                      desc={c.name}
                      onClick={() => pick("bot", c.name)}
                    />
                  ))}
                  <CardBtn
                    label="Not sure"
                    desc="Tell me what I need"
                    onClick={() => pick("bot", "Not sure yet")}
                  />
                </div>
              </Step>
            ) : step === 2 ? (
              <Step title="How urgent is it?" sub="This sets where you land in the queue, nothing else.">
                <div className="grid sm:grid-cols-3 gap-3">
                  {TIMING.map((t) => (
                    <CardBtn
                      key={t.value}
                      label={t.label}
                      desc={t.desc}
                      onClick={() => pick("timing", t.value)}
                    />
                  ))}
                </div>
              </Step>
            ) : (
              <Step title="Where should we send it?" sub="Three fields. No call required to get the plan.">
                <form onSubmit={submit} className="max-w-[460px]">
                  <div className="space-y-4">
                    <Labeled label="Name" required>
                      <input
                        className="field" required autoFocus autoComplete="name"
                        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Jordan Reyes"
                      />
                    </Labeled>
                    <Labeled label="Work email" required>
                      <input
                        className="field" required type="email" autoComplete="email"
                        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="jordan@company.com"
                      />
                    </Labeled>
                    <Labeled label="Company">
                      <input
                        className="field" autoComplete="organization"
                        value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                        placeholder="Company name"
                      />
                    </Labeled>
                  </div>

                  {state === "error" && <p role="alert" className="mt-4 text-[13.5px] text-[var(--color-danger)]">{error}</p>}

                  <button type="submit" disabled={state === "sending"} className="btn btn-primary w-full mt-6">
                    {state === "sending"
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                      : <>Send me the plan <ArrowRight className="w-4 h-4" /></>}
                  </button>
                  <p className="body-xs mt-4">
                    One business day. No spam, no sequence you did not ask for.
                  </p>
                </form>
              </Step>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="display-xl text-balance">{title}</h2>
      <p className="body-base mt-3 mb-8">{sub}</p>
      {children}
    </div>
  );
}

function CardBtn({
  label, desc, onClick, className,
}: { label: string; desc: string; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group text-left p-5 rounded-none border border-[var(--border)] bg-white",
        "hover:border-ink-950 hover:-translate-y-0.5 hover:shadow-lift",
        "transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
        className
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block display-md">{label}</span>
          <span className="block mt-1 text-[12.5px] leading-snug text-[var(--text-secondary)]">
            {desc}
          </span>
        </span>
        <ArrowRight className="w-4 h-4 mt-1 shrink-0 text-[var(--accent-text)] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
      </span>
    </button>
  );
}

function Labeled({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block mb-1.5 text-[13px] font-medium text-[var(--text-body)]">
        {label}{required && <span className="text-[var(--accent-text)]"> *</span>}
      </span>
      {children}
    </label>
  );
}
