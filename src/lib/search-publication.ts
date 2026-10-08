import records from "@/data/search-publication.json";

export type SearchPublication = { intent: string; updated: string; basis: string };
/** Explicit per-page register. Enriching geography does not authorize new indexable URLs. */
export const SEARCH_PUBLICATION: Readonly<Record<string, SearchPublication>> = records;
export const getSearchPublication = (path: string) => Object.hasOwn(SEARCH_PUBLICATION, path) ? SEARCH_PUBLICATION[path] : undefined;
export const searchRobots = (path: string) => getSearchPublication(path) ? undefined : { index: false, follow: true };
