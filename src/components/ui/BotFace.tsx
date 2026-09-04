import { cn } from "@/lib/utils";

/**
 * The AgenticBots mark, traced from the master artwork.
 *
 * Measured geometry (normalised): 3.112:1 · left edge slopes from x=0.184
 * at the top to x=0 at the bottom · right edge is a true semicircular cap ·
 * eyes are stadiums at y 0.331–0.675, x 0.215–0.467 and 0.607–0.862.
 *
 * The eyes are real cutouts (evenodd, no mask ids) so the mark sits on any
 * background and can be repeated hundreds of times without duplicate ids.
 */

/** viewBox is 100 x 32.13 — the measured ratio. */
export const BOT_VIEWBOX = "0 0 100 32.13";
export const BOT_RATIO = 3.112;

export const BOT_PATH = [
  // Body: diagonal in from the left, flat top, semicircular right cap, flat bottom.
  "M18.4 0H83.94a16.07 16.07 0 0 1 0 32.13H0Z",
  // Left eye.
  "M27.03 10.64h14.16a5.51 5.51 0 0 1 0 11.02H27.03a5.51 5.51 0 0 1 0-11.02Z",
  // Right eye.
  "M66.21 10.64h14.5a5.51 5.51 0 0 1 0 11.02h-14.5a5.51 5.51 0 0 1 0-11.02Z",
].join("");

export function BotFace({ className }: { className?: string }) {
  return (
    <svg viewBox={BOT_VIEWBOX} fill="none" className={cn("block", className)} aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d={BOT_PATH} fill="currentColor" />
    </svg>
  );
}
