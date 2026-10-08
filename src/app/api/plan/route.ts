import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { deliverPlanRequest } from "@/lib/notify";
import { acquisitionEventContext } from "@/lib/acquisition-attribution";
import { trackServer } from "@/lib/analytics";
import { proposalBrief, proposalRequestSchema } from "@/lib/proposal-intake";

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

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  // Intentionally public acquisition endpoint: no tenant records are read or mutated.
  // A visitor must explicitly submit a complete, consented brief; no automatic outreach.
  if (b.kind === "proposal") {
    const parsed = proposalRequestSchema.safeParse(b);
    if (!parsed.success) return NextResponse.json({ error: "Please complete the required choices and contact details, then agree to be contacted about your request." }, { status: 400 });
    const lead = parsed.data;
    try {
      const { ok } = await deliverPlanRequest({
        kind: "proposal", name: lead.name, email: lead.email, company: lead.company,
        website: lead.website, focus: lead.focus || "BOT implementation proposal",
        goal: proposalBrief(lead.qualification, lead.phone), source: lead.source,
        pagePath: acquisitionEventContext(lead.pagePath, undefined).page,
      });
      if (!ok) return NextResponse.json({ error: "We couldn’t deliver your request. Your answers are still here. Please retry or email hello@agenticbots.dev." }, { status: 502 });
      await trackServer("proposal_received", { ...acquisitionEventContext(lead.pagePath, lead.landingPath), request_received: true });
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ error: "We couldn’t deliver your request. Please retry or contact us directly." }, { status: 503 });
    }
  }
  if (b.kind !== undefined) return NextResponse.json({ error: "Invalid request type." }, { status: 400 });
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
    await trackServer("plan_form_submitted", { ...acquisitionEventContext(b.pagePath, b.landingPath), request_received: true });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[plan] unexpected failure", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
