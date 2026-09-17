"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts a numeral up from 0 the first time it scrolls into view, then
 * holds. Same IntersectionObserver shape as Reveal (fires once, 60px
 * early-trigger margin) — pairs with it rather than replacing it.
 *
 * Deliberately narrow: `value` must be a bare number ("38", "6.2", "0"),
 * with any unit (%, s, k…) passed separately as `suffix` — exactly how
 * ProofBar and StatSplit already split their numbers. A value that is
 * not cleanly numeric ("24/7", "<60s", "Auto") renders as plain text
 * with no attempt to animate it; those exist by design elsewhere in the
 * stat bands and forcing a count-up onto them would just be wrong.
 */
export function CountUp({
  value,
  suffix = "",
  duration = 1100,
  className,
}: {
  value: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const match = /^-?\d+(\.\d+)?$/.test(value.trim()) ? value.trim() : null;
  const target = match ? parseFloat(match) : null;
  const decimals = match?.includes(".") ? match.split(".")[1].length : 0;

  const ref = useRef<HTMLSpanElement>(null);
  // Renders the real number from the first paint — SSR output and the
  // pre-hydration client render both show the true value, so a crawler
  // or a reader with JS disabled sees "30 cities", never "0 cities".
  // The observer below replays the animation visually, from 0, purely as
  // a client-side enhancement layered on top of already-correct content.
  const [display, setDisplay] = useState(target !== null ? target.toFixed(decimals) : value);

  useEffect(() => {
    if (target === null) return;
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          // ease-out cubic — fast start, settles rather than snapping
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay((target * eased).toFixed(decimals));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { rootMargin: "0px 0px -60px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, decimals, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  );
}
