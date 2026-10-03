import Link from "next/link";
import { requirePortalPage } from "@/server/auth/guard";
import { portalData } from "@/server/views/portal";
import { RequestBox } from "@/components/platform/RequestBox";
import { SectionHead } from "@/components/platform/portal";
import { ago } from "@/lib/platform/format";

export const metadata = { title: "Requests" };

const TONE: Record<string, string> = { Submitted: "watch", Reviewing: "watch", "In Progress": "live", "Waiting on you": "bad", Completed: "good", Declined: "quiet" };

export default async function RequestsPage() {
  const { org, preview } = await requirePortalPage();
  const d = await portalData(org);
  const open = d.requests.filter((r) => r.status !== "completed" && r.status !== "declined");
  const done = d.requests.filter((r) => r.status === "completed" || r.status === "declined");
  const Row = ({ r }: { r: (typeof d.requests)[number] }) => (
    <li>
      <span className={`pf-status ${TONE[r.statusLabel]}`}>{r.statusLabel}</span>
      <Link href={`/portal/requests/${r.id}`} className="t hover:underline">{r.title}</Link>
      <time dateTime={r.submittedAt}>{ago(r.submittedAt)}</time>
    </li>
  );
  return (
    <>
      <h1>Requests</h1>
      <p className="lede">Ask for anything. You don&apos;t need to know which Bot does it.</p>
      <section className="pf-section"><RequestBox disabled={preview} /></section>
      <section className="pf-section">
        <SectionHead title={`Open (${open.length})`} />
        {open.length === 0 ? <p className="pf-muted">No open requests.</p> : <ul className="pf-feed">{open.map((r) => <Row key={r.id} r={r} />)}</ul>}
      </section>
      {done.length > 0 && (
        <section className="pf-section">
          <SectionHead title="Finished" />
          <ul className="pf-feed">{done.map((r) => <Row key={r.id} r={r} />)}</ul>
        </section>
      )}
    </>
  );
}
