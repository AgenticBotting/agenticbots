import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import { processPayment, isApproved } from "@/lib/nmi";
import { COURSE } from "@/lib/course";

/**
 * Course checkout.
 *
 * Runs when EasyPayDirect credentials exist and not before: with no
 * security key the route returns 503 and says so, rather than failing in
 * a way that looks like a declined card.
 *
 * Three rules this route exists to enforce, none of which can live on the
 * client:
 *
 *  · The PRICE is decided here. A posted amount is ignored entirely —
 *    otherwise a $49 course sells for a penny to anyone with devtools.
 *  · Card data never touches us. Collect.js tokenises in the gateway's
 *    iframes; all we receive is a single-use token.
 *  · A failed charge is recorded too. A payment that declined is a
 *    support conversation waiting to happen, and "no row" is the worst
 *    possible answer to "did my card go through".
 */

const RATE_WINDOW_MS = 10 * 60_000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; first: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.first > RATE_WINDOW_MS) {
    attempts.set(key, { count: 1, first: now });
    return false;
  }
  entry.count++;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(request: NextRequest) {
  if (!process.env.NMI_SECURITY_KEY) {
    return NextResponse.json(
      { error: "Card payments are not switched on yet. Join the list and we will email you the moment they are." },
      { status: 503 }
    );
  }
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return NextResponse.json({ error: "Course backend is not configured." }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim();
  const paymentToken = String(body.paymentToken ?? "");
  const postalCode = String(body.postalCode ?? "").trim();
  const idempotencyKey = String(body.idempotencyKey ?? "") || undefined;

  if (!email.includes("@")) return NextResponse.json({ error: "That email does not look right." }, { status: 400 });
  if (!paymentToken) return NextResponse.json({ error: "Card details were not captured. Refresh and try again." }, { status: 400 });

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
  // The price comes from the course definition, never from the request.
  const amount = COURSE.priceCents / 100;

  try {
    const result = await processPayment({
      paymentToken,
      amount,
      orderId: idempotencyKey,
      orderDescription: COURSE.title,
      customerEmail: email,
      customerName: name,
      billingAddress: postalCode ? { zip: postalCode } : undefined,
    });

    if (!isApproved(result)) {
      await convex.mutation(api.course.recordPurchase, {
        email,
        amountCents: COURSE.priceCents,
        status: "FAILED",
        gateway: "EPD",
        transactionId: result.transactionid || undefined,
        idempotencyKey,
        error: result.responsetext,
      });
      return NextResponse.json(
        { error: result.responsetext || "That card was declined. Try another one." },
        { status: 402 }
      );
    }

    await convex.mutation(api.course.recordPurchase, {
      email,
      amountCents: COURSE.priceCents,
      status: "PAID",
      gateway: "EPD",
      transactionId: result.transactionid,
      idempotencyKey,
    });

    return NextResponse.json({ success: true, transactionId: result.transactionid });
  } catch (error) {
    // A gateway timeout after a successful charge is the dangerous case:
    // log it as PENDING so it surfaces for a human rather than vanishing.
    console.error("[course/purchase]", error);
    await convex
      .mutation(api.course.recordPurchase, {
        email,
        amountCents: COURSE.priceCents,
        status: "PENDING",
        gateway: "EPD",
        idempotencyKey,
        error: error instanceof Error ? error.message : "unknown",
      })
      .catch(() => {});

    return NextResponse.json(
      { error: "We could not complete that. If you were charged, email hello@agenticbots.dev and we will sort it immediately." },
      { status: 500 }
    );
  }
}
