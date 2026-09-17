import { ImageResponse } from "next/og";
import { ALL_SERVICES, getService } from "@/lib/catalog";

/**
 * One share card per service, not the site's generic one. Same visual
 * language as the root opengraph-image.tsx (same bg, same accent, same
 * bot mark) so a shared link still reads as AgenticBots at a glance —
 * but the headline, hook and index number are this service's own.
 */
export const alt = "AgenticBots";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return ALL_SERVICES.map((s) => ({ slug: s.serviceSlug }));
}

const BOT = (
  <svg width="130" height="42" viewBox="0 0 100 32.13" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M18.4 0H83.94a16.07 16.07 0 0 1 0 32.13H0Z M27.03 10.64h14.16a5.51 5.51 0 0 1 0 11.02H27.03a5.51 5.51 0 0 1 0-11.02Z M66.21 10.64h14.5a5.51 5.51 0 0 1 0 11.02h-14.5a5.51 5.51 0 0 1 0-11.02Z"
      fill="#7FA200"
    />
  </svg>
);

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const svc = getService(slug);

  // A bad slug should never crash the image route — fall back to the
  // site's own headline rather than 500ing a social-card request.
  const headline = svc ? svc.headline : "Agentic bots get you customers.";
  const hook = svc ? svc.hook : "Marketing and sales, run by bots.";
  const kicker = svc ? `${svc.index} · ${svc.botName.toUpperCase()}` : "AGENTICBOTS";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#080A08",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {BOT}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 22,
              fontWeight: 600,
              color: "#97BD27",
              letterSpacing: "0.1em",
              fontFamily: "monospace",
            }}
          >
            {kicker}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 600,
              color: "#FFFFFF",
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              maxWidth: 980,
            }}
          >
            {headline}
          </div>
          <div style={{ fontSize: 30, fontWeight: 500, color: "#97BD27", marginTop: 20 }}>{hook}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: "#97BD27" }} />
          <div style={{ fontSize: 22, color: "#8C928C", letterSpacing: "0.08em" }}>
            AGENTICBOTS.DEV · DEPLOYED IN ANY US MARKET
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
