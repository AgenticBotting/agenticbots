import { ActionForm, SubmitButton } from "./actions";
import * as A from "@/app/ops/actions";

export function AutomationForm({ bots, disabled }: { bots: { id: string; name: string }[]; disabled?: boolean }) {
  return (
    <ActionForm action={A.createAutomationAction} resetOnSuccess className="max-w-2xl">
      <div className="pf-form-row">
        <label className="pf-label">Bot<select name="botId" className="field">{bots.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
        <label className="pf-label">Name<input name="name" className="field" required placeholder="Daily search-term review" /></label>
      </div>
      <label className="pf-label">Schedule <span className="hint">Cron (“0 7 * * 1-5” = weekdays 7:00 UTC) or an interval (“every 6h”).</span><input name="schedule" className="field pf-mono" required defaultValue="0 7 * * 1-5" /></label>
      <label className="pf-label">What the Bot should do<textarea name="prompt" className="field" rows={3} required /></label>
      <div><SubmitButton disabled={disabled}>Create automation</SubmitButton></div>
    </ActionForm>
  );
}

