import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, Section } from "@/components/ui";
import {
  AuditForm, PlanCta, FaqAccordion, CityVignette, OfferVisual,
  AgentConsole, StackStrip, StatSplit, ZigZag, TaskConveyor,
} from "@/components/marketing";
import { getOffer } from "@/lib/offers";
import { getCity, nearbyCities, fmt } from "@/lib/geo/data";
import { ALL_SERVICES, getService, serviceHref, type Service } from "@/lib/catalog";
import { ALL_CITIES, getDatasetCity, getDatasetState, isEnriched } from "@/lib/geo/dataset";
import { JsonLd, serviceLd, breadcrumbLd, faqLd } from "@/components/JsonLd";
import { AUDIT_OFFER } from "@/config/marketing-offer";
import { getServicePositioning } from "@/lib/service-positioning";

type Params = { params: Promise<{ slug: string; state: string; city: string }> };

export function generateStaticParams() {
  /* Every service × every city in the national dataset — the internal
     links from city hubs land on a real service+city variation for all
     924 markets, not just the enriched set. */
  return ALL_SERVICES.flatMap((s) =>
    ALL_CITIES.map((c) => ({ slug: s.serviceSlug, state: c.state_slug, city: c.city_slug }))
  );
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, state, city } = await params;
  const svc = getService(slug);
  const rec = getDatasetCity(state, city);
  if (!svc || !rec) return {};
  const enriched = isEnriched(state, city);
  const positioning = getServicePositioning(svc.slug);
  return {
    /* absolute: at 13 services x 924 cities the " | AgenticBots" suffix
       pushed the longest combinations past the 70-char cap. */
    title: { absolute: `${svc.serviceName} Company in ${rec.city}, ${rec.state_abbr}` },
    description: `${svc.serviceName} in ${rec.city}, ${rec.state_abbr}. ${positioning.summary} Scope is confirmed before launch.`,
    alternates: { canonical: `/services/${slug}/${state}/${city}` },
    /* Structural markets stay out of the index until enriched —
       release schedule, docs/PROGRAMMATIC-SEO-PLAN.md §6. */
    ...(enriched ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function CityPage({ params }: Params) {
  const { slug, state, city } = await params;
  const svc = getService(slug);
  const st = getDatasetState(state);
  const rec = getDatasetCity(state, city);
  if (!svc || !st || !rec) notFound();

  if (!isEnriched(state, city)) {
    return <StructuralCityService svc={svc} st={st} rec={rec} />;
  }

  const ct = getCity(state, city);
  if (!ct) notFound();
  const positioning = getServicePositioning(svc.slug);
  const category = svc;
  const near = nearbyCities(ct, 6);
  const dominant = ct.industries[0];

  /* Composite, per-page-distinct content: market numbers, industry mix,
     the hand-written local note, and a dominant-industry scenario. */
  const faqs = [
    { q: `How is ${svc.serviceName.toLowerCase()} delivered in ${ct.name}?`, a: `${positioning.deliveryModel}. The service can be operated remotely, but the mandate is configured around your systems, market and approval policy.` },
    { q: `How does local market data affect the build?`, a: `${ct.name} market data provides planning context for account density, competition and customer behavior. It does not substitute for an audit of your own demand, pipeline and operating constraints.` },
    { q: `What authority does the system receive?`, a: positioning.boundary },
  ];

  return (
    <>
      <JsonLd data={[
        serviceLd({ name: `${svc.serviceName} in ${ct.name}, ${ct.stateAbbr}`, description: svc.intro, path: `/services/${svc.serviceSlug}/${st.slug}/${ct.slug}`, areaServed: `${ct.name}, ${ct.stateName}` }),
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: svc.serviceName, path: `/services/${svc.serviceSlug}` },
          { name: st.name, path: `/services/${svc.serviceSlug}/${st.slug}` },
          { name: ct.name, path: `/services/${svc.serviceSlug}/${st.slug}/${ct.slug}` },
        ]),
        faqLd(faqs),
      ]} />
      <Header />
      <main>
        {/* ── Hero: promise left, the bot's console running on this city right. ── */}
        <section className="border-b border-[var(--border)]">
          <Container className="pt-12 pb-16">
            <nav className="mb-10 flex flex-wrap items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
              <Link href="/" className="hover:text-[var(--foreground)]">Home</Link><span>/</span>
              <Link href={`/services/${svc.serviceSlug}`} className="hover:text-[var(--foreground)]">{svc.serviceName}</Link><span>/</span>
              <Link href={`/services/${svc.serviceSlug}/${st.slug}`} className="hover:text-[var(--foreground)]">{st.name}</Link><span>/</span>
              <span className="text-[var(--text-body)]">{ct.name}</span>
            </nav>

            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
              <div>
                <p className="eyebrow mb-5">
                  {svc.serviceName} <span className="eyebrow-dim">· {ct.name}, {ct.stateAbbr}</span>
                </p>
                <h1 className="display-hero max-w-[24ch] text-balance">
                  {svc.headlinePattern.replace("{city}", ct.name).replace("{st}", ct.stateAbbr)}
                </h1>
                <p className="display-lg mt-3 !font-medium text-[var(--accent-text)]">{positioning.subhead}</p>
                <p className="body-lg mt-5 max-w-[54ch]">{positioning.lead}</p>
                <p className="body-base mt-4 max-w-[54ch]">
                  Local context from {ct.districts[0]} to {ct.districts[ct.districts.length - 1]} informs the operating case. Your systems, policies and acceptance criteria determine the implementation.
                </p>
                <div className="mt-8 cta-row">
                  <PlanCta source={`local-${svc.slug}-${ct.slug}`} />
                  {category && (
                    <Link href={serviceHref(svc)} className="btn btn-outline">
                      Review the national service mandate
                    </Link>
                  )}
                </div>
                <p className="body-sm mt-5">{AUDIT_OFFER.priceLabel} BOT workflow audit. Written findings within {AUDIT_OFFER.turnaround} of payment.</p>
              </div>
              <AgentConsole
                botName={positioning.deliveryModel}
                feed={() => positioning.scope.slice(0, 4).map((item, i) => ({ t: `0${i + 1}`, body: item }))}
                cityName={ct.name}
                places={ct.districts}
                stat={{ value: "Scoped", label: "Mandate and authority" }}
              />
            </div>
          </Container>
        </section>

        <StackStrip tools={["Approved source systems", "Client-owned data", "Authority policy", "Approval queue", "BOT ACTIVITY", "Management reporting"]} label={`${svc.serviceName} operating architecture`} />

        {/* This bot's own work, named for this market. */}
        {category && (
          <Section
            variant="alt"
            size="sm"
            eyebrow={`${svc.serviceName} in ${ct.name}`}
            heading={<>A defined mandate, <span className="em-green">operated with control.</span></>}
          >
            <div className="-mx-5 sm:-mx-8">
              <TaskConveyor tasks={positioning.scope} />
            </div>
          </Section>
        )}

        {/* The offer's own product view, so each service × city page shows
            the work this bot does rather than a shared console. */}
        {getOffer(svc.slug) && (
          <Section variant="light">
            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-center">
              <div>
                <p className="eyebrow mb-4">Managed operating view · {ct.name}</p>
                <h2 className="display-xl text-balance">
                  Control the mandate. <span className="em-green">Preserve the evidence.</span>
                </h2>
                <p className="body-lg mt-5 max-w-[46ch]">{positioning.execution}</p>
                <p className="body-sm mt-4">Delivery model: {positioning.deliveryModel}.</p>
              </div>
              <OfferVisual slug={svc.slug} />
            </div>
          </Section>
        )}

        {/* ── Market snapshot: horizontal band, estimates labeled. ── */}
        <section className="border-b border-[var(--border)] bg-[var(--bg-alt)]">
          <Container className="py-7">
            <dl className="grid grid-cols-2 lg:grid-cols-5 gap-x-10 gap-y-5">
              {[
                ["Metro population", `${fmt.format(ct.metroPopulation)} est.`],
                ["Businesses in metro", `~${fmt.format(ct.businessCount)} est.`],
                ["Local-service CPC band", `$${ct.cpcBand[0]}–$${ct.cpcBand[1]} est.`],
                ["Agency competition", ct.competition],
                ["Operating scope", "Proposal-defined"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">{k}</dt>
                  <dd className="text-[15px] font-semibold tracking-[-0.015em] mt-1">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mono text-[9.5px] uppercase tracking-[0.08em] text-[var(--text-muted)] mt-4">
              Public-source estimates · shown for orientation, not quoted as audit data
            </p>
          </Container>
        </section>

        {/* ── Zig-zag deep dives: before/after pairs with mockups. ── */}
        {category && (
          <ZigZag
            eyebrow="What changes"
            heading={<>A clearer operating model for <span className="em-green">{ct.name}.</span></>}
            botName={positioning.deliveryModel}
            rows={[
              { label: `${svc.serviceName} · Ownership`, title: "Defined ownership", today: "Work moves between people and systems without one accountable operating path.", after: "The mandate names the inputs, owner, acceptance criteria and escalation path." },
              { label: `${svc.serviceName} · Authority`, title: "Controlled authority", today: "Teams rely on informal access and inconsistent review before external changes.", after: positioning.boundary },
              { label: `${svc.serviceName} · Evidence`, title: "A management record", today: "Activity is difficult to reconstruct across tools, inboxes and handoffs.", after: "BOT RUNS, decisions, exceptions and approved actions remain visible for review." },
            ]}
          />
        )}

        {/* ── The local read: hand-written, beside the city's own vignette. ── */}
        <Section
          variant="alt"
          eyebrow="Why this metro is different"
          heading={`What we would actually change in ${ct.name}.`}
        >
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16 items-center">
            <div>
              <CityVignette name={ct.name} stateAbbr={ct.stateAbbr} labels={ct.districts} />
            </div>
            <div className="space-y-8">
              <div>
                <p className="display-md mb-3">The local read</p>
                <p className="body-base">{ct.character} {ct.localNote}</p>
              </div>
              <div>
                <p className="display-md mb-3">For a {dominant} business here</p>
                <p className="body-base">
                  {dominant[0].toUpperCase() + dominant.slice(1)} is a significant local category, but the market profile is planning context only. The final mandate is derived from your actual customer journey, systems, policies and commercial priorities.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Big-number stat split. ── */}
        <StatSplit
          eyebrow="Operating model"
          heading={<>{svc.serviceName} for {ct.name} — <span className="em-green">defined before launch.</span></>}
          body={`${positioning.summary} ${positioning.execution} The proposal confirms the systems, authority, service levels and review cadence for your organization.`}
          stats={[
            { value: "Defined", label: "Mandate and acceptance criteria" },
            { value: "Scoped", label: "Systems, data and authority" },
            { value: "Approved", label: "External actions and changes" },
            { value: "Recorded", label: "BOT ACTIVITY and exceptions" },
          ]}
          source={`local-${svc.slug}-${ct.slug}-statsplit`}
          note={`${positioning.deliveryModel} · implementation and operating terms confirmed in the proposal.`}
        />

        {/* Other services in this city — the highest-leverage internal-link
            block from the Lot Sealers playbook. */}
        <Section variant="light" size="sm" eyebrow={`Related mandates in ${ct.name}`}
          heading={`Adjacent operating capabilities.`}>
          <div className="grid sm:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)]">
            {ALL_SERVICES.filter((o) => o.slug !== svc.slug).map((o) => (
              <Link key={o.slug} href={`/services/${o.serviceSlug}/${st.slug}/${ct.slug}`} className="group card-cell p-6">
                <p className="mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--text-muted)]">{getServicePositioning(o.slug).deliveryModel}</p>
                <p className="display-md mt-2 group-hover:text-[var(--accent-text)] transition-colors">
                  {o.serviceName} in {ct.name}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--accent-text)]">
                  Open
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
          <p className="body-sm mt-6">
            Or see the whole market at once:{" "}
            <Link href={`/markets/${st.slug}/${ct.slug}`} className="font-semibold text-[var(--accent-text)] hover:underline underline-offset-4">
              the {ct.name} market hub
            </Link>.
          </p>
        </Section>

        <Section variant="alt" size="sm" eyebrow="Nearby markets">
          <div className="grid sm:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)]">
            {near.map((n) => (
              <Link key={n.slug} href={`/services/${svc.serviceSlug}/${n.stateSlug}/${n.slug}`}
                className="group card-cell p-6 flex items-center justify-between gap-4">
                <span>
                  <span className="block display-md">{n.name}, {n.stateAbbr}</span>
                  <span className="block body-xs mt-1">{svc.serviceName}</span>
                </span>
                <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-text)] group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </Section>

        <Section variant="light" eyebrow="Questions" heading={`${svc.serviceName} in ${ct.name}, specifically.`}>
          <div className="max-w-[760px]"><FaqAccordion items={faqs} /></div>
        </Section>

        <Section id="audit" variant="light" eyebrow={`${AUDIT_OFFER.priceLabel} BOT workflow audit`} heading={`Define the ${ct.name} operating case for ${svc.serviceName}.`}
          sub={`We review the public customer journey, identify a defensible starting mandate and document the next decision. Written findings arrive within ${AUDIT_OFFER.turnaround} of payment.`}>
          <div>
            <AuditForm source={`local-${svc.slug}-${ct.slug}-form`} focus={svc.serviceName} />
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}


/* ─────────────────────  Structural market variant  ───────────────────── */


import type { DatasetCity, DatasetState } from "@/lib/geo/dataset";
function StructuralCityService({ svc, st, rec }: {
  svc: Service; st: DatasetState; rec: DatasetCity;
}) {
  const category = svc;
  const positioning = getServicePositioning(svc.slug);
  const surrounding = rec.surrounding
    .filter((s0) => ALL_CITIES.some((x) => x.city_slug === s0.slug && x.state_slug === rec.state_slug))
    .slice(0, 5);
  const vignetteLabels = rec.surrounding.slice(0, 5).map((s0) => s0.city);
  const consolePlaces = vignetteLabels.length ? vignetteLabels : [rec.metro];

  const faqs = [
    { q: `How is ${svc.serviceName.toLowerCase()} delivered in ${rec.city}?`, a: `${positioning.deliveryModel}. The service can be operated remotely across the ${rec.metro} metro, with the systems, data and market context confirmed in the proposal.` },
    { q: `What authority does the system receive?`, a: positioning.boundary },
    { q: `What does it cost?`, a: `The BOT workflow audit is ${AUDIT_OFFER.priceLabel}. A managed deployment has a one-time build fee, then a monthly fee to run and tune. Systems start at $2,500 a month with scope confirmed before implementation.` },
  ];

  return (
    <>
      <JsonLd data={[
        serviceLd({
          name: `${svc.serviceName} in ${rec.city}, ${rec.state_abbr}`,
          description: svc.intro,
          path: `/services/${svc.serviceSlug}/${st.slug}/${rec.city_slug}`,
          areaServed: `${rec.city}, ${rec.state}`,
        }),
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: svc.serviceName, path: `/services/${svc.serviceSlug}` },
          { name: st.name, path: `/services/${svc.serviceSlug}/${st.slug}` },
          { name: rec.city, path: `/services/${svc.serviceSlug}/${st.slug}/${rec.city_slug}` },
        ]),
        faqLd(faqs),
      ]} />
      <Header />
      <main>
        {/* ── Hero: promise left, console running on this market right. ── */}
        <section className="border-b border-[var(--border)]">
          <Container className="pt-12 pb-16">
            <nav className="mb-10 flex flex-wrap items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
              <Link href="/" className="hover:text-[var(--foreground)]">Home</Link><span>/</span>
              <Link href={`/services/${svc.serviceSlug}`} className="hover:text-[var(--foreground)]">{svc.serviceName}</Link><span>/</span>
              <Link href={`/services/${svc.serviceSlug}/${st.slug}`} className="hover:text-[var(--foreground)]">{st.name}</Link><span>/</span>
              <span className="text-[var(--text-body)]">{rec.city}</span>
            </nav>

            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
              <div>
                <p className="eyebrow mb-5">
                  {svc.serviceName} <span className="eyebrow-dim">· {rec.city}, {rec.state_abbr} · {rec.metro} metro</span>
                </p>
                <h1 className="display-hero max-w-[24ch] text-balance">
                  {svc.headlinePattern.replace("{city}", rec.city).replace("{st}", rec.state_abbr)}
                </h1>
                <p className="display-lg mt-3 !font-medium text-[var(--accent-text)]">{positioning.subhead}</p>
                <p className="body-lg mt-5 max-w-[54ch]">{positioning.lead}</p>
                <p className="body-base mt-4 max-w-[54ch]">
                  The {rec.metro} market provides local planning context. Your own customer journey, systems, policies and acceptance criteria determine the implementation.
                </p>
                <div className="mt-8 cta-row">
                  <PlanCta source={`local-${svc.slug}-${rec.city_slug}`} />
                  {category && (
                    <Link href={serviceHref(svc)} className="btn btn-outline">
                      Review the national service mandate
                    </Link>
                  )}
                </div>
                <p className="body-sm mt-5">{AUDIT_OFFER.priceLabel} BOT workflow audit. Written findings within {AUDIT_OFFER.turnaround} of payment.</p>
              </div>
              <AgentConsole
                botName={positioning.deliveryModel}
                feed={() => positioning.scope.slice(0, 4).map((item, i) => ({ t: `0${i + 1}`, body: item }))}
                cityName={rec.city}
                places={consolePlaces}
                stat={{ value: "Scoped", label: "Mandate and authority" }}
              />
            </div>
          </Container>
        </section>

        <StackStrip tools={["Approved source systems", "Client-owned data", "Authority policy", "Approval queue", "BOT ACTIVITY", "Management reporting"]} label={`${svc.serviceName} operating architecture`} />

        {/* This bot's own work, named for this market. */}
        {category && (
          <Section
            variant="alt"
            size="sm"
            eyebrow={`${svc.serviceName} in ${rec.city}`}
            heading={<>A defined mandate, <span className="em-green">operated with control.</span></>}
          >
            <div className="-mx-5 sm:-mx-8">
              <TaskConveyor tasks={positioning.scope} />
            </div>
          </Section>
        )}

        {/* ── Zig-zag deep dives: before/after pairs with mockups. ── */}
        {/* The offer's own product view, so each service × city page shows
            the work this bot does rather than a shared console. */}
        {getOffer(svc.slug) && (
          <Section variant="light">
            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-center">
              <div>
                <p className="eyebrow mb-4">Managed operating view · {rec.city}</p>
                <h2 className="display-xl text-balance">
                  Control the mandate. <span className="em-green">Preserve the evidence.</span>
                </h2>
                <p className="body-lg mt-5 max-w-[46ch]">{positioning.execution}</p>
                <p className="body-sm mt-4">Delivery model: {positioning.deliveryModel}.</p>
              </div>
              <OfferVisual slug={svc.slug} />
            </div>
          </Section>
        )}

        {category && (
          <ZigZag
            eyebrow="What changes"
            heading={<>A clearer operating model for <span className="em-green">{rec.city}.</span></>}
            botName={positioning.deliveryModel}
            rows={[
              { label: `${svc.serviceName} · Ownership`, title: "Defined ownership", today: "Work moves between people and systems without one accountable operating path.", after: "The mandate names the inputs, owner, acceptance criteria and escalation path." },
              { label: `${svc.serviceName} · Authority`, title: "Controlled authority", today: "Teams rely on informal access and inconsistent review before external changes.", after: positioning.boundary },
              { label: `${svc.serviceName} · Evidence`, title: "A management record", today: "Activity is difficult to reconstruct across tools, inboxes and handoffs.", after: "BOT RUNS, decisions, exceptions and approved actions remain visible for review." },
            ]}
          />
        )}

        {/* ── Coverage: the metro vignette + surrounding markets, same service. ── */}
        <Section variant="alt" eyebrow="Coverage" heading={`The ${rec.metro} metro, covered.`}>
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16 items-center">
            <div>
              <CityVignette name={rec.city} stateAbbr={rec.state_abbr} labels={vignetteLabels} />
            </div>
            <div>
              <p className="body-base max-w-[52ch]">
                {svc.serviceName} can be operated remotely across the {rec.metro} metro. The deployment uses only the systems, data and authority defined in your approved scope.
              </p>
              {surrounding.length > 0 && (
                <div className="mt-7 flex flex-wrap gap-3">
                  {surrounding.map((n) => (
                    <Link key={n.slug} href={`/services/${svc.serviceSlug}/${st.slug}/${n.slug}`}
                      className="chip !py-2.5 !px-4 hover:border-ink-950 transition-colors">
                      {svc.serviceName} in {n.city}
                    </Link>
                  ))}
                  <Link href={`/services/${svc.serviceSlug}/${st.slug}`} className="chip chip-accent !py-2.5 !px-4">
                    All {st.name} markets →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* ── Big-number stat split. ── */}
        <StatSplit
          eyebrow="Operating model"
          heading={<>{svc.serviceName} for {rec.city} — <span className="em-green">defined before launch.</span></>}
          body={`${positioning.summary} ${positioning.execution} The proposal confirms the systems, authority, service levels and review cadence for your organization.`}
          stats={[
            { value: "Defined", label: "Mandate and acceptance criteria" },
            { value: "Scoped", label: "Systems, data and authority" },
            { value: "Approved", label: "External actions and changes" },
            { value: "Recorded", label: "BOT ACTIVITY and exceptions" },
          ]}
          source={`local-${svc.slug}-${rec.city_slug}-statsplit`}
          note={`${positioning.deliveryModel} · implementation and operating terms confirmed in the proposal.`}
        />

        {/* Other services, same city — every internal link keeps the city. */}
        <Section variant="light" size="sm" eyebrow={`Related mandates in ${rec.city}`}
          heading="Adjacent operating capabilities.">
          <div className="grid sm:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)]">
            {ALL_SERVICES.filter((o) => o.slug !== svc.slug).map((o) => (
              <Link key={o.slug} href={`/services/${o.serviceSlug}/${st.slug}/${rec.city_slug}`} className="group card-cell p-6">
                <p className="mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--text-muted)]">{getServicePositioning(o.slug).deliveryModel}</p>
                <p className="display-md mt-2 group-hover:text-[var(--accent-text)] transition-colors">
                  {o.serviceName} in {rec.city}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--accent-text)]">
                  Open
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
          <p className="body-sm mt-6">
            Or see the whole market at once:{" "}
            <Link href={`/markets/${st.slug}/${rec.city_slug}`} className="font-semibold text-[var(--accent-text)] hover:underline underline-offset-4">
              the {rec.city} market hub
            </Link>.
          </p>
        </Section>

        <Section variant="alt" eyebrow="Questions" heading={`${svc.serviceName} in ${rec.city}, specifically.`}>
          <div className="max-w-[760px]"><FaqAccordion items={faqs} /></div>
        </Section>

        <Section id="audit" variant="light" eyebrow={`${AUDIT_OFFER.priceLabel} BOT workflow audit`} heading={`Define the ${rec.city} operating case for ${svc.serviceName}.`}
          sub={`We review the public customer journey, identify a defensible starting mandate and document the next decision. Written findings arrive within ${AUDIT_OFFER.turnaround} of payment.`}>
          <div>
            <AuditForm source={`local-${svc.slug}-${rec.city_slug}-form`} focus={svc.serviceName} />
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
