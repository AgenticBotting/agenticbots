import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, Section } from "@/components/ui";
import {
  BotPlanForm, PlanCta, CityVignette, ProofBar, FaqAccordion,
  AgentConsole, StackStrip, StatSplit, JoinBand,
} from "@/components/marketing";
import { JsonLd, breadcrumbLd, serviceLd, faqLd } from "@/components/JsonLd";
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
  const consolePlaces = vignetteLabels.length ? vignetteLabels : [rec.metro];

  const faqs = [
    { q: `Do you work with ${rec.city} businesses remotely?`, a: `Yes — the bots run inside your existing accounts (CRM, ads, phone, calendar), so everything deploys remotely, anywhere in the ${rec.metro} metro. Every sequence is scheduled on your local hours, not ours.` },
    { q: `How fast can this go live in ${rec.city}?`, a: `The typical build is about two weeks to a first system running in monitored mode, with every action reviewed daily before it goes fully autonomous.` },
    { q: `What does it cost?`, a: `A one-time build fee for getting your bots right, then a monthly fee to run and tune them — no per-seat pricing, no percentage of ad spend, no lock-in. The free plan comes back with numbers for your situation.` },
  ];

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
        faqLd(faqs),
      ]} />
      <Header />
      <main>
        {/* ── Hero: promise left, the fleet's console on this city right. ── */}
        <section className="border-b border-[var(--border)]">
          <Container className="pt-12 pb-16">
            <nav className="mb-10 flex flex-wrap items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
              <Link href="/" className="hover:text-[var(--foreground)]">Home</Link><span>/</span>
              <Link href="/markets" className="hover:text-[var(--foreground)]">Markets</Link><span>/</span>
              <Link href={`/markets/${st.slug}`} className="hover:text-[var(--foreground)]">{st.name}</Link><span>/</span>
              <span className="text-[var(--text-body)]">{rec.city}</span>
            </nav>

            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
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
                <p className="body-sm mt-5">Free plan back in one business day. No call required.</p>
              </div>
              <AgentConsole
                botName="Speed-to-Lead Bot"
                cityName={rec.city}
                places={consolePlaces}
                stat={{ value: "24/7", label: "Nights, weekends and holidays covered" }}
              />
            </div>
          </Container>
        </section>

        <StackStrip />

        {ct && (
          <section className="border-b border-[var(--border)] bg-[var(--bg-alt)]">
            <Container className="py-7">
              <dl className="grid grid-cols-2 lg:grid-cols-5 gap-x-10 gap-y-5">
                {[
                  ["Metro population", fmt.format(ct.metroPopulation)],
                  ["Businesses", `~${fmt.format(ct.businessCount)}`],
                  ["Dominant verticals", ct.industries.slice(0, 2).join(" · ")],
                  ["CPC band", `$${ct.cpcBand[0]}–$${ct.cpcBand[1]} est.`],
                  ["Competition", ct.competition],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">{k}</dt>
                    <dd className="text-[15px] font-semibold tracking-[-0.015em] mt-1">{v}</dd>
                  </div>
                ))}
              </dl>
            </Container>
          </section>
        )}

        <ProofBar />

        {/* All services × this city */}
        <Section variant="alt" eyebrow={`Services in ${rec.city}`} heading={`Every bot, deployed for ${rec.city}.`}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--border)] border border-[var(--border)]">
            {LOCAL_SERVICES.map((s) => (
              <Link
                key={s.slug}
                href={`/local/${s.slug}/${st.slug}/${rec.city_slug}`}
                className="group card-cell p-7"
              >
                <p className="mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--text-muted)]">{s.botName}</p>
                <p className="display-md mt-2 group-hover:text-[var(--accent-text)] transition-colors">
                  {s.name}
                </p>
                <p className="body-sm mt-2 min-h-[2.6em]">{s.hook}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--accent-text)]">
                  {rec.city} details
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </Section>

        {/* ── The local read beside the city's vignette (enriched), or the
              metro coverage vignette (structural). ── */}
        {ct ? (
          <Section variant="light" eyebrow={`The ${ct.name} read`}>
            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16 items-center">
              <div className="border border-[var(--border)] bg-white px-5 pt-6 pb-3">
                <CityVignette name={rec.city} stateAbbr={rec.state_abbr} labels={vignetteLabels} />
              </div>
              <blockquote className="border-l-2 border-accent-500 pl-7">
                <p className="display-lg !font-medium !leading-[1.4] text-balance">{ct.localNote}</p>
                <footer className="mono text-[10.5px] uppercase tracking-[0.11em] text-[var(--text-muted)] mt-5">
                  What we would actually change here — written by us, not generated
                </footer>
              </blockquote>
            </div>
          </Section>
        ) : (
          <Section variant="light" eyebrow="Coverage" heading={`The ${rec.metro} metro, covered.`}>
            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16 items-center">
              <div className="border border-[var(--border)] bg-white px-5 pt-6 pb-3">
                <CityVignette name={rec.city} stateAbbr={rec.state_abbr} labels={vignetteLabels} />
              </div>
              <p className="body-base max-w-[52ch]">
                The fleet deploys remotely across the {rec.metro} metro — everything runs inside
                your existing accounts, scheduled on your local hours, wherever your customers are.
              </p>
            </div>
          </Section>
        )}

        {/* ── Big-number stat split. ── */}
        <StatSplit
          eyebrow={`${rec.city} deployment`}
          heading={<>One fleet, every job — <span className="em-green">tuned to {rec.city}.</span></>}
          body={`Ads, SEO, CRM and speed-to-lead run as one system for your ${rec.city} business — built, monitored and tuned continuously, inside the accounts you already own. You stay the owner of every account and every result.`}
          stats={[
            { value: "2w", label: "Typical first system live, monitored" },
            { value: "24/7", label: "Nights, weekends and holidays covered" },
            { value: "<60s", label: "First response to any inbound lead" },
            { value: "13", label: "Bots in the fleet, deployed as you need them" },
          ]}
          source={`market-hub-${rec.city_slug}-statsplit`}
          note="No per-seat pricing. No percentage of ad spend. No lock-in."
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

        <Section variant="light" eyebrow="Questions" heading={`${rec.city}, specifically.`}>
          <div className="max-w-[760px]"><FaqAccordion items={faqs} /></div>
        </Section>

        <JoinBand
          heading={<>Integrate agentic bots to swarm your <span className="em-green">marketing and sales tasks.</span></>}
          sub={`One conversation, one free plan — mapped to the ${rec.metro} metro, not a template.`}
          source={`market-hub-${rec.city_slug}-joinband`}
        />

        <Section variant="alt" eyebrow="Start here" heading={`Get the ${rec.city} bot plan.`}
          sub="Tell us what you sell and where it is getting stuck. The plan comes back mapped to this market — free, one business day.">
          <div>
            <BotPlanForm source={`market-hub-${rec.city_slug}-form`} />
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
