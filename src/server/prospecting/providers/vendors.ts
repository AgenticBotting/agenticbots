import "server-only";
import {
  ProviderError,
  type ContactEnrichmentProvider, type DiscoveryPage, type EmailFindResult,
  type EmailVerificationProvider, type OutboundProvider, type ProspectDataProvider, type ProviderCapability,
  type ProviderStatus, type VerifyResult,
} from "./types";
import { hasCredential } from "./secrets";

/**
 * Third-party adapters — STUBS.
 *
 * Each class declares what the vendor can do and where its API docs live,
 * but makes NO network call. With no credential the status is
 * "not_configured"; with a credential it is "not_implemented" until the
 * real calls are written against the vendor's current docs AND paid usage
 * is approved. The router skips both, so nothing here can spend money.
 *
 * Implementing one: read the docs at `docsUrl`, implement the methods with
 * fetch() inside this file only, map the vendor's statuses to the neutral
 * ones, set `implemented = true`, add configured pricing, and add a
 * contract test with a recorded (not live) response.
 */
abstract class VendorStub {
  abstract readonly key: string;
  abstract readonly label: string;
  abstract readonly capabilities: readonly ProviderCapability[];
  abstract readonly credentialSetting: string;
  abstract readonly docsUrl: string;
  readonly paid = true;
  readonly demo = false;
  readonly priority: number = 50;
  /** Flip to true only when real calls exist and are approved. */
  protected readonly implemented: boolean = false;

  status(): ProviderStatus {
    if (!hasCredential(this.credentialSetting)) return "not_configured";
    return this.implemented ? "ready" : "not_implemented";
  }

  protected refuse(): never {
    const s = this.status();
    throw new ProviderError(
      this.key,
      s === "not_configured" ? "not_configured" : "not_implemented",
      s === "not_configured"
        ? `${this.label} is not configured (no ${this.credentialSetting}).`
        : `${this.label} adapter calls are not implemented yet.`,
    );
  }
}

/** Contact data: people lookup + email/phone. Docs: People Search / People Lookup APIs. */
export class RocketReachAdapter extends VendorStub implements ContactEnrichmentProvider, ProspectDataProvider {
  readonly key = "rocketreach";
  readonly label = "RocketReach";
  readonly capabilities = ["people_search", "email_finding", "company_discovery"] as const;
  readonly credentialSetting = "ROCKETREACH_API_KEY";
  readonly docsUrl = "https://docs.rocketreach.co/reference/people-search-api";
  readonly priority = 40;
  async discoverCompanies(): Promise<DiscoveryPage> {
    return this.refuse();
  }
  async findPeople(): Promise<{ people: never[]; units: number }> {
    return this.refuse();
  }
  async findEmail(): Promise<EmailFindResult> {
    return this.refuse();
  }
}

/** Work-email finder + verification. Docs: Email Finder reference. */
export class LeadMagicAdapter extends VendorStub implements ContactEnrichmentProvider, EmailVerificationProvider {
  readonly key = "leadmagic";
  readonly label = "LeadMagic";
  readonly capabilities = ["email_finding", "email_verification"] as const;
  readonly credentialSetting = "LEADMAGIC_API_KEY";
  readonly docsUrl = "https://leadmagic.io/docs/api-reference/email-finder";
  readonly priority = 20;
  async findPeople(): Promise<{ people: never[]; units: number }> {
    return this.refuse();
  }
  async findEmail(): Promise<EmailFindResult> {
    return this.refuse();
  }
  async verify(): Promise<VerifyResult> {
    return this.refuse();
  }
}

/** Domain search, email finder, email verifier (base https://api.hunter.io/v2/). */
export class HunterAdapter extends VendorStub implements ContactEnrichmentProvider, EmailVerificationProvider {
  readonly key = "hunter";
  readonly label = "Hunter";
  readonly capabilities = ["people_search", "email_finding", "email_verification"] as const;
  readonly credentialSetting = "HUNTER_API_KEY";
  readonly docsUrl = "https://hunter.io/api-documentation";
  readonly priority = 30;
  async findPeople(): Promise<{ people: never[]; units: number }> {
    return this.refuse();
  }
  async findEmail(): Promise<EmailFindResult> {
    return this.refuse();
  }
  async verify(): Promise<VerifyResult> {
    return this.refuse();
  }
}

/** Email finder / verifier. */
export class ProspeoAdapter extends VendorStub implements ContactEnrichmentProvider, EmailVerificationProvider {
  readonly key = "prospeo";
  readonly label = "Prospeo";
  readonly capabilities = ["email_finding", "email_verification"] as const;
  readonly credentialSetting = "PROSPEO_API_KEY";
  readonly docsUrl = "https://prospeo.io/api";
  readonly priority = 35;
  async findPeople(): Promise<{ people: never[]; units: number }> {
    return this.refuse();
  }
  async findEmail(): Promise<EmailFindResult> {
    return this.refuse();
  }
  async verify(): Promise<VerifyResult> {
    return this.refuse();
  }
}

/** Outbound sequencing: add a lead to a campaign. Docs: Create Lead in Campaign. */
export class LemlistAdapter extends VendorStub implements OutboundProvider {
  readonly key = "lemlist";
  readonly label = "lemlist";
  readonly capabilities = ["outbound"] as const;
  readonly credentialSetting = "LEMLIST_API_KEY";
  readonly docsUrl = "https://developer.lemlist.com/api-reference/endpoints/leads/create-lead-in-campaign";
  readonly priority = 10;
  async handoff(): Promise<{ accepted: boolean; externalRef?: string; reason?: string }> {
    return this.refuse();
  }
}
