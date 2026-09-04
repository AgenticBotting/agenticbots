"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { X, ArrowRight, Check, Loader2 } from "lucide-react";
import { BotFace } from "@/components/ui";
import { track } from "@/lib/analytics";

/**
 * Exit-intent capture (Phase 8), constrained hard:
 *
 *  Desktop: full mat on mouseleave toward the top edge, WITH an upward
 *  velocity threshold so slow cursor drift never fires it.
 *  Mobile: no full-screen overlay ever (interstitial policy + no
 *  mouseleave on touch). Bottom sheet ≤35% of viewport at 60% scroll
 *  depth or a sharp scroll-velocity reversal.
 *
 *  Never fires: first 30s of a session · on /plan or /contact · on blog
 *  posts before 70% read depth · on paid landings (gclid/fbclid/utm_medium=cpc|paid*).
 *  Frequency: once per session; auto-suppressed 7 days after showing;
 *  PERMANENTLY suppressed after any dismissal or conversion (versioned key).
 *  A11y: focus trap, Esc closes, aria-modal, focus returns to the body.
 *  CLS: rendered in a fixed overlay outside document flow — zero shift.
 */

type Step = "pitch" | "form" | "done";

const KEY = "ab_mat_v2";
const MIN_DWELL_MS = 30_000;
const VELOCITY_PX_S = 350;

type MatState = { shownAt?: number; suppressed?: boolean };

function readState(): MatState {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function writeState(patch: MatState) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...readState(), ...patch })); } catch {}
}
function suppressed(): boolean {
  const s = readState();
  if (s.suppressed) return true;
  if (s.shownAt && Date.now() - s.shownAt < 7 * 24 * 3600 * 1000) return true;
  return false;
}
function onPaidLanding(): boolean {
  const q = new URLSearchParams(location.search);
  const medium = (q.get("utm_medium") || "").toLowerCase();
  return q.has("gclid") || q.has("fbclid") || medium === "cpc" || medium.startsWith("paid");
}

export function ExitIntent() {
  const pathname = usePathname();
  const [open, setOpen] = useState<false | "mat" | "sheet">(false);
  const [step, setStep] = useState<Step>("pitch");
  const [form, setForm] = useState({ name: "", email: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const firedRef = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const blocked =
    pathname.startsWith("/plan") || pathname.startsWith("/contact") || pathname.startsWith("/design");
  const isPost = /^\/blog\/.+/.test(pathname);

  const fire = useCallback((mode: "mat" | "sheet", trigger: string) => {
    if (firedRef.current || suppressed()) return;
    firedRef.current = true;
    writeState({ shownAt: Date.now() });
    setOpen(mode);
    track("mat_impressed", { mode, trigger, page_type: isPost ? "post" : pathname === "/" ? "home" : "page" });
  }, [isPost, pathname]);

  useEffect(() => {
    if (blocked || suppressed() || onPaidLanding()) return;
    const loadedAt = Date.now();
    const isTouch = window.matchMedia("(pointer: coarse)").matches;

    const readDepthOk = () => {
      if (!isPost) return true;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 && window.scrollY / max >= 0.7;
    };
    const dwellOk = () => Date.now() - loadedAt >= MIN_DWELL_MS;

    if (!isTouch) {
      let lastY = 0, lastT = 0;
      const onMove = (e: MouseEvent) => { lastY = e.clientY; lastT = performance.now(); };
      const onLeave = (e: MouseEvent) => {
        if (e.clientY > 0 || !dwellOk() || !readDepthOk()) return;
        const dt = (performance.now() - lastT) / 1000;
        const v = dt > 0 ? (lastY - e.clientY) / dt : Infinity;
        if (v >= VELOCITY_PX_S) fire("mat", "exit_intent");
      };
      document.addEventListener("mousemove", onMove, { passive: true });
      document.documentElement.addEventListener("mouseleave", onLeave);
      return () => {
        document.removeEventListener("mousemove", onMove);
        document.documentElement.removeEventListener("mouseleave", onLeave);
      };
    }

    // Touch: 60% depth, or a sharp upward scroll reversal.
    let prevY = window.scrollY, prevT = performance.now();
    const onScroll = () => {
      const y = window.scrollY, t = performance.now();
      const v = (prevY - y) / Math.max((t - prevT) / 1000, 0.001); // + = scrolling up
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const depth = max > 0 ? y / max : 0;
      prevY = y; prevT = t;
      if (!dwellOk() || !readDepthOk()) return;
      if (depth >= 0.6 || v > 1200) fire("sheet", depth >= 0.6 ? "scroll_depth" : "scroll_reversal");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [blocked, isPost, pathname, fire]);

  // Focus trap + Esc.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("input, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { dismiss("esc"); return; }
      if (e.key !== "Tab" || !panel) return;
      const els = [...panel.querySelectorAll<HTMLElement>("a, button, input, [tabindex]")].filter((el) => !el.hasAttribute("disabled"));
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function dismiss(how: string) {
    writeState({ suppressed: true });
    track("mat_dismissed", { mode: open, how });
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
        body: JSON.stringify({ ...form, focus: "Not sure yet", source: `mat-${open}` }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Something went wrong."); setSending(false); return; }
      writeState({ suppressed: true });
      track("mat_converted", { mode: open });
      setStep("done");
    } catch {
      setError("Network error. Try again.");
    }
    setSending(false);
  }

  const formBody =
    step === "done" ? (
      <div className="py-6 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center bg-[var(--bg-tint)] rounded-[var(--radius)] border border-[var(--border-tint)] text-[var(--accent-text)]">
          <Check className="w-5 h-5" strokeWidth={2.5} />
        </span>
        <h3 className="display-lg mt-4">Sent.</h3>
        <p className="body-base mt-2">Your plan lands within one business day.</p>
        <button onClick={() => setOpen(false)} className="btn btn-outline mt-6">Keep reading</button>
      </div>
    ) : step === "pitch" ? (
      <div>
        <p className="eyebrow">Free bot plan</p>
        <h3 className="display-xl mt-3 text-balance">
          Want to know where you are <span className="em-green">losing customers?</span>
        </h3>
        <p className="body-base mt-3">
          Tell us what you sell. We map every point where people drop out between a lead
          arriving and a job closing, and name the bots that fix it. One business day, no call.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button onClick={() => setStep("form")} className="btn btn-primary">
            Yes — send the plan <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => dismiss("no_thanks")}
            className="text-[13.5px] text-[var(--text-muted)] hover:text-[var(--text-body)] underline underline-offset-4">
            No thanks
          </button>
        </div>
      </div>
    ) : (
      <form onSubmit={submit}>
        <p className="eyebrow">Almost done</p>
        <h3 className="display-lg mt-3">Where should we send it?</h3>
        <div className="mt-5 space-y-3">
          <input className="field" required autoFocus placeholder="Your name" autoComplete="name"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="field" required type="email" placeholder="Work email" autoComplete="email"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        {error && <p className="mt-3 text-[13.5px] text-red-600">{error}</p>}
        <button type="submit" disabled={sending} className="btn btn-primary w-full mt-5">
          {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <>Send my plan <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
    );

  if (open === "sheet") {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[90]" role="dialog" aria-modal="true" aria-label="Free bot plan offer">
        <div ref={panelRef} className="max-h-[35vh] overflow-y-auto bg-white border-t-2 border-ink-950 shadow-mega px-5 py-5 animate-fade-up">
          <button onClick={() => dismiss("x")} aria-label="Close"
            className="absolute top-3 right-3 flex items-center justify-center w-9 h-9 hover:bg-[var(--bg-alt)]">
            <X className="w-5 h-5" />
          </button>
          {formBody}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[90] bg-ink-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in"
      role="dialog" aria-modal="true" aria-label="Free bot plan offer"
      onClick={(e) => e.target === e.currentTarget && dismiss("backdrop")}
    >
      <div ref={panelRef} className="w-full max-w-[880px] bg-white shadow-mega overflow-hidden grid md:grid-cols-[0.85fr_1.15fr]">
        <div className="relative hidden md:flex flex-col justify-between bg-ink-950 on-dark p-8 overflow-hidden">
          <div className="absolute inset-0 bg-grid-dark opacity-60" />
          <div className="relative">
            <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] bg-accent-500">
              <BotFace className="w-6 h-5 text-ink-950" />
            </span>
            <p className="eyebrow mt-7">Before you go</p>
            <h2 className="display-lg mt-3 text-white">One page. <span className="em-green">Zero cost.</span></h2>
          </div>
          <ul className="relative mt-8 space-y-3">
            {["Where you are leaking", "Which bots plug it", "What each one is worth"].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-[13.5px] text-ink-300">
                <Check className="w-3.5 h-3.5 shrink-0 text-accent-400" strokeWidth={3} />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative p-7 sm:p-9">
          <button onClick={() => dismiss("x")} aria-label="Close"
            className="absolute top-4 right-4 flex items-center justify-center w-9 h-9 hover:bg-[var(--bg-alt)] transition-colors">
            <X className="w-5 h-5" />
          </button>
          {formBody}
        </div>
      </div>
    </div>
  );
}
