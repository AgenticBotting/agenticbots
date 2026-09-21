"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

/**
 * The sticky buy bar.
 *
 * Appears once the hero's buy button has scrolled away and hides again
 * at the footer CTA, so there is never a moment mid-page where someone
 * has decided and has to hunt for the button — and never two buy buttons
 * on screen at once, which reads as desperate.
 *
 * Uses an IntersectionObserver on the hero rather than a scroll listener:
 * no work on every frame, and it stays correct at any viewport height.
 */
export function BuyBar({ price }: { price: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("buy-hero");
    const closer = document.getElementById("buy-closer");
    if (!hero) return;

    let heroGone = false;
    let closerShown = false;
    const sync = () => setVisible(heroGone && !closerShown);

    const heroWatch = new IntersectionObserver(
      ([entry]) => { heroGone = !entry.isIntersecting; sync(); },
      { rootMargin: "-80px 0px 0px 0px" }
    );
    heroWatch.observe(hero);

    const closerWatch = closer
      ? new IntersectionObserver(([entry]) => { closerShown = entry.isIntersecting; sync(); })
      : null;
    if (closer && closerWatch) closerWatch.observe(closer);

    return () => { heroWatch.disconnect(); closerWatch?.disconnect(); };
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[var(--dark-border)] bg-[var(--color-ink-950)] transition-transform duration-300 ease-[var(--ease-smooth)] ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <div className="container-site flex items-center justify-between gap-4 py-3">
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold text-white truncate">
            Programmatic Google Ads with Claude Code
          </p>
          <p className="mono text-[11px] text-[var(--color-ink-400)] truncate">
            17 lessons · the repo · lifetime updates
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:block text-[20px] font-semibold tracking-[-0.04em] text-white">
            ${price}
          </span>
          <Link href="/course/checkout" className="btn btn-primary" tabIndex={visible ? 0 : -1}>
            Get the course <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
