import "server-only";
import type { Tables } from "@/lib/platform/types";
import type { ProspectingTables } from "@/lib/prospecting/types";
import { Tx, type ListQuery, type Repository } from "@/server/db/repository";
import { normalizeDomain, normalizePhone } from "./identity";

/**
 * The Prospect Graph storage boundary.
 *
 * Every prospecting module reads and writes through this interface — never
 * through the platform repository directly (enforced by
 * tests/security/prospecting-boundary.test.ts). Today it is backed by the
 * platform repository (memory for demo/tests, Convex in production), which
 * is fine for V1 volumes: tens of thousands of companies, not hundreds of
 * millions.
 *
 * When the shared market-intelligence tables outgrow Convex, a
 * Postgres/S3-backed implementation replaces `PlatformGraphStore` for the
 * SHARED tables while the PRIVATE client tables (prospects, markets,
 * outcomes) stay in the control plane. Nothing above this file changes.
 */
export type PgTable = keyof ProspectingTables;

export interface ProspectGraphStore {
  get<K extends PgTable>(table: K, id: string): Promise<Tables[K] | null>;
  list<K extends PgTable>(table: K, q?: ListQuery<Tables[K]>): Promise<Tables[K][]>;
  /** A unit of work. Large batches are committed in chunks. */
  tx(): GraphTx;
  findCompanyByDomain(domain: string): Promise<Tables["pg_companies"] | null>;
  findCompanyByPhone(phone: string): Promise<Tables["pg_companies"] | null>;
  findCompaniesByName(normalizedName: string): Promise<Tables["pg_companies"][]>;
}

/** Convex mutations have per-transaction write limits; stay well under them. */
export const CHUNK = 150;

export class GraphTx {
  private batches: Tx[] = [];
  private current: Tx;
  constructor(private readonly repo: Repository) {
    this.current = new Tx(repo);
    this.batches.push(this.current);
  }
  private room(): Tx {
    if (this.current.size >= CHUNK) {
      this.current = new Tx(this.repo);
      this.batches.push(this.current);
    }
    return this.current;
  }
  /** The platform Tx for audit entries (they go in the first batch). */
  get audit(): Tx {
    return this.batches[0];
  }
  insert<K extends PgTable>(table: K, doc: Parameters<Tx["insert"]>[1] & Partial<Tables[K]>): Tables[K] {
    return this.room().insert(table, doc as never) as Tables[K];
  }
  patch<K extends PgTable>(table: K, current: Tables[K], changes: Partial<Tables[K]>): Tables[K] {
    return this.room().patch(table, current, changes);
  }
  delete(table: PgTable, id: string): void {
    this.room().delete(table, id);
  }
  get size(): number {
    return this.batches.reduce((s, b) => s + b.size, 0);
  }
  /**
   * Commits batch by batch. Each batch is atomic; a multi-batch import is
   * idempotent by design (stable ids), so a retry after a partial failure
   * converges instead of duplicating.
   */
  async commit(): Promise<void> {
    for (const b of this.batches) await b.commit();
    this.batches = [new Tx(this.repo)];
    this.current = this.batches[0];
  }
}

export class PlatformGraphStore implements ProspectGraphStore {
  constructor(private readonly repo: Repository) {}
  get<K extends PgTable>(table: K, id: string) {
    return this.repo.get(table, id);
  }
  list<K extends PgTable>(table: K, q?: ListQuery<Tables[K]>) {
    return this.repo.list(table, q);
  }
  tx(): GraphTx {
    return new GraphTx(this.repo);
  }
  async findCompanyByDomain(domain: string) {
    const d = normalizeDomain(domain);
    if (!d) return null;
    return (await this.repo.list("pg_companies", { where: { domain: d } }))[0] ?? null;
  }
  async findCompanyByPhone(phone: string) {
    const p = normalizePhone(phone);
    if (!p) return null;
    return (await this.repo.list("pg_companies", { where: { phone: p } }))[0] ?? null;
  }
  async findCompaniesByName(normalizedName: string) {
    return this.repo.list("pg_companies", { where: { normalizedName } });
  }
}

export const graphOf = (r: Repository): ProspectGraphStore => new PlatformGraphStore(r);
