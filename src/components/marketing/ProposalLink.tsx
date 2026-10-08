"use client";

import type { MouseEvent, ReactNode } from "react";
import { openBotPlan } from "@/lib/lead-flow";

/** A real fallback destination plus an immediate, page-preserving intake. */
export function ProposalLink({ children, className, source = "site", focus, onClick }: {
  children: ReactNode; className?: string; source?: string; focus?: string; onClick?: () => void;
}) {
  function begin(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    onClick?.();
    // Allow a navigation drawer to release focus and scroll before opening.
    requestAnimationFrame(() => openBotPlan(source, focus));
  }
  return <a href="/plan" className={className} onClick={begin} aria-haspopup="dialog" data-proposal-entry>{children}</a>;
}
