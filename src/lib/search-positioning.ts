import type { Service } from "./catalog";

/** Buyer-facing vocabulary is independent of BOT names and canonical routes. */
export type SearchPositioning = {
  label: string;
  title: string;
  audience: string;
  introduction: string;
  decision: string;
  inputs: string[];
};

export const SEARCH_POSITIONING: Record<string, SearchPositioning> = {
  "paid-media": {
    label: "PPC management", title: "PPC Management Agency", audience: "contractors",
    introduction: "Google Ads management that connects search terms, spend and conversion signals. Managed BOTS prepare improvements for your team to approve.",
    decision: "Which searches deserve your advertising budget?",
    inputs: ["Separate the jobs you want from searches for work you do not offer.", "Match campaign locations to the areas your crews can actually serve.", "Review conversion tracking before judging a campaign by enquiry volume."],
  },
  seo: {
    label: "SEO services", title: "SEO Agency", audience: "contractors",
    introduction: "Technical SEO, local search research and content priorities in one managed process. Our BOTS prepare the work; your team approves publication.",
    decision: "Can buyers find and evaluate the services you actually deliver?",
    inputs: ["Review search coverage for the services and places you genuinely serve.", "Identify technical issues and missing answers in the customer journey.", "Build useful service-area content from real expertise, with approved publishing."],
  },
  content: {
    label: "Content marketing", title: "Content Marketing Agency", audience: "contractors",
    introduction: "Turn your expertise into useful service content. We manage research, drafting and review with Content BOTS and your approved source material.",
    decision: "What does a buyer need to understand before requesting an estimate?",
    inputs: ["Collect real project knowledge and approved examples from your team.", "Explain service choices, preparation and common buying questions.", "Review claims, voice and service-area relevance before publishing."],
  },
  email: {
    label: "Email marketing services", title: "Email Marketing Services", audience: "service businesses",
    introduction: "Customer email campaigns built around your audience, timing and permissions. Managed BOTS prepare lifecycle messages and coordinate approved follow-up.",
    decision: "Which customers should hear from you, and why now?",
    inputs: ["Define the customer group and the purpose of each campaign.", "Check permissions, exclusions and the right point in the customer journey.", "Connect approved delivery and responses to the existing customer record."],
  },
  cro: {
    label: "Conversion optimization", title: "Conversion Optimization", audience: "service businesses",
    introduction: "Find friction between a website visit and a qualified enquiry. We use Analytics BOTS to prepare recommendations and scope the implementation with you.",
    decision: "Where does a promising visit lose momentum?",
    inputs: ["Review the path from campaign or search page to the enquiry form.", "Check the offer, service-area information and next-step clarity.", "Prioritize testable changes and agree how results will be measured."],
  },
  analytics: {
    label: "Marketing analytics", title: "Marketing Analytics", audience: "contractors",
    introduction: "Bring marketing activity and pipeline reporting into a clearer management view. Analytics BOTS work with approved data and make gaps visible.",
    decision: "Which information helps you choose the next business action?",
    inputs: ["Agree what counts as an enquiry, qualified opportunity and booked job.", "Connect available source data without filling gaps with estimates.", "Review campaign and pipeline changes with consistent definitions."],
  },
  "lead-generation": {
    label: "B2B lead generation", title: "B2B Lead Generation", audience: "commercial contractors",
    introduction: "Research the companies and buyers that fit your commercial services. Prospecting BOTS prepare qualified account research and a controlled sales handoff.",
    decision: "Which commercial accounts are worth researching?",
    inputs: ["Define buyer types, project requirements and territory boundaries.", "Separate researched accounts from verified enquiries and appointments.", "Review qualification and contact permissions before any outreach."],
  },
  outbound: {
    label: "Outbound sales support", title: "Outbound Sales Services", audience: "commercial contractors",
    introduction: "Prepare relevant B2B outreach with clear audiences and follow-up rules. Managed BOTS coordinate approved messages, replies and CRM handoffs.",
    decision: "What makes this outreach relevant to this buyer?",
    inputs: ["Start with an approved audience and a specific commercial offer.", "Define message review, suppression and when a person takes over.", "Record replies and agreed next steps in the existing sales process."],
  },
  inbound: {
    label: "Lead follow-up automation", title: "Inbound Lead Management", audience: "contractors",
    introduction: "Connect incoming enquiries, qualification and follow-up in your existing systems. We implement a managed BOT workflow with defined response responsibilities.",
    decision: "Who owns the next step when a new enquiry arrives?",
    inputs: ["Map supported enquiry sources and the context each one provides.", "Define inbound routing around service area, job type and your team’s responsibilities.", "Prepare approved follow-up and clear escalation to the right person."],
  },
  crm: {
    label: "CRM automation services", title: "CRM Automation Services", audience: "service businesses",
    introduction: "Keep customer records and follow-up connected. CRM BOTS surface missing information and prepare updates within the permissions your team approves.",
    decision: "Can your team rely on the next customer record they open?",
    inputs: ["Review required fields, ownership and current pipeline stages.", "Identify missing context and records that need a human decision.", "Apply approved changes with a reviewable activity history."],
  },
  enablement: {
    label: "Proposal automation", title: "Proposal Automation", audience: "contractors",
    introduction: "Prepare consistent proposals from approved project information. Managed Proposal BOTS support your sales team from draft through approved delivery.",
    decision: "What does the buyer need to make a confident decision?",
    inputs: ["Bring approved scope, project context and commercial terms together.", "Check missing inputs before a proposal reaches the customer.", "Keep pricing decisions, final review and delivery under human control."],
  },
  reviews: {
    label: "Review management", title: "Review Management Services", audience: "contractors",
    introduction: "Build a consistent process for honest customer feedback. Reviews BOTS prepare requests and response drafts for your team's approval.",
    decision: "How does a completed job become a timely feedback request?",
    inputs: ["Use genuine service records to identify appropriate request timing.", "Apply a consistent eligibility policy without filtering for positive sentiment.", "Review requests and response drafts before customer-facing activity."],
  },
  reactivation: {
    label: "Customer reactivation", title: "Customer Reactivation", audience: "service businesses",
    introduction: "Reconnect with past customers around a relevant next service. Managed BOTS review history, prepare segments and draft approved re-engagement campaigns.",
    decision: "Which existing relationships have a useful next conversation?",
    inputs: ["Review actual service history, timing and customer permissions.", "Exclude active conversations and contacts who should not be messaged.", "Prepare a relevant offer and record approved follow-up."],
  },
};

export function getSearchPositioning(slug: string): SearchPositioning {
  const copy = SEARCH_POSITIONING[slug];
  if (!copy) throw new Error(`Missing search positioning for ${slug}`);
  return copy;
}

export function serviceSearchTitle(svc: Service, location?: string) {
  const copy = getSearchPositioning(svc.slug);
  return `${copy.title}${location ? ` in ${location}` : ` for ${copy.audience}`} | AgenticBots`;
}

export function serviceSearchDescription(svc: Service, location?: string) {
  const copy = getSearchPositioning(svc.slug);
  return `${copy.label}${location ? ` in ${location}` : ` for ${copy.audience}`}. Managed AI BOTS, clear scope and human approval. Start with a $499 workflow audit.`;
}
