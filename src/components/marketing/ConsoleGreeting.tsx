"use client";

import { useEffect } from "react";

/**
 * A message for whoever opens devtools — the audience for an agentic
 * product overlaps heavily with people who actually look. Console only,
 * never rendered, discovered rather than advertised. Points at the
 * Konami-code bot in RogueBot.tsx rather than duplicating it, so finding
 * one easter egg is how you find the other.
 */
export function ConsoleGreeting() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    const brand = "color:#7FA200;font-weight:600;font-size:13px;";
    const dim = "color:#8C928C;font-size:12px;";
    console.log("%cAgenticBots", brand);
    console.log(
      "%cYou're either debugging something, or exactly who this site is for. Either way — try ↑ ↑ ↓ ↓ ← → ← → b a somewhere on this page.",
      dim
    );
  }, []);

  return null;
}
