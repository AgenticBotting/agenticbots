import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, Section } from "@/components/ui";
import { BotPlanForm, PlanCta, StatBand, FaqAccordion, CityVignette } from "@/components/marketing";
import { LOCAL_SERVICES, getService, getCity, nearbyCities, fmt } from "@/lib/geo/data";
import { ALL_CITIES, getDatasetCity, getDatasetState, isEnriched } from "@/lib/geo/dataset";
import { rotatedValueProp, rotatedCta } from "@/lib/geo/seo-rotation";
import { getCategory } from "@/lib/catalog";
import type { PillarSlug } from "@/lib/catalog";
import { JsonLd, serviceLd, breadcrumbLd, faqLd } from "@/components/JsonLd";

type Params = { params: Promise<{ service: string; state: string; city: string }> };

export function generateStaticParams() {
  /* Every service × every city in the national dataset — the internal
     links from city hubs land on a real service+city variation for all
     924 markets, not just the enriched set. */
  return LOCAL_SERVICES.flatMap((s) =>
    ALL_CITIES.map((c) => ({ service: s.slug, state: c.state_slug, city: c.city_slug }))
  );
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { service, state, city } = await params;
  const svc = getService(service);
  const rec = getDatasetCity(state, city);
  if (!svc || !rec) return {};
  const enriched = isEnriched(state, city);
  const ct = enriched ? getCity(state, city) : undefined;
  return {
    title: `${svc.name} Company in ${rec.city}, ${rec.state_abbr}`,
    description: ct
      ? `${svc.name} for ${ct.name} businesses — agent systems that run continuously across a ${fmt.format(ct.businessCount)}-business metro. First system live in ~${svc.implementationWeeks} weeks.`
      : `${svc.name} for ${rec.city}, ${rec.state_abbr} businesses — ${svc.botName} runs continuously across the ${rec.metro} metro, live in ~${svc.implementationWeeks} weeks.`,
    alternates: { canonical: `/local/${service}/${state}/${city}` },
    /* Structural markets stay out of the index until enriched —
       release schedule, docs/PROGRAMMATIC-SEO-PLAN.md §6. */
    ...(enriched ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function CityPage({ params }: Params) {
  const { service, state, city } = await params;
  const svc = getService(service);
  const st = getDatasetState(state);
  const rec = getDatasetCity(state, city);
  if (!svc || !st || !rec) notFound();

  if (!isEnriched(state, city)) {
    return <StructuralCityService svc={svc} st={st} rec={rec} />;
  }

  const ct = getCity(state, city);
  if (!ct) notFound();

  const category = getCategory(svc.catalogPillar as PillarSlug, svc.catalogSlug);
  const near = nearbyCities(ct);
  const dominant = ct.industries[0];

  /* Composite, per-page-distinct content: market numbers, industry mix,
     the hand-written local note, and a dominant-industry scenario. */
  const faqs = [
    { q: `Do you work with ${ct.name} businesses remotely?`, a: `Yes — the bots run inside your existing accounts (CRM, ads, phone, calendar), so everything deploys remotely. ${ct.name} is in ${ct.timezone.replace("America/", "").replace("_", " ")} time and every sequence is scheduled against your local hours, not ours.` },
    { q: `How competitive is ${svc.name.toLowerCase()} in ${ct.name}?`, a: `${ct.name}'s local market is ${ct.competition}. Local-service CPCs in this metro typically run $${ct.cpcBand[0]}–$${ct.cpcBand[1]} (estimated band), which is exactly why the follow-up side of the funnel — the part that costs nothing per click — is usually the cheaper win.` },
    { q: `How fast can this go live for a ${dominant} business?`, a: `The typical build is ~${svc.implementationWeeks} weeks to a first system in monitored mode. ${dominant[0].toUpperCase() + dominant.slice(1)} intake flows are common in ${ct.name} and rarely need custom work.` },
  ];

  return (
    <>
      <JsonLd data={[
        serviceLd({ name: `${svc.name} in ${ct.name}, ${ct.stateAbbr}`, description: svc.intro, path: `/local/${svc.slug}/${st.slug}/${ct.slug}`, areaServed: `${ct.name}, ${ct.stateName}` }),
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: svc.name, path: `/local/${svc.slug}` },
          { name: st.name, path: `/local/${svc.slug}/${st.slug}` },
          { name: ct.name, path: `/local/${svc.slug}/${st.slug}/${ct.slug}` },
        ]),
        faqLd(faqs),
      ]} />
      <Header />
      <main>
        <section className="border-b border-[var(--border)]">
          <Container className="pt-12 pb-16">
            <nav className="mb-10 flex flex-wrap items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
              <Link href="/" className="hover:text-[var(--foreground)]">Home</Link><span>/</span>
              <Link href={`/local/${svc.slug}`} className="hover:text-[var(--foreground)]">{svc.name}</Link><span>/</span>
              <Link href={`/local/${svc.slug}/${st.slug}`} className="hover:text-[var(--foreground)]">{st.name}</Link><span>/</span>
              <span className="text-[var(--text-body)]">{ct.name}</span>
            </nav>

            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-20 items-start">
              <div>
                <p className="eyebrow mb-5">
                  {svc.name} <span className="eyebrow-dim">· {ct.name}, {ct.stateAbbr}</span>
                </p>
                <h1 className="display-hero max-w-[24ch] text-balance">
                  {svc.headlinePattern.replace("{city}", ct.name).replace("{st}", ct.stateAbbr)}
                </h1>
                <p className="display-lg mt-3 !font-medium text-[var(--accent-text)]">{svc.hook}</p>
                <p className="body-lg mt-5 max-w-[54ch]">{svc.intro}</p>
                <p className="body-base mt-4 max-w-[54ch]">
                  <span className="font-semibold text-[var(--accent-text)]">{rotatedValueProp(svc.slug, ct.slug)}</span>
                  {" — "}from {ct.districts[0]} to {ct.districts[ct.districts.length - 1]}, wherever your {ct.name} customers are.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <PlanCta source={`local-${svc.slug}-${ct.slug}`} />
                  {category && (
                    <Link
                      href={`/${category.pillar}/${category.slug}`}
                      className="btn btn-outline"
                    >
                      How {svc.botName} works
                    </Link>
                  )}
                </div>
              </div>

              <div>
                <div className="border border-[var(--border)] bg-[var(--bg-alt)] px-5 pt-6 pb-3 mb-8">
                  <CityVignette name={ct.name} stateAbbr={ct.stateAbbr} labels={ct.districts} />
                </div>
                <div className="border-t-2 border-ink-950 pt-6">
                <p className="mono text-[10.5px] uppercase tracking-[0.11em] text-[var(--text-muted)] mb-5">
                  {ct.name} market snapshot · estimates
                </p>
                <dl className="space-y-0">
                  {[
                    ["Metro population", fmt.format(ct.metroPopulation)],
                    ["Businesses in metro", `~${fmt.format(ct.businessCount)}`],
                    ["Local-service CPC band", `$${ct.cpcBand[0]}–$${ct.cpcBand[1]} est.`],
                    ["Agency competition", ct.competition],
                    ["Typical build", `${svc.implementationWeeks} weeks`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-6 py-3 border-b border-[var(--border)]">
                      <dt className="body-sm">{k}</dt>
                      <dd className="text-[14.5px] font-semibold tabular-nums tracking-[-0.01em]">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="body-xs mt-4">
                  Public-source estimates, refreshed periodically — shown for orientation, not quoted as audit data.
                </p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <Section
          variant="alt"
          eyebrow="Why this metro is different"
          heading={`What we would actually change in ${ct.name}.`}
        >
          <div className="grid lg:grid-cols-2 gap-10 max-w-[1000px]">
            <div>
              <p className="display-md mb-3">The local read</p>
              <p className="body-base">{ct.character} {ct.localNote}</p>
            </div>
            <div>
              <p className="display-md mb-3">For a {dominant} business here</p>
              <p className="body-base">
                {dominant[0].toUpperCase() + dominant.slice(1)} is {ct.name}&apos;s dominant vertical, which sets
                the shape of the build: {svc.botName} tuned to how {dominant} customers actually buy, with{" "}
                {ct.industries.slice(1, 3).join(" and ")} intake patterns covered from day one. Baseline cadence:{" "}
                {svc.baseline.map((b) => `${b.metric.toLowerCase()} ${b.value}`).join(" · ")}.
              </p>
            </div>
          </div>
        </Section>

        <StatBand
          eyebrow={`${ct.name} deployment`}
          title={`The same fleet, tuned to ${ct.name}'s market.`}
          metrics={[
            { value: `${svc.implementationWeeks}w`, label: "To first system live, monitored" },
            { value: "24/7", label: `Coverage on ${ct.timezone.replace("America/", "").replace("_", " ")} hours` },
            { value: `${ct.industries.length}`, label: `${ct.name} verticals covered at launch` },
          ]}
        />

        <Section variant="light" eyebrow="Questions" heading={`${svc.name} in ${ct.name}, specifically.`}>
          <div className="max-w-[760px]"><FaqAccordion items={faqs} /></div>
        </Section>

        {/* Other services in this city — the highest-leverage internal-link
            block from the Lot Sealers playbook. */}
        <Section variant="light" size="sm" eyebrow={`Also running in ${ct.name}`}
          heading={`Other bots ${ct.name} businesses deploy.`}>
          <div className="grid sm:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)]">
            {LOCAL_SERVICES.filter((o) => o.slug !== svc.slug).map((o) => (
              <Link key={o.slug} href={`/local/${o.slug}/${st.slug}/${ct.slug}`} className="group card-cell p-6">
                <p className="mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--text-muted)]">{o.botName}</p>
                <p className="display-md mt-2 group-hover:text-[var(--accent-text)] transition-colors">
                  {o.name} in {ct.name}
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
              <Link key={n.slug} href={`/local/${svc.slug}/${n.stateSlug}/${n.slug}`}
                className="group card-cell p-6 flex items-center justify-between gap-4">
                <span>
                  <span className="block display-md">{n.name}, {n.stateAbbr}</span>
                  <span className="block body-xs mt-1">{svc.name}</span>
                </span>
                <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-text)] group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </Section>

        <Section variant="light" eyebrow="Start here" heading={`Get the ${ct.name} bot plan.`}
          sub={`Tell us what you sell and where it is getting stuck. ${rotatedCta(svc.slug, ct.slug)}`}>
          <div className="max-w-[640px]">
            <BotPlanForm source={`local-${svc.slug}-${ct.slug}-form`} defaultFocus={category?.name} />
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}


/* ─────────────────────  Structural market variant  ───────────────────── */

import type { LocalService } from "@/lib/geo/schema";
import type { DatasetCity, DatasetState } from "@/lib/geo/dataset";
import { rotatedValueProp as rvp, rotatedCta as rcta } from "@/lib/geo/seo-rotation";

function StructuralCityService({ svc, st, rec }: {
  svc: LocalService; st: DatasetState; rec: DatasetCity;
}) {
  const category = getCategory(svc.catalogPillar as PillarSlug, svc.catalogSlug);
  const surrounding = rec.surrounding
    .filter((s0) => ALL_CITIES.some((x) => x.city_slug === s0.slug && x.state_slug === rec.state_slug))
    .slice(0, 5);
  const vignetteLabels = rec.surrounding.slice(0, 5).map((s0) => s0.city);

  const faqs = [
    { q: `Do you serve ${rec.city} remotely?`, a: `Yes — ${svc.botName} runs inside your existing accounts (CRM, ads, phone, calendar), so everything deploys remotely, anywhere in the ${rec.metro} metro, on your local hours.` },
    { q: `How fast can ${svc.name.toLowerCase()} go live in ${rec.city}?`, a: `The typical build is about ${svc.implementationWeeks} weeks to a first system running in monitored mode, with every action reviewed daily before it goes fully autonomous.` },
    { q: `What does it cost?`, a: `A one-time build fee, then a monthly fee to run and tune — no per-seat pricing, no percentage of ad spend, no lock-in. The free plan comes back with numbers for your situation.` },
  ];

  return (
    <>
      <JsonLd data={[
        serviceLd({
          name: `${svc.name} in ${rec.city}, ${rec.state_abbr}`,
          description: svc.intro,
          path: `/local/${svc.slug}/${st.slug}/${rec.city_slug}`,
          areaServed: `${rec.city}, ${rec.state}`,
        }),
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: svc.name, path: `/local/${svc.slug}` },
          { name: st.name, path: `/local/${svc.slug}/${st.slug}` },
          { name: rec.city, path: `/local/${svc.slug}/${st.slug}/${rec.city_slug}` },
        ]),
        faqLd(faqs),
      ]} />
      <Header />
      <main>
        <section className="border-b border-[var(--border)]">
          <Container className="pt-12 pb-16">
            <nav className="mb-10 flex flex-wrap items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
              <Link href="/" className="hover:text-[var(--foreground)]">Home</Link><span>/</span>
              <Link href={`/local/${svc.slug}`} className="hover:text-[var(--foreground)]">{svc.name}</Link><span>/</span>
              <Link href={`/local/${svc.slug}/${st.slug}`} className="hover:text-[var(--foreground)]">{st.name}</Link><span>/</span>
              <span className="text-[var(--text-body)]">{rec.city}</span>
            </nav>

            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
              <div>
                <p className="eyebrow mb-5">
                  {svc.name} <span className="eyebrow-dim">· {rec.city}, {rec.state_abbr} · {rec.metro} metro</span>
                </p>
                <h1 className="display-hero max-w-[24ch] text-balance">
                  {svc.headlinePattern.replace("{city}", rec.city).replace("{st}", rec.state_abbr)}
                </h1>
                <p className="display-lg mt-3 !font-medium text-[var(--accent-text)]">{svc.hook}</p>
                <p className="body-lg mt-5 max-w-[54ch]">{svc.intro}</p>
                <p className="body-base mt-4 max-w-[54ch]">
                  <span className="font-semibold text-[var(--accent-text)]">{rvp(svc.slug, rec.city_slug)}</span>
                  {" — "}deployed remotely for {rec.city} businesses, wired into the tools you already use.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <PlanCta source={`local-${svc.slug}-${rec.city_slug}`} />
                  {category && (
                    <Link href={`/${category.pillar}/${category.slug}`} className="btn btn-outline">
                      How {svc.botName} works
                    </Link>
                  )}
                </div>
              </div>
              <div className="border border-[var(--border)] bg-[var(--bg-alt)] px-6 pt-8 pb-4">
                <CityVignette name={rec.city} stateAbbr={rec.state_abbr} labels={vignetteLabels} />
              </div>
            </div>
          </Container>
        </section>

        {/* Persuasion — the category's before/after, framed for this market. */}
        {category && (
          <Section variant="alt" eyebrow="What changes"
            heading={`Same ${rec.city} business. Different week.`}>
            <div className="border-t border-[var(--border-strong)] max-w-[1040px]">
              {category.contrast.map((c, i) => (
                <div key={c.today} className="grid md:grid-cols-[auto_1fr_1fr] gap-6 md:gap-12 py-8 border-b border-[var(--border)]">
                  <span className="display-md text-[var(--text-muted)] md:w-10">0{i + 1}</span>
                  <div>
                    <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)] mb-2.5">Today</p>
                    <p className="body-base">{c.today}</p>
                  </div>
                  <div className="md:pl-10 md:border-l-2 md:border-ink-950">
                    <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-[var(--accent-text)] mb-2.5">
                      With {svc.botName}
                    </p>
                    <p className="body-base !text-[var(--foreground)] font-medium">{c.after}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <StatBand
          eyebrow={`${rec.city} deployment`}
          title={`${svc.name}, tuned to the ${rec.metro} metro.`}
          metrics={svc.baseline.map((b) => ({ value: b.value, label: b.metric }))}
        />

        {/* Other services, same city — every internal link keeps the city. */}
        <Section variant="light" size="sm" eyebrow={`Also running in ${rec.city}`}
          heading={`Other bots ${rec.city} businesses deploy.`}>
          <div className="grid sm:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)]">
            {LOCAL_SERVICES.filter((o) => o.slug !== svc.slug).map((o) => (
              <Link key={o.slug} href={`/local/${o.slug}/${st.slug}/${rec.city_slug}`} className="group card-cell p-6">
                <p className="mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--text-muted)]">{o.botName}</p>
                <p className="display-md mt-2 group-hover:text-[var(--accent-text)] transition-colors">
                  {o.name} in {rec.city}
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

        {/* Surrounding markets — metro-cluster siblings, same service. */}
        {surrounding.length > 0 && (
          <Section variant="alt" size="sm" eyebrow={`${svc.name} nearby`}>
            <div className="flex flex-wrap gap-3">
              {surrounding.map((n) => (
                <Link key={n.slug} href={`/local/${svc.slug}/${st.slug}/${n.slug}`}
                  className="chip !py-2.5 !px-4 hover:border-ink-950 transition-colors">
                  {svc.name} in {n.city}
                </Link>
              ))}
              <Link href={`/local/${svc.slug}/${st.slug}`} className="chip chip-accent !py-2.5 !px-4">
                All {st.name} markets →
              </Link>
            </div>
          </Section>
        )}

        <Section variant="light" eyebrow="Questions" heading={`${svc.name} in ${rec.city}, specifically.`}>
          <div className="max-w-[760px]"><FaqAccordion items={faqs} /></div>
        </Section>

        <Section variant="alt" eyebrow="Start here" heading={`Get the ${rec.city} plan.`}
          sub={`Tell us what you sell and where it is getting stuck. ${rcta(svc.slug, rec.city_slug)}`}>
          <div className="max-w-[640px]">
            <BotPlanForm source={`local-${svc.slug}-${rec.city_slug}-form`} defaultFocus={category?.name} />
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
