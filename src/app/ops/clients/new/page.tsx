import { requireOperatorPage } from "@/server/auth/guard";
import { PageHead, Panel } from "@/components/platform/ui";
import { ActionForm, SubmitButton } from "@/components/platform/actions";
import { createClientAction } from "../../actions";
import { INSTANCE_COST_USD } from "@/server/services/accounts";

export const metadata = { title: "New client" };

export default async function NewClient() {
  await requireOperatorPage();
  return (
    <>
      <PageHead title="New client" crumbs={[{ href: "/ops/clients", label: "Clients" }]} description="Creates the organization, its tenant ID and an unprovisioned runtime record. Infrastructure is created next with the provisioning command shown on the client page." />
      <Panel>
        <ActionForm action={createClientAction} className="max-w-2xl">
          <label className="pf-label">Company name<input name="name" className="field" required minLength={2} /></label>
          <div className="pf-form-row">
            <label className="pf-label">Industry<input name="industry" className="field" placeholder="Roofing" /></label>
            <label className="pf-label">Website<input name="website" className="field" type="url" placeholder="https://" /></label>
          </div>
          <div className="pf-form-row">
            <label className="pf-label">Primary contact<input name="contactName" className="field" /></label>
            <label className="pf-label">Contact email<input name="contactEmail" type="email" className="field" /></label>
          </div>
          <label className="pf-label">
            Runtime size
            <span className="hint">One isolated server per client. Choose larger if Bots will drive a browser.</span>
            <select name="instanceType" className="field" defaultValue="t3.medium">
              {Object.entries(INSTANCE_COST_USD).map(([k, v]) => <option key={k} value={k}>{k} (about ${v}/month)</option>)}
            </select>
          </label>
          <div><SubmitButton>Create client</SubmitButton></div>
        </ActionForm>
      </Panel>
    </>
  );
}
