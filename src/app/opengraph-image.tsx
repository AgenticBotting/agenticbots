import { ImageResponse } from "next/og";

export const alt = "AgenticBots — Agentic bots get you customers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BOT = (
  <svg width="150" height="48" viewBox="0 0 100 32.13" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M18.4 0H83.94a16.07 16.07 0 0 1 0 32.13H0Z M27.03 10.64h14.16a5.51 5.51 0 0 1 0 11.02H27.03a5.51 5.51 0 0 1 0-11.02Z M66.21 10.64h14.5a5.51 5.51 0 0 1 0 11.02h-14.5a5.51 5.51 0 0 1 0-11.02Z"
      fill="#7FA200"
    />
  </svg>
);

export default function OgImage() {
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
        {BOT}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 72, fontWeight: 600, color: "#FFFFFF", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
            Agentic bots get you customers.
          </div>
          <div style={{ fontSize: 28, color: "#BEC4BE", marginTop: 24 }}>
            Marketing and sales, run by bots — agenticbots.dev
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: "#97BD27" }} />
          <div style={{ fontSize: 22, color: "#8C928C", letterSpacing: "0.08em" }}>13 BOTS · MARKETING + SALES</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
