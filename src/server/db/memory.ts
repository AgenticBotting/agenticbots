import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { TableName, Tables } from "@/lib/platform/types";
import { TABLE_NAMES } from "@/lib/platform/types";
import {
  applyPatch,
  assertOpAllowed,
  matches,
  sortRows,
  type ListQuery,
  type Op,
  type Repository,
  type Row,
} from "./repository";
import { conflict } from "@/server/errors";

type Store = Record<TableName, Map<string, Row>>;

function emptyStore(): Store {
  return Object.fromEntries(TABLE_NAMES.map((t) => [t, new Map()])) as Store;
}

/**
 * In-process store for demo mode and tests.
 *
 * `persistPath` (optional) writes the whole state to a JSON file after
 * every commit, so a local demo survives a dev-server restart. It is a
 * convenience for one machine, not a database: on serverless hosts each
 * instance has its own copy.
 */
export class MemoryRepository implements Repository {
  private store: Store = emptyStore();

  constructor(private readonly persistPath?: string) {
    if (persistPath && existsSync(persistPath)) {
      try {
        const raw = JSON.parse(readFileSync(persistPath, "utf8")) as Record<string, Row[]>;
        for (const t of TABLE_NAMES) {
          for (const row of raw[t] ?? []) this.store[t].set(row.id, row);
        }
      } catch {
        // A corrupt demo file is simply discarded; the seed runs again.
        this.store = emptyStore();
      }
    }
  }

  isEmpty(): boolean {
    return this.store.organizations.size === 0 && this.store.users.size === 0;
  }

  reset(): void {
    this.store = emptyStore();
    this.persist();
  }

  async get<K extends TableName>(table: K, id: string): Promise<Tables[K] | null> {
    const row = this.store[table].get(id);
    return row ? (structuredClone(row) as unknown as Tables[K]) : null;
  }

  async list<K extends TableName>(table: K, q: ListQuery<Tables[K]> = {}): Promise<Tables[K][]> {
    let rows = [...this.store[table].values()] as unknown as Tables[K][];
    if (q.orgId !== undefined) rows = rows.filter((r) => (r as { orgId?: string }).orgId === q.orgId);
    rows = rows.filter((r) => matches(r, q.where));
    rows = sortRows(rows as (Tables[K] & { createdAt: string })[], q.order);
    if (q.limit) rows = rows.slice(0, q.limit);
    return structuredClone(rows);
  }

  async commit(ops: Op[]): Promise<void> {
    // Validate everything first so a failing op leaves no partial writes.
    const staged = new Map<string, Row | null>();
    const key = (t: string, id: string) => `${t}\u0000${id}`;
    const current = (t: TableName, id: string): Row | undefined => {
      const k = key(t, id);
      if (staged.has(k)) return staged.get(k) ?? undefined;
      return this.store[t].get(id);
    };
    for (const op of ops) {
      assertOpAllowed(op);
      if (op.type === "insert") {
        if (current(op.table, op.doc.id)) throw conflict(`Duplicate id in ${op.table}.`);
        staged.set(key(op.table, op.doc.id), structuredClone(op.doc));
      } else if (op.type === "patch") {
        const row = current(op.table, op.id);
        if (!row) throw conflict(`Record no longer exists in ${op.table}.`);
        if (row.version !== op.expectedVersion) {
          throw conflict("This record was changed by someone else. Reload and try again.");
        }
        staged.set(key(op.table, op.id), applyPatch(row, op.patch));
      } else {
        staged.set(key(op.table, op.id), null);
      }
    }
    for (const [k, row] of staged) {
      const [t, id] = k.split("\u0000") as [TableName, string];
      if (row === null) this.store[t].delete(id);
      else this.store[t].set(id, row);
    }
    this.persist();
  }

  private persist(): void {
    if (!this.persistPath) return;
    try {
      mkdirSync(dirname(this.persistPath), { recursive: true });
      const out = Object.fromEntries(TABLE_NAMES.map((t) => [t, [...this.store[t].values()]]));
      writeFileSync(this.persistPath, JSON.stringify(out));
    } catch {
      // Read-only filesystems (serverless) keep state in memory only.
    }
  }
}
