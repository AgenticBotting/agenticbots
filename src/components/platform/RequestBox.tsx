import { ActionForm, SubmitButton } from "./actions";
import { submitRequestAction } from "@/app/portal/actions";

/** The client's front door to AgenticBots. They describe the outcome; we pick who and what does it. */
export function RequestBox({ disabled, compact }: { disabled: boolean; compact?: boolean }) {
  return (
    <section className="pf-ask" aria-labelledby="ask-h">
      <div>
        <h2 id="ask-h">Request something</h2>
        <p className="pf-muted text-[14px]">Describe what you need in plain words. AgenticBots decides how it gets done and keeps you posted here.</p>
      </div>
      <ActionForm action={submitRequestAction} hidden={compact ? { stay: "1" } : undefined} resetOnSuccess>
        <label className="pf-label">What do you need?<input name="title" className="field" required minLength={3} maxLength={160} placeholder="e.g. Build a list of commercial property managers in Palm Beach County" disabled={disabled} /></label>
        <label className="pf-label">Details <span className="hint">optional</span><textarea name="description" className="field" placeholder="Anything that helps: deadlines, areas, examples" disabled={disabled} /></label>
        <div className="flex flex-wrap gap-3 items-end">
          <label className="pf-label">Priority
            <select name="priority" className="field" defaultValue="normal" disabled={disabled}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select>
          </label>
          <SubmitButton className="btn-lg" disabled={disabled} pendingLabel="Sending…">Send request</SubmitButton>
        </div>
        {disabled && <p className="pf-small pf-muted">Requests are submitted by the client.</p>}
      </ActionForm>
    </section>
  );
}
