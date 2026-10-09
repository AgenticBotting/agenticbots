import { requirePortalPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { ownPrivacyReceipts } from "@/server/services/privacy";
import { ActionForm, SubmitButton } from "@/components/platform/actions";
import { accountRequestAction } from "./actions";

export const metadata = { title: "Account & privacy" };
export default async function AccountPage() {
  const { actor, org, preview } = await requirePortalPage();
  const receipts = preview ? [] : await ownPrivacyReceipts(await repo(), actor, org.id);
  return <>
    <h1>Account &amp; privacy</h1>
    <p className="lede">Request your personal information, a correction, deletion or service cancellation. No phone call is required.</p>
    {!preview && <ActionForm action={accountRequestAction}>
      <label className="pf-label">Request type<select className="field" name="kind"><option value="access">Access my personal information</option><option value="correct">Correct my information</option><option value="delete">Delete my personal information</option><option value="opt_out">Stop marketing contact</option><option value="cancel">Request service cancellation</option></select></label>
      <label className="pf-label">Details (optional)<textarea className="field" name="details" maxLength={2000} rows={3} /></label>
      <p className="pf-small">Please leave out passwords, financial account numbers and identity documents. We may verify your authority before sharing or deleting records. Cancellation timing and any final invoice follow your signed agreement. Submitting this form records your request; it does not immediately delete business records or stop service.</p>
      <SubmitButton>Submit request</SubmitButton>
    </ActionForm>}
    <h2 className="mt-8">Your request receipts</h2>
    {receipts.length ? <ul className="pf-feed">{receipts.map(p => <li key={p.id}><strong>{p.kind.replaceAll("_", " ")}</strong><span>{p.status}</span><time dateTime={p.createdAt}>{new Date(p.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })}</time><span className="pf-small">Reference {p.id}</span></li>)}</ul> : <p>No requests submitted from this account.</p>}
    <p className="mt-6"><a className="underline" href="/privacy">Privacy policy</a> · <a className="underline" href="/terms">Account terms</a> · <a className="underline" href="mailto:hello@agenticbots.dev">Contact us</a></p>
  </>;
}
