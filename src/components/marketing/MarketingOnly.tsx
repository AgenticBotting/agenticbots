"use client";

import { usePathname } from "next/navigation";

/**
 * Marketing-site widgets (plan flow, exit intent, the wandering bot) have
 * no place in the operator console, client portal or sign-in screens.
 */
const APP_PREFIXES = ["/ops", "/portal", "/login"];

export function MarketingOnly({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? "/";
  if (APP_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  return <>{children}</>;
}
