import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { BlogOptin, BlogArchive, PostOptin } from "@/components/marketing";
import { SORTED_POSTS } from "@/lib/posts";
import { Header, Footer } from "@/components/layout";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Research and operating notes on governed BOTS across demand, revenue and customer operations.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  return (
    <>
      <Header />
      <main>
        {/* Centered masthead */}
        <section className="border-b border-[var(--border)]">
          <Container className="py-10 sm:py-14">
            <div className="mx-auto max-w-[52ch] text-center">
              <p className="eyebrow mb-4">Writing</p>
              <h1 className="display-hero text-balance">
                Operating notes for <span className="em-green">serious BOT programs.</span>
              </h1>
              <p className="body-base mt-4 text-pretty">
                Clear analysis of mandates, control models, workflow design and the operating decisions required for production BOTS.
              </p>
              {/* The conversion surface the index was missing — every other
                  page on the site asks for something; this one just had
                  reading. Same PostOptin bar the post pages already use,
                  one email field, posts to the same lead endpoint as
                  everything else. */}
              <PostOptin source="blog-index-hero" variant="bar" className="mt-6" />
            </div>
          </Container>
        </section>

        {/* Filters, lead article and grid — all client-side, all in one
            component because the lead treatment and the grid share the
            same filtered list. See BlogArchive.tsx for why this is
            SSR-safe (full unfiltered archive renders first, filtering is
            a pure client narrowing on top). */}
        <BlogArchive posts={SORTED_POSTS} />

        {/* Centered lead gen — the fuller ask, kept as-is */}
        <section className="section-pad">
          <Container>
            <BlogOptin source="blog-index" className="mx-auto max-w-[820px]" />
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
