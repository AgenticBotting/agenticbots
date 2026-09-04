import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PillarPage } from "@/components/marketing";
import { getPillar } from "@/lib/catalog";

const pillar = getPillar("marketing");

export const metadata: Metadata = {
  title: pillar?.headline,
  description: `${pillar?.headline} ${pillar?.menuBlurb}`,
  alternates: { canonical: "/marketing" },
};

export default function Page() {
  if (!pillar) notFound();
  return <PillarPage pillar={pillar} />;
}
