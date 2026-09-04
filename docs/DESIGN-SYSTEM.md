# Design System

Started in Phase 1 (accent migration). Grows with later phases.

## Token architecture

Single source: `src/app/globals.css`. Two layers:

1. **`@theme` raw scales** — Tailwind v4 generates utilities from these (`bg-accent-500`, `text-ink-300`, …).
2. **`:root` semantic tokens** — what components actually reference (`--cta-bg`, `--accent-text`, `--bg-tint`). Every semantic token resolves into a ramp step by `var()`, so the next accent change is a regenerate-one-block diff.

## Accent ramp — anchored `#7FA200`

OKLCH-interpolated (anchor measures `oklch(0.662 0.164 123.6)`): perceptually even lightness steps, hue held at 123.6°, chroma tapered toward both ends so the extremes don't muddy into olive. Gamut-clamped per step.

| Step | Hex | L (OKLCH) | Role |
|---|---|---|---|
| 50 | `#EEFDD4` | 0.972 | tint surfaces (`--bg-tint`) |
| 100 | `#E0F8B1` | 0.945 | — |
| 200 | `#C7E97D` | 0.885 | tinted borders (`--border-tint`) |
| 300 | `#ADD44E` | 0.815 | on-dark bright · focus ring on dark · `::selection` |
| 400 | `#97BD27` | 0.745 | **on-dark accent** (`--accent`) · CTA hover |
| 500 | `#7FA200` | 0.662 | **the anchor** — fills, badges, glows, CTA (`--cta-bg`). Never text on light |
| 600 | `#6C8A00` | 0.590 | — |
| 700 | `#577000` | 0.505 | CTA boundary border (WCAG 1.4.11) |
| 800 | `#435700` | 0.425 | — |
| 900 | `#324101` | 0.350 | — |
| 950 | `#253103` | 0.290 | — |

**`--accent-text: #5F7A00`** — the AA text-on-white green (4.92:1). Sits between 600 and 700 on the ramp; shipped as a literal semantic token per spec. Every inline link, label and eyebrow on light surfaces uses it.

### Usage contract

- Fills, badges, borders, glows → **500**
- Text on light surfaces → **`--accent-text` only** (500 is 2.97:1 there)
- Text/marks on dark surfaces → **300/400**
- Text sitting on a 500 fill → **near-black `#080A08`**, never white (2.97:1)
- Dark surfaces are already warm near-black (`#0C0E0C`/`#080A08`), per spec's anti-vibration guidance

### Legacy aliases (kept so markup didn't churn)

`--color-signal-500 → accent-400` · `--color-signal-400 → accent-300` · `--color-signal-50 → accent-50` · `--color-brand-600 → accent-500` · `--color-brand-500 → accent-400`

## Neutral (ink) scale

| Token | Hex | Role |
|---|---|---|
| ink-950 | `#080A08` | headlines, CTA label, footer |
| ink-900 | `#0C0E0C` | nav, dark sections |
| ink-800 | `#181B18` | cards on dark |
| ink-700 | `#272B27` | body text, borders on dark |
| ink-600 | `#3A403A` | ghost borders on dark |
| ink-500 | `#626862` | secondary text |
| ink-400 | `#8C928C` | metadata **on dark only** (3.18:1 on white) |
| `--text-muted` | `#6E746E` | metadata on light (AA-passing sibling of ink-400) |
| ink-300 | `#BEC4BE` | body on dark |
| ink-200 | `#D9DDD9` | nav links |
| ink-100 | `#E2E6E1` | borders |
| ink-50 | `#F7F9F6` | alternating sections |

## Contrast table (automated, Phase 1)

Script: OKLCH+WCAG math in-repo (to be promoted into CI in Phase 10). Any FAIL is a bug.

| Pair | Ratio | Min | Result |
|---|---|---|---|
| headline #080A08 / white | 19.86:1 | 4.5 | PASS |
| body #272B27 / white | 14.37:1 | 4.5 | PASS |
| body #272B27 / off-white | 13.58:1 | 4.5 | PASS |
| secondary #626862 / white | 5.71:1 | 4.5 | PASS |
| muted #6E746E / white | 4.79:1 | 4.5 | PASS |
| accent-text #5F7A00 / white | 4.92:1 | 4.5 | PASS |
| accent-text #5F7A00 / off-white | 4.64:1 | 4.5 | PASS |
| accent-text #5F7A00 / tint-50 | 4.60:1 | 4.5 | PASS |
| CTA label #080A08 / accent-500 | 6.69:1 | 4.5 | PASS |
| CTA label #080A08 / accent-400 (hover) | 9.10:1 | 4.5 | PASS |
| white on accent-500 | 2.97:1 | 4.5 | forbidden by contract — labels are black |
| accent-400 / ink-900 | 8.88:1 | 4.5 | PASS |
| accent-400 / ink-800 | 7.96:1 | 4.5 | PASS |
| accent-300 / ink-900 | 11.35:1 | 4.5 | PASS |
| accent-500 fill boundary / white | 2.97:1 | 3.0 | **resolved**: `.btn-primary` carries an accent-700 border (5.64:1) |
| accent-500 fill boundary / off-white | 2.81:1 | 3.0 | **resolved**: same border (5.33:1) |
| focus ring #5F7A00 / white | 4.92:1 | 3.0 | PASS |
| focus ring accent-300 / ink-950 | 11.64:1 | 3.0 | PASS |
| selection: ink text / accent-300 | 11.64:1 | 4.5 | PASS |
| white / ink-900 | 19.38:1 | 4.5 | PASS |
| dark body #BEC4BE / ink-900 | 10.91:1 | 4.5 | PASS |
| dark body #BEC4BE / ink-800 | 9.79:1 | 4.5 | PASS |
| nav #D9DDD9 / ink-900 | 14.11:1 | 4.5 | PASS |
| metadata #8C928C / ink-900 | 6.09:1 | 4.5 | PASS |

## Also updated in Phase 1

- **Favicon**: `src/app/icon.svg` (bot mark, accent-500 on ink) — kills the sitewide 404. Full ICO/PNG/maskable set is Phase 7.
- **`themeColor`**: light + dark media variants.
- **Focus rings**: `--accent-text` on light; auto-lifts to accent-300 inside `.on-dark` / dark-band sections.
- **`::selection`**: accent-300 + near-black.
- **Glow/ring alphas**: re-derived from ramp values (no orphaned rgba of the old greens).

## Not applicable yet (spec's "also update" list)

`manifest.json`, OG/Twitter image templates, loading/skeleton states, chart palettes — none exist in the codebase yet. They inherit the ramp when their phases create them. Email template (`src/lib/notify.ts`) contains no accent color; it themes when React Email lands.

## Type & shape (pre-existing, unchanged in Phase 1)

Geist 600 display / Geist body / Geist Mono micro-labels · zero radius, diagonal `.notch` cut · dark surfaces limited to header, footer, StatBand.
