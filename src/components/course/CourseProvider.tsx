"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

/**
 * Convex, loaded only inside /course.
 *
 * The rest of this site is 13,000 static pages with no client data layer,
 * and it stays that way — this provider lives in the course route group's
 * layout so the websocket and the auth bundle never reach a city page.
 */
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL ?? "");

export function CourseProvider({ children }: { children: ReactNode }) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    // Deployed without course env vars: the marketing pages are fine, and
    // the course pages say so rather than throwing a client exception.
    return <>{children}</>;
  }
  return <ConvexAuthNextjsProvider client={convex}>{children}</ConvexAuthNextjsProvider>;
}
