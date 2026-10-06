export type ServicePositioning = {
  headline: string;
  subhead: string;
  lead: string;
  summary: string;
  execution: string;
  deliveryModel: string;
  boundary: string;
  scope: string[];
};

export const SERVICE_POSITIONING: Record<string, ServicePositioning> = {
  "paid-media": {
    headline: "Paid media governed at operating cadence.",
    subhead: "Continuous control over spend, search terms and creative.",
    lead: "A managed Ads BOT monitors account conditions, prepares optimizations and executes approved changes within the budget and authority your organization defines.",
    summary: "Continuous campaign governance, budget pacing and search-term control.",
    execution: "Account signals, proposed changes, approval rules and performance records operate inside one managed workflow.",
    deliveryModel: "Ads BOT",
    boundary: "The BOT analyzes Google Ads activity and prepares changes. Budget or account changes move only after authorized approval.",
    scope: ["Search-term and spend analysis", "Budget pacing review", "Conversion and anomaly monitoring", "Proposed negative keywords", "Approved account changes", "Recorded decision history"],
  },
  seo: {
    headline: "Search visibility managed as infrastructure.",
    subhead: "Technical health, content coverage and local authority in one operating system.",
    lead: "A managed SEO BOT coordinates technical monitoring, search coverage and local-market execution against a defined roadmap for your business.",
    summary: "Technical SEO, content coverage and local search operations.",
    execution: "Site health, priority gaps, production and measurement move through one accountable operating cadence.",
    deliveryModel: "SEO BOT",
    boundary: "The BOT researches, monitors and prepares search work across supported Google properties. Publishing remains approval-gated.",
    scope: ["Technical search monitoring", "Local search analysis", "Search Console review", "Content-gap research", "Optimization drafts", "Approved publishing workflow"],
  },
  content: {
    headline: "Content operations with an accountable cadence.",
    subhead: "Strategy, production, review and distribution remain connected.",
    lead: "A managed Content BOT converts approved expertise into a governed publishing system with clear sources, review stages and channel-specific outputs.",
    summary: "A governed content system from source material through distribution.",
    execution: "Source material, drafting, review, adaptation and publication are managed as one repeatable process.",
    deliveryModel: "Content BOT",
    boundary: "The BOT works from approved source material and voice guidance. Every publishing action follows the agreed review policy.",
    scope: ["Source-material research", "Editorial planning", "Long-form drafting", "Channel adaptation", "Review routing", "Approved publishing"],
  },
  email: {
    headline: "Lifecycle communication built into the operating model.",
    subhead: "Every sequence has an audience, purpose, approval path and stop condition.",
    lead: "A managed lifecycle-email mandate combines Outbound and Reactivation BOTS with your existing systems, with consent, suppression and review rules defined before launch.",
    summary: "Lifecycle email with governed audiences, sequences and suppression.",
    execution: "Segmentation, drafting, approval, delivery and response handling remain connected and reviewable.",
    deliveryModel: "Outbound and Reactivation BOTS",
    boundary: "Email is delivered as a governed workflow across existing BOT types. Sending requires approval, consent rules and suppression checks.",
    scope: ["Audience and lifecycle definition", "Sequence drafting", "Consent and suppression rules", "Human approval routing", "Approved email delivery", "Response and CRM handoff"],
  },
  cro: {
    headline: "Conversion improvement as a continuous discipline.",
    subhead: "Prioritized experiments tied to the customer journey and business outcome.",
    lead: "A managed conversion program uses the Analytics BOT to identify friction, prepare controlled experiments and record what changed so decisions compound instead of resetting each quarter.",
    summary: "Structured conversion analysis, experimentation and decision records.",
    execution: "Observation, prioritization, controlled change and evaluation operate through a documented test program.",
    deliveryModel: "Analytics BOT with scoped implementation",
    boundary: "The BOT supports diagnosis, prioritization and reporting. Website changes and experiments require separately agreed implementation and approval.",
    scope: ["Journey and funnel analysis", "Measurement review", "Friction hypothesis development", "Experiment prioritization", "Implementation brief preparation", "Decision and result records"],
  },
  analytics: {
    headline: "One operating view of demand, pipeline and outcomes.",
    subhead: "Reporting designed for decisions, ownership and follow-through.",
    lead: "A managed Analytics BOT reconciles activity across your systems and prepares a consistent management view without obscuring source data or assumptions.",
    summary: "Management reporting across demand, pipeline and operating activity.",
    execution: "Source data, definitions, exceptions and management reporting are maintained through one reviewable process.",
    deliveryModel: "Analytics BOT",
    boundary: "The BOT monitors and reports across approved data sources. Definitions, gaps and assumptions remain visible to management.",
    scope: ["Source and definition review", "Marketing activity monitoring", "Pipeline reporting", "Exception identification", "Management summaries", "Reviewable source references"],
  },
  "lead-generation": {
    headline: "Prospecting infrastructure for defined commercial markets.",
    subhead: "Account discovery, qualification and handoff governed by your criteria.",
    lead: "A managed Prospecting BOT builds and maintains target-account coverage for the buyers, geographies and project types your commercial strategy prioritizes.",
    summary: "Target-account discovery, qualification and governed sales handoff.",
    execution: "Market definition, research, qualification and CRM handoff follow a controlled operating sequence.",
    deliveryModel: "Prospecting BOT",
    boundary: "The BOT researches and qualifies against an approved ICP. Paid enrichment is budget-gated and CRM handoff requires policy checks.",
    scope: ["ICP and market definition", "Account discovery", "Buyer-role research", "Deterministic qualification", "Budget-gated enrichment", "Governed CRM handoff"],
  },
  outbound: {
    headline: "Structured outbound from first touch to qualified handoff.",
    subhead: "Audience, message, cadence and escalation rules remain under your control.",
    lead: "A managed Outbound BOT prepares and coordinates approved outreach while suppression, reply handling and human escalation remain explicit.",
    summary: "Governed outbound execution with suppression and reply controls.",
    execution: "Targeting, message preparation, approval, delivery and reply routing are managed as one accountable workflow.",
    deliveryModel: "Outbound BOT",
    boundary: "The BOT drafts and coordinates outreach through supported email and CRM systems. Sending requires approval and outbound policy checks.",
    scope: ["Approved audience intake", "Message drafting", "Sequence preparation", "Suppression enforcement", "Approved email delivery", "Reply and CRM routing"],
  },
  inbound: {
    headline: "A controlled response to every inbound opportunity.",
    subhead: "Capture, qualification, scheduling and handoff without fragmented ownership.",
    lead: "A managed inbound-response mandate coordinates CRM and Outbound BOTS around the sources, business rules and escalation paths included in your deployment.",
    summary: "Coordinated inbound response, qualification and scheduling.",
    execution: "Every inbound signal enters a defined process for response, qualification, booking and system-of-record updates.",
    deliveryModel: "CRM and Outbound BOTS",
    boundary: "Inbound handling is configured as a workflow across supported CRM, email and calendar systems. Channel coverage and response commitments are scoped per deployment.",
    scope: ["Inbound source mapping", "Ownership and routing rules", "Qualification criteria", "Response draft preparation", "Calendar and human escalation", "Approved CRM updates"],
  },
  crm: {
    headline: "A revenue system your team can rely on.",
    subhead: "Accurate records, defined next steps and visible exceptions.",
    lead: "A managed CRM BOT maintains agreed records and workflows across the systems your team already uses, with write authority and review rules explicitly scoped.",
    summary: "CRM data quality, workflow execution and pipeline governance.",
    execution: "Capture, validation, record updates, exception handling and reporting operate under one control model.",
    deliveryModel: "CRM BOT",
    boundary: "The BOT monitors data quality and prepares updates. Writes to supported CRM systems follow the configured approval policy.",
    scope: ["Record-quality monitoring", "Duplicate and stale-stage detection", "Missing-next-step review", "Update preparation", "Approved CRM writes", "Exception reporting"],
  },
  enablement: {
    headline: "Proposal execution without operational delay.",
    subhead: "Scope, pricing, approval and follow-through in one governed workflow.",
    lead: "A managed Proposal BOT prepares complete commercial documents from approved inputs and keeps each opportunity moving through your defined review process.",
    summary: "Proposal preparation, approval, delivery and follow-through.",
    execution: "Approved inputs, document preparation, internal review, delivery and status tracking stay connected.",
    deliveryModel: "Proposal BOT",
    boundary: "The BOT prepares proposals from client-controlled notes, price books and rules. Delivery and CRM updates require approval.",
    scope: ["Approved-input collection", "Proposal drafting", "Scope and pricing assembly", "Internal review routing", "Approved delivery", "CRM status handoff"],
  },
  reviews: {
    headline: "Reputation management as a controlled customer workflow.",
    subhead: "Timely requests, governed responses and clear escalation.",
    lead: "A managed Reviews BOT coordinates post-service outreach and response preparation while sensitive feedback routes to the right person.",
    summary: "Review requests, response governance and escalation workflows.",
    execution: "Eligibility, timing, response preparation, approval and escalation follow a documented customer-care process.",
    deliveryModel: "Reviews BOT",
    boundary: "The BOT prepares requests and responses for eligible records in supported systems. External messages and publishing remain approval-gated.",
    scope: ["Eligibility-rule definition", "Post-service trigger review", "Request drafting", "Response drafting", "Sensitive-feedback escalation", "Approved sending and publishing"],
  },
  reactivation: {
    headline: "Existing customer demand, systematically re-engaged.",
    subhead: "Relevant outreach based on service history, timing and consent.",
    lead: "A managed Reactivation BOT identifies eligible customer segments and coordinates approved campaigns through the systems and policies you already use.",
    summary: "Governed reactivation based on customer history and timing.",
    execution: "Eligibility, segmentation, message preparation, approval and response handling operate as one lifecycle workflow.",
    deliveryModel: "Reactivation BOT",
    boundary: "The BOT identifies eligible records and prepares outreach. Consent, suppression, approval and supported-system limits govern every external action.",
    scope: ["Eligibility and history review", "Dormant-record identification", "Segment preparation", "Follow-up drafting", "Consent and suppression controls", "Approved outreach and response routing"],
  },
};

export function getServicePositioning(slug: string): ServicePositioning {
  const positioning = SERVICE_POSITIONING[slug];
  if (!positioning) throw new Error("Missing enterprise positioning for service: " + slug);
  return positioning;
}
