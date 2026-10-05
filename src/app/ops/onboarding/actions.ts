"use server";

import { redirect } from "next/navigation";
import { repo } from "@/server/db";
import { requireActor } from "@/server/auth/guard";
import { act, opt, str, type ActionState } from "@/server/actions/wrap";
import { invalid } from "@/server/errors";
import type { OnboardingIntake } from "@/lib/platform/types";
import { compileOnboardingPlan, intakeFromBusinessSummary, startClientOnboarding, updateOnboardingIntake } from "@/server/services/onboarding";

type A = (prev: ActionState, f: FormData) => Promise<ActionState>;

function dollars(f: FormData, key: string): number | undefined {
  const raw = opt(f, key)?.replace(/[$,\s]/g, "");
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) throw invalid(`${key} must be a positive number.`);
  return Math.round(n);
}

export const compileOnboardingSummaryAction: A = async (_prev, f) =>
  act(async () => {
    const actor = await requireActor();
    const r = await repo();
    const orgId = str(f, "orgId");
    const serviceType = opt(f, "serviceType") as OnboardingIntake["serviceType"] | undefined;
    const intake = intakeFromBusinessSummary(str(f, "summary"), {
      serviceType,
      minimumOpportunityUsd: dollars(f, "minimumOpportunityUsd"),
      implementationBudgetUsd: dollars(f, "implementationBudgetUsd"),
    });
    const onboarding = await startClientOnboarding(r, actor, orgId, intake);
    await updateOnboardingIntake(r, actor, onboarding.id, intake);
    const plan = await compileOnboardingPlan(r, actor, onboarding.id);
    redirect(`/ops/onboarding?orgId=${encodeURIComponent(orgId)}&onboardingId=${encodeURIComponent(plan.id)}`);
  }, "/ops/onboarding");
