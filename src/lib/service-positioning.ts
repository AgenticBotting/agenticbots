export type ServicePositioning = {
  headline: string;
  subhead: string;
  lead: string;
  summary: string;
  execution: string;
};

export const SERVICE_POSITIONING: Record<string, ServicePositioning> = {
  "paid-media": {
    headline: "Paid media governed at operating cadence.",
    subhead: "Continuous control over spend, search terms and creative.",
    lead: "A managed Ads BOT monitors account conditions, prepares optimizations and executes approved changes within the budget and authority your organization defines.",
    summary: "Continuous campaign governance, budget pacing and search-term control.",
    execution: "Account signals, proposed changes, approval rules and performance records operate inside one managed workflow.",
  },
  seo: {
    headline: "Search visibility managed as infrastructure.",
    subhead: "Technical health, content coverage and local authority in one operating system.",
    lead: "A managed SEO BOT coordinates technical monitoring, search coverage and local-market execution against a defined roadmap for your business.",
    summary: "Technical SEO, content coverage and local search operations.",
    execution: "Site health, priority gaps, production and measurement move through one accountable operating cadence.",
  },
  content: {
    headline: "Content operations with an accountable cadence.",
    subhead: "Strategy, production, review and distribution remain connected.",
    lead: "A managed Content BOT converts approved expertise into a governed publishing system with clear sources, review stages and channel-specific outputs.",
    summary: "A governed content system from source material through distribution.",
    execution: "Source material, drafting, review, adaptation and publication are managed as one repeatable process.",
  },
  email: {
    headline: "Lifecycle communication built into the operating model.",
    subhead: "Every sequence has an audience, purpose, approval path and stop condition.",
    lead: "A managed Email BOT coordinates customer and prospect communication through your existing systems, with consent, suppression and review rules defined before launch.",
    summary: "Lifecycle email with governed audiences, sequences and suppression.",
    execution: "Segmentation, drafting, approval, delivery and response handling remain connected and reviewable.",
  },
  cro: {
    headline: "Conversion improvement as a continuous discipline.",
    subhead: "Prioritized experiments tied to the customer journey and business outcome.",
    lead: "A managed Conversion BOT identifies friction, prepares controlled experiments and records what changed so decisions compound instead of resetting each quarter.",
    summary: "Structured conversion analysis, experimentation and decision records.",
    execution: "Observation, prioritization, controlled change and evaluation operate through a documented test program.",
  },
  analytics: {
    headline: "One operating view of demand, pipeline and outcomes.",
    subhead: "Reporting designed for decisions, ownership and follow-through.",
    lead: "A managed Analytics BOT reconciles activity across your systems and prepares a consistent management view without obscuring source data or assumptions.",
    summary: "Management reporting across demand, pipeline and operating activity.",
    execution: "Source data, definitions, exceptions and management reporting are maintained through one reviewable process.",
  },
  "lead-generation": {
    headline: "Prospecting infrastructure for defined commercial markets.",
    subhead: "Account discovery, qualification and handoff governed by your criteria.",
    lead: "A managed Prospecting BOT builds and maintains target-account coverage for the buyers, geographies and project types your commercial strategy prioritizes.",
    summary: "Target-account discovery, qualification and governed sales handoff.",
    execution: "Market definition, research, qualification and CRM handoff follow a controlled operating sequence.",
  },
  outbound: {
    headline: "Structured outbound from first touch to qualified handoff.",
    subhead: "Audience, message, cadence and escalation rules remain under your control.",
    lead: "A managed Outbound BOT prepares and coordinates approved outreach while suppression, reply handling and human escalation remain explicit.",
    summary: "Governed outbound execution with suppression and reply controls.",
    execution: "Targeting, message preparation, approval, delivery and reply routing are managed as one accountable workflow.",
  },
  inbound: {
    headline: "A controlled response to every inbound opportunity.",
    subhead: "Capture, qualification, scheduling and handoff without fragmented ownership.",
    lead: "A managed Speed-to-Lead BOT coordinates the first-response workflow across calls, forms and messages, using the business rules and escalation paths you approve.",
    summary: "Coordinated inbound response, qualification and scheduling.",
    execution: "Every inbound signal enters a defined process for response, qualification, booking and system-of-record updates.",
  },
  crm: {
    headline: "A revenue system your team can rely on.",
    subhead: "Accurate records, defined next steps and visible exceptions.",
    lead: "A managed CRM BOT maintains agreed records and workflows across the systems your team already uses, with write authority and review rules explicitly scoped.",
    summary: "CRM data quality, workflow execution and pipeline governance.",
    execution: "Capture, validation, record updates, exception handling and reporting operate under one control model.",
  },
  enablement: {
    headline: "Proposal execution without operational delay.",
    subhead: "Scope, pricing, approval and follow-through in one governed workflow.",
    lead: "A managed Proposal BOT prepares complete commercial documents from approved inputs and keeps each opportunity moving through your defined review process.",
    summary: "Proposal preparation, approval, delivery and follow-through.",
    execution: "Approved inputs, document preparation, internal review, delivery and status tracking stay connected.",
  },
  reviews: {
    headline: "Reputation management as a controlled customer workflow.",
    subhead: "Timely requests, governed responses and clear escalation.",
    lead: "A managed Reviews BOT coordinates post-service outreach and response preparation while sensitive feedback routes to the right person.",
    summary: "Review requests, response governance and escalation workflows.",
    execution: "Eligibility, timing, response preparation, approval and escalation follow a documented customer-care process.",
  },
  reactivation: {
    headline: "Existing customer demand, systematically re-engaged.",
    subhead: "Relevant outreach based on service history, timing and consent.",
    lead: "A managed Reactivation BOT identifies eligible customer segments and coordinates approved campaigns through the systems and policies you already use.",
    summary: "Governed reactivation based on customer history and timing.",
    execution: "Eligibility, segmentation, message preparation, approval and response handling operate as one lifecycle workflow.",
  },
};

export function getServicePositioning(slug: string): ServicePositioning {
  const positioning = SERVICE_POSITIONING[slug];
  if (!positioning) throw new Error("Missing enterprise positioning for service: " + slug);
  return positioning;
}
