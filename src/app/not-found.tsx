import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, ButtonLink } from "@/components/ui";
import { CATALOG, categoryHref } from "@/lib/catalog";

export default function NotFound() {
  return (
    <>
      <Header />
      <main>
        <Container className="py-24 sm:py-32">
          <p className="eyebrow mb-5">Page not found</p>
          <h1 className="display-hero max-w-[16ch] text-balance">
            That page <span className="em-green">does not exist.</span>
          </h1>
          <p className="body-lg mt-6 max-w-[46ch]">
            The link may be old, or we may have moved it. A bot has already logged the
            miss, filed it under <span className="mono text-[0.9em]">routing.debt</span>,
            and will not bring it up again.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <ButtonLink href="/">
              Back to home
              <ArrowRight className="w-4 h-4" />
            </ButtonLink>
            <ButtonLink href="/plan" variant="outline">
              Get your bot plan
            </ButtonLink>
          </div>

          <div className="mt-16 grid sm:grid-cols-2 gap-10">
            {CATALOG.map((pillar) => (
              <div key={pillar.slug}>
                <Link href={`/${pillar.slug}`} className="eyebrow hover:opacity-70 transition-opacity">
                  {pillar.name}
                </Link>
                <ul className="mt-4 space-y-2">
                  {pillar.categories.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={categoryHref(c)}
                        className="text-[14px] text-[var(--text-secondary)] hover:text-[var(--accent-text)] transition-colors"
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
