import { cn } from "@/lib/utils";

/** Source artwork ratios. */
const ART = {
  lockup: { src: "/logo.png", ratio: 7.49 },  // 1970 x 263 — mark + wordmark
  mark: { src: "/mark.png", ratio: 1.677 },   // 421 x 251 — the AB icon alone
} as const;

/**
 * Brand artwork as a colorable shape.
 *
 * Both assets are white-on-transparent, so their alpha channel is the
 * silhouette. Using one as a CSS mask and painting the box with
 * `currentColor` lets the artwork take any color from the ramp and
 * transition between them — which `<Logo>`'s `invert()` trick cannot do
 * (that only yields black or white).
 *
 * Use this where the artwork needs to tint or animate; use <Logo> where
 * it should render as the artwork itself.
 */
export function LogoMask({
  art = "mark",
  height = 22,
  className,
}: {
  art?: keyof typeof ART;
  height?: number;
  className?: string;
}) {
  const { src, ratio } = ART[art];
  return (
    <span
      aria-hidden="true"
      className={cn("block shrink-0 bg-current", className)}
      style={{
        height,
        width: Math.round(height * ratio),
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}
