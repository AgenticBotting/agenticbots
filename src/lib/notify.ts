import "server-only";
import { assertLive } from "@/server/env";

/** Enquiry delivery to our inbox only. Submitting an enquiry never enrolls
 * someone in a marketing list. Campaign delivery is not implemented. */
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "hello@agenticbots.dev";

export interface PlanRequest {
  kind?: "proposal";
  name: string;
  email: string;
  company?: string;
  website?: string;
  focus?: string;
  goal?: string;
  source?: string;
  pagePath?: string;
}

type SinkResult = { ok: boolean; skipped?: boolean; error?: string };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

async function toInbox(req: PlanRequest): Promise<SinkResult> {
  if (!RESEND_API_KEY) return { ok: true, skipped: true };

  const rows = [
    ["Name", req.name],
    ["Email", req.email],
    ["Company", req.company],
    ["Website", req.website],
    ["Focus", req.focus],
    ["Goal", req.goal],
    ["Source", req.source],
    ["Page", req.pagePath],
  ].filter(([, v]) => Boolean(v));

  const html = `
    <h2 style="font-family:system-ui;margin:0 0 16px">${req.kind === "proposal" ? "New BOT implementation proposal request" : "New BOT plan request"}</h2>
    <table style="font-family:system-ui;font-size:14px;border-collapse:collapse">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:6px 16px 6px 0;color:#6B7A8C">${escapeHtml(k ?? "")}</td><td style="padding:6px 0;white-space:pre-line"><strong>${escapeHtml(v ?? "")}</strong></td></tr>`
        )
        .join("")}
    </table>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: CONTACT_EMAIL,
        reply_to: req.email,
        subject: `${req.kind === "proposal" ? "BOT proposal request" : "BOT plan request"} — ${req.name}${req.company ? ` (${req.company})` : ""}`,
        html,
      }),
    });

    if (!res.ok) return { ok: false, error: `Resend ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

/** Success means the enquiry actually reached the configured inbox. */
export async function deliverPlanRequest(req: PlanRequest): Promise<{ ok: boolean }> {
  assertLive("deliver website enquiry");
  if (!RESEND_API_KEY) return { ok: false };
  const result = await toInbox(req);
  return { ok: result.ok && !result.skipped };
}
