import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Header, Footer } from "@/components/layout";
import { Container, Section } from "@/components/ui";
import { ArrowRight } from "lucide-react";
import {
  AuditForm, PlanCta, FaqAccordion, BotFactory, SecurityBlock, CplDecayChart, PipelineMockup,
  StackStrip, StatSplit, FeatureTriad, ZigZag, TaskConveyor, OfferVisual,
} from "@/components/marketing";
import { JsonLd, serviceLd, breadcrumbLd, faqLd } from "@/components/JsonLd";
import { citiesInState } from "@/lib/geo/data";
import { ALL_STATES, allCitiesInState } from "@/lib/geo/dataset";
import { groupByRegion } from "@/lib/geo/regions";
import { ALL_SERVICES, ALL_CATEGORIES, getService, serviceHref } from "@/lib/catalog";
import { getOffer } from "@/lib/offers";
import { renderHeadline } from "@/lib/headline";

type Params = { params: Promise<{ slug: string }> };

/* Offers with a proof chart of their own get it in the "how it runs"
   section; everyone else gets their own factory scene. */
const HOW_GRAPHIC: Record<string, () => React.ReactNode> = {
  "agentic-ppc-management": () => <CplDecayChart />,
  "agentic-speed-to-lead": () => <PipelineMockup />,
};

export function generateStaticParams() {
  return ALL_SERVICES.map((s) => ({ slug: s.serviceSlug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const svc = getService(slug);
  if (!svc) return {};
  return {
    /* absolute: the " | AgenticBots" suffix costs 14 of the 70 chars
       seo-checks allows, and the longest city label needs them. */
    title: { absolute: `${svc.serviceName} — ${svc.botName} | AgenticBots` },
    description: svc.blurb,
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
      <main>
        {/* ── Hero: promise left, the bot's console right. ── */}
        <section className="border-b border-[var(--border)]">
          <Container className="py-14 sm:py-16">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
              <div>
                <p className="eyebrow mb-5">{svc.botName} <span className="eyebrow-dim">for contractors</span></p>
                <h1 className="display-hero max-w-[20ch] text-balance">{renderHeadline(svc.headline)}</h1>
                <p className="display-lg mt-4 !font-medium text-[var(--text-secondary)]">{svc.hook}</p>
                {/* The national lede. `geoIntro` is deliberately held back for
                    the state and city pages — reusing one paragraph across 924
                    of them is the doorway pattern the gate exists to stop. */}
                <p className="body-lg mt-5 max-w-[52ch]">{svc.intro}</p>
                {offer && (
                  <p className="mt-5 max-w-[52ch] border-l-2 border-[var(--color-accent-500)] bg-[var(--bg-alt)] px-3 py-2 text-[13.5px] text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--accent-text)] mr-1.5">Best for</span>{offer.bestFor}
                  </p>
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
                <p className="body-sm mt-5">Free audit of your lead flow. Scorecard back in two business days.</p>
              </div>
              {/* The offer's own product view — no two service heroes share one. */}
              <OfferVisual slug={svc.slug} />
            </div>
          </Container>
        </section>

        <StackStrip tools={offer?.tools} label={`${svc.botName} plugs into`} />

        <Section
          variant="alt"
          size="sm"
          eyebrow={`${svc.botName} · what it runs`}
          heading={<>Every one of these, <span className="em-green">continuously.</span></>}
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
        <Section variant="light">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-center">
            <div>
              <p className="eyebrow mb-4">{offer?.signature.eyebrow ?? "How it runs"}</p>
              <h2 className="display-xl text-balance">
                {offer?.signature.heading ?? svc.serviceName} <span className="em-green">{offer?.signature.accent}</span>
              </h2>
              <p className="body-lg mt-5 max-w-[46ch]">{offer?.signature.sub ?? svc.outcome}</p>
              <ol className="mt-8 border-t border-[var(--border)]">
                {svc.stations.map((st, i) => (
                  <li key={st.label} className="grid grid-cols-[32px_1fr] gap-3 py-3 border-b border-[var(--border)]">
                    <span className="mono text-[11px] tabular-nums text-[var(--accent-text)] pt-0.5">0{i + 1}</span>
                    <span><span className="block text-[14.5px] font-medium">{st.label}</span><span className="block text-[12.5px] text-[var(--text-secondary)]">{st.meta}</span></span>
                  </li>
                ))}
              </ol>
            </div>
            {HOW_GRAPHIC[svc.serviceSlug]?.() ?? <BotFactory stations={svc.stations} title={`${svc.botName}, going to work`} />}
          </div>
        </Section>

        <ZigZag
          eyebrow="What changes"
          heading={<>Same business. <span className="em-green">Different week.</span></>}
          botName={svc.botName}
          rows={svc.contrast.map((c, i) => ({
            label: `${svc.botName} · ${svc.highlights[i]?.title ?? svc.serviceName}`,
            title: svc.highlights[i]?.title ?? svc.serviceName,
            today: c.today,
            after: c.after,
          }))}
        />

        {/* Metrics come from the record rather than baseline, so the numbers
            the category page used to show survive its retirement. */}
        <StatSplit
          eyebrow="The complete system"
          heading={<>{svc.serviceName}, run for you — <span className="em-green">end to end.</span></>}
          body={`${svc.outcome} ${svc.botName} runs the whole loop — built, monitored and tuned continuously, inside the accounts you already own. You stay the owner of every account and every result.`}
          stats={[
            { value: `${svc.implementationWeeks}w`, label: "To your first system live, in monitored mode" },
            ...svc.metrics.slice(0, 3),
          ]}
          source={`service-${svc.serviceSlug}-statsplit`}
          note="No per-seat pricing. No percentage of ad spend. No lock-in."
        />

        <div id="included" className="scroll-mt-[92px] lg:scroll-mt-[136px]">
          <FeatureTriad
            eyebrow={`${svc.capabilities.length} capabilities`}
            heading={<>Everything under the hood, <span className="em-green">handled.</span></>}
            sub="The work an agency does monthly and a bot does continuously. Not billed per line item."
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
          <Section variant="alt" size="sm" eyebrow="Pairs well with" heading={`What to add once ${svc.botName} is running.`}>
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
          variant="light"
          eyebrow="Markets"
          heading={`${svc.serviceName}, anywhere in the country.`}
          sub="Our focus metros carry a full local market read; every other US market deploys the same way — remotely, into the tools you already use."
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
        <Section variant="alt" eyebrow="Questions" heading={`${svc.serviceName}, specifically.`}>
          <div className="max-w-[760px]"><FaqAccordion items={svc.faqs} /></div>
        </Section>

        <section id="audit" className="section-pad scroll-mt-28 border-t border-[var(--border)]">
          <Container>
            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-start">
              <div>
                <p className="eyebrow mb-4">Free lead leak audit</p>
                <h2 className="display-xl text-balance">See what {svc.botName} would fix in your business.</h2>
                <p className="body-lg mt-5 max-w-[46ch]">
                  We test your lead flow the way a new customer would and send back a short scorecard:
                  response times, missed follow-ups, and where {svc.name.toLowerCase()} fits in. Free, and yours to keep.
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
