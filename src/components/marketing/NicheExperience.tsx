import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui";
import { NicheBuyerFlow } from "./NicheBuyerFlow";
import { NICHE_BRIEFS } from "@/lib/niche-planning";
import { getPublicNiche, nicheHref, nicheJourneys, tradeNiches, TRADE_FEATURED_NICHE } from "@/lib/public-niches";
import type { PublicNiche } from "@/lib/public-niche-types";
import "./niche-experience.css";

export function NicheBuyerSection({ niche, channel }: { niche: PublicNiche; channel?: "seo" | "ppc" }) {
  return <section className="nb-section" id="buyer-map"><Container>
    <div className="nb-section-head"><div><p className="sx-kicker">{niche.name} · Buyer intelligence</p><h2>Know who buys.<br /><span>And who decides.</span></h2></div><p>{NICHE_BRIEFS[niche.category].focus} Explore the audience and decision-making roles we would validate with your team before deployment.</p></div>
    <NicheBuyerFlow niche={niche.name} buyers={nicheJourneys(niche.slug)} brief={NICHE_BRIEFS[niche.category]} channel={channel} />
  </Container></section>;
}

export function IndustryBuyerSection({ industry, channel }: { industry: string; channel?: "seo" | "ppc" }) {
  const niche = getPublicNiche(TRADE_FEATURED_NICHE[industry]);
  if (!niche) return null;
  const specialties = tradeNiches(industry);
  return <><NicheBuyerSection niche={niche} channel={channel} /><Container><div className="nb-specialties"><p>The map above illustrates {niche.name.toLowerCase()}. Choose your specific service to see its own buyer-planning approach.</p><details><summary>Explore all {specialties.length} services in this category</summary><ul>{specialties.map(item => <li key={item.slug}><Link href={nicheHref(item.slug)}>{item.name}</Link></li>)}</ul></details><Link href="/industries#niche-directory" className="sx-text-link">Find another service niche<ArrowRight size={15} /></Link></div></Container></>;
}
