import "server-only";
import type { Base, TableName, Tables } from "@/lib/platform/types";
import { APPEND_ONLY_TABLES } from "@/lib/platform/types";
import { newId, nowIso } from "@/server/ids";
import { conflict } from "@/server/errors";

/**
 * The storage boundary. Two implementations:
 *   - MemoryRepository  (demo mode + tests)
 *   - ConvexRepository  (staging/production, Convex already powers the site)
 *
 * All domain logic sits above this interface, so it runs identically
 * against both. Writes are expressed as a list of operations committed
 * atomically; every patch carries the version the caller read, so two
 * operators editing the same invoice cannot silently overwrite each other.
 */
export type Row = Base & Record<string, unknown>;

export type Op =
  | { type: "insert"; table: TableName; doc: Row }
  | { type: "patch"; table: TableName; id: string; expectedVersion: number; patch: Record<string, unknown> }
  | { type: "delete"; table: TableName; id: string };

export interface ListQuery<T> {
  orgId?: string;
  where?: Partial<T>;
  /** Sort by createdAt. Default: newest first. */
  order?: "asc" | "desc";
  limit?: number;
}

export interface Repository {
  get<K extends TableName>(table: K, id: string): Promise<Tables[K] | null>;
  list<K extends TableName>(table: K, query?: ListQuery<Tables[K]>): Promise<Tables[K][]>;
  commit(ops: Op[]): Promise<void>;
}

export function assertOpAllowed(op: Op): void {
  if (op.type === "delete" && APPEND_ONLY_TABLES.includes(op.table)) {
    throw conflict(`Records in ${op.table} are never deleted. Record a correction instead.`);
  }
}

export function matches<T>(row: T, where?: Partial<T>): boolean {
  if (!where) return true;
  for (const [k, v] of Object.entries(where)) {
    if (v === undefined) continue;
    if ((row as Record<string, unknown>)[k] !== v) return false;
  }
  return true;
}

export function sortRows<T extends { createdAt: string }>(rows: T[], order: "asc" | "desc" = "desc"): T[] {
  return rows.sort((a, b) =>
    order === "asc" ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt),
  );
}

/** Apply a patch: null deletes the key, version increments. */
export function applyPatch(row: Row, patch: Record<string, unknown>): Row {
  const next: Record<string, unknown> = { ...row };
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) delete next[k];
    else next[k] = v;
  }
  next.version = (row.version ?? 0) + 1;
  return next as Row;
}

/** Strip undefined so both stores see identical shapes. */
export function clean<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

type NewDoc<K extends TableName> = Omit<Tables[K], "id" | "createdAt" | "updatedAt" | "version"> & {
  id?: string;
  createdAt?: string;
};

/**
 * Unit of work: collect inserts and patches, then commit once.
 *
 *   const tx = new Tx(repo);
 *   const p = tx.insert("payments", {...});
 *   tx.patch("invoices", invoice, { amountPaidCents: ... });
 *   await tx.commit();
 */
export class Tx {
  private ops: Op[] = [];
  constructor(private readonly repo: Repository) {}

  insert<K extends TableName>(table: K, doc: NewDoc<K>): Tables[K] {
    const ts = nowIso();
    const row = clean({
      ...doc,
      id: doc.id ?? newId(),
      createdAt: doc.createdAt ?? ts,
      updatedAt: ts,
      version: 1,
    }) as unknown as Tables[K];
    this.ops.push({ type: "insert", table, doc: row as unknown as Row });
    return row;
  }

  patch<K extends TableName>(table: K, current: Tables[K], changes: Partial<Tables[K]>): Tables[K] {
    // An explicit `undefined` means "clear this field"; it travels as null
    // (JSON drops undefined) and both stores delete the key on null.
    const patch: Record<string, unknown> = { updatedAt: nowIso() };
    for (const [k, v] of Object.entries(changes)) patch[k] = v === undefined ? null : v;
    this.ops.push({ type: "patch", table, id: current.id, expectedVersion: current.version, patch: clean(patch) });
    return applyPatch(current as unknown as Row, patch) as unknown as Tables[K] & { version: number };
  }

  delete(table: TableName, id: string): void {
    const op: Op = { type: "delete", table, id };
    assertOpAllowed(op);
    this.ops.push(op);
  }

  get size(): number {
    return this.ops.length;
  }

  async commit(): Promise<void> {
    if (this.ops.length === 0) return;
    const ops = this.ops;
    this.ops = [];
    await this.repo.commit(ops);
  }
}
