import { redirect } from "next/navigation";
import { authenticationSession } from "@/server/auth/session";
import { repo } from "@/server/db";
import "../../platform.css";
import { PasskeyForm } from "./PasskeyForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verify staff access", robots: { index: false, follow: false } };
export default async function SecurityPage() {
  const ctx = await authenticationSession();
  if (!ctx?.user.platformRole) redirect("/login");
  const keys = await (await repo()).list("passkeys", { where: { userId: ctx.user.id } });
  return <main className="pf pf-auth-main"><div className="pf-auth-card"><h1>Verify staff access</h1><p>Use your device’s passkey or a security key to protect your clients’ data.</p><PasskeyForm enrolling={!keys.length} verified={!!ctx.session.mfaVerifiedAt}/><a href="/privacy" className="underline">Privacy policy</a></div></main>;
}
