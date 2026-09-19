"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { ArrowRight, Loader2 } from "lucide-react";

/**
 * Sign in, or set a password for the first time.
 *
 * Buyers arrive here in two orders — bought then signed up, or signed up
 * then bought — so creating an account immediately claims any purchase
 * made with the same email. Without that, someone who has just paid gets
 * told they do not own it, which is the worst possible first minute.
 */
export function CourseSignIn({ redirectTo = "/course/portal" }: { redirectTo?: string }) {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const claim = useMutation(api.course.claimPurchases);
  const router = useRouter();

  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [state, setState] = useState<"idle" | "working">("idle");
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return (
      <div className="text-center">
        <h1 className="display-lg">You are signed in</h1>
        <Link href={redirectTo} className="btn btn-primary mt-4">
          Open the course <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("working");
    setError("");
    const data = new FormData(event.currentTarget);
    data.set("flow", mode);
    try {
      await signIn("password", data);
      // Link any purchase made with this email before the account existed.
      await claim().catch(() => {});
      router.push(redirectTo);
    } catch {
      setError(
        mode === "signIn"
          ? "That email and password did not match. If you have not set a password yet, create your login instead."
          : "Could not create that login — you may already have one."
      );
      setState("idle");
    }
  }

  return (
    <>
      <h1 className="display-lg">{mode === "signIn" ? "Sign in" : "Create your login"}</h1>
      <p className="body-sm mt-2">
        {mode === "signIn"
          ? "For everyone who has bought the course."
          : "Use the same email you bought with and your access is linked automatically."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signIn" ? "current-password" : "new-password"}
            className="field"
          />
        </div>

        {error && <p role="alert" className="text-[13px] text-[var(--color-danger)]">{error}</p>}

        <button type="submit" disabled={state === "working"} className="btn btn-primary w-full">
          {state === "working" ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "signIn" ? "Sign in" : "Create login"}
        </button>
      </form>

      <button
        className="btn btn-ghost btn-sm mt-3 w-full"
        onClick={() => { setMode(mode === "signIn" ? "signUp" : "signIn"); setError(""); }}
      >
        {mode === "signIn" ? "First time? Create your login" : "Already have a login? Sign in"}
      </button>

      <p className="body-xs mt-6 text-center">
        Not bought it yet? <Link href="/course" className="underline hover:text-[var(--accent-text)]">See what is in the course</Link>
      </p>
    </>
  );
}
