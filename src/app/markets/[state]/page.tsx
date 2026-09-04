import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, Section } from "@/components/ui";
import { PlanCta } from "@/components/marketing";
import { JsonLd, breadcrumbLd } from "@/components/JsonLd";
import { STATES, LOCAL_SERVICES, citiesInState, getState, fmt } from "@/lib/geo/data";

type Params = { params: Promise<{ state: string }> };

export function generateStaticParams() {
  return STATES.map((st) => ({ state: st.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { state } = await params;
  const st = getState(state);
  if (!st) return {};
  const cities = citiesInState(state);
  return {
    title: `${st.name} markets`,
    description: `Agent systems for ${st.name} businesses — ${cities.slice(0, 3).map((c) => c.name).join(", ")}${cities.length > 3 ? ` and ${cities.length - 3} more` : ""}: market snapshots, local reads, all four services.`,
    alternates: { canonical: `/markets/${state}` },
  };
}

export default async function StateMarketPage({ params }: Params) {
  const { state } = await params;
  const st = getState(state);
  if (!st) notFound();
  const cities = citiesInState(state);
  const totalBiz = cities.reduce((s, c) => s + c.businessCount, 0);

  return (
    <>
      <JsonLd data={breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Markets", path: "/markets" },
        { name: st.name, path: `/markets/${st.slug}` },
      ])} />
      <Header />
      <main>
        <section className="border-b border-[var(--border)]">
          <Container className="py-16">
            <nav className="mb-8 flex items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
              <Link href="/" className="hover:text-[var(--foreground)]">Home</Link><span>/</span>
              <Link href="/markets" className="hover:text-[var(--foreground)]">Markets</Link><span>/</span>
              <span className="text-[var(--text-body)]">{st.name}</span>
            </nav>
            <p className="eyebrow mb-5">{st.name} <span className="eyebrow-dim">· {cities.length} metro{cities.length > 1 ? "s" : ""}</span></p>
            <h1 className="display-hero max-w-[20ch] text-balance">
              Agent systems for {st.name} businesses.
            </h1>
            <p className="body-lg mt-6 max-w-[54ch]">
              Roughly {fmt.format(totalBiz)} businesses across {cities.map((c) => c.name).join(", ")} — and
              each metro buys differently. Every market page below carries its own read.
            </p>
            <div className="mt-8"><PlanCta source={`markets-${st.slug}`} /></div>
          </Container>
        </section>

        <Section variant="alt" eyebrow="Metros" heading={`Where we deploy in ${st.name}.`}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)]">
            {cities.map((c) => (
              <Link key={c.slug} href={`/markets/${st.slug}/${c.slug}`} className="group card-cell p-7">
                <p className="display-md group-hover:text-[var(--accent-text)] transition-colors">{c.name}</p>
                <p className="body-sm mt-2.5">{c.character}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--accent-text)]">
                  The {c.name} market
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </Section>

        <Section variant="light" size="sm" eyebrow="Services" heading={`Every service, every ${st.name} metro.`}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--border)] border border-[var(--border)]">
            {LOCAL_SERVICES.map((s) => (
              <Link key={s.slug} href={`/local/${s.slug}/${st.slug}`} className="group card-cell p-6">
                <span className="display-md group-hover:text-[var(--accent-text)] transition-colors">{s.name}</span>
                <span className="block body-xs mt-2">{s.botName} in {st.name}</span>
              </Link>
            ))}
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
