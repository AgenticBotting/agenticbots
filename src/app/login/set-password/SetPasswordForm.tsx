"use client";

import { useActionState } from "react";
import { setPasswordAction, type LoginState } from "../actions";
import { SubmitButton } from "@/components/platform/actions";

export function SetPasswordForm({ u, t }: { u: string; t: string }) {
  const [state, action] = useActionState<LoginState, FormData>(setPasswordAction, {});
  return (
    <form action={action} className="pf-form">
      <input type="hidden" name="u" value={u} />
      <input type="hidden" name="t" value={t} />
      <label className="pf-label">New password <span className="hint">At least 12 characters</span><input name="password" type="password" autoComplete="new-password" minLength={12} className="field" required /></label>
      <label className="pf-label">Confirm password<input name="confirm" type="password" autoComplete="new-password" className="field" required /></label>
      {state.error && <div className="pf-msg err" role="alert">{state.error}</div>}
      <SubmitButton className="btn-lg w-full">Set password and sign in</SubmitButton>
    </form>
  );
}
