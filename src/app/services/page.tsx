import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, Section, BotIndex } from "@/components/ui";
import { PlanCta, BotFactory, SignalFlow, FleetSwarm } from "@/components/marketing";
import { JsonLd, breadcrumbLd } from "@/components/JsonLd";
import { CATALOG, ALL_SERVICES, serviceHref } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Every agentic service we run",
  description:
    "Thirteen agentic services across demand creation and revenue capture — each one a bot that runs continuously inside the tools you already pay for.",
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
      <main>
        <section className="border-b border-[var(--border)]">
          <Container className="py-14 sm:py-16">
            <div className="grid lg:grid-cols-[1fr_0.95fr] gap-12 lg:gap-16 items-center">
              <div>
                <p className="eyebrow mb-5">
                  Services <span className="eyebrow-dim">· {ALL_SERVICES.length} bots · every US market</span>
                </p>
                <h1 className="display-hero max-w-[20ch] text-balance">
                  One bot per job. <span className="em-green">All of them running.</span>
                </h1>
                <p className="body-lg mt-6 max-w-[54ch]">
                  Most businesses need two or three of these, not thirteen. Every one deploys
                  remotely into the accounts you already own, and you stay the owner of every
                  result.
                </p>
                <div className="mt-8"><PlanCta source="services-index" /></div>
              </div>
              <BotFactory />
            </div>
          </Container>
        </section>

        {/* The status-board view: all thirteen bots, live, at once. Comes
            before SignalFlow on purpose — this shows WHAT is running, the
            diagram after it explains HOW the loop works. */}
        <Section
          variant="light"
          eyebrow="The fleet · right now"
          heading={<>Thirteen bots. <span className="em-green">Not one of them idle.</span></>}
          sub="This is illustrative, not a live feed of a real account — but every one of these runs exactly this continuously once it is deployed on yours."
        >
          <FleetSwarm />
        </Section>

        {/* The whole system as one drawing. Lives here rather than on each
            hub: it describes the fleet, not any single bot, and one page is
            the right number of times to say it. */}
        <Section
          variant="alt"
          eyebrow="How the fleet fits together"
          heading={<>Every way in, every way <span className="em-green">out.</span></>}
          sub="However a customer arrives, the same loop runs: watch, act, record, report. The bots differ in what they watch."
        >
          <SignalFlow />
        </Section>

        {CATALOG.map((pillar) => (
          <Section
            key={pillar.slug}
            id={pillar.slug}
            variant={pillar.slug === "marketing" ? "alt" : "light"}
            eyebrow={`${pillar.tagline} · ${pillar.categories.length} bots`}
            heading={pillar.headline}
            sub={pillar.intro}
          >
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pillar.categories.map((c) => {
                const svc = ALL_SERVICES.find((s) => s.slug === c.slug)!;
                return (
                  <li key={svc.serviceSlug} className="flex">
                    <Link
                      href={serviceHref(svc)}
                      className="group w-full flex items-start gap-4 p-5 border border-[var(--border)] bg-white hover:border-ink-950 hover:-translate-y-0.5 hover:shadow-lift transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    >
                      <BotIndex index={svc.index} size="sm" tone="outline" />
                      <span className="min-w-0 flex-1">
                        <span className="block display-md group-hover:text-[var(--accent-text)] transition-colors">
                          {svc.botName}
                        </span>
                        <span className="mt-0.5 block mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                          {svc.serviceName}
                        </span>
                        <span className="mt-2 block text-[13.5px] leading-snug text-[var(--text-secondary)]">
                          {svc.blurb}
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
