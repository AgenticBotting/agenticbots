import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import { Container, Section } from "@/components/ui";
import { PlanCta } from "@/components/marketing";
import { LOCAL_SERVICES, citiesInState, getService, fmt } from "@/lib/geo/data";
import { ALL_STATES, allCitiesInState, getDatasetState, isEnriched } from "@/lib/geo/dataset";

type Params = { params: Promise<{ service: string; state: string }> };

export function generateStaticParams() {
  return LOCAL_SERVICES.flatMap((s) => ALL_STATES.map((st) => ({ service: s.slug, state: st.slug })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { service, state } = await params;
  const svc = getService(service); const st = getDatasetState(state);
  if (!svc || !st) return {};
  const cities = allCitiesInState(state);
  const enriched = citiesInState(state).length > 0;
  return {
    title: `${svc.name} in ${st.name}`,
    description: `${svc.name} for ${st.name} businesses — ${svc.botName} deployed across ${cities.length} cities including ${cities.slice(0, 3).map((c) => c.city).join(", ")}.`,
    alternates: { canonical: `/local/${service}/${state}` },
    ...(enriched ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function StateHub({ params }: Params) {
  const { service, state } = await params;
  const svc = getService(service); const st = getDatasetState(state);
  if (!svc || !st) notFound();
  const all = allCitiesInState(state);
  const enrichedCities = citiesInState(state);
  const totalBiz = enrichedCities.reduce((s, c) => s + c.businessCount, 0);

  return (
    <>
      <Header />
      <main>
        <section className="border-b border-[var(--border)]">
          <Container className="py-16">
            <nav className="mb-8 flex items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
              <Link href="/" className="hover:text-[var(--foreground)]">Home</Link><span>/</span>
              <Link href={`/local/${svc.slug}`} className="hover:text-[var(--foreground)]">{svc.name}</Link><span>/</span>
              <span className="text-[var(--text-body)]">{st.name}</span>
            </nav>
            <p className="eyebrow mb-5">{svc.name} <span className="eyebrow-dim">· {st.name}</span></p>
            <h1 className="display-hero max-w-[20ch] text-balance">
              {svc.name} across {st.name}.
            </h1>
            <p className="body-lg mt-6 max-w-[54ch]">
              {all.length} {st.name} cities covered
              {totalBiz > 0 ? `, roughly ${fmt.format(totalBiz)} businesses across the focus metros alone` : ""} —
              {svc.botName} deploys remotely into any of them, wired into the tools each business already uses.
            </p>
            <div className="mt-8"><PlanCta source={`local-state-${svc.slug}-${st.slug}`} /></div>
          </Container>
        </section>

        <Section variant="alt" eyebrow={`${all.length} cities`} heading={`${svc.name} across ${st.name}.`}
          sub="Grouped by metro — every city links to its own service page.">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...new Map(all.map((c) => [c.metro, all.filter((x) => x.metro === c.metro)])).entries()].map(([metro, list]) => (
              <div key={metro} className="border border-[var(--border)] bg-white p-5">
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
                        href={`/local/${svc.slug}/${st.slug}/${c.city_slug}`}
                        className="group flex items-center gap-1.5 py-1 text-[13px] text-[var(--text-body)] hover:text-[var(--accent-text)] transition-colors"
                      >
                        <span className="truncate">{c.city}</span>
                        {isEnriched(c.state_slug, c.city_slug) && (
                          <span className="h-1.5 w-1.5 shrink-0 bg-accent-500" title="Focus market" />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
