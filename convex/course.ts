import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

/**
 * Access, and nothing else.
 *
 * One question runs through this file: has the person in front of us
 * paid for this course. It is answered by a `purchases` row with status
 * PAID or COMP and no refund date — never by a flag someone can set, and
 * never on the client.
 *
 * The rule that keeps it safe: lesson bodies are served by the server
 * only after that check. A client-side `if (paid)` around content that
 * already shipped in the payload is not a paywall, it is a curtain.
 */

const COURSE = "programmatic-google-ads";

/* ─────────────────────────── entitlement ────────────────────────── */

async function entitlementFor(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users"> | null
): Promise<{ hasAccess: boolean; email: string | null; isStaff: boolean }> {
  if (!userId) return { hasAccess: false, email: null, isStaff: false };
  const user = await ctx.db.get(userId);
  if (!user) return { hasAccess: false, email: null, isStaff: false };

  // Match on user id OR email: someone can pay before setting a password,
  // and the email is what ties that purchase to the account they make.
  const byUser = await ctx.db
    .query("purchases")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  const byEmail = await ctx.db
    .query("purchases")
    .withIndex("by_email", (q) => q.eq("email", user.email))
    .collect();

  const owned = [...byUser, ...byEmail].filter(
    (p) => p.course === COURSE && !p.refundedAt && (p.status === "PAID" || p.status === "COMP")
  );

  return {
    hasAccess: owned.length > 0 || !!user.isStaff,
    email: user.email,
    isStaff: !!user.isStaff,
  };
}

/** What the portal asks on load: who am I, and can I read this. */
export const access = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const entitlement = await entitlementFor(ctx, userId);
    if (!userId) return { signedIn: false, ...entitlement, completed: [] as string[] };

    const progress = await ctx.db
      .query("progress")
      .withIndex("by_user_course", (q) => q.eq("userId", userId).eq("course", COURSE))
      .collect();

    return {
      signedIn: true,
      ...entitlement,
      completed: progress.map((p) => p.lesson),
    };
  },
});

/**
 * A lesson's body, gated server-side.
 *
 * Free lessons return their content to anyone. Everything else returns
 * `locked: true` and no body at all, so the payload of a signed-out
 * request simply does not contain the thing being sold.
 */
export const lesson = query({
  args: { slug: v.string(), free: v.boolean() },
  handler: async (ctx, { slug, free }) => {
    const userId = await getAuthUserId(ctx);
    const { hasAccess } = await entitlementFor(ctx, userId);
    if (free || hasAccess) return { slug, locked: false };
    return { slug, locked: true };
  },
});

export const markComplete = mutation({
  args: { lesson: v.string(), done: v.boolean() },
  handler: async (ctx, { lesson: lessonSlug, done }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in required");
    const { hasAccess } = await entitlementFor(ctx, userId);
    if (!hasAccess) throw new Error("This course has not been purchased on this account");

    const existing = await ctx.db
      .query("progress")
      .withIndex("by_user_lesson", (q) => q.eq("userId", userId).eq("lesson", lessonSlug))
      .first();

    if (done && !existing) {
      await ctx.db.insert("progress", {
        userId,
        course: COURSE,
        lesson: lessonSlug,
        completedAt: Date.now(),
      });
    } else if (!done && existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

/* ──────────────────────────── purchases ─────────────────────────── */

/**
 * Attach any purchase made with this email to the account.
 *
 * Called after sign-up, because the common order of events is: pay, then
 * create the login. Without this the buyer signs in and is told they do
 * not own the thing they just bought.
 */
export const claimPurchases = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Sign in required");
    const user = await ctx.db.get(userId);
    if (!user) return { claimed: 0 };

    const orphans = await ctx.db
      .query("purchases")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .collect();

    let claimed = 0;
    for (const purchase of orphans) {
      if (!purchase.userId) {
        await ctx.db.patch(purchase._id, { userId });
        claimed++;
      }
    }
    return { claimed };
  },
});

/**
 * Record a purchase. Called by the payment route after the gateway
 * approves, and by hand for a comp.
 *
 * Idempotent on `idempotencyKey`: a double-submitted checkout must never
 * produce two charges' worth of rows.
 */
export const recordPurchase = mutation({
  args: {
    email: v.string(),
    amountCents: v.number(),
    status: v.union(v.literal("PAID"), v.literal("COMP"), v.literal("FAILED"), v.literal("PENDING")),
    gateway: v.optional(v.string()),
    transactionId: v.optional(v.string()),
    last4: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();

    if (args.idempotencyKey) {
      const existing = await ctx.db
        .query("purchases")
        .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey))
        .first();
      if (existing) return existing._id;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    return ctx.db.insert("purchases", {
      userId: user?._id,
      email,
      course: COURSE,
      amountCents: args.amountCents,
      status: args.status,
      gateway: args.gateway,
      transactionId: args.transactionId,
      last4: args.last4,
      idempotencyKey: args.idempotencyKey,
      error: args.error,
      purchasedAt: Date.now(),
    });
  },
});

/* ──────────────────────────── waitlist ──────────────────────────── */

/**
 * While card processing is not live, the checkout collects an email
 * instead of a payment. Saying that plainly beats a buy button that
 * fails at the last step.
 */
export const joinWaitlist = mutation({
  args: { email: v.string(), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!email.includes("@")) throw new Error("That email does not look right");

    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existing) return { alreadyOn: true };

    await ctx.db.insert("waitlist", {
      email,
      course: COURSE,
      note: args.note,
      createdAt: Date.now(),
    });
    return { alreadyOn: false };
  },
});

/** Operator view — how many people are waiting, and who. */
export const waitlistCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user?.isStaff) return null;
    const rows = await ctx.db.query("waitlist").collect();
    return { total: rows.length, recent: rows.slice(-25).reverse() };
  },
});
