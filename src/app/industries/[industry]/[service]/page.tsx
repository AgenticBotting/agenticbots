import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import { Container } from "@/components/ui";
import { ArrowRight } from "lucide-react";
import { JsonLd, breadcrumbLd, serviceLd, faqLd } from "@/components/JsonLd";
import { IndustryServiceBrief, IndustryOperations, IndustryFaq, industryFaqs } from "@/components/marketing/IndustryExperience";
import { ServiceHero, ServiceScope, ServiceConnections, ServiceDelivery, ServiceAudit } from "@/components/marketing/ServiceExperience";
import { INDUSTRIES, INDUSTRY_CHANNELS, getIndustry, isIndustryChannel, industryServiceSlug, industryChannelName } from "@/lib/industries";
import { getService } from "@/lib/catalog";
import { agenticSearchTitle, agenticServiceLabel } from "@/lib/search-positioning";
import { searchRobots } from "@/lib/search-publication";

type Params = { params: Promise<{ industry: string; service: string }> };
export function generateStaticParams() { return INDUSTRIES.flatMap(industry => INDUSTRY_CHANNELS.map(service => ({ industry: industry.slug, service }))); }
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { industry: slug, service } = await params;
  const industry = getIndustry(slug);
  if (!industry || !isIndustryChannel(service)) return {};
  const name = industryChannelName(service);
  const path = `/industries/${industry.slug}/${service}`;
  return { title: { absolute: agenticSearchTitle(name, industry.audience) }, description: `${name} for ${industry.audience}. A focused marketing plan, managed AI BOTS and your approval before changes. Start with a $499 workflow audit.`, alternates: { canonical: path }, robots: searchRobots(path) };
}

export default async function IndustryServicePage({ params }: Params) {
  const { industry: slug, service } = await params;
  const industry = getIndustry(slug);
  if (!industry || !isIndustryChannel(service)) notFound();
  const svc = getService(industryServiceSlug(service));
  if (!svc) notFound();
  const brief = industry[service];
  const name = industryChannelName(service);
  const path = `/industries/${industry.slug}/${service}`;
  const sibling = service === "seo" ? "ppc" : "seo";
  const examples = [brief.example, { title: "Planning inputs", context: `Illustrative ${industry.name.toLowerCase()} ${name} brief`, draft: brief.decisions[1].body }, { title: "Approval handoff", context: "Illustrative review step", draft: "Prepare the recommendation with its source context and proposed next step. Your team reviews the scope and approves any publishing or account change before it happens." }];
  return <><JsonLd data={[serviceLd({ name: `${industry.name} ${name}`, description: brief.introduction, path, areaServed: "United States", serviceType: name }), breadcrumbLd([{ name: "Home", path: "/" }, { name: "Industries", path: "/industries" }, { name: industry.name, path: `/industries/${industry.slug}` }, { name, path }]), faqLd(industryFaqs(industry, service))]} /><Header />
    <main className="service-experience">
      <ServiceHero svc={svc} editorial={{ heading: agenticServiceLabel(name), accent: `for ${industry.audience}.`, introduction: brief.introduction, examples }} breadcrumb={<><Link href="/">Home</Link><span>/</span><Link href="/industries">Industries</Link><span>/</span><Link href={`/industries/${industry.slug}`}>{industry.name}</Link><span>/</span><span aria-current="page">{name}</span></>} />
      <IndustryServiceBrief industry={industry} channel={service} /><ServiceScope svc={svc} /><IndustryOperations industry={industry} /><ServiceConnections svc={svc} /><ServiceDelivery /><IndustryFaq industry={industry} channel={service} />
      <ServiceAudit source={`industry-${industry.slug}-${service}`} focus={`${industry.name} ${name}`} />
      <section className="sx-section sx-related"><Container><div className="sx-section-copy"><p className="sx-kicker">Continue exploring</p><h2>The next part<br /><span>of your marketing plan.</span></h2></div><div className="sx-related-grid">
        <Link href={`/industries/${industry.slug}`}><span><strong>{industry.name} marketing</strong><p>The full approach for your trade.</p></span><ArrowRight /></Link>
        <Link href={`/industries/${industry.slug}/${sibling}`}><span><strong>{industry.name} {industryChannelName(sibling)}</strong><p>Explore the complementary service.</p></span><ArrowRight /></Link>
        <Link href={`/services/${svc.serviceSlug}`}><span><strong>{name} services</strong><p>Scope, delivery and local coverage.</p></span><ArrowRight /></Link>
      </div></Container></section>
    </main><Footer /></>;
}
