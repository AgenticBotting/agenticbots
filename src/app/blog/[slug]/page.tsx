import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container } from "@/components/ui";
import { BlogOptin } from "@/components/marketing";
import { POSTS, getPost, SORTED_POSTS, type Block } from "@/lib/posts";

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

/** Renders the body, splicing the optin in after the third block. */
function Article({ body, slug }: { body: Block[]; slug: string }) {
  const cut = Math.min(4, body.length);
  const head = body.slice(0, cut);
  const tail = body.slice(cut);

  return (
    <>
      <Blocks body={head} />
      {tail.length > 0 && (
        <div className="my-14">
          <BlogOptin source={`blog-mid-${slug}`} />
        </div>
      )}
      <Blocks body={tail} />
    </>
  );
}

function Blocks({ body }: { body: Block[] }) {
  return (
    <>
      {body.map((b, i) => {
        if (b.type === "h2")
          return <h2 key={i} className="display-lg mt-14 mb-4">{b.text}</h2>;
        if (b.type === "ul")
          return (
            <ul key={i} className="my-7 space-y-3">
              {b.items.map((it) => (
                <li key={it} className="flex gap-4 body-lg">
                  <span className="mt-3 h-1 w-4 shrink-0 bg-ink-950" />
                  {it}
                </li>
              ))}
            </ul>
          );
        if (b.type === "quote")
          return (
            <blockquote
              key={i}
              className="my-12 border-l-2 border-ink-950 pl-7 display-lg !font-bold text-balance"
            >
              {b.text}
            </blockquote>
          );
        return <p key={i} className="body-lg my-6">{b.text}</p>;
      })}
    </>
  );
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const more = SORTED_POSTS.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <>
      <Header />
      <main>
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
              <h1 className="display-hero text-balance">
                {post.title}
              </h1>
              <p className="body-lg mt-6 text-pretty">{post.excerpt}</p>
            </div>
          </Container>
        </section>

        {/* Centered reading column */}
        <section className="section-pad-sm border-b border-[var(--border)]">
          <Container>
            <article className="mx-auto max-w-[68ch]">
              <Article body={post.body} slug={post.slug} />
            </article>
          </Container>
        </section>

        {/* Centered lead gen */}
        <section className="section-pad-sm">
          <Container>
            <BlogOptin source={`blog-end-${post.slug}`} className="mx-auto max-w-[820px]" />
          </Container>
        </section>

        {/* Keep reading */}
        {more.length > 0 && (
          <section className="section-pad-sm border-t border-[var(--border)]">
            <Container>
              <p className="eyebrow text-center mb-9">Keep reading</p>
              <div className="mx-auto max-w-[820px] grid sm:grid-cols-2 gap-px bg-[var(--border)] border border-[var(--border)]">
                {more.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="group bg-white p-7 flex flex-col hover:bg-[var(--bg-alt)] transition-colors"
                  >
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
