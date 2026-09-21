import Link from "next/link";
import { ArrowRight, Check, Play } from "lucide-react";
import { Container } from "@/components/ui";

/**
 * The video hero.
 *
 * A sales video is the one place this genre is right: three minutes of
 * someone running the thing beats any amount of copy. Until that footage
 * exists the slot plays a simulated session — the same trade the rest of
 * the site makes — and says so on the frame, because a play button that
 * plays nothing is the fastest way to lose the sale.
 *
 * Supply `src` and it becomes a real player: controls on, no autoplay.
 * A video that starts talking at someone is a reason to leave.
 */

const BEATS = [
  { t: "0:12", a: "Authenticate, and pull the account from the terminal" },
  { t: "0:58", a: "Build a whole campaign from one config file" },
  { t: "1:46", a: "Claude Code reads yesterday and proposes negatives" },
  { t: "2:31", a: "Caps and approvals — what it may never do alone" },
];

export function CourseHero({
  price,
  lessons,
  hours,
  src,
  poster,
}: {
  price: string;
  lessons: number;
  hours: number;
  src?: string;
  poster?: string;
}) {
  return (
    <section id="course-hero" className="border-b border-[var(--border)]">
      <Container className="py-10 sm:py-14">
        {/* Split, not stacked. A centred hero with the video under the
            copy pushes the buy button off the first screen on a laptop —
            and a sales page whose CTA needs a scroll to find is one that
            asks for commitment before it offers the option. */}
        <div className="grid lg:grid-cols-[0.92fr_1.08fr] gap-8 lg:gap-12 items-center">
          <div className="min-w-0">
            <p className="eyebrow">
              Course · <span className="eyebrow-dim">{lessons} lessons · {hours} hours · ${price}</span>
            </p>
            <h1 className="display-hero mt-3.5 max-w-[16ch] text-balance">
              Fire the retainer. <span className="em-green">Run the ads from your terminal.</span>
            </h1>
            <p className="body-lg mt-4 max-w-[52ch] text-pretty">
              Authenticate against the Google Ads API, build campaigns from a file, and let
              Claude Code do the daily review an account manager charges $1,500 a month for.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/course/checkout" className="btn btn-primary">
                Get the course — ${price} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/course/why-the-api" className="btn btn-outline">
                Read lesson one free
              </Link>
            </div>

            <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              {[
                "One payment, lifetime access",
                "Node and Python",
                "30-day refund",
              ].map((item) => (
                <li key={item} className="flex items-center gap-1.5 body-xs">
                  <Check className="w-3.5 h-3.5 text-[var(--accent-text)]" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* The video sits beside the offer rather than beneath it, so
              both are on the first screen. */}
          <div className="min-w-0">
            {src ? (
              <div className="border border-[var(--border-strong)] bg-[var(--color-ink-950)] overflow-hidden">
                <video
                  controls
                  preload="metadata"
                  poster={poster}
                  className="block w-full h-auto"
                  style={{ aspectRatio: "16 / 9" }}
                >
                  <source src={src} />
                  Your browser cannot play this video.
                </video>
              </div>
            ) : (
              <VideoStandIn />
            )}
            <p className="body-xs mt-2.5 text-center">
              The three-minute tour — every module, start to finish.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

/**
 * The stand-in frame.
 *
 * Shows the four things the video will show, on a timeline, so the slot
 * carries the argument even before it carries footage — and labels itself
 * a simulation rather than pretending to be a paused recording.
 */
function VideoStandIn() {
  return (
    <div className="border border-[var(--border-strong)] bg-[var(--color-ink-950)]">
      <div className="flex items-center justify-between gap-4 px-4 sm:px-5 h-10 border-b border-[var(--dark-border)]">
        <span className="flex items-center gap-2 mono text-[10px] uppercase tracking-[0.11em] text-[var(--color-ink-300)]">
          <span className="h-1.5 w-1.5 bg-[var(--color-accent-500)]" />
          The three-minute tour
        </span>
        <span className="mono text-[10px] uppercase tracking-[0.11em] text-[var(--color-ink-400)]">
          Recording · not yet live
        </span>
      </div>

      <div
        className="grid sm:grid-cols-[auto_minmax(0,1fr)] gap-5 sm:gap-8 items-center px-5 sm:px-8 py-7 sm:py-9"
        style={{ minHeight: "min(34vw, 300px)" }}
      >
        <span className="grid h-16 w-16 sm:h-20 sm:w-20 place-items-center border border-[var(--color-ink-600)] mx-auto">
          <Play className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--color-accent-400)]" strokeWidth={1.5} />
        </span>

        <ol className="space-y-3 sm:space-y-4 min-w-0">
          {BEATS.map((beat) => (
            <li key={beat.t} className="flex items-baseline gap-3 sm:gap-4">
              <span className="mono text-[10.5px] sm:text-[11px] tabular-nums text-[var(--color-accent-400)] shrink-0">
                {beat.t}
              </span>
              <span className="text-[13px] sm:text-[15px] leading-snug text-[var(--color-ink-200)]">
                {beat.a}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="px-5 sm:px-10 pb-5">
        <div className="h-px bg-[var(--dark-border)]">
          <span className="block h-px w-[38%] bg-[var(--color-accent-500)]" />
        </div>
        <p className="mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-ink-400)] mt-2.5">
          Being recorded · buyers get it free when it lands
        </p>
      </div>
    </div>
  );
}
