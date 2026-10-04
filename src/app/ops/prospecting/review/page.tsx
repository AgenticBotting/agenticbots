import Link from "next/link";
import { PageHead, Panel, Table, FilterLinks, Empty } from "@/components/platform/ui";
import { ActionButton } from "@/components/platform/actions";
import { reviewRelationshipAction } from "../actions";
import { pageCtx, pct } from "../_lib";

export const metadata = { title: "Relationship review" };

const PAGE = 50;

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ tier?: string; page?: string }> }) {
  const { ctx } = await pageCtx();
  const sp = await searchParams;
  const tier = sp.tier ?? "A";
  const page = Math.max(0, Number.parseInt(sp.page ?? "0", 10) || 0);
  const [rels, niches, buyers] = await Promise.all([ctx.store.list("pg_relationships", { where: { status: "needs_review" } }), ctx.store.list("pg_niches"), ctx.store.list("pg_buyer_types")]);
  const n = new Map(niches.map((x) => [x.id, x]));
  const b = new Map(buyers.map((x) => [x.id, x]));
  const queue = rels
    .filter((r) => tier === "all" || n.get(r.nicheId)?.tier === tier)
    .sort((x, y) => (n.get(y.nicheId)?.attractiveness.total ?? 0) - (n.get(x.nicheId)?.attractiveness.total ?? 0) || y.confidence - x.confidence);
  const count = (t: string) => rels.filter((r) => t === "all" || n.get(r.nicheId)?.tier === t).length;
  const slice = queue.slice(page * PAGE, page * PAGE + PAGE);
  return (
    <>
      <PageHead title="Relationship review" description="Rule-proposed niche ↔ buyer links that were not confident enough (or are referral/consumer links) to approve automatically. Highest-value niches first. Your decision is final: rules never overwrite it and no model is re-run on it." />
      <FilterLinks current={tier} items={["A", "B", "C", "all"].map((t) => ({ key: t, label: t === "all" ? "All" : `Tier ${t}`, href: `/ops/prospecting/review?tier=${t}`, count: count(t) }))} />
      <Panel flush>
        <Table head={["Niche", "Buyer type", "Type", "Confidence", "Why", ""]} empty={<Empty title="Nothing to review" />}>
          {slice.map((r) => (
            <tr key={r.id}>
              <td><Link href={`/ops/prospecting/niches/${r.nicheId}`} className="font-semibold hover:underline">{n.get(r.nicheId)?.name}</Link> <span className="pf-muted">({n.get(r.nicheId)?.tier})</span></td>
              <td>{b.get(r.buyerTypeId)?.name}<div className="pf-small pf-muted">{b.get(r.buyerTypeId)?.buyerKind}</div></td>
              <td>{r.relationshipType}</td>
              <td className="num">{pct(r.confidence)}</td>
              <td className="pf-small">{r.reasoning.join(" ")}</td>
              <td>
                <div className="flex gap-1">
                  <ActionButton action={reviewRelationshipAction} hidden={{ relId: r.id, decision: "approve" }} label="Approve" />
                  <ActionButton action={reviewRelationshipAction} hidden={{ relId: r.id, decision: "reject" }} label="Reject" variant="ghost" />
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      <div className="flex gap-3 mt-3 pf-small">
        {page > 0 && <Link className="underline" href={`/ops/prospecting/review?tier=${tier}&page=${page - 1}`}>Previous</Link>}
        <span className="pf-muted">{queue.length === 0 ? 0 : page * PAGE + 1}–{Math.min(queue.length, (page + 1) * PAGE)} of {queue.length}</span>
        {(page + 1) * PAGE < queue.length && <Link className="underline" href={`/ops/prospecting/review?tier=${tier}&page=${page + 1}`}>Next</Link>}
      </div>
    </>
  );
}
