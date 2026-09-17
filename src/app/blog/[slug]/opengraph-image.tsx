import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getPost, POSTS } from "@/lib/posts";

/**
 * The cover image, generated — not drawn. This is the same file Next's
 * `opengraph-image` convention wires into social share meta tags, but the
 * route it produces is a real, directly-fetchable PNG (verified: `curl
 * .../opengraph-image` returns `image/png`), so it doubles as the visible
 * cover on the blog index and the post hero. One template, every post,
 * forever — no cover art to commission or forget.
 *
 * "Templated by category, not per-post": every post in a category gets
 * the identical layout (title + category + brand mark), and the one
 * thing that varies between categories — the scattered watermark bots'
 * positions — is seeded from the category name via the same djb2 hash
 * `seo-rotation.ts` uses elsewhere, so it's stable across a whole
 * category rather than random per post. Colour never varies: the site's
 * rule is one accent ramp, and that holds here too.
 *
 * Satori (the renderer behind ImageResponse) needs literal hex values,
 * not CSS custom properties or Tailwind classes — same constraint the
 * root and per-service OG generators already work within, so the palette
 * below is hand-copied from globals.css rather than imported.
 */
export const alt = "AgenticBots article";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

function djb2(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return h >>> 0;
}

const INK_950 = "#080A08";
const TEXT_MUTED = "#626862";
const PAPER = "#FDFDFC";
const ACCENT_500 = "#7FA200";
const ACCENT_TEXT = "#5F7A00";

/** Both assets below are the real brand artwork — `Logo.tsx`'s `/logo.png`
 *  (icon + wordmark) and `LogoMask.tsx`'s `/mark.png` (the "AB" icon
 *  alone), not a bot-face glyph standing in for either. Both are
 *  white-on-transparent (so `Logo`'s dark variant can just CSS-`invert()`
 *  it), but Satori doesn't reliably support `filter`, so the inversion is
 *  baked ahead of time — `sharp(...).negate({ alpha: false })`, identical
 *  output to the runtime invert since inverting pure white RGB always
 *  yields pure black — into `logo-ink.png` / `mark-ink.png` and inlined
 *  here as data URIs so the route never depends on a network fetch.
 *  Regenerate if the source art ever changes:
 *    node -e "require('sharp')('public/logo.png').negate({alpha:false}).toFile('public/logo-ink.png')"
 *    node -e "require('sharp')('public/mark.png').negate({alpha:false}).toFile('public/mark-ink.png')" */
const LOGO_RATIO = 1970 / 263;
const LOGO_INK_DATA_URL = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public", "logo-ink.png")
).toString("base64")}`;

const MARK_RATIO = 421 / 251;
const MARK_INK_DATA_URL = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public", "mark-ink.png")
).toString("base64")}`;

const FullLogo = ({ height }: { height: number }) => (
   
  <img
    src={LOGO_INK_DATA_URL}
    width={Math.round(height * LOGO_RATIO)}
    height={height}
    alt=""
    style={{ display: "flex" }}
  />
);

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  const category = post?.category ?? "Writing";
  const title = post?.title ?? "AgenticBots";

  // Deterministic per-category scatter: same category → same three
  // positions, every time, so a category reads as one visual family
  // across however many posts land in it.
  // Three fixed anchors — clear of the title (roughly y=220-400), the
  // top row (runs to about y=104), and the footer row and its accent
  // bar (x>1040) — with the hash only jittering *around* each anchor,
  // never picking the anchor itself. Two categories' worth of marks
  // landing in the same shared range used to be able to collide
  // outright: djb2("Fundamentals:0") and djb2("Fundamentals:2") came
  // out close enough in both x and y that both marks rendered on top
  // of one another as a single garbled blob. Fixed, non-overlapping
  // anchors per index make that class of collision impossible — the
  // 160px gap between the two low anchors exceeds the largest two
  // marks' combined half-widths with room to spare.
  const ANCHORS = [
    { x: 800, y: 450 }, // low-left
    { x: 900, y: 195 }, // high
    { x: 960, y: 450 }, // low-right
  ];
  const scatter = [0, 1, 2].map((i) => {
    const h = djb2(`${category}:${i}`);
    const a = ANCHORS[i];
    return {
      x: a.x + (h % 41) - 20, // ±20 jitter
      y: a.y + (h % 21) - 10, // ±10 jitter
      rot: (h % 30) - 15,
      size: 64 + (h % 34), // 64-98
    };
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          padding: 72,
          overflow: "hidden",
        }}
      >
        {/* The ambient fleet — faint, category-seeded, purely textural.
            Never competes with the title for attention. */}
        {scatter.map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: s.x,
              top: s.y,
              display: "flex",
              transform: `rotate(${s.rot}deg)`,
              opacity: 0.11,
            }}
          >
            { }
            <img src={MARK_INK_DATA_URL} width={s.size} height={Math.round(s.size / MARK_RATIO)} alt="" />
          </div>
        ))}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <FullLogo height={32} />
          <div
            style={{
              display: "flex",
              fontSize: 20,
              fontWeight: 600,
              color: ACCENT_TEXT,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {category}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: title.length > 60 ? 56 : 64,
            fontWeight: 600,
            color: INK_950,
            letterSpacing: "-0.03em",
            lineHeight: 1.12,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 24, fontWeight: 600, color: TEXT_MUTED, letterSpacing: "0.02em" }}>
            @AgenticBots
          </div>
          <div style={{ display: "flex", width: 160, height: 8, background: ACCENT_500 }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
