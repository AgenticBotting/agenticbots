/** Pure request policy; reused by middleware and route handlers. */
export function sameOriginMutation(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin || origin === "null") return false;
  try {
    const target = new URL(req.url);
    const candidate = new URL(origin);
    if (candidate.origin !== origin || candidate.origin !== target.origin) return false;
    const configured = [process.env.NEXT_PUBLIC_SITE_URL, process.env.OPS_HOST && `https://${process.env.OPS_HOST}`, process.env.APP_HOST && `https://${process.env.APP_HOST}`].filter(Boolean);
    if (configured.some(value => new URL(value!).origin === origin)) return true;
    return process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname);
  } catch { return false; }
}

/** A shared anonymous bucket is safer than trusting a spoofable forwarding header.
 * Vercel overwrites x-vercel-forwarded-for at its trusted ingress. */
export function requestIp(headers: Headers): string {
  return process.env.VERCEL === "1" ? (headers.get("x-vercel-forwarded-for")?.split(",")[0].trim().slice(0, 64) || "unknown") : "unverified-proxy";
}
