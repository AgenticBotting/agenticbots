import type { Metadata } from "next";
import "../../platform.css";
import { Logo } from "@/components/ui/Logo";
import { SetPasswordForm } from "./SetPasswordForm";

export const metadata: Metadata = { title: "Set your password", robots: { index: false, follow: false } };

export default async function SetPassword({ searchParams }: { searchParams: Promise<{ u?: string; t?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="pf pf-auth">
      <aside className="pf-auth-side"><Logo variant="light" height={22} href="/" /><h2>Welcome to AgenticBots.</h2><span /></aside>
      <main className="pf-auth-main">
        <div className="pf-auth-card">
          <h1 className="text-[26px] tracking-[-0.035em]">Set your password</h1>
          {sp.u && sp.t ? <SetPasswordForm u={sp.u} t={sp.t} /> : <div className="pf-msg err">This link is incomplete. Open the full link from your invitation.</div>}
        </div>
      </main>
    </div>
  );
}
