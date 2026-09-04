import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, Section } from "@/components/ui";
import { BotPlanForm, PlanCta, StatBand, CityVignette } from "@/components/marketing";
import { JsonLd, breadcrumbLd, serviceLd } from "@/components/JsonLd";
import { CITIES, LOCAL_SERVICES, getState, getCity, nearbyCities, fmt } from "@/lib/geo/data";

type Params = { params: Promise<{ state: string; city: string }> };

export function generateStaticParams() {
  return CITIES.map((c) => ({ state: c.stateSlug, city: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { state, city } = await params;
  const ct = getCity(state, city);
  if (!ct) return {};
  return {
    title: `${ct.name}, ${ct.stateAbbr} — market hub`,
    description: `Agent systems for ${ct.name} businesses — PPC, SEO, CRM and speed-to-lead, with the local market read from ${ct.districts[0]} to ${ct.districts[ct.districts.length - 1]}.`,
    alternates: { canonical: `/markets/${state}/${city}` },
  };
}

export default async function CityMarketHub({ params }: Params) {
  const { state, city } = await params;
  const st = getState(state);
  const ct = getCity(state, city);
  if (!st || !ct) notFound();
  const near = nearbyCities(ct, 5);

  return (
    <>
      <JsonLd data={[
        serviceLd({
          name: `Agentic marketing & sales systems in ${ct.name}, ${ct.stateAbbr}`,
          description: ct.character,
          path: `/markets/${st.slug}/${ct.slug}`,
          areaServed: `${ct.name}, ${ct.stateName}`,
        }),
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Markets", path: "/markets" },
          { name: st.name, path: `/markets/${st.slug}` },
          { name: ct.name, path: `/markets/${st.slug}/${ct.slug}` },
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
              <span className="text-[var(--text-body)]">{ct.name}</span>
            </nav>

            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-20 items-start">
              <div>
                <p className="eyebrow mb-5">The {ct.name} market <span className="eyebrow-dim">· {ct.stateAbbr}</span></p>
                <h1 className="display-hero max-w-[20ch] text-balance">
                  Bots that get {ct.name} businesses customers.
                </h1>
                <p className="body-lg mt-6 max-w-[54ch]">{ct.character}</p>
                <p className="body-base mt-4 max-w-[54ch]">
                  From {ct.districts.slice(0, -1).join(", ")} to {ct.districts[ct.districts.length - 1]},
                  the fleet runs the same way: continuously, inside the tools you already pay for,
                  tuned to how {ct.industries[0]} and {ct.industries[1]} customers here actually buy.
                </p>
                <div className="mt-8"><PlanCta source={`market-hub-${ct.slug}`} /></div>
              </div>

              <div>
                <div className="border border-[var(--border)] bg-white px-5 pt-6 pb-3 mb-8">
                  <CityVignette city={ct} />
                </div>
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
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* All services × this city — the LS cross-link pattern, hub side. */}
        <Section variant="alt" eyebrow={`Services in ${ct.name}`} heading={`Every bot, deployed for ${ct.name}.`}>
          <div className="grid sm:grid-cols-2 gap-px bg-[var(--border)] border border-[var(--border)]">
            {LOCAL_SERVICES.map((s) => (
              <Link key={s.slug} href={`/local/${s.slug}/${st.slug}/${ct.slug}`} className="group card-cell p-7">
                <p className="mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--text-muted)]">{s.botName}</p>
                <p className="display-md mt-2 group-hover:text-[var(--accent-text)] transition-colors">
                  {s.name} in {ct.name}
                </p>
                <p className="body-sm mt-2.5">{s.intro.split(".")[0]}.</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--accent-text)]">
                  Open the {ct.name} page
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </Section>

        <Section variant="light" eyebrow="The local read" heading={`What we would actually change in ${ct.name}.`}>
          <p className="body-lg max-w-[64ch]">{ct.localNote}</p>
        </Section>

        <StatBand
          eyebrow={`${ct.name} deployment`}
          title={`The same fleet, tuned to ${ct.name}.`}
          metrics={[
            { value: "2w", label: "Typical first system live, monitored" },
            { value: "24/7", label: `Coverage on ${ct.timezone.replace("America/", "").replace("_", " ")} hours` },
            { value: `${ct.industries.length}`, label: `${ct.name} verticals covered at launch` },
          ]}
        />

        {/* Nearby market hubs — LS nearby-cities block. */}
        <Section variant="alt" size="sm" eyebrow="Nearby markets">
          <div className="flex flex-wrap gap-3">
            {near.map((n) => (
              <Link key={n.slug} href={`/markets/${n.stateSlug}/${n.slug}`}
                className="chip !py-2.5 !px-4 hover:border-ink-950 transition-colors">
                {n.name}, {n.stateAbbr}
              </Link>
            ))}
            <Link href={`/markets/${st.slug}`} className="chip chip-accent !py-2.5 !px-4">
              All {st.name} markets →
            </Link>
          </div>
        </Section>

        <Section variant="light" eyebrow="Start here" heading={`Get the ${ct.name} bot plan.`}
          sub="Tell us what you sell and where it is getting stuck. The plan comes back mapped to this market — free, one business day.">
          <div className="max-w-[640px]">
            <BotPlanForm source={`market-hub-${ct.slug}-form`} />
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
