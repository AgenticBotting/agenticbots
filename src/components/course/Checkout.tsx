"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { COURSE, COURSE_STATS } from "@/lib/course";
import { Check, Loader2, Lock } from "lucide-react";

/**
 * Checkout.
 *
 * Card processing runs through EasyPayDirect (NMI) and is not live yet,
 * so this page does the honest thing rather than the optimistic one: it
 * says payments open shortly, takes an email, and tells the person
 * exactly what happens next. A buy button that fails at the last step
 * costs more than a wait does.
 *
 * When `NEXT_PUBLIC_EPD_TOKENIZATION_KEY` is set, the card form below
 * takes over — Collect.js tokenises the card in an iframe the page never
 * touches, so no card number ever reaches our server or our logs.
 */

const PRICE = (COURSE.priceCents / 100).toFixed(0);
const PAYMENTS_LIVE = !!process.env.NEXT_PUBLIC_EPD_TOKENIZATION_KEY;

export function Checkout() {
  return (
    <div className="mx-auto max-w-[860px] grid lg:grid-cols-[minmax(0,1fr)_320px] gap-8 lg:gap-12 items-start">
      <div>{PAYMENTS_LIVE ? <CardForm /> : <WaitlistForm />}</div>

      {/* The receipt panel: what they are buying, restated at the moment
          of payment. */}
      <aside className="border border-[var(--border)] bg-[var(--bg-alt)] p-6 lg:sticky lg:top-24">
        <p className="eyebrow">You are getting</p>
        <h2 className="display-md mt-2 text-balance">{COURSE.title}</h2>
        <ul className="mt-4 space-y-2">
          {[
            `${COURSE_STATS.lessons} lessons, ${Math.round(COURSE_STATS.minutes / 60)} hours`,
            `${COURSE_STATS.videos} video walkthroughs`,
            "The full repo and the Claude Code skill",
            "Templates, query cookbook and checklists",
            "Lifetime access and updates",
          ].map((item) => (
            <li key={item} className="flex gap-2 text-[13.5px] leading-snug">
              <Check className="w-3.5 h-3.5 mt-1 shrink-0 text-[var(--accent-text)]" strokeWidth={2.5} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 pt-4 border-t border-[var(--border-strong)] flex items-baseline justify-between">
          <span className="body-sm">Total</span>
          <span className="text-[26px] font-semibold tracking-[-0.04em]">${PRICE}</span>
        </div>
        <p className="body-xs mt-3">30-day refund, no forms. Email and we send it back.</p>
      </aside>
    </div>
  );
}

/* ─────────────────────── before payments are live ───────────────── */

function WaitlistForm() {
  const join = useMutation(api.course.joinWaitlist);
  const [state, setState] = useState<"idle" | "working" | "done" | "already">("idle");
  const [error, setError] = useState("");

  if (state === "done" || state === "already") {
    return (
      <div className="border border-[var(--border)] p-7">
        <span className="mb-4 grid h-9 w-9 place-items-center bg-[var(--color-accent-500)] notch">
          <Check className="w-4 h-4 text-[var(--color-ink-950)]" strokeWidth={3} />
        </span>
        <h1 className="display-lg">
          {state === "already" ? "You are already on the list" : "You are on the list"}
        </h1>
        <p className="body-base mt-3 text-pretty">
          We will email you the moment checkout opens — one email, with the link. Nothing else.
        </p>
        <p className="body-sm mt-4">
          In the meantime, two lessons are free:{" "}
          <Link href="/course/why-the-api" className="underline hover:text-[var(--accent-text)]">
            why the API beats the interface
          </Link>{" "}
          and{" "}
          <Link href="/course/developer-token" className="underline hover:text-[var(--accent-text)]">
            getting your developer token
          </Link>
          .
        </p>
      </div>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("working");
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const result = await join({
        email: String(data.get("email")),
        note: String(data.get("note") || "") || undefined,
      });
      setState(result.alreadyOn ? "already" : "done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not go through");
      setState("idle");
    }
  }

  return (
    <div>
      <p className="eyebrow">Checkout opens shortly</p>
      <h1 className="display-xl mt-3 max-w-[20ch] text-balance">
        Card payments are not switched on <span className="em-green">just yet.</span>
      </h1>
      <p className="body-base mt-4 max-w-[54ch] text-pretty">
        We are finishing the payment setup with our processor. Leave your email and you will get
        one message when it opens — with the link, at the launch price of ${PRICE}.
      </p>

      <form onSubmit={onSubmit} className="mt-7 max-w-[420px] space-y-3">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="note">Anything you want covered? (optional)</label>
          <textarea id="note" name="note" rows={2} className="field" placeholder="What you are hoping to automate first" />
        </div>
        {error && <p role="alert" className="text-[13px] text-[var(--color-danger)]">{error}</p>}
        <button type="submit" disabled={state === "working"} className="btn btn-primary w-full">
          {state === "working" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tell me when it opens"}
        </button>
        <p className="body-xs">One email about this course. No list, no drip.</p>
      </form>
    </div>
  );
}

/* ───────────────────────── once EPD is live ─────────────────────── */

/**
 * Card form. Fields are Collect.js iframes hosted by the gateway, so the
 * card number, expiry and CVV never exist in this page's DOM — which is
 * what keeps this a SAQ-A-EP integration rather than a full audit.
 *
 * The submit handler posts a one-time token, not a card, to
 * /api/course/purchase.
 */
function CardForm() {
  const [state, setState] = useState<"idle" | "working" | "done">("idle");
  const [error, setError] = useState("");

  if (state === "done") {
    return (
      <div className="border border-[var(--border)] p-7">
        <span className="mb-4 grid h-9 w-9 place-items-center bg-[var(--color-accent-500)] notch">
          <Check className="w-4 h-4 text-[var(--color-ink-950)]" strokeWidth={3} />
        </span>
        <h1 className="display-lg">You are in</h1>
        <p className="body-base mt-3">
          Set a password on the same email and everything unlocks.
        </p>
        <Link href="/course/login" className="btn btn-primary mt-5">Set your password</Link>
      </div>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("working");
    setError("");
    const data = new FormData(event.currentTarget);

    try {
      // Collect.js puts the one-time token on the form as payment_token.
      const response = await fetch("/api/course/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          name: data.get("name"),
          postalCode: data.get("postalCode"),
          paymentToken: data.get("payment_token"),
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "That card was declined");
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not go through");
      setState("idle");
    }
  }

  return (
    <div>
      <h1 className="display-xl max-w-[18ch] text-balance">Get the course</h1>
      <p className="body-base mt-3">One payment of ${PRICE}. Access is immediate.</p>

      <form onSubmit={onSubmit} className="mt-6 max-w-[420px] space-y-3">
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input id="name" name="name" required autoComplete="name" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="field" />
          <p className="body-xs mt-1">Your access is tied to this address.</p>
        </div>

        {/* Collect.js mounts its iframes into these three. */}
        <div>
          <span className="label">Card</span>
          <div id="epd-card-number" className="field" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="label">Expiry</span>
            <div id="epd-card-expiry" className="field" />
          </div>
          <div>
            <span className="label">CVV</span>
            <div id="epd-card-cvv" className="field" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="postalCode">Billing postcode</label>
          <input id="postalCode" name="postalCode" required autoComplete="postal-code" className="field" />
        </div>

        {error && <p role="alert" className="text-[13px] text-[var(--color-danger)]">{error}</p>}

        <button type="submit" disabled={state === "working"} className="btn btn-primary w-full">
          {state === "working" ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pay $${PRICE}`}
        </button>

        <p className="body-xs flex items-center gap-1.5">
          <Lock className="w-3 h-3" /> Card details go straight to our processor — they never
          touch this site.
        </p>
      </form>
    </div>
  );
}
