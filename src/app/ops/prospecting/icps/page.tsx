import { PageHead, Panel, Empty } from "@/components/platform/ui";
import { ActionForm, SubmitButton } from "@/components/platform/actions";
import { US_STATES } from "@/server/prospecting/markets";
import { createIcpAction } from "../actions";
import { pageCtx } from "../_lib";

export const metadata = { title: "ICPs" };

export default async function IcpsPage() {
  const { ctx, L } = await pageCtx();
  const [icps, niches, buyers] = await Promise.all([ctx.store.list("pg_icps"), ctx.store.list("pg_niches"), ctx.store.list("pg_buyer_types")]);
  const nn = new Map(niches.map((n) => [n.id, n.name]));
  const bn = new Map(buyers.map((b) => [b.id, b.name]));
  const rows = icps.filter((i) => L.visible(i.orgId));
  const nicheOpts = niches.filter((n) => n.tier !== "C").sort((a, b) => a.tier.localeCompare(b.tier) || a.name.localeCompare(b.name));
  const buyerOpts = buyers.filter((b) => b.buyerKind !== "consumer").sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <PageHead title="Ideal customer profiles" description="Each client's targeting: which services, where, which buyers to prefer or exclude. Private to that client — never shared into the market graph." />
      <div className="pf-grid pf-grid-2">
        <div className="pf-grid">
          {!rows.length && <Empty title="No profiles yet">Create a profile to connect a client’s services, geography and preferred buyers.</Empty>}
          {rows.map(i=><article key={i.id} className="pf-card-x">
            <span className="oc-note">{L.orgs.get(i.orgId)} · Private targeting</span><h2 className="title">{i.name}</h2>
            <div className="oc-steps">
              <div><span className="n">01 · Services</span><p>{i.nicheIds.map(id=>nn.get(id)).join(", ") || "Not specified"}</p></div>
              <div><span className="n">02 · Territory</span><p>{i.geographies.map(g=>`${g.name}, ${g.state}`).join("; ") || "Not specified"}</p></div>
            </div>
            <div><h3 className="oc-field-label">Preferred buyers</h3><div className="oc-role-tags">{i.preferredBuyerTypeIds.length ? i.preferredBuyerTypeIds.map(id=><span key={id}>{bn.get(id) ?? "Buyer unavailable"}</span>) : <span>Any approved buyer</span>}</div></div>
            <details className="oc-buyer-details"><summary>Exclusions &amp; targeting notes</summary><p className="oc-note mt-3">Excluded buyers: {i.excludedBuyerTypeIds.map(id=>bn.get(id)).join(", ") || "None specified"}</p></details>
          </article>)}
        </div>
        <Panel title="New ICP">
          <ActionForm action={createIcpAction} resetOnSuccess>
            <label className="pf-label">Client<select name="orgId" className="field">{L.orgList.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
            <label className="pf-label">Name<input name="name" className="field" placeholder="Commercial re-roofs, South Florida" required /></label>
            <label className="pf-label">Niches <span className="hint">Hold Ctrl/⌘ to pick several. Tier A and B shown.</span>
              <select name="nicheIds" className="field" multiple size={6} required>{nicheOpts.map((n) => <option key={n.id} value={n.id}>{`${n.tier} · ${n.name}`}</option>)}</select>
            </label>
            <div className="pf-form-row">
              <label className="pf-label">Area type<select name="geo_kind" className="field"><option value="county">County</option><option value="city">City</option><option value="metro">Metro</option><option value="state">State</option></select></label>
              <label className="pf-label">Area name<input name="geo_name" className="field" placeholder="Broward County" required /></label>
              <label className="pf-label">State<select name="geo_state" className="field" defaultValue="FL">{[...US_STATES].sort().map((s) => <option key={s}>{s}</option>)}</select></label>
            </div>
            <label className="pf-label">Preferred buyer types (optional)<select name="preferred" className="field" multiple size={5}>{buyerOpts.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
            <label className="pf-label">Excluded buyer types (optional)<select name="excluded" className="field" multiple size={4}>{buyerOpts.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
            <label className="pf-label">Services (comma separated)<input name="services" className="field" placeholder="TPO re-roof, coatings, leak repair" /></label>
            <label className="pf-label">Private notes<textarea name="notes" className="field" rows={2} /></label>
            <div><SubmitButton>Save ICP</SubmitButton></div>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
