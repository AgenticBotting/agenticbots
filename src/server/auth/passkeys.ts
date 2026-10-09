import "server-only";
import { timingSafeEqual } from "node:crypto";
import { generateRegistrationOptions, generateAuthenticationOptions, verifyRegistrationResponse, verifyAuthenticationResponse, type RegistrationResponseJSON, type AuthenticationResponseJSON, type AuthenticatorTransport } from "@simplewebauthn/server";
import type { Session, User } from "@/lib/platform/types";
import { Tx, type Repository } from "@/server/db/repository";
import { forbidden, invalid, unavailable } from "@/server/errors";
import { correlationId, nowIso, sha256Hex } from "@/server/ids";
import { audit, SYSTEM } from "@/server/services/common";
import { sharedRateLimit } from "@/server/security/rate-limit";

type Context = { user: User; session: Session };
function relyingParty() {
  const configured = process.env.PASSKEY_ORIGIN;
  if (!configured) throw unavailable("Staff passkey sign-in is not configured.");
  const url = new URL(configured);
  if (url.origin !== configured || (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.hostname === "localhost"))) throw unavailable("Staff passkey origin is invalid.");
  return { origin: url.origin, rpID: url.hostname };
}

function assertContext(ctx: Context) {
  const expires = Date.parse(ctx.session.expiresAt), created = Date.parse(ctx.session.createdAt);
  if (!ctx.user.platformRole || ctx.user.status !== "active" || ctx.session.userId !== ctx.user.id || ctx.session.revokedAt || !Number.isFinite(expires) || !Number.isFinite(created) || expires <= Date.now() || created > Date.now()) throw forbidden();
  // A password-only session has five minutes to finish the second factor.
  if (!ctx.session.mfaVerifiedAt && Date.now() - Date.parse(ctx.session.createdAt) > 5 * 60_000) throw invalid("Sign in again before verifying your passkey.");
}

export async function passkeyOptions(r: Repository, ctx: Context, enrollmentToken?: string, addBackup = false) {
  assertContext(ctx);
  if (!(await sharedRateLimit(r, `passkey:${ctx.user.id}`, 10, 5 * 60_000)).allowed) throw invalid("Too many attempts. Try again in a few minutes.");
  const { rpID } = relyingParty();
  const keys = await r.list("passkeys", { where: { userId: ctx.user.id } });
  const register = keys.length === 0 || addBackup;
  if (register) {
    if (keys.length) {
      const verified = Date.parse(ctx.session.mfaVerifiedAt ?? "");
      if (!Number.isFinite(verified) || verified > Date.now() || Date.now() - verified > 5 * 60_000) throw forbidden();
      if (keys.length >= 5) throw invalid("At most five passkeys may be registered.");
    } else {
      // Out-of-band bootstrap: password possession alone cannot enroll staff.
      const expected = process.env.STAFF_ENROLLMENT_TOKEN ?? "";
      if (process.env.STAFF_ENROLLMENT_USER_ID !== ctx.user.id) throw unavailable("Ask the owner to open an enrollment window for your account.");
      const expiry = Date.parse(process.env.STAFF_ENROLLMENT_EXPIRES_AT ?? "");
      if (expected.length < 32 || !Number.isFinite(expiry) || expiry <= Date.now() || expiry > Date.now() + 24 * 3600_000) throw unavailable("Ask the owner to open a short staff enrollment window.");
      if (!timingSafeEqual(Buffer.from(sha256Hex(enrollmentToken ?? "")), Buffer.from(sha256Hex(expected)))) throw forbidden();
    }
  }
  const options = register
    ? await generateRegistrationOptions({ rpName: "AgenticBots", rpID, userName: ctx.user.email, userID: new TextEncoder().encode(ctx.user.id), attestationType: "none", authenticatorSelection: { residentKey: "preferred", userVerification: "required" }, excludeCredentials: keys.map(k => ({ id: k.credentialId })), supportedAlgorithmIDs: [-7, -257] })
    : await generateAuthenticationOptions({ rpID, userVerification: "required", allowCredentials: keys.map(k => ({ id: k.credentialId, transports: k.transports as AuthenticatorTransport[] })) });
  const tx = new Tx(r);
  const challenge = tx.insert("auth_challenges", { userId: ctx.user.id, sessionId: ctx.session.id, purpose: register ? "register" : "authenticate", challenge: options.challenge, expiresAt: new Date(Date.now() + 5 * 60_000).toISOString() });
  audit(tx, SYSTEM, { action: `auth.passkey.${challenge.purpose}.begin`, targetType: "user", targetId: ctx.user.id, correlationId: correlationId() });
  await tx.commit();
  return { id: challenge.id, purpose: challenge.purpose, options };
}

export async function verifyPasskey(r: Repository, ctx: Context, id: string, response: RegistrationResponseJSON | AuthenticationResponseJSON) {
  assertContext(ctx);
  if (!(await sharedRateLimit(r, `passkey-verify:${ctx.user.id}`, 15, 5 * 60_000)).allowed) throw forbidden();
  const challenge = await r.get("auth_challenges", id);
  if (!challenge || challenge.userId !== ctx.user.id || challenge.sessionId !== ctx.session.id || challenge.usedAt || !Number.isFinite(Date.parse(challenge.expiresAt)) || Date.parse(challenge.expiresAt) <= Date.now()) throw invalid("Verification expired or was already used. Try again.");
  const { rpID, origin } = relyingParty();
  const tx = new Tx(r);
  try {
    if (challenge.purpose === "register") {
      const result = await verifyRegistrationResponse({ response: response as RegistrationResponseJSON, expectedChallenge: challenge.challenge, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: true, supportedAlgorithmIDs: [-7, -257] });
      if (!result.verified || !result.registrationInfo.userVerified) throw forbidden();
      const k = result.registrationInfo.credential;
      tx.insert("passkeys", { id: sha256Hex(k.id), userId: ctx.user.id, credentialId: k.id, publicKey: Buffer.from(k.publicKey).toString("base64url"), counter: k.counter, transports: k.transports ?? [] });
    } else {
      const k = await r.get("passkeys", sha256Hex(response.id));
      if (!k || k.userId !== ctx.user.id) throw forbidden();
      const result = await verifyAuthenticationResponse({ response: response as AuthenticationResponseJSON, expectedChallenge: challenge.challenge, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: true, credential: { id: k.credentialId, publicKey: new Uint8Array(Buffer.from(k.publicKey, "base64url")), counter: k.counter, transports: k.transports as AuthenticatorTransport[] } });
      if (!result.verified || !result.authenticationInfo.userVerified) throw forbidden();
      tx.patch("passkeys", k, { counter: result.authenticationInfo.newCounter });
    }
  } catch {
    const denied = new Tx(r);
    denied.patch("auth_challenges", challenge, { usedAt: nowIso() });
    audit(denied, SYSTEM, { action: "auth.passkey.denied", targetType: "user", targetId: ctx.user.id, correlationId: correlationId(), result: "denied" });
    await denied.commit();
    throw invalid("Passkey verification failed. Try again.");
  }
  tx.patch("auth_challenges", challenge, { usedAt: nowIso() });
  tx.patch("sessions", ctx.session, { mfaVerifiedAt: nowIso() });
  audit(tx, SYSTEM, { action: `auth.passkey.${challenge.purpose}.verified`, targetType: "user", targetId: ctx.user.id, correlationId: correlationId() });
  await tx.commit();
}
