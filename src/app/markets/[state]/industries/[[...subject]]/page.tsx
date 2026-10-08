import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveLocalMarket } from "@/lib/local-market";
import { searchRobots } from "@/lib/search-publication";
import { LocalIndustryExperience } from "@/components/marketing/LocalIndustryExperience";

type Params = { params: Promise<{ state: string; subject?: string[] }> };
// Render representative journeys at build time; other validated destinations are cached on first visit.
export function generateStaticParams() {
  const geo = { state: "arizona" };
  return [[], ["hvac"], ["hvac", "agentic-seo"], ["niches", "commercial-hvac"], ["niches", "commercial-hvac", "agentic-ppc-management"]].map(subject => ({ ...geo, subject }));
}
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const values = await params;
  const page = resolveLocalMarket(values, values.subject);
  if (!page) return {};
  return { title: { absolute: page.title }, description: page.description, alternates: { canonical: page.path }, robots: searchRobots(page.path) };
}
export default async function LocalPage({ params }: Params) {
  const values = await params;
  const page = resolveLocalMarket(values, values.subject);
  if (!page) notFound();
  return <LocalIndustryExperience page={page} />;
}
