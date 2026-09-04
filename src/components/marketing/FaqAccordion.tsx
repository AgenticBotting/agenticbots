"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Faq } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function FaqAccordion({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="border-t border-[var(--border)]">
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className="border-b border-[var(--border)]">
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="w-full flex items-start justify-between gap-6 py-5 text-left group"
            >
              <span className="display-md text-[var(--foreground)] group-hover:text-[var(--accent-text)] transition-colors">
                {f.q}
              </span>
              <Plus
                className={cn(
                  "w-4.5 h-4.5 mt-1 shrink-0 text-[var(--text-muted)] transition-transform duration-200",
                  isOpen && "rotate-45"
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-250 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <p className="body-base pb-6 max-w-[70ch]">{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
