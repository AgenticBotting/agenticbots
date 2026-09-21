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
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-[760px] text-center">
          <p className="eyebrow">
            Course · <span className="eyebrow-dim">{lessons} lessons · {hours} hours · ${price}</span>
          </p>
          <h1 className="display-hero mt-4 text-balance">
            Fire the retainer. <span className="em-green">Run the ads from your terminal.</span>
          </h1>
          <p className="body-lg mt-5 mx-auto max-w-[60ch] text-pretty">
            Watch the whole thing in three minutes: authenticate against the Google Ads API, build
            a campaign from a file, and let Claude Code do the daily review an account manager
            charges $1,500 a month for.
          </p>
        </div>

        {/* The video. Wider than the copy above it, so it reads as the
            main event rather than an illustration of the headline. */}
        <div className="mx-auto max-w-[980px] mt-8">
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
        </div>

        {/* Buy, immediately under the video — the moment conviction is
            highest is the moment the button has to be there. */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link href="/course/checkout" className="btn btn-primary">
            Get the course — ${price} <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/course/why-the-api" className="btn btn-outline">
            Read lesson one free
          </Link>
        </div>

        <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {[
            "One payment, lifetime access",
            "Node and Python",
            "30-day refund, no forms",
          ].map((item) => (
            <li key={item} className="flex items-center gap-1.5 body-xs">
              <Check className="w-3.5 h-3.5 text-[var(--accent-text)]" strokeWidth={2.5} />
              {item}
            </li>
          ))}
        </ul>
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
        className="grid sm:grid-cols-[auto_minmax(0,1fr)] gap-6 sm:gap-10 items-center px-5 sm:px-10 py-8 sm:py-12"
        style={{ minHeight: "min(40vw, 330px)" }}
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
