import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { lookups } from "@/server/services/lookups";
import { SKILLS } from "@/config/skills";
import { getBotType } from "@/config/bot-catalog";
import { PageHead } from "@/components/platform/ui";
import { Card } from "@/components/platform/viz";
import { BotIndex } from "@/components/ui/BotIndex";

export const metadata = { title: "Skills" };

export default async function SkillsPage() {
  const actor = await requireOperatorPage();
  const r = await repo();
  const L = await lookups(r, actor);
  const assignments = (await r.list("skill_assignments")).filter((a) => !a.removedAt && L.visible(a.orgId));
  return (
    <>
      <PageHead title="Skills" description="AgenticBots' operating playbooks (runtime/skills). Versioned in git, deployed per Bot, never visible to clients. Assign them from a Bot's page." />
      <div className="pf-cards" style={{ "--min": "320px" } as React.CSSProperties}>
        {SKILLS.map((s) => {
          const on = assignments.filter((a) => a.skillKey === s.key);
          const stale = on.filter((a) => a.skillVersion !== s.version).length;
          const clients = new Set(on.map((a) => a.orgId)).size;
          return (
            <Card key={s.key}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="title">{s.name}</div>
                  <div className="pf-mono pf-muted mt-0.5">runtime/skills/{s.key}</div>
                </div>
                <span className="pf-chip-model">v{s.version}</span>
              </div>
              <p className="pf-small text-[var(--text-secondary)]">{s.description}</p>
              <div className="pf-badges">
                {s.writes ? <span className="pf-badge watch">Writes, approval rules apply</span> : <span className="pf-badge good">Read-only</span>}
                {stale > 0 && <span className="pf-badge watch">{stale} on an older version</span>}
              </div>
              <div>
                <div className="pf-small pf-muted mb-1.5">Allowed for</div>
                <div className="flex flex-wrap gap-1.5">
                  {s.botTypes.map((t) => {
                    const bt = getBotType(t);
                    return <span key={t} className="pf-badge"><BotIndex index={bt?.icon ?? "00"} size="sm" className="!h-4 !w-4 !text-[8px]" />{bt?.displayName}</span>;
                  })}
                </div>
              </div>
              <div className="foot">
                {on.length === 0 ? <span>Not assigned yet</span> : <span><strong className="text-[var(--foreground)]">{on.length}</strong> Bot{on.length === 1 ? "" : "s"} across <strong className="text-[var(--foreground)]">{clients}</strong> client{clients === 1 ? "" : "s"}</span>}
              </div>
              {on.length > 0 && (
                <ul className="pf-small text-[var(--text-secondary)] grid gap-1">
                  {on.slice(0, 4).map((a) => <li key={a.id}>{L.bots.get(a.botId)?.name}<span className="pf-muted ml-2">{L.orgs.get(a.orgId)}</span>{a.skillVersion !== s.version && <span className="ml-2 text-[#8A5208]">v{a.skillVersion}</span>}</li>)}
                  {on.length > 4 && <li className="pf-muted">and {on.length - 4} more</li>}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
