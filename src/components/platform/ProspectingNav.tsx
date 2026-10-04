"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/ops/prospecting", label: "Overview" },
  { href: "/ops/prospecting/markets", label: "Markets" },
  { href: "/ops/prospecting/icps", label: "ICPs" },
  { href: "/ops/prospecting/niches", label: "Niches" },
  { href: "/ops/prospecting/buyers", label: "Buyer types" },
  { href: "/ops/prospecting/review", label: "Review" },
  { href: "/ops/prospecting/companies", label: "Companies" },
  { href: "/ops/prospecting/signals", label: "Signals" },
  { href: "/ops/prospecting/suppression", label: "Suppression" },
  { href: "/ops/prospecting/providers", label: "Providers & cost" },
];

/** Section tabs for the Prospect Graph console. */
export function ProspectingNav() {
  const path = usePathname();
  const current = (href: string) => (href === "/ops/prospecting" ? path === href : path === href || path.startsWith(`${href}/`));
  return (
    <nav className="pf-tabs" aria-label="Prospecting sections">
      {ITEMS.map((i) => (
        <Link key={i.href} href={i.href} aria-current={current(i.href) ? "page" : undefined}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
