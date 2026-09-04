/**
 * Outbound notification for bot-plan requests.
 *
 * Two independent sinks, both optional and both fail-soft: MailerLite
 * captures the lead into the list, Resend emails the request to the
 * inbox. Missing credentials are logged and skipped so local dev and
 * preview deploys keep working without a .env file.
 */

const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
const MAILERLITE_GROUP_ID = process.env.MAILERLITE_GROUP_ID;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "hello@agenticbots.dev";

export interface PlanRequest {
  name: string;
  email: string;
  company?: string;
  website?: string;
  focus?: string;
  goal?: string;
  source?: string;
}

type SinkResult = { ok: boolean; skipped?: boolean; error?: string };

async function toMailerLite(req: PlanRequest): Promise<SinkResult> {
  if (!MAILERLITE_API_KEY) return { ok: true, skipped: true };

  try {
    const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MAILERLITE_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: req.email,
        fields: {
          name: req.name,
          company: req.company || "",
          website: req.website || "",
          focus: req.focus || "",
        },
        ...(MAILERLITE_GROUP_ID ? { groups: [MAILERLITE_GROUP_ID] } : {}),
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `MailerLite ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
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
  ].filter(([, v]) => Boolean(v));

  const html = `
    <h2 style="font-family:system-ui;margin:0 0 16px">New bot plan request</h2>
    <table style="font-family:system-ui;font-size:14px;border-collapse:collapse">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:6px 16px 6px 0;color:#6B7A8C">${k}</td><td style="padding:6px 0"><strong>${v}</strong></td></tr>`
        )
        .join("")}
    </table>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: CONTACT_EMAIL,
        reply_to: req.email,
        subject: `Bot plan request — ${req.name}${req.company ? ` (${req.company})` : ""}`,
        html,
      }),
    });

    if (!res.ok) return { ok: false, error: `Resend ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

/**
 * Fan out to both sinks. Succeeds if nothing hard-failed — a skipped
 * sink (no credentials) counts as success so the form still works.
 */
export async function deliverPlanRequest(req: PlanRequest): Promise<{ ok: boolean }> {
  const [list, inbox] = await Promise.all([toMailerLite(req), toInbox(req)]);

  for (const [label, r] of [["mailerlite", list], ["resend", inbox]] as const) {
    if (r.skipped) console.warn(`[plan] ${label} not configured, skipped`);
    else if (!r.ok) console.error(`[plan] ${label} failed: ${r.error}`);
  }

  return { ok: list.ok && inbox.ok };
}
