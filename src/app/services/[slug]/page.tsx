import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Header, Footer } from "@/components/layout";
import { Container, Section } from "@/components/ui";
import {
  BotPlanForm, PlanCta, FaqAccordion, ProofBar, CompoundingCurve, BotFactory,
  AuditLogPanel, SecurityBlock, VideoSection, CplDecayChart, PipelineMockup,
  StackStrip, StatSplit, FeatureTriad, ZigZag, JoinBand, TaskConveyor,
} from "@/components/marketing";
import { JsonLd, serviceLd, breadcrumbLd, faqLd } from "@/components/JsonLd";
import { citiesInState } from "@/lib/geo/data";
import { ALL_STATES, allCitiesInState } from "@/lib/geo/dataset";
import { groupByRegion } from "@/lib/geo/regions";
import { ALL_SERVICES, getService } from "@/lib/catalog";
import { renderHeadline } from "@/lib/headline";

type Params = { params: Promise<{ slug: string }> };

/* Two graphics that are only honest on one service each: a cost-per-lead
   decay curve means nothing on the RevOps page, and "texted them back in 4
   seconds" is speed-to-lead's story, not Content Marketing's. Keyed rather
   than shown everywhere. */
const SERVICE_GRAPHIC: Record<string, { eyebrow: string; heading: React.ReactNode; sub: string; render: () => React.ReactNode }> = {
  "agentic-ppc-management": {
    eyebrow: "What daily management does to cost",
    heading: <>The same budget, <span className="em-green">bought better.</span></>,
    sub: "Nothing changes about the platforms. What changes is how often anybody looks — and wasted spend gets cut the day it appears rather than the month after.",
    render: () => <CplDecayChart />,
  },
  "agentic-speed-to-lead": {
    eyebrow: "One lead, handled",
    heading: <>Answered before they <span className="em-green">call the next name.</span></>,
    sub: "The whole sequence, start to finish, without anyone reaching for a phone.",
    render: () => <PipelineMockup />,
  },
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
                <p className="eyebrow mb-5">{svc.serviceName} <span className="eyebrow-dim">· {svc.botName} · every US market</span></p>
                <h1 className="display-hero max-w-[20ch] text-balance">{renderHeadline(svc.headline)}</h1>
                <p className="display-lg mt-3 !font-medium text-[var(--accent-text)]">{svc.hook}</p>
                {/* The national lede. `geoIntro` is deliberately held back for
                    the state and city pages — reusing one paragraph across 924
                    of them is the doorway pattern the gate exists to stop. */}
                <p className="body-lg mt-5 max-w-[52ch]">{svc.intro}</p>
                <div className="mt-8 cta-row">
                  <PlanCta source={`service-${svc.serviceSlug}`} />
                  <Link href="#included" className="btn btn-outline">
                    {/* The full label needs ~60px more than a 360px phone can
                        spare next to the primary CTA. */}
                    <span className="sm:hidden">What&rsquo;s included</span>
                    <span className="hidden sm:inline">See everything included</span>
                  </Link>
                </div>
                <p className="body-sm mt-5">Free plan back in one business day. No call required.</p>
              </div>
              {/* Every service draws its own factory: `stations` is per-record,
                  so Ads Bot reads search terms while CRM Bot merges duplicates.
                  AgentConsole stays on the city pages, where the variable is
                  the place rather than the work. */}
              <BotFactory stations={svc.stations} title={`${svc.botName}, going to work`} />
            </div>
          </Container>
        </section>

        <StackStrip />

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

        <ProofBar />

        {/* The narrative beat between "here are the numbers" and "here is what
            changes": why continuous beats monthly at all. Curve is drawn from
            the service's own implementationWeeks, so each one differs. */}
        <Section
          variant="light"
          eyebrow="The compounding part"
          heading={<>An agency bills monthly. <span className="em-green">An agent never stops.</span></>}
          sub={`The gap is not effort, it is cadence. ${svc.botName} goes live in about ${svc.implementationWeeks} weeks and then keeps running — so the work compounds instead of resetting every invoice.`}
        >
          <CompoundingCurve botName={svc.botName} liveWeek={svc.implementationWeeks} />
        </Section>

        {SERVICE_GRAPHIC[svc.serviceSlug] && (
          <Section
            variant="alt"
            eyebrow={SERVICE_GRAPHIC[svc.serviceSlug].eyebrow}
            heading={SERVICE_GRAPHIC[svc.serviceSlug].heading}
            sub={SERVICE_GRAPHIC[svc.serviceSlug].sub}
          >
            {SERVICE_GRAPHIC[svc.serviceSlug].render()}
          </Section>
        )}

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

        <VideoSection
          heading={<>Ninety seconds of {svc.botName}, <span className="em-green">actually running.</span></>}
          sub="No slides and no diagram — the real thing, doing the work, on a real account."
          slotId={`V-${svc.index}`}
          slotLabel={`${svc.botName} explainer`}
          slotSpec={`1920×1080 · 60–90s · screen recording of ${svc.serviceName.toLowerCase()} running, voiceover in plain English, captions burned in`}
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

        <Section
          variant="alt"
          eyebrow="The receipt"
          heading={<>Not a promise of a log — <span className="em-green">the log.</span></>}
          sub={`A real slice of what ${svc.botName} writes as it works, including the action it refused because it sat outside the authority you granted.`}
        >
          <AuditLogPanel />
        </Section>

        {/* The full FAQ set — the local template used to show only three
            because the category page carried the rest. It no longer does. */}
        <Section variant="alt" eyebrow="Questions" heading={`${svc.serviceName}, specifically.`}>
          <div className="max-w-[760px]"><FaqAccordion items={svc.faqs} /></div>
        </Section>

        <JoinBand
          heading={<>Integrate agentic bots to swarm your <span className="em-green">{svc.serviceName.replace(/^Agentic /, "")} tasks.</span></>}
          sub={`One conversation, one free plan — and ${svc.serviceName.toLowerCase()} stops being the thing nobody has time for.`}
          source={`service-${svc.serviceSlug}-joinband`}
        />

        <Section
          variant="light"
          eyebrow="Start here"
          heading={`Get the ${svc.serviceName.toLowerCase()} plan for your market.`}
          sub="Tell us what you sell and where you are. The plan comes back mapped to your market — free, one business day."
        >
          <div>
            <BotPlanForm source={`service-${svc.serviceSlug}-form`} defaultFocus={svc.name} />
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
