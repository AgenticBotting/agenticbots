import Link from "next/link";
import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { lookups } from "@/server/services/lookups";
import { PageHead, Panel, FilterLinks } from "@/components/platform/ui";
import { AutomationsTable } from "@/components/platform/lists";
import { ActionButton, ConfirmAction } from "@/components/platform/actions";
import { AutomationForm } from "@/components/platform/forms";
import * as A from "../actions";
import { Kpi, KpiRow } from "@/components/platform/viz";
import { CalendarClock, CheckCircle2, PauseCircle, AlertTriangle, Plus } from "lucide-react";

export const metadata = { title: "Automations" };

export default async function AutomationsPage({ searchParams }: { searchParams: Promise<{ status?: string; new?: string }> }) {
  const actor = await requireOperatorPage();
  const sp = await searchParams;
  const r = await repo();
  const L = await lookups(r, actor);
  const all = (await r.list("automation_jobs")).filter((j) => L.visible(j.orgId));
  let jobs = all;
  const ran = all.filter((j) => j.lastStatus);
  const ok = ran.filter((j) => j.lastStatus === "succeeded").length;
  if (sp.status) jobs = jobs.filter((j) => sp.status === "failed" ? j.status === "failed" || j.consecutiveFailures >= 2 : j.status === sp.status);
  const bots = [...L.bots.values()].filter((b) => b.status !== "disabled").map((b) => ({ id: b.id, name: `${L.orgs.get(b.orgId)} — ${b.name}` }));
  return (
    <>
      <PageHead title="Automations" description="Scheduled Bot work, managed by AgenticBots. Clients see the results as activity." />
      <KpiRow cols={4}>
        <Kpi icon={CalendarClock} value={all.filter((j) => j.status === "active").length} label="Active schedules" href="/ops/automations?status=active" hint={`${all.length} automations in total`} />
        <Kpi icon={CheckCircle2} value={ran.length ? `${Math.round((ok / ran.length) * 100)}%` : "—"} label="Last run succeeded" meter={ran.length ? { pct: (ok / ran.length) * 100, tone: ok < ran.length ? "watch" : undefined } : undefined} hint={`${ok} of ${ran.length} most recent runs`} />
        <Kpi icon={AlertTriangle} value={all.filter((j) => (j.status === "failed" || j.consecutiveFailures >= 2)).length} label="Failing" href="/ops/automations?status=failed" tone={all.some((j) => (j.status === "failed" || j.consecutiveFailures >= 2)) ? "bad" : undefined} hint="Two or more failures in a row" />
        <Kpi icon={PauseCircle} value={all.filter((j) => j.status === "paused").length} label="Paused" href="/ops/automations?status=paused" hint="Not running until resumed" />
      </KpiRow>
      <FilterLinks
        current={sp.status ?? ""}
        items={[{ key: "", label: "All", href: "/ops/automations", count: all.length }, { key: "active", label: "Active", href: "/ops/automations?status=active", count: all.filter((j) => j.status === "active").length }, { key: "failed", label: "Failing", href: "/ops/automations?status=failed", count: all.filter((j) => (j.status === "failed" || j.consecutiveFailures >= 2)).length }, { key: "paused", label: "Paused", href: "/ops/automations?status=paused", count: all.filter((j) => j.status === "paused").length }]}
        trailing={<Link href="/ops/automations?new=1#new-automation" className="btn btn-primary"><Plus className="h-4 w-4" aria-hidden="true" />New automation</Link>}
      />
      <div className="pf-grid">
        <Panel flush>
          <AutomationsTable jobs={jobs} names={{ orgs: L.orgs, bots: L.bots }} actions={(j) => (
            <div className="flex flex-nowrap gap-1 justify-end">
              <ActionButton action={A.automationAction} hidden={{ jobId: j.id, op: "run" }} label="Run now" variant="ghost" />
              <ActionButton action={A.automationAction} hidden={{ jobId: j.id, op: j.status === "paused" ? "resume" : "pause" }} label={j.status === "paused" ? "Resume" : "Pause"} variant="ghost" />
              <ConfirmAction action={A.automationAction} hidden={{ jobId: j.id, op: "delete" }} label="Delete" title="Delete this automation?" body="The schedule is removed from the runtime. Past runs stay in the history." confirmLabel="Delete automation" />
            </div>
          )} />
        </Panel>
        <details className="pf-disclosure" id="new-automation" open={sp.new === "1"}>
          <summary>New automation</summary>
          <div className="body"><AutomationForm bots={bots} /></div>
        </details>
      </div>
    </>
  );
}
