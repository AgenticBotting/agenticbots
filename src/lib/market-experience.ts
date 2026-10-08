/** Public navigation and illustrative planning content. No live client data. */
import type { DatasetCity } from "./geo/dataset";

export type MarketDestination = { name: string; href: string; detail?: string; search?: string };
export type MarketGroup = { id: string; name: string; items: MarketDestination[]; searchItems?: MarketDestination[] };

export function metroLabel(name: string): string {
  return `${name.trim().replace(/(?:\s+metro)+$/i, "")} metro`;
}

/** One grouping contract for general and service-specific state directories. */
export function cityMarketGroups(cities: DatasetCity[], href: (city: DatasetCity) => string): MarketGroup[] {
  const groups = new Map<string, MarketGroup>();
  for (const city of cities) {
    if (!groups.has(city.metro_slug)) groups.set(city.metro_slug, { id: city.metro_slug, name: metroLabel(city.metro), items: [] });
    groups.get(city.metro_slug)!.items.push({ name: city.city, href: href(city), search: `${city.state} ${city.state_abbr}` });
  }
  return [...groups.values()];
}

export const MARKET_PRIORITIES = [
  { id: "demand", label: "Build demand", title: "Be found by the customers you want.", description: "Connect search, advertising, content and prospecting around the services and areas you want to grow.", task: "Local campaign brief", input: "Services, audience and priority locations", output: "A focused campaign brief for review", control: "Your team approves targeting, publishing and account changes.", slugs: ["paid-media", "seo", "reviews", "content", "lead-generation", "outbound"] },
  { id: "sales", label: "Move sales forward", title: "Give every opportunity a next step.", description: "Bring enquiries, follow-up and proposals into a clear process so your team can act with the right context.", task: "Enquiry follow-up", input: "Customer request, service fit and ownership", output: "A response and next step prepared for review", control: "Messages, scheduling handoffs and CRM updates wait for approval.", slugs: ["inbound", "cro", "email", "enablement"] },
  { id: "customers", label: "Grow customer value", title: "Build on the relationships you have.", description: "Connect customer history, CRM quality and reporting to the next useful business decision.", task: "Customer opportunity review", input: "Service history, eligibility and consent", output: "A relevant follow-up plan for your team", control: "Eligibility and suppression checks come before approval to send.", slugs: ["reactivation", "crm", "analytics"] },
] as const;

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

/** Keep real destinations in the initial HTML; filtering never creates URLs. */
export function filterMarketGroups(groups: MarketGroup[], query: string, active = "all"): MarketGroup[] {
  const normalizedQuery = normalize(query);
  const terms = normalizedQuery.split(" ").filter(Boolean);
  const relevance = (item: MarketDestination) => {
    const name = normalize(item.name);
    return name === normalizedQuery ? 3 : name.startsWith(normalizedQuery) ? 2 : terms.every(term => name.includes(term)) ? 1 : 0;
  };
  return groups.filter(group => active === "all" || group.id === active).map(group => ({
    ...group,
    items: [...group.items, ...(terms.length ? group.searchItems ?? [] : [])].filter(item => {
      const text = normalize(`${group.name} ${item.name} ${item.detail ?? ""} ${item.search ?? ""}`);
      return terms.every(term => term.length === 2 ? text.split(" ").includes(term) : text.includes(term));
    }).sort((a, b) => terms.length ? relevance(b) - relevance(a) : 0),
  })).filter(group => group.items.length);
}
