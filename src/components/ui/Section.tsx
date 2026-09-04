import { Container } from "./Container";
import { cn } from "@/lib/utils";

export type SectionVariant = "light" | "alt" | "dark";

const VARIANT: Record<SectionVariant, string> = {
  light: "bg-white",
  alt: "bg-[var(--bg-alt)]",
  dark: "bg-ink-900 on-dark",
};

/**
 * The section contract (Phase 3). Every marketing section accepts the
 * same props so pages are composition, not bespoke markup:
 * variant · eyebrow · heading · sub · media slot · cta slot · id.
 * Sections are reorderable without style breakage — surface, padding
 * and the divider all live here, never in the children.
 */
export function Section({
  id,
  variant = "light",
  eyebrow,
  heading,
  sub,
  media,
  cta,
  align = "left",
  size = "default",
  children,
  className,
}: {
  id?: string;
  variant?: SectionVariant;
  eyebrow?: React.ReactNode;
  heading?: React.ReactNode;
  sub?: React.ReactNode;
  /** Rendered full-width under the header block. */
  media?: React.ReactNode;
  /** Rendered after children, aligned with the header. */
  cta?: React.ReactNode;
  align?: "left" | "center";
  size?: "default" | "sm";
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      data-section={id}
      className={cn(
        "relative border-b border-[var(--border)]",
        variant === "dark" && "border-ink-700",
        VARIANT[variant],
        size === "sm" ? "section-pad-sm" : "section-pad",
        className
      )}
    >
      <Container className="relative">
        {(eyebrow || heading || sub) && (
          <div className={cn("max-w-[62ch]", align === "center" && "mx-auto text-center")}>
            {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
            {heading && <h2 className="display-xl text-balance">{heading}</h2>}
            {sub && <p className="body-lg mt-5 text-pretty">{sub}</p>}
          </div>
        )}
        {media && <div className="mt-12">{media}</div>}
        {children && <div className={cn(Boolean(eyebrow || heading) && "mt-12")}>{children}</div>}
        {cta && <div className={cn("mt-10", align === "center" && "text-center")}>{cta}</div>}
      </Container>
    </section>
  );
}
