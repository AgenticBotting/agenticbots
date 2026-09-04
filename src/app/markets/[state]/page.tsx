import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, Section } from "@/components/ui";
import { PlanCta } from "@/components/marketing";
import { JsonLd, breadcrumbLd } from "@/components/JsonLd";
import { LOCAL_SERVICES, getState as getEnrichedState, citiesInState as enrichedCitiesInState } from "@/lib/geo/data";
import { ALL_STATES, allCitiesInState, getDatasetState, isEnriched } from "@/lib/geo/dataset";

type Params = { params: Promise<{ state: string }> };

export function generateStaticParams() {
  return ALL_STATES.map((st) => ({ state: st.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { state } = await params;
  const st = getDatasetState(state);
  if (!st) return {};
  const cities = allCitiesInState(state);
  const top = cities.slice(0, 3).map((c) => c.city).join(", ");
  const hasEnriched = Boolean(getEnrichedState(state));
  return {
    title: `${st.name} markets`,
    description: `Agent systems for ${st.name} businesses — ${cities.length} cities including ${top}: every call answered, every quote followed up, 24/7.`,
    alternates: { canonical: `/markets/${state}` },
    ...(hasEnriched ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function StateMarketPage({ params }: Params) {
  const { state } = await params;
  const st = getDatasetState(state);
  if (!st) notFound();
  const cities = allCitiesInState(state);

  /* Group by metro cluster — the dataset's own structure. */
  const metros = new Map<string, typeof cities>();
  for (const c of cities) {
    if (!metros.has(c.metro)) metros.set(c.metro, []);
    metros.get(c.metro)!.push(c);
  }

  return (
    <>
      <JsonLd data={breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Markets", path: "/markets" },
        { name: st.name, path: `/markets/${st.slug}` },
      ])} />
      <Header />
      <main>
        <section className="border-b border-[var(--border)]">
          <Container className="py-16">
            <nav className="mb-8 flex items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
              <Link href="/" className="hover:text-[var(--foreground)]">Home</Link><span>/</span>
              <Link href="/markets" className="hover:text-[var(--foreground)]">Markets</Link><span>/</span>
              <span className="text-[var(--text-body)]">{st.name}</span>
            </nav>
            <p className="eyebrow mb-5">{st.name} <span className="eyebrow-dim">· {cities.length} cities · {metros.size} metro cluster{metros.size > 1 ? "s" : ""}</span></p>
            <h1 className="display-hero max-w-[20ch] text-balance">
              Agent systems for {st.name} businesses.
            </h1>
            <p className="body-lg mt-6 max-w-[54ch]">
              Every call answered, every quote followed up, ads and CRM worked continuously —
              deployed remotely, wired into the tools you already use, anywhere in {st.name}.
            </p>
            <div className="mt-8"><PlanCta source={`markets-${st.slug}`} /></div>
          </Container>
        </section>

        <Section variant="alt" eyebrow={`${cities.length} cities`} heading={`Where we deploy in ${st.name}.`}
          sub="Grouped by metro — pick yours, or the nearest cluster.">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...metros.entries()].map(([metro, list]) => (
              <div key={metro} className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-5">
                <p className="flex items-baseline justify-between gap-3 pb-2.5 mb-3 border-b border-[var(--border)]">
                  <span className="display-md !text-[15px]">{metro} metro</span>
                  <span className="mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    {list.length} {list.length > 1 ? "cities" : "city"}
                  </span>
                </p>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  {list.map((c) => (
                    <li key={c.city_slug}>
                      <Link
                        href={`/markets/${st.slug}/${c.city_slug}`}
                        className="group flex items-center gap-1.5 py-1 text-[13px] text-[var(--text-body)] hover:text-[var(--accent-text)] transition-colors"
                      >
                        <span className="truncate">{c.city}</span>
                        {isEnriched(c.state_slug, c.city_slug) && (
                          <span className="h-1.5 w-1.5 shrink-0 bg-accent-500" title="Full market profile" />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section variant="light" size="sm" eyebrow="Services" heading={`Every service, everywhere in ${st.name}.`}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--border)] border border-[var(--border)] grid-frame">
            {LOCAL_SERVICES.map((s) => {
              const enriched = enrichedCitiesInState(state).length > 0;
              return (
                <Link key={s.slug} href={enriched ? `/local/${s.slug}/${st.slug}` : `/local/${s.slug}`} className="group card-cell p-6">
                  <span className="display-md group-hover:text-[var(--accent-text)] transition-colors">{s.name}</span>
                  <span className="mt-2 flex items-center gap-1.5 text-[12.5px] text-[var(--text-muted)]">
                    {s.botName}
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
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
