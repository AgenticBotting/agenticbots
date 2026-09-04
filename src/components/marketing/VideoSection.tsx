import { Play } from "lucide-react";
import { Container, MediaSlot } from "@/components/ui";
import { cn } from "@/lib/utils";

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
            <div className="relative">
              <MediaSlot id={slotId} ratio="16 / 9" label={slotLabel} spec={slotSpec} />
              {/* Play affordance so the slot reads as a video, not an image. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <span className="flex h-14 w-14 items-center justify-center bg-ink-950 text-accent-500 notch">
                  <Play className="w-6 h-6 ml-1" strokeWidth={2.5} />
                </span>
              </span>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
