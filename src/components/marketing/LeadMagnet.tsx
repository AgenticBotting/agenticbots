"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Download, Loader2 } from "lucide-react";
import { MediaSlot } from "@/components/ui";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * The guide download.
 *
 * Posts to /api/plan like every other capture — one endpoint, one place a
 * lead can land — but fires its own `guide_requested` event and carries a
 * `guide:` source so a download never gets counted as a bot-plan request.
 * Mixing the two would make the primary conversion metric unreadable from
 * day one (audit finding B6).
 */

const INSIDE = [
  "What an agent actually is, without the hype",
  "The five jobs worth automating first",
  "What it costs to run, honestly",
  "Questions to ask any vendor before you sign",
  "How to tell a real agent from a chatbot",
];

export function LeadMagnet({
  source = "home",
  className,
}: {
  source?: string;
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
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Guide reader",
          email,
          focus: "Guide download",
          goal: "Requested: Introduction to Agentic Bots",
          source: `guide:${source}`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Something went wrong."); setState("error"); return; }
      track("guide_requested", { source });
      setState("done");
    } catch {
      setError("Network error. Try again.");
      setState("error");
    }
  }

  return (
    <section className={cn("border-b border-[var(--border)]", className)}>
      <div className="container-site section-pad">
        <div className="grid lg:grid-cols-[0.7fr_1.3fr] gap-10 lg:gap-16 items-center">
          <MediaSlot
            id="G-01"
            ratio="3 / 4"
            label="Guide cover — Introduction to Agentic Bots"
            spec="1200×1600 · portrait · the cover as it will look as a PDF thumbnail. Title set in Geist 600, black on white, AB mark bottom-left."
          />

          <div>
            <p className="eyebrow mb-4">Free guide · no call required</p>
            <h2 className="display-xl text-balance">
              Introduction to agentic bots and <span className="em-green">AI agents.</span>
            </h2>
            <p className="body-lg mt-5 max-w-[52ch]">
              A plain-English guide to what these systems actually do, what they cost to run,
              and which jobs are worth handing over first. Written for owners, not engineers.
            </p>

            <ul className="mt-7 grid sm:grid-cols-2 gap-x-8 gap-y-2.5 max-w-[640px]">
              {INSIDE.map((i) => (
                <li key={i} className="flex items-start gap-2.5 text-[14px] leading-snug text-[var(--text-body)]">
                  <Check className="w-3.5 h-3.5 shrink-0 mt-[3px] text-[var(--accent-text)]" strokeWidth={3} />
                  {i}
                </li>
              ))}
            </ul>

            {state === "done" ? (
              <p role="status" className="mt-8 inline-flex items-center gap-2.5 border border-accent-500 bg-accent-100 px-5 py-3.5 text-[14.5px] font-semibold text-[var(--accent-text)]">
                <Check className="w-4 h-4" strokeWidth={3} />
                On its way to {email}.
              </p>
            ) : (
              <>
                <form onSubmit={onSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-[520px]">
                  <input
                    required type="email" value={email} autoComplete="email"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Work email" aria-label="Work email"
                    className="field flex-1"
                  />
                  <button type="submit" disabled={state === "sending"} className="btn btn-primary shrink-0">
                    {state === "sending"
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                      : <><Download className="w-4 h-4" /> Send me the guide <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
                {state === "error" && <p role="alert" className="mt-3 text-[13.5px] text-[var(--color-danger)]">{error}</p>}
                <p className="body-sm mt-3">
                  One email with the guide. No sequence you did not ask for.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
