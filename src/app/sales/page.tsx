import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PillarPage } from "@/components/marketing";
import { getPillar } from "@/lib/catalog";

const pillar = getPillar("sales");

export const metadata: Metadata = {
  title: pillar?.headline,
  description: pillar?.intro,
  alternates: { canonical: "/sales" },
};

export default function Page() {
  if (!pillar) notFound();
  return <PillarPage pillar={pillar} />;
}
