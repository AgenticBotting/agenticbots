import type { Metric } from "@/lib/catalog";
import { Container, BotPattern } from "@/components/ui";

/**
 * The dark contrast band. Black ground, bot pattern at low opacity,
 * green reserved for the numbers — the moment something is active.
 */
export function StatBand({
  eyebrow,
  title,
  metrics,
}: {
  eyebrow?: string;
  title: string;
  metrics: Metric[];
}) {
  return (
    <section className="relative overflow-hidden bg-ink-900 on-dark">
      <div className="h-px rule-agent opacity-60" />
      <BotPattern className="absolute inset-0 opacity-[0.85]" position="right" />

      <Container className="section-pad-sm relative">
        <div className="max-w-[52ch]">
          {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
          <h2 className="display-xl text-balance">{title}</h2>
        </div>

        <dl className="mt-11 grid gap-px sm:grid-cols-3 rounded-[var(--radius)] border border-ink-700  overflow-hidden bg-ink-700">
          {metrics.map((m) => (
            <div key={m.label} className="bg-ink-800 px-6 py-7">
              <dt className="text-[1.875rem] font-semibold tracking-[-0.035em] leading-none tabular-nums text-signal-500">
                {m.value}
              </dt>
              <dd className="mt-3 text-[13.5px] leading-snug text-ink-300">{m.label}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
