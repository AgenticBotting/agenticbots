import Link from "next/link";
import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { billingOverview } from "@/server/billing/overview";
import { PageHead, Panel, Table, FilterLinks, Empty } from "@/components/platform/ui";
import { Avatar, Kpi, KpiRow, SegBar, Card } from "@/components/platform/viz";
import { CircleDollarSign, Landmark, Receipt, TrendingUp } from "lucide-react";
import { Status } from "@/components/platform/status";
import { money, titleCase, usd } from "@/lib/platform/format";

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
  const pastDueCents = rows.filter((x) => x.paymentStatus === "past_due").reduce((s, x) => s + x.outstandingCents, 0);
  return (
    <>
      <PageHead title="Billing" description="Manual, provider-agnostic billing: service agreements, invoices and payments received by ACH, wire or check. No card processor required." />
      <KpiRow cols={4}>
        <Kpi icon={CircleDollarSign} value={money(m.mrrCents)} label="Monthly recurring revenue" hint={`${money(m.activeContractValueCents)} active contract value per year`} />
        <Kpi icon={Receipt} value={money(m.outstandingCents)} label="Outstanding receivables" tone={pastDueCents ? "bad" : undefined} meter={m.outstandingCents ? { pct: (pastDueCents / m.outstandingCents) * 100, tone: "bad" } : undefined} hint={pastDueCents ? `${money(pastDueCents)} of it past due` : "Nothing past due"} />
        <Kpi icon={Landmark} value={money(m.paymentsThisMonthCents)} label="Received this month" hint={`${money(m.implementationFeesOutstandingCents)} implementation fees outstanding`} />
        <Kpi icon={TrendingUp} value={money(m.estimatedGrossMarginCents)} label="Est. contribution (mo)" meter={m.mrrCents ? { pct: (m.estimatedGrossMarginCents / m.mrrCents) * 100 } : undefined} hint={`${usd(m.estimatedOperatingCostUsd, 0)} est. operating cost`} />
      </KpiRow>
      <Panel className="mb-4" title="Accounts by payment status">
        <SegBar
          label="Accounts by payment status"
          items={[
            { label: "Paid", value: rows.filter((x) => x.paymentStatus === "paid").length, tone: "good", href: "/ops/billing?f=paid" },
            { label: "Upcoming", value: rows.filter((x) => x.paymentStatus === "upcoming").length, tone: "live", href: "/ops/billing?f=upcoming" },
            { label: "Due", value: rows.filter((x) => x.paymentStatus === "due" || x.paymentStatus === "partially_paid").length, tone: "watch", href: "/ops/billing?f=due" },
            { label: "Past due", value: m.pastDueAccounts, tone: "bad", href: "/ops/billing?f=past_due" },
            { label: "Suspended for billing", value: m.suspendedForBilling, tone: "quiet", href: "/ops/billing?f=suspended" },
          ]}
        />
        {m.eligibleForSuspension > 0 && <p className="pf-small mt-3 text-[#8A5208] font-semibold">{m.eligibleForSuspension} account{m.eligibleForSuspension === 1 ? " is" : "s are"} eligible for suspension. Nothing is suspended automatically.</p>}
      </Panel>
      <p className="oc-note mb-6">Contribution deducts estimated model and runtime costs from recurring contract value. It excludes other overhead and is separate from payments received.</p>
      <div className="pf-cards mb-6">{shown.map(x=><Card key={x.org.id} tone={x.paymentStatus==="past_due" ? "watch" : undefined}><div className="head"><Avatar name={x.org.name}/><Link className="title" href={`/ops/clients/${x.org.id}?tab=billing`}>{x.org.name}</Link><Status value={x.paymentStatus}/></div><div className="figs"><div><div className="k">Contract / month</div><div className="v">{x.agreement ? money(x.agreement.monthlyValueCents) : "—"}</div></div><div><div className="k">Outstanding</div><div className="v">{money(x.outstandingCents)}</div></div><div><div className="k">Last payment</div><div className="v">{x.lastPayment ? money(x.lastPayment.amountCents) : "—"}</div></div></div><div className="foot"><span>Next billing {x.nextBillingDate ?? "not scheduled"}</span><Link className="underline" href={`/ops/clients/${x.org.id}?tab=billing`}>Review account →</Link></div></Card>)}</div>
      <FilterLinks current={f} items={[["all", "All"], ["paid", "Paid"], ["due", "Due"], ["past_due", "Past due"], ["partially_paid", "Partially paid"], ["suspended", "Suspended"], ["upcoming", "Upcoming"]].map(([k, l]) => ({ key: k, label: l, href: `/ops/billing?f=${k}`, count: rows.filter(FILTER[k]).length }))} />
      <Panel flush>
        <Table head={["Client", "Monthly value", "Payment", "Outstanding", "Last invoice", "Last payment", "Next billing", "Suspension", ""]} empty={<Empty title="No clients match" />}>
          {shown.map((x) => (
            <tr key={x.org.id}>
              <td>
                <div className="flex items-center gap-2.5">
                  <Avatar name={x.org.name} size="sm" />
                  <div>
                    <Link className="row-link" href={`/ops/clients/${x.org.id}?tab=billing`}>{x.org.name}</Link>
                    <div className="pf-small pf-muted">{x.agreement ? `${titleCase(x.agreement.billingFrequency)}, ${x.agreement.preferredPaymentMethod.toUpperCase().replace("_", " ")}, ${x.agreement.gracePeriodDays}-day grace` : "No agreement"}</div>
                  </div>
                </div>
              </td>
              <td className="num">{x.agreement ? money(x.agreement.monthlyValueCents) : "—"}{x.agreement && x.agreement.implementationFeeCents > 0 && <div className="pf-small pf-muted">+{money(x.agreement.implementationFeeCents)} setup</div>}</td>
              <td><Status value={x.paymentStatus} />{x.inGrace && <div className="pf-small pf-muted">in grace period</div>}</td>
              <td className="num"><strong>{money(x.outstandingCents)}</strong></td>
              <td className="pf-small">{x.lastInvoice ? <><Link className="underline pf-mono" href={`/ops/billing/invoices/${x.lastInvoice.id}`}>{x.lastInvoice.invoiceNumber}</Link><div className="pf-muted">{money(x.lastInvoice.totalCents)}, due {x.lastInvoice.dueDate}</div></> : "—"}</td>
              <td className="pf-small">{x.lastPayment ? <>{money(x.lastPayment.amountCents)}<div className="pf-muted">{x.lastPayment.dateReceived}</div></> : "—"}</td>
              <td className="pf-small">{x.nextBillingDate ?? "—"}</td>
              <td className="pf-small">{x.org.status === "suspended" ? <><Status value="suspended" /><div className="pf-muted">{x.org.suspension?.reason}</div>{x.org.eligibleForReactivation && <div className="text-[var(--accent-text)] font-semibold">Eligible for reactivation</div>}</> : x.eligibleForSuspension ? <span className="text-[var(--color-danger)] font-semibold">{x.worstDaysPastDue}d past due, eligible</span> : <span className="pf-muted">—</span>}</td>
              <td>{x.agreement && <Link className="btn btn-outline" href={`/ops/billing/new-invoice?client=${x.org.id}`}>Invoice</Link>}</td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
