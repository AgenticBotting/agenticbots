import { z } from "zod";

/** Shared choices keep the proposal brief and server validation in agreement. */
export const PROPOSAL_CHOICES = {
  goals: ["More qualified leads", "Better sales follow-up", "Less manual administration", "More repeat business", "Connected reporting", "Help choosing a starting point"],
  customerType: ["Homeowners", "Businesses & property owners", "Both"],
  teamSize: ["1–5 people", "6–20 people", "21–50 people", "51–200 people", "201+ people"],
  teamModel: ["Owner-led", "In-house marketing / sales", "External agency / freelancers", "In-house team + agency"],
  revenue: ["Under $1M", "$1M–$2M", "$2M–$5M", "$5M–$10M", "$10M+", "Prefer to discuss"],
  tools: ["ServiceTitan", "Jobber", "Housecall Pro", "HubSpot", "Salesforce", "GoHighLevel", "Google Ads", "Meta Ads", "Google Analytics", "WordPress", "Webflow", "Shopify", "Mailchimp", "ActiveCampaign", "Slack", "Microsoft 365", "Google Workspace", "QuickBooks", "Other tools", "No tools yet", "Not sure"],
  setupBudget: ["Under $7,500", "$7,500–$15,000", "$15,000–$30,000", "$30,000+", "Need guidance"],
  monthlyBudget: ["Under $2,500 / month", "$2,500–$3,500 / month", "$3,500–$7,500 / month", "$7,500+ / month", "Need guidance"],
  timeline: ["As soon as practical", "Within 1–3 months", "Within 3–6 months", "Exploring for later"],
  role: ["Owner / final decision-maker", "Leading the project", "Researching for my team"],
} as const;

const unique = (values: string[]) => new Set(values).size === values.length;
export const proposalAnswersSchema = z.object({
  goals: z.array(z.enum(PROPOSAL_CHOICES.goals)).min(1).max(3).refine(unique),
  customerType: z.enum(PROPOSAL_CHOICES.customerType),
  teamSize: z.enum(PROPOSAL_CHOICES.teamSize),
  teamModel: z.enum(PROPOSAL_CHOICES.teamModel),
  revenue: z.enum(PROPOSAL_CHOICES.revenue),
  tools: z.array(z.enum(PROPOSAL_CHOICES.tools)).min(1).max(19).refine(unique).refine(values => !values.some(v => v === "No tools yet" || v === "Not sure") || values.length === 1),
  otherTools: z.string().trim().max(160).default(""),
  setupBudget: z.enum(PROPOSAL_CHOICES.setupBudget),
  monthlyBudget: z.enum(PROPOSAL_CHOICES.monthlyBudget),
  timeline: z.enum(PROPOSAL_CHOICES.timeline),
  role: z.enum(PROPOSAL_CHOICES.role),
}).strict().transform(value => ({ ...value, otherTools: value.tools.includes("Other tools") ? value.otherTools : "" }));

export type ProposalAnswers = z.infer<typeof proposalAnswersSchema>;
export type ProposalDraft = Partial<Omit<ProposalAnswers, "goals" | "tools">> & { goals: ProposalAnswers["goals"]; tools: ProposalAnswers["tools"] };
export const emptyProposal = (): ProposalDraft => ({ goals: [], tools: [], otherTools: "" });

export function proposalStepReady(step: number, answers: ProposalDraft): boolean {
  switch (step) {
    case 0: return answers.goals.length > 0 && answers.goals.length <= 3 && !!answers.customerType;
    case 1: return !!answers.teamSize && !!answers.teamModel && !!answers.revenue;
    case 2: return answers.tools.length > 0;
    case 3: return !!answers.setupBudget && !!answers.monthlyBudget;
    case 4: return !!answers.timeline && !!answers.role;
    default: return proposalAnswersSchema.safeParse(answers).success;
  }
}

export function toggleProposalTool(current: ProposalAnswers["tools"], value: ProposalAnswers["tools"][number]): ProposalAnswers["tools"] {
  if (current.includes(value)) return current.filter(item => item !== value);
  if (value === "No tools yet" || value === "Not sure") return [value];
  return [...current.filter(item => item !== "No tools yet" && item !== "Not sure"), value];
}

export function proposalFit(answers: Pick<ProposalDraft, "setupBudget" | "monthlyBudget" | "timeline">) {
  if (answers.setupBudget === "Under $7,500" || answers.monthlyBudget === "Under $2,500 / month") return "below_current_minimum";
  if (answers.setupBudget === "Need guidance" || answers.monthlyBudget === "Need guidance" || answers.timeline === "Exploring for later") return "needs_scoping";
  return "ready_for_review";
}

export const proposalRequestSchema = z.object({
  kind: z.literal("proposal"),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  company: z.string().trim().min(2).max(160),
  website: z.string().trim().max(200).default(""),
  phone: z.string().trim().max(40).default(""),
  consent: z.literal(true),
  qualification: proposalAnswersSchema,
  source: z.string().trim().max(80).default("site"),
  focus: z.string().trim().max(120).default(""),
  pagePath: z.string().max(300).optional(),
  landingPath: z.string().max(300).optional(),
}).strict();

export function proposalBrief(answers: ProposalAnswers, phone = ""): string {
  return [
    `Priorities: ${answers.goals.join(", ")}`, `Customers: ${answers.customerType}`,
    `Team size: ${answers.teamSize}`, `Team structure: ${answers.teamModel}`, `Annual revenue: ${answers.revenue}`,
    `Current tools: ${answers.tools.join(", ")}`, answers.otherTools && `Other tools: ${answers.otherTools}`,
    `Setup budget: ${answers.setupBudget}`, `Monthly budget: ${answers.monthlyBudget}`,
    `Timeline: ${answers.timeline}`, `Decision role: ${answers.role}`,
    `Review routing: ${proposalFit(answers)} (self-reported; human review required)`,
    phone && `Phone: ${phone}`, "Consent: follow up about this proposal request only",
  ].filter(Boolean).join("\n");
}
