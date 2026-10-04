import { PageHead, Panel, Table, Empty, When } from "@/components/platform/ui";
import { ActionButton, ActionForm, SubmitButton } from "@/components/platform/actions";
import { can } from "@/server/auth/policy";
import { addSuppressionAction, liftSuppressionAction } from "../actions";
import { pageCtx } from "../_lib";

export const metadata = { title: "Suppression" };

const REASONS = ["do_not_contact", "client_suppression", "global_suppression", "bounced", "unsubscribed", "invalid_contact", "blocked_domain", "blocked_company", "channel_restriction"];

export default async function SuppressionPage() {
  const { ctx, L, actor } = await pageCtx();
  const all = (await ctx.store.list("pg_suppressions")).filter((s) => !s.orgId || L.visible(s.orgId));
  const superadmin = can(actor, "ops.prospecting.global_suppression");
  return (
    <>
      <PageHead title="Suppression" description="Checked in code immediately before every outbound handoff. Hard suppressions cannot be overridden by a Bot or by any tool argument. Global entries apply to every client; client entries only to that client." />
      <div className="pf-grid pf-grid-2">
        <Panel title="Active and lifted" flush>
          <Table head={["Value", "Scope", "Reason", "Type", "Added", ""]} empty={<Empty title="No suppressions" />}>
            {all.map((s) => (
              <tr key={s.id} className={s.liftedAt ? "opacity-60" : undefined}>
                <td><strong>{s.value}</strong><div className="pf-small pf-muted">{s.kind}</div></td>
                <td>{s.orgId ? L.orgs.get(s.orgId) : "All clients"}</td>
                <td className="pf-small">{s.reason.replace(/_/g, " ")}</td>
                <td>{s.hard ? "Hard" : "Soft"}</td>
                <td className="pf-small"><When iso={s.createdAt} /> by {s.createdBy}{s.liftedAt && <div>Lifted by {s.liftedBy}</div>}</td>
                <td>{!s.liftedAt && s.reason !== "unsubscribed" && s.reason !== "bounced" && (s.orgId || superadmin) && <ActionButton action={liftSuppressionAction} hidden={{ id: s.id }} label="Lift" variant="ghost" />}</td>
              </tr>
            ))}
          </Table>
        </Panel>
        <Panel title="Add suppression">
          <ActionForm action={addSuppressionAction} resetOnSuccess>
            <label className="pf-label">Applies to
              <select name="orgId" className="field">
                {L.orgList.map((o) => <option key={o.id} value={o.id}>{o.name} only</option>)}
                {superadmin && <option value="">All clients (global)</option>}
              </select>
            </label>
            <div className="pf-form-row">
              <label className="pf-label">Kind<select name="kind" className="field"><option value="email">Email</option><option value="domain">Domain</option><option value="company">Company id</option><option value="person">Person id</option></select></label>
              <label className="pf-label">Value<input name="value" className="field" required /></label>
            </div>
            <label className="pf-label">Reason<select name="reason" className="field">{REASONS.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}</select></label>
            <label className="pf-small flex gap-2 items-center"><input type="checkbox" name="soft" /> Soft (a person may override it for one handoff)</label>
            <label className="pf-label">Note<input name="note" className="field" /></label>
            <div><SubmitButton>Suppress</SubmitButton></div>
          </ActionForm>
          <p className="pf-small pf-muted mt-2">Unsubscribes and bounces are permanent and cannot be lifted.</p>
        </Panel>
      </div>
    </>
  );
}
