import "server-only";

/**
 * Platform environment. Three modes, strictly separated:
 *
 *   demo        DEMO_MODE=true. Seeded fictional data in an in-process
 *               store, the demo runtime, manual billing. No AWS, no runtime
 *               engine, no model key, no payment provider. Nothing in this
 *               mode can reach a real external system — see assertLive().
 *   staging     PLATFORM_ENV=staging with a real database.
 *   production  PLATFORM_ENV=production (the default when not demo).
 */
export type PlatformMode = "demo" | "staging" | "production";

export function platformMode(): PlatformMode {
  if (isTrue(process.env.DEMO_MODE)) return "demo";
  if (process.env.PLATFORM_ENV && !["staging", "production"].includes(process.env.PLATFORM_ENV)) throw new Error("Invalid PLATFORM_ENV. Use staging or production; demo requires DEMO_MODE=true.");
  return process.env.PLATFORM_ENV === "staging" ? "staging" : "production";
}

export function isDemo(): boolean {
  return platformMode() === "demo";
}

function isTrue(v: string | undefined): boolean {
  return v === "1" || v?.toLowerCase() === "true";
}

/**
 * Environment safeguard. Call before ANY side effect that leaves the
 * platform: AWS lifecycle commands, runtime calls, emails, webhooks.
 * Demo mode throws, so a demo click can never send a real email, write to
 * a CRM, change an ad account or stop an EC2 instance.
 */
export function assertLive(action: string): void {
  if (isDemo()) {
    throw new Error(`Refusing "${action}" in demo mode: demo never touches external systems.`);
  }
}

export function cloudChangesAllowed(): boolean {
  return isTrue(process.env.ALLOW_CLOUD_CHANGES);
}

export const billingDefaults = {
  graceDays: intEnv("DEFAULT_BILLING_GRACE_DAYS", 7),
  autoSuspend: isTrue(process.env.DEFAULT_AUTO_SUSPEND),
  autoReactivate: isTrue(process.env.DEFAULT_AUTO_REACTIVATE),
  paymentTermsDays: intEnv("DEFAULT_PAYMENT_TERMS_DAYS", 5),
};

export function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Which backing store the platform uses. */
export function storeKind(): "memory" | "convex" {
  if (isDemo()) return "memory";
  if (process.env.PLATFORM_STORE === "memory") throw new Error("In-memory storage is permitted only in demo mode.");
  return "convex";
}
