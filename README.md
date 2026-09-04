# AgenticBots.dev

Marketing site for AgenticBots — agentic bots for growth.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 · framer-motion · Geist / Geist Mono

## Run

```bash
npm run dev -- -p 3003     # 3000/3001/3002 are reserved for other projects
npm run build
npm run lint
npx tsc --noEmit
```

## Structure

| Path | What it is |
|---|---|
| `src/lib/catalog.ts` | **Single source of truth.** 2 pillars, 15 categories, 121 capabilities. The mega menu, footer, all service pages and `sitemap.ts` read from it. |
| `src/lib/posts.ts` | Blog content as typed blocks — no markdown parser, no CMS. |
| `src/app/globals.css` | The whole design system. Every color lives here as a token. |
| `src/components/marketing/PillarPage.tsx` | Template for `/marketing` and `/sales`. |
| `src/components/marketing/CategoryPage.tsx` | Template for all 15 category pages. |
| `src/components/marketing/BotPlanForm.tsx` | The site's single conversion form. |
| `src/app/api/plan/route.ts` | Form handler — rate limited, fans out to MailerLite + Resend. |

## Design rules

- **Radius is 3px.** 2px on chips. Circles only for dots.
- **Amber is the CTA color and nothing else.** One per viewport.
- **Elevation comes from borders**, not blur.
- **Display type carries `-0.04em` tracking.**
- **No hardcoded colors in components.** `grep -rE '#[0-9a-fA-F]{6}' src --include='*.tsx'` must return nothing.
- Light canvas, navy structure. Dark surfaces are the header, footer and `StatBand` only — never a lead-gen hero.

## Adding a service

Append to the relevant array in `src/lib/catalog.ts`. The route, nav entry, footer link, sitemap entry and page all follow automatically.

## Environment

All optional — the site and form work without any of them.

```
NEXT_PUBLIC_SITE_URL      # canonical origin, defaults to https://agenticbots.dev
MAILERLITE_API_KEY        # lead capture
MAILERLITE_GROUP_ID
RESEND_API_KEY            # inbox notification
FROM_EMAIL
CONTACT_EMAIL             # defaults to hello@agenticbots.dev
```

Missing credentials are logged and skipped, so local dev and previews keep working.
