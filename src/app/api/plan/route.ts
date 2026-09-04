import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { deliverPlanRequest } from "@/lib/notify";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || req.headers.get("x-real-ip") || "anonymous").trim();
}

function str(v: unknown, max = 2000): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  const { allowed } = checkRateLimit(`plan:${clientKey(request)}`, MAX_PER_WINDOW, WINDOW_MS);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a few minutes." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const name = str(b.name, 120);
  const email = str(b.email, 200);
  const company = str(b.company, 160);
  const website = str(b.website, 200);
  const focus = str(b.focus, 120);
  const goal = str(b.goal, 2000);
  const source = str(b.source, 80) || "site";

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "That email does not look right." }, { status: 400 });
  }

  try {
    const { ok } = await deliverPlanRequest({ name, email, company, website, focus, goal, source });
    if (!ok) {
      return NextResponse.json(
        { error: "We could not record that. Email hello@agenticbots.dev and we will pick it up." },
        { status: 502 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[plan] unexpected failure", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
