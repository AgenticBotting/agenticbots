import type { SignalType } from "@/lib/prospecting/types";

/**
 * Freshness policy: how long each kind of fact is trusted before the
 * router may pay to refresh it. A fresh fact is NEVER re-bought.
 */
export const TTL_DAYS = {
  company: 90,
  research: 60,
  people: 60,
  email_found: 90,
  email_verified: 30,
  domain_intel: 14,
  discovery: 30,
} as const;

export type FreshKind = keyof typeof TTL_DAYS;

const DAY = 86_400_000;

export function expiresAt(kind: FreshKind, from: Date): string {
  return new Date(from.getTime() + TTL_DAYS[kind] * DAY).toISOString();
}

export function isFresh(kind: FreshKind, at: string | undefined, now: Date): boolean {
  if (!at) return false;
  const t = Date.parse(at);
  return Number.isFinite(t) && now.getTime() - t < TTL_DAYS[kind] * DAY;
}

/** How long a "why now" signal stays relevant. */
export const SIGNAL_TTL_DAYS: Record<SignalType, number> = {
  building_permit: 120, construction_project: 180, property_acquisition: 180, new_location: 120, expansion: 180,
  hiring: 60, facilities_hiring: 60, capital_improvement: 270, procurement_notice: 45, bid_posting: 30,
  contract_expiration: 120, inspection_cycle: 90, weather_event: 60, ownership_change: 180, management_change: 120,
  negative_reviews: 60, new_facility: 180, financed_project: 270, renovation: 180, tenant_improvement: 120,
  infrastructure_funding: 365, visible_deterioration: 180, website_indicator: 90, client_specific: 90,
};

export function signalExpiry(type: SignalType, observedAt: string): string {
  return new Date(Date.parse(observedAt) + SIGNAL_TTL_DAYS[type] * DAY).toISOString();
}
