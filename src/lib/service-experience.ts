/** Buyer-facing explanations; capabilities and authority still come from service-positioning. */
export type ServiceExperience = {
  headline: string;
  accent: string;
  description: string;
  workspace: string;
  benefits: readonly { title: string; body: string }[];
  examples: readonly { title: string; context: string; draft: string }[];
};

export const SERVICE_EXPERIENCES: Record<string, ServiceExperience> = {
  "paid-media": {
    headline: "Give every ad decision", accent: "a clear business reason.",
    description: "Know what needs attention in your ad account. A managed Ads BOT reviews spend, search terms and campaign signals, then prepares changes for your approval.",
    workspace: "Campaign review",
    benefits: [
      { title: "See where spend needs attention.", body: "Bring search terms, pacing and conversion signals into a focused account review." },
      { title: "Move from insight to a proposed change.", body: "Review recommended exclusions and account adjustments with the reasoning attached." },
      { title: "Keep the budget in your hands.", body: "Your team approves changes. Each decision stays available for the next account review." },
    ],
    examples: [
      { title: "Search-term review", context: "Commercial roofing campaign", draft: "Review searches for DIY roof repair against the commercial campaign’s targeting. Prepare exclusions for the account owner to approve." },
      { title: "Budget pacing", context: "Account review", draft: "Compare current spend with the approved plan. Flag any deviation for review; leave the account budget unchanged." },
      { title: "Conversion checks", context: "Measurement review", draft: "Confirm which recorded actions represent a qualified enquiry before recommending an account change." },
    ],
  },
  seo: {
    headline: "Make your expertise", accent: "easier to find.",
    description: "Build a clearer path from local search to your business. A managed SEO BOT connects technical review, content priorities and local search into one practical roadmap.",
    workspace: "Search roadmap",
    benefits: [
      { title: "Find the gaps that deserve attention.", body: "Review technical health and search coverage before adding more pages or changing the site." },
      { title: "Build around the services you want to sell.", body: "Connect content opportunities to your actual services, locations and customer questions." },
      { title: "Keep improvements moving.", body: "Turn priorities into optimization drafts, with publishing approval and a record of the work." },
    ],
    examples: [
      { title: "Local content brief", context: "Commercial roof inspections", draft: "Prepare a service-page brief covering inspection scope, property types and the markets served. Validate local details with the business before publishing." },
      { title: "Technical review", context: "Search health", draft: "Review indexing and page signals. Separate confirmed issues from items that need more data, then prepare a prioritized fix list." },
      { title: "Search coverage", context: "Content planning", draft: "Compare the approved service list with existing pages. Propose relevant coverage gaps for editorial review." },
    ],
  },
  content: {
    headline: "Turn your expertise", accent: "into content that works.",
    description: "Keep useful content moving without starting from a blank page. A managed Content BOT turns approved business knowledge into drafts your team can review and publish.",
    workspace: "Editorial workspace",
    benefits: [
      { title: "Start with what your business knows.", body: "Use approved service details, customer questions and internal expertise as the source." },
      { title: "Give each channel a useful version.", body: "Use content repurposing to prepare channel adaptations from the same reviewed material." },
      { title: "Make review part of the process.", body: "Connect your editorial calendar, drafts and feedback so your team can approve the work with context." },
    ],
    examples: [
      { title: "Service article", context: "Seasonal HVAC maintenance", draft: "Outline the inspection checklist, common warning signs and when to request service. Use the approved maintenance guide; flag any unsupported claims for review." },
      { title: "Channel adaptation", context: "Company update", draft: "Adapt the reviewed maintenance article into a concise company update, preserving the approved service details and next step." },
      { title: "Editorial review", context: "Publishing queue", draft: "Attach source notes and brand guidance to the draft. Route it to the named reviewer before publication." },
    ],
  },
  email: {
    headline: "Stay relevant", accent: "through the customer journey.",
    description: "Give every email a purpose. Managed Outbound and Reactivation BOTS prepare lifecycle messages around customer context, eligibility and your team’s approval.",
    workspace: "Lifecycle email",
    benefits: [
      { title: "Match the message to the moment.", body: "Define audiences around lifecycle stage, service history and the reason to get in touch." },
      { title: "Keep sequences consistent.", body: "Review message drafts, cadence and response handling as one connected process." },
      { title: "Respect the customer relationship.", body: "Consent, suppression checks and human approval govern delivery and follow-up." },
    ],
    examples: [
      { title: "Customer follow-up", context: "Maintenance lifecycle", draft: "Prepare a service reminder for eligible customers approaching their maintenance window. Confirm consent and suppression status before approval." },
      { title: "Sequence review", context: "Message planning", draft: "Draft the introduction, follow-up and stop conditions. Hold delivery until the audience and messages have been reviewed." },
      { title: "Reply handoff", context: "Customer response", draft: "Summarize the customer’s request and prepare the next step for the responsible team member." },
    ],
  },
  cro: {
    headline: "Make the next step", accent: "easier for your customers.",
    description: "Find what gets between interest and an enquiry. A managed Analytics BOT helps your team prioritize conversion improvements and prepare a measured test plan.",
    workspace: "Conversion program",
    benefits: [
      { title: "Understand where the journey stalls.", body: "Start with a friction audit of the path to enquiry, mobile conversion and gaps in the available evidence." },
      { title: "Know what is worth testing.", body: "Turn observed friction into a prioritized hypothesis and an implementation brief." },
      { title: "Learn from each approved change.", body: "Record what changed, how it was evaluated and what the evidence supports next." },
    ],
    examples: [
      { title: "Enquiry form review", context: "Website customer journey", draft: "Review required fields, mobile usability and the confirmation step. Treat unnecessary form effort as a hypothesis to validate, not a measured conversion loss." },
      { title: "Experiment brief", context: "Proposed improvement", draft: "Define the intended change, primary measurement and review criteria. Implementation is separately scoped and approved." },
      { title: "Decision record", context: "Evaluation plan", draft: "Document the baseline and data requirements before the test. Record uncertainty alongside any findings." },
    ],
  },
  analytics: {
    headline: "See what matters.", accent: "Know what to do next.",
    description: "Bring marketing and pipeline activity into a management view your team can use. A managed Analytics BOT prepares reporting with sources, exceptions and next questions visible.",
    workspace: "Management reporting",
    benefits: [
      { title: "Bring the right information together.", body: "Agree the sources and definitions behind channel reporting, with data reconciliation before combining records." },
      { title: "Give exceptions some context.", body: "Identify missing data and changes that need attention without hiding uncertainty." },
      { title: "Make the review actionable.", body: "Prepare management summaries that connect findings to ownership and next decisions." },
    ],
    examples: [
      { title: "Pipeline summary", context: "Management review", draft: "Summarize the available opportunity records by stage. Identify missing owners and next steps without estimating unreported revenue." },
      { title: "Source reconciliation", context: "Reporting definitions", draft: "Check how the CRM and marketing sources define an enquiry. Record mismatches before combining the data." },
      { title: "Exception review", context: "Data quality", draft: "Flag incomplete records and unavailable measurements. Include source references for the management team." },
    ],
  },
  "lead-generation": {
    headline: "Focus your prospecting", accent: "on the right accounts.",
    description: "Give your commercial team a more deliberate starting point. A managed Prospecting BOT researches accounts and buyer roles against the markets and qualification rules you define.",
    workspace: "Prospecting workspace",
    benefits: [
      { title: "Define who belongs in the pipeline.", body: "Set your ideal customer profile: service fit, geography, buyer roles and qualification criteria before research starts." },
      { title: "Keep the research reviewable.", body: "Bring account context and qualification reasoning together for your sales team." },
      { title: "Control the handoff and the spend.", body: "Paid research follows approved budgets. CRM handoffs remain subject to review and policy checks." },
    ],
    examples: [
      { title: "Account research", context: "Commercial property management", draft: "Research companies that match the approved market and service criteria. Separate verified information from unanswered qualification questions." },
      { title: "Buyer-role review", context: "Decision-maker context", draft: "Identify relevant facilities and property-management roles. Record the basis for relevance before preparing a handoff." },
      { title: "Qualification brief", context: "Sales review", draft: "Prepare the account context, fit criteria and outstanding questions. Request approval before any CRM update." },
    ],
  },
  outbound: {
    headline: "Make your outreach", accent: "worth responding to.",
    description: "Put relevant context behind your sales outreach. A managed Outbound BOT prepares messages and follow-up sequences, with approval, suppression and reply handling built in.",
    workspace: "Outbound workspace",
    benefits: [
      { title: "Use context before making contact.", body: "Build message drafts around an approved audience and a relevant business reason." },
      { title: "Give follow-up a defined purpose.", body: "Review sequence cadence, stop conditions and escalation with your sales team." },
      { title: "Route responses to the right person.", body: "Use reply triage to connect each response, next step and CRM handoff to the conversation." },
    ],
    examples: [
      { title: "Introduction draft", context: "Approved commercial audience", draft: "Prepare a concise introduction around the prospect’s property needs and the services offered. Check suppression and request approval before delivery." },
      { title: "Follow-up draft", context: "Sequence planning", draft: "Prepare a useful follow-up with a clear next step. Respect the agreed cadence and stop conditions." },
      { title: "Reply routing", context: "Sales handoff", draft: "Summarize a reply, preserve the conversation context and prepare the next action for the account owner." },
    ],
  },
  inbound: {
    headline: "Give every enquiry", accent: "a clear next step.",
    description: "Connect the first enquiry to the people who can act on it. Managed CRM and Outbound BOTS prepare responses, qualification and scheduling handoffs around your business rules.",
    workspace: "Inbound workspace",
    benefits: [
      { title: "Bring the request into focus.", body: "Capture relevant details from the channels included in your scope and identify ownership." },
      { title: "Prepare a useful response.", body: "Use the service request and qualification rules to draft the next customer interaction." },
      { title: "Keep the handoff moving.", body: "Connect the proposed response, calendar step and CRM update for your team to review." },
    ],
    examples: [
      { title: "New service enquiry", context: "Commercial roof inspection", draft: "Thanks for getting in touch. What is the property address, the main concern and your preferred inspection timing?" },
      { title: "Qualification review", context: "Service fit", draft: "Check the requested service and location against the business rules. Route exceptions to the assigned team member." },
      { title: "Scheduling handoff", context: "Next appointment", draft: "Prepare the customer context and proposed calendar step. Confirm availability and approval before any update." },
    ],
  },
  crm: {
    headline: "A clearer pipeline.", accent: "A more focused sales team.",
    description: "Make your CRM easier to work from. A managed CRM BOT identifies incomplete records and stalled next steps, then prepares updates for your team to approve.",
    workspace: "Pipeline workspace",
    benefits: [
      { title: "Surface records that need attention.", body: "Improve record hygiene by reviewing missing details, potential duplicates and stale opportunity stages." },
      { title: "Make ownership visible.", body: "Identify opportunities without a clear owner or next action so your team can resolve them." },
      { title: "Keep changes accountable.", body: "Prepare CRM updates with context, review them before writing and retain the activity record." },
    ],
    examples: [
      { title: "Missing next step", context: "Inspection opportunity", draft: "The opportunity needs a follow-up owner and a next action. Prepare an update for the sales manager to review." },
      { title: "Duplicate review", context: "Record quality", draft: "Compare the potential duplicate records and highlight differences. Do not merge or delete records automatically." },
      { title: "Stage review", context: "Pipeline maintenance", draft: "Flag a stage that may be out of date. Ask the record owner to confirm the current position before updating it." },
    ],
  },
  enablement: {
    headline: "From project details", accent: "to a proposal ready for review.",
    description: "Give your team a stronger starting draft. A managed Proposal BOT assembles scope and commercial details from your approved notes, price books and document rules.",
    workspace: "Proposal workspace",
    benefits: [
      { title: "Bring the inputs together.", body: "Connect your scope of work, approved project notes and pricing sources for consistent quote assembly." },
      { title: "Make review more focused.", body: "Surface missing inputs and keep scope, exclusions and commercial terms visible." },
      { title: "Connect the proposal to the opportunity.", body: "Prepare delivery and CRM status handoffs once the document has been approved." },
    ],
    examples: [
      { title: "Proposal draft", context: "Commercial maintenance scope", draft: "Assemble the service scope from the approved inspection notes. Insert pricing only from the current authorized price book." },
      { title: "Missing-input review", context: "Commercial checks", draft: "Flag an unconfirmed access requirement and service interval. Hold the proposal for review rather than filling in assumptions." },
      { title: "Delivery handoff", context: "Proposal approval", draft: "Prepare the delivery message and proposed CRM status. Both wait for authorized approval." },
    ],
  },
  reviews: {
    headline: "Make customer feedback", accent: "part of the service.",
    description: "Put a consistent process behind your reputation. A managed Reviews BOT prepares post-service requests and responses, with sensitive feedback routed to your team.",
    workspace: "Customer feedback",
    benefits: [
      { title: "Follow through after the job.", body: "Define eligible customers and review-request timing around the completed service." },
      { title: "Respond with the right context.", body: "Prepare thoughtful response drafts for your team to check before publishing." },
      { title: "Give sensitive feedback human attention.", body: "Route issues to the right person with the relevant customer and service details." },
    ],
    examples: [
      { title: "Review request", context: "Completed service", draft: "Thank you for choosing our team. If you would like to share feedback about your service experience, here is where you can leave a review." },
      { title: "Response draft", context: "Customer feedback", draft: "Prepare a response grounded in the customer’s feedback. Avoid sharing private service details in a public reply." },
      { title: "Escalation note", context: "Sensitive feedback", draft: "Summarize the concern and route it to the service manager. Hold any external response for human review." },
    ],
  },
  reactivation: {
    headline: "Your next opportunity", accent: "may already know you.",
    description: "Put customer history to work. A managed Reactivation BOT identifies relevant follow-up opportunities and prepares outreach around service timing, eligibility and consent.",
    workspace: "Customer opportunities",
    benefits: [
      { title: "Look at the relationships you already have.", body: "Review each past customer’s service history and dormant records for a relevant reason to reconnect." },
      { title: "Make the follow-up useful.", body: "Prepare a maintenance reminder around the customer’s service timing and relationship with your team." },
      { title: "Keep outreach within the rules.", body: "Eligibility, consent and suppression checks come before your team’s approval to send." },
    ],
    examples: [
      { title: "Maintenance segment", context: "Annual service window", draft: "Identify customers approaching the relevant maintenance period. Check service history and communication eligibility before preparing outreach." },
      { title: "Follow-up draft", context: "Existing customer", draft: "Your maintenance window is coming up. Would you like to discuss the next service visit with our team?" },
      { title: "Response handoff", context: "Customer interest", draft: "Prepare the customer’s service history and request for the assigned team member. Review the next action before updating the CRM." },
    ],
  },
};

export function getServiceExperience(slug: string): ServiceExperience {
  const experience = SERVICE_EXPERIENCES[slug];
  if (!experience) throw new Error(`Missing service experience: ${slug}`);
  return experience;
}
