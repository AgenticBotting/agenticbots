"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { BotPattern } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Centered lead-gen block for the blog. Sits inline in the reading column
 * rather than in a sidebar, so it works at every width and reads as part
 * of the article instead of an ad rail.
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
        "relative overflow-hidden bg-ink-950 on-dark px-7 py-10 sm:px-12 sm:py-14 text-center",
        className
      )}
    >
      <BotPattern className="absolute inset-0 opacity-70" position="center" />

      <div className="relative mx-auto max-w-[46ch]">
        {state === "done" ? (
          <>
            <span className="mx-auto mb-5 flex h-11 w-11 items-center justify-center notch bg-signal-500 text-ink-950">
              <Check className="w-5 h-5" strokeWidth={3} />
            </span>
            <h3 className="display-lg">You&apos;re on the list.</h3>
            <p className="body-base mt-3">
              Your bot plan lands within one business day.
            </p>
          </>
        ) : (
          <>
            <p className="eyebrow">Free · one business day</p>
            <h3 className="display-xl mt-4 text-balance">
              Where is your business <span className="em-green">losing customers?</span>
            </h3>
            <p className="body-base mt-4">
              Tell us what you sell. We map every point between a lead arriving and a
              job closing where people drop out, and name the bots that fix it.
            </p>

            <form onSubmit={onSubmit} className="mt-8 mx-auto max-w-[420px] space-y-3">
              <input
                className="field text-center" required placeholder="Your name" autoComplete="name"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                className="field text-center" required type="email" placeholder="Work email" autoComplete="email"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {state === "error" && <p className="text-[13.5px] text-red-400">{error}</p>}
              <button type="submit" disabled={state === "sending"} className="btn btn-primary w-full">
                {state === "sending"
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  : <>Get my bot plan <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
            <p className="body-xs mt-4">No spam. Unsubscribe any time.</p>
          </>
        )}
      </div>
    </aside>
  );
}
