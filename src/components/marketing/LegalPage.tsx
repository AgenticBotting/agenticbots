import { Header, Footer } from "@/components/layout";
import { Container } from "@/components/ui";

export interface LegalSection { h: string; p: string[] }

export function LegalPage({
  title, updated, intro, sections,
}: { title: string; updated: string; intro: string; sections: LegalSection[] }) {
  return (
    <>
      <Header />
      <main>
        <section className="border-b border-[var(--border)]">
          <Container className="py-14 sm:py-16">
            <p className="eyebrow mb-5">Legal</p>
            <h1 className="display-hero text-balance">{title}</h1>
            <p className="body-sm mt-5">Last updated {updated}</p>
            <p className="body-lg mt-6 max-w-[62ch] text-pretty">{intro}</p>
          </Container>
        </section>

        <section className="section-pad">
          <Container>
            <div className="max-w-[68ch]">
              {sections.map((s) => (
                <div key={s.h} className="mb-11">
                  <h2 className="display-lg mb-4">{s.h}</h2>
                  {s.p.map((para, i) => (
                    <p key={i} className="body-base mb-4">{para}</p>
                  ))}
                </div>
              ))}
              <p className="body-sm pt-8 border-t border-[var(--border)]">
                Questions about this policy? Email{" "}
                <a href="mailto:hello@agenticbots.dev" className="text-[var(--accent-text)] underline underline-offset-2">
                  hello@agenticbots.dev
                </a>.
              </p>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
