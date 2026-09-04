import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, Section } from "@/components/ui";
import { PlanCta } from "@/components/marketing";
import { LOCAL_SERVICES, STATES, citiesInState, getService, getState, fmt } from "@/lib/geo/data";

type Params = { params: Promise<{ service: string; state: string }> };

export function generateStaticParams() {
  return LOCAL_SERVICES.flatMap((s) => STATES.map((st) => ({ service: s.slug, state: st.slug })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { service, state } = await params;
  const svc = getService(service); const st = getState(state);
  if (!svc || !st) return {};
  return {
    title: `${svc.name} in ${st.name}`,
    description: `${svc.name} for ${st.name} businesses — market-tuned agent systems in ${citiesInState(state).slice(0, 3).map((c) => c.name).join(", ")}${citiesInState(state).length > 3 ? ` and ${citiesInState(state).length - 3} more metros` : ""}.`,
    alternates: { canonical: `/local/${service}/${state}` },
  };
}

export default async function StateHub({ params }: Params) {
  const { service, state } = await params;
  const svc = getService(service); const st = getState(state);
  if (!svc || !st) notFound();
  const cities = citiesInState(state);
  const totalBiz = cities.reduce((s, c) => s + c.businessCount, 0);

  return (
    <>
      <Header />
      <main>
        <section className="border-b border-[var(--border)]">
          <Container className="py-16">
            <nav className="mb-8 flex items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
              <Link href="/" className="hover:text-[var(--foreground)]">Home</Link><span>/</span>
              <Link href={`/local/${svc.slug}`} className="hover:text-[var(--foreground)]">{svc.name}</Link><span>/</span>
              <span className="text-[var(--text-body)]">{st.name}</span>
            </nav>
            <p className="eyebrow mb-5">{svc.name} <span className="eyebrow-dim">· {st.name}</span></p>
            <h1 className="display-hero max-w-[20ch] text-balance">
              {svc.name} across {st.name}.
            </h1>
            <p className="body-lg mt-6 max-w-[54ch]">
              {cities.length} {st.name} metro{cities.length > 1 ? "s" : ""}, roughly {fmt.format(totalBiz)} businesses
              between them — each market page below carries its own local read, CPC band and industry mix, because
              the same playbook priced for {cities[0].name} would be wrong in {cities[cities.length - 1].name}.
            </p>
            <div className="mt-8"><PlanCta source={`local-state-${svc.slug}-${st.slug}`} /></div>
          </Container>
        </section>

        <Section variant="alt" eyebrow="Markets" heading={`${st.name} metros we deploy in.`}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)]">
            {cities.map((c) => (
              <Link key={c.slug} href={`/local/${svc.slug}/${st.slug}/${c.slug}`} className="group card-cell p-7">
                <p className="display-md group-hover:text-[var(--accent-text)] transition-colors">{c.name}</p>
                <p className="body-xs mt-2">
                  ~{fmt.format(c.businessCount)} businesses · {c.industries[0]} · competition {c.competition}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--accent-text)]">
                  {svc.name} in {c.name}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
