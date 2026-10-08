import { ProposalLink } from "./ProposalLink";
import { ArrowRight, Check } from "lucide-react";
import { formatPlanPrice, MARKETING_PLANS, PRICING_SCOPE_NOTE } from "@/config/marketing-offer";
import { cn } from "@/lib/utils";

export function PricingCards() {
  return (
    <>
      <div className="pricing-system">
        {MARKETING_PLANS.map((plan) => (
          <article key={plan.key} className={cn("pricing-plan", plan.featured && "pricing-plan-featured")}>
            <p className="pricing-plan-label">{plan.label}</p>
            <h3 className="display-lg mt-5">{plan.name}</h3>
            <p className="body-sm mt-3 pricing-description">{plan.description}</p>
            <div className="pricing-amounts">
              <p className="pricing-amount tabular-nums">{formatPlanPrice(plan.setup, plan.from)}</p>
              <p className="body-xs mt-2">{plan.setup === null ? "Setup scoped together" : "One-time setup"}</p>
              <p className="pricing-retainer tabular-nums">{formatPlanPrice(plan.monthly, plan.from)}{plan.monthly !== null && <span> / month</span>}</p>
              <p className="body-xs mt-2">{plan.monthly === null ? "Retainer scoped together" : "To operate, maintain and tune"}</p>
            </div>
            <p className="pricing-capacity">{plan.botRange}</p>
            <ul className="space-y-3 mt-5 mb-8">
              {plan.features.map((feature) => <li key={feature} className="flex gap-2.5 text-[13.5px] leading-relaxed"><Check className="w-4 h-4 mt-0.5 shrink-0 text-[var(--accent-text)]" /><span>{feature}</span></li>)}
            </ul>
            <ProposalLink source={`pricing-${plan.key}`} focus={plan.name} className={cn("btn mt-auto w-full", plan.featured ? "btn-primary" : "btn-outline")}>
              {plan.key === "enterprise" ? "Discuss enterprise architecture" : "Define your starting scope"}<ArrowRight className="w-4 h-4" />
            </ProposalLink>
          </article>
        ))}
      </div>
      <p className="body-sm mt-7 max-w-[95ch]">{PRICING_SCOPE_NOTE}</p>
    </>
  );
}
