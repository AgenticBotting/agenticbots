import type { NoteTarget, OperatorNote } from "@/lib/platform/types";
import { ActionForm, SubmitButton } from "./actions";
import { When } from "./ui";
import { addNoteAction } from "@/app/ops/actions";

export function NoteBox({ orgId, targetType, targetId, notes }: { orgId: string; targetType: NoteTarget; targetId: string; notes: OperatorNote[] }) {
  return (
    <div className="grid gap-3">
      {notes.length === 0 && <p className="pf-muted pf-small">No notes yet.</p>}
      {notes.map((n) => (
        <div key={n.id} className="border-l-2 border-[var(--border-strong)] pl-3">
          <div className="text-[13.5px] whitespace-pre-wrap">{n.text}</div>
          <div className="pf-small pf-muted">{n.authorName} · <When iso={n.createdAt} /></div>
        </div>
      ))}
      <ActionForm action={addNoteAction} hidden={{ orgId, targetType, targetId }} resetOnSuccess>
        <label className="sr-only" htmlFor={`note-${targetId}`}>Add a private note</label>
        <textarea id={`note-${targetId}`} name="text" className="field" rows={2} placeholder="Private note for the AgenticBots team" />
        <div><SubmitButton variant="outline">Add note</SubmitButton></div>
      </ActionForm>
    </div>
  );
}
