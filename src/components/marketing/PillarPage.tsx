import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { PlanCta } from "./PlanCta";
import { Container, Reveal, SectionHeader, BotIndex, BrandMark } from "@/components/ui";
import { BotPlanForm } from "./BotPlanForm";
import { StatBand } from "./StatBand";
import { categoryHref, type Pillar } from "@/lib/catalog";
import { renderHeadline } from "@/lib/headline";

export function PillarPage({ pillar }: { pillar: Pillar }) {
  const other = pillar.slug === "marketing" ? "sales" : "marketing";

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="border-b border-[var(--border)]">
          <Container className="py-16 sm:py-20">
            <Reveal>
              <nav className="mb-7 flex items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
                <Link href="/" className="hover:text-[var(--accent-text)] transition-colors">Home</Link>
                <span>/</span>
                <span className="text-[var(--text-secondary)]">{pillar.name}</span>
              </nav>
              <p className="eyebrow mb-5">{pillar.tagline}</p>
              <h1 className="display-hero max-w-[18ch] text-balance">{renderHeadline(pillar.headline)}</h1>
              <p className="body-lg mt-6 max-w-[56ch] text-pretty">{pillar.intro}</p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <PlanCta source={`pillar-${pillar.slug}`} />
                <Link
                  href={`/${other}`}
                  className="text-[15px] font-medium border-b border-[var(--border-strong)] pb-0.5 hover:border-[var(--accent-text)] hover:text-[var(--accent-text)] transition-colors"
                >
                  See {other} bots instead
                </Link>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* Categories */}
        <section className="relative overflow-hidden section-pad border-b border-[var(--border)]">
          <BrandMark className="-right-28 top-6" size={520} />
          <Container className="relative">
            <Reveal>
              <SectionHeader
                eyebrow={`${pillar.categories.length} bots`}
                title={`Every ${pillar.name.toLowerCase()} job, handled continuously.`}
                copy="Start with the one that fixes your worst bottleneck. Add the rest as each proves out."
              />
            </Reveal>

            <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)] rounded-none overflow-hidden">
              {pillar.categories.map((c, i) => (
                <Reveal key={c.slug} delay={Math.min(i, 6) * 0.05}>
                  <Link
                    href={categoryHref(c)}
                    className="group bg-white h-full p-7 flex flex-col hover:bg-[var(--bg-alt)] transition-colors"
                  >
                    <BotIndex index={c.index} size="sm" tone="outline" />
                    <h3 className="display-lg mt-5">{c.botName}</h3>
                    <p className="body-sm mt-2.5 flex-1">{c.blurb}</p>
                    <span className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--accent-text)]">
                      {c.name}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        <StatBand
          eyebrow="Why continuously"
          title="The work is not hard. Doing it every single day is."
          metrics={[
            { value: "Daily", label: "Every bot reviews, acts and logs — not monthly" },
            { value: "2 wks", label: "Typical time to first bot live" },
            { value: "Yours", label: "Every account, sequence and automation we build" },
          ]}
        />

        {/* CTA */}
        <section className="section-pad">
          <Container>
            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-start">
              <Reveal>
                <SectionHeader
                  eyebrow="Start here"
                  title={`Not sure which ${pillar.name.toLowerCase()} bot you need?`}
                  copy="Tell us what you sell and where it is getting stuck. We send back the map — which bots, in what order, and what each is worth."
                />
              </Reveal>
              <Reveal delay={0.08}>
                <BotPlanForm source={`pillar-${pillar.slug}`} />
              </Reveal>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
