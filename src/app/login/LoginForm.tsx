"use client";

import { useActionState, useRef } from "react";
import { loginAction, type LoginState } from "./actions";
import { SubmitButton } from "@/components/platform/actions";

export function LoginForm({ next, demoAccounts, demoPassword }: { next: string; demoAccounts?: { email: string; label: string }[]; demoPassword?: string }) {
  const [state, action] = useActionState<LoginState, FormData>(loginAction, {});
  const email = useRef<HTMLInputElement>(null);
  const pw = useRef<HTMLInputElement>(null);
  return (
    <form action={action} className="pf-form">
      <input type="hidden" name="next" value={next} />
      <label className="pf-label">Email<input ref={email} name="email" type="email" autoComplete="username" className="field" required /></label>
      <label className="pf-label">Password<input ref={pw} name="password" type="password" autoComplete="current-password" className="field" required /></label>
      {state.error && <div className="pf-msg err" role="alert">{state.error}</div>}
      <SubmitButton className="btn-lg w-full" pendingLabel="Signing in…">Sign in</SubmitButton>
      {demoAccounts && (
        <div className="pf-msg info">
          <div className="font-semibold mb-1">Demo mode — fictional data</div>
          <div className="grid gap-1">
            {demoAccounts.map((a) => (
              <button
                key={a.email}
                type="button"
                className="text-left underline-offset-2 hover:underline"
                onClick={() => {
                  if (email.current) email.current.value = a.email;
                  if (pw.current && demoPassword) pw.current.value = demoPassword;
                }}
              >
                {a.label} <span className="pf-mono">({a.email})</span>
              </button>
            ))}
          </div>
          <div className="mt-1">Password for all: <span className="pf-mono">{demoPassword}</span></div>
        </div>
      )}
    </form>
  );
}
