import { PageHead, Panel, Table, Empty } from "@/components/platform/ui";
import { pageCtx } from "../_lib";

export const metadata = { title: "Signals" };

export default async function SignalsPage() {
  const { ctx } = await pageCtx();
  const [signals, companies] = await Promise.all([ctx.store.list("pg_signals"), ctx.store.list("pg_companies")]);
  const cn = new Map(companies.map((c) => [c.id, c.canonicalName]));
  const now = ctx.now.getTime();
  const rows = signals.sort((a, b) => b.observedAt.localeCompare(a.observedAt)).slice(0, 300);
  return (
    <>
      <PageHead title="Signals" description="'Why now' events a source actually reported, with where they came from and when they expire. Nothing here is inferred." />
      <Panel flush>
        <Table head={["Company", "Signal", "Type", "Observed", "Expires", "Source"]} empty={<Empty title="No signals yet" />}>
          {rows.map((s) => (
            <tr key={s.id} className={Date.parse(s.expiresAt) < now ? "opacity-60" : undefined}>
              <td>{cn.get(s.companyId) ?? "?"}</td>
              <td>{s.summary}</td>
              <td className="pf-small">{s.type.replace(/_/g, " ")}</td>
              <td>{s.observedAt.slice(0, 10)}</td>
              <td>{s.expiresAt.slice(0, 10)}</td>
              <td className="pf-small pf-muted">{s.provenance.provider}{s.provenance.demo ? " (demo)" : ""} · {Math.round(s.confidence * 100)}%</td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
