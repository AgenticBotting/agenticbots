import { Fragment, type CSSProperties } from "react";
import { balanceHeroHeading, type HeroWord } from "@/lib/hero-heading";
import { cn } from "@/lib/utils";

/** Server-rendered, with complete desktop copy and an optional compact layout.
 * CSS selects one accessible heading treatment; no measuring script or clipping. */
export function HeroHeading({ text, accent, className, compact }: {
  text: string; accent?: string; className?: string;
  compact?: { text: string; accent?: string; context: string };
}) {
  const { lines, width } = balanceHeroHeading(text, accent);
  const mobile = compact ? balanceHeroHeading(compact.text, compact.accent, true) : undefined;
  return <div className="hero-heading-frame">
    {compact && <p className="hero-heading-context">{compact.context}</p>}
    <h1 className={cn("display-hero hero-heading", compact && "hero-heading-has-compact", className)} style={{ "--hero-line-width": width.toFixed(3), "--hero-compact-width": mobile?.width.toFixed(3) } as CSSProperties}>
      <span className="hero-heading-full"><Lines lines={lines} /></span>
      {mobile && <span className="hero-heading-compact"><Lines lines={mobile.lines} /></span>}
    </h1>
  </div>;
}

function Lines({ lines }: { lines: HeroWord[][] }) {
  return lines.map((line, i) => <Fragment key={i}>{i > 0 && " "}<span className="hero-heading-line"><Line words={line} /></span></Fragment>);
}

function Line({ words }: { words: HeroWord[] }) {
  const plain = words.filter(word => !word.accent).map(word => word.text).join(" ");
  const accent = words.filter(word => word.accent).map(word => word.text).join(" ");
  return <>{plain}{plain && accent ? " " : ""}{accent && <span className="hero-heading-accent">{accent}</span>}</>;
}
