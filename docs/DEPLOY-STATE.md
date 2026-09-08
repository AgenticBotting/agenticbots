# Where things stand — deployment

_Last updated: Sept 8 2026_

## Live

**Production URL:** https://agenticbots-lc3b68qbk-lot-sealers-projects.vercel.app
Status: Ready · 4,923 pages · ~8 min build on Vercel.

**Every URL currently 302s to Vercel SSO.** That is Deployment Protection,
on by default for new projects. Turn it off to make the site public:
Vercel → agenticbots → Settings → Deployment Protection → Vercel
Authentication → Disabled.

## Where it lives, and why

| | |
|---|---|
| GitHub | `AgenticBotting/agenticbots` (private), pushed via SSH deploy key |
| Vercel project | `agenticbots` |
| Vercel scope | `lot-sealers-projects` |
| Vercel login | `info-38951386` |

The Vercel scope looks wrong but is deliberate. Vercel allows one account
per phone number, and creating a team needs a card — so a separate account
or team was not available. A **project** gives the separation that actually
matters: its own domain, env vars, deployments and settings, sharing only
the billing account. Revisit if a paid plan ever happens.

Three accounts live on this machine and collided repeatedly during setup:
- GitHub CLI credential → the *other* account; cannot see this private repo.
  Solved with an SSH deploy key (`~/.ssh/id_ed25519_agenticbots`) plus the
  `github-agenticbots` host alias in `~/.ssh/config`.
- Vercel `login` kept authorising Lot Sealers because the browser session
  was reused by the device flow.
- Commits were authored `LotSealers <info@lotsealers.com>` from the global
  git identity; rewritten to `AgenticBotting <170340097+AgenticBotting@
  users.noreply.github.com>` before the first push. Repo-local git identity
  is set so future commits stay correct.

## Next steps, in order

1. **Disable Deployment Protection** — otherwise nobody can see the site.
2. **Environment variables** (Vercel → Settings → Environment Variables).
   `/api/plan` returns 502 in production when no delivery sink is
   configured, on purpose, so a visitor is never told a lead was received
   when it was not. At least one of:
   - `RESEND_API_KEY` + `FROM_EMAIL` + `CONTACT_EMAIL`
   - `MAILERLITE_API_KEY` + `MAILERLITE_GROUP_ID`
   Plus `NEXT_PUBLIC_SITE_URL=https://agenticbots.dev`.
   Optional analytics: `NEXT_PUBLIC_UMAMI_URL`, `NEXT_PUBLIC_UMAMI_WEBSITE_ID`,
   `UMAMI_URL`, `UMAMI_WEBSITE_ID`. See `.env.example`.
3. **Attach the domain** — Vercel → Settings → Domains → `agenticbots.dev`.
4. **Connect GitHub for auto-deploy** — must be done in the dashboard
   (Settings → Git → Connect → `AgenticBotting/agenticbots`). The CLI cannot:
   our remote is the SSH alias `git@github-agenticbots:…`, which Vercel
   cannot parse. Until then, deploy with `vercel deploy --yes` from this
   directory. Alternatively point `origin` at the canonical URL first.

## Cleanup still outstanding

- `~/Documents/GitHub/agenticbots` — GitHub Desktop's clone of the
  throwaway README-only history. Stale second working copy; delete it.
  The real repo is `~/Desktop/AgenticBots`.
- `~/.ssh/id_ed25519_agenticbots` and its `~/.ssh/config` block are in use
  for pushes — keep them.

## Still open from the audit

- **Service taxonomy** — `cities-dataset.json` and
  `SERVICE-CONTENT-BLUEPRINT.md` define two different 8-service lists.
  Mass generation of the 7,392 city×service pages stays blocked until one
  is chosen. See `docs/SEO-ARCHITECTURE.md`.
- **Assets** — photography, explainer video, guide PDF. See
  `docs/ASSET-BRIEF.md`. The guide's download button promises a file that
  nothing currently delivers.
- **Real numbers** — ProofBar, pricing and category stats are labelled
  illustrative until verified figures exist.
