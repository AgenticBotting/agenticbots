import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { PLATFORM_TABLES, APPEND_ONLY, physical } from "./platformTables";

/**
 * Server-to-server document API for the AgenticBots platform.
 *
 * The browser never calls these. Only the Next.js server does, and every
 * call carries PLATFORM_SERVER_SECRET (set with `npx convex env set`).
 * Authorization — who may see which organization — is enforced in the
 * platform's service layer before a call is ever made; this file's job is
 * storage integrity: atomic multi-record commits, optimistic version
 * checks, and refusing deletes on financial and audit tables.
 *
 * Each row stores the domain record in `doc`, with `pid` (the platform
 * UUID) and `orgId` lifted out for indexing.
 */

const TABLES = new Set<string>(PLATFORM_TABLES);

function checkSecret(secret: string) {
  const expected = process.env.PLATFORM_SERVER_SECRET ?? "";
  if (expected.length < 32) throw new Error("PLATFORM_SERVER_SECRET is not configured on the Convex deployment.");
  // Constant-time comparison.
  let diff = secret.length ^ expected.length;
  for (let i = 0; i < Math.max(secret.length, expected.length); i++) {
    diff |= (secret.charCodeAt(i) || 0) ^ (expected.charCodeAt(i) || 0);
  }
  if (diff !== 0) throw new Error("Unauthorized");
}

function tableOf(name: string): string {
  if (!TABLES.has(name)) throw new Error(`Unknown platform table: ${name}`);
  return physical(name);
}

type Row = { _id: unknown; pid: string; orgId?: string; doc: Record<string, unknown>; version: number };

export const get = query({
  args: { secret: v.string(), table: v.string(), id: v.string() },
  handler: async (ctx, { secret, table, id }) => {
    checkSecret(secret);
    const row = (await ctx.db
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .query(tableOf(table) as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_pid", (q: any) => q.eq("pid", id))
      .unique()) as Row | null;
    return row ? row.doc : null;
  },
});

export const list = query({
  args: { secret: v.string(), table: v.string(), orgId: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, { secret, table, orgId, limit }) => {
    checkSecret(secret);
    const t = tableOf(table);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const base = ctx.db.query(t as any);
    const q =
      orgId !== undefined
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? base.withIndex("by_org", (ix: any) => ix.eq("orgId", orgId))
        : base;
    const rows = (await (limit ? q.order("desc").take(limit * 4) : q.collect())) as Row[];
    return rows.map((r) => r.doc);
  },
});

export const commit = mutation({
  args: {
    secret: v.string(),
    ops: v.array(
      v.object({
        type: v.union(v.literal("insert"), v.literal("patch"), v.literal("delete")),
        table: v.string(),
        id: v.string(),
        expectedVersion: v.optional(v.number()),
        doc: v.optional(v.any()),
        patch: v.optional(v.any()),
      }),
    ),
  },
  handler: async (ctx, { secret, ops }) => {
    checkSecret(secret);
    // A Convex mutation is a single transaction: if any op throws, none apply.
    for (const op of ops) {
      const t = tableOf(op.table);
      const existing = (await ctx.db
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .query(t as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .withIndex("by_pid", (q: any) => q.eq("pid", op.id))
        .unique()) as Row | null;

      if (op.type === "insert") {
        if (existing) throw new Error(`Duplicate id in ${op.table}`);
        const doc = op.doc as Record<string, unknown>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await ctx.db.insert(t as any, {
          pid: op.id,
          orgId: typeof doc.orgId === "string" ? doc.orgId : undefined,
          doc,
          version: 1,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      } else if (op.type === "patch") {
        if (!existing) throw new Error(`Record no longer exists in ${op.table}`);
        if (existing.version !== op.expectedVersion) {
          throw new Error("CONFLICT: This record was changed by someone else. Reload and try again.");
        }
        const next: Record<string, unknown> = { ...existing.doc };
        for (const [k, val] of Object.entries((op.patch ?? {}) as Record<string, unknown>)) {
          if (val === null) delete next[k];
          else next[k] = val;
        }
        next.version = existing.version + 1;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await ctx.db.patch(existing._id as any, { doc: next, version: existing.version + 1 } as any);
      } else {
        if (APPEND_ONLY.has(op.table)) throw new Error(`Records in ${op.table} are never deleted.`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (existing) await ctx.db.delete(existing._id as any);
      }
    }
  },
});
