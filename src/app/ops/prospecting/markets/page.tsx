import Link from "next/link";
import { PageHead, Panel, Table, Empty, When } from "@/components/platform/ui";
import { Status } from "@/components/platform/status";
import { ActionForm, SubmitButton } from "@/components/platform/actions";
import { listMarkets, US_STATES } from "@/server/prospecting/markets";
import { createMarketAction } from "../actions";
import { pageCtx } from "../_lib";

export const metadata = { title: "Markets" };

export default async function MarketsPage() {
  const { ctx, L } = await pageCtx();
  const [markets, niches, icps, prospects] = await Promise.all([listMarkets(ctx), ctx.store.list("pg_niches"), ctx.store.list("pg_icps"), ctx.store.list("pg_prospects")]);
  const nicheOpts = niches.sort((a, b) => a.tier.localeCompare(b.tier) || b.attractiveness.total - a.attractiveness.total);
  const visibleIcps = icps.filter((i) => L.visible(i.orgId));
  return (
    <>
      <PageHead title="Markets" description="A market is one niche in one geography for one client, targeting the buyer types worth reaching. Private to that client." />
      <div className="pf-grid pf-grid-2">
        <Panel title="Client markets" flush>
          <Table head={["Market", "Client", "Buyer types", "Prospects", "Status", "Refreshed"]} empty={<Empty title="No markets yet" />}>
            {markets.map((m) => (
              <tr key={m.id}>
                <td><Link href={`/ops/prospecting/markets/${m.id}`} className="font-semibold hover:underline">{m.name}</Link></td>
                <td>{L.orgs.get(m.orgId)}</td>
                <td className="num">{m.buyerTypeIds.length}</td>
                <td className="num">{prospects.filter((p) => p.marketId === m.id).length}</td>
                <td><Status value={m.status} /></td>
                <td><When iso={m.lastRefreshedAt} /></td>
              </tr>
            ))}
          </Table>
        </Panel>
        <Panel title="New market" sub="Buyer types default to the niche's approved relationships, shaped by the ICP if you choose one.">
          <ActionForm action={createMarketAction}>
            <label className="pf-label">Client
              <select name="orgId" className="field" required>{L.orgList.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
            </label>
            <label className="pf-label">Service niche
              <select name="nicheId" className="field" required>
                {nicheOpts.map((n) => <option key={n.id} value={n.id}>{`Tier ${n.tier} · ${n.name} (${n.category})`}</option>)}
              </select>
            </label>
            <label className="pf-label">ICP (optional)
              <select name="icpId" className="field" defaultValue="">
                <option value="">None</option>
                {visibleIcps.map((i) => <option key={i.id} value={i.id}>{`${L.orgs.get(i.orgId)} · ${i.name}`}</option>)}
              </select>
            </label>
            <div className="pf-form-row">
              <label className="pf-label">Area type
                <select name="geo_kind" className="field" defaultValue="county">
                  <option value="county">County</option><option value="city">City</option><option value="metro">Metro</option><option value="state">State</option><option value="zip">ZIP codes</option>
                </select>
              </label>
              <label className="pf-label">Area name<input name="geo_name" className="field" placeholder="Broward County" required /></label>
              <label className="pf-label">State
                <select name="geo_state" className="field" defaultValue="FL">{[...US_STATES].sort().map((s) => <option key={s}>{s}</option>)}</select>
              </label>
            </div>
            <label className="pf-label">ZIP codes (optional)<input name="geo_zips" className="field" placeholder="33301, 33304" /></label>
            <div><SubmitButton>Create market</SubmitButton></div>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
