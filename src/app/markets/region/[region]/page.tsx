import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, Section } from "@/components/ui";
import { BotFactory, PlanCta } from "@/components/marketing";
import { JsonLd, breadcrumbLd } from "@/components/JsonLd";
import { ALL_SERVICES, serviceHref } from "@/lib/catalog";
import { ALL_STATES, allCitiesInState } from "@/lib/geo/dataset";
import {
  REGIONS,
  groupByRegion,
  regionFromSlug,
  regionSlug,
  siblingRegions,
} from "@/lib/geo/regions";

type Params = { params: Promise<{ region: string }> };

/** States in a region that actually have live markets, plus their counts. */
function regionStates(region: string) {
  return (
    groupByRegion(ALL_STATES).find((g) => g.region === region)?.states ?? []
  ).map((st) => ({ ...st, cities: allCitiesInState(st.slug) }));
}

export function generateStaticParams() {
  return REGIONS.map((r) => ({ region: regionSlug(r) }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { region: slug } = await params;
  const region = regionFromSlug(slug);
  if (!region) return {};
  const states = regionStates(region);
  const cities = states.reduce((n, st) => n + st.cities.length, 0);
  const top = states.slice(0, 3).map((st) => st.name).join(", ");
  return {
    title: `${region} markets`,
    description: `Agent systems across the ${region} — ${states.length} states and ${cities} cities including ${top}: every call answered, every quote followed up, 24/7.`,
    alternates: { canonical: `/markets/region/${slug}` },
  };
}

export default async function RegionMarketPage({ params }: Params) {
  const { region: slug } = await params;
  const region = regionFromSlug(slug);
  if (!region) notFound();

  const states = regionStates(region);
  if (states.length === 0) notFound();
  const cities = states.reduce((n, st) => n + st.cities.length, 0);

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Markets", path: "/markets" },
          { name: region, path: `/markets/region/${slug}` },
        ])}
      />
      <Header />
      <main>
        <section className="border-b border-[var(--border)]">
          <Container className="py-14 sm:py-16">
            <nav className="mb-8 flex items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
              <Link href="/" className="hover:text-[var(--foreground)]">Home</Link><span>/</span>
              <Link href="/markets" className="hover:text-[var(--foreground)]">Markets</Link><span>/</span>
              <span className="text-[var(--text-body)]">{region}</span>
            </nav>
            <div className="grid lg:grid-cols-[1fr_0.95fr] gap-12 lg:gap-16 items-center">
              <div>
                <p className="eyebrow mb-5">
                  <span className="inline-flex items-center gap-2"><MapPin className="w-3 h-3" />{region}</span>
                  <span className="eyebrow-dim"> · {states.length} states · {cities} cities</span>
                </p>
                <h1 className="display-hero max-w-[20ch] text-balance">
                  Agent systems across the {region}.
                </h1>
                <p className="body-lg mt-6 max-w-[54ch]">
                  The fleet deploys remotely, so coverage does not depend on a local office.
                  Pick your state below — every market page carries its own coverage detail.
                </p>
                <div className="mt-8"><PlanCta source={`markets-region-${slug}`} /></div>
              </div>
              {/* Regions read with the article: "in the West", not "in West". */}
              <BotFactory place={`the ${region}`} />
            </div>
          </Container>
        </section>

        <Section
          variant="alt"
          eyebrow={`${states.length} states`}
          heading={`Where we deploy in the ${region}.`}
          sub="Pick your state, or the nearest one — coverage is national either way."
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {states.map((st) => (
              <Link
                key={st.slug}
                href={`/markets/${st.slug}`}
                className="group border border-[var(--border)] bg-white p-5 hover:border-ink-950 hover:-translate-y-0.5 hover:shadow-lift transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="display-md !text-[15px] group-hover:text-[var(--accent-text)] transition-colors">{st.name}</span>
                  <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-text)] group-hover:translate-x-0.5 transition-all" />
                </span>
                <span className="mt-1.5 block mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  {st.cities.length} cities
                </span>
              </Link>
            ))}
          </div>
        </Section>

        <Section variant="light" size="sm" eyebrow="By service" heading="Or start from the service.">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)]">
            {ALL_SERVICES.map((s) => (
              <Link key={s.slug} href={serviceHref(s)} className="group card-cell p-6">
                <span className="display-md group-hover:text-[var(--accent-text)] transition-colors">{s.name}</span>
                <span className="block body-xs mt-2">{s.botName} · every market</span>
              </Link>
            ))}
          </div>
        </Section>

        {/* Hand off to the neighbouring regions, so browsing the country
            never requires reopening the menu. */}
        <Section variant="alt" size="sm" eyebrow="Other regions" heading="Somewhere else?">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {siblingRegions(region).map((r) => {
              const sts = regionStates(r);
              return (
                <Link
                  key={r}
                  href={`/markets/region/${regionSlug(r)}`}
                  className="group border border-[var(--border)] bg-white p-5 hover:border-ink-950 hover:-translate-y-0.5 hover:shadow-lift transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="display-md !text-[15px] group-hover:text-[var(--accent-text)] transition-colors">{r}</span>
                    <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-text)] group-hover:translate-x-0.5 transition-all" />
                  </span>
                  <span className="mt-1.5 block mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    {sts.length} states · {sts.reduce((n, st) => n + st.cities.length, 0)} cities
                  </span>
                </Link>
              );
            })}
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
