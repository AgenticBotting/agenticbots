import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { lookups } from "@/server/services/lookups";
import { SKILLS } from "@/config/skills";
import { getBotType } from "@/config/bot-catalog";
import { PageHead, Panel, Table } from "@/components/platform/ui";

export const metadata = { title: "Skills" };

export default async function SkillsPage() {
  const actor = await requireOperatorPage();
  const r = await repo();
  const L = await lookups(r, actor);
  const assignments = (await r.list("skill_assignments")).filter((a) => !a.removedAt && L.visible(a.orgId));
  return (
    <>
      <PageHead title="Skills" description="AgenticBots' operating playbooks (runtime/skills). Versioned in git, deployed per Bot, never visible to clients. Assign them from a Bot's page." />
      <Panel flush>
        <Table head={["Skill", "Version", "Allowed for", "Writes", "Assigned to"]}>
          {SKILLS.map((s) => {
            const on = assignments.filter((a) => a.skillKey === s.key);
            return (
              <tr key={s.key}>
                <td><strong className="text-[var(--foreground)]">{s.name}</strong><div className="pf-small pf-muted">{s.description}</div><div className="pf-mono pf-muted">runtime/skills/{s.key}</div></td>
                <td className="pf-mono">{s.version}</td>
                <td className="pf-small">{s.botTypes.map((t) => getBotType(t)?.displayName).join(", ")}</td>
                <td className="pf-small">{s.writes ? "Yes — approval rules apply" : "Read-only"}</td>
                <td className="pf-small">{on.length === 0 ? <span className="pf-muted">Not assigned</span> : on.map((a) => `${L.orgs.get(a.orgId)} · ${L.bots.get(a.botId)?.name ?? ""}${a.skillVersion !== s.version ? ` (v${a.skillVersion} — update available)` : ""}`).join("; ")}</td>
              </tr>
            );
          })}
        </Table>
      </Panel>
    </>
  );
}
