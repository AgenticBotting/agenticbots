import "server-only";
import { DemoContactProvider, DemoDataProvider, DemoOutboundProvider, DemoVerificationProvider } from "./demo";
import { HunterAdapter, LeadMagicAdapter, LemlistAdapter, ProspeoAdapter, RocketReachAdapter } from "./vendors";
import type { AnyProvider, ProviderCapability, ProviderSet, ProviderStatus } from "./types";

/**
 * The provider registry. The router asks it for providers by capability;
 * it never imports a vendor class itself.
 */
export function defaultProviders(): ProviderSet {
  const rr = new RocketReachAdapter();
  const lm = new LeadMagicAdapter();
  const hu = new HunterAdapter();
  const pr = new ProspeoAdapter();
  return {
    discovery: [rr, new DemoDataProvider()],
    contacts: [lm, hu, pr, rr, new DemoContactProvider()],
    verification: [lm, hu, pr, new DemoVerificationProvider()],
    outbound: [new LemlistAdapter(), new DemoOutboundProvider()],
  };
}

const g = globalThis as unknown as { __abProviders?: ProviderSet };

export function providers(): ProviderSet {
  return (g.__abProviders ??= defaultProviders());
}

export function setProvidersForTesting(p: ProviderSet | undefined): void {
  g.__abProviders = p;
}

/**
 * Configured pricing, USD per unit, per provider and capability.
 * Set PROSPECTING_PRICING to JSON, e.g. {"vendor":{"email_finding":0.04}}.
 * Values come from the operator's own contract — never guessed here. A paid
 * provider with no configured price is NOT called (fail closed).
 */
export type Pricing = Record<string, Partial<Record<ProviderCapability, number>>>;

export function configuredPricing(): Pricing {
  const raw = process.env.PROSPECTING_PRICING;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Pricing = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (!v || typeof v !== "object") continue;
      out[k] = {};
      for (const [cap, price] of Object.entries(v as Record<string, unknown>)) {
        if (typeof price === "number" && Number.isFinite(price) && price >= 0) out[k][cap as ProviderCapability] = price;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export interface ProviderRow {
  key: string;
  label: string;
  capabilities: ProviderCapability[];
  status: ProviderStatus;
  paid: boolean;
  demo: boolean;
  credentialSetting?: string;
  docsUrl?: string;
  pricing: Partial<Record<ProviderCapability, number>>;
}

/** Operator console view of every provider (no secrets — only whether one is set). */
export function providerCatalog(set: ProviderSet = providers(), pricing: Pricing = configuredPricing()): ProviderRow[] {
  const all = new Map<string, AnyProvider[]>();
  for (const p of [...set.discovery, ...set.contacts, ...set.verification, ...set.outbound]) {
    all.set(p.key, [...(all.get(p.key) ?? []), p]);
  }
  return [...all.entries()].map(([key, ps]) => ({
    key,
    label: ps[0].label.replace(/ \(.*\)$/, ""),
    capabilities: [...new Set(ps.flatMap((p) => [...p.capabilities]))],
    status: ps[0].status(),
    paid: ps[0].paid,
    demo: ps[0].demo,
    credentialSetting: ps[0].credentialSetting,
    docsUrl: ps[0].docsUrl,
    pricing: pricing[key] ?? {},
  }));
}
