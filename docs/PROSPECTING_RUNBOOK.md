# Prospecting runbook

## Try it in demo mode (no accounts, no cost)

```bash
npm run demo            # http://localhost:3003
```

Sign in as `admin@agenticbots.demo` / `agenticbots-demo` → **Prospecting**
in the left menu. On first open, demo mode loads the ontology and gives the
fictional client Acme Roofing a "Commercial Roofing — Broward County, FL"
market with a finished discovery run. Everything shown is fictional and
labeled `[Demo]`.

To see the client side, sign in as `owner@acmeroofing.demo` → **Prospects**.

## Load the ontology in staging / production

```bash
npm run prospecting:seed:staging     # staging (.env.staging)
npm run prospecting:seed             # uses the current environment
```

Safe to repeat. Prints rows read / inserted / updated / unchanged /
duplicates / malformed for each file and relationship counts. Costs nothing.

**Before the first staging seed, redeploy the Convex functions** — this
build adds the paged `platform.page` query used for large tables:

```bash
npx convex deploy          # with the staging deployment selected
```

## Edit the seed CSVs

Edit `data/prospecting/*.csv`, then:

```bash
npm run prospecting:embed-seed && npm test
```

(A test fails if the embedded copy drifts from the CSVs.) Rerun the seed
command. Rows an operator approved/rejected/edited are never changed.

## Daily operator flow

1. **Review** tab: approve/reject relationships for Tier A niches first.
2. **ICPs**: record what a client sells, where, and buyers to prefer/exclude.
3. **Markets → New market**: client + niche + area (+ ICP).
4. Market page → **Run discovery**. Watch Jobs; a paused job shows a banner
   with **Approve and continue** (adds dollars/calls to that run only).
5. Open prospects; check Fit/Timing components and sources; override with
   a reason if needed.
6. **Send to outbound** per prospect, or **Send qualified to outbound** for
   the market. Blocked handoffs show why.
7. Record outcomes on the prospect page as they happen.

## Turning on a paid data provider (only with approval)

1. Implement the adapter against current vendor docs
   (`docs/PROSPECTING_PROVIDER_ADAPTERS.md` checklist).
2. Put the API key in the server environment (`HUNTER_API_KEY`, …).
3. Set `PROSPECTING_PRICING` from your contract.
4. **Providers & cost → Set a client budget** (monthly $, paid calls per
   run, companies per job, daily handoffs, pause or stop).
5. Run a small discovery (e.g. 5 companies) and check the cost ledger.

## Prospecting Bot tools

Server-to-server endpoint: `POST /api/bot-tools/prospecting`
`{ "tool": "...", "args": {...} }` with `Authorization: Bearer <token>`.
Tokens are HMAC-signed with `PROSPECTING_TOOL_SECRET` (≥ 32 chars), bound to
one Prospecting Bot and one client, and expire (≤ 24h). Without the secret
the endpoint refuses. Wiring tokens into the runtime is the next step (see
build status).

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| "The ontology is not loaded yet" banner | Run the seed command for that environment. |
| Discovery finds nothing outside demo | No discovery provider is ready (all vendors are stubs). Expected. |
| Job paused | A budget/run limit was hit. Approve on the market page or raise the client budget. |
| "No prospecting budget is configured" | Paid calls need a client budget. Free/demo work is unaffected. |
| Handoff `rejected_policy` | Read the notes: suppression, email status, not qualified, daily cap, or demo contact. |
| Convex list errors on big tables | Redeploy Convex functions (paged query). |
