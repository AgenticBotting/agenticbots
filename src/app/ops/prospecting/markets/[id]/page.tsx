import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead, Panel, Table, Empty, When, KV, Banner } from "@/components/platform/ui";
import { Kpi, KpiRow } from "@/components/platform/viz";
import { Status } from "@/components/platform/status";
import { ActionButton, ActionForm, SubmitButton } from "@/components/platform/actions";
import { usd } from "@/lib/platform/format";
import { AppError } from "@/server/errors";
import { getPrivate } from "@/server/prospecting/access";
import { marketCoverage } from "@/server/prospecting/markets";
import { listProspects } from "@/server/prospecting/prospects";
import { approveJobAction, cancelJobAction, runJobAction, setEstimateAction } from "../../actions";
import { pageCtx } from "../../_lib";

export const metadata = { title: "Market" };

export default async function MarketPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string }> }) {
  const { ctx, L } = await pageCtx();
  const { id } = await params;
  const sp = await searchParams;
  const m = await getPrivate(ctx.store, "pg_markets", id, ctx.p).catch((e) => {
    if (e instanceof AppError && e.status === 404) notFound();
    throw e;
  });
  const [cov, prospects, niche, jobs, companies, buyers] = await Promise.all([
    marketCoverage(ctx, m.id),
    listProspects(ctx, m.orgId, { marketId: m.id }),
    ctx.store.get("pg_niches", m.nicheId),
    ctx.store.list("pg_jobs", { orgId: m.orgId }),
    ctx.store.list("pg_companies"),
    ctx.store.list("pg_buyer_types"),
  ]);
  const co = new Map(companies.map((c) => [c.id, c]));
  const bn = new Map(buyers.map((b) => [b.id, b.name]));
  const myJobs = jobs.filter((j) => j.marketId === m.id).slice(0, 8);
  const status = sp.status ?? "all";
  const shown = prospects.filter((p) => status === "all" || p.status === status);
  const o = cov.observed;
  const paused = myJobs.find((j) => j.status === "paused");
  return (
    <>
      <PageHead
        title={m.name}
        crumbs={[{ href: "/ops/prospecting/markets", label: "Markets" }]}
        description={`${L.orgs.get(m.orgId)} · ${niche?.name} (Tier ${niche?.tier}) · ${m.geography.name}, ${m.geography.state}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <ActionButton action={runJobAction} hidden={{ orgId: m.orgId, marketId: m.id, kind: "DISCOVER_MARKET" }} label="Run discovery" pendingLabel="Discovering…" variant="primary" />
            <ActionButton action={runJobAction} hidden={{ orgId: m.orgId, marketId: m.id, kind: "RESCORE_PROSPECTS" }} label="Rescore" />
            <ActionButton action={runJobAction} hidden={{ orgId: m.orgId, marketId: m.id, kind: "EXPORT_TO_OUTBOUND" }} label="Send qualified to outbound" />
          </div>
        }
      />
      {paused && (
        <Banner tone="watch" action={
          <ActionForm action={approveJobAction} hidden={{ jobId: paused.id }} className="flex flex-row items-end gap-2">
            <label className="pf-label">Add $<input name="usd" className="field" defaultValue="5" style={{ width: 80 }} /></label>
            <label className="pf-label">Add calls<input name="calls" className="field" defaultValue="50" style={{ width: 80 }} /></label>
            <SubmitButton variant="outline">Approve and continue</SubmitButton>
          </ActionForm>
        }>A job is paused: {paused.pausedReason}</Banner>
      )}
      <KpiRow cols={6}>
        <Kpi value={o.companies} label="Companies found" hint="Observed" />
        <Kpi value={o.withDecisionMaker} label="With decision maker" hint="Observed" />
        <Kpi value={o.verified} label="Verified emails" hint={`${o.withContact} with any email`} />
        <Kpi value={o.qualified} label="Qualified" hint={`${o.inReview} in review`} />
        <Kpi value={o.sentToOutbound} label="Sent to outbound" />
        <Kpi value={cov.estimate ? cov.estimate.count.toLocaleString() : "—"} label="Universe (Estimated)" hint={cov.estimate ? "See method below" : "Not estimated"} />
      </KpiRow>
      <div className="pf-grid pf-grid-2">
        <Panel title="Coverage by buyer type" sub={cov.exhaustion.note}>
          <Table head={["Buyer type", "Found", "Qualified", "Sources"]}>
            {cov.byBuyerType.map((b) => (
              <tr key={b.buyerTypeId}>
                <td>{b.name}</td>
                <td className="num">{b.companies}</td>
                <td className="num">{b.qualified}</td>
                <td className="pf-small">{b.sources.length === 0 ? <span className="pf-muted">Not run</span> : b.sources.map((s) => `${s.provider}: ${s.companiesSeen} seen, ${s.exhausted ? "exhausted" : "more available"}`).join("; ")}</td>
              </tr>
            ))}
          </Table>
          <p className="pf-small pf-muted mt-2">{cov.methodology}</p>
        </Panel>
        <div className="pf-grid">
          <Panel title="Jobs" flush>
            <Table head={["Job", "Status", "Progress", "Paid calls", "Spend", ""]} empty={<Empty title="No jobs yet" />}>
              {myJobs.map((j) => (
                <tr key={j.id}>
                  <td>{j.kind.replace(/_/g, " ").toLowerCase()}<div className="pf-small pf-muted"><When iso={j.createdAt} /></div></td>
                  <td><Status value={j.status} />{(j.error || j.pausedReason) && <div className="pf-small pf-muted">{j.error ?? j.pausedReason}</div>}</td>
                  <td>{j.progress.done}/{j.progress.total}</td>
                  <td className="num">{j.paidCalls}/{j.limits.maxPaidCalls}</td>
                  <td className="num">{usd(j.spendUsd)}</td>
                  <td>{["queued", "running", "paused"].includes(j.status) && <ActionButton action={cancelJobAction} hidden={{ jobId: j.id }} label="Cancel" variant="ghost" />}</td>
                </tr>
              ))}
            </Table>
          </Panel>
          <Panel title="Universe estimate" sub="Optional. Only shown if you record how it was estimated.">
            {cov.estimate && <KV rows={[["Estimated", cov.estimate.count.toLocaleString()], ["Method", cov.estimate.methodology], ["Recorded", <When key="w" iso={cov.estimate.estimatedAt} />]]} />}
            <ActionForm action={setEstimateAction} hidden={{ marketId: m.id }}>
              <div className="pf-form-row">
                <label className="pf-label">Count<input name="count" className="field" inputMode="numeric" required /></label>
              </div>
              <label className="pf-label">Methodology<textarea name="methodology" className="field" rows={2} placeholder="e.g. County parcel records: 1,240 multifamily parcels over 50 units, de-duplicated by owner" required /></label>
              <div><SubmitButton variant="outline">Record estimate</SubmitButton></div>
            </ActionForm>
          </Panel>
        </div>
      </div>
      <Panel title="Prospects" sub="Ranked by priority (0.6 × fit + 0.3 × timing + 0.1 × niche)" flush>
        <div className="px-4 pt-3 pb-1 flex gap-2 pf-small">
          {["all", "qualified", "review", "rejected", "sent_to_outbound"].map((s) => (
            <Link key={s} href={`/ops/prospecting/markets/${m.id}?status=${s}`} className="pf-chiplink" aria-current={s === status ? "true" : undefined}>{s.replace(/_/g, " ")}</Link>
          ))}
        </div>
        <Table head={["Company", "Buyer type", "Fit", "Timing", "Priority", "Why", "Status"]} empty={<Empty title="No prospects yet">Run discovery to find companies.</Empty>}>
          {shown.map((p) => {
            const c = co.get(p.companyId);
            return (
              <tr key={p.id}>
                <td><Link href={`/ops/prospecting/prospects/${p.id}`} className="font-semibold hover:underline">{c?.canonicalName ?? "?"}</Link><div className="pf-small pf-muted">{c?.locations[0]?.city}{c?.demo ? " · demo data" : ""}</div></td>
                <td className="pf-small">{p.buyerTypeId ? bn.get(p.buyerTypeId) : "—"}</td>
                <td className="num">{p.score?.fit ?? "—"}</td>
                <td className="num">{p.score?.timing ?? "—"}</td>
                <td className="num"><strong>{p.score?.priority ?? "—"}</strong></td>
                <td className="pf-small">{p.whyNow[0] ?? ""}</td>
                <td><Status value={p.status} /></td>
              </tr>
            );
          })}
        </Table>
      </Panel>
    </>
  );
}
