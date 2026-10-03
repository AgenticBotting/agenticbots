import Link from "next/link";
import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { clientRows } from "@/server/services/queries";
import { PageHead, Panel, Table, Empty } from "@/components/platform/ui";
import { Status } from "@/components/platform/status";
import { money, usd } from "@/lib/platform/format";
import { can } from "@/server/auth/policy";

export const metadata = { title: "Clients" };

const FILTERS: Record<string, (x: Awaited<ReturnType<typeof clientRows>>[number]) => boolean> = {
  all: () => true,
  active: (x) => x.org.status === "active",
  attention: (x) => x.openIncidents > 0 || x.integrationWarnings > 0 || x.paymentStatus === "past_due",
  past_due: (x) => x.paymentStatus === "past_due",
  suspended: (x) => x.org.status === "suspended",
  runtime: (x) => !!x.runtime && x.runtime.health !== "healthy",
  integrations: (x) => x.integrationWarnings > 0,
};

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string; f?: string; sort?: string }> }) {
  const actor = await requireOperatorPage();
  const sp = await searchParams;
  const q = (sp.q ?? "").toLowerCase();
  const f = sp.f && FILTERS[sp.f] ? sp.f : "all";
  let rows = (await clientRows(await repo(), actor)).filter(FILTERS[f]).filter((x) => !q || x.org.name.toLowerCase().includes(q));
  if (sp.sort === "bots") rows = rows.sort((a, b) => b.enabledBots - a.enabledBots);
  if (sp.sort === "cost") rows = rows.sort((a, b) => b.estimatedCostUsd - a.estimatedCostUsd);

  return (
    <>
      <PageHead
        title="Clients"
        description="Every client AgenticBots operates, with what is running, what is owed and what is wrong."
        actions={can(actor, "ops.clients.manage") ? <Link href="/ops/clients/new" className="btn btn-primary">New client</Link> : null}
      />
      <form className="pf-filters" role="search">
        <label className="sr-only" htmlFor="cq">Search clients</label>
        <input id="cq" name="q" defaultValue={sp.q} className="field" placeholder="Search by name" />
        <label className="sr-only" htmlFor="cf">Filter</label>
        <select id="cf" name="f" defaultValue={f} className="field">
          <option value="all">All clients</option>
          <option value="active">Active</option>
          <option value="attention">Needs attention</option>
          <option value="past_due">Billing: past due</option>
          <option value="suspended">Suspended</option>
          <option value="runtime">Runtime not healthy</option>
          <option value="integrations">Integration problem</option>
        </select>
        <label className="sr-only" htmlFor="cs">Sort</label>
        <select id="cs" name="sort" defaultValue={sp.sort ?? "name"} className="field">
          <option value="name">Sort: name</option>
          <option value="bots">Sort: Bot count</option>
          <option value="cost">Sort: est. cost</option>
        </select>
        <button className="btn btn-outline" type="submit">Apply</button>
      </form>
      <Panel flush>
        <Table head={["Client", "Account", "Agreement", "Payment", "Runtime", "Bots", "Approvals", "Requests", "Integrations", "Runs (mo)", "Est. cost (mo)", "Last activity", "Incidents"]} empty={<Empty title="No clients match" />}>
          {rows.map((x) => (
            <tr key={x.org.id}>
              <td><Link className="row-link" href={`/ops/clients/${x.org.id}`}>{x.org.name}</Link><div className="pf-small pf-muted">{x.org.industry}</div></td>
              <td><Status value={x.org.status} />{x.org.eligibleForReactivation && <div className="pf-small text-[var(--accent-text)]">eligible to reactivate</div>}</td>
              <td className="pf-small">{x.agreement ? <>{money(x.agreement.monthlyValueCents)}/mo<div><Status value={x.agreement.status} /></div></> : <span className="pf-muted">none</span>}</td>
              <td><Status value={x.paymentStatus} /></td>
              <td>{x.runtime ? <Status value={x.runtime.health} /> : <span className="pf-muted">—</span>}</td>
              <td className="num">{x.enabledBots}/{x.bots.length}</td>
              <td className="num">{x.openApprovals || "—"}</td>
              <td className="num">{x.openRequests || "—"}</td>
              <td className="num">{x.integrationWarnings ? <span className="text-[var(--color-danger)]">{x.integrationWarnings} warning</span> : "OK"}</td>
              <td className="num">{x.runsThisMonth}</td>
              <td className="num">{usd(x.estimatedCostUsd, 0)}</td>
              <td className="pf-small">{x.org.lastActivityAt ? new Date(x.org.lastActivityAt).toLocaleDateString() : "—"}</td>
              <td>{x.openIncidents ? <Status value={x.worstIncident} label={`${x.openIncidents} open`} /> : <span className="pf-muted">none</span>}</td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
