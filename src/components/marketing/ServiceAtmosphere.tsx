import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  Building2,
  CalendarCheck,
  ChartNoAxesCombined,
  Database,
  FileCheck2,
  FileText,
  Mail,
  MapPin,
  MessageSquareText,
  MousePointerClick,
  PhoneCall,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Star,
  Target,
  Workflow,
} from "lucide-react";

const ICONS: Record<string, readonly [LucideIcon, LucideIcon, LucideIcon]> = {
  "paid-media": [Target, MousePointerClick, BarChart3],
  seo: [Search, MapPin, ChartNoAxesCombined],
  content: [FileText, Workflow, ChartNoAxesCombined],
  email: [Mail, Send, Workflow],
  cro: [MousePointerClick, BarChart3, Workflow],
  analytics: [ChartNoAxesCombined, Database, BarChart3],
  "lead-generation": [Target, Building2, Search],
  outbound: [Send, MessageSquareText, ShieldCheck],
  inbound: [PhoneCall, MessageSquareText, CalendarCheck],
  crm: [Database, Workflow, RefreshCw],
  enablement: [FileCheck2, CalendarCheck, Workflow],
  reviews: [Star, MessageSquareText, ShieldCheck],
  reactivation: [RefreshCw, CalendarCheck, Mail],
};

const DEFAULT_ICONS = [Bot, Workflow, ChartNoAxesCombined] as const;

export function ServiceAtmosphere({ slug }: { slug?: string }) {
  const icons = slug ? ICONS[slug] ?? DEFAULT_ICONS : DEFAULT_ICONS;

  return (
    <div className="service-atmosphere" aria-hidden="true">
      {icons.map((Icon, index) => (
        <span key={index} className={`service-atmosphere-icon icon-${index + 1}`}>
          <Icon strokeWidth={1.25} />
        </span>
      ))}
      <span className="service-atmosphere-path path-1" />
      <span className="service-atmosphere-path path-2" />
    </div>
  );
}
