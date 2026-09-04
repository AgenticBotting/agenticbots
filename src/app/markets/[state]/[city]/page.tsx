import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, Section } from "@/components/ui";
import { BotPlanForm, PlanCta, StatBand, CityVignette } from "@/components/marketing";
import { JsonLd, breadcrumbLd, serviceLd } from "@/components/JsonLd";
import { LOCAL_SERVICES, getCity, nearbyCities, fmt } from "@/lib/geo/data";
import { ALL_CITIES, getDatasetCity, getDatasetState, isEnriched } from "@/lib/geo/dataset";

type Params = { params: Promise<{ state: string; city: string }> };

export function generateStaticParams() {
  return ALL_CITIES.map((c) => ({ state: c.state_slug, city: c.city_slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { state, city } = await params;
  const rec = getDatasetCity(state, city);
  if (!rec) return {};
  const enriched = isEnriched(state, city);
  const ct = enriched ? getCity(state, city) : undefined;
  return {
    title: `${rec.city}, ${rec.state_abbr} — market hub`,
    description: ct
      ? `Agent systems for ${ct.name} businesses — PPC, SEO, CRM and speed-to-lead, with the local market read from ${ct.districts[0]} to ${ct.districts[ct.districts.length - 1]}.`
      : `Agent systems for ${rec.city}, ${rec.state_abbr} businesses — PPC, SEO, CRM and speed-to-lead across the ${rec.metro} metro. Free plan in one business day.`,
    alternates: { canonical: `/markets/${state}/${city}` },
    /* Structural pages stay out of the index until their market is
       enriched — release schedule, docs/PROGRAMMATIC-SEO-PLAN.md §6. */
    ...(enriched ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function CityMarketHub({ params }: Params) {
  const { state, city } = await params;
  const rec = getDatasetCity(state, city);
  const st = getDatasetState(state);
  if (!rec || !st) notFound();

  const enriched = isEnriched(state, city);
  const ct = enriched ? getCity(state, city) : undefined;
  const near = ct
    ? nearbyCities(ct, 5).map((n) => ({ name: n.name, abbr: n.stateAbbr, state: n.stateSlug, slug: n.slug }))
    : rec.surrounding
        .filter((s0) => ALL_CITIES.some((x) => x.city_slug === s0.slug && x.state_slug === state))
        .slice(0, 5)
        .map((s0) => ({ name: s0.city, abbr: rec.state_abbr, state, slug: s0.slug }));

  const vignetteLabels = ct ? ct.districts : rec.surrounding.slice(0, 5).map((s0) => s0.city);

  return (
    <>
      <JsonLd data={[
        serviceLd({
          name: `Agentic marketing & sales systems in ${rec.city}, ${rec.state_abbr}`,
          description: ct?.character ?? `Agent systems for ${rec.city} businesses across the ${rec.metro} metro.`,
          path: `/markets/${state}/${city}`,
          areaServed: `${rec.city}, ${rec.state}`,
        }),
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Markets", path: "/markets" },
          { name: st.name, path: `/markets/${st.slug}` },
          { name: rec.city, path: `/markets/${st.slug}/${rec.city_slug}` },
        ]),
      ]} />
      <Header />
      <main>
        <section className="border-b border-[var(--border)]">
          <Container className="pt-12 pb-16">
            <nav className="mb-10 flex flex-wrap items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
              <Link href="/" className="hover:text-[var(--foreground)]">Home</Link><span>/</span>
              <Link href="/markets" className="hover:text-[var(--foreground)]">Markets</Link><span>/</span>
              <Link href={`/markets/${st.slug}`} className="hover:text-[var(--foreground)]">{st.name}</Link><span>/</span>
              <span className="text-[var(--text-body)]">{rec.city}</span>
            </nav>

            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-20 items-start">
              <div>
                <p className="eyebrow mb-5">The {rec.city} market <span className="eyebrow-dim">· {rec.state_abbr} · {rec.metro} metro</span></p>
                <h1 className="display-hero max-w-[22ch] text-balance">
                  Bots that get {rec.city}{enriched ? "" : `, ${rec.state_abbr}`} businesses customers.
                </h1>
                {ct ? (
                  <>
                    <p className="body-lg mt-6 max-w-[54ch]">{ct.character}</p>
                    <p className="body-base mt-4 max-w-[54ch]">
                      From {ct.districts.slice(0, -1).join(", ")} to {ct.districts[ct.districts.length - 1]},
                      the fleet runs the same way: continuously, inside the tools you already pay for,
                      tuned to how {ct.industries[0]} and {ct.industries[1]} customers here actually buy.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="body-lg mt-6 max-w-[54ch]">
                      Every call answered, every quote followed up, ads and CRM worked continuously —
                      built the same way for {rec.city} as for every market we serve, wired into the
                      tools you already use.
                    </p>
                    <p className="body-base mt-4 max-w-[54ch]">
                      We deploy remotely across the {rec.metro} metro. Tell us what you sell and the
                      free plan comes back mapped to your market within one business day.
                    </p>
                  </>
                )}
                <div className="mt-8"><PlanCta source={`market-hub-${rec.city_slug}`} /></div>
              </div>

              <div>
                <div className="border border-[var(--border)] bg-white px-5 pt-6 pb-3 mb-8">
                  <CityVignette name={rec.city} stateAbbr={rec.state_abbr} labels={vignetteLabels} />
                </div>
                {ct && (
                  <div className="border-t-2 border-ink-950 pt-6">
                    <p className="mono text-[10.5px] uppercase tracking-[0.11em] text-[var(--text-muted)] mb-5">
                      {ct.name} snapshot · estimates
                    </p>
                    <dl className="space-y-0">
                      {[
                        ["Metro population", fmt.format(ct.metroPopulation)],
                        ["Businesses", `~${fmt.format(ct.businessCount)}`],
                        ["Dominant verticals", ct.industries.slice(0, 3).join(" · ")],
                        ["Local-service CPC band", `$${ct.cpcBand[0]}–$${ct.cpcBand[1]} est.`],
                        ["Agency competition", ct.competition],
                      ].map(([k, v]) => (
                        <div key={k as string} className="flex items-baseline justify-between gap-6 py-3 border-b border-[var(--border)]">
                          <dt className="body-sm shrink-0">{k}</dt>
                          <dd className="text-[13.5px] font-semibold text-right tracking-[-0.01em]">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="body-xs mt-4">
                      Public-source estimates, refreshed periodically — shown for orientation, not quoted as audit data.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Container>
        </section>

        {/* All services × this city */}
        <Section variant="alt" eyebrow={`Services in ${rec.city}`} heading={`Every bot, deployed for ${rec.city}.`}>
          <div className="grid sm:grid-cols-2 gap-px bg-[var(--border)] border border-[var(--border)]">
            {LOCAL_SERVICES.map((s) => (
              <Link
                key={s.slug}
                href={enriched ? `/local/${s.slug}/${st.slug}/${rec.city_slug}` : `/local/${s.slug}`}
                className="group card-cell p-7"
              >
                <p className="mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--text-muted)]">{s.botName}</p>
                <p className="display-md mt-2 group-hover:text-[var(--accent-text)] transition-colors">
                  {s.name} in {rec.city}
                </p>
                <p className="body-sm mt-2.5">{s.intro.split(".")[0]}.</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--accent-text)]">
                  {enriched ? `Open the ${rec.city} page` : `About ${s.name}`}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </Section>

        {ct && (
          <Section variant="light" eyebrow="The local read" heading={`What we would actually change in ${ct.name}.`}>
            <p className="body-lg max-w-[64ch]">{ct.localNote}</p>
          </Section>
        )}

        <StatBand
          eyebrow={`${rec.city} deployment`}
          title={`The same fleet, tuned to ${rec.city}.`}
          metrics={[
            { value: "2w", label: "Typical first system live, monitored" },
            { value: "24/7", label: "Nights, weekends and holidays covered" },
            { value: "<60s", label: "First response to any inbound lead" },
          ]}
        />

        {near.length > 0 && (
          <Section variant="alt" size="sm" eyebrow="Nearby markets">
            <div className="flex flex-wrap gap-3">
              {near.map((n) => (
                <Link key={`${n.state}-${n.slug}`} href={`/markets/${n.state}/${n.slug}`}
                  className="chip !py-2.5 !px-4 hover:border-ink-950 transition-colors">
                  {n.name}, {n.abbr}
                </Link>
              ))}
              <Link href={`/markets/${st.slug}`} className="chip chip-accent !py-2.5 !px-4">
                All {st.name} markets →
              </Link>
            </div>
          </Section>
        )}

        <Section variant="light" eyebrow="Start here" heading={`Get the ${rec.city} bot plan.`}
          sub="Tell us what you sell and where it is getting stuck. The plan comes back mapped to this market — free, one business day.">
          <div className="max-w-[640px]">
            <BotPlanForm source={`market-hub-${rec.city_slug}-form`} />
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
