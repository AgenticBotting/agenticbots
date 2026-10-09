import type { Metadata } from "next";
import "../platform.css";
import { Logo } from "@/components/ui/Logo";
import { PortalMobileTabs, PortalNav } from "@/components/platform/PortalNav";
import { requirePortalPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { exitPortalPreview } from "@/app/ops/actions";
import { portalLogout } from "./actions";

export const metadata: Metadata = {
  title: { default: "AgenticBots", template: "%s · AgenticBots" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { actor, org, preview } = await requirePortalPage();
  const approvals = (await (await repo()).list("approvals", { orgId: org.id })).filter((a) => a.status === "pending" && a.audience === "client").length;
  return (
    <div className="pf pf-portal">
      {preview && (
        <div className="pf-preview-bar" role="status">
          Viewing {org.name}&apos;s portal exactly as the client sees it. Read-only.
          <form action={exitPortalPreview}><button type="submit" className="underline">Back to operator console</button></form>
        </div>
      )}
      <header className="pf-portal-head">
        <div className="pf-portal-head-inner">
          <Logo variant="light" height={18} href="/portal" />
          <PortalNav approvals={approvals} />
          <div className="pf-portal-org">
            <div className="n">{org.name}</div>
            <div className="meta">
              {actor.user.name}
              {!preview && (
                <form action={portalLogout} className="inline"> · <button type="submit" className="underline-offset-2 hover:underline">Sign out</button></form>
              )}
            </div>
          </div>
        </div>
      </header>
      <main id="main" className="pf-portal-main">{children}</main>
      <footer className="pf-portal-main"><a href="/privacy" className="underline">Privacy policy</a> · <a href="/terms" className="underline">Terms</a> · <a href="/portal/account" className="underline">Account, privacy & cancellation</a></footer>
      <PortalMobileTabs approvals={approvals} />
    </div>
  );
}
