import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, GitBranch, ShieldCheck, Target } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container } from "@/components/ui";
import { JsonLd, breadcrumbLd, serviceLd } from "@/components/JsonLd";
import { ServiceAudit, ServiceAuditLink, ServiceDelivery } from "@/components/marketing/ServiceExperience";
import { NicheBuyerSection } from "@/components/marketing/NicheExperience";
import { NICHE_BRIEFS } from "@/lib/niche-planning";
import { PUBLIC_NICHES, getPublicNiche, nicheHref, nicheJourneys } from "@/lib/public-niches";
import { nicheAudience, nicheTitle, nicheDescription } from "@/lib/niche-directory";
import { searchRobots } from "@/lib/search-publication";
import { AUDIT_OFFER } from "@/config/marketing-offer";

type Params = { params: Promise<{ niche: string }> };
export function generateStaticParams() { return PUBLIC_NICHES.map(niche => ({ niche: niche.slug })); }
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const niche = getPublicNiche((await params).niche);
  if (!niche) return {};
  const path = nicheHref(niche.slug);
  return { title: { absolute: nicheTitle(niche.name) }, description: nicheDescription(niche.name), alternates: { canonical: path }, robots: searchRobots(path) };
}

export default async function NichePage({ params }: Params) {
  const niche = getPublicNiche((await params).niche);
  if (!niche) notFound();
  const path = nicheHref(niche.slug);
  const brief = NICHE_BRIEFS[niche.category];
  const commercial = nicheJourneys(niche.slug).some(buyer => buyer.profile.kind === "organization");
  const related = PUBLIC_NICHES.filter(item => item.category === niche.category && item.slug !== niche.slug);
  const channels = [
    { title: "Be found when the need is clear.", name: "SEO & service content", href: "/services/agentic-seo", body: `Turn your ${niche.name.toLowerCase()} expertise into useful answers, clear service pages and a qualified enquiry path.` },
    { title: "Connect search intent to the right offer.", name: "PPC management", href: "/services/agentic-ppc-management", body: "Define the jobs, territory and buyer intent worth targeting. Review the campaign brief and measurement plan before committing advertising spend." },
    ...(commercial ? [{ title: "Build a focused commercial account plan.", name: "B2B prospecting", href: "/services/agentic-lead-generation", body: "Use the buyer map to scope account research, relevant decision-making roles and evidence of service fit. Research is reviewed before any contact." }] : []),
    { title: "Give every enquiry a clear next step.", name: "Lead follow-up", href: "/services/agentic-speed-to-lead", body: "Collect job requirements, confirm your service area and prepare the handoff to the right person. Follow-up and customer-record changes require approval." },
  ];
  return <><JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "Industries", path: "/industries" }, { name: niche.name, path }]), serviceLd({ name: `${niche.name} marketing`, description: nicheDescription(niche.name), path, areaServed: "United States", serviceType: "Marketing implementation" })]} /><Header />
    <main className="service-experience">
      <section className="sx-hero nx-hero"><Container>
        <nav className="sx-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/industries">Industries</Link><span>/</span><span aria-current="page">{niche.name}</span></nav>
        <div className="sx-hero-intro"><div className="sx-hero-copy"><p className="sx-kicker"><span className="sx-dot" />{niche.category} · Managed marketing BOTS</p><h1>Agentic marketing<br /><span>for {nicheAudience(niche.name)}.</span></h1><p className="sx-lead">Connect the services you deliver with the people who buy them. We build your marketing and sales workflow around a defined audience, relevant evidence and the next step your team can act on.</p><div className="sx-actions"><ServiceAuditLink /><a href="#buyer-map" className="btn btn-outline">Explore your buyer strategy<ArrowRight size={16} /></a></div><p className="sx-note">{AUDIT_OFFER.priceLabel} workflow audit. Buyer profile, priority workflow and implementation plan.</p></div></div>
        <div className="sx-hero-foot"><span><Target size={15} />Service-specific buyer planning</span><span><GitBranch size={15} />Your existing sales process</span><span><ShieldCheck size={15} />Human approval before action</span></div>
      </Container></section>
      <NicheBuyerSection niche={niche} />
      <section className="sx-section"><Container><div className="nx-scope"><div className="sx-section-copy"><p className="sx-kicker">Define the opportunity</p><h2>The right audience.<br /><span>A credible reason to choose you.</span></h2><p>{brief.focus}</p><p>{brief.evidence}</p></div><div><p className="sx-kicker">What we establish with your team</p><ol>{brief.inputs.map((input, index) => <li key={input}><span>0{index + 1}</span>{input}</li>)}</ol><p className="sx-note">Your actual service offering, territory and capacity determine the scope.</p></div></div></Container></section>
      <section className="sx-section sx-section-soft"><Container><div className="sx-section-heading"><p className="sx-kicker">From buyer context to execution</p><h2>A connected approach<br /><span>to your next opportunity.</span></h2><p>Choose the channel after defining the buyer and the job. The audit identifies the best starting workflow for your business.</p></div><div className="nx-channel-links">{channels.map(channel => <Link href={channel.href} key={channel.href}><span className="sx-kicker">{channel.name}</span><h3>{channel.title}</h3><p>{channel.body}</p><span className="sx-text-link">Explore the service<ArrowRight size={15} /></span></Link>)}</div></Container></section>
      <section className="sx-section"><Container><div className="sx-scope-layout"><div className="sx-section-copy"><p className="sx-kicker">A managed implementation</p><h2>Built around your business.<br /><span>Accountable to your team.</span></h2><p>BOTS prepare research, content and proposed actions within a defined scope. Our team manages the workflow; your business retains control of decisions and customer commitments.</p></div><ul className="nx-controls">{["Your service territory and customer criteria", "Relevant buyer roles verified before outreach", "Approved sources and reviewable BOT ACTIVITY", "Human approval for publishing, sending and CRM changes"].map(item => <li key={item}><Check size={16} />{item}</li>)}</ul></div></Container></section>
      <ServiceDelivery /><ServiceAudit source={`niche-${niche.slug}`} focus={`${niche.name} marketing and buyer strategy`} />
      <section className="sx-section"><Container><div className="nb-specialties"><p className="sx-kicker">Continue exploring · {niche.category}</p><details><summary>Browse {related.length} related service niches</summary><ul>{related.map(item => <li key={item.slug}><Link href={nicheHref(item.slug)}>{item.name}</Link></li>)}</ul></details><Link href="/industries#niche-directory" className="sx-text-link">Explore all business niches<ArrowRight size={16} /></Link><Link href="/markets" className="sx-text-link">Explore your service area<ArrowRight size={16} /></Link></div></Container></section>
    </main><Footer /></>;
}
