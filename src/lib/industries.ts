import type { ServiceExperience } from "./service-experience";

export type IndustryChannel = "seo" | "ppc";
export type IndustryBrief = {
  heading: string;
  introduction: string;
  decisions: { title: string; body: string }[];
  example: ServiceExperience["examples"][number];
};
export type Industry = {
  slug: string;
  name: string;
  audience: string;
  introduction: string;
  projectTypes: string[];
  qualification: string;
  followUp: string;
  seo: IndustryBrief;
  ppc: IndustryBrief;
};

/** Public editorial records. Never sourced from private prospecting/client data. */
export const INDUSTRIES: Industry[] = [
  {
    slug: "hvac", name: "HVAC", audience: "HVAC companies",
    introduction: "Connect the search for a repair, replacement or maintenance visit to the right next step. We build and manage marketing BOTS around your HVAC services, service area and existing systems.",
    projectTypes: ["Service & repair", "System replacement", "Maintenance", "Commercial HVAC"],
    qualification: "Separate a repair request from a replacement consultation. Confirm the property, location and type of system before your team decides the next step.",
    followUp: "Use approved customer history to prepare maintenance reminders and estimate follow-up. Availability and customer-facing commitments stay with your team.",
    seo: {
      heading: "Help the right HVAC customer find the right service.",
      introduction: "An AC repair, a furnace replacement and a commercial maintenance contract need different answers. Your SEO roadmap should reflect those services and the locations you can support.",
      decisions: [
        { title: "Give each service a clear destination.", body: "Review repair, installation and maintenance pages for accurate scope, useful buying information and a clear enquiry path." },
        { title: "Ground local pages in actual coverage.", body: "Connect service-area content to dispatch boundaries and real project knowledge. Keep operating hours and response claims accurate." },
        { title: "Make technical advice reviewable.", body: "Draft customer questions from approved source material and have your team check equipment, maintenance and service claims before publication." },
      ],
      example: { title: "Replacement page brief", context: "Illustrative HVAC SEO review", draft: "Prepare a page outline that explains the replacement consultation, information needed from the property owner and the approved service area. Route technical claims to the HVAC team for review." },
    },
    ppc: {
      heading: "Match ad spend to the HVAC work you want.",
      introduction: "Give repair enquiries, replacements and commercial opportunities distinct campaign context. We review Google Ads activity against your offer, territory and agreed budget.",
      decisions: [
        { title: "Separate repair and replacement intent.", body: "Review search terms against the campaign's purpose. Prepare exclusions for equipment shopping, employment or services you do not offer." },
        { title: "Keep targeting aligned with capacity.", body: "Confirm locations and advertised availability with the team. Any schedule, targeting or budget change requires approval." },
        { title: "Review what counts as a conversion.", body: "Check whether tracked forms and calls represent a useful enquiry. Compare against recorded outcomes where those records are available." },
      ],
      example: { title: "Search-term review", context: "Illustrative HVAC campaign", draft: "A replacement campaign includes searches for replacement filters. Prepare those terms for review against the approved exclusions. Keep the campaign and budget unchanged until approval." },
    },
  },
  {
    slug: "plumbing", name: "Plumbing", audience: "plumbing companies",
    introduction: "Build a clearer path from a plumbing enquiry to the work your team can serve. Managed BOTS connect search, campaign review and approved follow-up around your plumbing business.",
    projectTypes: ["Repairs & leaks", "Drain services", "Water heaters", "Planned projects"],
    qualification: "Capture the service needed, property location and urgency. Distinguish an immediate repair request from a planned installation without promising availability your team has not confirmed.",
    followUp: "Prepare the next message for an open estimate or completed service using the actual customer record, with consent and human review before sending.",
    seo: {
      heading: "Build search coverage around the plumbing work you deliver.",
      introduction: "A drain issue and a water-heater installation create different buying questions. We connect technical SEO review with service content that helps a customer choose the next step.",
      decisions: [
        { title: "Separate service intent clearly.", body: "Give your supported repairs and installations useful explanations. Link related services without forcing every question onto the same page." },
        { title: "Remove uncertainty before the enquiry.", body: "Review coverage, appointment expectations and what information a customer should provide. Confirm advertised availability and pricing details with your team." },
        { title: "Use real plumbing expertise.", body: "Prepare drafts from your team's service knowledge and approved project examples. Review technical advice before it becomes public content." },
      ],
      example: { title: "Water-heater content brief", context: "Illustrative plumbing SEO review", draft: "Outline the installation assessment, property information needed and approved service coverage. Request the team's review of equipment-specific statements before publishing." },
    },
    ppc: {
      heading: "Put each plumbing campaign behind a clear service offer.",
      introduction: "Review paid searches in the context of repair work, installation projects and your dispatch area. Ads BOTS prepare changes your account owner can evaluate.",
      decisions: [
        { title: "Distinguish a service request from product research.", body: "Review supply, part and do-it-yourself searches against the work each campaign is intended to acquire." },
        { title: "Keep advertised availability accurate.", body: "Align service locations and campaign schedules with the agreed operating plan. Your team approves changes and any urgency-related message." },
        { title: "Connect enquiries to useful context.", body: "Review conversion definitions and the information captured after a click, including location and service type where available." },
      ],
      example: { title: "Drain-service campaign review", context: "Illustrative plumbing PPC review", draft: "Separate searches for drain-cleaning equipment from requests for a plumbing service. Prepare a proposed exclusion list with reasons for the account owner to approve." },
    },
  },
  {
    slug: "electrical", name: "Electrical", audience: "electrical contractors",
    introduction: "Connect your electrical services to a marketing process built around qualified projects. We manage BOTS for search, campaign analysis and follow-up within your existing tools.",
    projectTypes: ["Residential service", "Panel upgrades", "EV charger installation", "Commercial projects"],
    qualification: "Identify the property type, requested work and location. Give the estimator enough context to decide whether a site visit or further information is needed.",
    followUp: "Keep open estimates and project questions connected to the customer record. BOTS prepare the follow-up; your team owns scope, technical advice and approval.",
    seo: {
      heading: "Make your electrical services easier to evaluate in search.",
      introduction: "Home service, upgrades and commercial electrical projects need clear boundaries. We develop SEO priorities around your actual capabilities and approved technical expertise.",
      decisions: [
        { title: "Organize by the work customers need.", body: "Review service pages for panel work, installation and commercial projects where offered. Explain the assessment process and what remains subject to inspection." },
        { title: "Support the right local enquiries.", body: "Connect locations to actual service coverage. Check that enquiry paths collect project type and property context instead of only a phone number." },
        { title: "Keep technical claims accountable.", body: "Your qualified team reviews safety, equipment and project-specific advice. Published content reflects the qualifications and project scope your team confirms." },
      ],
      example: { title: "Installation page outline", context: "Illustrative electrical SEO review", draft: "Prepare an EV charger installation page brief covering the assessment process, property information and service coverage. Leave technical suitability and final scope to the electrical team." },
    },
    ppc: {
      heading: "Align electrical advertising with your project priorities.",
      introduction: "Separate residential enquiries from commercial opportunities and equipment-shopping searches. We manage Google Ads analysis with an explicit offer, territory and approval process.",
      decisions: [
        { title: "Choose the campaign's project type.", body: "Set the context for service calls, upgrades or commercial work before reviewing search terms and proposed changes." },
        { title: "Inspect mismatched searches.", body: "Prepare exclusions for jobs, training or equipment searches when they do not match the campaign. Review every recommendation before it changes the account." },
        { title: "Make enquiry quality visible.", body: "Use available project and location information to review what a tracked conversion represents. Keep missing data visible." },
      ],
      example: { title: "Commercial campaign check", context: "Illustrative electrical PPC review", draft: "A commercial installation campaign is receiving electrical apprenticeship searches. Prepare exclusions and explain the mismatch for approval before editing the account." },
    },
  },
  {
    slug: "roofing", name: "Roofing", audience: "roofing companies",
    introduction: "Connect roofing search demand to a more disciplined estimate process. Managed BOTS support marketing, enquiry qualification and follow-up across the services your roofing team actually offers.",
    projectTypes: ["Roof repair", "Replacement", "Residential roofing", "Commercial roofing"],
    qualification: "Distinguish a repair from a replacement and a homeowner from a commercial buyer. Record property location, project context and the information needed for an assessment.",
    followUp: "Prepare estimate reminders and proposal drafts from approved scope. Insurance, pricing, availability and technical commitments remain decisions for your team.",
    seo: {
      heading: "Build roofing SEO around distinct project decisions.",
      introduction: "A homeowner evaluating a repair and a property manager planning a commercial replacement need different information. We turn those differences into a practical search roadmap.",
      decisions: [
        { title: "Separate repair, replacement and commercial work.", body: "Review service structure so buyers can find the relevant assessment process and supported roofing work without guessing." },
        { title: "Use project evidence you can stand behind.", body: "Work with approved project descriptions and images when available. Connect each page to relevant project experience and credentials your team confirms." },
        { title: "Connect local visibility to actual coverage.", body: "Define the places and property types you serve. Publish useful service-area information with clear estimate steps and accurate claims." },
      ],
      example: { title: "Commercial roofing page brief", context: "Illustrative roofing SEO review", draft: "Prepare content for a property manager evaluating a roof assessment. Include approved project examples and clarify the information needed for a proposal." },
    },
    ppc: {
      heading: "Give roofing campaigns a defined project and buyer.",
      introduction: "Bring repair, replacement and commercial campaign decisions into one reviewable process. Managed Ads BOTS prepare recommendations against your approved account goals.",
      decisions: [
        { title: "Match search intent to the campaign.", body: "Review do-it-yourself, product and employment terms against the intended roofing offer. Keep homeowner and commercial buyer context distinct." },
        { title: "Review locations before expanding spend.", body: "Confirm assessment coverage and available capacity. Account, budget and geographic changes stay approval-gated." },
        { title: "Understand the estimate handoff.", body: "Review conversion tracking alongside available enquiry and estimate records. A form submission alone does not confirm a qualified roofing project." },
      ],
      example: { title: "Replacement targeting review", context: "Illustrative roofing PPC review", draft: "Review search terms for roof materials against the replacement campaign. Prepare recommended exclusions and a conversion-tracking check for the account owner." },
    },
  },
  {
    slug: "remodeling", name: "Remodeling", audience: "remodeling contractors",
    introduction: "Build a marketing process around the projects you want to take on. Managed BOTS connect service content, paid search and consultation follow-up for your remodeling business.",
    projectTypes: ["Kitchen remodeling", "Bathroom remodeling", "Home additions", "Whole-home projects"],
    qualification: "Capture the project type, property location, timing and budget context the owner chooses to share. Prepare a useful consultation brief for your team.",
    followUp: "Keep design questions, consultations and open proposals moving through an agreed process. Scope changes and commercial commitments require your team's decision.",
    seo: {
      heading: "Help remodeling buyers understand your approach.",
      introduction: "Buyers need to evaluate project fit before booking a consultation. We connect SEO research with content about your actual services, process and approved project experience.",
      decisions: [
        { title: "Give each project category a clear path.", body: "Review kitchen, bathroom, addition and whole-home pages according to the work you offer, with useful next steps for each." },
        { title: "Answer consultation questions early.", body: "Explain the information needed to assess a project and the stages of your process. Use the consultation to establish a realistic scope, budget and timeline." },
        { title: "Build from authentic project knowledge.", body: "Use approved portfolios and team expertise where available. Technical and commercial claims receive review before publishing." },
      ],
      example: { title: "Consultation content brief", context: "Illustrative remodeling SEO review", draft: "Outline a kitchen-remodeling page around the consultation process, approved project examples and information needed from the homeowner. Identify the project photographs and team input needed to complete the brief." },
    },
    ppc: {
      heading: "Focus remodeling ads on the right project conversations.",
      introduction: "Evaluate paid-search activity against your project categories and consultation process. Managed Ads BOTS prepare account improvements within your agreed budget and authority.",
      decisions: [
        { title: "Separate inspiration from hiring intent.", body: "Review design ideas, product shopping and contractor searches in context. Propose changes based on the campaign's actual offer." },
        { title: "Make the landing-page promise specific.", body: "Check that a kitchen or addition campaign leads to relevant project information and a clear consultation path. Website work is separately scoped." },
        { title: "Review qualified consultations.", body: "Connect tracked enquiries with available project-fit information. Keep budget and timeline assumptions out of reported results." },
      ],
      example: { title: "Kitchen campaign review", context: "Illustrative remodeling PPC review", draft: "Compare kitchen-design inspiration searches with the campaign's consultation offer. Prepare a search-term review and landing-page brief for human approval." },
    },
  },
  {
    slug: "general-contractors", name: "General Contractor", audience: "general contractors",
    introduction: "Bring marketing and business development into a process that reflects your contracting work. We manage BOTS around your project types, buyer relationships and existing business systems.",
    projectTypes: ["Residential projects", "Commercial construction", "Renovations", "Property-owner relationships"],
    qualification: "Identify the buyer, location, project type and stage. Separate a homeowner enquiry from a commercial opportunity before deciding who should review it.",
    followUp: "Coordinate approved proposal preparation and relationship follow-up. Commercial account research can be scoped separately from marketing to homeowners.",
    seo: {
      heading: "Make your contracting capabilities clear to the right buyer.",
      introduction: "Your website needs to explain which projects fit and how an engagement begins. We connect technical SEO and content priorities around those real capabilities.",
      decisions: [
        { title: "Define the projects you want to be found for.", body: "Review how residential, commercial and renovation capabilities are organized. Avoid broad claims that obscure the actual work you perform." },
        { title: "Support a serious evaluation.", body: "Prepare content on your process, qualification requirements and approved experience. Request missing evidence before publishing credentials or project claims." },
        { title: "Connect the right local destinations.", body: "Keep service-area pages specific to genuine project coverage and buyer questions. Link them to the relevant capability and enquiry path." },
      ],
      example: { title: "Capability page brief", context: "Illustrative contractor SEO review", draft: "Prepare a commercial-renovation page outline with buyer questions, engagement steps and a request for approved experience. Route scope and qualification claims for review." },
    },
    ppc: {
      heading: "Build contractor campaigns around a defined project brief.",
      introduction: "A commercial bid opportunity and a residential enquiry should not be evaluated as the same outcome. We organize Google Ads review around your approved offer and qualification process.",
      decisions: [
        { title: "Choose a buyer and project category.", body: "Make each campaign's intended audience explicit. Separate employment, subcontractor and unrelated service searches from the work being advertised." },
        { title: "Keep geography tied to delivery.", body: "Confirm project territory and assessment requirements before proposing location changes. Your team retains authority over spend." },
        { title: "Review the sales handoff.", body: "Evaluate tracked enquiries using available project context. Commercial prospecting is a separate workflow with its own qualification and outreach controls." },
      ],
      example: { title: "Project-fit campaign review", context: "Illustrative general contractor PPC review", draft: "Review employment and subcontractor enquiries separately from property-owner project requests. Prepare account recommendations with the intended buyer and approval owner recorded." },
    },
  },
];

export const INDUSTRY_CHANNELS = ["seo", "ppc"] as const;
export const getIndustry = (slug: string) => INDUSTRIES.find(industry => industry.slug === slug);
export const isIndustryChannel = (value: string): value is IndustryChannel => value === "seo" || value === "ppc";
export const industryServiceSlug = (channel: IndustryChannel) => channel === "seo" ? "agentic-seo" : "agentic-ppc-management";
export const industryChannelName = (channel: IndustryChannel) => channel === "seo" ? "SEO" : "PPC management";

export function industryExamples(industry: Industry): ServiceExperience["examples"] {
  return [industry.seo.example, industry.ppc.example, { title: "Enquiry qualification", context: `Illustrative ${industry.name.toLowerCase()} workflow`, draft: industry.qualification }];
}
