import { requirePortalPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { clientProspects } from "@/server/prospecting/views";
import { ensureDemoMarket } from "@/server/prospecting/demo-seed";

export const metadata = { title: "Prospects" };

export default async function PortalProspects() {
  const { actor, org } = await requirePortalPage();
  const r = await repo();
  await ensureDemoMarket(r);
  const rows = await clientProspects(r, actor, org.id);
  const ready = rows.filter((r) => r.status === "Ready for outreach").length;
  return (
    <>
      <h1>Prospects</h1>
      <p className="lede">Companies your Prospecting Bot found, who to talk to, and why now.</p>
      {rows.length === 0 ? (
        <p className="pf-muted mt-6">No prospects yet. They appear here once your Prospecting Bot has researched a market.</p>
      ) : (
        <>
          <p className="pf-small pf-muted mt-4">{rows.length} prospects · {ready} ready for outreach</p>
          <div className="pf-table-wrap mt-3">
            <table className="pf-table">
              <thead>
                <tr><th scope="col">Company</th><th scope="col">Decision maker</th><th scope="col">Why</th><th scope="col">Status</th></tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.company}</strong><div className="pf-small pf-muted">{p.buyerType}{p.location ? ` · ${p.location}` : ""}{p.demo ? " · sample data" : ""}</div></td>
                    <td>{p.contact ? <>{p.contact.name}<div className="pf-small pf-muted">{p.contact.title}</div></> : <span className="pf-muted">Finding</span>}</td>
                    <td className="pf-small">{p.why.slice(0, 2).join(" ")}</td>
                    <td>{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
