import { AuditForm } from "./AuditForm";

/** Existing contact-page entry now shares the qualified proposal intake. */
export function BotPlanForm({ source = "site", defaultFocus, className, compact }: { source?: string; defaultFocus?: string; className?: string; compact?: boolean }) {
  return <AuditForm source={source} focus={defaultFocus} className={className} compact={compact} />;
}
