"use client";

import { useState, useEffect, useCallback, useRef, forwardRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, Mail, ChevronDown, MapPin } from "lucide-react";
import { Logo, BotIndex } from "@/components/ui";
import { CATALOG, categoryHref, type PillarSlug } from "@/lib/catalog";

import { ALL_STATES, allCitiesInState } from "@/lib/geo/dataset";
import { groupByRegion, type Region } from "@/lib/geo/regions";
import { MarketSearch } from "./MarketSearch";
import { openBotPlan } from "@/lib/lead-flow";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

const NAV_LINKS = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
];

type MenuId = "bots" | "areas" | null;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const [selectedPillar, setSelectedPillar] = useState<PillarSlug | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGroup, setMobileGroup] = useState<string | null>("marketing");
  const navRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const onScroll = useCallback(() => setScrolled(window.scrollY > 12), []);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!openMenu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeMenu();
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!navRef.current?.contains(t) && !panelRef.current?.contains(t)) closeMenu();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [openMenu]);

  function closeMenu() {
    setOpenMenu(null);
    setSelectedPillar(null);
    setSelectedRegion(null);
  }

  function toggleMenu(id: Exclude<MenuId, null>) {
    if (openMenu === id) { closeMenu(); return; }
    track("nav_mega_opened", { menu: id });
    setSelectedPillar(null);
    setSelectedRegion(null);
    setOpenMenu(id);
  }

  const pillar = selectedPillar ? CATALOG.find((p) => p.slug === selectedPillar) ?? null : null;
  const regions = groupByRegion(ALL_STATES);
  const regionSel = selectedRegion ? regions.find((r) => r.region === selectedRegion) ?? null : null;

  return (
    <div className="sticky top-0 z-50">
      {/* ── Utility bar ── */}
      <div className="hidden lg:block bg-ink-950 border-b border-white/[0.06]">
        <div className="container-site">
          <div className="flex items-center justify-between h-9">
            <span className="text-[12.5px] font-medium tracking-[-0.01em] text-ink-500">Agentic bots for growth</span>
            <a
              href="mailto:hello@agenticbots.dev"
              className="inline-flex items-center gap-2 text-[13px] text-ink-400 hover:text-white transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              hello@agenticbots.dev
            </a>
          </div>
        </div>
      </div>

      {/* ── Main bar ── */}
      <header className={cn("bg-ink-900 transition-shadow duration-300", scrolled && "shadow-mega")}>
        <div className="container-site">
          <div
            ref={navRef}
            className="grid grid-cols-[auto_1fr_auto] lg:grid-cols-[1fr_auto_1fr] items-center h-[76px] lg:h-[84px] gap-6"
          >
            <Logo height={30} className="justify-self-start" />

            <nav className="hidden lg:flex justify-self-center items-center gap-8">
              <MenuTrigger label="Bots" open={openMenu === "bots"} onClick={() => toggleMenu("bots")} />
              <MenuTrigger label="Service areas" open={openMenu === "areas"} onClick={() => toggleMenu("areas")} />
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={closeMenu}
                  className={cn(
                    "nav-link transition-colors",
                    pathname === l.href ? "text-white" : "text-ink-200 hover:text-white"
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="justify-self-end flex items-center gap-3">
              <button
                type="button"
                onClick={() => { closeMenu(); openBotPlan("header"); }}
                className="hidden sm:inline-flex btn btn-primary h-11"
              >
                Get your bot plan
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="lg:hidden flex items-center justify-center w-11 h-11  rounded-[var(--radius)] border border-ink-600 text-white"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Mega: Bots (two-step) ── */}
        {openMenu === "bots" && (
          <MegaPanel ref={panelRef}>
            {pillar === null ? (
              <>
                <MegaHeader eyebrow="Bots · Step 1 of 2" title="Pick a side of the business." />
                <ul className="grid gap-3">
                  {CATALOG.map((p) => (
                    <li key={p.slug} className="flex">
                      <button
                        onClick={() => setSelectedPillar(p.slug)}
                        className="group w-full flex items-center justify-between gap-6 px-6 py-5 text-left rounded-[var(--radius)] border border-[var(--border)] bg-white hover:border-ink-950 hover:-translate-y-0.5 hover:shadow-lift transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      >
                        <span className="min-w-0">
                          <span className="block eyebrow mb-1.5">{p.tagline}</span>
                          <span className="block display-lg">{p.name}</span>
                          <span className="block mt-1.5 text-[14px] text-[var(--text-secondary)]">{p.menuBlurb}</span>
                        </span>
                        <span className="flex items-center gap-5 shrink-0">
                          <span className="text-[13px] font-semibold tracking-[-0.01em] text-[var(--text-muted)]">
                            {p.categories.length} bots
                          </span>
                          <ArrowRight className="w-4 h-4 text-[var(--accent-text)] transition-transform duration-200 group-hover:translate-x-1" />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <StepBack onBack={() => setSelectedPillar(null)} backLabel="All bots"
                  eyebrow={`${pillar.name.toUpperCase()} · Step 2 of 2`} title="Pick the job you need done." />
                <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {pillar.categories.map((c) => (
                    <li key={c.slug} className="flex">
                      <Link
                        href={categoryHref(c)}
                        onClick={closeMenu}
                        className="group w-full flex items-start gap-3 p-4 rounded-[var(--radius)] border border-[var(--border)] bg-white hover:border-ink-950 hover:-translate-y-0.5 hover:shadow-lift transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      >
                        <BotIndex index={c.index} size="sm" tone="outline" />
                        <span className="min-w-0">
                          <span className="block display-md !text-[15px]">{c.botName}</span>
                          <span className="block mt-1 text-[12.5px] leading-snug text-[var(--text-secondary)]">{c.name}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <MegaFooter onAct={closeMenu} />
          </MegaPanel>
        )}

        {/* ── Mega: Service areas — region cards, then that region's states ── */}
        {openMenu === "areas" && (
          <MegaPanel ref={panelRef}>
            <div className="mb-7 max-w-[520px]">
              <MarketSearch onNavigate={closeMenu} />
            </div>
            {regionSel === null ? (
              <>
                <MegaHeader eyebrow="Service areas · Step 1 of 2" title="Or pick your part of the country." />
                <ul className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  {regions.map(({ region, states }) => {
                    const metros = states.reduce((n, st) => n + allCitiesInState(st.slug).length, 0);
                    return (
                      <li key={region} className="flex">
                        <button
                          onClick={() => setSelectedRegion(region)}
                          className="group w-full flex flex-col justify-between gap-8 p-5 min-h-[132px] text-left rounded-[var(--radius)] border border-[var(--border)] bg-white hover:border-ink-950 hover:-translate-y-0.5 hover:shadow-lift transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        >
                          <span>
                            <span className="block display-lg">{region}</span>
                            <span className="mt-2 block mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                              {states.length} state{states.length > 1 ? "s" : ""} · {metros} cities
                            </span>
                          </span>
                          <ArrowRight className="w-4 h-4 self-end text-[var(--accent-text)] transition-transform duration-200 group-hover:translate-x-1" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <>
                <StepBack onBack={() => setSelectedRegion(null)} backLabel="All regions"
                  eyebrow={`${regionSel.region.toUpperCase()} · Step 2 of 2`} title="Pick your state." />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {regionSel.states.map((st) => {
                    const cities = allCitiesInState(st.slug);
                    const top = cities.slice(0, 8);
                    return (
                      <div key={st.slug} className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-5">
                        <Link
                          href={`/markets/${st.slug}`}
                          onClick={closeMenu}
                          className="group flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[var(--border)]"
                        >
                          <span className="flex items-center gap-2 display-md !text-[15px] group-hover:text-[var(--accent-text)] transition-colors">
                            <MapPin className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                            {st.name}
                          </span>
                          <span className="mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                            {cities.length} cities
                          </span>
                        </Link>
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                          {top.map((c) => (
                            <li key={c.city_slug}>
                              <Link
                                href={`/markets/${st.slug}/${c.city_slug}`}
                                onClick={closeMenu}
                                className="block py-1 text-[13px] text-[var(--text-body)] hover:text-[var(--accent-text)] transition-colors truncate"
                              >
                                {c.city}
                              </Link>
                            </li>
                          ))}
                        </ul>
                        {cities.length > top.length && (
                          <Link
                            href={`/markets/${st.slug}`}
                            onClick={closeMenu}
                            className="mt-2.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--accent-text)] hover:gap-2.5 transition-all"
                          >
                            All {cities.length} {st.name} cities
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            <MegaFooter
              onAct={closeMenu}
              label="Don't see your market?"
              text="We're expanding toward all 50 states. Tell us where you are — the plan comes back mapped to your market either way."
            />
          </MegaPanel>
        )}
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-ink-950 overflow-y-auto animate-fade-in">
          <div className="container-site">
            <div className="flex items-center justify-between h-[76px]">
              <Logo height={26} />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="flex items-center justify-center w-11 h-11  rounded-[var(--radius)] border border-ink-600 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pb-16 pt-4">
              {CATALOG.map((p) => (
                <MobileGroup
                  key={p.slug}
                  id={p.slug}
                  open={mobileGroup === p.slug}
                  onToggle={() => setMobileGroup(mobileGroup === p.slug ? null : p.slug)}
                  kicker={p.tagline}
                  title={p.name}
                >
                  {p.categories.map((c) => (
                    <MobileRow key={c.slug} href={categoryHref(c)} onGo={() => setMobileOpen(false)}>
                      {c.botName}
                    </MobileRow>
                  ))}
                </MobileGroup>
              ))}

              <MobileGroup
                id="areas"
                open={mobileGroup === "areas"}
                onToggle={() => setMobileGroup(mobileGroup === "areas" ? null : "areas")}
                kicker="Where we deploy"
                title="Service areas"
              >
                <li className="pb-3"><MarketSearch dark onNavigate={() => setMobileOpen(false)} /></li>
                <MobileRow href="/markets" onGo={() => setMobileOpen(false)}>All markets</MobileRow>
                {regions.map(({ region, states }) => (
                  <MobileRow key={region} href={`/markets#${region.toLowerCase()}`} onGo={() => setMobileOpen(false)}>
                    {region} · {states.length} states
                  </MobileRow>
                ))}
              </MobileGroup>

              <ul className="py-4">
                {NAV_LINKS.map((l) => (
                  <li key={l.href} className="border-b border-ink-700">
                    <Link
                      href={l.href}
                      onClick={() => setMobileOpen(false)}
                      className="block py-4 display-lg text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <a
                href="mailto:hello@agenticbots.dev"
                className="mt-6 flex items-center gap-2 text-[14px] text-ink-300"
              >
                <Mail className="w-4 h-4" />
                hello@agenticbots.dev
              </a>
            </div>
          </div>
          {/* Thumb-zone CTA — pinned to the drawer bottom, always reachable. */}
          <div className="sticky bottom-0 inset-x-0 bg-ink-950 border-t border-ink-700 px-5 py-4">
            <button
              type="button"
              onClick={() => { setMobileOpen(false); openBotPlan("mobile-nav"); }}
              className="btn btn-primary w-full"
            >
              Get your bot plan
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────  Primitives  ─────────────────────────── */

function MenuTrigger({ label, open, onClick }: { label: string; open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className={cn(
        "nav-link inline-flex items-center gap-1.5 transition-colors",
        open ? "text-white" : "text-ink-200 hover:text-white"
      )}
    >
      {label}
      <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", open && "rotate-180")} />
    </button>
  );
}

const MegaPanel = forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  function MegaPanel({ children }, ref) {
    return (
      <div
        ref={ref}
        className="hidden lg:block absolute left-0 right-0 bg-white border-b border-[var(--border)] shadow-mega animate-fade-up"
      >
        <div className="container-site py-10 max-h-[calc(100vh-140px)] overflow-y-auto">{children}</div>
      </div>
    );
  }
);

function MegaHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-7 pb-4 border-b border-[var(--border)]">
      <p className="mb-1.5 eyebrow">{eyebrow}</p>
      <h3 className="display-md">{title}</h3>
    </div>
  );
}

function StepBack({ onBack, backLabel, eyebrow, title }: {
  onBack: () => void; backLabel: string; eyebrow: string; title: string;
}) {
  return (
    <div className="flex items-center gap-6 mb-6 pb-4 border-b border-[var(--border)]">
      <button
        onClick={onBack}
        className="px-4 py-2.5 rounded-[var(--radius)] border border-[var(--border-strong)] text-[13.5px] font-semibold tracking-[-0.01em] hover:bg-ink-950 hover:text-white hover:border-ink-950 transition-colors"
      >
        ← {backLabel}
      </button>
      <div>
        <p className="mb-1 eyebrow">{eyebrow}</p>
        <h3 className="display-md">{title}</h3>
      </div>
    </div>
  );
}

function MegaFooter({ onAct, label, text }: { onAct: () => void; label?: string; text?: string }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-6 mt-9 pt-6 border-t border-[var(--border)]">
      <div className="max-w-[52ch]">
        <p className="mb-1.5 eyebrow">{label ?? "Not sure which one you need?"}</p>
        <p className="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
          {text ?? "Most businesses need two or three, not thirteen. Tell us what is getting stuck and we will map it — free, in one business day."}
        </p>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/how-it-works" onClick={onAct} className="btn btn-outline">
          How it works
        </Link>
        <button type="button" onClick={() => { onAct(); openBotPlan("mega-menu"); }} className="btn btn-primary">
          Get your bot plan
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function MobileGroup({ id, open, onToggle, kicker, title, children }: {
  id: string; open: boolean; onToggle: () => void; kicker: string; title: string; children: React.ReactNode;
}) {
  return (
    <div className="border-b border-ink-700" data-group={id}>
      <button onClick={onToggle} aria-expanded={open} className="w-full flex items-center justify-between py-5 text-left">
        <span>
          <span className="block text-[12px] font-bold uppercase tracking-[0.1em] text-ink-500">{kicker}</span>
          <span className="block display-lg text-white mt-1">{title}</span>
        </span>
        <ChevronDown className={cn("w-5 h-5 text-ink-400 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && <ul className="pb-5 space-y-1">{children}</ul>}
    </div>
  );
}

function MobileRow({ href, onGo, children }: { href: string; onGo: () => void; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} onClick={onGo} className="flex items-center justify-between py-2.5 text-[15px] text-ink-200">
        {children}
        <ArrowRight className="w-4 h-4 text-ink-500" />
      </Link>
    </li>
  );
}
