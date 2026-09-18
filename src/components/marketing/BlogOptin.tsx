"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The fuller lead-gen ask on the blog — end of a post and foot of the index.
 *
 * Deliberately quiet: a light hairline card rather than the dark
 * pattern-backed slab it used to be. The reading surface is white, so a
 * black block with a bot field behind the headline competed with the
 * article instead of closing it. What carries the block now is structure —
 * one rule above the eyebrow, one bordered input group, and the only
 * saturated thing on screen being the button.
 *
 * The fields sit in a single bordered group (stacked on mobile, side by
 * side from sm) so the whole thing reads as one control, not a form.
 */
export function BlogOptin({
  source = "blog",
  className,
}: {
  source?: string;
  className?: string;
}) {
  const [form, setForm] = useState({ name: "", email: "" });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, focus: "Not sure yet", source }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Something went wrong."); setState("error"); return; }
      setState("done");
    } catch {
      setError("Network error. Try again.");
      setState("error");
    }
  }

  return (
    <aside
      className={cn(
        "border border-[var(--border)] bg-[var(--bg-alt)] px-6 py-12 sm:px-10 sm:py-14 text-center",
        className
      )}
    >
      <div className="mx-auto max-w-[52ch]">
        {state === "done" ? (
          <>
            <span className="mx-auto mb-5 flex h-10 w-10 items-center justify-center notch bg-accent-500 text-ink-950">
              <Check className="w-4.5 h-4.5" strokeWidth={3} />
            </span>
            <h3 role="status" className="display-lg">You&apos;re on the list.</h3>
            <p className="body-sm mt-2">Your bot plan lands within one business day.</p>
          </>
        ) : (
          <>
            {/* A short rule instead of a colored eyebrow: the label stays
                metadata-quiet and the block still opens with a mark. */}
            <span aria-hidden className="mx-auto mb-5 block h-px w-10 bg-[var(--border-strong)]" />
            <p className="eyebrow eyebrow-dim">Free · one business day</p>

            <h3 className="display-lg mt-3 text-balance">
              Where is your business losing customers?
            </h3>
            <p className="body-sm mt-3 text-pretty">
              Tell us what you sell. We map every point between a lead arriving and a
              job closing where people drop out, and name the bots that fix it.
            </p>

            <form onSubmit={onSubmit} className="mx-auto mt-7 max-w-[460px]">
              <div className="flex flex-col border border-[var(--border-strong)] bg-[var(--background)] sm:flex-row focus-within:border-[var(--accent-text)]">
                <input
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[14.5px] outline-none placeholder:text-[var(--text-muted)]"
                  required placeholder="Your name" aria-label="Your name" autoComplete="name"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                {/* One hairline between the two fields — horizontal while
                    stacked, vertical once they sit side by side. */}
                <span aria-hidden className="h-px w-full bg-[var(--border)] sm:h-auto sm:w-px" />
                <input
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[14.5px] outline-none placeholder:text-[var(--text-muted)]"
                  required type="email" placeholder="Work email" aria-label="Work email" autoComplete="email"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <button type="submit" disabled={state === "sending"} className="btn btn-primary mt-3 w-full">
                {state === "sending"
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  : <>Get my bot plan <ArrowRight className="w-4 h-4" /></>}
              </button>

              {state === "error" && (
                <p role="alert" className="mt-3 text-[13px] text-[var(--color-danger)]">{error}</p>
              )}
            </form>

            <p className="body-xs mt-4">No spam. Unsubscribe any time.</p>
          </>
        )}
      </div>
    </aside>
  );
}
