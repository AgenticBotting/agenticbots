import "server-only";
import type { NoteTarget, OperatorNote } from "@/lib/platform/types";
import type { Repository } from "@/server/db/repository";
import { Tx } from "@/server/db/repository";
import type { Actor } from "@/server/auth/policy";
import { correlationId } from "@/server/ids";
import { invalid } from "@/server/errors";
import { redactSecrets } from "@/server/redact";
import { assertPermission, audit } from "./common";

/** Private operator notes. There is no client-facing read path for this
 *  table anywhere in the codebase (asserted by tests/security). */
export async function addNote(
  r: Repository,
  actor: Actor,
  input: { orgId: string; targetType: NoteTarget; targetId: string; text: string },
): Promise<OperatorNote> {
  assertPermission(actor, "ops.notes.write", input.orgId);
  const text = input.text.trim();
  if (!text) throw invalid("Note is empty.");
  const tx = new Tx(r);
  const note = tx.insert("operator_notes", {
    orgId: input.orgId,
    targetType: input.targetType,
    targetId: input.targetId,
    text: redactSecrets(text, 4000),
    authorId: actor.user.id,
    authorName: actor.user.name,
  });
  audit(tx, actor, { action: "note.add", orgId: input.orgId, targetType: input.targetType, targetId: input.targetId, correlationId: correlationId() });
  await tx.commit();
  return note;
}

export async function notesFor(r: Repository, actor: Actor, orgId: string, targetType: NoteTarget, targetId: string) {
  assertPermission(actor, "ops.view", orgId);
  return r.list("operator_notes", { orgId, where: { targetType, targetId } });
}
