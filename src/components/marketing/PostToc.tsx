"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Table of contents with scroll-spy (Phase 4).
 * Sticky left rail ≥lg; collapsible details element below.
 */
export function PostToc({ items }: { items: { id: string; text: string }[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-8% 0px -78% 0px" }
    );
    items.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [items]);

  if (!items.length) return null;

  const list = (
    <ol className="space-y-2.5">
      {items.map((h) => (
        <li key={h.id}>
          <a
            href={`#${h.id}`}
            aria-current={active === h.id ? "true" : undefined}
            className={cn(
              "block text-[13px] leading-snug transition-colors border-l-2 pl-3 py-0.5",
              active === h.id
                ? "border-accent-500 text-[#1A1A1A] font-medium"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-body)]"
            )}
          >
            {h.text}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      {/* Desktop rail */}
      <nav aria-label="On this page" className="hidden lg:block">
        <div className="sticky top-28">
          <p className="mono text-[10.5px] uppercase tracking-[0.11em] text-[var(--text-muted)] mb-4">
            On this page
          </p>
          {list}
        </div>
      </nav>
      {/* Mobile accordion */}
      <details className="lg:hidden rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-3 mb-8">
        <summary className="mono text-[11px] uppercase tracking-[0.11em] cursor-pointer text-[var(--text-secondary)]">
          On this page
        </summary>
        <div className="pt-3">{list}</div>
      </details>
    </>
  );
}
