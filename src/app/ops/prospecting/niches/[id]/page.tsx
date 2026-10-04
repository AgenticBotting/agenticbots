import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead, Panel, Table, KV, Bar } from "@/components/platform/ui";
import { Status } from "@/components/platform/status";
import { ActionButton } from "@/components/platform/actions";
import { COMPONENT_LABELS } from "@/server/prospecting/ontology/niche-scoring";
import { packsForNiche } from "@/server/prospecting/ontology/packs";
import { recipesForBuyer } from "@/server/prospecting/ontology/discovery-recipes";
import { reviewRelationshipAction } from "../../actions";
import { pageCtx, pct } from "../../_lib";

export const metadata = { title: "Niche" };

export default async function NichePage({ params }: { params: Promise<{ id: string }> }) {
  const { ctx } = await pageCtx();
  const { id } = await params;
  const niche = await ctx.store.get("pg_niches", id);
  if (!niche) notFound();
  const [rels, buyers] = await Promise.all([ctx.store.list("pg_relationships", { where: { nicheId: id } }), ctx.store.list("pg_buyer_types")]);
  const byId = new Map(buyers.map((b) => [b.id, b]));
  const sorted = rels.sort((a, b) => a.priority - b.priority || b.confidence - a.confidence);
  const a = niche.attractiveness;
  const packs = packsForNiche(niche.tags);
  const recipes = [...new Map(sorted.filter((r) => r.status !== "rejected").slice(0, 10).flatMap((r) => { const b = byId.get(r.buyerTypeId); return b ? recipesForBuyer(b) : []; }).map((x) => [x.key, x])).values()];
  return (
    <>
      <PageHead
        title={niche.name}
        crumbs={[{ href: "/ops/prospecting/niches", label: "Niches" }]}
        description={`${niche.category} · sells to ${niche.sellsTo} · Tier ${niche.tier} · modeled score ${a.total}/100 (confidence ${pct(a.confidence)}, ${a.version})`}
      />
      <div className="pf-grid pf-grid-2">
        <Panel title="Why this score" sub="Modeled components, 0–10 each, weighted">
          <Table head={["Component", "Value", "", "Weight"]}>
            {Object.entries(a.components).sort((x, y) => (a.weights[y[0]] ?? 0) - (a.weights[x[0]] ?? 0)).map(([k, v]) => (
              <tr key={k}><td>{COMPONENT_LABELS[k] ?? k}</td><td className="num">{v}</td><td style={{ width: 110 }}><Bar pct={v * 10} /></td><td className="num">{a.weights[k]}</td></tr>
            ))}
          </Table>
          <ul className="mt-3 list-disc pl-5 pf-small">{a.reasoning.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </Panel>
        <div className="pf-grid">
          <Panel title="Profile">
            <KV rows={[
              ["Tags", niche.tags.map((t) => <span key={t} className="pf-tag mr-1 mb-1">{t.replace(/_/g, " ")}</span>)],
              ["Vertical pack", packs.length ? packs.map((p) => p.label).join(", ") : "None"],
              ["Imported as", `${niche.original.category} / ${niche.original.niche} / ${niche.original.sellsTo}`],
            ]} />
          </Panel>
          {packs[0] && (
            <Panel title={`${packs[0].label} pack`} sub="Defaults any client ICP in this vertical starts from">
              <KV rows={[
                ["Project types", packs[0].projectTypes.join(", ")],
                ["Buying motions", packs[0].buyingMotions.join(", ").replace(/_/g, " ")],
                ["Recurring", packs[0].recurring],
                ["Signals to watch", packs[0].signals.join(", ").replace(/_/g, " ")],
                ["Outbound angles", packs[0].outboundAngles.join(" · ")],
                ["Qualification", `Fit ≥ ${packs[0].qualification.minFit}${packs[0].qualification.requireDecisionMaker ? ", decision maker required" : ""}`],
              ]} />
            </Panel>
          )}
          <Panel title="Where to find these buyers" sub="Discovery recipes (source classes, not vendors)">
            <ul className="pf-small space-y-1">{recipes.map((r) => <li key={r.key}><strong>{r.label}</strong> — {r.notes}</li>)}</ul>
          </Panel>
        </div>
      </div>
      <Panel title="Buyer relationships" sub={`${sorted.length} proposed by rules (no Cartesian product). Approve or reject; approved rows are never regenerated.`} flush>
        <Table head={["Buyer type", "Type", "Motion", "Confidence", "Priority", "Decision makers", "Status", ""]}>
          {sorted.map((r) => {
            const b = byId.get(r.buyerTypeId);
            return (
              <tr key={r.id}>
                <td><strong>{b?.name ?? "?"}</strong><div className="pf-small pf-muted">{b?.segment}</div></td>
                <td>{r.relationshipType}</td>
                <td>{r.buyingMotion.replace(/_/g, " ")}</td>
                <td className="num">{pct(r.confidence)}</td>
                <td className="num">{r.priority}</td>
                <td className="pf-small">{r.relevantDecisionMakerTitles.join(", ")}</td>
                <td><Status value={r.status} /></td>
                <td>
                  <div className="flex gap-1">
                    {r.status !== "approved" && <ActionButton action={reviewRelationshipAction} hidden={{ relId: r.id, decision: "approve" }} label="Approve" />}
                    {r.status !== "rejected" && <ActionButton action={reviewRelationshipAction} hidden={{ relId: r.id, decision: "reject" }} label="Reject" variant="ghost" />}
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </Panel>
      <p className="pf-small pf-muted mt-3"><Link href="/ops/prospecting/review" className="underline">Open the review queue</Link> to work through relationships that need a decision.</p>
    </>
  );
}
