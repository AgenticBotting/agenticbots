import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";
import { Logo, BotPattern } from "@/components/ui";
import { CATALOG, serviceHref } from "@/lib/catalog";
import { REGIONS, regionSlug } from "@/lib/geo/regions";

const COMPANY = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

const LEGAL = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Site map", href: "/site-map" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink-950 on-dark relative overflow-hidden">
      <div className="h-px rule-agent opacity-70" />
      {/* glow=false: five columns of link text run nearly edge to edge here,
          so there is no empty zone for the mask to push the "awake" bots'
          blur into — they land on link text instead. Dim/mid marks carry
          no filter and are unaffected, so the ambient field still shows. */}
      <BotPattern className="absolute inset-0 opacity-[0.35]" position="right" glow={false} />

      <div className="container-site pt-16 pb-10 relative">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr] gap-x-8 gap-y-12 lg:gap-x-8 mb-14">
          {/* Brand — full-width row until there's a column to spare. */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1 lg:pr-6">
            <Logo height={32} className="mb-6" />
            <p className="text-[14px] leading-[1.75] text-ink-300 mb-7 max-w-[38ch]">
              Agentic bots for growth. Marketing bots that create demand, sales bots
              that capture revenue — built, connected and run for you.
            </p>
            <a
              href="mailto:hello@agenticbots.dev"
              className="inline-flex items-center gap-2.5 text-[14px] font-medium text-white hover:text-ink-300 transition-colors"
            >
              <Mail className="w-4 h-4 text-ink-400" />
              hello@agenticbots.dev
            </a>
          </div>

          {/* Catalog */}
          {CATALOG.map((pillar) => (
            <div key={pillar.slug}>
              <Link
                href={`/${pillar.slug}`}
                className="mb-5 inline-block label-caps text-white hover:text-ink-300 transition-colors"
              >
                {pillar.name}
              </Link>
              <ul className="space-y-2.5">
                {pillar.categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={serviceHref(c)}
                      className="text-[13.5px] text-ink-300 hover:text-white transition-colors"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* By market — its own column now, not stacked on top of Company. */}
          <div>
            <p className="mb-5 label-caps text-white">By market</p>
            <ul className="space-y-2.5">
              <li>
                <Link href="/markets" className="text-[13.5px] text-ink-300 hover:text-white transition-colors">
                  All markets
                </Link>
              </li>
              {/* Regions, not the full 51 states — a 51-item column pushed
                  the footer to 1,196px tall, which stretched BotPattern's
                  watermark grid (tuned for a compact section) enough that
                  its glow marks landed on top of link text instead of in
                  empty space. Matches the mega menu's own step-1 grouping;
                  every state still lives on /markets and /site-map. */}
              {REGIONS.map((region) => (
                <li key={region}>
                  <Link
                    href={`/markets/region/${regionSlug(region)}`}
                    className="text-[13.5px] text-ink-300 hover:text-white transition-colors"
                  >
                    {region}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="mb-5 label-caps text-white">Company</p>
            <ul className="space-y-2.5">
              {COMPANY.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[13.5px] text-ink-300 hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Optin strip */}
        <div className="rounded-none border border-ink-700 bg-ink-800 px-6 py-6 sm:px-8 flex flex-col sm:flex-row sm:items-center gap-5 justify-between mb-10">
          <div>
            <p className="display-md text-white">Get your bot plan — free.</p>
            <p className="text-[13.5px] text-ink-400 mt-1.5">
              Tell us what is getting stuck. We map the bots that fix it.
            </p>
          </div>
          <Link href="/plan" className="btn btn-primary shrink-0">
            Get your bot plan
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="pt-8 border-t border-ink-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[12.5px] text-ink-400">
            © {year} AgenticBots. All rights reserved.{" "}
            <span className="hidden sm:inline" title="It has never once asked for a raise.">
              This footer was assembled by a bot that does not celebrate its own birthday.
            </span>
          </p>
          <ul className="flex items-center gap-6">
            {LEGAL.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-[12.5px] text-ink-400 hover:text-ink-200 transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
