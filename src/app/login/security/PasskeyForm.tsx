"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";

export function PasskeyForm({ enrolling, verified }: { enrolling: boolean; verified: boolean }) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function request(data: object) {
    const res = await fetch("/api/session/passkey", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const value = await res.json();
    if (!res.ok) throw new Error(value.error?.message ?? "Verification is unavailable.");
    return value;
  }
  async function verify(addBackup = false) {
    setBusy(true); setError("");
    try {
      const value = await request({ action: "options", enrollmentToken: token, addBackup });
      setToken("");
      const response = value.purpose === "register" ? await startRegistration({ optionsJSON: value.options }) : await startAuthentication({ optionsJSON: value.options });
      await request({ action: "verify", id: value.id, response });
      router.replace("/ops");
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Verification was cancelled. Try again."); }
    finally { setBusy(false); }
  }
  return <form className="pf-form" onSubmit={e => { e.preventDefault(); void verify(); }}>
    {enrolling && <label className="pf-label">Staff enrollment code<span className="hint">Get this temporary code directly from the owner. It is separate from your password.</span><input type="password" autoComplete="off" value={token} onChange={e => setToken(e.target.value)} className="field" required /></label>}
    {error && <p role="alert" className="pf-msg err">{error}</p>}
    <button className="btn btn-primary" disabled={busy}>{busy ? "Waiting for your device…" : enrolling ? "Register a passkey" : "Verify passkey"}</button>
    {!enrolling && verified && <button className="btn btn-outline" type="button" disabled={busy} onClick={() => void verify(true)}>Add a backup passkey</button>}
    <p className="pf-small">Lost access? Contact the owner for identity-verified recovery. Password reset alone cannot remove this protection.</p>
  </form>;
}
