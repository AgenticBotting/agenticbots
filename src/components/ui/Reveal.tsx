/**
 * Formerly a scroll-triggered fade-up on every section. Retired in the
 * Oct 2026 design pass: scattered entrance fades read as template, and the
 * page now spends its motion on one orchestrated moment (the hero clock).
 * Kept as a pass-through so the ~60 call sites keep compiling.
 */
export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return <div className={className}>{children}</div>;
}
