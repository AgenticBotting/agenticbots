import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The wordmark. The source asset is white-on-transparent, so the light
 * variant is produced by inverting it rather than shipping a second file.
 */
/** Intrinsic size of the cropped artwork. Passed to next/image as-is: a
 *  hand-rounded ratio drifts from the ratio of the variant the optimizer
 *  actually serves, which trips its dev-only aspect-ratio warning. */
const LOGO_W = 1970;
const LOGO_H = 263;

export function Logo({
  variant = "light",
  height = 30,
  className,
  href = "/",
}: {
  /** "light" = white artwork, for dark surfaces. "dark" = inverted, for white surfaces. */
  variant?: "light" | "dark";
  height?: number;
  className?: string;
  href?: string | null;
}) {
  const img = (
    <Image
      src="/logo.png"
      alt="AgenticBots"
      width={LOGO_W}
      height={LOGO_H}
      // Rendered width, so the optimizer still serves a small variant rather
      // than a source-sized one.
      sizes={`${Math.round((height * LOGO_W) / LOGO_H)}px`}
      priority
      // `max-w-none` opts out of the preflight `img { max-width: 100% }`.
      // At 7.5:1 the lockup is wide enough that a cramped header would
      // otherwise clamp its width while the fixed height held — squashing
      // the artwork rather than scaling it.
      // The wordmark is chrome, not content: a long press should not offer
      // to select or save it the way it would a photo in an article.
      className={cn(
        "max-w-none shrink-0 select-none [-webkit-touch-callout:none]",
        variant === "dark" && "invert",
      )}
      // Callers can drive the height responsively by setting --logo-h on any
      // ancestor; the `height` prop stays the default. `width` is set here
      // rather than via `w-auto` so Next's aspect-ratio check can see it.
      style={{ width: "auto", height: `var(--logo-h, ${height}px)` }}
    />
  );

  if (href === null) return <span className={className}>{img}</span>;

  return (
    <Link href={href} aria-label="AgenticBots — home" className={cn("inline-flex", className)}>
      {img}
    </Link>
  );
}
