import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import { Container } from "@/components/ui";
import { ArrowRight } from "lucide-react";
import { JsonLd, breadcrumbLd, serviceLd, faqLd } from "@/components/JsonLd";
import { IndustryHero, IndustryPlan, IndustryOperations, IndustryFaq, IndustryLinks, industryFaqs } from "@/components/marketing/IndustryExperience";
import { MarketTools } from "@/components/marketing/MarketExperience";
import { ServiceDelivery, ServiceAudit } from "@/components/marketing/ServiceExperience";
import { INDUSTRIES, getIndustry } from "@/lib/industries";
import { agenticSearchTitle } from "@/lib/search-positioning";
import { searchRobots } from "@/lib/search-publication";
import { IndustryBuyerSection } from "@/components/marketing/NicheExperience";

type Params = { params: Promise<{ industry: string }> };
export function generateStaticParams() { return INDUSTRIES.map(industry => ({ industry: industry.slug })); }
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { industry: slug } = await params;
  const industry = getIndustry(slug);
  if (!industry) return {};
  const path = `/industries/${industry.slug}`;
  return { title: { absolute: agenticSearchTitle("marketing", industry.audience) }, description: `Marketing for ${industry.audience}: SEO, PPC and connected follow-up through managed AI BOTS. Clear scope and human approval. Request a proposal.`, alternates: { canonical: path }, robots: searchRobots(path) };
}

export default async function IndustryPage({ params }: Params) {
  const { industry: slug } = await params;
  const industry = getIndustry(slug);
  if (!industry) notFound();
  const path = `/industries/${industry.slug}`;
  return <><JsonLd data={[serviceLd({ name: `${industry.name} marketing services`, description: industry.introduction, path, areaServed: "United States", serviceType: `${industry.name} marketing` }), breadcrumbLd([{ name: "Home", path: "/" }, { name: "Industries", path: "/industries" }, { name: `${industry.name} marketing`, path }]), faqLd(industryFaqs(industry))]} /><Header />
    <main className="service-experience">
      <IndustryHero industry={industry} /><IndustryBuyerSection industry={industry.slug} /><IndustryPlan industry={industry} /><IndustryOperations industry={industry} /><MarketTools /><ServiceDelivery /><IndustryFaq industry={industry} />
      <ServiceAudit source={`industry-${industry.slug}`} focus={`${industry.name} marketing`} />
      <section className="sx-section"><Container><div className="sx-scope-layout"><div className="sx-section-copy"><p className="sx-kicker">National delivery · Your service area</p><h2>Built for the places<br /><span>you do business.</span></h2><p>Your approved scope defines the locations you serve, the tools we connect and the work your team reviews. We manage the service remotely.</p></div><div><Link href="/markets" className="btn btn-outline">Explore local marketing services<ArrowRight size={16} /></Link></div></div></Container></section>
      <IndustryLinks />
    </main><Footer /></>;
}
