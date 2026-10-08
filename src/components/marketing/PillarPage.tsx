import type { Pillar } from "@/lib/catalog";
import { ServicePortfolio } from "./ServicePortfolio";

export function PillarPage({ pillar }: { pillar: Pillar }) {
  return <ServicePortfolio pillar={pillar} />;
}
