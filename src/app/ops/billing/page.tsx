import Link from "next/link";
import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { billingOverview } from "@/server/billing/overview";
import { PageHead, Panel, Stats, Stat, Table, FilterLinks, Empty } from "@/components/platform/ui";
import { Status } from "@/components/platform/status";
import { money, usd } from "@/lib/platform/format";

export const metadata = { title: "Billing" };

const FILTER: Record<string, (x: Awaited<ReturnType<typeof billingOverview>>["rows"][number]) => boolean> = {
  all: () => true,
  paid: (x) => x.paymentStatus === "paid",
  due: (x) => x.paymentStatus === "due",
  past_due: (x) => x.paymentStatus === "past_due",
  partially_paid: (x) => x.paymentStatus === "partially_paid",
  suspended: (x) => x.org.status === "suspended",
  upcoming: (x) => x.paymentStatus === "upcoming",
};

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const actor = await requireOperatorPage();
  const f = (await searchParams).f ?? "all";
  const { rows, metrics: m } = await billingOverview(await repo(), actor);
  const shown = rows.filter(FILTER[f] ?? FILTER.all);
  return (
    <>
      <PageHead title="Billing" description="Manual, provider-agnostic billing: service agreements, invoices and payments received by ACH, wire or check. No card processor required." />
      <Stats>
        <Stat value={money(m.mrrCents)} label="Monthly recurring revenue" />
        <Stat value={money(m.activeContractValueCents)} label="Active contract value (annual)" />
        <Stat value={money(m.outstandingCents)} label="Outstanding receivables" />
        <Stat value={money(m.paymentsThisMonthCents)} label="Payments received this month" />
        <Stat value={m.pastDueAccounts} label="Past-due accounts" tone={m.pastDueAccounts ? "bad" : undefined} />
        <Stat value={m.eligibleForSuspension} label="Eligible for suspension" tone={m.eligibleForSuspension ? "watch" : undefined} />
        <Stat value={m.suspendedForBilling} label="Suspended for billing" />
        <Stat value={money(m.implementationFeesOutstandingCents)} label="Implementation fees outstanding" />
        <Stat value={usd(m.estimatedOperatingCostUsd, 0)} label="Est. operating cost (mo)" />
        <Stat value={money(m.estimatedGrossMarginCents)} label="Est. gross margin (mo)" />
      </Stats>
      <FilterLinks current={f} items={[["all", "All"], ["paid", "Paid"], ["due", "Due"], ["past_due", "Past due"], ["partially_paid", "Partially paid"], ["suspended", "Suspended"], ["upcoming", "Upcoming"]].map(([k, l]) => ({ key: k, label: l, href: `/ops/billing?f=${k}` }))} />
      <Panel flush>
        <Table head={["Client", "Monthly value", "Implementation", "Frequency", "Pref. method", "Agreement", "Last invoice", "Payment status", "Outstanding", "Last payment", "Next billing", "Grace", "Account", "Suspension", ""]} empty={<Empty title="No clients match" />}>
          {shown.map((x) => (
            <tr key={x.org.id}>
              <td><Link className="row-link" href={`/ops/clients/${x.org.id}?tab=billing`}>{x.org.name}</Link></td>
              <td className="num">{x.agreement ? money(x.agreement.monthlyValueCents) : "—"}</td>
              <td className="num">{x.agreement ? money(x.agreement.implementationFeeCents) : "—"}</td>
              <td className="pf-small">{x.agreement?.billingFrequency ?? "—"}</td>
              <td className="pf-small">{x.agreement?.preferredPaymentMethod.toUpperCase().replace("_", " ") ?? "—"}</td>
              <td>{x.agreement ? <Status value={x.agreement.status} /> : <span className="pf-muted">none</span>}</td>
              <td className="pf-small">{x.lastInvoice ? <Link className="underline pf-mono" href={`/ops/billing/invoices/${x.lastInvoice.id}`}>{x.lastInvoice.invoiceNumber}</Link> : "—"}{x.lastInvoice && <div>{money(x.lastInvoice.totalCents)} · due {x.lastInvoice.dueDate}</div>}</td>
              <td><Status value={x.paymentStatus} />{x.inGrace && <div className="pf-small pf-muted">in grace period</div>}</td>
              <td className="num"><strong>{money(x.outstandingCents)}</strong></td>
              <td className="pf-small">{x.lastPayment ? <>{money(x.lastPayment.amountCents)}<div className="pf-muted">{x.lastPayment.dateReceived}</div></> : "—"}</td>
              <td className="pf-small">{x.nextBillingDate ?? "—"}</td>
              <td className="pf-small">{x.agreement ? `${x.agreement.gracePeriodDays}d` : "—"}</td>
              <td><Status value={x.org.status} /></td>
              <td className="pf-small">{x.org.status === "suspended" ? <>{x.org.suspension?.reason}{x.org.eligibleForReactivation && <div className="text-[var(--accent-text)] font-semibold">Eligible for reactivation</div>}</> : x.eligibleForSuspension ? <span className="text-[var(--color-danger)]">{x.worstDaysPastDue}d past due — eligible</span> : "—"}</td>
              <td>{x.agreement && <Link className="btn btn-outline" href={`/ops/billing/new-invoice?client=${x.org.id}`}>Invoice</Link>}</td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
