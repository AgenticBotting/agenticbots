import { Container } from "@/components/ui";
import { BOT_VIEWBOX, BOT_BODY_PATH, BOT_EYE_PATHS } from "@/components/ui/BotFace";
import { cn } from "@/lib/utils";

/**
 * The standing preview, shown until real footage exists.
 *
 * The old empty state was a dashed plate with a play button that played
 * nothing — a broken promise, and it printed the production brief
 * ("1920×1080 · screen recording of…") to actual visitors. This shows the
 * product moving instead, and says plainly that it is a simulation.
 */
function VideoPoster({ lines }: { lines: { t: string; a: string }[] }) {
  return (
    <div className="border border-ink-700 bg-ink-950 on-dark" style={{ aspectRatio: "16 / 9" }}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-ink-700 px-4 sm:px-5 h-10 shrink-0">
          <span className="flex items-center gap-2 mono text-[10px] uppercase tracking-[0.11em] text-ink-300">
            <span className="h-1.5 w-1.5 bg-accent-500 animate-pulse-dot" />
            Live preview
          </span>
          <span className="mono text-[10px] uppercase tracking-[0.11em] text-ink-400">
            Simulated · not a recording
          </span>
        </div>

        <ul className="flex-1 min-h-0 px-4 sm:px-5 py-3 sm:py-4 flex flex-col justify-center gap-2 sm:gap-3">
          {lines.map((l, i) => (
            <li
              key={l.a}
              className="vp-line flex items-baseline gap-3 sm:gap-4"
              style={{ animationDelay: `${i * 1.9}s` }}
            >
              <span className="mono text-[10px] sm:text-[11px] tabular-nums text-accent-400 shrink-0">{l.t}</span>
              <span className="text-[12.5px] sm:text-[14px] text-ink-200 leading-snug">{l.a}</span>
            </li>
          ))}
        </ul>

        <div className="shrink-0 px-4 sm:px-5 pb-4">
          <div className="relative h-6">
            <span className="vp-travel absolute left-0 top-0 block">
              <svg viewBox={BOT_VIEWBOX} width="26" aria-hidden="true">
                <path d={BOT_BODY_PATH} fill="var(--color-accent-500)" />
                <g fill="var(--color-ink-950)">
                  {BOT_EYE_PATHS.map((d) => <path key={d} d={d} />)}
                </g>
              </svg>
            </span>
          </div>
          <div className="relative h-px bg-ink-700">
            <span className="vp-progress absolute inset-0 block bg-accent-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The explainer video.
 *
 * Until a file exists the slot states what to record, at the exact ratio,
 * so the layout is finished before the footage is. Supply `src` and it
 * becomes a real player — controls on, no autoplay, no loop: a video that
 * starts talking at someone is a reason to leave.
 */
export function VideoSection({
  eyebrow = "Watch",
  heading,
  sub,
  src,
  poster,
  slotId = "V-MAIN",
  slotLabel = "Explainer video — how a bot actually works",
  slotSpec = "1920×1080 · 60–90s · screen recording of a real booking, voiceover in plain English, captions burned in",
  posterLines = [
    { t: "0:04", a: "Missed call caught — texted them back" },
    { t: "0:38", a: "Answered their questions, checked the calendar" },
    { t: "1:12", a: "Booked Thursday 10:00am, logged to the CRM" },
  ],
  className,
}: {
  eyebrow?: string;
  heading: React.ReactNode;
  sub?: string;
  src?: string;
  poster?: string;
  slotId?: string;
  slotLabel?: string;
  slotSpec?: string;
  /** What the standing preview ticks through. Keep it to three beats. */
  posterLines?: { t: string; a: string }[];
  className?: string;
}) {
  return (
    <section className={cn("border-b border-[var(--border)] bg-[var(--bg-alt)]", className)}>
      <Container className="section-pad">
        <div className="grid lg:grid-cols-[0.82fr_1.18fr] gap-10 lg:gap-16 items-center">
          <div>
            <p className="eyebrow mb-4">{eyebrow}</p>
            <h2 className="display-xl text-balance">{heading}</h2>
            {sub && <p className="body-lg mt-5 max-w-[46ch] text-pretty">{sub}</p>}
            <p className="mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--text-muted)] mt-7">
              No sound needed · captions on
            </p>
          </div>

          {src ? (
            <div className="border border-[var(--border-strong)] bg-ink-950 overflow-hidden">
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
            <div>
              <VideoPoster lines={posterLines} />
              {/* The production brief is a note to whoever is filming, not
                  something a prospect should read. Dev only. */}
              {process.env.NODE_ENV !== "production" && (
                <p className="mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)] mt-2">
                  {slotId} · {slotLabel} — {slotSpec}
                </p>
              )}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
