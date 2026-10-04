import "server-only";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import type { TableName, Tables } from "@/lib/platform/types";
import { assertOpAllowed, matches, sortRows, type ListQuery, type Op, type Repository } from "./repository";
import { conflict, unavailable } from "@/server/errors";
import { platformMode } from "@/server/env";

/**
 * Production store: the Convex deployment the site already uses.
 * Calls go server-to-server with PLATFORM_SERVER_SECRET; nothing here is
 * reachable from a browser.
 */
/** Documents per Convex page (well under the per-call byte limit). */
const PAGE_SIZE = 400;

export class ConvexRepository implements Repository {
  private client: ConvexHttpClient;
  private secret: string;

  constructor(url = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL, secret = process.env.PLATFORM_SERVER_SECRET) {
    if (!url) throw unavailable("Platform database is not configured (CONVEX_URL).");
    // Staging must name its own database explicitly — never inherit the
    // public (production) Convex URL by accident.
    if (platformMode() === "staging" && !process.env.CONVEX_URL) {
      throw unavailable("Staging requires CONVEX_URL set to the staging Convex deployment.");
    }
    if (!secret || secret.length < 32) throw unavailable("Platform database secret is not configured.");
    this.client = new ConvexHttpClient(url);
    this.secret = secret;
  }

  async get<K extends TableName>(table: K, id: string): Promise<Tables[K] | null> {
    return (await this.client.query(anyApi.platform.get, { secret: this.secret, table, id })) as Tables[K] | null;
  }

  async list<K extends TableName>(table: K, q: ListQuery<Tables[K]> = {}): Promise<Tables[K][]> {
    // Paged so no single Convex call approaches its document/byte limits.
    let rows: Tables[K][] = [];
    let cursor: string | null = null;
    for (let i = 0; i < 10_000; i++) {
      const res = (await this.client.query(anyApi.platform.page, {
        secret: this.secret,
        table,
        orgId: q.orgId,
        cursor,
        numItems: PAGE_SIZE,
      })) as { docs: Tables[K][]; cursor: string; isDone: boolean };
      rows = rows.concat(res.docs);
      if (res.isDone) break;
      cursor = res.cursor;
    }
    rows = rows.filter((r) => matches(r, q.where));
    rows = sortRows(rows as (Tables[K] & { createdAt: string })[], q.order);
    return q.limit ? rows.slice(0, q.limit) : rows;
  }

  async commit(ops: Op[]): Promise<void> {
    ops.forEach(assertOpAllowed);
    try {
      await this.client.mutation(anyApi.platform.commit, {
        secret: this.secret,
        ops: ops.map((op) =>
          op.type === "insert"
            ? { type: op.type, table: op.table, id: op.doc.id, doc: op.doc }
            : op.type === "patch"
              ? { type: op.type, table: op.table, id: op.id, expectedVersion: op.expectedVersion, patch: op.patch }
              : { type: op.type, table: op.table, id: op.id },
        ),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("CONFLICT")) throw conflict("This record was changed by someone else. Reload and try again.");
      throw e;
    }
  }
}
