import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";

/**
 * Auth cookie handling for the course routes only.
 *
 * The matcher is deliberately narrow. Everything outside /course is
 * static marketing — running middleware across 13,000 pages to serve an
 * auth cookie nobody reads would be a tax on every request for nothing.
 *
 * No redirects here: access is decided server-side by Convex, per lesson.
 * The middleware's whole job is keeping the session readable.
 */
export default convexAuthNextjsMiddleware();

export const config = {
  // "/api/auth" is not optional: the Convex Auth client posts sign-in and
  // sign-up there, and the middleware is what answers it. Leave it out and
  // every sign-up returns a 404 that surfaces as "could not create that
  // login" — which is what happened the first time this shipped.
  matcher: ["/course/:path*", "/api/course/:path*", "/api/auth"],
};
