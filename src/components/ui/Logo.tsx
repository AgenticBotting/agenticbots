import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The wordmark. The source asset is white-on-transparent, so the light
 * variant is produced by inverting it rather than shipping a second file.
 */
/** Cropped artwork aspect ratio (1970 x 263). */
const LOGO_RATIO = 7.49;

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
      width={Math.round(height * LOGO_RATIO)}
      height={height}
      priority
      className={cn("w-auto", variant === "dark" && "invert")}
      style={{ height }}
    />
  );

  if (href === null) return <span className={className}>{img}</span>;

  return (
    <Link href={href} aria-label="AgenticBots — home" className={cn("inline-flex", className)}>
      {img}
    </Link>
  );
}
