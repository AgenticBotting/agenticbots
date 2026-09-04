import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * A reserved place for real artwork.
 *
 * The site is entirely type and line-drawn SVG, which is why it reads as
 * a wireframe rather than a finished design — every reference site we
 * compared against leads each section with a real image. These slots
 * mark exactly where those images go, at the exact ratio they need to
 * be, so the layout is already correct when the assets arrive.
 *
 * Pass `src` and the slot becomes the image. Until then it renders a
 * labeled plate that states what belongs there — legible in the layout,
 * obviously not final, and never mistaken for a broken image.
 *
 * Asset briefs live in docs/ASSET-BRIEF.md.
 */
export function MediaSlot({
  id,
  ratio = "16 / 10",
  label,
  spec,
  src,
  alt,
  priority,
  className,
}: {
  /** Matches the entry in docs/ASSET-BRIEF.md, e.g. "H-01". */
  id: string;
  /** CSS aspect-ratio string. */
  ratio?: string;
  /** What this image is, in a few words. */
  label: string;
  /** Pixel size + art direction, shown while the slot is empty. */
  spec: string;
  /** Supply this and the plate is replaced by the real image. */
  src?: string;
  alt?: string;
  priority?: boolean;
  className?: string;
}) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-[var(--bg-alt)]", className)} style={{ aspectRatio: ratio }}>
        <Image
          src={src}
          alt={alt ?? label}
          fill
          priority={priority}
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between overflow-hidden",
        "border border-dashed border-[var(--border-strong)] bg-[var(--bg-alt)] p-5",
        className
      )}
      style={{ aspectRatio: ratio }}
      role="img"
      aria-label={`Placeholder: ${label}`}
    >
      {/* Corner ticks — reads as a framing guide, not a broken asset. */}
      <svg className="absolute inset-0 w-full h-full text-[var(--border-strong)]" aria-hidden>
        <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="1" opacity="0.28" />
        <line x1="100%" y1="0" x2="0" y2="100%" stroke="currentColor" strokeWidth="1" opacity="0.28" />
      </svg>

      <div className="relative flex items-center justify-between gap-3">
        <span className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--accent-text)]">
          {id}
        </span>
        <span className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
          Image
        </span>
      </div>

      <div className="relative">
        <p className="text-[14px] font-semibold tracking-[-0.015em] leading-snug">{label}</p>
        <p className="mono text-[10.5px] leading-relaxed text-[var(--text-muted)] mt-1.5">{spec}</p>
      </div>
    </div>
  );
}
