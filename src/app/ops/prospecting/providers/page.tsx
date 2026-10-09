import { PageHead, Panel, Table, Empty, When } from "@/components/platform/ui";
import { Kpi, KpiRow } from "@/components/platform/viz";
import { Status } from "@/components/platform/status";
import { ActionForm, SubmitButton } from "@/components/platform/actions";
import { usd } from "@/lib/platform/format";
import { providerCatalog } from "@/server/prospecting/providers/registry";
import { costSummary } from "@/server/prospecting/costs";
import { setBudgetAction } from "../actions";
import { pageCtx } from "../_lib";

export const metadata = { title: "Providers & cost" };

export default async function ProvidersPage() {
  const { ctx, L } = await pageCtx();
  const [cost, budgets, handoffs] = await Promise.all([costSummary(ctx), ctx.store.list("pg_budgets"), ctx.store.list("pg_handoffs")]);
  const catalog = providerCatalog();
  const visibleBudgets = budgets.filter((b) => b.orgId ? L.visible(b.orgId) : ctx.p.kind === "user" && ctx.p.actor.platformRole === "superadmin");
  const visibleHandoffs = handoffs.filter((h) => L.visible(h.orgId)).slice(0, 20);
  return (
    <>
      <PageHead title="Providers & cost" description="Data providers behind the vendor-neutral adapters, what each costs, and the budgets that stop spend. Paid providers stay off until they have a credential, configured pricing, an implemented adapter and a client budget. Internal only." />
      <KpiRow cols={4}>
        <Kpi value={usd(cost.monthUsd)} label="Spend this month" />
        <Kpi value={cost.paidCalls} label="Paid calls" />
        <Kpi value={cost.freeCalls} label="Free / cached calls" />
        <Kpi value={catalog.filter((p) => p.status === "ready").length} label="Providers ready" hint={`of ${catalog.length}`} />
      </KpiRow>
      <Panel title="Providers" flush>
        <Table head={["Provider", "Capabilities", "Status", "Credential setting", "Configured price", "This month"]}>
          {catalog.map((p) => {
            const used = cost.byProvider.find((x) => x.provider === p.key);
            return (
              <tr key={p.key}>
                <td><strong>{p.label}</strong>{p.demo && <span className="pf-tag ml-1">demo</span>}{p.docsUrl && <div className="pf-small"><a className="underline" href={p.docsUrl} target="_blank" rel="noreferrer">API docs</a></div>}</td>
                <td className="pf-small">{p.capabilities.join(", ").replace(/_/g, " ")}</td>
                <td><Status value={p.status} /></td>
                <td className="pf-small"><code>{p.credentialSetting ?? "—"}</code></td>
                <td className="pf-small">{p.paid ? (Object.keys(p.pricing).length ? Object.entries(p.pricing).map(([k, v]) => `${k.replace(/_/g, " ")}: ${usd(v, 4)}`).join(", ") : "Not configured") : "Free"}</td>
                <td className="pf-small">{used ? `${usd(used.usd)} · ${used.calls} calls${used.failed ? `, ${used.failed} failed` : ""}` : "—"}</td>
              </tr>
            );
          })}
        </Table>
      </Panel>
      <div className="pf-grid pf-grid-2">
        <Panel title="Budgets" sub="A paid call needs a client budget. Limits are checked before every paid call." flush>
          <Table head={["Scope", "Monthly limit", "Paid calls / run", "Companies / job", "Exports / day", "On limit"]} empty={<Empty title="No budgets">Paid data calls are off for every client.</Empty>}>
            {visibleBudgets.map((b) => (
              <tr key={b.id}>
                <td>{b.scope}{b.orgId ? ` · ${L.orgs.get(b.orgId)}` : ""}{b.provider ? ` · ${b.provider}` : ""}</td>
                <td className="num">{usd(b.monthlyLimitUsd)}</td>
                <td className="num">{b.maxPaidCallsPerRun}</td>
                <td className="num">{b.maxCompaniesPerJob}</td>
                <td className="num">{b.maxLeadsExportedPerRun}</td>
                <td>{b.onLimit === "approval" ? "Pause for approval" : "Stop"}</td>
              </tr>
            ))}
          </Table>
        </Panel>
        <Panel title="Set a client budget">
          <ActionForm action={setBudgetAction} hidden={{ scope: "client" }}>
            <label className="pf-label">Client<select name="orgId" className="field">{L.orgList.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
            <div className="pf-form-row">
              <label className="pf-label">Monthly limit $<input name="monthlyLimitUsd" className="field" inputMode="decimal" defaultValue="0" /></label>
              <label className="pf-label">Paid calls per run<input name="maxPaidCallsPerRun" className="field" inputMode="numeric" defaultValue="50" /></label>
            </div>
            <div className="pf-form-row">
              <label className="pf-label">Companies per job<input name="maxCompaniesPerJob" className="field" inputMode="numeric" defaultValue="25" /></label>
              <label className="pf-label">Outbound handoffs per day<input name="maxLeadsExportedPerRun" className="field" inputMode="numeric" defaultValue="50" /></label>
            </div>
            <label className="pf-label">When a limit is hit<select name="onLimit" className="field"><option value="approval">Pause and ask an operator</option><option value="stop">Stop</option></select></label>
            <div><SubmitButton>Save budget</SubmitButton></div>
          </ActionForm>
        </Panel>
      </div>
      <Panel title="Outbound handoffs" sub="Every handoff attempt, including ones the policy blocked" flush>
        <Table head={["Client", "Contact", "System", "Status", "Notes", "When"]} empty={<Empty title="No handoffs yet" />}>
          {visibleHandoffs.map((h) => (
            <tr key={h.id}>
              <td>{L.orgs.get(h.orgId)}</td>
              <td className="pf-small">{h.payload.contact.fullName} · {h.payload.company.name}</td>
              <td>{h.provider}{h.demo ? " (demo)" : ""}</td>
              <td><Status value={h.status} /></td>
              <td className="pf-small">{h.policyViolations.join(" ")}</td>
              <td><When iso={h.createdAt} /></td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
