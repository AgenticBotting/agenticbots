import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container } from "@/components/ui";
import { JsonLd, breadcrumbLd } from "@/components/JsonLd";
import { ServiceAudit, ServiceAuditLink, ServiceDelivery } from "@/components/marketing/ServiceExperience";
import { INDUSTRIES } from "@/lib/industries";
import { searchRobots } from "@/lib/search-publication";
import "@/components/marketing/industry-experience.css";

export const metadata: Metadata = {
  title: "Marketing for the Trades | Contractor Industries",
  description: "SEO, PPC and managed AI BOT workflows for HVAC, plumbing, electrical, roofing, remodeling and general contractors. Explore the approach for your trade.",
  alternates: { canonical: "/industries" }, robots: searchRobots("/industries"),
};

export default function IndustriesPage() {
  return <><JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Industries", path: "/industries" }])} /><Header />
    <main className="service-experience">
      <section className="sx-hero"><Container><nav className="sx-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span aria-current="page">Industries</span></nav><div className="sx-hero-intro"><div className="sx-hero-copy">
        <p className="sx-kicker">Marketing for established contractors</p><h1>Your trade.<br /><span>A connected growth process.</span></h1>
        <p className="sx-lead">SEO, paid advertising and follow-up work best when the plan reflects the business. Explore managed AI BOT workflows built around the services you deliver.</p>
        <div className="sx-actions"><ServiceAuditLink /><a href="#industries" className="btn btn-outline">Find your trade<ArrowRight size={16} /></a></div>
      </div></div></Container></section>
      <section className="sx-section" id="industries"><Container><div className="ix-directory">{INDUSTRIES.map(industry => <article key={industry.slug}>
        <p className="sx-kicker">{industry.projectTypes.slice(0, 2).join(" · ")}</p><h2>{industry.name} marketing</h2><p>{industry.introduction}</p>
        <Link href={`/industries/${industry.slug}`} className="sx-text-link">Explore the approach<ArrowRight size={16} /></Link>
        <div className="ix-directory-links"><Link href={`/industries/${industry.slug}/seo`}>{industry.name} SEO</Link><Link href={`/industries/${industry.slug}/ppc`}>{industry.name} PPC management</Link></div>
      </article>)}</div></Container></section>
      <ServiceDelivery /><ServiceAudit source="industries-directory" focus="marketing for your trade" />
    </main><Footer /></>;
}
