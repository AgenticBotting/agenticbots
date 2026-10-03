import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { lookups } from "@/server/services/lookups";
import { PageHead, Panel, FilterLinks } from "@/components/platform/ui";
import { AutomationsTable } from "@/components/platform/lists";
import { ActionButton, ConfirmAction } from "@/components/platform/actions";
import { AutomationForm } from "@/components/platform/forms";
import * as A from "../actions";

export const metadata = { title: "Automations" };

export default async function AutomationsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const actor = await requireOperatorPage();
  const sp = await searchParams;
  const r = await repo();
  const L = await lookups(r, actor);
  let jobs = (await r.list("automation_jobs")).filter((j) => L.visible(j.orgId));
  if (sp.status) jobs = jobs.filter((j) => j.status === sp.status);
  const bots = [...L.bots.values()].filter((b) => b.status !== "disabled").map((b) => ({ id: b.id, name: `${L.orgs.get(b.orgId)} — ${b.name}` }));
  return (
    <>
      <PageHead title="Automations" description="Scheduled Bot work, managed by AgenticBots. Clients see the results as activity." />
      <FilterLinks current={sp.status ?? ""} items={[{ key: "", label: "All", href: "/ops/automations" }, { key: "active", label: "Active", href: "/ops/automations?status=active" }, { key: "failing", label: "Failing", href: "/ops/automations?status=failing" }, { key: "paused", label: "Paused", href: "/ops/automations?status=paused" }]} />
      <div className="pf-grid">
        <Panel flush>
          <AutomationsTable jobs={jobs} names={{ orgs: L.orgs, bots: L.bots }} actions={(j) => (
            <div className="flex flex-wrap gap-1.5">
              <ActionButton action={A.automationAction} hidden={{ jobId: j.id, op: "run" }} label="Run now" variant="ghost" />
              <ActionButton action={A.automationAction} hidden={{ jobId: j.id, op: j.status === "paused" ? "resume" : "pause" }} label={j.status === "paused" ? "Resume" : "Pause"} variant="ghost" />
              <ConfirmAction action={A.automationAction} hidden={{ jobId: j.id, op: "delete" }} label="Delete" title="Delete this automation?" body="The schedule is removed from the runtime. Past runs stay in the history." confirmLabel="Delete automation" />
            </div>
          )} />
        </Panel>
        <Panel title="Create automation"><AutomationForm bots={bots} /></Panel>
      </div>
    </>
  );
}
