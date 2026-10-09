import { approvalDisplayStatus } from "@/lib/platform/approval-status";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import "../platform.css";
import "./console.css";
import { Logo } from "@/components/ui/Logo";
import { OpsNav } from "@/components/platform/OpsNav";
import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { can } from "@/server/auth/policy";
import { platformMode } from "@/server/env";
import { logoutAction } from "./actions";

export const metadata: Metadata = {
  title: { default: "Operator console", template: "%s · Operator console" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireOperatorPage();
  const r = await repo();
  const [approvals, requests, incidents] = await Promise.all([r.list("approvals"), r.list("requests"), r.list("incidents")]);
  const scoped = <T extends { orgId: string }>(rows: T[]) => rows.filter((x) => can(actor, "ops.view", x.orgId));
  const counts = {
    approvals: scoped(approvals).filter((a) => approvalDisplayStatus(a) === "pending").length,
    requests: scoped(requests).filter((q) => q.status === "submitted").length,
    incidents: scoped(incidents).filter((i) => i.status === "open").length,
  };
  const mode = platformMode();
  return (
    <div className="pf pf-ops">
      <aside className="pf-rail">
        <div className="pf-rail-head">
          <Logo variant="light" height={20} href="/ops" />
          <div className="pf-rail-env">
            <span className={`pf-status ${mode === "production" ? "good" : "watch"}`} style={{ color: "inherit" }}>
              {mode === "demo" ? "Demo data" : mode === "staging" ? "Staging" : "Production"}
            </span>
          </div>
        </div>
        <OpsNav counts={counts} />
        <div className="pf-rail-foot">
          <a href="/login/security" className="underline">Verify access / backup key</a><br/><a href="/privacy" className="underline">Privacy</a> · <a href="/terms" className="underline">Terms</a>
          <div className="who">{actor.user.name}</div>
          <div className="role">{actor.platformRole === "superadmin" ? "Superadmin" : "Operator"}</div>
          <form action={logoutAction} className="mt-2">
            <button type="submit" className="text-[12.5px] text-[var(--color-ink-300)] hover:text-white underline-offset-2 hover:underline">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="pf-main">
        <div className="pf-topbar">
          <form action="/ops/search" className="pf-search" role="search">
            <Search aria-hidden="true" />
            <label htmlFor="ops-q" className="sr-only">Search clients, Bots, runs, invoices</label>
            <input id="ops-q" name="q" className="field" placeholder="Search clients, Bots, run IDs, requests, invoices, payment refs" />
          </form>
        </div>
        <main id="main" className="pf-content">{children}</main>
      </div>
    </div>
  );
}
