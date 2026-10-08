export type LocalSearchBrief = {
  headline: string;
  planning: string;
  seo: string;
  ppc: string;
  review: string;
  source?: { label: string; url: string; observation: string; checked: string };
};

/** Editorial planning recommendations, not claims about client performance or demand. */
export const LOCAL_SEARCH_BRIEFS: Record<string, LocalSearchBrief> = {
  "florida/miami": {
    headline: "Separate the customer journeys inside your Miami service area.",
    planning: "A homeowner requesting a repair and a commercial buyer evaluating a contractor need different information. Start with your actual job mix, then confirm which parts of Miami and the surrounding area belong in the plan.",
    seo: "Give residential and commercial services clear page destinations. For coverage around Brickell, Doral or Coral Gables, use real service information and approved project knowledge. Review whether your team can support additional languages before proposing translated content.",
    ppc: "Review Miami campaign locations alongside the addresses your team can serve. Separate homeowner enquiries from commercial project intent, and check whether the language of the ad, landing page and follow-up matches the support your business actually provides.",
    review: "Bring a service-area list, your residential/commercial split and examples of recent enquiries. We use those inputs to define campaign and content priorities.",
    source: { label: "Miami-Dade procurement resources", url: "https://www.miamidade.gov/global/strategic-procurement/home.page", observation: "Miami-Dade publishes separate vendor and procurement resources. A public-sector opportunity has its own buying process; it is not interchangeable with a homeowner enquiry.", checked: "2026-10-08" },
  },
  "florida/fort-lauderdale": {
    headline: "Define Fort Lauderdale coverage before broadening the offer.",
    planning: "Clarify which property types and projects your business supports across Fort Lauderdale and Broward. If your work includes commercial properties or marine-related facilities, give those buyers a path that reflects their assessment and procurement needs.",
    seo: "Organize the site around the services you actually offer and the evidence your team can provide. Pages for Las Olas, Cypress Creek or surrounding locations should explain service coverage, relevant project experience and how to arrange an assessment.",
    ppc: "Review the campaign's property and project context before changing bids or targeting. Separate broad searches for products or marine equipment from requests for your specific trade service when those terms appear in the account.",
    review: "Bring your accepted property types, coverage boundaries and estimate process. Confirm any specialist commercial work before it appears in advertising or service content.",
  },
  "arizona/phoenix": {
    headline: "Connect Phoenix marketing with your operating capacity.",
    planning: "Build the plan around the services your team can deliver, the locations it can cover and the availability confirmed by your operation. Review seasonal messaging against your own job history and campaign records.",
    seo: "Separate repair, replacement and maintenance information where those services are offered. Use approved technical expertise and current business details. Service-area content for Phoenix and surrounding cities should clearly explain coverage, supported services and the booking process.",
    ppc: "Review location targets, campaign schedules and the service being advertised against your dispatch plan. For HVAC campaigns, keep repair and replacement intent distinct and route proposed seasonal changes to the account owner before execution.",
    review: "Bring dispatch coverage, advertised hours and prior campaign or enquiry records. We use them to check whether messaging and capacity are aligned.",
    source: { label: "City of Phoenix heat resources", url: "https://www.phoenix.gov/administration/departments/heat.html", observation: "Phoenix maintains an Office of Heat Response and Mitigation. Heat is relevant planning context; actual campaign demand and staffing decisions still require your business records.", checked: "2026-10-08" },
  },
  "texas/dallas": {
    headline: "Be precise about the Dallas projects and locations you serve.",
    planning: "Decide whether the engagement covers Dallas, selected surrounding cities or a wider operating territory. Separate residential service requests from commercial projects before setting the campaign, content and follow-up priorities.",
    seo: "Review how each service links to the places your team can support. A Dallas capability page should help a buyer understand project fit and the assessment process; broader coverage belongs on useful, accurately scoped service-area pages.",
    ppc: "Compare account location settings with approved service boundaries. Review queries for commercial project intent separately from homeowner repairs and equipment searches, using actual search-term data before proposing exclusions.",
    review: "Bring your service territory, project categories and the fields your estimator needs. We check whether the website and campaign handoff collect that context.",
  },
  "georgia/atlanta": {
    headline: "Make the service boundary part of the Atlanta enquiry process.",
    planning: "Define the Atlanta locations and project types your team wants to serve. Confirm travel, assessment requirements and routing with your operation so each enquiry reaches the team equipped to evaluate it.",
    seo: "Use Midtown, Buckhead and other coverage references only where they reflect real service delivery. Connect those pages to a specific service, useful project information and a clear estimate process.",
    ppc: "Review targeted locations with the person responsible for dispatch or project assessment. Check whether conversion records contain enough location and project information to distinguish a useful enquiry from an out-of-scope request.",
    review: "Bring coverage boundaries, assessment requirements and examples of accepted and declined enquiries. Those inputs help define the routing and campaign review rules.",
  },
  "north-carolina/charlotte": {
    headline: "Connect Charlotte visibility to a well-qualified next step.",
    planning: "Distinguish existing-property service from renovation or construction enquiries. Define which parts of Charlotte and the surrounding territory belong in your scope, then agree how each type of buyer reaches the right person.",
    seo: "Review service content around the actual questions asked before an assessment. References to Uptown, South End or Ballantyne should support accurate coverage and project context. Use your project experience and enquiry records to establish content priorities.",
    ppc: "Separate service, installation and project enquiries where the offer requires it. Review geographic targeting and landing-page promises against your approved coverage, including any cross-state territory only when your team confirms it.",
    review: "Bring supported project types, territory boundaries and your consultation steps. We identify the content and campaign decisions that depend on those inputs.",
  },
};

export const STATE_SEARCH_BRIEFS: Record<string, string> = {
  florida: "Plan Florida coverage by the markets your team can actually serve. Keep South Florida, Central Florida and other operating areas distinct where the offer, customer support or routing differs. Your service history and operating capacity determine the campaign priorities and coverage.",
  arizona: "Define your Arizona coverage before treating the state as one campaign. Phoenix, Tucson and other service areas may have different teams, schedules and project priorities. Use your own enquiry history to decide where a shared workflow works and where local routing is needed.",
  texas: "Make each Texas operating area explicit. Dallas, Houston, Austin and San Antonio belong in a single deployment only if they are actually in scope. Keep location ownership, service availability and lead routing visible as the system expands.",
  georgia: "Start with the Georgia locations your business serves, then separate services and project types within that territory. An Atlanta enquiry and work elsewhere in the state should follow the routing and assessment rules your operation approves.",
  "north-carolina": "Map North Carolina coverage to the people who deliver and assess the work. Charlotte, the Triangle and other operating areas need accurate service information and routing. Confirm any cross-state coverage separately before it appears in campaigns or public content.",
};

export const getLocalSearchBrief = (state: string, city: string) => LOCAL_SEARCH_BRIEFS[`${state}/${city}`];
