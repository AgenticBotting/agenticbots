import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, Section, BotIndex } from "@/components/ui";
import { PlanCta, BotFactory, SignalFlow, FleetSwarm, ServiceAtmosphere } from "@/components/marketing";
import { JsonLd, breadcrumbLd } from "@/components/JsonLd";
import { CATALOG, ALL_SERVICES, serviceHref } from "@/lib/catalog";
import { getServicePositioning } from "@/lib/service-positioning";
import { BOT_CATALOG } from "@/config/bot-catalog";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Managed BOT services for established contractors",
  description:
    "Thirteen managed service mandates delivered through ten deployable BOT types across demand generation, revenue operations and customer lifecycle workflows.",
  alternates: { canonical: "/services" },
};

export default function ServicesIndex() {
  return (
    <>
      <JsonLd data={breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Services", path: "/services" },
      ])} />
      <Header />
      <main className="service-hub">
        <section className="service-hero services-index-hero">
          <Container className="service-hero-container">
            <ServiceAtmosphere />
            <span className="service-hero-number" aria-hidden="true">13</span>
            <div className="service-hero-grid">
              <div className="service-hero-copy">
                <p className="eyebrow mb-5">
                  Managed service portfolio <span className="eyebrow-dim">· {ALL_SERVICES.length} mandates · {BOT_CATALOG.length} BOT types · national delivery</span>
                </p>
                <h1 className="display-hero max-w-[20ch] text-balance">
                  A governed operating mandate for every critical <span className="em-green">revenue workflow.</span>
                </h1>
                <p className="body-lg mt-6 max-w-[54ch]">
                  Start with one priority workflow or coordinate multiple BOT types as one managed operating system.
                  Every mandate is scoped around your existing systems, authority model and management requirements.
                </p>
                <div className="mt-8"><PlanCta source="services-index" /></div>
              </div>
              <div className="service-hero-visual">
                <div className="service-hero-visual-head">
                  <span>Managed service portfolio</span>
                  <span>Illustrative activity</span>
                </div>
                <BotFactory />
              </div>
            </div>
            <dl className="services-index-standards">
              {[
                ["01 · Existing systems", "Deploy into the platforms and records your organization already controls."],
                ["02 · Defined authority", "Document access, approval gates and exception handling before launch."],
                ["03 · Reviewable operation", "Track activity, decisions and outcomes through a consistent management record."],
              ].map(([term, detail], index) => (
                <div key={term} className={cn(index > 0 && "is-divided")}>
                  <dt>{term}</dt>
                  <dd className="body-sm mt-3">{detail}</dd>
                </div>
              ))}
            </dl>
          </Container>
        </section>

        {/* The status-board view: all thirteen bots, live, at once. Comes
            before SignalFlow on purpose — this shows WHAT is running, the
            diagram after it explains HOW the loop works. */}
        <Section
          variant="light"
          eyebrow="Service mandate portfolio"
          heading={<>Thirteen managed mandates. <span className="em-green">Ten deployable BOT types.</span></>}
          sub="Each mandate is assembled from the BOT types, skills, integrations and authority rules required for the workflow. The interface below is illustrative."
        >
          <FleetSwarm />
        </Section>

        {/* The whole system as one drawing. Lives here rather than on each
            hub: it describes the fleet, not any single bot, and one page is
            the right number of times to say it. */}
        <Section
          variant="alt"
          eyebrow="Coordinated operating model"
          heading={<>One control structure across <span className="em-green">the revenue lifecycle.</span></>}
          sub="Signals enter through different channels, but every workflow follows the same discipline: observe, prepare, authorize, execute and record."
        >
          <SignalFlow />
        </Section>

        {CATALOG.map((pillar) => (
          <Section
            key={pillar.slug}
            id={pillar.slug}
            variant={pillar.slug === "marketing" ? "alt" : "light"}
            eyebrow={`${pillar.tagline} · ${pillar.categories.length} service mandates`}
            heading={pillar.headline}
            sub={pillar.intro}
          >
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pillar.categories.map((c) => {
                const svc = ALL_SERVICES.find((s) => s.slug === c.slug)!;
                const positioning = getServicePositioning(svc.slug);
                return (
                  <li key={svc.serviceSlug} className="flex">
                    <Link
                      href={serviceHref(svc)}
                      className="group w-full flex items-start gap-4 p-5 border border-[var(--border)] bg-white hover:border-ink-950 hover:-translate-y-0.5 hover:shadow-lift transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    >
                      <BotIndex index={svc.index} size="sm" tone="outline" />
                      <span className="min-w-0 flex-1">
                        <span className="block display-md group-hover:text-[var(--accent-text)] transition-colors">
                          {svc.serviceName}
                        </span>
                        <span className="mt-0.5 block mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                          {positioning.deliveryModel}
                        </span>
                        <span className="mt-2 block text-[13.5px] leading-snug text-[var(--text-secondary)]">
                          {positioning.summary}
                        </span>
                      </span>
                      <ArrowRight className="w-4 h-4 shrink-0 mt-1 text-[var(--text-muted)] group-hover:text-[var(--accent-text)] group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Section>
        ))}
      </main>
      <Footer />
    </>
  );
}
