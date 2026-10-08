import type { Metadata } from "next";
import { JsonLd, breadcrumbLd } from "@/components/JsonLd";
import { ServicePortfolio } from "@/components/marketing/ServicePortfolio";

export const metadata: Metadata = {
  title: "Managed BOT services for established contractors",
  description: "Explore managed AI BOTS for marketing, sales follow-up and customer operations. Built around your existing systems. Request a proposal.",
  alternates: { canonical: "/services" },
};

export default function ServicesIndex() {
  return <><JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }])} /><ServicePortfolio /></>;
}
