import Link from "next/link";
import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { clientRows } from "@/server/services/queries";
import { PageHead, Panel, Table, Empty } from "@/components/platform/ui";
import { Status } from "@/components/platform/status";
import { money, usd, ago } from "@/lib/platform/format";
import { can } from "@/server/auth/policy";
import { Bell, ClipboardList, Inbox, Plug } from "lucide-react";
import { Avatar, Card, Lights, MiniBars, toneFor, type Tone } from "@/components/platform/viz";

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

type Row = Awaited<ReturnType<typeof clientRows>>[number];

function edge(x: Row): Tone | undefined {
  if (x.paymentStatus === "past_due" || x.org.status === "suspended" || x.worstIncident === "critical" || x.worstIncident === "high") return "bad";
  if (x.openIncidents || x.integrationWarnings || (x.runtime && x.runtime.health !== "healthy")) return "watch";
  return undefined;
}

function ClientCard({ x }: { x: Row }) {
  const runs14 = x.runsDaily.reduce((a, b) => a + b, 0);
  return (
    <Card href={`/ops/clients/${x.org.id}`} tone={edge(x)}>
      <div className="head">
        <Avatar name={x.org.name} />
        <div className="min-w-0">
          <div className="title">{x.org.name}</div>
          <div className="sub">{x.org.industry ?? "Client"}</div>
        </div>
        <Status value={x.org.status} />
      </div>
      <div className="figs">
        <div><div className="k">Monthly value</div><div className="v">{x.agreement ? money(x.agreement.monthlyValueCents) : "—"}</div></div>
        <div><div className="k">Bots on</div><div className="v">{x.enabledBots}<span className="pf-muted text-[13px] font-medium">/{x.bots.length}</span></div></div>
        <div><div className="k">Est. cost (mo)</div><div className="v">{usd(x.estimatedCostUsd, 0)}</div></div>
      </div>
      <div>
        <div className="flex justify-between pf-small pf-muted mb-1.5"><span>Runs, last 14 days</span><span className="font-semibold text-[var(--foreground)]">{runs14}</span></div>
        <MiniBars values={x.runsDaily} label={`${runs14} runs in the last 14 days`} />
      </div>
      <Lights items={[
        { label: "Runtime", tone: x.runtime ? toneFor(x.runtime.health) : "quiet", title: x.runtime?.health ?? "not provisioned" },
        { label: "Billing", tone: toneFor(x.paymentStatus === "none" ? undefined : x.paymentStatus === "upcoming" ? "paid" : x.paymentStatus), title: x.paymentStatus.replace(/_/g, " ") },
        { label: "Integrations", tone: x.integrationWarnings ? "watch" : "good", title: x.integrationWarnings ? `${x.integrationWarnings} need attention` : "ok" },
      ]} />
      {(x.openApprovals > 0 || x.openRequests > 0 || x.integrationWarnings > 0 || x.openIncidents > 0) && (
        <div className="pf-badges">
          {x.openIncidents > 0 && <span className={`pf-badge ${x.worstIncident === "critical" || x.worstIncident === "high" ? "bad" : "watch"}`}><Bell aria-hidden="true" />{x.openIncidents} incident{x.openIncidents === 1 ? "" : "s"}</span>}
          {x.integrationWarnings > 0 && <span className="pf-badge watch"><Plug aria-hidden="true" />{x.integrationWarnings} integration</span>}
          {x.openApprovals > 0 && <span className="pf-badge"><ClipboardList aria-hidden="true" />{x.openApprovals} approval{x.openApprovals === 1 ? "" : "s"}</span>}
          {x.openRequests > 0 && <span className="pf-badge"><Inbox aria-hidden="true" />{x.openRequests} request{x.openRequests === 1 ? "" : "s"}</span>}
        </div>
      )}
      <div className="foot">
        {x.org.eligibleForReactivation && <span className="text-[var(--accent-text)] font-semibold">Eligible to reactivate</span>}
        <span>Last activity {x.org.lastActivityAt ? ago(x.org.lastActivityAt) : "never"}</span>
      </div>
    </Card>
  );
}

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string; f?: string; sort?: string; view?: string }> }) {
  const actor = await requireOperatorPage();
  const sp = await searchParams;
  const q = (sp.q ?? "").toLowerCase();
  const f = sp.f && FILTERS[sp.f] ? sp.f : "all";
  let rows = (await clientRows(await repo(), actor)).filter(FILTERS[f]).filter((x) => !q || x.org.name.toLowerCase().includes(q));
  if (sp.sort === "bots") rows = rows.sort((a, b) => b.enabledBots - a.enabledBots);
  if (sp.sort === "cost") rows = rows.sort((a, b) => b.estimatedCostUsd - a.estimatedCostUsd);
  if (sp.sort === "attention") rows = rows.sort((a, b) => (edge(b) === "bad" ? 2 : edge(b) ? 1 : 0) - (edge(a) === "bad" ? 2 : edge(a) ? 1 : 0));

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
          <option value="attention">Sort: needs attention first</option>
        </select>
        {sp.view === "table" && <input type="hidden" name="view" value="table" />}
        <button className="btn btn-outline" type="submit">Apply</button>
        <nav className="pf-viewswitch ml-auto" aria-label="View">
          <Link href={`/ops/clients?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(f !== "all" ? { f } : {}), ...(sp.sort ? { sort: sp.sort } : {}) })}`} aria-current={sp.view !== "table" ? "page" : undefined}>Cards</Link>
          <Link href={`/ops/clients?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(f !== "all" ? { f } : {}), ...(sp.sort ? { sort: sp.sort } : {}), view: "table" })}`} aria-current={sp.view === "table" ? "page" : undefined}>Table</Link>
        </nav>
      </form>
      {sp.view !== "table" ? (
        rows.length === 0 ? <Panel><Empty title="No clients match" /></Panel> : <div className="pf-cards" style={{ "--min": "320px" } as React.CSSProperties}>{rows.map((x) => <ClientCard key={x.org.id} x={x} />)}</div>
      ) : (
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
      )}
    </>
  );
}
