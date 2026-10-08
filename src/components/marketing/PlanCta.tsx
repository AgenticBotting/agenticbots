import { ArrowRight } from "lucide-react";
import { ProposalLink } from "./ProposalLink";
import { cn } from "@/lib/utils";
import { PROPOSAL_OFFER } from "@/config/marketing-offer";

export function PlanCta({ source, label = PROPOSAL_OFFER.cta, variant = "primary", className }: {
  source: string; label?: string; variant?: "primary" | "secondary" | "outline" | "onDark"; className?: string;
}) {
  const cls = { primary: "btn-primary", secondary: "btn-secondary", outline: "btn-outline", onDark: "btn-on-dark" }[variant];
  return <ProposalLink source={source} className={cn("btn", cls, className)}>{label}<ArrowRight size={16} /></ProposalLink>;
}
