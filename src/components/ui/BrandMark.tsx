import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The AB monogram as a section watermark.
 *
 * Sits off to the right, behind content, at a tint you have to look for.
 * The source asset is white-on-transparent, so the light-surface variant
 * is produced by inverting rather than shipping a second file.
 */
export function BrandMark({
  className,
  tone = "light",
  size = 520,
}: {
  className?: string;
  /** "light" = faint dark mark on a white section. "dark" = faint white mark on a dark one. */
  tone?: "light" | "dark";
  size?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none select-none absolute", className)}
      style={{ width: size }}
    >
      <Image
        src="/mark.png"
        alt=""
        width={size}
        height={Math.round(size / 1.677)}
        className={cn("w-full h-auto", tone === "light" && "invert")}
        style={{ opacity: tone === "light" ? 0.038 : 0.05 }}
      />
    </div>
  );
}
