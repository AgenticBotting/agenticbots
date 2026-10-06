import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Header, Footer } from "@/components/layout";
import { Container, Section } from "@/components/ui";
import { ArrowRight } from "lucide-react";
import {
  AuditForm, PlanCta, FaqAccordion, SecurityBlock, ActivityLog,
  StackStrip, StatSplit, FeatureTriad, TaskConveyor, OfferVisual, OperatingTransition, ServiceAtmosphere,
} from "@/components/marketing";
import { JsonLd, serviceLd, breadcrumbLd, faqLd } from "@/components/JsonLd";
import { citiesInState } from "@/lib/geo/data";
import { ALL_STATES, allCitiesInState } from "@/lib/geo/dataset";
import { groupByRegion } from "@/lib/geo/regions";
import { ALL_SERVICES, ALL_CATEGORIES, getService, serviceHref } from "@/lib/catalog";
import { getOffer } from "@/lib/offers";
import { renderHeadline } from "@/lib/headline";
import { getServicePositioning } from "@/lib/service-positioning";
import { AUDIT_OFFER } from "@/config/marketing-offer";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return ALL_SERVICES.map((s) => ({ slug: s.serviceSlug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const svc = getService(slug);
  if (!svc) return {};
  const positioning = getServicePositioning(svc.slug);
  return {
    /* absolute: the " | AgenticBots" suffix costs 14 of the 70 chars
       seo-checks allows, and the longest city label needs them. */
    title: { absolute: `${svc.serviceName} — ${svc.botName} | AgenticBots` },
    description: positioning.summary,
    alternates: { canonical: `/services/${svc.serviceSlug}` },
  };
}

export default async function ServiceHub({ params }: Params) {
  const { slug } = await params;
  const svc = getService(slug);
  if (!svc) notFound();
  const regions = groupByRegion(ALL_STATES);
  const href = `/services/${svc.serviceSlug}`;
  const offer = getOffer(svc.slug);
  const positioning = getServicePositioning(svc.slug);
  const pairs = (offer?.pairs ?? [])
    .map((sl) => ALL_CATEGORIES.find((c) => c.slug === sl))
    .filter((c): c is NonNullable<typeof c> => !!c);

  return (
    <>
      <JsonLd data={[
        serviceLd({ name: svc.serviceName, description: svc.intro, path: href, areaServed: "United States" }),
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: svc.serviceName, path: href },
        ]),
        faqLd(svc.faqs),
      ]} />
      <Header />
      <main className="service-hub">
        {/* ── Hero: promise left, the bot's console right. ── */}
        <section className="service-hero">
          <Container className="service-hero-container">
            <ServiceAtmosphere slug={svc.slug} />
            <span className="service-hero-number" aria-hidden="true">{svc.index}</span>
            <div className="service-hero-grid">
              <div className="service-hero-copy">
                <p className="eyebrow mb-5">{svc.serviceName} <span className="eyebrow-dim">· managed BOT deployment</span></p>
                <h1 className="display-hero max-w-[20ch] text-balance">{renderHeadline(positioning.headline)}</h1>
                <p className="display-lg mt-3 !font-medium text-[var(--accent-text)]">{positioning.subhead}</p>
                {/* The national lede. `geoIntro` is deliberately held back for
                    the state and city pages — reusing one paragraph across 924
                    of them is the doorway pattern the gate exists to stop. */}
                <p className="body-lg mt-5 max-w-[54ch]">{positioning.lead}</p>
                {offer && (
                  <div className="service-profile">
                    <p className="service-profile-label">Deployment profile</p>
                    <dl>
                      <div><dt>Best fit</dt><dd>{offer.bestFor}</dd></div>
                      <div><dt>Operating model</dt><dd>Managed deployment in your existing systems</dd></div>
                      <div><dt>Authority</dt><dd>Scoped access and defined approval gates</dd></div>
                    </dl>
                  </div>
                )}
                <div className="mt-8 cta-row">
                  <PlanCta source={`service-${svc.serviceSlug}`} />
                  <Link href="#included" className="btn btn-outline">
                    {/* The full label needs ~60px more than a 360px phone can
                        spare next to the primary CTA. */}
                    <span className="sm:hidden">What&rsquo;s included</span>
                    <span className="hidden sm:inline">See everything included</span>
                  </Link>
                </div>
                <p className="body-sm mt-5">{AUDIT_OFFER.priceLabel} workflow audit. Written findings within {AUDIT_OFFER.turnaround} of payment.</p>
              </div>
              {/* The offer's own product view — no two service heroes share one. */}
              <div className="service-hero-visual">
                <div className="service-hero-visual-head">
                  <span>BOT {svc.index}</span>
                  <span>Illustrative operating view</span>
                </div>
                <OfferVisual slug={svc.slug} />
              </div>
            </div>
          </Container>
        </section>

        <StackStrip tools={offer?.tools} label={`${svc.botName} plugs into`} />

        <nav className="service-spine" aria-label="On this service page">
          <Container>
            {[
              ["01", "Mandate", "#mandate"],
              ["02", "Execution", "#execution"],
              ["03", "Scope and controls", "#included"],
              ["04", "National delivery", "#coverage"],
            ].map(([index, label, target]) => (
              <a key={target} href={target}>
                <span>{index}</span>
                <strong>{label}</strong>
              </a>
            ))}
          </Container>
        </nav>

        <Section
          id="mandate"
          variant="alt"
          size="sm"
          eyebrow={`${svc.botName} · operating mandate`}
          heading={<>A defined scope, <span className="em-green">executed continuously.</span></>}
        >
          {/* The belts bleed past the container gutters on purpose, but the
              chips run far wider than the viewport — without clipping here the
              bleed escapes and the whole document scrolls sideways. */}
          <div className="-mx-5 sm:-mx-8 overflow-hidden">
            <TaskConveyor tasks={svc.capabilities} />
          </div>
        </Section>

        {/* How it runs: the offer's own story on the left, its factory (or
            proof chart) on the right. */}
        <Section id="execution" variant="light">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-center">
            <div>
              <p className="eyebrow mb-4">Execution model</p>
              <h2 className="display-xl text-balance">
                From signal to recorded action, <span className="em-green">within one operating loop.</span>
              </h2>
              <p className="body-lg mt-5 max-w-[48ch]">{positioning.execution}</p>
              <ol className="mt-8 border-t border-[var(--border)]">
                {svc.stations.map((st, i) => (
                  <li key={st.label} className="grid grid-cols-[32px_1fr] gap-3 py-3 border-b border-[var(--border)]">
                    <span className="mono text-[11px] tabular-nums text-[var(--accent-text)] pt-0.5">0{i + 1}</span>
                    <span><span className="block text-[14.5px] font-medium">{st.label}</span><span className="block text-[12.5px] text-[var(--text-secondary)]">{st.meta}</span></span>
                  </li>
                ))}
              </ol>
            </div>
            <ActivityLog
              title={svc.botName}
              crumb="Sample account"
              rows={offer?.feed(["Riverside", "Oak Park"]) ?? svc.stations.map((st, i) => ({ t: `${(i + 1) * 9}m`, body: st.label }))}
              summary={svc.metrics.slice(0, 3).map((m) => ({ label: m.label.length > 28 ? m.label.slice(0, 26) + "…" : m.label, value: m.value }))}
            />
          </div>
        </Section>

        <OperatingTransition
          botName={svc.botName}
          rows={svc.contrast.map((c, i) => ({
            title: svc.highlights[i]?.title ?? svc.serviceName,
            today: c.today,
            after: c.after,
          }))}
        />

        {/* Metrics come from the record rather than baseline, so the numbers
            the category page used to show survive its retirement. */}
        <StatSplit
          eyebrow="Managed capability"
          heading={<>{svc.serviceName}, delivered as <span className="em-green">an operating system.</span></>}
          body={`We define the mandate, configure ${svc.botName}, establish the required controls and operate the workflow inside the systems your organization already owns.`}
          stats={[
            { value: `${svc.implementationWeeks}w`, label: "To your first system live, in monitored mode" },
            ...svc.metrics.slice(0, 3),
          ]}
          source={`service-${svc.serviceSlug}-statsplit`}
          note="Engagement scope, approval rules, operating cadence and commercial terms are documented before launch."
        />

        <div id="included" className="scroll-mt-[92px] lg:scroll-mt-[136px]">
          <FeatureTriad
            eyebrow={`${svc.capabilities.length} defined capabilities`}
            heading={<>Scope, controls and <span className="em-green">operating detail.</span></>}
            sub="Each capability is assigned to a workflow, authority model and review process before it enters production."
            items={svc.highlights.slice(0, 3).map((h, i) => ({
              index: `0${i + 1}`,
              title: h.title,
              body: h.body,
              bullets: svc.capabilities.slice(i * 3, i * 3 + 3),
              href,
              linkLabel: "See the full scope",
            }))}
          />
        </div>

        {pairs.length > 0 && (
          <Section variant="light" size="sm" eyebrow="Adjacent capabilities" heading={`Extend the operating model after ${svc.botName} is stable.`}>
            <ul className="grid sm:grid-cols-3 gap-3">
              {pairs.map((c) => (
                <li key={c.slug} className="flex">
                  <Link href={serviceHref(c)} className="group w-full flex flex-col gap-2 p-5 border border-[var(--border)] bg-white hover:border-ink-950 hover:-translate-y-0.5 hover:shadow-lift transition-all">
                    <span className="display-md !text-[16px] group-hover:text-[var(--accent-text)] transition-colors">{c.botName}</span>
                    <span className="text-[13px] leading-snug text-[var(--text-secondary)]">{c.outcome}</span>
                    <ArrowRight className="w-4 h-4 mt-auto pt-1 text-[var(--accent-text)] group-hover:translate-x-1 transition-transform" />
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* ── Markets: region columns, focus metros first. ── */}
        <Section
          id="coverage"
          variant="alt"
          eyebrow="National delivery"
          heading={`${svc.serviceName}, informed by local market context.`}
          sub="Focus metros include a detailed local market view. Every deployment uses the same governed operating model inside the systems your organization already controls."
        >
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-8">
            {regions.map(({ region, states }) => (
              <div key={region}>
                <p className="pb-2.5 mb-3 border-b border-[var(--border)] mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  {region}
                </p>
                <ul className="space-y-1.5">
                  {states.map((st) => {
                    const enriched = citiesInState(st.slug).length > 0;
                    return (
                      <li key={st.slug}>
                        <Link
                          href={enriched ? `${href}/${st.slug}` : `/markets/${st.slug}`}
                          className="group flex items-center justify-between gap-2 text-[13.5px] text-[var(--text-body)] hover:text-[var(--accent-text)] transition-colors"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            {st.name}
                            {enriched && <span className="h-1.5 w-1.5 shrink-0 bg-accent-500" title="Focus market" />}
                          </span>
                          <span className="mono text-[10px] tabular-nums text-[var(--text-muted)]">
                            {allCitiesInState(st.slug).length}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <p className="body-sm mt-8">
            <span className="inline-block h-1.5 w-1.5 bg-accent-500 mr-2 align-middle" />
            Focus metros with a full local read · counts are cities covered per state
          </p>
        </Section>

        {/* Trust, in the order it is earned: the four commitments, then the
            receipt. A new company with no client logos has to show the
            governance rather than assert the results. */}
        <SecurityBlock />

        {/* The full FAQ set — the local template used to show only three
            because the category page carried the rest. It no longer does. */}
        <Section variant="alt" eyebrow="Procurement and operations" heading={`${svc.serviceName}, in practical terms.`}>
          <div className="max-w-[760px]"><FaqAccordion items={svc.faqs} /></div>
        </Section>

        <section id="audit" className="section-pad scroll-mt-28 border-t border-[var(--border)]">
          <Container>
            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-start">
              <div>
                <p className="eyebrow mb-4">{AUDIT_OFFER.priceLabel} workflow audit</p>
                <h2 className="display-xl text-balance">Define the business case for {svc.botName}.</h2>
                <p className="body-lg mt-5 max-w-[46ch]">
                  We review the relevant customer journey, operating constraints and systems to determine whether {svc.name.toLowerCase()} supports a credible managed workflow. Written findings arrive within {AUDIT_OFFER.turnaround} of payment.
                </p>
              </div>
              <AuditForm source={`service-${svc.serviceSlug}-form`} focus={svc.botName} />
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
