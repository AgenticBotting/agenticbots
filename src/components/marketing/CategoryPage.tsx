import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, Reveal, SectionHeader, BotIndex, BrandMark } from "@/components/ui";
import { BotPlanForm } from "./BotPlanForm";
import { PlanCta } from "./PlanCta";
import { StatBand } from "./StatBand";
import { FaqAccordion } from "./FaqAccordion";
import { CategoryVignette } from "./CategoryVignette";
import { BotFactory } from "./BotFactory";
import { BotOrbit } from "./BotOrbit";
import { ProofBar } from "./ProofBar";
import { TaskConveyor } from "./Conveyor";
import { LeadMagnet } from "./LeadMagnet";
import { getPillar, categoryHref, type Category } from "@/lib/catalog";
import { renderHeadline } from "@/lib/headline";
import { JsonLd, serviceLd, breadcrumbLd, faqLd } from "@/components/JsonLd";

const STACK = [
  ["CRM", "HubSpot · Salesforce · Pipedrive · Close · GoHighLevel"],
  ["Calendar", "Google · Outlook · Calendly"],
  ["Phone + SMS", "Twilio · RingCentral · OpenPhone · your VoIP"],
  ["Ad accounts", "Google · Meta · LinkedIn · TikTok"],
  ["Email", "MailerLite · Klaviyo · HubSpot · ActiveCampaign"],
  ["Analytics", "GA4 · Looker · your warehouse"],
];

export function CategoryPage({ category }: { category: Category }) {
  const pillar = getPillar(category.pillar)!;
  const siblings = pillar.categories.filter((c) => c.slug !== category.slug).slice(0, 3);

  return (
    <>
      <JsonLd data={[
        serviceLd({ name: `${category.name} (${category.botName})`, description: category.blurb, path: `/${category.pillar}/${category.slug}` }),
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: pillar.name, path: `/${pillar.slug}` },
          { name: category.name, path: `/${category.pillar}/${category.slug}` },
        ]),
        faqLd(category.faqs),
      ]} />
      <Header />
      <main>
        {/* ── Hero: numeral, name, outcome ── */}
        <section className="border-b border-[var(--border)]">
          <Container className="pt-12 pb-16 sm:pt-14 sm:pb-20">
            <nav className="mb-10 flex items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
              <Link href="/" className="hover:text-[var(--foreground)] transition-colors">Home</Link>
              <span>/</span>
              <Link href={`/${pillar.slug}`} className="hover:text-[var(--foreground)] transition-colors">
                {pillar.name}
              </Link>
              <span>/</span>
              <span className="text-[var(--text-body)]">{category.name}</span>
            </nav>

            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-start">
              <Reveal>
                <div className="flex items-center gap-4 mb-7">
                  <BotIndex index={category.index} size="lg" />
                  <div>
                    <p className="display-lg leading-none">{category.botName}</p>
                    <p className="body-sm mt-1.5">{category.name}</p>
                  </div>
                </div>

                <h1 className="display-hero max-w-[20ch] text-balance">
                  {renderHeadline(category.headline)}
                </h1>
                <p className="body-lg mt-6 max-w-[52ch] text-pretty">{category.intro}</p>

                <div className="mt-9 flex flex-wrap items-center gap-4">
                  <BotOrbit>
                    <PlanCta source={`${category.pillar}-${category.slug}-hero`} />
                  </BotOrbit>
                  <a
                    href="#included"
                    className="text-[15px] font-semibold tracking-[-0.01em] border-b-2 border-[var(--border-strong)] pb-0.5 hover:border-ink-950 transition-colors"
                  >
                    See everything included
                  </a>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                {/* The same line the homepage runs, staffed with this bot's
                    own four jobs — the page's unique twist on a familiar
                    scene rather than a different scene entirely. */}
                <BotFactory
                  stations={category.stations}
                  title={`${category.botName}, going to work`}
                />
                <div className="border-t-2 border-ink-950 pt-7 mt-8">
                  <p className="eyebrow">What you get</p>
                  <p className="display-lg mt-4 text-balance">{category.outcome}</p>
                  <dl className="mt-9 space-y-0">
                    {category.metrics.map((m) => (
                      <div
                        key={m.label}
                        className="flex items-baseline gap-5 py-4 border-t border-[var(--border)]"
                      >
                        <dt className="w-[92px] shrink-0 display-md">{m.value}</dt>
                        <dd className="body-sm">{m.label}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        <ProofBar />

        {/* ── The work itself, on a belt ── */}
        <section className="section-pad-sm bg-[var(--bg-alt)] border-b border-[var(--border)]">
          <Container>
            <SectionHeader
              eyebrow={`${category.botName} · what it runs`}
              title="Every one of these, continuously."
            />
            <div className="mt-10 -mx-5 sm:-mx-8">
              <TaskConveyor tasks={category.capabilities} />
            </div>
          </Container>
        </section>

        {/* ── Before / after: the persuasive block ── */}
        <section className="relative overflow-hidden section-pad bg-[var(--bg-alt)] border-b border-[var(--border)]">
          <BrandMark className="-right-28 top-8" size={540} />
          <Container className="relative">
            <Reveal>
              <SectionHeader
                eyebrow="What changes"
                title={<>Same business. <span className="em-green">Different week.</span></>}
              />
            </Reveal>

            <div className="mt-14 border-t border-[var(--border-strong)]">
              {category.contrast.map((c, i) => (
                <Reveal key={c.today} delay={i * 0.06}>
                  <div className="grid md:grid-cols-[auto_1fr_1fr] gap-6 md:gap-12 py-9 border-b border-[var(--border)]">
                    <span className="display-md text-[var(--text-muted)] md:w-10">
                      0{i + 1}
                    </span>
                    <div>
                      <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)] mb-3">
                        Today
                      </p>
                      <p className="body-base">{c.today}</p>
                    </div>
                    <div className="md:pl-10 md:border-l-2 md:border-ink-950">
                      <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-[var(--accent-text)] mb-3">
                        With {category.botName}
                      </p>
                      <p className="body-base !text-[var(--foreground)] font-medium">{c.after}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        {/* ── How it differs ── */}
        <section className="section-pad border-b border-[var(--border)]">
          <Container>
            <div className="grid lg:grid-cols-[0.72fr_1.28fr] gap-12 lg:gap-20 items-start">
              <Reveal>
                <div className="lg:sticky lg:top-32">
                  <SectionHeader
                    eyebrow="How it works"
                    title={`What ${category.botName} does differently.`}
                  />
                  <div className="mt-10 border border-[var(--border)] bg-[var(--bg-alt)] px-5 pt-6 pb-4">
                    <CategoryVignette slug={category.slug} />
                  </div>
                </div>
              </Reveal>
              <Reveal delay={0.08}>
                <div className="border-t border-[var(--border-strong)]">
                  {category.highlights.map((h, i) => (
                    <div key={h.title} className="grid grid-cols-[auto_1fr] gap-6 py-8 border-b border-[var(--border)]">
                      <span className="display-md text-[var(--text-muted)] w-8">0{i + 1}</span>
                      <div>
                        <h3 className="display-lg">{h.title}</h3>
                        <p className="body-base mt-3 max-w-[58ch]">{h.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* ── Full scope ── */}
        <section id="included" className="section-pad bg-[var(--bg-alt)] border-b border-[var(--border)]">
          <Container>
            <Reveal>
              <SectionHeader
                eyebrow={`${category.capabilities.length} capabilities`}
                title="Everything this bot covers."
                copy="Not billed per line item. This is the scope of the bot."
              />
            </Reveal>
            <Reveal delay={0.08}>
              <ol className="mt-14 grid sm:grid-cols-2 gap-x-14 border-t border-[var(--border-strong)]">
                {category.capabilities.map((item, i) => (
                  <li
                    key={item}
                    className="flex items-baseline gap-5 py-4 border-b border-[var(--border)]"
                  >
                    <span className="text-[12px] font-semibold tabular-nums text-[var(--text-muted)] w-6 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[15px] leading-snug text-[var(--text-body)]">{item}</span>
                  </li>
                ))}
              </ol>
            </Reveal>
          </Container>
        </section>

        {/* ── Stack ── */}
        <section className="section-pad border-b border-[var(--border)]">
          <Container>
            <div className="grid lg:grid-cols-[0.72fr_1.28fr] gap-12 lg:gap-20 items-start">
              <Reveal>
                <SectionHeader
                  eyebrow="Integrations"
                  title="It runs inside the stack you already pay for."
                  copy="No migration, no rip-and-replace. The bot reads and writes where your business already lives."
                />
              </Reveal>
              <Reveal delay={0.08}>
                <dl className="border-t border-[var(--border-strong)]">
                  {STACK.map(([label, tools]) => (
                    <div key={label} className="grid sm:grid-cols-[160px_1fr] gap-2 sm:gap-8 py-5 border-b border-[var(--border)]">
                      <dt className="display-md">{label}</dt>
                      <dd className="body-sm sm:pt-1">{tools}</dd>
                    </div>
                  ))}
                </dl>
                <p className="body-xs mt-5">
                  Using something else? If it has an API, it connects. We confirm before anything is scoped.
                </p>
              </Reveal>
            </div>
          </Container>
        </section>

        <StatBand eyebrow={category.name} title={category.outcome} metrics={category.metrics} />

        <LeadMagnet source={`${category.pillar}-${category.slug}`} />

        {/* ── FAQ ── */}
        <section className="section-pad border-b border-[var(--border)]">
          <Container>
            <div className="grid lg:grid-cols-[0.72fr_1.28fr] gap-12 lg:gap-20">
              <Reveal>
                <SectionHeader eyebrow="Questions" title={`${category.botName}, specifically.`} />
              </Reveal>
              <Reveal delay={0.08}>
                <FaqAccordion items={category.faqs} />
              </Reveal>
            </div>
          </Container>
        </section>

        {/* ── Siblings ── */}
        <section className="section-pad-sm bg-[var(--bg-alt)] border-b border-[var(--border)]">
          <Container>
            <div className="flex items-end justify-between gap-6 mb-8">
              <p className="eyebrow">Often built alongside</p>
              <Link
                href={`/${pillar.slug}`}
                className="inline-flex items-center gap-2 text-[13.5px] font-semibold hover:text-[var(--accent-text)] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                All {pillar.name.toLowerCase()} bots
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)]">
              {siblings.map((c) => (
                <Link
                  key={c.slug}
                  href={categoryHref(c)}
                  className="group bg-white p-7 flex flex-col hover:bg-[var(--bg-alt)] transition-colors"
                >
                  <BotIndex index={c.index} size="sm" tone="outline" />
                  <h3 className="display-lg mt-5">{c.botName}</h3>
                  <p className="body-sm mt-2.5 flex-1">{c.blurb}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--accent-text)]">
                    {c.name}
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>

        {/* ── CTA ── */}
        <section className="section-pad">
          <Container>
            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-start">
              <Reveal>
                <SectionHeader
                  eyebrow="Start here"
                  title={`Want ${category.botName} running on your business?`}
                  copy="Tell us what you sell and where it is getting stuck. You get a written plan — what this bot would do for you, wired to what, and what it is worth."
                />
              </Reveal>
              <Reveal delay={0.08}>
                <BotPlanForm source={`${category.pillar}-${category.slug}`} defaultFocus={category.name} />
              </Reveal>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
