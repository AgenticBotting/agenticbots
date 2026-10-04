import "server-only";
import type { CompanyLocation, EmailStatus, Geography, OutboundPayload, SignalType } from "@/lib/prospecting/types";

/**
 * Vendor-neutral provider contracts.
 *
 * Nothing outside src/server/prospecting/providers/** may name a vendor.
 * The EnrichmentRouter, jobs, scoring, Bot tools and every UI work only
 * with these shapes. Swapping a vendor means writing one adapter file.
 *
 * Adapters run server-side only. Credentials are read inside the adapter
 * from server environment/secret storage and never leave it — results
 * carry a neutral `provider` key, never a key, token or raw payload.
 */
export type ProviderCapability =
  | "company_discovery"
  | "people_search"
  | "email_finding"
  | "email_verification"
  | "company_research"
  | "signals"
  | "outbound";

export type ProviderStatus =
  /** Usable now. */
  | "ready"
  /** No credential configured. */
  | "not_configured"
  /** Credential present but the adapter's API calls are not implemented/approved yet. */
  | "not_implemented"
  /** Turned off (e.g. the demo provider outside demo mode). */
  | "disabled";

export interface ProviderInfo {
  /** Neutral, stable key used in cost events and provenance. */
  readonly key: string;
  /** Operator-facing label. Never shown to clients. */
  readonly label: string;
  readonly capabilities: readonly ProviderCapability[];
  /** Paid providers require a configured price and a budget before any call. */
  readonly paid: boolean;
  readonly demo: boolean;
  /** Lower runs first within a capability. */
  readonly priority: number;
  /** Name of the server-side credential setting (never its value). */
  readonly credentialSetting?: string;
  /** Link to the vendor's API docs, for the operator and for implementers. */
  readonly docsUrl?: string;
  status(): ProviderStatus;
}

export type ProviderErrorKind =
  | "not_configured" | "not_implemented" | "auth_failed" | "rate_limited" | "quota_exceeded" | "unavailable" | "bad_response";

export class ProviderError extends Error {
  constructor(
    readonly provider: string,
    readonly kind: ProviderErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
  get retryable(): boolean {
    return this.kind === "rate_limited" || this.kind === "unavailable";
  }
  /** Fall through to the next provider for these. */
  get fallthrough(): boolean {
    return this.kind !== "bad_response";
  }
}

/* ── Inputs/outputs ── */

export interface DiscoveryQuery {
  nicheTags: string[];
  buyerType: { id: string; key: string; name: string; tags: string[]; segmentKey: string };
  geography: Geography;
  limit: number;
  cursor?: string;
}

export interface DiscoveredCompany {
  externalId: string;
  name: string;
  domain?: string;
  website?: string;
  phone?: string;
  location: CompanyLocation;
  /** Provider's category label, verbatim. */
  category?: string;
  employeeRange?: string;
  locationCount?: number;
  portfolioSize?: number;
  sourceUrl?: string;
  /** Facts exactly as reported. */
  facts: Record<string, string | number | boolean | null>;
  confidence: number;
}

export interface DiscoveryPage {
  companies: DiscoveredCompany[];
  /** Absent = the source reported no more results. */
  nextCursor?: string;
  units: number;
}

export interface FoundPerson {
  externalId: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  title: string;
  location?: string;
  sourceUrl?: string;
  /** 0–1: confidence this person currently works at the company. */
  employmentConfidence: number;
}

export interface CompanyRef {
  name: string;
  domain?: string;
  city?: string;
  state?: string;
  /** Neutral buyer facility tags, a hint for research. */
  buyerTags?: string[];
}

export interface ObservedSignal {
  type: SignalType;
  summary: string;
  observedAt: string;
  relevance: number;
  confidence: number;
  sourceUrl?: string;
  externalId?: string;
}

export interface EmailFindResult {
  email?: string;
  status: EmailStatus;
  confidence: number;
  units: number;
}

export interface VerifyResult {
  status: EmailStatus;
  catchAll?: boolean;
  units: number;
}

/* ── Contracts ── */

export interface ProspectDataProvider extends ProviderInfo {
  discoverCompanies(q: DiscoveryQuery): Promise<DiscoveryPage>;
  /** Research a known company: extra facts + observed signals. */
  researchCompany?(c: CompanyRef): Promise<{ facts: Record<string, string | number | boolean | null>; signals: ObservedSignal[]; units: number }>;
}

export interface ContactEnrichmentProvider extends ProviderInfo {
  findPeople(c: CompanyRef, wantedTitles: string[], limit: number): Promise<{ people: FoundPerson[]; units: number }>;
  findEmail(person: { firstName?: string; lastName?: string; fullName: string }, domain: string): Promise<EmailFindResult>;
}

export interface EmailVerificationProvider extends ProviderInfo {
  verify(email: string): Promise<VerifyResult>;
}

export interface OutboundProvider extends ProviderInfo {
  /**
   * Hand a policy-checked contact to an outbound system. Must be
   * idempotent on `idempotencyKey`. Never called before suppression and
   * policy checks pass (enforced by the caller, re-checked by tests).
   */
  handoff(payload: OutboundPayload, idempotencyKey: string): Promise<{ accepted: boolean; externalRef?: string; reason?: string }>;
}

export type AnyProvider = ProspectDataProvider | ContactEnrichmentProvider | EmailVerificationProvider | OutboundProvider;

export interface ProviderSet {
  discovery: ProspectDataProvider[];
  contacts: ContactEnrichmentProvider[];
  verification: EmailVerificationProvider[];
  outbound: OutboundProvider[];
}
