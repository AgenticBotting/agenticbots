"use client";

import { useEffect, useState } from "react";

/** 2px accent reading-progress bar, fixed top (Phase 4 spec). */
export function ReadingProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setPct(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div aria-hidden="true" className="fixed top-0 inset-x-0 z-[70] h-[2px] pointer-events-none">
      <div className="h-full bg-accent-500" style={{ width: `${pct}%` }} />
    </div>
  );
}
