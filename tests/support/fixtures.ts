import { MemoryRepository } from "@/server/db/memory";
import { setRepoForTesting } from "@/server/db";
import { seedDemo } from "@/server/demo/seed";
import { actorFrom } from "@/server/auth/session";
import type { Actor } from "@/server/auth/policy";
import type { Repository } from "@/server/db/repository";

/** A freshly seeded demo world per test file. */
export async function world() {
  const r = new MemoryRepository();
  setRepoForTesting(r);
  await seedDemo(r);
  const users = await r.list("users");
  const orgs = await r.list("organizations");
  const memberships = await r.list("memberships");
  const as = (email: string): Actor => {
    const u = users.find((x) => x.email === email)!;
    return actorFrom(u, memberships.filter((m) => m.userId === u.id));
  };
  const org = (slug: string) => orgs.find((o) => o.slug === slug)!;
  return {
    r: r as Repository,
    mem: r,
    admin: as("admin@agenticbots.demo"),
    operator: as("operator@agenticbots.demo"),
    owner: as("owner@acmeroofing.demo"),
    member: as("staff@acmeroofing.demo"),
    acme: org("acme-roofing"),
    bayside: org("bayside-plumbing"),
    coastal: org("coastal-air"),
  };
}

export const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));
