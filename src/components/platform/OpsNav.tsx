"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, Bell, Bot, CalendarClock, ClipboardList, CreditCard, Gauge, Inbox, LayoutDashboard,
  Plug, ScrollText, Server, Settings, Sparkles, Users,
} from "lucide-react";

const GROUPS: { label: string; items: { href: string; label: string; icon: React.ElementType; countKey?: string }[] }[] = [
  {
    label: "Operate",
    items: [
      { href: "/ops", label: "Dashboard", icon: LayoutDashboard },
      { href: "/ops/clients", label: "Clients", icon: Users },
      { href: "/ops/bots", label: "Bots", icon: Bot },
      { href: "/ops/runs", label: "Runs", icon: Activity },
      { href: "/ops/requests", label: "Requests", icon: Inbox, countKey: "requests" },
      { href: "/ops/approvals", label: "Approvals", icon: ClipboardList, countKey: "approvals" },
      { href: "/ops/automations", label: "Automations", icon: CalendarClock },
      { href: "/ops/integrations", label: "Integrations", icon: Plug },
    ],
  },
  {
    label: "Run the platform",
    items: [
      { href: "/ops/infrastructure", label: "Infrastructure", icon: Server },
      { href: "/ops/usage", label: "Usage & Cost", icon: Gauge },
      { href: "/ops/monitoring", label: "Monitoring", icon: Bell, countKey: "incidents" },
      { href: "/ops/billing", label: "Billing", icon: CreditCard },
      { href: "/ops/skills", label: "Skills", icon: Sparkles },
      { href: "/ops/audit", label: "Audit Log", icon: ScrollText },
      { href: "/ops/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function OpsNav({ counts }: { counts: Record<string, number> }) {
  const path = usePathname();
  const isCurrent = (href: string) => (href === "/ops" ? path === "/ops" : path === href || path.startsWith(`${href}/`));
  return (
    <nav aria-label="Operator console">
      {GROUPS.map((g) => (
        <div key={g.label} style={{ display: "contents" }}>
          <div className="pf-rail-group">{g.label}</div>
          {g.items.map((i) => {
            const Icon = i.icon;
            const n = i.countKey ? counts[i.countKey] ?? 0 : 0;
            return (
              <Link key={i.href} href={i.href} className="pf-nav" aria-current={isCurrent(i.href) ? "page" : undefined}>
                <Icon aria-hidden="true" />
                {i.label}
                {n > 0 && <span className="count" aria-label={`${n} open`}>{n}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
