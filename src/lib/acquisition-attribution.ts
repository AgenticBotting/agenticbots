import { localMarketAttribution } from "./local-market-attribution";
import { getSearchPublication } from "./search-publication";
import nicheRoutes from "@/data/public-niche-routes.json";

const CORE_PAGES = new Set(["/", "/services", "/pricing", "/plan", "/how-it-works", "/about", "/contact"]);
const NICHE_PAGES = new Set(nicheRoutes);

/** Only known public routes become analytics values; never query strings or form text. */
export function acquisitionContext(value: unknown): Record<string, string> {
  if (typeof value !== "string" || value.length > 300) return {};
  const local = localMarketAttribution(value);
  if (local) return local;
  const publication = getSearchPublication(value);
  if (!publication && !CORE_PAGES.has(value) && !NICHE_PAGES.has(value)) return {};
  const parts = value.split("/").filter(Boolean);
  const base = { page: value, page_family: parts[0] || "home" };
  if (NICHE_PAGES.has(value)) return { ...base, niche: parts[2] };
  if (parts[0] === "industries") return { ...base, ...(parts[1] ? { industry: parts[1] } : {}), ...(parts[2] ? { service: parts[2] } : {}) };
  if (parts[0] === "services") return { ...base, ...(parts[1] ? { service: parts[1] } : {}), ...(parts[2] ? { state: parts[2] } : {}), ...(parts[3] ? { city: parts[3] } : {}) };
  if (parts[0] === "markets" && parts[1] === "region") return { ...base, region: parts[2] };
  if (parts[0] === "markets") return { ...base, ...(parts[1] ? { state: parts[1] } : {}), ...(parts[2] ? { city: parts[2] } : {}) };
  return base;
}

export function acquisitionEventContext(page: unknown, landing: unknown) {
  const current = acquisitionContext(page);
  const first = acquisitionContext(landing);
  return { ...current, ...Object.fromEntries(Object.entries(first).map(([key, value]) => [`landing_${key}`, value])) };
}
