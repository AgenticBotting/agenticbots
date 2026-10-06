"use client";

import { useState, useRef, type FormEvent } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { track } from "@/lib/analytics";
import { AUDIT_OFFER } from "@/config/marketing-offer";
import { cn } from "@/lib/utils";

/** Requests the paid workflow audit through the existing lead intake endpoint. */

const TRADES = ["Residential", "Commercial", "Both"] as const;
const VOLUME = ["Under 25", "25–75", "75–200", "200+"] as const;

export function AuditForm({ source = "home-audit", focus, className }: { source?: string; focus?: string; className?: string }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", website: "", goal: "" });
  const [trade, setTrade] = useState<string>("");
  const [volume, setVolume] = useState<string>("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const started = useRef(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          website: form.website,
          company: form.website,
          focus: focus ? `${AUDIT_OFFER.name} · ${focus}` : AUDIT_OFFER.name,
          goal: [
            form.goal,
            trade && `Work: ${trade}`,
            volume && `Leads/mo: ${volume}`,
            form.phone && `Phone: ${form.phone}`,
          ].filter(Boolean).join(" · "),
          source,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Something went wrong. Try again."); setState("error"); return; }
      setState("done");
    } catch {
      setError("Network error. Try again.");
      setState("error");
    }
  }

  return (
    <div className={cn("@container border border-[var(--border-strong)] bg-white", className)}>
      <div className="bg-ink-950 on-dark px-5 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="mono text-[10.5px] uppercase tracking-[0.13em] text-ink-300">
          {AUDIT_OFFER.name}
          <span className="text-accent-400">{" · "}{state === "done" ? "Received" : AUDIT_OFFER.priceLabel}</span>
        </p>
        <p className="mono text-[10px] uppercase tracking-[0.1em] text-ink-400">Within {AUDIT_OFFER.turnaround}</p>
      </div>
      <div className="h-px rule-agent" />

      <div className="p-6 sm:p-9">
        {state === "done" ? (
          <div role="status" className="text-center py-6">
            <span className="mx-auto flex h-12 w-12 items-center justify-center bg-accent-500 text-ink-950 notch">
              <Check className="w-6 h-6" strokeWidth={3} />
            </span>
            <h3 className="display-lg mt-5">Audit request received.</h3>
            <p className="body-base mt-3 max-w-[44ch] mx-auto">
              We’ll confirm the scope and payment step by email, then review your operating context and identify a credible starting workflow.
              Written findings will arrive at {form.email} within {AUDIT_OFFER.turnaround} of payment.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} onFocus={() => { if (!started.current) { started.current = true; track("audit_form_started", { source }); } }}>
            <div className="grid @lg:grid-cols-2 gap-4">
              <Field label="Name" required>
                <input className="field" required autoComplete="name" placeholder="Jordan Reyes"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Email" required>
                <input className="field" required type="email" autoComplete="email" placeholder="jordan@reyesroofing.com"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Company website" required>
                <input className="field" required autoComplete="url" placeholder="reyesroofing.com"
                  value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </Field>
              <Field label="Phone" hint="Optional">
                <input className="field" type="tel" autoComplete="tel" placeholder="(561) 555-0142"
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
            </div>

            <div className="mt-6"><Field label="Which operating process needs attention?" hint="Optional"><textarea className="field min-h-[94px] resize-y" maxLength={1200} placeholder="Inbound response, proposal follow-through, CRM administration…" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} /></Field></div>

            <Choice label="What kind of work?" options={TRADES} value={trade} onChange={setTrade} />
            <Choice label="New leads a month" options={VOLUME} value={volume} onChange={setVolume} />

            {state === "error" && <p role="alert" className="mt-4 text-[13.5px] text-[var(--color-danger)]">{error}</p>}

            <div className="mt-7 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <button type="submit" disabled={state === "sending"} className="btn btn-primary sm:min-w-[260px]">
                {state === "sending"
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  : <>Request my {AUDIT_OFFER.priceLabel} audit <ArrowRight className="w-4 h-4" /></>}
              </button>
              <p className="body-sm">No charge today. Scope confirmed first.</p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block mb-1.5 text-[13px] font-medium text-[var(--text-secondary)]">
        {label}{" "}
        {required && <span className="text-[var(--accent-text)]">*</span>}
        {hint && <span className="text-[var(--text-muted)]">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Choice({ label, options, value, onChange }: {
  label: string; options: readonly string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <fieldset className="mt-6">
      <legend className="mb-2 text-[13px] font-medium text-[var(--text-secondary)]">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={value === o}
            onClick={() => onChange(o)}
            className={cn(
              "px-3.5 py-2 border text-[13.5px] font-medium transition-colors",
              value === o
                ? "border-ink-950 bg-ink-950 text-white"
                : "border-[var(--border)] bg-white hover:border-ink-950"
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
