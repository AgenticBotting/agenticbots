import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePortalPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { toClientRequest } from "@/server/views/client";
import { ActionForm, SubmitButton } from "@/components/platform/actions";
import { commentAction } from "../../actions";
import { ago, dateTime } from "@/lib/platform/format";

export const metadata = { title: "Request" };

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { org, preview } = await requirePortalPage();
  const { id } = await params;
  const raw = await (await repo()).get("requests", id);
  // Another organization's request looks exactly like a missing one.
  if (!raw || raw.orgId !== org.id) notFound();
  const r = toClientRequest(raw);
  return (
    <>
      <p className="pf-small"><Link href="/portal/requests" className="underline">Requests</Link></p>
      <h1 className="mt-1">{r.title}</h1>
      <p className="lede">{r.statusLabel} · submitted {dateTime(r.submittedAt)}{r.completedAt ? ` · completed ${dateTime(r.completedAt)}` : ""}</p>
      {r.status === "waiting_on_client" && <div className="pf-banner watch mt-5">AgenticBots needs a bit more from you — reply below.</div>}
      {r.description && <section className="pf-section"><h2 className="mb-2">Details</h2><p className="whitespace-pre-wrap">{r.description}</p></section>}
      {r.deliverables.length > 0 && (
        <section className="pf-section">
          <h2 className="mb-2">Results</h2>
          <ul className="pf-feed">{r.deliverables.map((d, i) => <li key={i}><span /><span className="t">{d.url ? <a href={d.url} className="underline">{d.label}</a> : d.label}</span><time>{ago(d.addedAt)}</time></li>)}</ul>
        </section>
      )}
      <section className="pf-section">
        <h2 className="mb-3">Conversation</h2>
        <div className="grid gap-3 mb-4">
          {r.messages.length === 0 && <p className="pf-muted">No messages yet.</p>}
          {r.messages.map((m, i) => (
            <div key={i} className={m.fromAgenticBots ? "border-l-2 border-[var(--color-accent-500)] pl-3" : "border-l-2 border-[var(--border-strong)] pl-3"}>
              <div className="whitespace-pre-wrap">{m.text}</div>
              <div className="pf-small pf-muted">{m.byName} · {ago(m.at)}</div>
            </div>
          ))}
        </div>
        {!preview && r.status !== "declined" && (
          <ActionForm action={commentAction} hidden={{ requestId: r.id }} resetOnSuccess>
            <label className="sr-only" htmlFor="reply">Reply</label>
            <textarea id="reply" name="text" className="field" rows={3} placeholder="Reply to AgenticBots" required />
            <div><SubmitButton>Send</SubmitButton></div>
          </ActionForm>
        )}
      </section>
    </>
  );
}
