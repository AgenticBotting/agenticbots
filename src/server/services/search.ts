import "server-only";
import type { Repository } from "@/server/db/repository";
import { can, type Actor } from "@/server/auth/policy";

export interface SearchHit {
  kind: "client" | "bot" | "run" | "request" | "integration" | "incident" | "operator" | "invoice" | "payment";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

/** Operator search. Database-level substring match — enough for V1. */
export async function operatorSearch(r: Repository, actor: Actor, q: string): Promise<SearchHit[]> {
  const term = q.trim().toLowerCase();
  if (term.length < 2) return [];
  const has = (...vals: (string | undefined)[]) => vals.some((v) => v?.toLowerCase().includes(term));
  const [orgs, bots, runs, requests, integrations, incidents, users, invoices, payments] = await Promise.all([
    r.list("organizations"), r.list("bots"), r.list("runs", { limit: 500 }), r.list("requests"),
    r.list("integrations"), r.list("incidents"), r.list("users"), r.list("invoices"), r.list("payments"),
  ]);
  const visible = (orgId?: string) => !!orgId && can(actor, "ops.view", orgId);
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));
  const hits: SearchHit[] = [];
  for (const o of orgs) if (visible(o.id) && has(o.name, o.slug, o.tenantId)) hits.push({ kind: "client", id: o.id, title: o.name, subtitle: o.status, href: `/ops/clients/${o.id}` });
  for (const b of bots) if (visible(b.orgId) && has(b.name, b.typeKey, b.id)) hits.push({ kind: "bot", id: b.id, title: b.name, subtitle: orgName.get(b.orgId) ?? "", href: `/ops/bots/${b.id}` });
  for (const x of runs) if (visible(x.orgId) && has(x.id, x.runtimeRunId, x.correlationId, x.task)) hits.push({ kind: "run", id: x.id, title: x.task.slice(0, 80), subtitle: `${x.status} · ${orgName.get(x.orgId) ?? ""}`, href: `/ops/runs/${x.id}` });
  for (const x of requests) if (visible(x.orgId) && has(x.title, x.id)) hits.push({ kind: "request", id: x.id, title: x.title, subtitle: `${x.status} · ${orgName.get(x.orgId) ?? ""}`, href: `/ops/requests/${x.id}` });
  for (const x of integrations) if (visible(x.orgId) && has(x.displayName, x.provider)) hits.push({ kind: "integration", id: x.id, title: x.displayName, subtitle: `${x.status} · ${orgName.get(x.orgId) ?? ""}`, href: `/ops/integrations?client=${x.orgId}` });
  for (const x of incidents) if (visible(x.orgId) && has(x.title, x.correlationIds.join(" "))) hits.push({ kind: "incident", id: x.id, title: x.title, subtitle: `${x.severity} · ${x.status}`, href: `/ops/monitoring?incident=${x.id}` });
  for (const u of users) if (u.platformRole && has(u.name, u.email)) hits.push({ kind: "operator", id: u.id, title: u.name, subtitle: u.email, href: `/ops/settings` });
  for (const x of invoices) if (visible(x.orgId) && has(x.invoiceNumber, x.externalAccountingId)) hits.push({ kind: "invoice", id: x.id, title: x.invoiceNumber, subtitle: `${x.status} · ${orgName.get(x.orgId) ?? ""}`, href: `/ops/billing/invoices/${x.id}` });
  for (const x of payments) if (visible(x.orgId) && has(x.referenceNumber, x.id)) hits.push({ kind: "payment", id: x.id, title: x.referenceNumber ?? x.id.slice(0, 8), subtitle: `$${(x.amountCents / 100).toLocaleString()} · ${orgName.get(x.orgId) ?? ""}`, href: `/ops/billing/invoices/${x.invoiceId}` });
  return hits.slice(0, 50);
}
