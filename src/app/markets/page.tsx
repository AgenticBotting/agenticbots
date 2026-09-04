import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, Section } from "@/components/ui";
import { BotFactory } from "@/components/marketing";
import { PlanCta } from "@/components/marketing";
import { JsonLd, breadcrumbLd } from "@/components/JsonLd";
import { LOCAL_SERVICES } from "@/lib/geo/data";
import { ALL_STATES, ALL_CITIES, allCitiesInState } from "@/lib/geo/dataset";
import { groupByRegion } from "@/lib/geo/regions";

export const metadata: Metadata = {
  title: "Markets we serve",
  description:
    "Agent systems across the country — every state, organized by region, each city with its own market hub.",
  alternates: { canonical: "/markets" },
};

export default function MarketsIndex() {
  const regions = groupByRegion(ALL_STATES);
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Markets", path: "/markets" }])} />
      <Header />
      <main>
        <section className="border-b border-[var(--border)]">
          <Container className="py-14 sm:py-16">
            <div className="grid lg:grid-cols-[1fr_0.95fr] gap-12 lg:gap-16 items-center">
              <div>
                <p className="eyebrow mb-5">Markets <span className="eyebrow-dim">· {ALL_CITIES.length} cities · {ALL_STATES.length} states</span></p>
                <h1 className="display-hero max-w-[20ch] text-balance">
                  Deployed where your customers are.
                </h1>
                <p className="body-lg mt-6 max-w-[54ch]">
                  The fleet deploys remotely, so coverage is national — organized here by region,
                  then state, then metro. Every market page carries its own coverage detail.
                </p>
                <div className="mt-8"><PlanCta source="markets-index" /></div>
              </div>
              <BotFactory />
            </div>
          </Container>
        </section>

        {regions.map(({ region, states }) => (
          <Section
            key={region}
            id={region.toLowerCase()}
            variant="alt"
            size="sm"
            eyebrow={<span className="inline-flex items-center gap-2"><MapPin className="w-3 h-3" />{region}</span>}
            heading={`${region} markets.`}
          >
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {states.map((st) => {
                const cities = allCitiesInState(st.slug);
                return (
                  <Link key={st.slug} href={`/markets/${st.slug}`}
                    className="group border border-[var(--border)] bg-white p-5 hover:border-ink-950 hover:-translate-y-0.5 hover:shadow-lift transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]">
                    <span className="flex items-center justify-between gap-3">
                      <span className="display-md !text-[15px] group-hover:text-[var(--accent-text)] transition-colors">{st.name}</span>
                      <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-text)] group-hover:translate-x-0.5 transition-all" />
                    </span>
                    <span className="mt-1.5 block mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      {cities.length} cities
                    </span>
                  </Link>
                );
              })}
            </div>
          </Section>
        ))}

        <Section variant="light" size="sm" eyebrow="By service" heading="Or start from the service.">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--border)] border border-[var(--border)]">
            {LOCAL_SERVICES.map((s) => (
              <Link key={s.slug} href={`/local/${s.slug}`} className="group card-cell p-6">
                <span className="display-md group-hover:text-[var(--accent-text)] transition-colors">{s.name}</span>
                <span className="block body-xs mt-2">{s.botName} · every market</span>
              </Link>
            ))}
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
