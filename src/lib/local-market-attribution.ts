import routes from "@/data/public-market-routes.json";
import nicheRoutes from "@/data/public-niche-routes.json";

const states: Readonly<Record<string, readonly string[]>> = routes.states;
const industries = new Set<string>(routes.industries);
const services = new Set<string>(routes.services);
const niches = new Set(nicheRoutes.map(path => path.split("/").at(-1)));

/** A compact public-slug allowlist; no buyer catalog, business data or arbitrary paths enter analytics. */
export function localMarketAttribution(path: string): Record<string, string> | undefined {
  if (path.length > 300 || !/^\/markets\/[a-z0-9/-]+$/.test(path)) return;
  const [, , state, ...tail] = path.split("/");
  if (!Object.hasOwn(states, state)) return;
  let city: string | undefined;
  if (tail[0] !== "industries") {
    city = tail.shift();
    if (!city || !states[state].includes(city)) return;
  }
  if (tail.shift() !== "industries") return;
  const base = { page: path, page_family: "markets", state, ...(city ? { city } : {}) };
  if (!tail.length) return base;
  const kind = tail[0] === "niches" ? "niche" : "industry";
  if (kind === "niche") tail.shift();
  const subject = tail.shift();
  if (!subject || !(kind === "niche" ? niches : industries).has(subject)) return;
  const service = tail.shift();
  if ((service !== undefined && !services.has(service)) || tail.length) return;
  return { ...base, [kind]: subject, ...(service ? { service } : {}) };
}
