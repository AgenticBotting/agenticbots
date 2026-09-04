"use client";

import { useEffect, useRef, useState } from "react";
import { X, ArrowRight, Check, Loader2 } from "lucide-react";
import { BotFace } from "@/components/ui";
import { markExitDismissed, exitIntentSuppressed } from "@/lib/lead-flow";

/**
 * Exit-intent lead magnet — split panel, dark left / form right.
 *
 * Trigger: cursor leaves the top of the viewport after 8s on page.
 * Fires once per session and is suppressed for 14 days after a dismiss,
 * so it never nags a returning visitor.
 * Dismiss: ESC · backdrop · X · "No thanks".
 */

type Step = "pitch" | "form" | "done";

const MIN_TIME_ON_PAGE = 8000;

export function ExitIntent() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("pitch");
  const [form, setForm] = useState({ name: "", email: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const firedRef = useRef(false);

  useEffect(() => {
    if (exitIntentSuppressed()) return;
    const loadedAt = Date.now();

    function onLeave(e: MouseEvent) {
      if (e.clientY > 0) return;
      if (firedRef.current) return;
      if (Date.now() - loadedAt < MIN_TIME_ON_PAGE) return;
      firedRef.current = true;
      setOpen(true);
    }

    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => document.documentElement.removeEventListener("mouseleave", onLeave);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  function close() {
    markExitDismissed();
    setOpen(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, focus: "Not sure yet", source: "exit-intent" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Something went wrong."); setSending(false); return; }
      markExitDismissed();
      setStep("done");
    } catch {
      setError("Network error. Try again.");
    }
    setSending(false);
  }

  return (
    <div
      className="fixed inset-0 z-[90] bg-ink-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="w-full max-w-[880px] bg-white rounded-none shadow-mega overflow-hidden grid md:grid-cols-[0.85fr_1.15fr]">
        {/* Left — dark panel with the mark */}
        <div className="relative hidden md:flex flex-col justify-between bg-ink-950 on-dark p-8 overflow-hidden">
          <div className="absolute inset-0 bg-grid-dark opacity-60" />
          <div className="relative">
            <span className="flex h-11 w-11 items-center justify-center rounded-none bg-signal-500 notch">
              <BotFace className="w-6 h-5 text-ink-950" />
            </span>
            <p className="eyebrow mt-7">Before you go</p>
            <h2 className="display-lg mt-3 text-white">
              One page. <span className="em-green">Zero cost.</span>
            </h2>
          </div>
          <ul className="relative mt-8 space-y-3">
            {["Where you are leaking", "Which bots plug it", "What each one is worth"].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-[13.5px] text-ink-300">
                <Check className="w-3.5 h-3.5 shrink-0 text-signal-500" strokeWidth={3} />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Right */}
        <div className="relative p-7 sm:p-9">
          <button
            onClick={close}
            aria-label="Close"
            className="absolute top-4 right-4 flex items-center justify-center w-9 h-9 rounded-none hover:bg-[var(--bg-alt)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {step === "done" ? (
            <div className="py-8 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-none bg-[var(--bg-tint)] border border-[var(--border-tint)] text-[var(--accent-text)]">
                <Check className="w-6 h-6" strokeWidth={2.5} />
              </span>
              <h3 className="display-lg mt-5">Sent.</h3>
              <p className="body-base mt-3">Your plan lands within one business day.</p>
              <button onClick={() => setOpen(false)} className="btn btn-outline mt-7">
                Keep reading
              </button>
            </div>
          ) : step === "pitch" ? (
            <div className="pt-4">
              <p className="eyebrow">Free bot plan</p>
              <h3 className="display-xl mt-3 text-balance">
                Want to know where you are <span className="em-green">losing customers?</span>
              </h3>
              <p className="body-base mt-4">
                Tell us what you sell. We map every point between a lead arriving and a
                job closing where people are dropping out, and name the bots that fix it.
                One business day, no call, yours to keep.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button onClick={() => setStep("form")} className="btn btn-primary">
                  Yes — send the plan
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={close}
                  className="text-[13.5px] text-[var(--text-muted)] hover:text-[var(--text-body)] underline underline-offset-4 transition-colors"
                >
                  No thanks
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="pt-4">
              <p className="eyebrow">Almost done</p>
              <h3 className="display-lg mt-3">Where should we send it?</h3>
              <div className="mt-6 space-y-4">
                <input
                  className="field" required autoFocus placeholder="Your name" autoComplete="name"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                  className="field" required type="email" placeholder="Work email" autoComplete="email"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              {error && <p className="mt-4 text-[13.5px] text-red-600">{error}</p>}
              <button type="submit" disabled={sending} className="btn btn-primary w-full mt-6">
                {sending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  : <>Send my plan <ArrowRight className="w-4 h-4" /></>}
              </button>
              <p className="body-xs mt-4 text-center">No spam. Unsubscribe any time.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
