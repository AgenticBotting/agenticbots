import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Header, Footer } from "@/components/layout";
import { Container, Section } from "@/components/ui";
import {
  BotPlanForm, PlanCta, FaqAccordion, ProofBar,
  AgentConsole, StackStrip, StatSplit, FeatureTriad, ZigZag, JoinBand,
} from "@/components/marketing";
import { JsonLd, serviceLd, breadcrumbLd, faqLd } from "@/components/JsonLd";
import { LOCAL_SERVICES, getService, citiesInState } from "@/lib/geo/data";
import { ALL_STATES, allCitiesInState } from "@/lib/geo/dataset";
import { groupByRegion } from "@/lib/geo/regions";
import { getCategory } from "@/lib/catalog";
import type { PillarSlug } from "@/lib/catalog";

type Params = { params: Promise<{ service: string }> };

export function generateStaticParams() {
  return LOCAL_SERVICES.map((s) => ({ service: s.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { service } = await params;
  const svc = getService(service);
  if (!svc) return {};
  return {
    title: `${svc.name} — markets we serve`,
    description: `${svc.name} run by ${svc.botName}: ${svc.hook.toLowerCase().replace(/\.$/, "")} — deployed in any US market, live in ~${svc.implementationWeeks} weeks.`,
    alternates: { canonical: `/local/${service}` },
  };
}

export default async function ServiceHub({ params }: Params) {
  const { service } = await params;
  const svc = getService(service);
  if (!svc) notFound();
  const category = getCategory(svc.catalogPillar as PillarSlug, svc.catalogSlug);
  const regions = groupByRegion(ALL_STATES);
  const faqs = category ? category.faqs.slice(0, 3) : [];

  return (
    <>
      <JsonLd data={[
        serviceLd({ name: svc.name, description: svc.intro, path: `/local/${svc.slug}`, areaServed: "United States" }),
        breadcrumbLd([{ name: "Home", path: "/" }, { name: svc.name, path: `/local/${svc.slug}` }]),
        ...(faqs.length ? [faqLd(faqs)] : []),
      ]} />
      <Header />
      <main>
        {/* ── Hero: promise left, the bot's console right (wireframe #2/#3). ── */}
        <section className="border-b border-[var(--border)]">
          <Container className="py-14 sm:py-16">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
              <div>
                <p className="eyebrow mb-5">{svc.name} <span className="eyebrow-dim">· {svc.botName} · every US market</span></p>
                <h1 className="display-hero max-w-[20ch] text-balance">
                  {svc.name}, deployed where your customers are.
                </h1>
                <p className="display-lg mt-3 !font-medium text-[var(--accent-text)]">{svc.hook}</p>
                <p className="body-lg mt-5 max-w-[52ch]">{svc.intro}</p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <PlanCta source={`local-hub-${svc.slug}`} />
                  {category && (
                    <Link href={`/${category.pillar}/${category.slug}`} className="btn btn-outline">
                      How {category.botName} works
                    </Link>
                  )}
                </div>
                <p className="body-sm mt-5">Free plan back in one business day. No call required.</p>
              </div>
              <AgentConsole
                botName={svc.botName}
                places={["your busiest market", "your next market"]}
                stat={{ value: svc.baseline[0].value, label: svc.baseline[0].metric }}
              />
            </div>
          </Container>
        </section>

        <StackStrip />
        <ProofBar />

        {/* ── Zig-zag deep dives: the before/after pairs, one mockup each. ── */}
        {category && (
          <ZigZag
            eyebrow="What changes"
            heading={<>Same business. <span className="em-green">Different week.</span></>}
            botName={svc.botName}
            rows={category.contrast.map((c, i) => ({
              label: `${svc.botName} · ${category.highlights[i]?.title ?? svc.name}`,
              title: category.highlights[i]?.title ?? svc.name,
              today: c.today,
              after: c.after,
            }))}
          />
        )}

        {/* ── Big-number stat split (wireframe #2's core block). ── */}
        <StatSplit
          eyebrow="The complete system"
          heading={<>{svc.name}, run for you — <span className="em-green">end to end.</span></>}
          body={`${category?.outcome ?? svc.hook} ${svc.botName} runs the whole loop — built, monitored and tuned continuously, inside the accounts you already own. You stay the owner of every account and every result.`}
          stats={[
            { value: `${svc.implementationWeeks}w`, label: "To your first system live, in monitored mode" },
            { value: "24/7", label: "Coverage — nights, weekends and holidays" },
            ...svc.baseline.slice(0, 2).map((b) => ({ value: b.value, label: b.metric })),
          ]}
          source={`local-hub-${svc.slug}-statsplit`}
          note="No per-seat pricing. No percentage of ad spend. No lock-in."
        />

        {/* ── Checklist feature cards. ── */}
        {category && (
          <FeatureTriad
            eyebrow={`What ${svc.botName} runs`}
            heading={<>Everything under the hood, <span className="em-green">handled.</span></>}
            sub={`The work an agency does monthly and a bot does continuously — the full list lives on the ${category.botName} page.`}
            items={category.highlights.slice(0, 3).map((h, i) => ({
              index: `0${i + 1}`,
              title: h.title,
              body: h.body,
              bullets: category.capabilities.slice(i * 3, i * 3 + 3),
              href: `/${category.pillar}/${category.slug}`,
              linkLabel: "See the full scope",
            }))}
          />
        )}

        {/* ── Markets: region columns, focused metros first. ── */}
        <Section
          variant="light"
          eyebrow="Markets"
          heading={`${svc.name}, anywhere in the country.`}
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
                          href={enriched ? `/local/${svc.slug}/${st.slug}` : `/markets/${st.slug}`}
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

        {/* ── Objections ── */}
        {faqs.length > 0 && (
          <Section variant="alt" eyebrow="Questions" heading={`${svc.name}, specifically.`}>
            <div className="max-w-[760px]"><FaqAccordion items={faqs} /></div>
          </Section>
        )}

        {/* ── Centered dark closer, then the form. ── */}
        <JoinBand
          heading={<>Put {svc.botName} to work in <span className="em-green">your market.</span></>}
          sub={`One conversation, one free plan — and ${svc.name.toLowerCase()} stops being the thing nobody has time for.`}
          source={`local-hub-${svc.slug}-joinband`}
        />

        <Section
          variant="light"
          eyebrow="Start here"
          heading={`Get the ${svc.name.toLowerCase()} plan for your market.`}
          sub="Tell us what you sell and where you are. The plan comes back mapped to your market — free, one business day."
        >
          <div className="max-w-[640px]">
            <BotPlanForm source={`local-hub-${svc.slug}-form`} defaultFocus={category?.name} />
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
