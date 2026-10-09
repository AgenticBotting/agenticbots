import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";
import { commonSecurityHeaders } from "./src/lib/security-headers";
// Plain ESM, shared verbatim with scripts/topic-gate.mjs.
import { REDIRECTS } from "./src/lib/redirects.mjs";

// This machine's LAN addresses, so the dev server can be previewed on a phone
// at http://<lan-ip>:3003 with hot reload intact. Recomputed on every start,
// so a new DHCP lease doesn't need a config edit.
const lanOrigins = Object.values(networkInterfaces())
  .flat()
  .flatMap((iface) =>
    iface && iface.family === "IPv4" && !iface.internal ? [iface.address] : [],
  );

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The development badge covers the mobile portal's bottom navigation.
  // Compile and runtime errors remain visible in the development overlay.
  devIndicators: false,
  async headers() {
    return [{ source: "/:path*", headers: [...commonSecurityHeaders,
      ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
    ] }];
  },
  outputFileTracingIncludes: { "/ops/skills/*": ["./runtime/skills/**/SKILL.md"] },
  allowedDevOrigins: [...lanOrigins, "*.local"],
  async redirects() {
    return REDIRECTS;
  },
  // Authenticated product hosts. ops.agenticbots.dev serves the operator
  // console and app.agenticbots.dev the client portal, from this same
  // deployment. Set OPS_HOST / APP_HOST once the domains are attached in
  // Vercel; until then /ops and /portal work on any host.
  async rewrites() {
    const opsHost = process.env.OPS_HOST;
    const appHost = process.env.APP_HOST;
    const beforeFiles = [
      ...(opsHost
        ? [
            { source: "/", has: [{ type: "host" as const, value: opsHost }], destination: "/ops" },
            { source: "/:path((?!ops|api|login|_next|portal|privacy|terms|security).*)", has: [{ type: "host" as const, value: opsHost }], destination: "/ops/:path" },
          ]
        : []),
      ...(appHost
        ? [
            { source: "/", has: [{ type: "host" as const, value: appHost }], destination: "/portal" },
            { source: "/:path(activity|approvals|requests|integrations|reports)/:rest*", has: [{ type: "host" as const, value: appHost }], destination: "/portal/:path/:rest*" },
          ]
        : []),
    ];
    return { beforeFiles, afterFiles: [], fallback: [] };
  },
};

export default nextConfig;
