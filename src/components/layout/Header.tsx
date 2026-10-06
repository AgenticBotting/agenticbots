"use client";

import { useState, useEffect, useCallback, useRef, forwardRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, X, ArrowRight, ArrowLeft, Mail, ChevronDown, ChevronRight,
} from "lucide-react";
import { Logo, LogoMask } from "@/components/ui";
import { ALL_CATEGORIES, serviceHref } from "@/lib/catalog";
import { getServicePositioning } from "@/lib/service-positioning";

import { ALL_STATES, allCitiesInState } from "@/lib/geo/dataset";
import { groupByRegion, regionSlug, type Region } from "@/lib/geo/regions";
import { MarketSearch } from "./MarketSearch";
import { cn } from "@/lib/utils";
import { useDialog } from "@/hooks/useDialog";
import { track } from "@/lib/analytics";
import { AUDIT_OFFER } from "@/config/marketing-offer";

const NAV_LINKS = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
];

type MenuId = "services" | "areas" | null;

/* The 13 bots, grouped by the job a contractor needs done — not by
   marketing vs. sales. Speed-to-Lead is pulled out as the starting point. */
const START_SLUG = "inbound";
const STAGES: { id: string; title: string; blurb: string; slugs: string[] }[] = [
  { id: "found", title: "Get found", blurb: "Build visibility across search, content and paid media.", slugs: ["paid-media", "seo", "reviews", "content", "lead-generation", "outbound"] },
  { id: "close", title: "Close more jobs", blurb: "Prepare responses and follow-up across your sales process.", slugs: ["inbound", "cro", "email", "enablement"] },
  { id: "repeat", title: "Win repeat work", blurb: "Bring past customers back and know what is working.", slugs: ["reactivation", "crm", "analytics"] },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGroup, setMobileGroup] = useState<string | null>(null);
  const [mobileRegion, setMobileRegion] = useState<Region | null>(null);
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

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    setMobileRegion(null);
  }, []);
  const drawerRef = useDialog(mobileOpen, closeMobile);

  useEffect(() => {
    if (!openMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      navRef.current?.querySelector<HTMLButtonElement>('button[aria-expanded="true"]')?.focus();
      closeMenu();
    };
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
    setSelectedRegion(null);
    setSelectedStage(null);
  }

  function toggleMenu(id: Exclude<MenuId, null>) {
    if (openMenu === id) { closeMenu(); return; }
    track("nav_mega_opened", { menu: id });
    setSelectedRegion(null);
    setSelectedStage(null);
    setOpenMenu(id);
  }

  const stageSel = selectedStage;
  const stages = STAGES.map((st) => ({
    ...st,
    items: st.slugs.map((sl) => ALL_CATEGORIES.find((c) => c.slug === sl)).filter((c): c is NonNullable<typeof c> => !!c),
  }));
  const regions = groupByRegion(ALL_STATES);
  const regionSel = selectedRegion ? regions.find((r) => r.region === selectedRegion) ?? null : null;
  const regionMobile = mobileRegion ? regions.find((r) => r.region === mobileRegion) ?? null : null;

  return (
    <div className="sticky top-0 z-50">
      {/* ── Utility bar ── */}
      <div className="hidden lg:block bg-[var(--header-bar)] border-b border-white/[0.06]">
        <div className="container-bleed">
          <div className="flex items-center justify-between h-9">
            <span className="text-[12.5px] font-medium tracking-[-0.01em] text-ink-300">A coordinated BOT workforce</span>
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
      <header className={cn("bg-[var(--header-bg)] transition-shadow duration-300", scrolled && "shadow-mega")}>
        <div className="container-bleed">
          <div
            ref={navRef}
            className="grid grid-cols-[auto_1fr_auto] items-center h-[76px] lg:h-[84px] gap-2 sm:gap-3 lg:grid-cols-[auto_minmax(16px,1fr)_auto_minmax(16px,1fr)_auto]"
          >
            <Link
              href="/"
              aria-label="AgenticBots — home"
              className="justify-self-start lg:shrink-0 inline-flex items-center"
            >
              {/* The lockup is 7.5:1, so it costs ~150px of row even at its
                  smallest. That fits alongside the CTA and the menu button
                  from 390px up; below that the mark stands in. */}
              <LogoMask art="mark" height={24} className="min-[390px]:hidden text-white" />
              <Logo
                href={null}
                className="hidden min-[390px]:inline-flex [--logo-h:18px] min-[402px]:[--logo-h:20px] min-[430px]:[--logo-h:22px] sm:[--logo-h:26px] lg:[--logo-h:30px]"
              />
            </Link>

            {/* A real element, not just a declared column: CSS grid's
                default auto-placement fills tracks with however many
                children actually exist, in order — with only 3 real
                children (logo, nav, CTA cluster) for 5 declared tracks,
                the first three tracks would get filled and the two
                empty-but-declared spacer tracks would end up trailing
                after the CTA cluster instead of flanking nav, which is
                exactly what pushed the CTA cluster's right edge 691px
                off the row's true edge at 1920px on the first attempt. */}
            <div aria-hidden="true" className="hidden lg:block" />

            {/* Back in normal grid flow — the middle `auto` track, sized
                to its own content. Its position is now an emergent result
                of the two equal `minmax(var(--edge-w),1fr)` flanks (see
                the row's comment), not something calculated directly.

                shrink-0 + whitespace-nowrap stay as guards: nav's track is
                `auto`, which never compresses on its own, but if this
                grid is ever swapped for a flex row again, these keep a
                too-tight fit failing as a real overflow instead of
                silently wrapping "Service areas" onto two lines the way
                it did earlier. */}
            <nav className="hidden lg:flex shrink-0 items-center gap-5 xl:gap-7 whitespace-nowrap">
              <MenuTrigger panelId="services-menu" label="Services" open={openMenu === "services"} onClick={() => toggleMenu("services")} />
              <MenuTrigger panelId="areas-menu" label="Service areas" open={openMenu === "areas"} onClick={() => toggleMenu("areas")} />
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={closeMenu}
                  aria-current={pathname === l.href ? "page" : undefined}
                  className={cn(
                    "nav-link transition-colors",
                    pathname === l.href ? "text-white" : "text-ink-200 hover:text-white"
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* The matching second spacer — see the one before logo's
                closing tag for why this needs to be a real element. */}
            <div aria-hidden="true" className="hidden lg:block" />

            {/* This is track 5, the row's last — nothing trails it, so it
                always sits flush against the row's true right edge
                regardless of its own content width. */}
            <div className="justify-self-end flex items-center gap-2 sm:gap-3 lg:shrink-0">
              <Link
                href="/#audit"
                onClick={() => { closeMenu(); track("cta_clicked", { source: "header", label: "audit" }); }}
                className="btn btn-primary h-11 px-3 sm:px-5 text-[12.5px] sm:text-[14px]"
              >
                <span className="sm:hidden">{AUDIT_OFFER.priceLabel} audit</span>
                <span className="hidden sm:inline">{AUDIT_OFFER.shortCta}</span>
                <ArrowRight className="hidden sm:block w-4 h-4" />
              </Link>
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="lg:hidden flex items-center justify-center w-11 h-11 border border-[var(--header-line)] text-white"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Mega: Services — step 1 pick an outcome, step 2 pick the BOT ── */}
        {openMenu === "services" && (
          <MegaPanel id="services-menu" ref={panelRef}>
            {(() => {
              const stage = stages.find((item) => item.id === stageSel);
              if (!stage) {
                return (
                  <>
                    <div className="mb-7 grid grid-cols-[minmax(320px,.82fr)_minmax(0,1.18fr)] items-end gap-12">
                      <div>
                        <p className="eyebrow mb-2">Managed BOT systems</p>
                        <h3 className="display-lg !text-[30px] max-w-[26ch]">
                          Choose the outcome. We architect the operating layer.
                        </h3>
                      </div>
                      <p className="max-w-[54ch] justify-self-end text-[15px] leading-relaxed text-[var(--text-secondary)]">
                        Start with one business priority. Explore the specialist BOTS, workflows and controls designed around it.
                      </p>
                    </div>
                    <ul className="grid grid-cols-3 divide-x divide-[var(--border)] border-y border-[var(--border-strong)]">
                      {stages.map((item, index) => {
                        return (
                          <li key={item.id} className="flex">
                            <button
                              type="button"
                              onClick={() => setSelectedStage(item.id)}
                              className="group relative w-full min-h-[224px] overflow-hidden bg-white px-7 py-6 text-left transition-colors duration-300 hover:bg-[var(--bg-alt)] focus-visible:z-10"
                            >
                              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-[var(--color-accent-500)] transition-transform duration-300 group-hover:scale-x-100" />
                              <span className="flex h-full flex-col">
                                <span className="mono text-[10px] tracking-[0.12em] text-[var(--text-muted)]">0{index + 1}</span>
                                <span className="mt-8 block display-lg !text-[28px] transition-colors group-hover:text-[var(--accent-text)]">{item.title}</span>
                                <span className="mt-3 block max-w-[29ch] text-[14px] leading-relaxed text-[var(--text-secondary)]">{item.blurb}</span>
                                <span className="mt-auto flex items-center justify-between gap-4 pt-7">
                                  <span className="text-[12.5px] font-semibold text-[var(--foreground)]">Explore workflows</span>
                                  <span className="grid h-9 w-9 place-items-center bg-ink-950 text-white transition-colors duration-200 group-hover:bg-[var(--color-accent-500)] group-hover:text-[var(--accent-ink)]">
                                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                                  </span>
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                );
              }

              return (
                <>
                  <StepBack
                    onBack={() => setSelectedStage(null)}
                    backLabel="All outcomes"
                    eyebrow={`${stage.title.toUpperCase()} · Step 2 of 2`}
                    title={stage.blurb}
                  />
                  <ul className={cn(
                    "grid gap-px border border-[var(--border-strong)] bg-[var(--border)]",
                    stage.items.length > 4 ? "grid-cols-3" : stage.items.length === 4 ? "grid-cols-4" : "grid-cols-3",
                  )}>
                    {stage.items.map((category) => (
                      <li key={category.slug} className="flex">
                        <Link
                          href={serviceHref(category)}
                          onClick={closeMenu}
                          className={cn(
                            "group relative w-full min-h-[142px] flex flex-col gap-2 bg-white p-5 transition-colors duration-200 hover:bg-[var(--bg-alt)]",
                            category.slug === START_SLUG
                              ? "shadow-[inset_0_2px_0_var(--color-accent-500)]"
                              : "",
                          )}
                        >
                          {category.slug === START_SLUG && (
                            <span className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--accent-text)]">Recommended starting point</span>
                          )}
                          <span className="display-md !text-[16px] group-hover:text-[var(--accent-text)] transition-colors">{category.name}</span>
                          <span className="mono text-[9.5px] uppercase tracking-[0.08em] text-[var(--text-muted)]">{getServicePositioning(category.slug).deliveryModel}</span>
                          <span className="text-[13px] leading-snug text-[var(--text-secondary)]">{getServicePositioning(category.slug).summary}</span>
                          <span className="mt-auto flex items-center justify-between pt-2 text-[12px] font-semibold text-[var(--foreground)]">
                            Review BOT
                            <ArrowRight className="h-4 w-4 text-[var(--accent-text)] transition-transform duration-200 group-hover:translate-x-1" />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              );
            })()}
            <ServiceMenuFooter onAct={closeMenu} />
          </MegaPanel>
        )}

        {/* ── Mega: Service areas — outcome-style region lanes, then states ── */}
        {openMenu === "areas" && (
          <MegaPanel id="areas-menu" ref={panelRef}>
            <div className="mb-7 grid grid-cols-[minmax(340px,.88fr)_minmax(380px,1.12fr)] items-end gap-12">
              <div>
                <p className="eyebrow mb-2">National service delivery</p>
                <h3 className="display-lg !text-[30px] max-w-[27ch]">
                  Choose the market. We map the local operating context.
                </h3>
              </div>
              <div className="min-w-0 justify-self-end w-full max-w-[540px]">
                <MarketSearch onNavigate={closeMenu} />
              </div>
            </div>
            {regionSel === null ? (
              <>
                <ul className="grid grid-cols-5 divide-x divide-[var(--border)] border-y border-[var(--border-strong)]">
                  {regions.map(({ region, states }, index) => {
                    const metros = states.reduce((n, st) => n + allCitiesInState(st.slug).length, 0);
                    return (
                      <li key={region} className="flex">
                        <button
                          type="button"
                          onClick={() => setSelectedRegion(region)}
                          className="group relative w-full min-h-[188px] overflow-hidden bg-white px-5 py-5 text-left transition-colors duration-300 hover:bg-[var(--bg-alt)] focus-visible:z-10"
                        >
                          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-[var(--color-accent-500)] transition-transform duration-300 group-hover:scale-x-100" />
                          <span className="flex h-full flex-col">
                            <span className="mono text-[10px] tracking-[0.12em] text-[var(--text-muted)]">0{index + 1}</span>
                            <span className="mt-6 block display-lg !text-[22px] transition-colors group-hover:text-[var(--accent-text)]">{region}</span>
                            <span className="mt-2 text-[12px] text-[var(--text-secondary)]">
                              {states.length} states · {metros} cities
                            </span>
                            <span className="mt-auto flex items-center justify-between gap-3 pt-6">
                              <span className="text-[12.5px] font-semibold text-[var(--foreground)]">Explore</span>
                              <span className="grid h-9 w-9 place-items-center bg-ink-950 text-white transition-colors duration-200 group-hover:bg-[var(--color-accent-500)] group-hover:text-[var(--accent-ink)]">
                                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                              </span>
                            </span>
                          </span>
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
                {/* States only. The city lists that used to live here put
                    115 links in one panel; they now live on the state and
                    region pages, which is also where a crawler wants them. */}
                <ul className="grid grid-cols-4 gap-px border border-[var(--border-strong)] bg-[var(--border)]">
                  {regionSel.states.map((st) => {
                    const cities = allCitiesInState(st.slug);
                    return (
                      <li key={st.slug} className="flex">
                        <Link
                          href={`/markets/${st.slug}`}
                          onClick={closeMenu}
                          className="group w-full min-h-[76px] flex items-center justify-between gap-4 bg-white px-5 py-4 transition-colors duration-200 hover:bg-[var(--bg-alt)]"
                        >
                          <span className="min-w-0">
                            <span className="block display-md !text-[14px] truncate transition-colors group-hover:text-[var(--accent-text)]">{st.name}</span>
                            <span className="mt-1 block text-[11.5px] text-[var(--text-muted)]">{cities.length} cities</span>
                          </span>
                          <ArrowRight className="h-4 w-4 shrink-0 text-[var(--accent-text)] transition-transform duration-200 group-hover:translate-x-1" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                {/* The region hub, reachable from the menu on desktop too —
                    same destination the phone drawer rows point at. */}
                <Link
                  href={`/markets/region/${regionSlug(regionSel.region)}`}
                  onClick={closeMenu}
                  className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--accent-text)] hover:gap-2.5 transition-all"
                >
                  View all {regionSel.region} markets
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
            <CoverageMenuFooter onAct={closeMenu} />
          </MegaPanel>
        )}
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="lg:hidden fixed inset-0 z-[60] bg-white overflow-y-auto animate-fade-in"
        >
          <div className="container-site">
            <div className="flex items-center justify-between h-[76px]">
              <Logo variant="dark" height={26} className="[--logo-h:24px] sm:[--logo-h:26px]" />
              <button
                onClick={closeMobile}
                aria-label="Close menu"
                className="flex items-center justify-center w-11 h-11 border border-[var(--border-strong)] text-[var(--foreground)] hover:bg-[var(--bg-alt)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pb-16 pt-4">
              {stages.map((st) => (
                <MobileGroup
                  key={st.id}
                  id={st.id}
                  open={mobileGroup === st.id}
                  onToggle={() => setMobileGroup(mobileGroup === st.id ? null : st.id)}
                  kicker="Services"
                  title={st.title}
                >
                  {st.items.map((c) => (
                    <MobileRow key={c.slug} href={serviceHref(c)} onGo={closeMobile} meta={c.slug === START_SLUG ? "Start here" : undefined} boxed>
                      {c.name}
                    </MobileRow>
                  ))}
                </MobileGroup>
              ))}

              <MobileGroup
                id="areas"
                open={mobileGroup === "areas"}
                onToggle={() => {
                  setMobileRegion(null);
                  setMobileGroup(mobileGroup === "areas" ? null : "areas");
                }}
                kicker="Where we deploy"
                title="Service areas"
              >
                {regionMobile === null ? (
                  <>
                    <li className="pb-3"><MarketSearch onNavigate={closeMobile} /></li>
                    <MobileRow href="/markets" onGo={closeMobile} boxed>All markets</MobileRow>
                    {regions.map(({ region, states }) => (
                      <MobileDrill key={region} onClick={() => setMobileRegion(region)} meta={`${states.length} states`} boxed>
                        {region}
                      </MobileDrill>
                    ))}
                  </>
                ) : (
                  <>
                    <li className="pb-1">
                      <button
                        type="button"
                        onClick={() => setMobileRegion(null)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--border-strong)] text-[13px] font-semibold tracking-[-0.01em] hover:bg-ink-950 hover:text-white hover:border-ink-950 transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        All regions
                      </button>
                    </li>
                    {regionMobile.states.map((st) => (
                      <MobileRow
                        key={st.slug}
                        href={`/markets/${st.slug}`}
                        onGo={closeMobile}
                        meta={`${allCitiesInState(st.slug).length} cities`}
                        boxed
                      >
                        {st.name}
                      </MobileRow>
                    ))}
                    <li className="pt-2">
                      <Link
                        href={`/markets/region/${regionSlug(regionMobile.region)}`}
                        onClick={closeMobile}
                        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--accent-text)] hover:gap-2.5 transition-all"
                      >
                        View all {regionMobile.region} markets
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </li>
                  </>
                )}
              </MobileGroup>

              <ul className="py-5 space-y-2">
                {[...NAV_LINKS, { label: "About", href: "/about" }, { label: "Blog", href: "/blog" }, { label: "Founding clients", href: "/#founding" }].map((l) => (
                  <MobileRow key={l.href} href={l.href} onGo={closeMobile} boxed strong>
                    {l.label}
                  </MobileRow>
                ))}
              </ul>

              <a
                href="mailto:hello@agenticbots.dev"
                className="mt-6 flex items-center gap-2 text-[14px] text-[var(--text-secondary)] hover:text-[var(--accent-text)] transition-colors"
              >
                <Mail className="w-4 h-4" />
                hello@agenticbots.dev
              </a>
            </div>
          </div>
          {/* Thumb-zone CTA — pinned to the drawer bottom, always reachable. */}
          <div className="sticky bottom-0 inset-x-0 bg-white border-t border-[var(--border)] px-5 py-4">
            <Link
              href="/#audit"
              onClick={closeMobile}
              className="btn btn-primary w-full"
            >
              {AUDIT_OFFER.cta}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              onClick={closeMobile}
              className="btn w-full mt-2 border-[var(--color-accent-500)] text-[var(--foreground)] hover:bg-[var(--bg-tint)]"
            >
              Contact us
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────  Primitives  ─────────────────────────── */

function MenuTrigger({ label, open, onClick, panelId }: { label: string; open: boolean; onClick: () => void; panelId: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls={open ? panelId : undefined}
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

const MegaPanel = forwardRef<HTMLDivElement, { children: React.ReactNode; id: string }>(
  function MegaPanel({ children, id }, ref) {
    return (
      <div
        ref={ref}
        id={id}
        className="hidden lg:block absolute left-0 right-0 bg-white border-b border-[var(--border)] shadow-mega animate-fade-up"
      >
        <div className="container-site py-8 max-h-[calc(100vh-140px)] overflow-y-auto">{children}</div>
      </div>
    );
  }
);

function StepBack({ onBack, backLabel, eyebrow, title }: {
  onBack: () => void; backLabel: string; eyebrow: string; title: string;
}) {
  return (
    <div className="flex items-center gap-6 mb-6 pb-4 border-b border-[var(--border)]">
      <button
        onClick={onBack}
        className="px-4 py-2.5 border border-[var(--border-strong)] text-[13.5px] font-semibold tracking-[-0.01em] hover:bg-ink-950 hover:text-white hover:border-ink-950 transition-colors"
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

function ServiceMenuFooter({ onAct }: { onAct: () => void }) {
  return (
    <div className="mt-7 flex items-center justify-between gap-8 border-t border-[var(--border)] pt-5">
      <div className="max-w-[68ch] text-[13px] leading-relaxed text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--foreground)]">Need the first mandate mapped?</span>{" "}
        The {AUDIT_OFFER.priceLabel} workflow audit identifies the highest-value place to begin.
      </div>
      <div className="flex shrink-0 items-center">
        <Link href="/#audit" onClick={onAct} className="btn btn-primary">
          Find my first BOT
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function CoverageMenuFooter({ onAct }: { onAct: () => void }) {
  return (
    <div className="mt-7 flex items-center justify-between gap-8 border-t border-[var(--border)] pt-5">
      <div className="max-w-[68ch] text-[13px] leading-relaxed text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--foreground)]">Need the market case mapped?</span>{" "}
        The {AUDIT_OFFER.priceLabel} workflow audit connects your service area to the first viable BOT mandate.{" "}
        <Link href="/markets" onClick={onAct} className="font-semibold text-[var(--foreground)] underline decoration-[var(--border-strong)] underline-offset-4 hover:text-[var(--accent-text)]">
          View all markets
        </Link>
      </div>
      <div className="flex shrink-0 items-center">
        <Link href="/#audit" onClick={onAct} className="btn btn-primary">
          Find my first BOT
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function MobileGroup({ id, open, onToggle, kicker, title, children }: {
  id: string; open: boolean; onToggle: () => void; kicker: string; title: string; children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--border)]" data-group={id}>
      <button onClick={onToggle} aria-expanded={open} className="w-full flex items-center justify-between py-5 text-left">
        <span>
          <span className="block text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">{kicker}</span>
          <span className="block display-lg text-[var(--foreground)] mt-1">{title}</span>
        </span>
        <ChevronDown className={cn("w-5 h-5 text-[var(--text-muted)] transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && <ul className="pb-5 space-y-2">{children}</ul>}
    </div>
  );
}

function MobileRow({ href, onGo, meta, boxed, strong, children }: {
  href: string; onGo: () => void; meta?: string; boxed?: boolean; strong?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className={boxed ? "flex" : undefined}>
      <Link href={href} onClick={onGo} className={cn(
        "group flex items-center justify-between gap-3 hover:text-[var(--accent-text)] transition-colors",
        strong
          ? "display-md !text-[16px] text-[var(--foreground)] py-0.5"
          : "text-[15px] text-[var(--text-body)]",
        boxed ? `w-full ${BOXED_ROW}` : "py-2.5",
      )}>
        <span className="min-w-0 truncate">{children}</span>
        <span className="flex shrink-0 items-center gap-2.5">
          {meta && <RowMeta>{meta}</RowMeta>}
          <ArrowRight className="w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </Link>
    </li>
  );
}

/** Same row, but it drills into the next step instead of navigating. The
 *  chevron rather than the arrow is what marks the difference. */
function MobileDrill({ onClick, meta, boxed, children }: {
  onClick: () => void; meta?: string; boxed?: boolean; children: React.ReactNode;
}) {
  return (
    <li className={boxed ? "flex" : undefined}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group w-full flex items-center justify-between gap-3 text-left text-[15px] text-[var(--text-body)] hover:text-[var(--accent-text)] transition-colors",
          boxed ? BOXED_ROW : "py-2.5",
        )}
      >
        <span className="min-w-0 truncate">{children}</span>
        <span className="flex shrink-0 items-center gap-2.5">
          {meta && <RowMeta>{meta}</RowMeta>}
          <ChevronRight className="w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </button>
    </li>
  );
}

/** The desktop mega cards' shape, sized for a thumb. Hover is inert on
 *  touch, so the press state carries the feedback. */
const BOXED_ROW =
  "border border-[var(--border)] bg-white px-4 py-3.5 " +
  "hover:border-ink-950 hover:-translate-y-0.5 hover:shadow-lift " +
  "active:border-ink-950 active:bg-[var(--bg-alt)] active:translate-y-0 " +
  "transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]";

function RowMeta({ children }: { children: React.ReactNode }) {
  return (
    <span className="mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
      {children}
    </span>
  );
}
