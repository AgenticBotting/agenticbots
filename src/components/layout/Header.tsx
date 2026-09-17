"use client";

import { useState, useEffect, useCallback, useRef, forwardRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, ArrowLeft, Mail, ChevronDown, ChevronRight, MapPin } from "lucide-react";
import { Logo, BotIndex, LogoMask } from "@/components/ui";
import { CATALOG, serviceHref, type PillarSlug } from "@/lib/catalog";

import { ALL_STATES, allCitiesInState } from "@/lib/geo/dataset";
import { groupByRegion, regionSlug, type Region } from "@/lib/geo/regions";
import { MarketSearch } from "./MarketSearch";
import { BotOrbit } from "@/components/marketing/BotOrbit";
import { openBotPlan } from "@/lib/lead-flow";
import { cn } from "@/lib/utils";
import { useDialog } from "@/hooks/useDialog";
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
  const regionMobile = mobileRegion ? regions.find((r) => r.region === mobileRegion) ?? null : null;

  return (
    <div className="sticky top-0 z-50">
      {/* ── Utility bar ── */}
      <div className="hidden lg:block bg-[var(--header-bar)] border-b border-white/[0.06]">
        <div className="container-bleed">
          <div className="flex items-center justify-between h-9">
            <span className="text-[12.5px] font-medium tracking-[-0.01em] text-ink-300">Agentic bots for growth</span>
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
            /* At lg the row becomes a 5-column grid: [logo][spacer][nav]
               [spacer][cta], not a 3-column `1fr auto 1fr`. The 3-column
               version — whether via a plain grid or `position:absolute;
               left:50%` — centers nav on the row's true midpoint, which
               is mathematically centered but visually lopsided whenever
               logo and the CTA cluster are different widths (they always
               are here: 226px vs 183px with one button, 312px with two).
               Measured: 86px of gap asymmetry at 1440px+, 43px the other
               direction at the lg-only tier.

               A first attempt tried forcing BOTH outer tracks to an equal
               `minmax(edge-w, 1fr)` width, which turned out not to fix
               it: making the TRACKS equal doesn't make the GAPS equal
               when the CONTENT inside them still differs — the slack in
               each track is (track width − that track's own content
               width), and with logo and the CTA cluster genuinely
               different sizes, that slack came out unequal by exactly
               the same 86px regardless.

               The actual fix is two dedicated, empty spacer tracks
               (`1fr` each) that carry no content of their own. An empty
               track's size floor is zero — there's no logo-vs-CTA
               content asymmetry to inherit — so two `1fr` tracks with
               nothing in them are guaranteed an equal, growing share of
               whatever space is left, and THAT's what sits between logo
               and nav, and between nav and the CTA cluster. Logo, nav and
               the CTA cluster each keep their own natural `auto` width;
               nothing about them needs to match anything else. */
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
            <nav className="hidden lg:flex shrink-0 items-center gap-8 whitespace-nowrap">
              <MenuTrigger label="Bots" open={openMenu === "bots"} onClick={() => toggleMenu("bots")} />
              <MenuTrigger label="Service areas" open={openMenu === "areas"} onClick={() => toggleMenu("areas")} />
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
              {/* Green body, black eyes — the header rides on ink-950, so a
                  cutout-eyed bot would lose its face against the dark. */}
              {/* The breakpoint lives on this wrapper, not on BotOrbit.
                  BotOrbit hardcodes `inline-flex` and cn() is a plain join,
                  so a `hidden` passed through would lose to it on CSS source
                  order — leaving the CTA visible on phones and shoving the
                  row past the viewport. Below sm the drawer's pinned CTA
                  covers this. */}
              <div className="hidden sm:block">
                <BotOrbit tone="text-accent-500" eyes="text-ink-950">
                  <button
                    type="button"
                    onClick={() => { closeMenu(); openBotPlan("header"); }}
                    className="btn btn-primary h-11"
                  >
                    Get your bot plan
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </BotOrbit>
              </div>

              {/* xl, not lg: nav is now truly centered on the row (see
                  its comment), and that position depends only on the
                  row's own midpoint — extra room at the far edges from
                  going full-bleed doesn't move that midpoint, so it
                  doesn't buy this any safety either. Measured at 1024px
                  with both buttons shown: nav's own right edge lands 62px
                  into this cluster; at 1150px the gap is a bare 1px, too
                  thin to trust. xl (1280px) is the first step with real
                  margin (50px+), so "Get your bot plan" alone still
                  carries 1024–1279px. */}
              <Link
                href="/contact"
                onClick={closeMenu}
                className="hidden xl:inline-flex btn h-11 border-[var(--color-accent-500)] text-white hover:bg-[var(--color-accent-500)] hover:text-ink-950"
              >
                Contact us
              </Link>

              {/* Phone CTA. No icon and a smaller label than the desktop
                  button, to share the row with the mark and the menu button.
                  `.btn` lives in @layer components, so these utilities
                  override it without !important. */}
              <div className="sm:hidden">
                <BotOrbit tone="text-accent-500" eyes="text-ink-950">
                  <button
                    type="button"
                    onClick={() => { closeMenu(); openBotPlan("header-mobile"); }}
                    className="btn btn-primary h-11 px-3 text-[12.5px]"
                  >
                    See What’s Possible
                  </button>
                </BotOrbit>
              </div>
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
                        className="group w-full flex items-center justify-between gap-6 px-6 py-5 text-left border border-[var(--border)] bg-white hover:border-ink-950 hover:-translate-y-0.5 hover:shadow-lift transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
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
                        href={serviceHref(c)}
                        onClick={closeMenu}
                        className="group w-full flex items-start gap-3 p-4 border border-[var(--border)] bg-white hover:border-ink-950 hover:-translate-y-0.5 hover:shadow-lift transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
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
                          className="group w-full flex flex-col justify-between gap-8 p-5 min-h-[132px] text-left border border-[var(--border)] bg-white hover:border-ink-950 hover:-translate-y-0.5 hover:shadow-lift transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
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
                {/* States only. The city lists that used to live here put
                    115 links in one panel; they now live on the state and
                    region pages, which is also where a crawler wants them. */}
                <ul className="grid grid-cols-3 xl:grid-cols-4 gap-3">
                  {regionSel.states.map((st) => {
                    const cities = allCitiesInState(st.slug);
                    return (
                      <li key={st.slug} className="flex">
                        <Link
                          href={`/markets/${st.slug}`}
                          onClick={closeMenu}
                          className="group w-full flex items-center justify-between gap-3 px-4 py-3.5 border border-[var(--border)] bg-white hover:border-ink-950 hover:-translate-y-0.5 hover:shadow-lift transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-[var(--accent-text)]" />
                            <span className="display-md !text-[14px] truncate group-hover:text-[var(--accent-text)] transition-colors">
                              {st.name}
                            </span>
                          </span>
                          <span className="mono text-[10px] uppercase tracking-[0.08em] shrink-0 text-[var(--text-muted)]">
                            {cities.length} cities
                          </span>
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
                    <MobileRow key={c.slug} href={serviceHref(c)} onGo={closeMobile} boxed>
                      {c.botName}
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
                {NAV_LINKS.map((l) => (
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
            <button
              type="button"
              onClick={() => { setMobileOpen(false); openBotPlan("mobile-nav"); }}
              className="btn btn-primary w-full"
            >
              Get your bot plan
              <ArrowRight className="w-4 h-4" />
            </button>
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
