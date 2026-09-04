import type { Metadata } from "next";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { Container } from "@/components/ui";
import { CATALOG, categoryHref } from "@/lib/catalog";
import { SORTED_POSTS } from "@/lib/posts";
import { CITIES, LOCAL_SERVICES, STATES, citiesInState } from "@/lib/geo/data";

export const metadata: Metadata = {
  title: "Site map",
  description: "Every page on agenticbots.dev — services, markets, writing and company pages, in one index.",
  alternates: { canonical: "/site-map" },
};

/** HTML sitemap (Lot Sealers pattern): a crawlable, human-usable index. */
export default function SiteMapPage() {
  return (
    <>
      <Header />
      <main>
        <Container className="py-14">
          <p className="eyebrow mb-4">Site map</p>
          <h1 className="display-hero">Everything, one index.</h1>

          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-10">
            <div>
              <h2 className="display-md border-b border-[var(--border)] pb-2 mb-4">Bots</h2>
              {CATALOG.map((p) => (
                <div key={p.slug} className="mb-5">
                  <Link href={`/${p.slug}`} className="text-[14px] font-semibold hover:text-[var(--accent-text)]">{p.name}</Link>
                  <ul className="mt-2 space-y-1.5">
                    {p.categories.map((c) => (
                      <li key={c.slug}>
                        <Link href={categoryHref(c)} className="text-[13.5px] text-[var(--text-secondary)] hover:text-[var(--accent-text)]">
                          {c.botName} — {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div>
              <h2 className="display-md border-b border-[var(--border)] pb-2 mb-4">Markets</h2>
              <Link href="/markets" className="text-[14px] font-semibold hover:text-[var(--accent-text)]">All markets</Link>
              {STATES.map((st) => (
                <div key={st.slug} className="mt-4">
                  <Link href={`/markets/${st.slug}`} className="text-[13.5px] font-semibold hover:text-[var(--accent-text)]">{st.name}</Link>
                  <ul className="mt-1.5 space-y-1">
                    {citiesInState(st.slug).map((c) => (
                      <li key={c.slug}>
                        <Link href={`/markets/${st.slug}/${c.slug}`} className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--accent-text)]">
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div>
              <h2 className="display-md border-b border-[var(--border)] pb-2 mb-4">Local services</h2>
              {LOCAL_SERVICES.map((s) => (
                <div key={s.slug} className="mb-5">
                  <Link href={`/local/${s.slug}`} className="text-[14px] font-semibold hover:text-[var(--accent-text)]">{s.name}</Link>
                  <ul className="mt-2 space-y-1">
                    {CITIES.map((c) => (
                      <li key={c.slug}>
                        <Link href={`/local/${s.slug}/${c.stateSlug}/${c.slug}`} className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--accent-text)]">
                          {s.name} in {c.name}, {c.stateAbbr}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div>
              <h2 className="display-md border-b border-[var(--border)] pb-2 mb-4">Company & writing</h2>
              <ul className="space-y-1.5">
                {[["How it works", "/how-it-works"], ["Pricing", "/pricing"], ["About", "/about"], ["Contact", "/contact"], ["Get your bot plan", "/plan"], ["Blog", "/blog"]].map(([l, h]) => (
                  <li key={h}><Link href={h} className="text-[13.5px] text-[var(--text-secondary)] hover:text-[var(--accent-text)]">{l}</Link></li>
                ))}
              </ul>
              <h3 className="text-[13.5px] font-semibold mt-5 mb-2">Latest writing</h3>
              <ul className="space-y-1.5">
                {SORTED_POSTS.map((p) => (
                  <li key={p.slug}><Link href={`/blog/${p.slug}`} className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--accent-text)]">{p.title}</Link></li>
                ))}
              </ul>
              <ul className="mt-5 pt-4 border-t border-[var(--border)] space-y-1.5">
                {[["Privacy", "/privacy"], ["Terms", "/terms"]].map(([l, h]) => (
                  <li key={h}><Link href={h} className="text-[13px] text-[var(--text-muted)] hover:text-[var(--accent-text)]">{l}</Link></li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
