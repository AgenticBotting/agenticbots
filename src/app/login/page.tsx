import type { Metadata } from "next";
import { redirect } from "next/navigation";
import "../platform.css";
import { Logo } from "@/components/ui/Logo";
import { currentActor } from "@/server/auth/session";
import { isStaff } from "@/server/auth/policy";
import { isDemo } from "@/server/env";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/server/demo/seed";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const actor = await currentActor().catch(() => null);
  if (actor && !sp.error) redirect(isStaff(actor) ? "/ops" : "/portal");
  const demo = isDemo();
  return (
    <div className="pf pf-auth">
      <aside className="pf-auth-side">
        <Logo variant="light" height={22} href="/" />
        <div>
          <h2>Your Bots, working. You, in control of what goes out.</h2>
          <p className="mt-3 max-w-[44ch]">See results and activity, approve sends and changes, and ask AgenticBots for anything — in one place.</p>
        </div>
        <p className="text-[12.5px] text-[var(--color-ink-400)]">AgenticBots operates your Bots for you.</p>
      </aside>
      <main className="pf-auth-main">
        <div className="pf-auth-card">
          <div>
            <h1 className="text-[26px] tracking-[-0.035em]">Sign in</h1>
            <p className="text-[var(--text-secondary)] mt-1">Clients and the AgenticBots team use the same sign-in.</p>
          </div>
          {sp.error === "no_access" && <div className="pf-msg err">Your account is not attached to a client yet. Contact AgenticBots.</div>}
          <LoginForm next={sp.next ?? ""} demoAccounts={demo ? [...DEMO_ACCOUNTS] : undefined} demoPassword={demo ? DEMO_PASSWORD : undefined} />
        </div>
      </main>
    </div>
  );
}
