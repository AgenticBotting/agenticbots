"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * The primary CTA: the free BOT opportunity audit. Scrolls to the page's own
 * audit form when there is one, otherwise goes to the homepage form.
 */
export function PlanCta({
  source,
  label = "Get your free audit",
  variant = "primary",
  className,
}: {
  source: string;
  label?: string;
  variant?: "primary" | "secondary" | "outline" | "onDark";
  className?: string;
}) {
  const router = useRouter();
  const cls = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    outline: "btn-outline",
    onDark: "btn-on-dark",
  }[variant];

  return (
    <button type="button" onClick={() => {
      track("cta_clicked", { source, label });
      const el = document.getElementById("audit");
      if (el) el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
      else router.push("/#audit");
    }} className={cn("btn", cls, className)}>
      {label}
      <ArrowRight className="w-4 h-4" />
    </button>
  );
}
