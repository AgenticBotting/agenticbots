# Prospecting scoring

All scores are deterministic and explainable: same inputs + same `asOf`
date → the same number, with components and reasons stored on the record.

## 1. Niche attractiveness (modeled) — `ontology/niche-scoring.ts`

A **strategy model** of how good a niche is for AgenticBots prospecting —
not an objective market fact. 0–100, version `niche-attractiveness/1.0.0`.

16 components, each 0–10, weighted to 100: contract value (10), commercial
buyer density (9), outbound suitability (9), decision-maker discoverability
(8), recurring revenue (8), facility dependence (7), customer lifetime value
(7), service-area mobility (6), public buying signals (6), buyer
concentration (6), permit signals (5), bid-board suitability (5), urgency
(4), regulatory recurrence (4), SEO demand (3), PPC demand (3).

Inputs are the niche's "Sells To" value and taxonomy tags derived from its
name (e.g. `roofing`, `fire_life_safety`, `recurring_service`,
`consumer_local`). Every niche stores the components, weights, reasoning
lines and a confidence (how many explicit tags drove it).

Tiers: **A ≥ 65**, **B ≥ 50**, **C** otherwise. Seed result: 102 A / 133 B /
106 C. Commercial roofing, HVAC/mechanical, fire & life safety, paving,
access control and sitework land in A; consumer storefront services in C.

## 2. Niche ↔ buyer relationships — `ontology/relationships.ts`

Rules, not a Cartesian product. A buyer is considered only if its facility
tags answer one of the niche's needs (`taxonomy.NEEDS`), gated by Sells To
and buyer kind. Confidence = strongest need × kind factor + corroboration
(≤ 0.06) + portfolio-owner bonus (0.06). Below 0.45 → dropped. Caps: 40
direct + 6 referral per niche.

`auto_approved` only if confidence ≥ 0.72, the buyer is a direct buyer, and
at least one of its titles matches the niche's role families. Everything
else is `needs_review`. Operator decisions are never overwritten by a rerun,
and no model is ever re-run on an approved row. An `AmbiguityClassifier`
seam exists for a future LLM pass on `needs_review` rows only (off).

## 3. Prospect Fit (0–100) — `scoring.ts`

| Component | Max | Evidence |
|---|---|---|
| Right kind of buyer | 30 | relationship confidence × 27 (+3 if the ICP prefers this buyer); 0 if excluded, unmapped or rejected |
| In the market | 15 | 15 exact county/city/ZIP match; 8 same state only |
| Size / portfolio | 15 | reported portfolio size, location count, or employee band |
| Decision maker found | 20 | title match to the relationship's role families × seniority × employment confidence |
| Reachable | 10 | email status: VERIFIED 10, LIKELY_VALID 7, CATCH_ALL 4, RISKY 2 |
| Record quality | 10 | identity confidence, domain, website/phone |

A component without evidence scores **0** and is marked "not observed" — it
is never guessed.

## 4. Timing (0–100)

Sum over **observed, unexpired** signals: `weight(type) × relevance ×
confidence × 0.5^(age/45 days)`, capped at 100. Weights range from bid
postings / procurement notices (45) to website indicators (10). No signal →
Timing 0 with "No observed timing signal".

## 5. Priority

`round(0.6 × Fit + 0.3 × Timing + 0.1 × niche attractiveness)`.

## 6. Qualification (rules) — `scoring.qualify`

* Fit < 45 → **rejected**.
* Otherwise **review** if any: no decision maker (when the vertical pack
  requires one), no work email, email not VERIFIED/LIKELY_VALID, fit below
  the pack's bar (60 roofing/HVAC/paving/electrical/fire; 55 others).
* Else **qualified**.

A Bot can apply the rules; only a person can override them (with a reason),
and rules never undo a person's decision.

## Feedback loop

Outcomes (`contacted … won/lost`, value) are recorded per prospect and
rolled up per buyer type (`outcomeStats`). V1 stores them; recalibrating
weights from outcomes is a later step and will bump the score version.
