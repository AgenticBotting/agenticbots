export type PlatformId =
  | "activecampaign"
  | "ahrefs"
  | "apollo"
  | "clay"
  | "docusign"
  | "facebook"
  | "gmail"
  | "google-ads"
  | "google-analytics"
  | "google-business"
  | "google-calendar"
  | "google-drive"
  | "hotjar"
  | "hubspot"
  | "jobber"
  | "klaviyo"
  | "linkedin"
  | "looker"
  | "mailchimp"
  | "meta"
  | "microsoft-outlook"
  | "notion"
  | "pandadoc"
  | "pipedrive"
  | "power-bi"
  | "procore"
  | "salesforce"
  | "semrush"
  | "servicetitan"
  | "slack"
  | "tableau"
  | "webflow"
  | "wordpress"
  | "yelp"
  | "youtube"
  | "zoho"
  | "zoominfo";

export type PlatformReference = {
  id: PlatformId;
  name: string;
  mark: string;
};

export const PLATFORMS: Record<PlatformId, PlatformReference> = {
  activecampaign: { id: "activecampaign", name: "ActiveCampaign", mark: "AC" },
  ahrefs: { id: "ahrefs", name: "Ahrefs", mark: "A" },
  apollo: { id: "apollo", name: "Apollo", mark: "AP" },
  clay: { id: "clay", name: "Clay", mark: "C" },
  docusign: { id: "docusign", name: "DocuSign", mark: "DS" },
  facebook: { id: "facebook", name: "Facebook", mark: "f" },
  gmail: { id: "gmail", name: "Gmail", mark: "G" },
  "google-ads": { id: "google-ads", name: "Google Ads", mark: "GA" },
  "google-analytics": { id: "google-analytics", name: "Google Analytics", mark: "G4" },
  "google-business": { id: "google-business", name: "Google Business Profile", mark: "G" },
  "google-calendar": { id: "google-calendar", name: "Google Calendar", mark: "31" },
  "google-drive": { id: "google-drive", name: "Google Drive", mark: "GD" },
  hotjar: { id: "hotjar", name: "Hotjar", mark: "H" },
  hubspot: { id: "hubspot", name: "HubSpot", mark: "HS" },
  jobber: { id: "jobber", name: "Jobber", mark: "J" },
  klaviyo: { id: "klaviyo", name: "Klaviyo", mark: "K" },
  linkedin: { id: "linkedin", name: "LinkedIn", mark: "in" },
  looker: { id: "looker", name: "Looker", mark: "L" },
  mailchimp: { id: "mailchimp", name: "Mailchimp", mark: "MC" },
  meta: { id: "meta", name: "Meta", mark: "M" },
  "microsoft-outlook": { id: "microsoft-outlook", name: "Microsoft Outlook", mark: "O" },
  notion: { id: "notion", name: "Notion", mark: "N" },
  pandadoc: { id: "pandadoc", name: "PandaDoc", mark: "PD" },
  pipedrive: { id: "pipedrive", name: "Pipedrive", mark: "P" },
  "power-bi": { id: "power-bi", name: "Power BI", mark: "BI" },
  procore: { id: "procore", name: "Procore", mark: "PC" },
  salesforce: { id: "salesforce", name: "Salesforce", mark: "SF" },
  semrush: { id: "semrush", name: "Semrush", mark: "S" },
  servicetitan: { id: "servicetitan", name: "ServiceTitan", mark: "ST" },
  slack: { id: "slack", name: "Slack", mark: "S" },
  tableau: { id: "tableau", name: "Tableau", mark: "T" },
  webflow: { id: "webflow", name: "Webflow", mark: "W" },
  wordpress: { id: "wordpress", name: "WordPress", mark: "W" },
  yelp: { id: "yelp", name: "Yelp", mark: "Y" },
  youtube: { id: "youtube", name: "YouTube", mark: "YT" },
  zoho: { id: "zoho", name: "Zoho", mark: "Z" },
  zoominfo: { id: "zoominfo", name: "ZoomInfo", mark: "ZI" },
};

export const SERVICE_PLATFORM_IDS: Record<string, readonly PlatformId[]> = {
  "paid-media": ["google-ads", "meta", "youtube", "linkedin", "hubspot", "google-analytics"],
  seo: ["google-business", "ahrefs", "semrush", "wordpress", "google-analytics", "google-ads"],
  content: ["wordpress", "webflow", "notion", "google-drive", "slack", "hubspot"],
  email: ["hubspot", "salesforce", "mailchimp", "klaviyo", "activecampaign", "servicetitan"],
  cro: ["google-analytics", "hotjar", "hubspot", "wordpress", "webflow", "salesforce"],
  analytics: ["google-analytics", "looker", "tableau", "power-bi", "hubspot", "salesforce"],
  "lead-generation": ["linkedin", "hubspot", "salesforce", "apollo", "clay", "zoominfo"],
  outbound: ["salesforce", "hubspot", "gmail", "microsoft-outlook", "slack", "linkedin"],
  inbound: ["servicetitan", "jobber", "hubspot", "salesforce", "google-calendar", "slack"],
  crm: ["salesforce", "hubspot", "servicetitan", "jobber", "pipedrive", "zoho"],
  enablement: ["salesforce", "hubspot", "docusign", "pandadoc", "procore", "servicetitan"],
  reviews: ["google-business", "facebook", "yelp", "servicetitan", "jobber", "hubspot"],
  reactivation: ["hubspot", "salesforce", "mailchimp", "klaviyo", "servicetitan", "jobber"],
};

const PORTFOLIO_PLATFORM_IDS: readonly PlatformId[] = [
  "hubspot",
  "salesforce",
  "servicetitan",
  "jobber",
  "google-ads",
  "slack",
];

export function getServicePlatforms(slug?: string): PlatformReference[] {
  const ids = slug ? SERVICE_PLATFORM_IDS[slug] ?? PORTFOLIO_PLATFORM_IDS : PORTFOLIO_PLATFORM_IDS;
  return ids.map((id) => PLATFORMS[id]);
}
