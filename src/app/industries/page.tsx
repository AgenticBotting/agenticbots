import { HeroHeading } from "@/components/ui/HeroHeading";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container } from "@/components/ui";
import { JsonLd, breadcrumbLd } from "@/components/JsonLd";
import { ServiceAudit, ServiceAuditLink, ServiceDelivery } from "@/components/marketing/ServiceExperience";
import { INDUSTRIES } from "@/lib/industries";
import { agenticSearchTitle } from "@/lib/search-positioning";
import { searchRobots } from "@/lib/search-publication";
import { PUBLIC_NICHES, PUBLIC_BUYERS } from "@/lib/public-niches";
import { NicheDirectory } from "@/components/marketing/NicheDirectory";
import "@/components/marketing/industry-experience.css";
import "@/components/marketing/niche-experience.css";

export const metadata: Metadata = {
  title: { absolute: agenticSearchTitle("marketing", "service businesses") },
  description: "Explore 341 service niches and 137 buyer types. Build a focused SEO, PPC and managed BOT strategy around your services, customers and decision-makers.",
  alternates: { canonical: "/industries" }, robots: searchRobots("/industries"),
};

export default function IndustriesPage() {
  return <><JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Industries", path: "/industries" }])} /><Header />
    <main className="service-experience">
      <section className="sx-hero"><Container><nav className="sx-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span aria-current="page">Industries</span></nav><div className="sx-hero-intro"><div className="sx-hero-copy">
        <p className="sx-kicker">Industry intelligence · Managed marketing BOTS</p><HeroHeading text="Agentic marketing." accent="Built for your business." />
        <p className="sx-lead">Start with the work you do and the people who buy it. Explore service-specific buyer roles and marketing workflows for the trades and local service businesses.</p>
        <div className="sx-actions"><ServiceAuditLink /><a href="#niche-directory" className="btn btn-outline">Find your business<ArrowRight size={16} /></a></div>
      </div></div></Container></section>
      <section className="nd-section" id="niche-directory"><Container><div className="nd-heading"><div><p className="sx-kicker">The service & buyer catalog</p><h2>Find your niche.<br /><span>Understand the buying path.</span></h2><p>Our planning catalog connects service categories with buyer profiles. Explore the relationships to validate and the roles your marketing needs to reach.</p></div><div className="nd-stats"><span><strong>{PUBLIC_NICHES.length}</strong>Service niches</span><span><strong>{PUBLIC_BUYERS.length}</strong>Buyer types</span></div></div><NicheDirectory niches={PUBLIC_NICHES.map(niche => ({ slug: niche.slug, name: niche.name, category: niche.category, buyers: niche.buyers.map(buyer => buyer.buyer) }))} buyers={PUBLIC_BUYERS.map(buyer => ({ slug: buyer.slug, name: buyer.name, segment: buyer.segment, roles: buyer.roles }))} /></Container></section>
      <section className="sx-section" id="industries"><Container><div className="ix-directory">{INDUSTRIES.map(industry => <article key={industry.slug}>
        <p className="sx-kicker">{industry.projectTypes.slice(0, 2).join(" · ")}</p><h2>{industry.name} marketing</h2><p>{industry.introduction}</p>
        <Link href={`/industries/${industry.slug}`} className="sx-text-link">Explore the approach<ArrowRight size={16} /></Link>
        <div className="ix-directory-links"><Link href={`/industries/${industry.slug}/seo`}>{industry.name} SEO</Link><Link href={`/industries/${industry.slug}/ppc`}>{industry.name} PPC management</Link></div>
      </article>)}</div></Container></section>
      <ServiceDelivery /><ServiceAudit source="industries-directory" focus="marketing for your trade" />
    </main><Footer /></>;
}
