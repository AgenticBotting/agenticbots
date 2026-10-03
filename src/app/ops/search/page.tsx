import Link from "next/link";
import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { operatorSearch } from "@/server/services/search";
import { PageHead, Panel, Table, Empty } from "@/components/platform/ui";
import { titleCase } from "@/lib/platform/format";

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const actor = await requireOperatorPage();
  const q = (await searchParams).q ?? "";
  const hits = await operatorSearch(await repo(), actor, q);
  return (
    <>
      <PageHead title={q ? `Results for “${q}”` : "Search"} description="Clients, Bots, run IDs, correlation IDs, requests, integrations, incidents, operators, invoices and payment references." />
      <Panel flush>
        <Table head={["Type", "Result", "Detail"]} empty={<Empty title={q.length < 2 ? "Type at least two characters" : "Nothing matched"} />}>
          {hits.map((h) => <tr key={`${h.kind}${h.id}`}><td className="pf-small">{titleCase(h.kind)}</td><td><Link className="row-link" href={h.href}>{h.title}</Link></td><td className="pf-small pf-muted">{h.subtitle}</td></tr>)}
        </Table>
      </Panel>
    </>
  );
}
