import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, Section } from "@/components/ui";
import {
  AuditForm, PlanCta, CityVignette, FaqAccordion,
  BotFactory, StackStrip, StatSplit, JoinBand,
} from "@/components/marketing";
import { JsonLd, breadcrumbLd, serviceLd, faqLd } from "@/components/JsonLd";
import { getCity, nearbyCities, fmt } from "@/lib/geo/data";
import { ALL_SERVICES, serviceGeoHref } from "@/lib/catalog";
import { ALL_CITIES, getDatasetCity, getDatasetState, isEnriched } from "@/lib/geo/dataset";
import { AUDIT_OFFER } from "@/config/marketing-offer";
import { BOT_CATALOG } from "@/config/bot-catalog";
import { getServicePositioning } from "@/lib/service-positioning";

type Params = { params: Promise<{ state: string; city: string }> };

export function generateStaticParams() {
  return ALL_CITIES.map((c) => ({ state: c.state_slug, city: c.city_slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { state, city } = await params;
  const rec = getDatasetCity(state, city);
  if (!rec) return {};
  const enriched = isEnriched(state, city);
  return {
    title: `${rec.city}, ${rec.state_abbr} — market hub`,
    description: `A governed BOT operating layer for ${rec.city}, ${rec.state_abbr}. Thirteen managed service mandates delivered through ${BOT_CATALOG.length} deployable BOT types.`,
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

  const faqs = [
    { q: `Can the operating model be delivered remotely in ${rec.city}?`, a: `Yes. The proposal defines the systems, data, access and service levels included for your organization. We do not assume every business uses the same technology stack.` },
    { q: `How fast can this go live in ${rec.city}?`, a: `The proposal confirms timing after we understand your workflow, integrations and access requirements. A monitored launch includes human approval controls for external changes.` },
    { q: `What does it cost?`, a: `One BOT is $7,500 setup plus $2,500/month. Growth starts at $15,000 setup plus $3,500/month for a scoped 3–5 BOT system, with expansion quoted separately. Enterprise is custom. Usage, support and contract terms are defined in your proposal.` },
  ];

  return (
    <>
      <JsonLd data={[
        serviceLd({
          name: `Agentic marketing & sales systems in ${rec.city}, ${rec.state_abbr}`,
          description: `Governed marketing, revenue and customer-operation mandates for businesses across the ${rec.metro} metro.`,
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
                  A governed BOT operating layer for {rec.city}{enriched ? "" : `, ${rec.state_abbr}`}.
                </h1>
                {ct ? (
                  <>
                    <p className="body-lg mt-6 max-w-[54ch]">{ct.character}</p>
                    <p className="body-base mt-4 max-w-[54ch]">
                      From {ct.districts.slice(0, -1).join(", ")} to {ct.districts[ct.districts.length - 1]},
                      local market context informs the operating case. Your systems, policies and commercial priorities define the deployment.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="body-lg mt-6 max-w-[54ch]">
                      Connect demand, revenue and customer operations through managed service mandates with defined ownership, authority and review.
                    </p>
                    <p className="body-base mt-4 max-w-[54ch]">
                      We operate remotely across the {rec.metro} metro. The {AUDIT_OFFER.priceLabel} BOT workflow audit identifies a defensible starting mandate and the decisions required before implementation.
                    </p>
                  </>
                )}
                <div className="mt-8"><PlanCta source={`market-hub-${rec.city_slug}`} /></div>
                <p className="body-sm mt-5">{AUDIT_OFFER.priceLabel} BOT workflow audit. Written findings within {AUDIT_OFFER.turnaround} of payment.</p>
              </div>
              <BotFactory place={rec.city} stations={[
                { label: "Mandate accepted", meta: "Defined" },
                { label: "Authority policy loaded", meta: "Scoped" },
                { label: "Approval queue reviewed", meta: "Human" },
                { label: "BOT ACTIVITY written", meta: "Recorded" },
              ]} />
            </div>
          </Container>
        </section>

        <StackStrip />

        {ct && (
          <section className="border-b border-[var(--border)] bg-[var(--bg-alt)]">
            <Container className="py-7">
              <dl className="grid grid-cols-2 lg:grid-cols-5 gap-x-10 gap-y-5">
                {[
                  ["Metro population", `${fmt.format(ct.metroPopulation)} est.`],
                  ["Businesses", `~${fmt.format(ct.businessCount)} est.`],
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

        {/* All services × this city */}
        <Section variant="alt" eyebrow={`Services in ${rec.city}`} heading={`Thirteen managed mandates. One governed operating model.`}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)]">
            {ALL_SERVICES.map((s) => (
              <Link
                key={s.slug}
                href={serviceGeoHref(s, st.slug, rec.city_slug)}
                className="group card-cell p-7"
              >
                <p className="mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--text-muted)]">{getServicePositioning(s.slug).deliveryModel}</p>
                <p className="display-md mt-2 group-hover:text-[var(--accent-text)] transition-colors">
                  {s.name}
                </p>
                <p className="body-sm mt-2 min-h-[2.6em]">{getServicePositioning(s.slug).summary}</p>
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
              <div>
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
              <div>
                <CityVignette name={rec.city} stateAbbr={rec.state_abbr} labels={vignetteLabels} />
              </div>
              <p className="body-base max-w-[52ch]">
                The operating model can be delivered remotely across the {rec.metro} metro. The deployment uses only the systems, data and authority defined in your approved scope.
              </p>
            </div>
          </Section>
        )}

        {/* ── Big-number stat split. ── */}
        <StatSplit
          eyebrow={`${rec.city} operating model`}
          heading={<>One control model across <span className="em-green">every mandate.</span></>}
          body={`Select the service mandates that match your operating priorities. Each deployment defines systems, authority, approvals and reporting before BOT RUNS begin.`}
          stats={[
            { value: "2 days", label: "Paid audit turnaround after payment, business days" },
            { value: "Scoped", label: "Workflow, integrations and capacity agreed" },
            { value: "Human", label: "Approval for external changes" },
            { value: String(BOT_CATALOG.length), label: "Deployable BOT types across 13 mandates" },
          ]}
          source={`market-hub-${rec.city_slug}-statsplit`}
          note="Implementation timing and operating scope confirmed in your proposal."
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
          heading={<>Define the first BOT mandate for <span className="em-green">your operating model.</span></>}
          sub={`The ${AUDIT_OFFER.priceLabel} BOT workflow audit documents the strongest starting point, decision context and next step for your ${rec.metro} operation.`}
          source={`market-hub-${rec.city_slug}-joinband`}
        />

        <Section id="audit" variant="alt" eyebrow="Start here" heading={`Request the ${rec.city} BOT workflow audit.`}
          sub={`Tell us what you sell and where it is getting stuck. Written findings arrive within ${AUDIT_OFFER.turnaround} of payment.`}>
          <div>
            <AuditForm source={`market-hub-${rec.city_slug}-form`} />
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
