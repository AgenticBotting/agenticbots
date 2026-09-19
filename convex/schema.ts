import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

/**
 * Course accounts and entitlements.
 *
 * Deliberately small. The marketing site has no database by design; this
 * exists only because a paid course needs to know who bought it. Nothing
 * about the 13.7k marketing pages touches any of this — the course
 * routes are the only ones that load a Convex client at all.
 *
 * Entitlement is a row in `purchases`, not a flag on the user: a refund
 * has to be recordable without deleting the account, and a second
 * product later should not mean a schema change.
 */
export default defineSchema({
  ...authTables,

  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    /** Staff flag — lets us open the portal to check what a buyer sees. */
    isStaff: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
  }).index("by_email", ["email"]),

  purchases: defineTable({
    userId: v.optional(v.id("users")),
    /** Kept even when there is no account yet: someone can pay first and
     *  set a password afterwards, and the email is what links the two. */
    email: v.string(),
    course: v.string(),
    amountCents: v.number(),
    status: v.union(
      v.literal("PENDING"),
      v.literal("PAID"),
      v.literal("REFUNDED"),
      v.literal("FAILED"),
      v.literal("COMP")
    ),
    /** "EPD" once EasyPayDirect is live; "MANUAL" for comps and invoices. */
    gateway: v.optional(v.string()),
    transactionId: v.optional(v.string()),
    last4: v.optional(v.string()),
    /** Set on refund so access can be withdrawn without losing the record. */
    refundedAt: v.optional(v.number()),
    purchasedAt: v.number(),
    /** Anti-replay for a double-submitted checkout. */
    idempotencyKey: v.optional(v.string()),
    error: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_idempotency", ["idempotencyKey"]),

  /** Which lessons someone has finished. One row per lesson per user. */
  progress: defineTable({
    userId: v.id("users"),
    course: v.string(),
    lesson: v.string(),
    completedAt: v.number(),
  })
    .index("by_user_course", ["userId", "course"])
    .index("by_user_lesson", ["userId", "lesson"]),

  /** People who asked to be told when it opens, while payments are not
   *  live. Not a marketing list — a waiting list with one purpose. */
  waitlist: defineTable({
    email: v.string(),
    course: v.string(),
    note: v.optional(v.string()),
    createdAt: v.number(),
    notifiedAt: v.optional(v.number()),
  }).index("by_email", ["email"]),
});
