import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Container, Reveal } from "@/components/ui";
import type { ReactNode } from "react";

/**
 * One band of the Z.
 *
 * Copy on one side, the artefact on the other, sides alternating down the
 * page so the eye zig-zags instead of sliding down a single column. Two
 * details that make it work rather than just look like it does:
 *
 *  · The art is FIRST in the DOM and re-ordered with CSS on the wide
 *    layout only. On a phone every row then reads copy-then-picture,
 *    instead of half the page starting with an image and no context.
 *  · Every row ends in a link. A long page where only the top and bottom
 *    can be acted on wastes the four moments in between where someone
 *    was convinced.
 */
export function ZRow({
  eyebrow,
  title,
  body,
  points,
  art,
  cta,
  flip,
  tint,
}: {
  eyebrow: string;
  title: ReactNode;
  body: string;
  points?: string[];
  art: ReactNode;
  cta: { href: string; label: string; quiet?: boolean };
  /** Art on the left instead of the right. */
  flip?: boolean;
  tint?: boolean;
}) {
  return (
    <section
      className={`border-b border-[var(--border)] ${tint ? "bg-[var(--bg-alt)]" : ""}`}
    >
      <Container className="section-pad-sm">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <Reveal className={`min-w-0 order-2 ${flip ? "lg:order-1" : "lg:order-2"}`}>
            {art}
          </Reveal>

          <Reveal className={`min-w-0 order-1 ${flip ? "lg:order-2" : "lg:order-1"}`}>
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="display-xl mt-3 max-w-[20ch] text-balance">{title}</h2>
            <p className="body-base mt-4 max-w-[52ch] text-pretty">{body}</p>

            {!!points?.length && (
              <ul className="mt-5 space-y-2.5">
                {points.map((point) => (
                  <li key={point} className="flex gap-2.5 text-[14.5px] leading-snug">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-[var(--accent-text)]" strokeWidth={2.5} />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href={cta.href}
              className={`btn mt-7 ${cta.quiet ? "btn-outline" : "btn-primary"}`}
            >
              {cta.label} <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
