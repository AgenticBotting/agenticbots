"use client";

import { useEffect, useRef, useState } from "react";
import { BOT_VIEWBOX, BOT_PATH, BOT_BODY_PATH, BOT_EYE_PATHS } from "@/components/ui/BotFace";
import { cn } from "@/lib/utils";

/**
 * A bot that patrols the rim of whatever it wraps.
 *
 * The path is measured from the live element rather than hardcoded, so it
 * traces the real shape at any width — including the diagonal notch cut
 * into the filled buttons, which the bot walks down like a ramp. That
 * detail is the whole point: it reads as something following the edge of
 * the object, not a sprite looping over it.
 *
 * `offset-path` + `offset-rotate: auto` does the work, so the browser
 * animates it and the glyph banks into each corner on its own.
 *
 * Silent for `prefers-reduced-motion`, inert to the pointer, hidden from
 * assistive tech. It never sits between a visitor and the button.
 */
export function BotOrbit({
  children,
  /** Matches --notch in globals.css; 0 for square-cornered targets. */
  notch = 11,
  /** Seconds for one full lap. Slower reads as deliberate, not frantic. */
  duration = 9,
  /** Rim width of the crawler in px. */
  size = 13,
  /** Body color. Default reads against the accent fill of .btn-primary. */
  tone = "text-ink-950",
  /** Paint the eyes this color instead of leaving them as cutouts. Use it
      when the bot crosses surfaces that would show through the holes —
      e.g. the green crawler on the black header. */
  eyes,
  className,
}: {
  children: React.ReactNode;
  notch?: number;
  duration?: number;
  size?: number;
  tone?: string;
  eyes?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [motionOk, setMotionOk] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotionOk(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Same outline as the .notch clip-path: square but for the bottom-left
     corner, which is sliced off on the diagonal. */
  const path =
    box && box.w > 0
      ? `path("M 0 0 L ${box.w} 0 L ${box.w} ${box.h} L ${notch} ${box.h} L 0 ${box.h - notch} Z")`
      : undefined;

  return (
    <span ref={ref} className={cn("relative inline-flex", className)}>
      {children}

      {motionOk && path && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 bot-orbit"
          style={{
            offsetPath: path,
            offsetRotate: "auto",
            animationDuration: `${duration}s`,
          }}
        >
          <svg
            viewBox={BOT_VIEWBOX}
            width={size}
            className={cn("block -translate-y-1/2", tone)}
            aria-hidden="true"
          >
            {eyes ? (
              <>
                <path d={BOT_BODY_PATH} fill="currentColor" />
                <g className={eyes}>
                  {BOT_EYE_PATHS.map((d) => (
                    <path key={d} d={d} fill="currentColor" />
                  ))}
                </g>
              </>
            ) : (
              <path fillRule="evenodd" clipRule="evenodd" d={BOT_PATH} fill="currentColor" />
            )}
          </svg>
        </span>
      )}
    </span>
  );
}
