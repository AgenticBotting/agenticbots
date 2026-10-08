"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const KEY = "ab-acquisition-landing";
const PUBLIC_PATH = /^(?:\/|\/(?:services|markets|industries)(?:\/[a-z0-9-]+){0,7}|\/(?:pricing|plan|how-it-works|about|contact))$/;

export function readLandingPath(): string | undefined {
  try { return sessionStorage.getItem(KEY) ?? undefined; } catch { return undefined; }
}

/** Session-only route context. No identity, search parameters, referrer or network calls. */
export function AcquisitionAttribution() {
  const path = usePathname();
  useEffect(() => {
    if (!path || path.length > 300 || !PUBLIC_PATH.test(path)) return;
    try { if (!sessionStorage.getItem(KEY)) sessionStorage.setItem(KEY, path); } catch { /* storage may be disabled */ }
  }, [path]);
  return null;
}
