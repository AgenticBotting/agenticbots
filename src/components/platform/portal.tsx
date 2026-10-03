import Link from "next/link";
import { BotIndex } from "@/components/ui/BotIndex";
import type { ClientActivityView, ClientApprovalView, ClientBotView } from "@/server/views/client";
import { ago, dateTime, num } from "@/lib/platform/format";
import { ActionForm, SubmitButton } from "./actions";
import { decideAction } from "@/app/portal/actions";

const BOT_TONE: Record<ClientBotView["status"], string> = {
  Working: "live", Monitoring: "good", Active: "good", Paused: "quiet", "Setting up": "watch", "Needs attention": "watch",
};

export function BotGrid({ bots }: { bots: ClientBotView[] }) {
  return (
    <div className="pf-bots">
      {bots.map((b) => (
        <div key={b.id} className="pf-bot">
          <BotIndex index={b.icon} size="md" />
          <div>
            <div className="name">{b.name}</div>
            <span className={`pf-status ${BOT_TONE[b.status]}`}>{b.status}</span>
          </div>
          <div className="last">
            {b.recentResult ?? b.description}
            {b.lastActivityAt && <div className="pf-small pf-muted mt-1">Last activity {ago(b.lastActivityAt)}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Feed({ items }: { items: ClientActivityView[] }) {
  if (items.length === 0) return <p className="pf-muted">No activity yet. Your Bots&apos; work will appear here as it happens.</p>;
  return (
    <ul className="pf-feed">
      {items.map((a) => (
        <li key={a.id}>
          {a.botIcon ? <BotIndex index={a.botIcon} size="sm" tone="outline" /> : <span className="w-8" aria-hidden="true" />}
          <span className="t">{a.text}</span>
          <time dateTime={a.at} title={dateTime(a.at)}>{ago(a.at)}</time>
        </li>
      ))}
    </ul>
  );
}

export function ApprovalCard({ a, readOnly, canDecide }: { a: ClientApprovalView; readOnly: boolean; canDecide: boolean }) {
  return (
    <article className="pf-approval" aria-labelledby={`ap-${a.id}`}>
      <div className="pf-approval-body">
        <div className="flex items-center gap-3">
          <BotIndex index={a.botIcon} size="sm" />
          <span className="pf-small pf-muted">{a.botName} · {a.category} · requested {ago(a.requestedAt)}</span>
        </div>
        <h3 id={`ap-${a.id}`}>{a.title}</h3>
        <p>{a.explanation}</p>
        <p className="pf-small"><strong>What happens if you approve:</strong> {a.expectedImpact}</p>
        {a.preview && <div className="preview">{a.preview}</div>}
        {a.status !== "pending" && <p className="pf-small pf-muted">{a.status === "approved" ? "Approved" : a.status === "denied" ? "Declined" : "Expired"} {a.resolvedAt ? ago(a.resolvedAt) : ""}</p>}
      </div>
      {a.status === "pending" && (
        <div className="pf-approval-actions">
          {readOnly || !canDecide ? (
            <span className="pf-small pf-muted">{readOnly ? "Preview — clients approve here." : "Only an account admin can approve. Ask your admin to review."}</span>
          ) : (
            <>
              <ActionForm action={decideAction} hidden={{ approvalId: a.id, decision: "approve" }} className="!gap-2">
                <SubmitButton className="btn-lg" pendingLabel="Approving…">Approve</SubmitButton>
              </ActionForm>
              <ActionForm action={decideAction} hidden={{ approvalId: a.id, decision: "deny" }} className="!gap-2">
                <SubmitButton className="btn-lg" variant="outline" pendingLabel="Declining…">Decline</SubmitButton>
              </ActionForm>
            </>
          )}
        </div>
      )}
    </article>
  );
}

export function Results({ results }: { results: { key: string; label: string; value: number }[] }) {
  if (results.length === 0) {
    return <p className="pf-muted">Results appear here as your Bots report finished work. Nothing is estimated.</p>;
  }
  return (
    <div className="pf-results">
      {results.slice(0, 6).map((r) => (
        <div key={r.key} className="pf-result">
          <div className="v">{num(r.value)}</div>
          <div className="l">{r.label}</div>
        </div>
      ))}
    </div>
  );
}

export function SectionHead({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="pf-section-head">
      <h2>{title}</h2>
      {href && <Link href={href}>{linkLabel}</Link>}
    </div>
  );
}
