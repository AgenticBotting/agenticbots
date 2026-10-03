import "server-only";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import type { TableName, Tables } from "@/lib/platform/types";
import { assertOpAllowed, matches, sortRows, type ListQuery, type Op, type Repository } from "./repository";
import { conflict, unavailable } from "@/server/errors";

/**
 * Production store: the Convex deployment the site already uses.
 * Calls go server-to-server with PLATFORM_SERVER_SECRET; nothing here is
 * reachable from a browser.
 */
export class ConvexRepository implements Repository {
  private client: ConvexHttpClient;
  private secret: string;

  constructor(url = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL, secret = process.env.PLATFORM_SERVER_SECRET) {
    if (!url) throw unavailable("Platform database is not configured (CONVEX_URL).");
    if (!secret || secret.length < 32) throw unavailable("Platform database secret is not configured.");
    this.client = new ConvexHttpClient(url);
    this.secret = secret;
  }

  async get<K extends TableName>(table: K, id: string): Promise<Tables[K] | null> {
    return (await this.client.query(anyApi.platform.get, { secret: this.secret, table, id })) as Tables[K] | null;
  }

  async list<K extends TableName>(table: K, q: ListQuery<Tables[K]> = {}): Promise<Tables[K][]> {
    let rows = (await this.client.query(anyApi.platform.list, {
      secret: this.secret,
      table,
      orgId: q.orgId,
    })) as Tables[K][];
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
