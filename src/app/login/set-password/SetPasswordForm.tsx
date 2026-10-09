"use client";

import { useActionState, useEffect } from "react";
import { setPasswordAction, type LoginState } from "../actions";
import { SubmitButton } from "@/components/platform/actions";

export function SetPasswordForm({ u, t }: { u: string; t: string }) {
  useEffect(() => { window.history.replaceState(null, "", "/login/set-password"); }, []);
  const [state, action] = useActionState<LoginState, FormData>(setPasswordAction, {});
  return (
    <form action={action} className="pf-form">
      <input type="hidden" name="u" value={u} />
      <input type="hidden" name="t" value={t} />
      <label className="pf-label">New password <span className="hint">At least 12 characters</span><input name="password" type="password" autoComplete="new-password" minLength={12} className="field" required /></label>
      <label className="pf-label">Confirm password<input name="confirm" type="password" autoComplete="new-password" className="field" required /></label>
      {state.error && <div className="pf-msg err" role="alert">{state.error}</div>}
      <label className="pf-small"><input type="checkbox" name="terms" value="accepted" required /> I am at least 18 and authorized to create this business account. I agree to the <a className="underline" href="/privacy">privacy policy</a> and <a className="underline" href="/terms">terms</a>.</label>
      <SubmitButton className="btn-lg w-full">Set password and sign in</SubmitButton>
    </form>
  );
}
