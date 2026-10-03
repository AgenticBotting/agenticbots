import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { lookups } from "@/server/services/lookups";
import { PageHead, Panel, FilterLinks } from "@/components/platform/ui";
import { RequestsTable } from "@/components/platform/lists";

export const metadata = { title: "Requests" };

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const actor = await requireOperatorPage();
  const sp = await searchParams;
  const r = await repo();
  const L = await lookups(r, actor);
  let reqs = (await r.list("requests")).filter((x) => L.visible(x.orgId));
  if (sp.status === "open") reqs = reqs.filter((x) => !["completed", "declined"].includes(x.status));
  else if (sp.status) reqs = reqs.filter((x) => x.status === sp.status);
  return (
    <>
      <PageHead title="Requests" description="Work clients asked for. Route each one to a person, a Bot, or both — the client only sees the result." />
      <FilterLinks current={sp.status ?? ""} items={[
        { key: "", label: "All", href: "/ops/requests" }, { key: "open", label: "Open", href: "/ops/requests?status=open" },
        { key: "submitted", label: "New", href: "/ops/requests?status=submitted" }, { key: "in_progress", label: "In progress", href: "/ops/requests?status=in_progress" },
        { key: "waiting_on_client", label: "Waiting on client", href: "/ops/requests?status=waiting_on_client" }, { key: "completed", label: "Completed", href: "/ops/requests?status=completed" },
      ]} />
      <Panel flush><RequestsTable requests={reqs} names={{ orgs: L.orgs, bots: L.bots, users: L.users }} /></Panel>
    </>
  );
}
