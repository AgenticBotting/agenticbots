"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Download, Loader2, Lock } from "lucide-react";
import { LogoMask, BotPattern } from "@/components/ui";
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
 *
 * Presented as an object rather than a form with a picture next to it.
 * The cover is a book with thickness, sitting on a tinted plate with the
 * bot field behind it, and the contents read as a table of contents with
 * page numbers — because "18 pages" is a claim and a contents list is
 * evidence. The ask itself is one joined control: an email field and a
 * button that look like a single thing to operate.
 */

/** A contents page sells the substance better than a tick list does. */
const CONTENTS = [
  { page: "03", title: "What an agent actually is, without the hype" },
  { page: "06", title: "How to tell a real agent from a chatbot" },
  { page: "09", title: "The five jobs worth automating first" },
  { page: "13", title: "What it costs to run, honestly" },
  { page: "16", title: "Questions to ask any vendor before you sign" },
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
    <section className={cn("border-b border-[var(--border)] bg-[var(--bg-alt)]", className)}>
      <div className="container-site section-pad">
        {/* One bordered plate rather than a bare band: the offer reads as
            a thing being handed over, not another page section. */}
        <div className="relative border border-[var(--border-strong)] bg-[var(--background)] overflow-hidden">
          {/* The bot field, kept faint and clipped to its own layer so it
              never fights the copy. */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <BotPattern className="absolute -right-24 -top-16 w-[560px] opacity-[0.05]" position="center" />
          </div>

          <div className="relative grid lg:grid-cols-[0.78fr_1.22fr] gap-10 lg:gap-14 items-center p-7 sm:p-10 lg:p-12">
            <BookCover />

            <div className="min-w-0">
              <p className="eyebrow">
                Free guide · <span className="eyebrow-dim">no call required</span>
              </p>
              <h2 className="display-xl mt-3 text-balance">
                Introduction to agentic bots and <span className="em-green">AI agents.</span>
              </h2>
              <p className="body-lg mt-4 max-w-[52ch] text-pretty">
                A plain-English guide to what these systems actually do, what they cost to run,
                and which jobs are worth handing over first. Written for owners, not engineers.
              </p>

              {/* Contents, with page numbers. Reads as a book rather than
                  as marketing bullets, and it is the same list either way. */}
              <div className="mt-7">
                <p className="eyebrow">Inside</p>
                <ol className="mt-3 border-t border-[var(--border)]">
                  {CONTENTS.map((entry) => (
                    <li
                      key={entry.page}
                      className="flex items-baseline gap-3 py-2.5 border-b border-[var(--border)]"
                    >
                      <span className="mono text-[11px] text-[var(--text-muted)] tabular-nums shrink-0">
                        {entry.page}
                      </span>
                      <span className="text-[14.5px] leading-snug">{entry.title}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {state === "done" ? (
                <div
                  role="status"
                  className="mt-7 border border-accent-500 bg-accent-50 p-5"
                >
                  <span className="mb-3 grid h-9 w-9 place-items-center bg-accent-500 notch">
                    <Check className="w-4 h-4 text-ink-950" strokeWidth={3} />
                  </span>
                  <p className="display-md">On its way to {email}</p>
                  <p className="body-sm mt-1.5">
                    It lands in a minute or two. If it does not, check spam for a message from
                    hello@agenticbots.dev.
                  </p>
                </div>
              ) : (
                <>
                  {/* One control, not two: the field and the button share a
                      border so the whole thing reads as a single action. */}
                  <form onSubmit={onSubmit} className="mt-7 max-w-[540px]">
                    <div className="flex flex-col sm:flex-row sm:items-stretch border border-[var(--border-strong)] bg-[var(--background)] focus-within:border-[var(--accent-text)] focus-within:shadow-[0_0_0_3px_rgba(95,122,0,0.14)] transition-shadow">
                      <input
                        required
                        type="email"
                        value={email}
                        autoComplete="email"
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Work email"
                        aria-label="Work email"
                        className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-[15px] outline-none placeholder:text-[var(--text-muted)]"
                      />
                      <button
                        type="submit"
                        disabled={state === "sending"}
                        className="btn btn-primary !h-auto shrink-0 m-1.5 sm:my-1.5 sm:mr-1.5 sm:ml-0 px-5 py-3"
                      >
                        {state === "sending" ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                        ) : (
                          <><Download className="w-4 h-4" /> Send me the guide <ArrowRight className="w-4 h-4" /></>
                        )}
                      </button>
                    </div>
                  </form>

                  {state === "error" && (
                    <p role="alert" className="mt-3 text-[13.5px] text-[var(--color-danger)]">{error}</p>
                  )}

                  <p className="body-xs mt-3.5 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 shrink-0" />
                    One email with the guide attached. No sequence you did not ask for, and you
                    can unsubscribe from that one email.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * The cover, as a book with thickness.
 *
 * A flat rectangle reads as a slide; a slight turn, a spine and stacked
 * page edges read as something you are being handed. All CSS — no image
 * to load, and it stays sharp at any size. The turn straightens on hover
 * because a thing that responds feels like an object rather than a
 * picture of one.
 *
 * `transform-style: preserve-3d` is what keeps the spine attached to the
 * cover when the whole assembly rotates; without it the browser flattens
 * the child and the spine slides off the edge.
 */
function BookCover() {
  return (
    <div className="mx-auto w-full max-w-[300px] lg:max-w-none" style={{ perspective: "1600px" }}>
      <div
        className="group relative transition-transform duration-500 ease-[var(--ease-smooth)] hover:[transform:rotateY(-4deg)_rotateX(1deg)]"
        style={{ transformStyle: "preserve-3d", transform: "rotateY(-13deg) rotateX(2deg)" }}
        aria-hidden="true"
      >
        {/* Page edges, stacked behind the cover to give it depth. */}
        <span
          className="absolute inset-y-[6px] -right-[7px] w-[7px] bg-[linear-gradient(90deg,#E2E6E1_0%,#F7F9F6_35%,#D9DDD9_60%,#F7F9F6_100%)]"
          style={{ transform: "rotateY(12deg) translateZ(-2px)" }}
        />

        <div
          className="relative border border-[var(--border-strong)] bg-white shadow-mega select-none"
          style={{ aspectRatio: "3 / 4" }}
        >
          {/* The spine: a darker band with the binding line on it. */}
          <span className="absolute inset-y-0 left-0 w-[14px] bg-[linear-gradient(90deg,#E2E6E1_0%,#F7F9F6_55%,#FFFFFF_100%)] border-r border-[var(--border)]" />
          <span className="absolute inset-y-0 left-[5px] w-px bg-[var(--border)]" />

          <div className="absolute inset-0 flex flex-col pl-8 pr-6 py-6 sm:pl-9 sm:pr-7 sm:py-7">
            <span className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--accent-text)]">
              AgenticBots · Field guide
            </span>

            <span className="mt-auto block display-xl leading-[1.08] tracking-[-0.035em]">
              Introduction to agentic bots and AI&nbsp;agents.
            </span>
            <span className="mt-4 block h-px w-14 bg-accent-500" />
            <span className="mt-4 block text-[12.5px] leading-snug text-[var(--text-secondary)]">
              What they do, what they cost, and which jobs to hand over first.
            </span>

            <span className="mt-6 flex items-center justify-between gap-3">
              <LogoMask art="mark" height={18} className="text-ink-950" />
              <span className="mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                PDF · 18 pages
              </span>
            </span>
          </div>

          {/* A single sheen — enough to read as a printed surface catching
              light, faint enough that it never washes out the title under
              it. The first pass at 0.55 did exactly that. */}
          <span
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(105deg, rgba(255,255,255,0) 42%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0) 60%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
