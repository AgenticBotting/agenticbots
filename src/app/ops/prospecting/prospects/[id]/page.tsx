import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead, Panel, Table, KV, When, Bar } from "@/components/platform/ui";
import { Status } from "@/components/platform/status";
import { ActionButton, ActionForm, SubmitButton } from "@/components/platform/actions";
import { usd } from "@/lib/platform/format";
import { AppError } from "@/server/errors";
import { getPrivate } from "@/server/prospecting/access";
import { activeSignals } from "@/server/prospecting/signals";
import { crmAction, outboundAction, outcomeAction, qualifyAction, rejectAction, runJobAction } from "../../actions";
import { pageCtx } from "../../_lib";

export const metadata = { title: "Prospect" };

const prov = (p: { provider: string; fetchedAt: string; confidence: number; demo: boolean }) =>
  `${p.provider}${p.demo ? " (demo)" : ""} · ${Math.round(p.confidence * 100)}% · ${p.fetchedAt.slice(0, 10)}`;

export default async function ProspectPage({ params }: { params: Promise<{ id: string }> }) {
  const { ctx, L } = await pageCtx();
  const { id } = await params;
  const p = await getPrivate(ctx.store, "pg_prospects", id, ctx.p).catch((e) => {
    if (e instanceof AppError && e.status === 404) notFound();
    throw e;
  });
  const [company, market, buyer, handoffs, outcomes, costs] = await Promise.all([
    ctx.store.get("pg_companies", p.companyId),
    ctx.store.get("pg_markets", p.marketId),
    p.buyerTypeId ? ctx.store.get("pg_buyer_types", p.buyerTypeId) : null,
    ctx.store.list("pg_handoffs", { orgId: p.orgId, where: { prospectId: p.id } }),
    ctx.store.list("pg_outcomes", { orgId: p.orgId, where: { prospectId: p.id } }),
    ctx.store.list("pg_cost_events", { where: { prospectId: p.id } }),
  ]);
  if (!company || !market) notFound();
  const [sources, roles, signals, contact] = await Promise.all([
    ctx.store.list("pg_company_sources", { where: { companyId: company.id } }),
    ctx.store.list("pg_company_people", { where: { companyId: company.id } }),
    activeSignals(ctx.store, company.id, ctx.now),
    p.primaryContactPointId ? ctx.store.get("pg_contact_points", p.primaryContactPointId) : null,
  ]);
  const people = new Map((await Promise.all(roles.map((r) => ctx.store.get("pg_people", r.personId)))).filter(Boolean).map((x) => [x!.id, x!]));
  const s = p.score;
  const loc = company.locations[0];
  return (
    <>
      <PageHead
        title={company.canonicalName}
        crumbs={[{ href: "/ops/prospecting/markets", label: "Markets" }, { href: `/ops/prospecting/markets/${market.id}`, label: market.name }]}
        description={`${L.orgs.get(p.orgId)} · ${buyer?.name ?? "Unclassified"} · ${[loc?.city, loc?.county, loc?.state].filter(Boolean).join(", ")}${company.demo ? " · demo data" : ""}`}
        actions={<Status value={p.status} />}
      />
      <div className="pf-grid pf-grid-2">
        <Panel title={s ? `Fit ${s.fit} · Timing ${s.timing} · Priority ${s.priority}` : "Not scored"} sub={s ? `${s.version}, scored ${s.scoredAt.slice(0, 10)}` : undefined}>
          {s && (
            <>
              <Table head={["Fit component", "Points", "", "Evidence"]}>
                {s.fitComponents.map((c) => (
                  <tr key={c.key}><td>{c.label}</td><td className="num">{c.points}/{c.max}</td><td style={{ width: 90 }}><Bar pct={(c.points / c.max) * 100} /></td><td className="pf-small">{c.evidence}{!c.observed && <span className="pf-muted"> (no evidence — scored 0)</span>}</td></tr>
                ))}
              </Table>
              <Table head={["Timing signal", "Points", "Evidence"]}>
                {s.timingComponents.map((c) => <tr key={c.key}><td>{c.label}</td><td className="num">{c.points}</td><td className="pf-small">{c.evidence}</td></tr>)}
              </Table>
            </>
          )}
          {p.qualification && (
            <p className="pf-small mt-3"><strong>{p.qualification.decision}</strong> by {p.qualification.decidedBy}: {p.qualification.reasons.join(" ")}</p>
          )}
        </Panel>
        <div className="pf-grid">
          <Panel title="Actions">
            <div className="flex flex-wrap gap-2">
              <ActionButton action={qualifyAction} hidden={{ prospectId: p.id }} label="Apply qualification rules" />
              <ActionButton action={runJobAction} hidden={{ orgId: p.orgId, prospectId: p.id, kind: "FIND_DECISION_MAKERS" }} label="Find decision makers" />
              <ActionButton action={runJobAction} hidden={{ orgId: p.orgId, prospectId: p.id, kind: "ENRICH_CONTACT" }} label="Find work email" />
              <ActionButton action={runJobAction} hidden={{ orgId: p.orgId, prospectId: p.id, kind: "VERIFY_CONTACT" }} label="Verify email" />
              <ActionButton action={crmAction} hidden={{ prospectId: p.id }} label="Queue for CRM" />
            </div>
            <ActionForm action={outboundAction} hidden={{ prospectId: p.id }} className="mt-4">
              <div className="pf-form-row">
                <label className="pf-label">Sequence<input name="sequenceKey" className="field" defaultValue="default" /></label>
              </div>
              <label className="pf-small flex gap-2 items-center"><input type="checkbox" name="allowCatchAll" /> Allow a catch-all address (I checked it)</label>
              <label className="pf-small flex gap-2 items-center"><input type="checkbox" name="overrideSoft" /> Override SOFT suppressions (hard ones always block)</label>
              <div><SubmitButton>Send to outbound</SubmitButton></div>
            </ActionForm>
            <details className="pf-disclosure mt-4">
              <summary>Override qualification</summary>
              <div className="body">
                <ActionForm action={qualifyAction} hidden={{ prospectId: p.id }}>
                  <label className="pf-label">Decision<select name="decision" className="field"><option value="qualified">Qualified</option><option value="review">Review</option><option value="rejected">Rejected</option></select></label>
                  <label className="pf-label">Reason<input name="reason" className="field" required /></label>
                  <div><SubmitButton variant="outline">Record decision</SubmitButton></div>
                </ActionForm>
                <ActionForm action={rejectAction} hidden={{ prospectId: p.id }} className="mt-3">
                  <label className="pf-label">Reject — reason<input name="reason" className="field" required /></label>
                  <div><SubmitButton variant="ghost">Reject</SubmitButton></div>
                </ActionForm>
              </div>
            </details>
          </Panel>
          <Panel title="Decision makers">
            <Table head={["Person", "Title", "Role family", "Source"]}>
              {roles.map((r) => (
                <tr key={r.id}>
                  <td>{people.get(r.personId)?.fullName}{p.decisionMakerIds.includes(r.id) && <span className="pf-tag accent ml-1">chosen</span>}</td>
                  <td>{r.title}</td>
                  <td className="pf-small">{r.roleFamily.replace(/_/g, " ")} · {r.seniority.replace(/_/g, " ")}</td>
                  <td className="pf-small pf-muted">{prov(r.provenance)}</td>
                </tr>
              ))}
            </Table>
            {contact && <KV rows={[["Work email", contact.value], ["Status", <Status key="s" value={contact.status.toLowerCase()} label={contact.status} />], ["Found by", `${contact.method} · ${prov(contact.provenance)}`], ["Verified", contact.verifiedAt ? contact.verifiedAt.slice(0, 10) : "Not verified"]]} />}
          </Panel>
        </div>
      </div>
      <div className="pf-grid pf-grid-2">
        <Panel title="Company record" sub="Shared market intelligence — every fact has a source">
          <KV rows={[
            ["Domain", company.domain],
            ["Website", company.website],
            ["Size", [company.employeeRange && `${company.employeeRange} employees`, company.locationCount && `${company.locationCount} locations`, company.portfolioSize && `${company.portfolioSize} properties`].filter(Boolean).join(" · ") || undefined],
            ["Also known as", company.aliases.join(", ") || undefined],
            ["Identity confidence", `${Math.round(company.identityConfidence * 100)}%`],
            ["First seen", company.firstSeenAt.slice(0, 10)],
          ]} />
          <Table head={["Source record", "Matched by", "Facts"]}>
            {sources.map((x) => <tr key={x.id}><td className="pf-small">{prov(x.provenance)}</td><td>{x.matchMethod}</td><td className="pf-small">{Object.entries(x.facts).filter(([, v]) => v !== null).slice(0, 6).map(([k, v]) => `${k}: ${v}`).join(" · ")}</td></tr>)}
          </Table>
        </Panel>
        <div className="pf-grid">
          <Panel title="Why now" sub="Observed signals only">
            {signals.length === 0 ? <p className="pf-small pf-muted">No observed signal.</p> : (
              <Table head={["Signal", "Observed", "Source"]}>
                {signals.map((x) => <tr key={x.id}><td>{x.summary}</td><td>{x.observedAt.slice(0, 10)}</td><td className="pf-small pf-muted">{prov(x.provenance)}</td></tr>)}
              </Table>
            )}
          </Panel>
          <Panel title="Handoffs and outcomes">
            <Table head={["Handoff", "Status", "When", "Notes"]}>
              {handoffs.map((h) => <tr key={h.id}><td>{h.provider}{h.demo ? " (demo)" : ""}</td><td><Status value={h.status} /></td><td><When iso={h.createdAt} /></td><td className="pf-small">{h.policyViolations.join(" ")}</td></tr>)}
            </Table>
            <Table head={["Outcome", "Value", "When"]}>
              {outcomes.map((o) => <tr key={o.id}><td>{o.stage.replace(/_/g, " ")}</td><td>{o.valueCents !== undefined ? usd(o.valueCents / 100, 0) : "—"}</td><td><When iso={o.occurredAt} /></td></tr>)}
            </Table>
            <ActionForm action={outcomeAction} hidden={{ prospectId: p.id }} className="mt-3">
              <div className="pf-form-row">
                <label className="pf-label">Outcome<select name="stage" className="field">{["contacted", "replied", "positive_reply", "meeting", "quote", "opportunity", "won", "lost"].map((x) => <option key={x} value={x}>{x.replace(/_/g, " ")}</option>)}</select></label>
                <label className="pf-label">Value $ (optional)<input name="value" className="field" inputMode="decimal" /></label>
              </div>
              <div><SubmitButton variant="outline">Record outcome</SubmitButton></div>
            </ActionForm>
            <p className="pf-small pf-muted mt-2">Data cost for this prospect: {usd(costs.reduce((a, c) => a + c.costUsd, 0))} across {costs.length} calls. <Link className="underline" href="/ops/prospecting/providers">Provider usage</Link></p>
          </Panel>
        </div>
      </div>
    </>
  );
}
