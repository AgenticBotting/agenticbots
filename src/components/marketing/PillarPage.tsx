import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { PlanCta } from "./PlanCta";
import { Container, Reveal, SectionHeader, BotIndex, BrandMark } from "@/components/ui";
import { BotPlanForm } from "./BotPlanForm";
import { StatBand } from "./StatBand";
import { getServiceByCategorySlug, serviceHref, type Pillar } from "@/lib/catalog";
import { renderHeadline } from "@/lib/headline";
import { getServicePositioning } from "@/lib/service-positioning";

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
              <div className="mt-9 cta-row">
                <PlanCta source={`pillar-${pillar.slug}`} />
                <Link
                  href={`/${other}`}
                  className="text-[15px] font-medium border-b border-[var(--border-strong)] pb-0.5 hover:border-[var(--accent-text)] hover:text-[var(--accent-text)] transition-colors"
                >
                  Review the {other} portfolio
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
                eyebrow={`${pillar.categories.length} managed service mandates`}
                title={`Defined operating mandates across ${pillar.name.toLowerCase()}.`}
                copy="Select the business process that requires accountable ownership. The deployed BOT types, integrations and authority model are scoped around that mandate."
              />
            </Reveal>

            <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)] rounded-none overflow-hidden">
              {pillar.categories.map((c, i) => {
                const service = getServiceByCategorySlug(c.slug);
                const positioning = getServicePositioning(c.slug);
                return <Reveal key={c.slug} delay={Math.min(i, 6) * 0.05}>
                  <Link
                    href={serviceHref(c)}
                    className="group bg-white h-full p-7 flex flex-col hover:bg-[var(--bg-alt)] transition-colors"
                  >
                    <BotIndex index={c.index} size="sm" tone="outline" />
                    <h3 className="display-lg mt-5">{service?.serviceName ?? c.name}</h3>
                    <p className="mono mt-2 text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">{positioning.deliveryModel}</p>
                    <p className="body-sm mt-3 flex-1">{positioning.summary}</p>
                    <span className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--accent-text)]">
                      Review the mandate
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                </Reveal>;
              })}
            </div>
          </Container>
        </section>

        <StatBand
          eyebrow="Enterprise operating standard"
          title="Defined authority. Reviewable execution. Managed continuity."
          metrics={[
            { value: "Scoped", label: "Every mandate, integration and access boundary" },
            { value: "Approved", label: "Every external action governed by policy" },
            { value: "Recorded", label: "Every BOT RUN, exception and outcome" },
          ]}
        />

        {/* CTA */}
        <section className="section-pad">
          <Container>
            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-start">
              <Reveal>
                <SectionHeader
                  eyebrow="Architecture entry point"
                  title={`Define the first ${pillar.name.toLowerCase()} mandate.`}
                  copy="The paid workflow audit identifies the process, BOT configuration, systems, controls and commercial scope required for a credible first deployment."
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
