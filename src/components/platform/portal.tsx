import Link from "next/link";
import { BotIndex } from "@/components/ui/BotIndex";
import type { ClientActivityView, ClientApprovalView, ClientBotView } from "@/server/views/client";
import type { BotReportCard } from "@/server/services/reports";
import { Sparkline } from "./spark";
import { ago, dateTime, num } from "@/lib/platform/format";
import { ActionForm, SubmitButton } from "./actions";
import { decideAction } from "@/app/portal/actions";

const BOT_TONE: Record<ClientBotView["status"], string> = {
  Working: "live", Monitoring: "good", Active: "good", Paused: "quiet", "Setting up": "watch", "Needs attention": "watch",
};

export function BotGrid({ bots, cards = [], days = 30 }: { bots: ClientBotView[]; cards?: BotReportCard[]; days?: number }) {
  const byId = new Map(cards.map((c) => [c.botId, c]));
  return (
    <div className="pf-bot-tiles">
      {bots.map((b) => {
        const c = byId.get(b.id);
        const metric = c?.metricLabel ?? "Updates delivered";
        return (
          <div key={b.id} className="pf-bot-tile">
            <div className="top">
              <BotIndex index={b.icon} size="sm" />
              <span className="name">{b.name}</span>
              <span className={`pf-status ${BOT_TONE[b.status]}`}>{b.status}</span>
            </div>
            <div className="fig">
              <span className="v">{num(c?.value ?? 0)}</span>
              <span className="l">{metric}</span>
            </div>
            <Sparkline points={c?.points ?? []} label={`${metric} over the last ${days} days`} />
            <div className="foot">{b.lastActivityAt ? <>Last active {ago(b.lastActivityAt)}</> : "No activity yet"}</div>
          </div>
        );
      })}
    </div>
  );
}

/** "Qualified opportunities" → "qualified opportunities"; acronyms ("CRM", "SEO") keep their case. */
function inSentence(label: string): string {
  return /^[A-Z]{2}/.test(label) ? label : label.charAt(0).toLowerCase() + label.slice(1);
}

/** Horizontal bars: each Bot's headline result for the period, plus its activity count. */
export function BotWork({ bots, cards }: { bots: ClientBotView[]; cards: BotReportCard[] }) {
  const rows = cards
    .map((c) => ({ c, b: bots.find((x) => x.id === c.botId) }))
    .filter((x): x is { c: BotReportCard; b: ClientBotView } => !!x.b && x.c.activities > 0)
    .sort((a, b) => b.c.activities - a.c.activities);
  if (rows.length === 0) return <p className="pf-muted">No Bot work in this period.</p>;
  const max = Math.max(1, ...rows.map((r) => r.c.activities));
  return (
    <ul className="pf-barlist">
      {rows.map(({ c, b }) => (
        <li key={c.botId}>
          <BotIndex index={b.icon} size="sm" tone="outline" />
          <div className="who">
            <div className="n">{b.name}</div>
            <div className="m">{num(c.value)} {inSentence(c.metricLabel ?? "Updates delivered")}</div>
          </div>
          <div className="track" aria-hidden="true"><span style={{ width: `${(c.activities / max) * 100}%` }} /></div>
          <div className="val"><b>{num(c.activities)}</b> <span>{c.activities === 1 ? "update" : "updates"}</span></div>
        </li>
      ))}
    </ul>
  );
}

export function Feed({ items, compact = false }: { items: ClientActivityView[]; compact?: boolean }) {
  if (items.length === 0) return <p className="pf-muted">No activity yet. Your Bots&apos; work will appear here as it happens.</p>;
  return (
    <ul className={`pf-feed${compact ? " compact" : ""}`}>
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
  const pending = a.status === "pending";
  return (
    <article className={`pf-ap${pending ? "" : " decided"}`} aria-labelledby={`ap-${a.id}`}>
      <div className="pf-ap-main">
        <div className="pf-ap-head">
          <BotIndex index={a.botIcon} size="sm" />
          <div className="min-w-0">
            <h3 id={`ap-${a.id}`}>{a.title}</h3>
            <div className="pf-ap-meta">
              <span>{a.botName}</span>
              <span>{a.category}</span>
              <time dateTime={a.requestedAt} title={dateTime(a.requestedAt)}>Requested {ago(a.requestedAt)}</time>
            </div>
          </div>
        </div>
        {pending && <p className="pf-ap-why">{a.explanation}</p>}
        {pending && <div className="pf-ap-impact"><span className="k">If you approve</span><span>{a.expectedImpact}</span></div>}
        {a.preview && (
          <details className="pf-ap-preview">
            <summary>Preview what will be sent</summary>
            <div className="body">{a.preview}</div>
          </details>
        )}
      </div>
      <div className="pf-ap-actions">
        {!pending ? (
          <span className={`pf-status ${a.status === "approved" ? "good" : "quiet"}`}>
            {a.status === "approved" ? "Approved" : a.status === "denied" ? "Declined" : "Expired"}{a.resolvedAt ? ` ${ago(a.resolvedAt)}` : ""}
          </span>
        ) : readOnly || !canDecide ? (
          <span className="pf-small pf-muted">{readOnly ? "Preview — clients approve here." : "Only an account admin can approve. Ask your admin to review."}</span>
        ) : (
          <>
            <ActionForm action={decideAction} hidden={{ approvalId: a.id, decision: "approve" }} className="!gap-2">
              <SubmitButton className="w-full" pendingLabel="Approving…">Approve</SubmitButton>
            </ActionForm>
            <ActionForm action={decideAction} hidden={{ approvalId: a.id, decision: "deny" }} className="!gap-2">
              <SubmitButton className="w-full" variant="outline" pendingLabel="Declining…">Decline</SubmitButton>
            </ActionForm>
          </>
        )}
      </div>
    </article>
  );
}

export function ApprovalList({ items, readOnly, canDecide }: { items: ClientApprovalView[]; readOnly: boolean; canDecide: boolean }) {
  return (
    <div className="pf-ap-list">
      {items.map((a) => <ApprovalCard key={a.id} a={a} readOnly={readOnly} canDecide={canDecide} />)}
    </div>
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

export function SectionHead({ title, href, linkLabel, count }: { title: string; href?: string; linkLabel?: string; count?: number }) {
  return (
    <div className="pf-section-head">
      <h2>{title}{count !== undefined && <span className="pf-count" aria-label={`${count} waiting`}>{count}</span>}</h2>
      {href && <Link href={href}>{linkLabel}</Link>}
    </div>
  );
}
