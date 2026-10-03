"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { repo } from "@/server/db";
import { authenticate, acceptInvite } from "@/server/services/accounts";
import { createSession } from "@/server/auth/session";
import { AppError } from "@/server/errors";

export interface LoginState {
  error?: string;
}

function safeNext(next: string, staff: boolean): string {
  // Only same-site paths; never an absolute URL (open-redirect guard).
  if (next.startsWith("/") && !next.startsWith("//") && (next.startsWith("/ops") ? staff : next.startsWith("/portal"))) return next;
  return staff ? "/ops" : "/portal";
}

export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "");
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  let target: string;
  try {
    const r = await repo();
    const user = await authenticate(r, email, password, ip);
    if (!user) return { error: "That email and password do not match an active account." };
    await createSession(user);
    target = safeNext(next, !!user.platformRole);
  } catch (e) {
    if (e instanceof AppError) return { error: e.publicMessage };
    return { error: "Sign-in is unavailable right now. Try again in a minute." };
  }
  redirect(target);
}

export async function setPasswordAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const password = String(form.get("password") ?? "");
  if (password !== String(form.get("confirm") ?? "")) return { error: "The two passwords do not match." };
  if (password.length < 12) return { error: "Use at least 12 characters." };
  let staff = false;
  try {
    const user = await acceptInvite(await repo(), String(form.get("u") ?? ""), String(form.get("t") ?? ""), password);
    await createSession(user);
    staff = !!user.platformRole;
  } catch (e) {
    if (e instanceof AppError) return { error: e.publicMessage };
    return { error: "This link could not be used. Ask AgenticBots for a new invitation." };
  }
  redirect(staff ? "/ops" : "/portal");
}
