"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

export interface ActionState {
  ok?: boolean;
  message?: string;
  /** Optional link to show with the message (e.g. a one-time invite link). */
  link?: string;
}

type ServerAction = (prev: ActionState, form: FormData) => Promise<ActionState>;

export function SubmitButton({
  children,
  pendingLabel,
  className,
  variant = "primary",
  disabled,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: "primary" | "secondary" | "outline" | "danger" | "solid-danger" | "ghost";
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={cn("btn", `btn-${variant}`, className)} disabled={pending || disabled} aria-busy={pending}>
      {pending ? pendingLabel ?? "Working…" : children}
    </button>
  );
}

export function Message({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <div className={cn("pf-msg", state.ok ? "ok" : "err")} role={state.ok ? "status" : "alert"}>
      {state.message}
      {state.link && (
        <div className="mt-1 break-all">
          <a href={state.link} className="underline">{state.link}</a>
        </div>
      )}
    </div>
  );
}

/**
 * A form bound to a server action, with the result shown inline.
 * Hidden fields carry ids; the server re-checks every permission.
 */
export function ActionForm({
  action,
  hidden,
  children,
  className,
  resetOnSuccess,
}: {
  action: ServerAction;
  hidden?: Record<string, string>;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} className={cn("pf-form", className)}>
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {children}
      <Message state={state} />
    </form>
  );
}

/** One-click action (no confirmation) with inline result. */
export function ActionButton({
  action,
  hidden,
  label,
  pendingLabel,
  variant = "outline",
}: {
  action: ServerAction;
  hidden: Record<string, string>;
  label: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="inline-flex flex-col gap-1.5">
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <SubmitButton variant={variant} pendingLabel={pendingLabel}>
        {label}
      </SubmitButton>
      {state.message && (
        <span className={cn("pf-small", state.ok ? "text-[var(--accent-text)]" : "text-[var(--color-danger)]")} role="status">
          {state.message}
        </span>
      )}
    </form>
  );
}

/**
 * Disruptive or destructive actions go through a confirmation dialog that
 * says exactly what will happen. `confirmText` forces typing a word
 * (used for destroy-class actions).
 */
export function ConfirmAction({
  action,
  hidden,
  label,
  title,
  body,
  confirmLabel,
  variant = "danger",
  fields,
  confirmText,
}: {
  action: ServerAction;
  hidden: Record<string, string>;
  label: string;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  variant?: "danger" | "outline" | "primary" | "secondary";
  fields?: React.ReactNode;
  confirmText?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [state, formAction] = useActionState(action, {});
  const [typed, setTyped] = useState("");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (state.ok) ref.current?.close();
  }, [state]);
  return (
    <>
      <button type="button" className={cn("btn", `btn-${variant}`)} onClick={() => {
          setOpen(true);
          ref.current?.showModal();
        }}>
        {label}
      </button>
      {state.message && !open && (
        <span className={cn("pf-small", state.ok ? "text-[var(--accent-text)]" : "text-[var(--color-danger)]")} role="status">
          {state.message}
        </span>
      )}
      <dialog ref={ref} className="pf-dialog" aria-labelledby={titleId} onClose={() => setOpen(false)}>
        <form action={formAction}>
          {Object.entries(hidden).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <header className="pf-panel-head">
            <h2 id={titleId}>{title}</h2>
          </header>
          <div className="pf-panel-body">
            <div className="text-[13.5px] leading-relaxed">{body}</div>
            {fields}
            {confirmText && (
              <label className="pf-label">
                Type <span className="pf-mono">{confirmText}</span> to confirm
                <input className="field" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
              </label>
            )}
            <Message state={state} />
            <div className="flex justify-end gap-2">
              <button type="button" className="btn btn-ghost" onClick={() => ref.current?.close()}>
                Cancel
              </button>
              <SubmitButton variant={variant === "danger" ? "solid-danger" : "primary"} disabled={!!confirmText && typed !== confirmText}>
                {confirmLabel}
              </SubmitButton>
            </div>
          </div>
        </form>
      </dialog>
    </>
  );
}
