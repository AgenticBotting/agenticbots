import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import { Container, Section } from "@/components/ui";
import { PlanCta, StatSplit, FaqAccordion, SecurityBlock } from "@/components/marketing";
import { JsonLd, serviceLd, breadcrumbLd, faqLd } from "@/components/JsonLd";
import { citiesInState, fmt } from "@/lib/geo/data";
import { ALL_SERVICES, getService } from "@/lib/catalog";
import { ALL_STATES, allCitiesInState, getDatasetState, isEnriched } from "@/lib/geo/dataset";

type Params = { params: Promise<{ slug: string; state: string }> };

export function generateStaticParams() {
  return ALL_SERVICES.flatMap((s) => ALL_STATES.map((st) => ({ slug: s.serviceSlug, state: st.slug })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, state } = await params;
  const svc = getService(slug); const st = getDatasetState(state);
  if (!svc || !st) return {};
  const cities = allCitiesInState(state);
  const enriched = citiesInState(state).length > 0;
  return {
    /* absolute: the root template's " | AgenticBots" costs 14 of the 70
       chars seo-checks allows, and the long service names need them. */
    title: { absolute: `${svc.serviceName} in ${st.name} | AgenticBots` },
    description: `${svc.serviceName} for ${st.name} businesses — ${svc.botName} deployed across ${cities.length} cities including ${cities.slice(0, 3).map((c) => c.city).join(", ")}.`,
    alternates: { canonical: `/services/${slug}/${state}` },
    ...(enriched ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function StateHub({ params }: Params) {
  const { slug, state } = await params;
  const svc = getService(slug); const st = getDatasetState(state);
  if (!svc || !st) notFound();
  const all = allCitiesInState(state);
  const enrichedCities = citiesInState(state);
  const totalBiz = enrichedCities.reduce((s, c) => s + c.businessCount, 0);
  const metroCount = new Set(all.map((c) => c.metro)).size;
  const path = `/services/${svc.serviceSlug}/${st.slug}`;

  /* Composite, state-distinct FAQ — the same technique the city tier uses
     (real numbers computed for this record, not a paragraph copied from
     the hub). Kept to three: this tier's job is breadth and trust, the
     hub already carries the full set. */
  const faqs = [
    {
      q: `Does ${svc.botName} work the same way across all of ${st.name}?`,
      a: `Yes — the bot deploys remotely into your existing accounts (CRM, ads, phone, calendar), so coverage does not depend on a local office. ${enrichedCities.length > 0 ? `${enrichedCities.length} ${st.name} ${enrichedCities.length === 1 ? "metro carries" : "metros carry"} a full local market read; every other city in the state deploys the same way.` : `Every city in ${st.name} deploys the same way — the fleet does not need a local presence to work locally.`}`,
    },
    {
      q: `How fast can this go live in ${st.name}?`,
      a: `The typical build is about ${svc.implementationWeeks} weeks to a first system running in monitored mode, wherever in ${st.name} you are. Every action is reviewed daily before anything runs unattended.`,
    },
    {
      q: `Which ${st.name} city should I pick if mine is not listed?`,
      a: `Pick the nearest metro — the system runs identically regardless of which city page you started from. ${totalBiz > 0 ? `The ${fmt.format(totalBiz)}+ businesses already mapped across ${st.name}'s focus metros give a good read on typical results for a business your size.` : `Every city page carries the same detail once you tell us where you are.`}`,
    },
  ];

  return (
    <>
      <JsonLd data={[
        serviceLd({
          name: `${svc.serviceName} in ${st.name}`,
          description: svc.geoIntro,
          path,
          areaServed: st.name,
        }),
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: svc.serviceName, path: `/services/${svc.serviceSlug}` },
          { name: st.name, path },
        ]),
        faqLd(faqs),
      ]} />
      <Header />
      <main>
        <section className="border-b border-[var(--border)]">
          <Container className="py-16">
            <nav className="mb-8 flex items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
              <Link href="/" className="hover:text-[var(--foreground)]">Home</Link><span>/</span>
              <Link href={`/services/${svc.serviceSlug}`} className="hover:text-[var(--foreground)]">{svc.serviceName}</Link><span>/</span>
              <span className="text-[var(--text-body)]">{st.name}</span>
            </nav>
            <p className="eyebrow mb-5">{svc.serviceName} <span className="eyebrow-dim">· {st.name} · {all.length} cities</span></p>
            <h1 className="display-hero max-w-[20ch] text-balance">
              {svc.serviceName} across {st.name}.
            </h1>
            {/* `geoIntro` — the lede authored specifically for state/city
                tiers, distinct from the hub's national `intro`. Wiring it up
                here for the first time; the page previously fell back to a
                generic templated sentence that said the same thing on all
                663 state pages regardless of service. */}
            <p className="body-lg mt-6 max-w-[54ch]">{svc.geoIntro}</p>
            <div className="mt-8 cta-row">
              <PlanCta source={`state-${svc.serviceSlug}-${st.slug}`} />
              <Link href={`/services/${svc.serviceSlug}`} className="btn btn-outline">
                <span className="sm:hidden">Full service page</span>
                <span className="hidden sm:inline">See the full {svc.botName} page</span>
              </Link>
            </div>
          </Container>
        </section>

        {/* Real numbers for this state, not the hub's national metrics —
            the same StatSplit component the hub and city tiers already use,
            so the visual language is consistent top to bottom. */}
        <StatSplit
          eyebrow="This state"
          heading={<>What {svc.botName} covers in <span className="em-green">{st.name}.</span></>}
          body={`${totalBiz > 0 ? `An estimated ${fmt.format(totalBiz)} businesses sit inside ${st.name}'s focus metros alone.` : `${st.name} deploys the same way as every other state — remotely, into the tools each business already runs.`} Coverage does not thin out between cities: every one of the ${all.length} on this page gets the same system.`}
          stats={[
            { value: String(all.length), label: `${st.name} cities covered` },
            { value: String(metroCount), label: metroCount === 1 ? "Metro area" : "Metro areas" },
            { value: `${svc.implementationWeeks}w`, label: "To your first system live" },
            { value: enrichedCities.length > 0 ? String(enrichedCities.length) : "All", label: enrichedCities.length > 0 ? "Focus metros, full local read" : "Cities, same system" },
          ]}
          source={`state-${svc.serviceSlug}-${st.slug}-statsplit`}
          note={`${svc.botName} · deployed remotely, anywhere in ${st.name}.`}
        />

        <Section variant="alt" eyebrow={`${all.length} cities`} heading={`${svc.serviceName} across ${st.name}.`}
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
                        href={`/services/${svc.serviceSlug}/${st.slug}/${c.city_slug}`}
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

        {/* Trust — the same governance block the hub runs. Generic, no
            service-specific terms (verified against owns/excludes), so it
            carries zero cannibalization risk repeated at state scale. */}
        <SecurityBlock />

        <Section variant="light" eyebrow="Questions" heading={`${svc.serviceName} in ${st.name}, specifically.`}>
          <div className="max-w-[760px]"><FaqAccordion items={faqs} /></div>
        </Section>

        <Section
          variant="alt"
          size="sm"
          eyebrow="Start here"
          heading={`Get the ${st.name} bot plan.`}
          sub="Tell us where in the state you are — the plan comes back mapped to your market either way."
        >
          <div className="cta-row">
            <PlanCta source={`state-bottom-${svc.serviceSlug}-${st.slug}`} />
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
