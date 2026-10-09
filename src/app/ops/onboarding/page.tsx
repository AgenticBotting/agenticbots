import Link from "next/link";
import { AlertTriangle, CheckCircle2, Lock, Play, ShieldCheck } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/platform/actions";
import { Banner, Empty, KV, PageHead, Panel, Stat, Stats, Table, When } from "@/components/platform/ui";
import { Status } from "@/components/platform/status";
import { usd } from "@/lib/platform/format";
import type { ClientOnboarding, Organization } from "@/lib/platform/types";
import { can } from "@/server/auth/policy";
import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { asUser, ctxOf } from "@/server/prospecting/access";
import { compileOnboardingSummaryAction } from "./actions";

export const metadata = { title: "Onboarding" };

const SAMPLE = "Commercial roofer in Columbus, Ohio selling maintenance, repairs, coatings and reroofs to property managers, schools, industrial buildings, and multifamily owners.";

function joinOrDash(values: (string | undefined)[]): string {
  const v = values.filter(Boolean);
  return v.length ? v.join(", ") : "—";
}

function moneyOrDash(value?: number): string {
  return typeof value === "number" ? usd(value, 0) : "—";
}

function byOrgName(orgs: Organization[]): Map<string, string> {
  return new Map(orgs.map((o) => [o.id, o.name]));
}

function RecommendedBots({ plan }: { plan: ClientOnboarding }) {
  const recommended = plan.recommendedBotStack.filter((b) => b.status === "recommended");
  const optional = plan.recommendedBotStack.filter((b) => b.status === "optional");
  return (
    <div className="grid gap-3">
      <div>
        <div className="pf-small pf-muted mb-1">Recommended</div>
        <div className="pf-badges">{recommended.length ? recommended.map((b) => <span key={b.botType} className="pf-badge good">{b.botType.replace(/_/g, " ")} Bot</span>) : <span className="pf-muted">None yet</span>}</div>
      </div>
      <div>
        <div className="pf-small pf-muted mb-1">Optional</div>
        <div className="pf-badges">{optional.length ? optional.map((b) => <span key={b.botType} className="pf-badge">{b.botType.replace(/_/g, " ")} Bot</span>) : <span className="pf-muted">None</span>}</div>
      </div>
    </div>
  );
}

function ActionList({ title, items }: { title: string; items: ClientOnboarding["outstandingClientActions"] }) {
  return (
    <Panel title={title} flush>
      <Table head={["Action", "Status", "Blocks"]} empty={<Empty title="No open actions" />}>
        {items.map((item) => (
          <tr key={item.key}>
            <td><strong>{item.label}</strong>{item.reason && <div className="pf-small pf-muted">{item.reason}</div>}</td>
            <td><Status value={item.status} /></td>
            <td>{item.blocking ? "Yes" : "No"}</td>
          </tr>
        ))}
      </Table>
    </Panel>
  );
}

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ orgId?: string; onboardingId?: string }> }) {
  const actor = await requireOperatorPage();
  const r = await repo();
  const sp = await searchParams;
  const [allOrgs, allOnboardings] = await Promise.all([r.list("organizations", { order: "asc" }), r.list("client_onboardings")]);
  const orgs = allOrgs.filter((o) => can(actor, "ops.view", o.id));
  const manageable = orgs.filter((o) => can(actor, "ops.clients.manage", o.id));
  const onboardings = allOnboardings.filter((o) => can(actor, "ops.view", o.orgId));
  const selectedOrgId = sp.orgId && orgs.some((o) => o.id === sp.orgId) ? sp.orgId : manageable[0]?.id ?? orgs[0]?.id;
  const selected = (sp.onboardingId ? onboardings.find((o) => o.id === sp.onboardingId) : undefined)
    ?? onboardings.filter((o) => o.orgId === selectedOrgId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const ctx = ctxOf(r, asUser(actor));
  const [niches, buyers, icps, markets, marketBuilds] = await Promise.all([
    ctx.store.list("pg_niches"),
    ctx.store.list("pg_buyer_types"),
    ctx.store.list("pg_icps"),
    ctx.store.list("pg_markets"),
    ctx.store.list("pg_market_builds"),
  ]);
  const names = byOrgName(orgs);
  const nicheNames = new Map(niches.map((n) => [n.id, n.name]));
  const buyerNames = new Map(buyers.map((b) => [b.id, b.name]));
  const selectedIcps = selected ? icps.filter((i) => selected.recommendedIcpIds.includes(i.id)) : [];
  const selectedMarkets = selected ? markets.filter((m) => selected.recommendedMarkets.includes(m.id)) : [];
  const selectedBuilds = selected ? marketBuilds.filter((b) => selected.marketBuildIds.includes(b.id)) : [];
  const blockers = selected?.readinessBlockers ?? [];

  return (
    <>
      <PageHead
        title="Client onboarding"
        description="Type a short business summary and compile a draft ICP, market, Bot stack, integration checklist and deployment plan. Draft-only: this never provisions infrastructure or spends money."
      />
      <Banner tone="watch" action={<span className="pf-status quiet"><Lock aria-hidden="true" />Draft only</span>}>
        Onboarding compilation creates records and review checklists only. It does not connect OAuth, call paid vendors, send email, write a CRM or provision AWS.
      </Banner>

      <div className="oc-steps"><div><span className="n">01 · Business context</span><strong>Tell us the work</strong><p>Client, services, buyers and territory.</p></div><div><span className="n">02 · Draft configuration</span><strong>Build the plan</strong><p>Map BOTS, ideal buyers and required integrations.</p></div><div><span className="n">03 · Readiness</span><strong>Resolve blockers</strong><p>Review missing access and decisions before deployment.</p></div></div>
      <div className="pf-grid pf-grid-main">
        <Panel title="Compile from one sentence" sub="Use an existing client, then paste the business summary you would say on a sales call.">
          {manageable.length === 0 ? (
            <Empty title="No manageable clients" />
          ) : (
            <ActionForm action={compileOnboardingSummaryAction}>
              <label className="pf-label">
                Client
                <select name="orgId" className="field" defaultValue={selectedOrgId}>
                  {manageable.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </label>
              <label className="pf-label">
                Business summary
                <span className="hint">Keep it natural. Unknown details stay unknown and show up as review blockers.</span>
                <textarea name="summary" className="field" rows={5} required minLength={12} defaultValue={SAMPLE} />
              </label>
              <div className="pf-form-row">
                <label className="pf-label">
                  Service type
                  <select name="serviceType" className="field" defaultValue="">
                    <option value="">Infer from summary</option>
                    <option value="commercial">Commercial</option>
                    <option value="residential">Residential</option>
                    <option value="mixed">Mixed</option>
                    <option value="industrial">Industrial</option>
                    <option value="government">Government</option>
                  </select>
                </label>
                <label className="pf-label">
                  Minimum opportunity
                  <input name="minimumOpportunityUsd" className="field" inputMode="numeric" placeholder="$15,000" />
                </label>
                <label className="pf-label">
                  Implementation budget
                  <input name="implementationBudgetUsd" className="field" inputMode="numeric" placeholder="$2,500" />
                </label>
              </div>
              <div><SubmitButton pendingLabel="Compiling…"><Play aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />Compile plan</SubmitButton></div>
            </ActionForm>
          )}
        </Panel>

        <Panel title="Latest plan" sub={selected ? `${names.get(selected.orgId) ?? "Client"} · ${selected.compilerVersion}` : "Run the compiler to create a plan."}>
          {!selected ? (
            <Empty title="No onboarding plan yet" />
          ) : (
            <div className="grid gap-4">
              <Stats>
                <Stat value={<Status value={selected.stage} />} label="Stage" />
                <Stat value={<Status value={selected.readiness} />} label="Readiness" tone={selected.readiness === "ready_to_provision" ? undefined : "watch"} />
                <Stat value={blockers.length} label="Blockers" tone={blockers.length ? "watch" : undefined} />
              </Stats>
              <KV rows={[
                ["Classification", selected.classification?.primaryNicheName ?? "Needs review"],
                ["Vertical pack", selected.classification?.verticalPackLabel ?? "—"],
                ["Confidence", selected.classification ? `${Math.round(selected.classification.confidence * 100)}%` : "—"],
                ["Territory", joinOrDash(selected.intake.geographies.map((g) => `${g.name}, ${g.state}`))],
                ["Service type", selected.intake.serviceType ?? "unknown"],
                ["Budget status", selected.budgetPlan.status.replace(/_/g, " ")],
                ["Proposed data budget", moneyOrDash(selected.budgetPlan.proposedMaxUsd)],
                ["Last compiled", selected.lastCompiledAt ? <When iso={selected.lastCompiledAt} /> : "—"],
              ]} />
              {blockers.length > 0 && (
                <div className="pf-msg info">
                  <strong>Provisioning is blocked.</strong>
                  <ul className="mt-1 list-disc pl-5">
                    {blockers.map((b) => <li key={b}>{b}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>

      {selected && (
        <>
          <div className="pf-grid pf-grid-2 mt-4">
            <Panel title="Generated ICP and markets">
              <KV rows={[
                ["ICP records", selectedIcps.map((i) => i.name).join(", ") || "—"],
                ["Niches", joinOrDash(selectedIcps.flatMap((i) => i.nicheIds.map((id) => nicheNames.get(id))))],
                ["Buyer types", joinOrDash(selected.recommendedBuyerTypeIds.map((id) => buyerNames.get(id)))],
                ["Decision-maker families", selected.recommendedDecisionMakerRoleFamilies.join(", ") || "—"],
                ["Markets", selectedMarkets.map((m) => `${m.name} (${m.geography.name}, ${m.geography.state})`).join("; ") || "—"],
                ["MarketBuild drafts", selectedBuilds.map((b) => `${b.status.replace(/_/g, " ")} · max ${moneyOrDash(b.maxDataAcquisitionBudgetUsd)}`).join("; ") || "—"],
              ]} />
              <div className="pf-msg info mt-3">Market totals and TAM are intentionally blank until discovery runs. No estimate is generated here.</div>
            </Panel>
            <Panel title="Bot stack and integrations">
              <RecommendedBots plan={selected} />
              <Table head={["Integration", "Requirement", "Used by"]} empty={<Empty title="No integrations required" />}>
                {selected.integrationRequirements.map((i) => (
                  <tr key={i.provider}>
                    <td><strong>{i.displayName}</strong></td>
                    <td><Status value={i.requirement} tone={i.requirement === "required" ? "watch" : "quiet"} /></td>
                    <td className="pf-small">{i.botTypes.map((b) => `${b} Bot`).join(", ")}</td>
                  </tr>
                ))}
              </Table>
            </Panel>
          </div>

          <div className="pf-grid pf-grid-2 mt-4">
            <ActionList title="Client actions" items={selected.outstandingClientActions} />
            <ActionList title="Operator actions" items={selected.outstandingOperatorActions} />
          </div>

          <Panel title="Approval policy" className="mt-4" flush>
            <Table head={["Action", "Default policy", "Audience", "Why"]}>
              {selected.approvalPolicies.map((p) => (
                <tr key={`${p.action}-${p.audience}`}>
                  <td>{p.action.replace(/_/g, " ")}</td>
                  <td><Status value={p.defaultPolicy} tone={p.defaultPolicy === "prohibited" ? "bad" : p.defaultPolicy === "approval_required" ? "watch" : "good"} /></td>
                  <td>{p.audience}</td>
                  <td className="pf-small">{p.reasoning}</td>
                </tr>
              ))}
            </Table>
          </Panel>
        </>
      )}

      <Panel title="Recent onboarding plans" className="mt-4" flush>
        <Table head={["Client", "Stage", "Readiness", "Niche", "Bots", "ICP", "Updated"]} empty={<Empty title="No onboarding plans yet" />}>
          {onboardings.slice(0, 12).map((o) => (
            <tr key={o.id}>
              <td><Link className="row-link" href={`/ops/onboarding?orgId=${o.orgId}&onboardingId=${o.id}`}>{names.get(o.orgId) ?? "Client"}</Link></td>
              <td><Status value={o.stage} /></td>
              <td><Status value={o.readiness} /></td>
              <td>{o.classification?.primaryNicheName ?? "—"}{o.classification?.reviewRequired && <span className="ml-2"><AlertTriangle aria-label="Needs review" className="inline h-3.5 w-3.5 text-[var(--color-caution)]" /></span>}</td>
              <td>{o.recommendedBotStack.filter((b) => b.status === "recommended").length}</td>
              <td>{o.recommendedIcpIds.length ? <CheckCircle2 aria-label="Created" className="h-4 w-4 text-[var(--accent-text)]" /> : "—"}</td>
              <td><When iso={o.updatedAt} /></td>
            </tr>
          ))}
        </Table>
      </Panel>

      <div className="mt-4 flex items-center gap-2 pf-small pf-muted">
        <ShieldCheck aria-hidden="true" className="h-4 w-4" />
        The final provisioner is still separate. This page can only compile draft plans and review blockers.
      </div>
    </>
  );
}
