import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Header, Footer } from "@/components/layout";
import { Container, Section } from "@/components/ui";
import { BotPlanForm, PlanCta, StatBand, FaqAccordion, ProofBar, CategoryVignette } from "@/components/marketing";
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
        {/* ── Hero: promise left, the bot's scene right — no empty half. ── */}
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
                    <Link
                      href={`/${category.pillar}/${category.slug}`}
                      className="text-[15px] font-semibold tracking-[-0.01em] border-b-2 border-[var(--border-strong)] pb-0.5 hover:border-ink-950 transition-colors"
                    >
                      How {category.botName} works
                    </Link>
                  )}
                </div>
                <p className="body-sm mt-5">Free plan back in one business day. No call required.</p>
              </div>
              {category && (
                <div className="border border-[var(--border)] bg-[var(--bg-alt)] px-6 pt-8 pb-5">
                  <CategoryVignette slug={category.slug} />
                </div>
              )}
            </div>
          </Container>
        </section>

        <ProofBar />

        {/* ── Persuasion: the same before/after rows the category page earns. ── */}
        {category && (
          <Section
            variant="light"
            eyebrow="What changes"
            heading={<>Same business. <span className="em-green">Different week.</span></>}
          >
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
          eyebrow={`${svc.botName} cadence`}
          title={`${svc.name} that never goes quiet.`}
          metrics={svc.baseline.map((b) => ({ value: b.value, label: b.metric }))}
        />

        {/* ── Markets: region columns, focused metros first. ── */}
        <Section
          variant="alt"
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
          <Section variant="light" eyebrow="Questions" heading={`${svc.name}, specifically.`}>
            <div className="max-w-[760px]"><FaqAccordion items={faqs} /></div>
          </Section>
        )}

        {/* ── Close ── */}
        <Section
          variant="alt"
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
