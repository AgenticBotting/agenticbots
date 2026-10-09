import { afterEach, describe, expect, it, vi } from "vitest";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { world } from "../support/fixtures";
import { Tx } from "@/server/db/repository";
import { passkeyOptions, verifyPasskey } from "@/server/auth/passkeys";
import { currentActor, SESSION_COOKIE } from "@/server/auth/session";
import { sha256Hex } from "@/server/ids";

const browser = vi.hoisted(() => ({ cookie: "" }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (name: string) => name === "ab_session" && browser.cookie ? { value: browser.cookie } : undefined }), headers: async () => new Headers() }));
afterEach(() => { vi.unstubAllEnvs(); browser.cookie = ""; });

async function context() {
  const w = await world();
  const user = (await w.r.get("users", w.admin.user.id))!;
  const tx = new Tx(w.r);
  const session = tx.insert("sessions", { userId: user.id, tokenHash: sha256Hex("fictional-session"), expiresAt: new Date(Date.now() + 3600_000).toISOString() });
  await tx.commit();
  vi.stubEnv("DEMO_MODE", "false"); vi.stubEnv("PLATFORM_ENV", "staging"); vi.stubEnv("PASSKEY_ORIGIN", "https://ops.example.invalid");
  vi.stubEnv("STAFF_ENROLLMENT_USER_ID", user.id);
  return { ...w, user, session };
}

describe("staff passkey boundary", () => {
  it("cannot turn a password session into an operator actor without MFA", async () => {
    const { r, user, session } = await context();
    expect(SESSION_COOKIE).toBe("ab_session");
    browser.cookie = `${session.id}.fictional-session`;
    expect(await currentActor()).toBeNull();
    const tx = new Tx(r); tx.patch("sessions", session, { mfaVerifiedAt: new Date().toISOString() }); await tx.commit();
    expect((await currentActor())?.user.id).toBe(user.id);
  });
  it("requires an independent, short-lived enrollment secret", async () => {
    const ctx = await context();
    vi.stubEnv("STAFF_ENROLLMENT_TOKEN", undefined);
    await expect(passkeyOptions(ctx.r, ctx)).rejects.toThrow(/enrollment window/);
    vi.stubEnv("STAFF_ENROLLMENT_TOKEN", "fictional-enrollment-code-32-characters");
    vi.stubEnv("STAFF_ENROLLMENT_EXPIRES_AT", new Date(Date.now() + 3600_000).toISOString());
    await expect(passkeyOptions(ctx.r, ctx, "wrong")).rejects.toThrow();
    const result = await passkeyOptions(ctx.r, ctx, "fictional-enrollment-code-32-characters");
    expect(result.purpose).toBe("register");
    expect(result.options).toMatchObject({ rp: { id: "ops.example.invalid" }, authenticatorSelection: { userVerification: "required" } });
    const challenge = await ctx.r.get("auth_challenges", result.id);
    expect(challenge?.sessionId).toBe(ctx.session.id);
    expect(JSON.stringify(await ctx.r.list("audit_logs"))).not.toContain("fictional-enrollment");
  });
  it("rejects forged WebAuthn responses, consumes the challenge and cannot replay it", async () => {
    const ctx = await context();
    vi.stubEnv("STAFF_ENROLLMENT_TOKEN", "fictional-enrollment-code-32-characters");
    vi.stubEnv("STAFF_ENROLLMENT_EXPIRES_AT", new Date(Date.now() + 3600_000).toISOString());
    const result = await passkeyOptions(ctx.r, ctx, "fictional-enrollment-code-32-characters");
    const forged = { id: "forged", rawId: "forged", type: "public-key", clientExtensionResults: {}, response: { clientDataJSON: "invalid", attestationObject: "invalid" } } as RegistrationResponseJSON;
    await expect(verifyPasskey(ctx.r, ctx, result.id, forged)).rejects.toThrow(/verification failed/i);
    expect((await ctx.r.get("auth_challenges", result.id))?.usedAt).toBeTruthy();
    await expect(verifyPasskey(ctx.r, ctx, result.id, forged)).rejects.toThrow(/already used/);
    expect((await ctx.r.get("sessions", ctx.session.id))?.mfaVerifiedAt).toBeUndefined();
    expect(await ctx.r.list("passkeys")).toHaveLength(0);
  });
  it("does not let an old password-only session enroll a passkey", async () => {
    const ctx = await context();
    await expect(passkeyOptions(ctx.r, { ...ctx, session: { ...ctx.session, createdAt: new Date(Date.now() - 6 * 60_000).toISOString() } })).rejects.toThrow(/Sign in again/);
  });
});
