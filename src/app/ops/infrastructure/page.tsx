import Link from "next/link";
import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { lookups } from "@/server/services/lookups";
import { PageHead, Panel, When, Empty, Bar } from "@/components/platform/ui";
import { Avatar, Card, Lights, TimelineList, toneFor } from "@/components/platform/viz";
import { Status } from "@/components/platform/status";
import { ActionButton, ConfirmAction } from "@/components/platform/actions";
import * as A from "../actions";
import { runtimeProviderLabel } from "@/server/runtime";

export const metadata = { title: "Infrastructure" };

export default async function InfrastructurePage() {
  const actor = await requireOperatorPage();
  const r = await repo();
  const L = await lookups(r, actor);
  const runtimes = (await r.list("runtimes", { order: "asc" })).filter((x) => L.visible(x.orgId));
  const deployments = (await r.list("deployment_events", { limit: 30 })).filter((x) => L.visible(x.orgId));
  return (
    <>
      <PageHead title="Infrastructure" description="One isolated runtime per client: its own server, encrypted storage, pinned engine version and private connectivity. Clients never see this." />
      <div className="pf-cards" style={{ "--min": "360px" } as React.CSSProperties}>
        {runtimes.length === 0 && <Panel><Empty title="No runtimes yet" /></Panel>}
        {runtimes.map((rt) => {
          const org = L.orgList.find((o) => o.id === rt.orgId);
          const diskTone = rt.diskUsedPct === undefined ? undefined : rt.diskUsedPct > 85 ? "bad" : rt.diskUsedPct > 70 ? "watch" : undefined;
          return (
            <Card key={rt.id} tone={rt.health === "offline" ? "bad" : rt.health === "degraded" ? "watch" : undefined}>
              <div className="head">
                <Avatar name={org?.name ?? ""} />
                <div className="min-w-0">
                  <Link className="title hover:underline" href={`/ops/clients/${rt.orgId}?tab=infrastructure`}>{org?.name}</Link>
                  <div className="sub">{rt.region}, {rt.instanceType}</div>
                </div>
                <Status value={rt.deploymentState} />
              </div>
              <Lights items={[
                { label: "Server", tone: toneFor(rt.ec2State === "running" ? "running" : rt.ec2State === "stopped" ? undefined : rt.ec2State === "terminated" ? "failed" : undefined), title: rt.ec2State ?? "unknown" },
                { label: "Engine", tone: rt.ready ? "good" : rt.health === "stopped" ? "quiet" : "bad", title: rt.ready ? "ready" : rt.health },
                { label: "Tunnel", tone: rt.tunnel === "connected" ? "good" : rt.tunnel === "down" ? "bad" : "quiet", title: rt.tunnel },
                { label: "Backup", tone: toneFor(rt.backup.status === "ok" ? "ok" : rt.backup.status === "failed" ? "failed" : undefined), title: rt.backup.status },
              ]} />
              <div>
                <div className="flex justify-between pf-small mb-1.5"><span className="pf-muted">Data volume</span><span className="font-semibold">{rt.diskUsedPct !== undefined ? `${rt.diskUsedPct}% used` : "—"}</span></div>
                <Bar pct={rt.diskUsedPct ?? 0} tone={diskTone} />
              </div>
              <div className="figs">
                <div><div className="k">Heartbeat</div><div className="v text-[14px]"><When iso={rt.lastHeartbeatAt} /></div></div>
                <div><div className="k">Last backup</div><div className="v text-[14px]"><When iso={rt.backup.lastSnapshotAt} /></div></div>
                <div><div className="k">Last restart</div><div className="v text-[14px]"><When iso={rt.lastRestartAt} /></div></div>
              </div>
              <div className="foot">
                <span className="pf-chip-model" title="Engine version">{runtimeProviderLabel(rt.provider)} {rt.engineVersion}</span>
                <span className="pf-chip-model" title="Runtime bundle">bundle {rt.runtimeVersion}</span>
                <span className="pf-mono">{rt.instanceId ?? "not provisioned"}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[var(--border)] -mx-4 px-4 pt-3">
                <ActionButton action={A.refreshHealthAction} hidden={{ runtimeId: rt.id }} label="Refresh health" variant="ghost" pendingLabel="Checking…" />
                {rt.deploymentState !== "suspended" && <ConfirmAction action={A.restartRuntimeAction} hidden={{ runtimeId: rt.id }} variant="outline" label="Restart" title={`Restart ${org?.name}'s runtime?`} body="Active runs are interrupted. Storage is untouched." confirmLabel="Restart runtime" />}
                {rt.deploymentState === "suspended" ? (
                  <ConfirmAction action={A.reactivateClientAction} hidden={{ orgId: rt.orgId }} variant="primary" label="Reactivate" title={`Reactivate ${org?.name}?`} body="Starts the runtime and waits for health before marking the client active." confirmLabel="Reactivate" />
                ) : (
                  <ConfirmAction action={A.suspendClientAction} hidden={{ orgId: rt.orgId, reason: "manual" }} label="Suspend" title={`Suspend ${org?.name}?`} body="Blocks new work, stops active runs and stops the runtime service. Storage is preserved. For billing suspensions use the client page so the reason is recorded." confirmLabel="Suspend runtime" />
                )}
              </div>
            </Card>
          );
        })}
      </div>
      <Panel title="Deployment history" sub="Newest first" flush className="mt-4">
        <TimelineList
          empty="No deployments yet."
          items={deployments.map((d) => ({
            key: d.id,
            at: d.createdAt,
            tone: toneFor(d.status),
            title: <><strong className="font-semibold">{d.kind.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())}</strong><span className="pf-muted ml-2">{L.orgs.get(d.orgId)}</span></>,
            sub: <>{d.detail}{d.engineVersion ? <span className="pf-mono ml-2">{d.engineVersion}</span> : null}</>,
          }))}
        />
      </Panel>
    </>
  );
}
