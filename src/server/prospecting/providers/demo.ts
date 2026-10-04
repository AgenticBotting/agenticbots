import "server-only";
import type { EmailStatus, OutboundPayload, SignalType } from "@/lib/prospecting/types";
import { isDemo } from "@/server/env";
import type {
  CompanyRef, ContactEnrichmentProvider, DiscoveredCompany, DiscoveryPage, DiscoveryQuery, EmailFindResult,
  EmailVerificationProvider, FoundPerson, ObservedSignal, OutboundProvider, ProspectDataProvider, ProviderStatus, VerifyResult,
} from "./types";

/**
 * DemoProvider — deterministic, fictional, free.
 *
 * Every company is named "[Demo] …", lives on a reserved `.example`
 * domain with no phone number, and every record it produces is
 * flagged demo. The same query always returns the same results, so tests
 * and demos are reproducible. It is disabled outside demo mode unless
 * PROSPECTING_DEMO_PROVIDER=true (for staging walkthroughs) — and demo
 * contacts can never be handed to a live outbound system.
 */
export const DEMO_PROVIDER_KEY = "demo";

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0;
  return h >>> 0;
}
/** Deterministic PRNG (mulberry32). */
function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];

const PLACE = ["Harbor", "Cypress", "Palm", "Bayview", "Oak Ridge", "Lakeside", "Summit", "Willow", "Coral", "Pinecrest", "Riverbend", "Magnolia", "Sawgrass", "Heron", "Gateway", "Northpoint", "Seaside", "Crestview", "Meridian", "Sandpiper"];
const CITIES = ["Northgate", "Riverside", "Lakeview", "Westfield", "Fairview", "Brookhaven", "Easton", "Millbrook"];
const FIRST = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Avery", "Quinn", "Drew", "Reese", "Cameron", "Robin", "Hayden", "Parker", "Logan"];
const LAST = ["Rivera", "Chen", "Patel", "Brooks", "Morales", "Nguyen", "Foster", "Bennett", "Coleman", "Hayes", "Ward", "Price", "Sullivan", "Reyes", "Kim", "Grant"];

/** Noun used to name a fictional company of this buyer type. */
function nounFor(q: DiscoveryQuery["buyerType"]): string {
  const n = q.name.toLowerCase();
  if (n.includes("apartment") || n.includes("multifamily")) return "Apartments";
  if (n.includes("hoa") || n.includes("homeowner") || n.includes("condo")) return "Community Association";
  if (n.includes("property manag")) return "Property Management";
  if (n.includes("hotel") || n.includes("resort")) return "Hotel";
  if (n.includes("school") || n.includes("district")) return "Academy";
  if (n.includes("church") || n.includes("worship")) return "Community Church";
  if (n.includes("hospital") || n.includes("medical") || n.includes("clinic")) return "Medical Center";
  if (n.includes("restaurant")) return "Kitchen & Bar";
  if (n.includes("warehouse") || n.includes("distribution") || n.includes("logistics")) return "Distribution";
  if (n.includes("manufactur")) return "Manufacturing";
  if (n.includes("retail") || n.includes("shopping")) return "Shopping Center";
  if (n.includes("contractor") || n.includes("builder")) return "Builders";
  if (n.includes("office") || n.includes("commercial real estate") || n.includes("cre")) return "Office Park";
  if (n.includes("senior") || n.includes("assisted")) return "Senior Living";
  if (n.includes("self-storage") || n.includes("storage")) return "Storage";
  return "Holdings";
}

const SIGNALS_BY_TAG: Record<string, SignalType[]> = {
  owns_buildings: ["capital_improvement", "building_permit", "property_acquisition"],
  portfolio_owner: ["property_acquisition", "management_change"],
  residential_units: ["renovation", "management_change"],
  construction_buyer: ["construction_project", "bid_posting", "building_permit"],
  procurement: ["procurement_notice", "contract_expiration"],
  critical_systems: ["facilities_hiring", "inspection_cycle"],
  multi_site: ["new_location", "expansion"],
  has_parking: ["visible_deterioration"],
};

const DAY = 86_400_000;

function enabled(): ProviderStatus {
  return isDemo() || process.env.PROSPECTING_DEMO_PROVIDER === "true" ? "ready" : "disabled";
}

export class DemoDataProvider implements ProspectDataProvider {
  readonly key = DEMO_PROVIDER_KEY;
  readonly label = "Demo data (fictional)";
  readonly capabilities = ["company_discovery", "company_research", "signals"] as const;
  readonly paid = false;
  readonly demo = true;
  readonly priority = 100;
  /** Demo signal dates are relative to this clock (day-rounded) — reproducible for a given day. */
  constructor(private readonly clock: () => Date = () => new Date()) {}
  status() {
    return enabled();
  }

  /** Total fictional companies the demo source "has" for a query. */
  static universe(q: Pick<DiscoveryQuery, "buyerType" | "geography">): number {
    return 6 + (hash(`${q.buyerType.key}|${q.geography.name}`) % 9);
  }

  async discoverCompanies(q: DiscoveryQuery): Promise<DiscoveryPage> {
    const total = DemoDataProvider.universe(q);
    const start = q.cursor ? Number.parseInt(q.cursor, 10) || 0 : 0;
    const end = Math.min(total, start + Math.max(1, q.limit));
    const companies: DiscoveredCompany[] = [];
    for (let i = start; i < end; i++) {
      const r = rng(`${q.buyerType.key}|${q.geography.name}|${q.geography.state}|${i}`);
      const place = pick(r, PLACE);
      const noun = nounFor(q.buyerType);
      const slug = `${place}-${noun}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const num = 100 + (hash(`${slug}|${q.geography.name}|${i}`) % 900);
      const portfolio = q.buyerType.tags.includes("portfolio_owner") ? 4 + Math.floor(r() * 40) : undefined;
      companies.push({
        externalId: `demo:${q.buyerType.key}:${q.geography.state}:${slugOf(q.geography.name)}:${i}`,
        name: `[Demo] ${place} ${noun}`,
        domain: `${slug}-${num}.example`,
        website: `https://${slug}-${num}.example`,
        // No phone: fictional numbers would collide and trigger false identity merges.
        location: {
          city: pick(r, CITIES),
          county: q.geography.kind === "county" ? q.geography.name : undefined,
          state: q.geography.state,
          zip: q.geography.zips?.[i % (q.geography.zips?.length || 1)] ?? undefined,
        },
        category: q.buyerType.name,
        employeeRange: pick(r, ["1-10", "11-50", "51-200", "201-500"]),
        locationCount: q.buyerType.tags.includes("multi_site") ? 2 + Math.floor(r() * 20) : 1,
        portfolioSize: portfolio,
        facts: { demo: true, category: q.buyerType.name },
        confidence: 0.9,
      });
    }
    return { companies, nextCursor: end < total ? String(end) : undefined, units: 0 };
  }

  async researchCompany(c: CompanyRef) {
    const r = rng(`research|${c.domain ?? c.name}`);
    const signals: ObservedSignal[] = [];
    // Roughly half of demo companies have an observed "why now".
    if (r() < 0.55) {
      const tags = c.buyerTags ?? [];
      const pool = [...new Set(tags.flatMap((t) => SIGNALS_BY_TAG[t] ?? []))];
      const type = pool.length ? pick(r, pool) : "capital_improvement";
      const daysAgo = Math.floor(r() * 75);
      signals.push({
        type,
        summary: `[Demo] ${DEMO_SIGNAL_TEXT[type] ?? "Activity observed"}`,
        observedAt: new Date(Math.floor(this.clock().getTime() / DAY) * DAY - (daysAgo + 1) * DAY).toISOString(),
        relevance: 0.6 + r() * 0.35,
        confidence: 0.7 + r() * 0.25,
        externalId: `demo-signal:${c.domain ?? c.name}:${type}`,
      });
    }
    return { facts: { demo: true, researched: true }, signals, units: 0 };
  }
}

const DEMO_SIGNAL_TEXT: Partial<Record<SignalType, string>> = {
  capital_improvement: "Capital improvement budget mentioned in a public notice",
  building_permit: "Building permit filed for exterior work",
  property_acquisition: "Property recently changed ownership",
  management_change: "New property management company announced",
  renovation: "Renovation project announced",
  construction_project: "New construction project listed",
  bid_posting: "Open bid posted for site work",
  procurement_notice: "Solicitation published for facility services",
  contract_expiration: "Service contract up for renewal",
  facilities_hiring: "Hiring a facilities manager",
  inspection_cycle: "Annual inspection cycle due",
  new_location: "New location opening",
  expansion: "Expansion announced",
  visible_deterioration: "Parking lot condition flagged in a public record",
};

const slugOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export class DemoContactProvider implements ContactEnrichmentProvider {
  readonly key = DEMO_PROVIDER_KEY;
  readonly label = "Demo contacts (fictional)";
  readonly capabilities = ["people_search", "email_finding"] as const;
  readonly paid = false;
  readonly demo = true;
  readonly priority = 100;
  status() {
    return enabled();
  }
  async findPeople(c: CompanyRef, wantedTitles: string[], limit: number) {
    const r = rng(`people|${c.domain ?? c.name}`);
    const titles = wantedTitles.length ? wantedTitles : ["Owner"];
    const n = Math.min(limit, 1 + Math.floor(r() * 3));
    const people: FoundPerson[] = [];
    for (let i = 0; i < n; i++) {
      const first = pick(r, FIRST);
      const last = pick(r, LAST);
      people.push({
        externalId: `demo-person:${c.domain ?? c.name}:${i}`,
        fullName: `${first} ${last}`,
        firstName: first,
        lastName: last,
        title: titles[i % titles.length],
        location: c.city ? `${c.city}, ${c.state ?? ""}`.trim() : undefined,
        employmentConfidence: 0.75 + r() * 0.2,
      });
    }
    return { people, units: 0 };
  }
  async findEmail(person: { firstName?: string; lastName?: string; fullName: string }, domain: string): Promise<EmailFindResult> {
    const [f, l] = [person.firstName ?? person.fullName.split(" ")[0], person.lastName ?? person.fullName.split(" ").slice(-1)[0]];
    if (!f || !l) return { status: "UNKNOWN", confidence: 0, units: 0 };
    return { email: `${f}.${l}@${domain}`.toLowerCase(), status: "LIKELY_VALID", confidence: 0.7, units: 0 };
  }
}

export class DemoVerificationProvider implements EmailVerificationProvider {
  readonly key = DEMO_PROVIDER_KEY;
  readonly label = "Demo verification (fictional)";
  readonly capabilities = ["email_verification"] as const;
  readonly paid = false;
  readonly demo = true;
  readonly priority = 100;
  status() {
    return enabled();
  }
  async verify(email: string): Promise<VerifyResult> {
    const x = hash(`verify|${email}`) % 100;
    const status: EmailStatus = x < 68 ? "VERIFIED" : x < 82 ? "CATCH_ALL" : x < 92 ? "RISKY" : "INVALID";
    return { status, catchAll: status === "CATCH_ALL", units: 0 };
  }
}

/** Accepts handoffs and sends NOTHING. Records what a real system would receive. */
export class DemoOutboundProvider implements OutboundProvider {
  readonly key = DEMO_PROVIDER_KEY;
  readonly label = "Demo outbound (sends nothing)";
  readonly capabilities = ["outbound"] as const;
  readonly paid = false;
  readonly demo = true;
  readonly priority = 100;
  readonly received: { payload: OutboundPayload; key: string }[] = [];
  status() {
    return enabled();
  }
  async handoff(payload: OutboundPayload, idempotencyKey: string) {
    if (!this.received.some((x) => x.key === idempotencyKey)) this.received.push({ payload, key: idempotencyKey });
    return { accepted: true, externalRef: `demo-${hash(idempotencyKey).toString(16)}` };
  }
}
