import { requirePortalPage } from "@/server/auth/guard";
import { portalData } from "@/server/views/portal";

export const metadata = { title: "Integrations" };

const TONE = { Connected: "good", "Needs Attention": "watch", Disconnected: "bad" } as const;

export default async function IntegrationsPage() {
  const { org } = await requirePortalPage();
  const d = await portalData(org);
  return (
    <>
      <h1>Integrations</h1>
      <p className="lede">The systems your Bots work in. AgenticBots manages the connections; if one needs something from you, we&apos;ll reach out.</p>
      <section className="pf-section">
        {d.integrations.length === 0 ? (
          <p className="pf-muted">No systems connected yet.</p>
        ) : (
          <ul className="pf-feed">
            {d.integrations.map((i) => (
              <li key={i.id}>
                <span className={`pf-status ${TONE[i.status]}`}>{i.status}</span>
                <span className="t">
                  <strong>{i.name}</strong>
                  {i.purpose && <span className="block pf-small pf-muted">{i.purpose}</span>}
                  {i.message && <span className="block pf-small">{i.message}</span>}
                </span>
                <span />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
