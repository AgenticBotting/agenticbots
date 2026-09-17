import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";
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
  allowedDevOrigins: [...lanOrigins, "*.local"],
  async redirects() {
    return REDIRECTS;
  },
};

export default nextConfig;
