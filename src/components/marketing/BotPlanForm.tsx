"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { ALL_CATEGORIES } from "@/lib/catalog";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/** The site's single conversion form. Five fields, no dark background. */
export function BotPlanForm({
  source = "site",
  defaultFocus,
  compact = false,
  className,
}: {
  source?: string;
  defaultFocus?: string;
  compact?: boolean;
  className?: string;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    focus: defaultFocus ?? "",
    goal: "",
  });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    setError("");

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        setState("error");
        return;
      }
      track("plan_form_submitted", { source, focus: form.focus });
      setState("done");
    } catch {
      setError("Network error. Try again.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className={cn("card p-8 text-center", className)}>
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-none bg-[var(--bg-tint)] border border-[var(--border-tint)] text-[var(--accent-text)]">
          <Check className="w-5 h-5" strokeWidth={2.5} />
        </span>
        <h3 className="display-lg mt-5">Got it.</h3>
        <p className="body-base mt-3 max-w-[42ch] mx-auto">
          We read every request. Yours goes into the queue now — expect your bot plan
          within one business day, sent to {form.email}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("card p-6 sm:p-8", className)}>
      {!compact && (
        <>
          <p className="eyebrow">Free · no call required</p>
          <h3 className="display-lg mt-3">Get your bot plan.</h3>
          <p className="body-base mt-2.5 mb-7">
            Tell us what you sell and where it is getting stuck. We map which bots fix
            it and send the plan back — no pitch deck, no obligation.
          </p>
        </>
      )}

      <div className={cn("grid gap-4", !compact && "sm:grid-cols-2")}>
        <Field label="Name" required>
          <input
            className="field" required value={form.name} onChange={set("name")}
            autoComplete="name" placeholder="Jordan Reyes"
          />
        </Field>
        <Field label="Work email" required>
          <input
            className="field" required type="email" value={form.email} onChange={set("email")}
            autoComplete="email" placeholder="jordan@company.com"
          />
        </Field>
      </div>

      <div className={cn("grid gap-4 mt-4", !compact && "sm:grid-cols-2")}>
        <Field label="Company">
          <input
            className="field" value={form.company} onChange={set("company")}
            autoComplete="organization" placeholder="Company name"
          />
        </Field>
        <Field label="What needs the most help?" required>
          <select className="field" required value={form.focus} onChange={set("focus")}>
            <option value="" disabled>Pick one…</option>
            {ALL_CATEGORIES.map((c) => (
              <option key={`${c.pillar}-${c.slug}`} value={c.name}>
                {c.name}
              </option>
            ))}
            <option value="Not sure yet">Not sure yet</option>
          </select>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="What are you trying to fix?">
          <textarea
            className="field" rows={3} value={form.goal} onChange={set("goal")}
            placeholder="e.g. we get 40 leads a month and only call back half of them"
          />
        </Field>
      </div>

      {state === "error" && (
        <p className="mt-4 text-[13.5px] text-red-600">{error}</p>
      )}

      <button type="submit" disabled={state === "sending"} className="btn btn-primary w-full mt-6">
        {state === "sending" ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
        ) : (
          <>Get my bot plan <ArrowRight className="w-4 h-4" /></>
        )}
      </button>

      <p className="body-sm mt-4 text-center">
        One business day. No spam, no sales sequence you did not ask for.
      </p>
    </form>
  );
}

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block mb-1.5 text-[13px] font-medium text-[var(--text-secondary)]">
        {label}
        {required && <span className="text-[var(--accent-text)]"> *</span>}
      </span>
      {children}
    </label>
  );
}
