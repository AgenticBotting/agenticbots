"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import type { Post } from "@/lib/posts";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/** The generated cover — same route Next wires into social share meta
 *  tags, fetchable directly as a real PNG (see opengraph-image.tsx). One
 *  template per category, not per post, so it never needs redrawing. */
function Cover({ post, className }: { post: Post; className?: string }) {
  return (
    <span className={cn("block overflow-hidden bg-[var(--bg-alt)]", className)}>
      <img
        src={`/blog/${post.slug}/opengraph-image`}
        alt=""
        loading="lazy"
        className="block h-full w-full object-cover"
      />
    </span>
  );
}

function PostCard({ post, delay }: { post: Post; delay: number }) {
  return (
    <li className="flex" style={{ animationDelay: `${delay}s` }}>
      <Link
        href={`/blog/${post.slug}`}
        className="card card-hover group flex w-full flex-col overflow-hidden"
      >
        <Cover post={post} className="aspect-[1200/630]" />
        <div className="flex flex-1 flex-col p-6">
          <span className="mb-3 flex items-center gap-3">
            <span className="chip">{post.category}</span>
            <span className="body-xs">{formatDate(post.date)} · {post.readMinutes} min</span>
          </span>
          <h3 className="display-lg text-balance group-hover:text-[var(--accent-text)] transition-colors">
            {post.title}
          </h3>
          <p className="body-sm mt-3 line-clamp-2">{post.excerpt}</p>
          <span className="mt-auto pt-5 inline-flex items-center gap-2 text-[13.5px] font-semibold text-[var(--accent-text)]">
            Read it
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </Link>
    </li>
  );
}

/**
 * The archive — filter chips + search over the full post list, plus a
 * larger lead treatment for the single most recent post when nothing is
 * filtered.
 *
 * SSR-safe by the same rule CountUp follows elsewhere on the site: the
 * server render (and the first client render, before any interaction)
 * shows every post unfiltered, so a crawler or a reader with JS disabled
 * gets the complete archive. Filtering is a pure client-side narrowing
 * layered on top, never a fetch — the full post list is already in the
 * page.
 */
export function BlogArchive({ posts }: { posts: Post[] }) {
  const categories = useMemo(() => [...new Set(posts.map((p) => p.category))], [posts]);
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = posts.filter(
    (p) =>
      (!category || p.category === category) &&
      (!q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q))
  );

  // The enlarged lead treatment only makes sense as "the newest post" —
  // once a filter narrows the list, every result is a peer, so it drops
  // to a plain grid instead of picking a new lead each time.
  const filterActive = category !== null || q.length > 0;
  const lead = filterActive ? null : (filtered[0] ?? null);
  const rest = filterActive ? filtered : filtered.slice(1);

  return (
    <>
      <div className="border-b border-[var(--border)] bg-[var(--bg-alt)]">
        <div className="container-site py-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-[340px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the writing…"
                aria-label="Search posts"
                className="field !h-10 pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCategory(null)}
                className={cn("chip transition-colors", category === null && "chip-accent")}
                aria-pressed={category === null}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(category === c ? null : c)}
                  className={cn("chip transition-colors", category === c && "chip-accent")}
                  aria-pressed={category === c}
                >
                  {c}
                </button>
              ))}
            </div>
            {(category || q) && (
              <button
                type="button"
                onClick={() => { setCategory(null); setQuery(""); }}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <section className="section-pad-sm">
          <div className="container-site text-center">
            <p className="body-lg">No posts match &ldquo;{query || category}&rdquo; yet.</p>
            <button
              type="button"
              onClick={() => { setCategory(null); setQuery(""); }}
              className="mt-4 inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--accent-text)]"
            >
              Clear filters
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      ) : (
        <>
          {lead && (
            <section className="border-b border-[var(--border)]">
              <div className="container-site py-14">
                <Link href={`/blog/${lead.slug}`} className="group grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
                  <Cover post={lead} className="aspect-[1200/630] lg:order-2" />
                  <div className="lg:order-1">
                    <span className="mb-5 flex items-center gap-3">
                      <span className="chip">{lead.category}</span>
                      <span className="body-xs">{formatDate(lead.date)} · {lead.readMinutes} min read</span>
                    </span>
                    <h2 className="display-xl text-balance group-hover:text-[var(--accent-text)] transition-colors">
                      {lead.title}
                    </h2>
                    <p className="body-lg mt-5 text-pretty">{lead.excerpt}</p>
                    <span className="mt-7 inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--accent-text)]">
                      Read it
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              </div>
            </section>
          )}

          <section className="section-pad-sm">
            <div className="container-site">
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((p, i) => (
                  <PostCard key={p.slug} post={p} delay={Math.min(i, 5) * 0.05} />
                ))}
              </ul>
            </div>
          </section>
        </>
      )}
    </>
  );
}
