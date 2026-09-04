import { ImageResponse } from "next/og";
import { getPost, POSTS } from "@/lib/posts";

export const alt = "AgenticBots article";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "space-between", background: "#FDFDFC", padding: 72,
          borderBottom: "16px solid #7FA200",
        }}
      >
        <div style={{ display: "flex", fontSize: 24, color: "#5F7A00", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {post?.category ?? "Writing"} · AgenticBots
        </div>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 600, color: "#080A08", letterSpacing: "-0.03em", lineHeight: 1.1, maxWidth: 1000 }}>
          {post?.title ?? "AgenticBots"}
        </div>
        <div style={{ fontSize: 26, color: "#626862" }}>agenticbots.dev/blog</div>
      </div>
    ),
    { ...size }
  );
}
