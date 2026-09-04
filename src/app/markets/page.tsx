import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, Section } from "@/components/ui";
import { PlanCta } from "@/components/marketing";
import { JsonLd, breadcrumbLd } from "@/components/JsonLd";
import { CITIES, STATES, LOCAL_SERVICES, citiesInState, fmt } from "@/lib/geo/data";

export const metadata: Metadata = {
  title: "Markets we serve",
  description:
    "Every metro where AgenticBots deploys — each with a market snapshot, local read, and all four agent services.",
  alternates: { canonical: "/markets" },
};

/** Location-first hub (the Lot Sealers /service-areas analogue). */
export default function MarketsIndex() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Markets", path: "/markets" }])} />
      <Header />
      <main>
        <section className="border-b border-[var(--border)]">
          <Container className="py-16">
            <p className="eyebrow mb-5">Markets <span className="eyebrow-dim">· {CITIES.length} metros · {STATES.length} states</span></p>
            <h1 className="display-hero max-w-[20ch] text-balance">
              Deployed where your customers are.
            </h1>
            <p className="body-lg mt-6 max-w-[54ch]">
              A deliberately short list. Every market below carries its own local read,
              CPC band and industry mix — because the same playbook priced for Miami
              would be wrong in Phoenix. More metros open as these prove out.
            </p>
            <div className="mt-8"><PlanCta source="markets-index" /></div>
          </Container>
        </section>

        <Section variant="alt" eyebrow="By state" heading="Pick your market.">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {STATES.map((st) => (
              <div key={st.slug}>
                <Link href={`/markets/${st.slug}`} className="display-md hover:text-[var(--accent-text)] transition-colors">
                  {st.name}
                </Link>
                <ul className="mt-3 space-y-2 border-t border-[var(--border)] pt-3">
                  {citiesInState(st.slug).map((c) => (
                    <li key={c.slug}>
                      <Link href={`/markets/${st.slug}/${c.slug}`}
                        className="group flex items-center justify-between text-[14px] text-[var(--text-body)] hover:text-[var(--accent-text)] transition-colors">
                        <span>{c.name} <span className="body-xs">· ~{fmt.format(c.businessCount)} businesses</span></span>
                        <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section variant="light" size="sm" eyebrow="By service" heading="Or start from the service.">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--border)] border border-[var(--border)]">
            {LOCAL_SERVICES.map((s) => (
              <Link key={s.slug} href={`/local/${s.slug}`} className="group card-cell p-6">
                <span className="display-md group-hover:text-[var(--accent-text)] transition-colors">{s.name}</span>
                <span className="block body-xs mt-2">{s.botName} · every market</span>
              </Link>
            ))}
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
