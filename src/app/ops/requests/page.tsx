import Link from "next/link";
import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { lookups } from "@/server/services/lookups";
import { PageHead, Panel, FilterLinks } from "@/components/platform/ui";
import { RequestsTable } from "@/components/platform/lists";
import { Avatar } from "@/components/platform/viz";
import { BotIndex } from "@/components/ui/BotIndex";
import { getBotType } from "@/config/bot-catalog";
import { ago, isoDaysAgo, titleCase } from "@/lib/platform/format";
import type { RequestStatus, WorkRequest } from "@/lib/platform/types";

export const metadata = { title: "Requests" };

const LANES: { key: string; label: string; statuses: RequestStatus[]; tone: string }[] = [
  { key: "new", label: "New", statuses: ["submitted"], tone: "watch" },
  { key: "reviewing", label: "Reviewing", statuses: ["reviewing"], tone: "watch" },
  { key: "in_progress", label: "In progress", statuses: ["in_progress"], tone: "live" },
  { key: "waiting", label: "Waiting on client", statuses: ["waiting_on_client"], tone: "quiet" },
  { key: "done", label: "Done, last 30 days", statuses: ["completed", "declined"], tone: "good" },
];

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ status?: string; view?: string }> }) {
  const actor = await requireOperatorPage();
  const sp = await searchParams;
  const r = await repo();
  const L = await lookups(r, actor);
  const all = (await r.list("requests")).filter((x) => L.visible(x.orgId));
  const board = sp.view !== "list";
  let reqs = all;
  if (sp.status === "open") reqs = reqs.filter((x) => !["completed", "declined"].includes(x.status));
  else if (sp.status) reqs = reqs.filter((x) => x.status === sp.status);
  const monthAgo = isoDaysAgo(30);
  const n = (f: (x: WorkRequest) => boolean) => all.filter(f).length;

  const Ticket = ({ q }: { q: WorkRequest }) => {
    const org = L.orgs.get(q.orgId) ?? "";
    const bots = q.assignedBotIds.map((id) => L.bots.get(id)).filter(Boolean);
    return (
      <Link href={`/ops/requests/${q.id}`} className={`pf-ticket p-${q.priority}`}>
        <div className="t">{q.title}</div>
        <div className="m">
          <span className="inline-flex items-center gap-1.5"><Avatar name={org} size="sm" />{org}</span>
        </div>
        <div className="m">
          {q.priority !== "normal" && q.priority !== "low" && <span className={`pf-badge ${q.priority === "urgent" ? "bad" : "watch"}`}>{titleCase(q.priority)}</span>}
          <span>{ago(q.submittedAt)}</span>
          {bots.length > 0 && (
            <span className="inline-flex items-center gap-1" title={bots.map((b) => b!.name).join(", ")}>
              {bots.slice(0, 3).map((b) => <BotIndex key={b!.id} index={getBotType(b!.typeKey)?.icon ?? "00"} size="sm" className="!h-5 !w-5 !text-[9px]" />)}
            </span>
          )}
          <span className="ml-auto">{q.assignedOperatorId ? L.users.get(q.assignedOperatorId) : <span className="text-[#8A5208] font-semibold">Unassigned</span>}</span>
        </div>
      </Link>
    );
  };

  return (
    <>
      <PageHead title="Requests" description="Work clients asked for. Route each one to a person, a Bot, or both — the client only sees the result." />
      <FilterLinks
        current={board ? "board" : sp.status ?? ""}
        items={board ? [] : [
          { key: "", label: "All", href: "/ops/requests?view=list", count: all.length },
          { key: "open", label: "Open", href: "/ops/requests?view=list&status=open", count: n((x) => !["completed", "declined"].includes(x.status)) },
          { key: "submitted", label: "New", href: "/ops/requests?view=list&status=submitted", count: n((x) => x.status === "submitted") },
          { key: "in_progress", label: "In progress", href: "/ops/requests?view=list&status=in_progress", count: n((x) => x.status === "in_progress") },
          { key: "waiting_on_client", label: "Waiting on client", href: "/ops/requests?view=list&status=waiting_on_client", count: n((x) => x.status === "waiting_on_client") },
          { key: "completed", label: "Completed", href: "/ops/requests?view=list&status=completed", count: n((x) => x.status === "completed") },
        ]}
        trailing={
          <nav className="pf-viewswitch" aria-label="View">
            <Link href="/ops/requests" aria-current={board ? "page" : undefined}>Board</Link>
            <Link href="/ops/requests?view=list" aria-current={!board ? "page" : undefined}>List</Link>
          </nav>
        }
      />
      {board ? (
        <div className="pf-board">
          {LANES.map((lane) => {
            const items = all
              .filter((x) => lane.statuses.includes(x.status) && (lane.key !== "done" || (x.completedAt ?? x.updatedAt) >= monthAgo))
              .sort((a, b) => ({ urgent: 0, high: 1, normal: 2, low: 3 })[a.priority] - ({ urgent: 0, high: 1, normal: 2, low: 3 })[b.priority] || a.submittedAt.localeCompare(b.submittedAt));
            return (
              <section key={lane.key} className="pf-lane" aria-label={lane.label}>
                <div className="pf-lane-head"><i className={`sw ${lane.tone}`} aria-hidden="true" />{lane.label}<span className="n">{items.length}</span></div>
                <div className="pf-lane-body">
                  {items.length === 0 ? <div className="pf-lane-empty">Nothing here.</div> : items.map((q) => <Ticket key={q.id} q={q} />)}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <Panel flush><RequestsTable requests={reqs} names={{ orgs: L.orgs, bots: L.bots, users: L.users }} /></Panel>
      )}
    </>
  );
}
