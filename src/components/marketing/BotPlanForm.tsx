"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { CATALOG, ALL_CATEGORIES } from "@/lib/catalog";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * The site's conversion surface — a point-and-click configurator, not a
 * form. Three questions answered by clicking (or pressing 1–9), then two
 * fields. Same props and same /api/plan payload as the form it replaced,
 * so every call site is unchanged.
 *
 * `defaultFocus` (service and category pages) pre-answers the "what needs
 * help" question and starts the visitor one step further in.
 */

type Option = { value: string; label: string; desc: string };

const TIMING: Option[] = [
  { value: "Bleeding now", label: "Right now", desc: "We are losing leads this week" },
  { value: "This quarter", label: "This quarter", desc: "Budgeted, planning the build" },
  { value: "Exploring", label: "Exploring", desc: "Working out what it would take" },
];

const SIDES: Option[] = [
  { value: "Marketing", label: "Getting found", desc: "Not enough people asking about us" },
  { value: "Sales", label: "Closing the work", desc: "Leads come in and go cold" },
  { value: "Both", label: "Both ends", desc: "Not sure where it breaks" },
];

export function BotPlanForm({
  source = "site",
  defaultFocus,
  className,
}: {
  source?: string;
  defaultFocus?: string;
  /** Kept for call-site compatibility; the console has one density. */
  compact?: boolean;
  className?: string;
}) {
  const [side, setSide] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(defaultFocus ?? null);
  const [timing, setTiming] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", company: "", goal: "" });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  /* With a focus already known we only need the side for routing context,
     so the pre-answered console opens on "how soon". */
  const steps = defaultFocus ? (["timing", "contact"] as const) : (["side", "focus", "timing", "contact"] as const);
  const stepIndex =
    !defaultFocus && !side ? 0
    : !defaultFocus && !focus ? 1
    : !timing ? steps.length - 2
    : steps.length - 1;
  const current = steps[stepIndex];

  const focusOptions: Option[] = useMemo(() => {
    if (side === "Both" || !side) {
      return ALL_CATEGORIES.slice(0, 6).map((c) => ({ value: c.name, label: c.botName, desc: c.outcome }));
    }
    const pillar = CATALOG.find((p) => p.name.toLowerCase().startsWith(side.toLowerCase()));
    return (pillar?.categories ?? ALL_CATEGORIES)
      .slice(0, 6)
      .map((c) => ({ value: c.name, label: c.botName, desc: c.outcome }));
  }, [side]);

  const options: Option[] =
    current === "side" ? SIDES : current === "focus" ? focusOptions : current === "timing" ? TIMING : [];

  function choose(value: string) {
    if (current === "side") setSide(value);
    else if (current === "focus") setFocus(value);
    else if (current === "timing") setTiming(value);
    track("plan_flow_step_completed", { step: stepIndex, field: current, value, source });
  }

  /* Number keys pick — the console reads as a terminal, not a survey.
     Listening on the document (not the panel) makes the on-screen hint
     true without having to click in first; the guards keep it from
     hijacking typing elsewhere or firing on an off-screen console. */
  useEffect(() => {
    if (!options.length) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const n = Number(e.key);
      if (!(n >= 1 && n <= options.length)) return;
      const box = panelRef.current?.getBoundingClientRect();
      if (!box || box.bottom < 0 || box.top > window.innerHeight) return;
      e.preventDefault();
      choose(options[n - 1].value);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  function back() {
    if (current === "contact") setTiming(null);
    else if (current === "timing") { if (defaultFocus) return; setFocus(null); }
    else if (current === "focus") setSide(null);
  }

  const answers = [
    !defaultFocus && side ? { label: side, undo: () => { setSide(null); setFocus(null); setTiming(null); } } : null,
    focus && !defaultFocus ? { label: focus, undo: () => { setFocus(null); setTiming(null); } } : null,
    timing ? { label: timing, undo: () => setTiming(null) } : null,
  ].filter(Boolean) as { label: string; undo: () => void }[];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          focus: focus ?? "Not sure yet",
          goal: [form.goal, side && `Side: ${side}`, timing && `Timing: ${timing}`].filter(Boolean).join(" · "),
          source,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Something went wrong. Try again."); setState("error"); return; }
      track("plan_form_submitted", { source, focus: focus ?? "Not sure yet" });
      setState("done");
    } catch {
      setError("Network error. Try again.");
      setState("error");
    }
  }

  const QUESTION: Record<string, { eyebrow: string; ask: string }> = {
    side: { eyebrow: "Question 1", ask: "Where is it breaking?" },
    focus: { eyebrow: "Question 2", ask: "What needs the most help?" },
    timing: { eyebrow: defaultFocus ? "Question 1" : "Question 3", ask: "How soon do you need this?" },
    contact: { eyebrow: "Last step", ask: "Where do we send the plan?" },
  };

  return (
    <div ref={panelRef} tabIndex={-1} className={cn("border border-[var(--border-strong)] bg-white outline-none", className)}>
      {/* ── Console header: status, progress pips, answers so far ── */}
      <div className="bg-ink-950 on-dark px-5 sm:px-7 py-4">
        <div className="flex items-center justify-between gap-4">
          <p className="mono text-[10.5px] uppercase tracking-[0.13em] text-ink-300">
            Bot plan
            <span className="text-accent-400">
              {" · "}{state === "done" ? "Queued" : "Configuring"}
            </span>
          </p>
          <div className="flex items-center gap-1.5" aria-hidden>
            {steps.map((s, i) => (
              <span
                key={s}
                className={cn(
                  "h-1 w-6 transition-colors",
                  state === "done" || i < stepIndex ? "bg-accent-500" : i === stepIndex ? "bg-accent-500 animate-pulse-dot" : "bg-ink-700"
                )}
              />
            ))}
          </div>
        </div>

        {answers.length > 0 && state !== "done" && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {answers.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={a.undo}
                className="group inline-flex items-center gap-2 border border-ink-700 px-2.5 py-1 mono text-[10px] uppercase tracking-[0.1em] text-ink-300 hover:border-accent-500 hover:text-accent-400 transition-colors"
              >
                {a.label}
                <span className="text-ink-400 group-hover:text-accent-400">×</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="h-px rule-agent" />

      {/* ── Body ── */}
      <div className="p-6 sm:p-8">
        {state === "done" ? (
          <div className="text-center py-6">
            <span className="mx-auto flex h-12 w-12 items-center justify-center bg-accent-500 text-ink-950 notch">
              <Check className="w-6 h-6" strokeWidth={3} />
            </span>
            <h3 className="display-lg mt-5">Got it.</h3>
            <p className="body-base mt-3 max-w-[44ch] mx-auto">
              Your plan is being written now — it lands at {form.email} within one business day.
              No pitch deck, no sales sequence you did not ask for.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{QUESTION[current].eyebrow}</p>
                <h3 className="display-lg mt-2.5">{QUESTION[current].ask}</h3>
              </div>
              {stepIndex > 0 && (
                <button
                  type="button" onClick={back} aria-label="Back"
                  className="shrink-0 flex items-center justify-center w-9 h-9 border border-[var(--border)] hover:border-ink-950 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
            </div>

            {options.length > 0 ? (
              <>
                <div className="mt-7 grid sm:grid-cols-2 gap-px bg-[var(--border)] border border-[var(--border)]">
                  {options.map((o, i) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => choose(o.value)}
                      className={cn(
                        "group relative bg-white p-5 text-left transition-colors hover:bg-[var(--bg-tint)]",
                        options.length % 2 === 1 && i === options.length - 1 && "sm:col-span-2"
                      )}
                    >
                      <span className="absolute left-0 top-0 h-full w-[3px] bg-accent-500 scale-y-0 group-hover:scale-y-100 origin-top transition-transform duration-200" />
                      <span className="flex items-start gap-3">
                        <span className="mono text-[10px] leading-[1.9] text-[var(--text-muted)] group-hover:text-[var(--accent-text)] transition-colors">
                          {i + 1}
                        </span>
                        <span className="flex-1">
                          <span className="block text-[15.5px] font-semibold tracking-[-0.015em] group-hover:text-[var(--accent-text)] transition-colors">
                            {o.label}
                          </span>
                          <span className="block body-sm mt-1">{o.desc}</span>
                        </span>
                        <ArrowRight className="w-4 h-4 shrink-0 mt-0.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] mt-4">
                  Click one, or press its number
                </p>
              </>
            ) : (
              <form onSubmit={onSubmit} className="mt-7">
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block mb-1.5 text-[13px] font-medium text-[var(--text-secondary)]">
                      Name <span className="text-[var(--accent-text)]">*</span>
                    </span>
                    <input
                      className="field" required autoComplete="name" placeholder="Jordan Reyes"
                      value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="block mb-1.5 text-[13px] font-medium text-[var(--text-secondary)]">
                      Work email <span className="text-[var(--accent-text)]">*</span>
                    </span>
                    <input
                      className="field" required type="email" autoComplete="email" placeholder="jordan@company.com"
                      value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </label>
                </div>
                <label className="block mt-4">
                  <span className="block mb-1.5 text-[13px] font-medium text-[var(--text-secondary)]">
                    Anything specific? <span className="text-[var(--text-muted)]">Optional</span>
                  </span>
                  <input
                    className="field" placeholder="e.g. 40 leads a month, we call back half"
                    value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}
                  />
                </label>

                {state === "error" && <p className="mt-4 text-[13.5px] text-red-600">{error}</p>}

                <button type="submit" disabled={state === "sending"} className="btn btn-primary w-full mt-6">
                  {state === "sending"
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                    : <>Get my bot plan <ArrowRight className="w-4 h-4" /></>}
                </button>
                <p className="body-sm mt-4 text-center">
                  One business day. No spam, no sales sequence you did not ask for.
                </p>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
