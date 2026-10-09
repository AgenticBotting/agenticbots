import type { Approval } from "./types";

/** Expiry is derived at read time, even before a background reconciliation runs. */
export function approvalDisplayStatus(a: Pick<Approval, "status" | "expiresAt">, now = Date.now()): Approval["status"] {
  return a.status === "pending" && a.expiresAt && Date.parse(a.expiresAt) <= now ? "expired" : a.status;
}
