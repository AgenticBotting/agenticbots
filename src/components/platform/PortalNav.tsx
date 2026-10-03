"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CheckSquare, Home, Inbox, Plug, Rows3 } from "lucide-react";

const ITEMS = [
  { href: "/portal", label: "Overview", icon: Home },
  { href: "/portal/activity", label: "Activity", icon: Rows3 },
  { href: "/portal/approvals", label: "Approvals", icon: CheckSquare, key: "approvals" },
  { href: "/portal/requests", label: "Requests", icon: Inbox },
  { href: "/portal/integrations", label: "Integrations", icon: Plug },
  { href: "/portal/reports", label: "Reports", icon: BarChart3 },
];

function useCurrent() {
  const path = usePathname();
  return (href: string) => (href === "/portal" ? path === "/portal" : path.startsWith(href));
}

export function PortalNav({ approvals }: { approvals: number }) {
  const isCurrent = useCurrent();
  return (
    <nav className="pf-portal-nav" aria-label="Portal">
      {ITEMS.map((i) => (
        <Link key={i.href} href={i.href} aria-current={isCurrent(i.href) ? "page" : undefined}>
          {i.label}
          {i.key === "approvals" && approvals > 0 && <span className="count" aria-label={`${approvals} waiting`}>{approvals}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function PortalMobileTabs({ approvals }: { approvals: number }) {
  const isCurrent = useCurrent();
  return (
    <nav className="pf-mobile-tabs" aria-label="Portal">
      {ITEMS.map((i) => {
        const Icon = i.icon;
        return (
          <Link key={i.href} href={i.href} aria-current={isCurrent(i.href) ? "page" : undefined}>
            <Icon aria-hidden="true" />
            {i.label}
            {i.key === "approvals" && approvals > 0 && <span className="dot" aria-label={`${approvals} waiting`} />}
          </Link>
        );
      })}
    </nav>
  );
}
