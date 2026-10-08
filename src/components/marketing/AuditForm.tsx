import { ArrowRight, Check } from "lucide-react";
import { ProposalLink } from "./ProposalLink";
import { cn } from "@/lib/utils";
import "./proposal-intake.css";

/** Compatibility surface for existing page anchors; every entry opens the same intake. */
export function AuditForm({ source = "site", focus, className }: { source?: string; focus?: string; className?: string; compact?: boolean }) {
  return <div className={cn("proposal-entry", className)}>
    <span className="pe-kicker">Request a proposal</span><h3>A few details.<br />A more focused conversation.</h3>
    <p>{focus ? `Plan the next step for ${focus}.` : "Tell us what you want to improve."} Mostly multiple choice, with your contact details at the end.</p>
    <ul>{["Your goals and current team", "The tools you already use", "Budget and implementation timeline"].map(item => <li key={item}><Check size={18} />{item}</li>)}</ul>
    <ProposalLink source={source} focus={focus} className="btn btn-primary">Begin Step-1<ArrowRight size={17} /></ProposalLink>
    <p className="pe-note">No payment required. No obligation to proceed.</p>
  </div>;
}
