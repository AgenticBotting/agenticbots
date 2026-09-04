"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Loader2, Mail } from "lucide-react";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

async function subscribe(email: string, source: string) {
  const res = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Subscriber", email, focus: "Not sure yet", source }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
}

/**
 * Single-field email capture, two shapes:
 *   "bar"  — inline row under the post masthead (the hero optin).
 *   "card" — the sticky sidebar block beside the reading column.
 * Both post to /api/plan, the same endpoint as every other lead surface.
 */
export function PostOptin({
  source,
  variant = "bar",
  className,
}: {
  source: string;
  variant?: "bar" | "card";
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      await subscribe(email, source);
      track("plan_form_submitted", { source, focus: "newsletter" });
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Try again.");
      setState("error");
    }
  }

  if (variant === "bar") {
    return (
      <div className={cn("mx-auto max-w-[440px]", className)}>
        {state === "done" ? (
          <p role="status" className="flex items-center justify-center gap-2 border border-accent-500 bg-accent-100 px-5 py-3 text-[14px] font-semibold text-[var(--accent-text)]">
            <Check className="w-4 h-4" strokeWidth={3} />
            You&apos;re on the list.
          </p>
        ) : (
          <>
            <form onSubmit={onSubmit} className="flex items-stretch border border-[var(--border-strong)] bg-white">
              <span className="flex items-center pl-4 text-[var(--text-muted)]">
                <Mail className="w-4 h-4" />
              </span>
              <input
                required type="email" value={email} autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Get new posts — enter your email"
                aria-label="Email address"
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[14px] outline-none placeholder:text-[var(--text-muted)]"
              />
              <button type="submit" disabled={state === "sending"} className="btn btn-primary !px-5 shrink-0">
                {state === "sending"
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <>Subscribe <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
            {state === "error" && <p role="alert" className="mt-2 text-[13px] text-[var(--color-danger)]">{error}</p>}
          </>
        )}
      </div>
    );
  }

  return (
    <aside className={cn("border border-[var(--border)] bg-[var(--bg-alt)] p-6", className)}>
      {state === "done" ? (
        <>
          <span className="mb-4 flex h-9 w-9 items-center justify-center bg-accent-500 text-ink-950 notch">
            <Check className="w-4.5 h-4.5" strokeWidth={3} />
          </span>
          <p role="status" className="display-md">You&apos;re on the list.</p>
          <p className="body-sm mt-2">The next one lands in your inbox.</p>
        </>
      ) : (
        <>
          <span className="mb-4 flex h-9 w-9 items-center justify-center bg-accent-500 text-ink-950 notch">
            <Mail className="w-4.5 h-4.5" />
          </span>
          <p className="display-md">Get more like this</p>
          <p className="body-sm mt-2">
            What running agent fleets in production actually teaches us. No spam.
          </p>
          <form onSubmit={onSubmit} className="mt-5 space-y-2.5">
            <input
              required type="email" value={email} autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email" aria-label="Email address"
              className="field"
            />
            {state === "error" && <p role="alert" className="text-[13px] text-[var(--color-danger)]">{error}</p>}
            <button type="submit" disabled={state === "sending"} className="btn btn-primary w-full">
              {state === "sending"
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                : "Subscribe"}
            </button>
          </form>
        </>
      )}
    </aside>
  );
}
