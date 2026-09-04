"use client";

import { useEffect, useState } from "react";
import { BotFace } from "@/components/ui";

const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];

/**
 * The konami easter egg (Phase 5): a rogue agent scoots across the
 * viewport, apologizes, and files itself as an incident. Discovered,
 * not advertised. Renders nothing until earned.
 */
export function RogueBot() {
  const [run, setRun] = useState(0);

  useEffect(() => {
    let i = 0;
    const onKey = (e: KeyboardEvent) => {
      i = e.key === KONAMI[i] ? i + 1 : e.key === KONAMI[0] ? 1 : 0;
      if (i === KONAMI.length) { i = 0; setRun((r) => r + 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!run) return null;

  return (
    <div key={run} aria-hidden="true" className="fixed bottom-8 left-0 z-[95] pointer-events-none rogue-run">
      <div className="flex items-end gap-2">
        <BotFace className="w-14 h-11 text-accent-500 bot-glow" />
        <span className="mono text-[10px] text-[var(--text-muted)] bg-white rounded-[var(--radius)] border border-[var(--border)] px-2 py-1 mb-1 whitespace-nowrap">
          unauthorized lap · logging incident INC-0042 · self-reported
        </span>
      </div>
    </div>
  );
}
