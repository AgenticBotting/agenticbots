import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { can } from "@/server/auth/policy";
import { platformMode, billingDefaults, isDemo } from "@/server/env";
import { PageHead, Panel, Table, KV, When } from "@/components/platform/ui";
import { Status } from "@/components/platform/status";
import { ActionButton, ActionForm, ConfirmAction, SubmitButton } from "@/components/platform/actions";
import { billingProvider } from "@/server/billing/service";
import { FUTURE_PROVIDERS } from "@/server/billing/provider";
import * as A from "../actions";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const actor = await requireOperatorPage();
  const r = await repo();
  const [users, providers] = await Promise.all([r.list("users", { order: "asc" }), r.list("provider_configurations")]);
  const staff = users.filter((u) => u.platformRole);
  const superadmin = can(actor, "ops.users.manage");
  return (
    <>
      <PageHead title="Settings" />
      <div className="pf-grid pf-grid-2">
        <Panel title="Environment">
          <KV rows={[
            ["Mode", <Status key="m" value={platformMode() === "production" ? "active" : "pending"} label={platformMode()} />],
            ["Database", isDemo() ? "Built-in demo store (resets on reset)" : "Convex"],
            ["Runtime adapter", isDemo() ? "Demo runtime — never calls out" : "Hermes runtime adapter"],
            ["Billing provider", billingProvider().displayName],
            ["Future billing adapters", FUTURE_PROVIDERS.join(", ")],
            ["Default grace period", `${billingDefaults.graceDays} days`],
            ["Auto-suspend default", billingDefaults.autoSuspend ? "On" : "Off"],
            ["Auto-reactivate default", billingDefaults.autoReactivate ? "On" : "Off"],
            ["Card processor", "Not required"],
          ]} />
          {isDemo() && (
            <div className="mt-4">
              <ConfirmAction action={A.resetDemoAction} hidden={{}} variant="outline" label="Reset demo data" title="Reset demo data?" body="Deletes all demo changes and re-seeds Acme Roofing and the other fictional clients." confirmLabel="Reset" />
            </div>
          )}
        </Panel>
        <Panel title="Model providers" sub="Rates are USD per million tokens and drive every cost estimate. Check them against your provider's price list.">
          <Table head={["Provider", "Models"]}>
            {providers.map((p) => <tr key={p.id}><td>{p.displayName}<div className="pf-mono pf-muted">{p.provider}</div></td><td className="pf-small">{p.models.map((m) => <div key={m.id}><span className="pf-mono">{m.id}</span> — ${m.inputPerM} in / ${m.outputPerM} out</div>)}</td></tr>)}
          </Table>
          {can(actor, "ops.models.manage") && (
            <ActionForm action={A.upsertProviderAction} className="mt-4" resetOnSuccess>
              <div className="pf-form-row">
                <label className="pf-label">Provider key<input name="provider" className="field pf-mono" required placeholder="anthropic" /></label>
                <label className="pf-label">Display name<input name="displayName" className="field" /></label>
              </div>
              <div className="pf-form-row">
                <label className="pf-label">Model id<input name="modelId" className="field pf-mono" required /></label>
                <label className="pf-label">Label<input name="modelLabel" className="field" /></label>
              </div>
              <div className="pf-form-row">
                <label className="pf-label">Input $/M<input name="inputPerM" className="field" inputMode="decimal" required /></label>
                <label className="pf-label">Output $/M<input name="outputPerM" className="field" inputMode="decimal" required /></label>
                <label className="pf-label">Cache read $/M<input name="cacheReadPerM" className="field" inputMode="decimal" /></label>
              </div>
              <div><SubmitButton variant="outline">Save model</SubmitButton></div>
            </ActionForm>
          )}
        </Panel>
        <Panel title="AgenticBots team" flush>
          <Table head={["Name", "Email", "Role", "Status", "Last sign-in", ""]}>
            {staff.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td><td className="pf-small">{u.email}</td><td>{u.platformRole === "superadmin" ? "Superadmin" : "Operator"}</td>
                <td><Status value={u.status} /></td><td><When iso={u.lastLoginAt} /></td>
                <td>{superadmin && u.id !== actor.user.id && <ActionButton action={A.setUserStatusAction} hidden={{ userId: u.id, status: u.status === "disabled" ? "active" : "disabled" }} label={u.status === "disabled" ? "Enable" : "Disable"} variant="ghost" />}</td>
              </tr>
            ))}
          </Table>
        </Panel>
        {superadmin && (
          <Panel title="Invite a team member">
            <ActionForm action={A.inviteUserAction} resetOnSuccess>
              <div className="pf-form-row">
                <label className="pf-label">Name<input name="name" className="field" required /></label>
                <label className="pf-label">Email<input name="email" type="email" className="field" required /></label>
              </div>
              <label className="pf-label">Role<select name="platformRole" className="field"><option value="operator">Operator — daily operations</option><option value="superadmin">Superadmin — everything, including users and destroy</option></select></label>
              <div><SubmitButton variant="outline">Create invitation</SubmitButton></div>
            </ActionForm>
          </Panel>
        )}
      </div>
    </>
  );
}
