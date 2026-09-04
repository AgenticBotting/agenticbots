import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, BotFace } from "@/components/ui";
import { BlogOptin, ReadingProgress, PostToc } from "@/components/marketing";
import { POSTS, getPost, postHeadings, SORTED_POSTS, type Block } from "@/lib/posts";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.excerpt, publishedTime: post.date },
  };
}

const slugify = (t: string) =>
  t.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");

const CALLOUT_LABEL = { note: "Note", warning: "Warning", insight: "Insight", result: "Result" };

function Blocks({ body }: { body: Block[] }) {
  return (
    <>
      {body.map((b, i) => {
        switch (b.type) {
          case "h2":
            return (
              <h2 key={i} id={slugify(b.text)} className="scroll-mt-28">
                {b.text}
              </h2>
            );
          case "ul":
            return (
              <ul key={i}>
                {b.items.map((it) => (
                  <li key={it} className="flex gap-4">
                    <span className="mt-[0.85em] h-[2px] w-4 shrink-0 bg-ink-950" />
                    {it}
                  </li>
                ))}
              </ul>
            );
          case "quote":
            return (
              <blockquote key={i} className="callout callout-insight">
                <span className="callout-label">Insight</span>
                <p className="!mt-0 text-[1.09em] font-medium leading-[1.55] text-balance">{b.text}</p>
              </blockquote>
            );
          case "callout":
            return (
              <aside key={i} className={`callout callout-${b.variant}`}>
                <span className="callout-label">{b.title ?? CALLOUT_LABEL[b.variant]}</span>
                <p className="!mt-0">{b.text}</p>
              </aside>
            );
          case "stat":
            /* Full-bleed escape — visual matter breaks the 68ch column. */
            return (
              <figure key={i} className="prose-wide">
                <div className="border-y border-[var(--border)] bg-white py-8 px-6 sm:px-10 flex flex-wrap items-baseline gap-x-8 gap-y-2">
                  <span className="text-[2.5rem] font-semibold tracking-[-0.035em] tabular-nums">{b.value}</span>
                  <span className="body-base !text-[var(--text-body)]">{b.label}</span>
                  {b.detail && <span className="body-sm w-full">{b.detail}</span>}
                </div>
              </figure>
            );
          default:
            return <p key={i}>{b.text}</p>;
        }
      })}
    </>
  );
}

function AuthorCard() {
  return (
    <div className="mt-14 pt-8 border-t border-[var(--border)] flex items-center gap-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-ink-950 notch">
        <BotFace className="w-7 h-6 text-accent-500" />
      </span>
      <div>
        <p className="text-[14.5px] font-semibold tracking-[-0.01em]">The AgenticBots team</p>
        <p className="body-sm">
          We build and run the bots. The writing is from what production actually taught us.
        </p>
      </div>
    </div>
  );
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const headings = postHeadings(post);
  const more = SORTED_POSTS.filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <>
      <ReadingProgress />
      <Header />
      <main className="prose-surface">
        {/* Centered masthead */}
        <section className="border-b border-[var(--border)]">
          <Container className="py-14 sm:py-16">
            <div className="mx-auto max-w-[62ch] text-center">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 mb-8 text-[13px] font-semibold text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                All writing
              </Link>
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="chip">{post.category}</span>
                <span className="body-xs">
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  })}{" "}
                  · {post.readMinutes} min read
                </span>
              </div>
              <h1 className="display-hero text-balance">{post.title}</h1>
              <p className="body-lg mt-6 text-pretty">{post.excerpt}</p>
            </div>
          </Container>
        </section>

        {/* TOC rail + centered reading column. Zero sidebars of any other kind. */}
        <section className="section-pad-sm border-b border-[var(--border)]">
          <Container>
            <div className="lg:grid lg:grid-cols-[180px_minmax(0,1fr)_180px] lg:gap-10">
              <PostToc items={headings} />
              <article className="prose-blog mx-auto">
                <Blocks body={post.body} />
                <AuthorCard />
              </article>
              <div aria-hidden="true" />
            </div>
          </Container>
        </section>

        {/* End-of-post CTA — the only conversion surface on the page. */}
        <section className="section-pad-sm">
          <Container>
            <BlogOptin source={`blog-end-${post.slug}`} className="mx-auto max-w-[820px]" />
          </Container>
        </section>

        {/* Related, below the fold */}
        {more.length > 0 && (
          <section className="section-pad-sm border-t border-[var(--border)]">
            <Container>
              <p className="eyebrow text-center mb-9">Keep reading</p>
              <div className="mx-auto max-w-[980px] grid sm:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)]">
                {more.map((p) => (
                  <Link key={p.slug} href={`/blog/${p.slug}`} className="group card-cell p-7 flex flex-col">
                    <span className="body-xs">{p.category}</span>
                    <span className="display-md mt-3 flex-1 group-hover:text-[var(--accent-text)] transition-colors">
                      {p.title}
                    </span>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--accent-text)]">
                      Read
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                ))}
              </div>
            </Container>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
