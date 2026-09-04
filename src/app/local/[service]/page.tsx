import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, Section } from "@/components/ui";
import { PlanCta } from "@/components/marketing";
import { LOCAL_SERVICES, STATES, citiesInState, getService } from "@/lib/geo/data";
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
    description: `${svc.intro.slice(0, 150)}…`,
    alternates: { canonical: `/local/${service}` },
  };
}

export default async function ServiceHub({ params }: Params) {
  const { service } = await params;
  const svc = getService(service);
  if (!svc) notFound();
  const category = getCategory(svc.catalogPillar as PillarSlug, svc.catalogSlug);

  return (
    <>
      <Header />
      <main>
        <section className="border-b border-[var(--border)]">
          <Container className="py-16">
            <p className="eyebrow mb-5">{svc.name} <span className="eyebrow-dim">· by market</span></p>
            <h1 className="display-hero max-w-[20ch] text-balance">
              {svc.name}, deployed where your customers are.
            </h1>
            <p className="body-lg mt-6 max-w-[54ch]">{svc.intro}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <PlanCta source={`local-hub-${svc.slug}`} />
              {category && (
                <Link href={`/${category.pillar}/${category.slug}`} className="btn btn-outline">
                  The full {category.botName} page
                </Link>
              )}
            </div>
          </Container>
        </section>

        <Section variant="alt" eyebrow="Tier-0 markets" heading="Where we deploy today."
          sub="A deliberately short list — each market page carries a real local read, not a swapped city name. More metros open as these prove out.">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {STATES.map((st) => (
              <div key={st.slug}>
                <Link href={`/local/${svc.slug}/${st.slug}`} className="display-md hover:text-[var(--accent-text)] transition-colors">
                  {st.name}
                </Link>
                <ul className="mt-3 space-y-2 border-t border-[var(--border)] pt-3">
                  {citiesInState(st.slug).map((c) => (
                    <li key={c.slug}>
                      <Link href={`/local/${svc.slug}/${st.slug}/${c.slug}`}
                        className="group flex items-center justify-between text-[14px] text-[var(--text-body)] hover:text-[var(--accent-text)] transition-colors">
                        {c.name}
                        <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
