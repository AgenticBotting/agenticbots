import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { sameOriginMutation } from "@/lib/request-security";
import { platformCsp } from "@/lib/security-headers";

const courseAuth = convexAuthNextjsMiddleware();
export default function proxy(req: NextRequest, event: NextFetchEvent) {
  const path = req.nextUrl.pathname;
  // Existing course flow is explicitly deferred, retaining its auth handler.
  if (path === "/api/auth" || /^\/(?:api\/)?course(?:\/|$)/.test(path)) return courseAuth(req, event);
  const signedMachineRoute = path.startsWith("/api/webhooks/") || path === "/api/bot-tools/prospecting";
  if (path.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(req.method) && !signedMachineRoute && !sameOriginMutation(req)) {
    return NextResponse.json({ error: { code: "forbidden", message: "Request origin is not allowed." } }, { status: 403 });
  }
  const productHost = [process.env.OPS_HOST, process.env.APP_HOST].filter(Boolean).includes(req.nextUrl.hostname);
  const staticLegalPage = ["/privacy", "/terms", "/security"].includes(path);
  if ((productHost && !staticLegalPage) || /^\/(?:ops|portal|login)(?:\/|$)/.test(path)) {
    const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
    const csp = platformCsp(nonce, process.env.NODE_ENV !== "production");
    const headers = new Headers(req.headers);
    headers.set("Content-Security-Policy", csp);
    headers.set("x-nonce", nonce);
    const response = NextResponse.next({ request: { headers } });
    response.headers.set("Content-Security-Policy", csp);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  return NextResponse.next();
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|woff2|css|js)$).*)"],
};
