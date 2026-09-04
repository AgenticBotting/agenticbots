"use client";

import { ArrowRight } from "lucide-react";
import { openBotPlan } from "@/lib/lead-flow";
import { cn } from "@/lib/utils";

/**
 * The primary CTA. Opens the multi-step flow rather than navigating —
 * a modal converts better than a page load. `/plan` still exists as a
 * real page for ad traffic and anyone who lands there directly.
 */
export function PlanCta({
  source,
  label = "Get your bot plan",
  variant = "primary",
  className,
}: {
  source: string;
  label?: string;
  variant?: "primary" | "secondary" | "outline" | "onDark";
  className?: string;
}) {
  const cls = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    outline: "btn-outline",
    onDark: "btn-on-dark",
  }[variant];

  return (
    <button type="button" onClick={() => openBotPlan(source)} className={cn("btn", cls, className)}>
      {label}
      <ArrowRight className="w-4 h-4" />
    </button>
  );
}
