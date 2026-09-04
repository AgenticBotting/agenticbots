import type { Metadata } from "next";
import { Section, BotIndex, BotPattern, BrandMark, ButtonLink, Container } from "@/components/ui";
import {
  ProofBar, ProblemDiagram, SecurityBlock, StatBand, PipelineMockup,
  FaqAccordion, BotPlanForm, PlanCta,
} from "@/components/marketing";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

/**
 * /design — every section and variant on one page, for visual regression
 * (Phase 3 contract + Phase 10 deliverable). Not linked from nav; noindexed.
 */

const SWATCHES = [
  ["accent-50", "#EEFDD4"], ["accent-100", "#E0F8B1"], ["accent-200", "#C7E97D"],
  ["accent-300", "#ADD44E"], ["accent-400", "#97BD27"], ["accent-500", "#7FA200"],
  ["accent-600", "#6C8A00"], ["accent-700", "#577000"], ["accent-800", "#435700"],
  ["accent-900", "#324101"], ["accent-950", "#253103"],
];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-ink-950 on-dark px-6 py-3 mono text-[11px] uppercase tracking-[0.14em]">
      {children}
    </div>
  );
}

export default function DesignPage() {
  return (
    <main>
      <Container className="py-10">
        <p className="eyebrow">Internal</p>
        <h1 className="display-hero mt-3">Design system</h1>
        <p className="body-base mt-3 max-w-[60ch]">
          Every section, every variant, both surfaces. This page exists for visual
          regression — if something here looks wrong, it is wrong everywhere.
        </p>
      </Container>

      <Label>Accent ramp</Label>
      <Container className="py-8">
        <div className="flex flex-wrap">
          {SWATCHES.map(([n, hex]) => (
            <div key={n} className="w-24">
              <div className="h-16" style={{ background: hex }} />
              <p className="mono text-[10px] mt-1.5">{n}</p>
              <p className="mono text-[10px] text-[var(--text-muted)]">{hex}</p>
            </div>
          ))}
        </div>
      </Container>

      <Label>Type scale</Label>
      <Container className="py-8 space-y-4">
        <p className="display-hero">display-hero — Bots that get you customers.</p>
        <p className="display-xl">display-xl — Same business, different week.</p>
        <p className="display-lg">display-lg — What the bot does differently.</p>
        <p className="display-md">display-md — Card and row titles.</p>
        <p className="body-lg">body-lg — Lead paragraph text at 17px.</p>
        <p className="body-base">body-base — Standard body copy.</p>
        <p className="body-sm">body-sm — Supporting copy.</p>
        <p className="body-xs">body-xs — Metadata and captions.</p>
        <p className="eyebrow">Eyebrow label <span className="eyebrow-dim">· with dim unit</span></p>
        <p className="mono text-[12px]">mono — 41s · 6,502 · tabular figures</p>
      </Container>

      <Label>Buttons & indices</Label>
      <Container className="py-8 flex flex-wrap items-center gap-4">
        <PlanCta source="design" />
        <ButtonLink href="#" variant="secondary">Secondary</ButtonLink>
        <ButtonLink href="#" variant="outline">Outline</ButtonLink>
        <span className="chip">chip</span>
        <span className="chip chip-accent">chip-accent</span>
        <BotIndex index="01" size="sm" tone="outline" />
        <BotIndex index="07" size="md" />
        <BotIndex index="13" size="lg" />
      </Container>
      <div className="bg-ink-900 on-dark">
        <Container className="py-8 flex flex-wrap items-center gap-4">
          <ButtonLink href="#" variant="onDark">On-dark ghost</ButtonLink>
          <ButtonLink href="#" className="btn-invert">Invert</ButtonLink>
          <BotIndex index="09" size="md" tone="light" />
        </Container>
      </div>

      <Label>Section — variant: light</Label>
      <Section
        variant="light"
        eyebrow="Eyebrow"
        heading="Light section heading."
        sub="Subheading copy inside the standard measure, set with body-lg."
        cta={<PlanCta source="design-light" />}
      >
        <div className="card p-7">Content slot</div>
      </Section>

      <Label>Section — variant: alt</Label>
      <Section variant="alt" eyebrow="Eyebrow" heading="Alternate surface heading." size="sm">
        <div className="card p-7">Content slot</div>
      </Section>

      <Label>Section — variant: dark</Label>
      <Section variant="dark" eyebrow="Eyebrow" heading="Dark section heading." sub="Body copy recolors automatically via .on-dark." size="sm">
        <div className="card-dark p-7">Dark card</div>
      </Section>

      <Label>ProofBar</Label>
      <ProofBar />

      <Label>PipelineMockup</Label>
      <Container className="py-10 max-w-[720px]"><PipelineMockup /></Container>

      <Label>ProblemDiagram</Label>
      <ProblemDiagram />

      <Label>StatBand</Label>
      <StatBand
        eyebrow="Sample"
        title="A stat band with three measures."
        metrics={[
          { value: "41s", label: "Median first response" },
          { value: "24/7", label: "Coverage" },
          { value: "14d", label: "To first bot live" },
        ]}
      />

      <Label>SecurityBlock</Label>
      <SecurityBlock />

      <Label>FaqAccordion</Label>
      <Container className="py-10 max-w-[720px]">
        <FaqAccordion items={[
          { q: "A sample question?", a: "A sample answer with enough length to show the measure and rhythm of the open state." },
          { q: "A second question?", a: "Second answer." },
        ]} />
      </Container>

      <Label>BotPlanForm</Label>
      <Container className="py-10 max-w-[640px]"><BotPlanForm source="design" /></Container>

      <Label>Brand fields</Label>
      <div className="relative bg-ink-900 h-[320px] overflow-hidden">
        <BotPattern className="absolute inset-0 opacity-80" position="center" />
      </div>
      <div className="relative bg-[var(--bg-alt)] h-[260px] overflow-hidden">
        <BrandMark className="right-10 top-6" size={480} />
        <Container className="py-8"><p className="body-sm">BrandMark watermark (light surface, right-aligned)</p></Container>
      </div>
    </main>
  );
}
