import Link from "next/link";
import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { lookups } from "@/server/services/lookups";
import { PageHead, Panel, Table, When, Empty, Bar } from "@/components/platform/ui";
import { Status } from "@/components/platform/status";
import { ActionButton, ConfirmAction } from "@/components/platform/actions";
import * as A from "../actions";

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
      <Panel flush>
        <Table head={["Client", "EC2 instance", "EC2", "Runtime", "Engine ready", "Disk", "Heartbeat", "Tunnel", "Backup", "Last restart", "Version", "Deployment", ""]} empty={<Empty title="No runtimes yet" />}>
          {runtimes.map((rt) => {
            const org = L.orgList.find((o) => o.id === rt.orgId);
            return (
              <tr key={rt.id}>
                <td><Link className="row-link" href={`/ops/clients/${rt.orgId}?tab=infrastructure`}>{org?.name}</Link><div className="pf-small pf-muted">{rt.region} · {rt.instanceType}</div></td>
                <td className="pf-mono">{rt.instanceId ?? "—"}</td>
                <td><Status value={rt.ec2State ?? "unknown"} /></td>
                <td><Status value={rt.health} /></td>
                <td>{rt.ready ? "Ready" : <span className="pf-muted">Not ready</span>}</td>
                <td style={{ minWidth: 90 }}>{rt.diskUsedPct !== undefined ? <><Bar pct={rt.diskUsedPct} tone={rt.diskUsedPct > 85 ? "bad" : rt.diskUsedPct > 70 ? "watch" : undefined} /><span className="pf-small">{rt.diskUsedPct}%</span></> : "—"}</td>
                <td><When iso={rt.lastHeartbeatAt} /></td>
                <td><Status value={rt.tunnel} /></td>
                <td><Status value={rt.backup.status} /><div className="pf-small"><When iso={rt.backup.lastSnapshotAt} /></div></td>
                <td><When iso={rt.lastRestartAt} /></td>
                <td className="pf-small">{rt.runtimeVersion}<div className="pf-mono pf-muted">{rt.kind === "hermes" ? "hermes " : "demo "}{rt.engineVersion}</div></td>
                <td><Status value={rt.deploymentState} /></td>
                <td>
                  <div className="flex flex-col gap-1.5">
                    <ActionButton action={A.refreshHealthAction} hidden={{ runtimeId: rt.id }} label="Refresh health" variant="ghost" pendingLabel="Checking…" />
                    {rt.deploymentState !== "suspended" && <ConfirmAction action={A.restartRuntimeAction} hidden={{ runtimeId: rt.id }} variant="outline" label="Restart" title={`Restart ${org?.name}'s runtime?`} body="Active runs are interrupted. Storage is untouched." confirmLabel="Restart runtime" />}
                    {rt.deploymentState === "suspended" ? (
                      <ConfirmAction action={A.reactivateClientAction} hidden={{ orgId: rt.orgId }} variant="primary" label="Reactivate" title={`Reactivate ${org?.name}?`} body="Starts the runtime and waits for health before marking the client active." confirmLabel="Reactivate" />
                    ) : (
                      <ConfirmAction action={A.suspendClientAction} hidden={{ orgId: rt.orgId, reason: "manual" }} label="Suspend" title={`Suspend ${org?.name}?`} body="Blocks new work, stops active runs and stops the runtime service. Storage is preserved. For billing suspensions use the client page so the reason is recorded." confirmLabel="Suspend runtime" />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </Panel>
      <Panel title="Deployment history" flush className="mt-4">
        <Table head={["Client", "Change", "Engine", "Status", "When"]} empty={<Empty title="No deployments" />}>
          {deployments.map((d) => <tr key={d.id}><td>{L.orgs.get(d.orgId)}</td><td className="pf-small">{d.kind.replace(/_/g, " ")} — {d.detail}</td><td className="pf-mono">{d.engineVersion ?? "—"}</td><td><Status value={d.status} /></td><td><When iso={d.createdAt} /></td></tr>)}
        </Table>
      </Panel>
    </>
  );
}
