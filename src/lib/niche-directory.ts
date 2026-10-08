import type { PublicBuyer } from "./public-niche-types";
import { agenticSearchTitle } from "./search-positioning";

export type NicheDirectoryEntry = { slug: string; name: string; category: string; buyers: string[] };
export type BuyerDirectoryEntry = Pick<PublicBuyer, "slug" | "name" | "segment" | "roles">;
export const nicheAudience = (name: string) => name.replace(/\b[A-Z][a-z]+\b/g, word => word.toLowerCase());
export const nicheTitle = (name: string) => agenticSearchTitle("marketing", nicheAudience(name));
export const nicheDescription = (name: string) => `${name} marketing: buyer roles, qualification and managed BOT workflows. Define your SEO, PPC or sales approach with a $499 audit.`;

export function filterNicheDirectory(entries: NicheDirectoryEntry[], query: string, category: string, buyer: string) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return entries.filter(entry => (!category || entry.category === category) && (!buyer || entry.buyers.includes(buyer)) && words.every(word => `${entry.name} ${entry.category}`.toLowerCase().includes(word)));
}
