import { cn } from "@/lib/utils";

/**
 * The numeral that replaced the icon set.
 *
 * Stock icons (a megaphone for ads, a magnifier for SEO) read as clip art
 * and say nothing. A numbered index is structural, unmistakably ours, and
 * carries the brand's diagonal cut.
 */
export function BotIndex({
  index,
  size = "md",
  tone = "dark",
  className,
}: {
  index: string;
  size?: "sm" | "md" | "lg";
  /** "dark" = black tile, "outline" = hairline on light, "light" = on dark bands. */
  tone?: "dark" | "outline" | "light";
  className?: string;
}) {
  const box = {
    sm: "h-8 w-8 text-[12px]",
    md: "h-11 w-11 text-[15px]",
    lg: "h-16 w-16 text-[22px]",
  }[size];

  const skin = {
    dark: "bg-ink-950 text-white",
    outline: "rounded-[var(--radius)] border border-[var(--border-strong)] text-[var(--foreground)]",
    light: "rounded-[var(--radius)] border border-ink-700 text-white",
  }[tone];

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-display font-semibold tracking-[-0.03em] tabular-nums rounded-[var(--radius-sm)]",
        box,
        skin,
        className
      )}
    >
      {index}
    </span>
  );
}
