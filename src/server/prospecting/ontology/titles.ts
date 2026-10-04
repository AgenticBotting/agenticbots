import type { RoleFamily, Seniority } from "@/lib/prospecting/types";

/**
 * Title normalization and role families.
 *
 * Titles vary endlessly ("Dir. of Facilities", "VP Facilities", "Facilities
 * Mgr"). We never match on exact strings: a title is expanded, lowercased,
 * then mapped to ONE role family and a seniority. Buyer types and niche
 * relationships speak in role families, so "Director of Engineering" at a
 * hospital and "Chief Engineer" at a hotel both answer "engineering_maintenance".
 */

const ABBREVIATIONS: [RegExp, string][] = [
  [/\bsr\.?\b/g, "senior"],
  [/\bjr\.?\b/g, "junior"],
  [/\bvp\b/g, "vice president"],
  [/\bsvp\b/g, "senior vice president"],
  [/\bevp\b/g, "executive vice president"],
  [/\bavp\b/g, "assistant vice president"],
  [/\bdir\.?\b/g, "director"],
  [/\bmgr\.?\b/g, "manager"],
  [/\bmgmt\b/g, "management"],
  [/\bops\b/g, "operations"],
  [/\bfac\.?\b/g, "facilities"],
  [/\bpm\b/g, "project manager"],
  [/\bgm\b/g, "general manager"],
  [/\bcoo\b/g, "chief operating officer"],
  [/\bceo\b/g, "chief executive officer"],
  [/\bcfo\b/g, "chief financial officer"],
  [/\behs\b/g, "environmental health and safety"],
  [/\bcdd\b/g, "community development district"],
  [/\bpres\.?\b/g, "president"],
  [/\bengr?\b/g, "engineer"],
];

export function normalizeTitle(raw: string): string {
  let t = ` ${raw.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9/ ]+/g, " ")} `;
  for (const [re, rep] of ABBREVIATIONS) t = t.replace(re, rep);
  return t.replace(/\s+/g, " ").trim();
}

/**
 * Ordered: the first family whose pattern matches wins. Patterns match on
 * word STARTS ("facilit" matches facilities/facility), so they deliberately
 * have no trailing word boundary unless a whole word is required.
 */
const FAMILY_RULES: [RoleFamily, RegExp][] = [
  ["community_board", /\b(board (president|member)|treasurer|managing agent)/],
  ["homeowner", /\b(homeowner|tenant\b|landlord|adult child|estate manager|captain\b)/],
  ["safety_ehs", /\b(environmental health and safety|safety director|quality\/safety|infection prevention)/],
  ["procurement", /\b(procurement|purchasing|contracting officer|vendor manager|buyer\b)/],
  ["public_works", /\b(public works|parks director|city manager|chief building official|district manager|field manager|logistics manager)/],
  ["engineering_maintenance", /\b(engineer|maintenance|critical environment|superintendent|dockmaster|fixed operations)/],
  ["facilities", /\b(facilit|plant manager|building manager|campus director|terminal manager|marina manager)/],
  ["asset_management", /\b(asset manag|portfolio manag|real estate manag|investor\b)/],
  ["property_management", /\b(property (manag|director|operations)|community manager|center manager|park manager|resort manager|regional property)/],
  ["construction_project", /\b(project (manag|executive|director|architect|engineer)|construction director|director of construction|capital projects|development (director|manag))/],
  ["estimating_preconstruction", /\b(estimator|preconstruction)/],
  ["design_principal", /\b(principal|architect|designer|partner\b|managing attorney)/],
  ["clinical_admin", /\b(administrator|practice manager|pharmacy manager|claims manager|adjuster)/],
  ["education_admin", /\b(head of school|business manager|business administrator|pastor)/],
  ["finance_admin", /\b(chief financial officer|controller|finance|bookkeep|office manager)/],
  ["sales_marketing", /\b(sales|marketing|producer\b|membership|loan officer|agent\b|broker\b|team lead)/],
  ["operations", /\b(operations|fleet manager|store manager|branch manager|regional (manager|director))/],
  ["general_management", /\b(general manager|executive director|director\b|chief\b|division president)/],
  ["owner_executive", /\b(owner|president|founder|chief executive officer|franchisee|managing director)/],
];

const SENIORITY_RULES: [Seniority, RegExp][] = [
  ["owner_c_level", /\b(owner|founder|chief|president|partner|principal|board president|executive director)\b/],
  ["vp", /\bvice president\b/],
  ["director", /\b(director|head of|superintendent)\b/],
  ["manager", /\b(manager|supervisor|administrator|lead|officer)\b/],
];

export function roleFamilyOf(rawTitle: string): RoleFamily {
  const t = normalizeTitle(rawTitle);
  // "Facilities Director" must be facilities, not general management.
  for (const [fam, re] of FAMILY_RULES) if (re.test(t)) return fam;
  return "other";
}

export function seniorityOf(rawTitle: string): Seniority {
  const t = normalizeTitle(rawTitle);
  // "Vice President" contains "president": check VP first.
  if (/\bvice president\b/.test(t)) return "vp";
  for (const [s, re] of SENIORITY_RULES) if (re.test(t)) return s;
  return t ? "individual" : "unknown";
}

/** Families that commonly overlap — used for soft matching. */
const RELATED: Partial<Record<RoleFamily, RoleFamily[]>> = {
  facilities: ["engineering_maintenance", "property_management", "operations"],
  engineering_maintenance: ["facilities", "operations"],
  property_management: ["facilities", "asset_management", "general_management"],
  asset_management: ["property_management", "owner_executive"],
  operations: ["facilities", "general_management"],
  general_management: ["operations", "owner_executive"],
  owner_executive: ["general_management"],
  construction_project: ["estimating_preconstruction", "design_principal"],
  estimating_preconstruction: ["construction_project"],
  public_works: ["facilities", "procurement"],
  procurement: ["public_works", "finance_admin"],
};

/**
 * How well a person's title answers the role families a buyer type
 * needs: 1 exact family, 0.6 related family, 0 otherwise.
 */
export function titleMatch(rawTitle: string, wanted: RoleFamily[]): number {
  const fam = roleFamilyOf(rawTitle);
  if (wanted.includes(fam)) return 1;
  if (wanted.some((w) => RELATED[w]?.includes(fam))) return 0.6;
  return 0;
}
