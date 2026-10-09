import { handle, json, body } from "@/server/api";
import { authenticationSession } from "@/server/auth/session";
import { passkeyOptions, verifyPasskey } from "@/server/auth/passkeys";
import { repo } from "@/server/db";
import { forbidden, invalid, unauthenticated } from "@/server/errors";
import { sameOriginMutation } from "@/lib/request-security";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server";

export const POST = (req: Request) => handle(async () => {
  if (!sameOriginMutation(req)) throw forbidden();
  const ctx = await authenticationSession();
  if (!ctx) throw unauthenticated();
  const input = await body<Record<string, unknown>>(req);
  const r = await repo();
  if (input.action === "options") return json(await passkeyOptions(r, ctx, typeof input.enrollmentToken === "string" ? input.enrollmentToken : undefined, input.addBackup === true));
  if (input.action !== "verify" || typeof input.id !== "string" || !input.response || typeof input.response !== "object") throw invalid("Invalid verification request.");
  await verifyPasskey(r, ctx, input.id, input.response as RegistrationResponseJSON | AuthenticationResponseJSON);
  return json({ ok: true });
});
