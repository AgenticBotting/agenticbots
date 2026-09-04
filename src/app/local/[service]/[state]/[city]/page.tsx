import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, Section } from "@/components/ui";
import { BotPlanForm, PlanCta, StatBand, FaqAccordion } from "@/components/marketing";
import { CITIES, LOCAL_SERVICES, getService, getState, getCity, nearbyCities, fmt } from "@/lib/geo/data";
import { getCategory } from "@/lib/catalog";
import type { PillarSlug } from "@/lib/catalog";
import { JsonLd, serviceLd, breadcrumbLd, faqLd } from "@/components/JsonLd";

type Params = { params: Promise<{ service: string; state: string; city: string }> };

export function generateStaticParams() {
  return LOCAL_SERVICES.flatMap((s) =>
    CITIES.map((c) => ({ service: s.slug, state: c.stateSlug, city: c.slug }))
  );
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { service, state, city } = await params;
  const svc = getService(service); const ct = getCity(state, city);
  if (!svc || !ct) return {};
  return {
    title: `${svc.name} Company in ${ct.name}, ${ct.stateAbbr}`,
    description: `${svc.name} for ${ct.name} businesses — agent systems that run continuously across a ${fmt.format(ct.businessCount)}-business metro. First system live in ~${svc.implementationWeeks} weeks.`,
    alternates: { canonical: `/local/${service}/${state}/${city}` },
  };
}

export default async function CityPage({ params }: Params) {
  const { service, state, city } = await params;
  const svc = getService(service);
  const st = getState(state);
  const ct = getCity(state, city);
  if (!svc || !st || !ct) notFound();

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
                <h1 className="display-hero max-w-[22ch] text-balance">
                  {svc.headlinePattern.replace("{city}", ct.name)}
                </h1>
                <p className="body-lg mt-6 max-w-[54ch]">{svc.intro}</p>
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
              <p className="body-base">{ct.localNote}</p>
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
          sub="Tell us what you sell and where it is getting stuck. The plan comes back mapped to this market — free, one business day.">
          <div className="max-w-[640px]">
            <BotPlanForm source={`local-${svc.slug}-${ct.slug}-form`} defaultFocus={category?.name} />
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
