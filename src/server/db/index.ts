import "server-only";
import { join } from "node:path";
import type { Repository } from "./repository";
import { MemoryRepository } from "./memory";
import { ConvexRepository } from "./convex";
import { storeKind, isDemo } from "@/server/env";

/**
 * One repository per server process. Kept on globalThis so Next's dev
 * hot-reload does not wipe demo state on every save.
 */
const g = globalThis as unknown as { __abRepo?: Repository; __abSeeding?: Promise<void>; __abHydrated?: boolean };

export async function repo(): Promise<Repository> {
  if (!g.__abRepo) {
    if (storeKind() === "memory") {
      const persist = isDemo() && process.env.DEMO_PERSIST !== "false"
        ? process.env.DEMO_STATE_FILE ?? join(process.cwd(), ".platform-data", "demo-state.json")
        : undefined;
      g.__abRepo = new MemoryRepository(persist);
    } else {
      g.__abRepo = new ConvexRepository();
    }
  }
  const r = g.__abRepo;
  if (isDemo() && r instanceof MemoryRepository && !r.isEmpty() && !g.__abHydrated) {
    g.__abHydrated = true;
    const { hydrateDemoRuntime } = await import("@/server/demo/seed");
    hydrateDemoRuntime(await r.list("runtimes"), await r.list("bots"));
  }
  if (isDemo() && r instanceof MemoryRepository && r.isEmpty()) {
    g.__abSeeding ??= import("@/server/demo/seed").then((m) => m.seedDemo(r)).finally(() => {
      g.__abSeeding = undefined;
    });
    await g.__abSeeding;
  }
  return r;
}

/** Tests inject their own repository. */
export function setRepoForTesting(r: Repository | undefined): void {
  g.__abRepo = r;
}

/** Demo-only: wipe and reseed. */
export async function resetDemoData(): Promise<void> {
  if (!isDemo()) throw new Error("Demo reset is only available in demo mode.");
  const r = await repo();
  if (r instanceof MemoryRepository) {
    r.reset();
    const { seedDemo } = await import("@/server/demo/seed");
    await seedDemo(r);
  }
}
