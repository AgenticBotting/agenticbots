# Prospecting data model

All tables live in the platform store as `pg_*` (Convex: `pf_pg_*` generic
envelopes). Types: `src/lib/prospecting/types.ts`. Every row has `id`,
`createdAt`, `updatedAt`, `version` (optimistic concurrency).

## Ontology (shared)

| Table | Key fields | Notes |
|---|---|---|
| `pg_import_runs` | kind, fileName, contentHash, rowsRead, inserted/updated/unchanged, duplicates[], malformed[], importerVersion | Append-only. One per import run. |
| `pg_niches` | key (`niche_<category>__<niche>`), category, name, sellsTo, original{}, tags[], attractiveness (ModeledScore), tier | Stable id = FNV hash of key. 341 seeded. |
| `pg_buyer_types` | key, segment, name, decisionMakerTitles[], roleFamilies[], tags[], buyerKind, original{} | 137 seeded. |
| `pg_relationships` | nicheId, buyerTypeId, priority 1–5, confidence 0–1, relationshipType, relevantDecisionMakerTitles[], relevantRoleFamilies[], buyingMotion, recurring/contractValue/outbound/bidBoard/seo/ppc/publicSignal suitability 0–10, status, source, reasoning[], generatorVersion, reviewedBy/At/Note | ~11.4k proposed by rules (not 341×137). Status: `auto_approved`, `needs_review`, `approved`, `rejected`. |

## Identity graph (shared)

| Table | Key fields |
|---|---|
| `pg_companies` | canonicalName, normalizedName, domain, website, phone (10 digits), locations[], industry, employeeRange, locationCount, portfolioSize, buyerTypeIds[], buyerClassification, aliases[], identityConfidence, first/lastSeenAt, lastResearchedAt, demo |
| `pg_company_sources` | companyId, provenance, facts{} (verbatim), matchMethod, matchConfidence — one per (provider, external id), never merged away |
| `pg_people` | fullName, first/lastName, location, demo |
| `pg_company_people` | companyId, personId, title, normalizedTitle, roleFamily, seniority, employmentConfidence, provenance |
| `pg_contact_points` | personId, companyId, kind, value, status (VERIFIED…UNKNOWN), confidence, method (cache/pattern/provider/operator), verifiedAt, provenance |
| `pg_domain_intel` | domain, hasMx, catchAll, pattern, patternConfidence, patternEvidenceCount, checkedAt |
| `pg_signals` | companyId, type, summary, observedAt, relevance, confidence, nicheTags[], expiresAt, provenance |

### Provenance (on every external fact)

`provider` (neutral key), `externalId`, `sourceUrl`, `observedAt`,
`fetchedAt`, `expiresAt`, `confidence`, `rawRef`, `usageRestrictions`,
`attribution`, `demo`.

## Client intelligence (private — `orgId` required)

| Table | Key fields |
|---|---|
| `pg_icps` | name, nicheIds[], services[], geographies[], minOpportunityUsd, preferred/excludedBuyerTypeIds[], exclusions[], decisionMakerRoleFamilies[], notes (private), status |
| `pg_markets` | icpId, nicheId, geography, buyerTypeIds[], name, status, universeEstimate? {count, methodology, version}, discovery[] (per provider × buyer type: cursor, exhausted, runs, companiesSeen), lastRefreshedAt |
| `pg_prospects` | marketId, companyId, buyerTypeId, decisionMakerIds[], primaryContactPointId, status, score (ProspectScore), qualification {decision, reasons, decidedBy}, whyNow[], nextAction, notes (private), acquisitionCostUsd |
| `pg_jobs` | kind, marketId/prospectId, status, progress, params, result, error, pausedReason, limits {maxPaidCalls, maxCompanies, maxSpendUsd}, paidCalls, spendUsd |
| `pg_handoffs` | prospectId, contactPointId, provider, status (queued/accepted/rejected_policy/failed), payload (OutboundPayload), externalRef, policyViolations[], demo |
| `pg_outcomes` | prospectId, stage (contacted…won/lost), valueCents, source, occurredAt — append-only |

## Mixed

| Table | Notes |
|---|---|
| `pg_cost_events` | orgId?, marketId?, jobId?, prospectId?, provider, operation, units, unitCostUsd, costUsd, pricingSource, success, demo — append-only, one per provider call |
| `pg_budgets` | scope platform/client/market/provider, monthlyLimitUsd, maxPaidCallsPerRun, maxCompaniesPerJob, maxLeadsExportedPerRun (= daily handoff cap), maxProviderRetries, onLimit stop/approval |
| `pg_suppressions` | orgId? (absent = global), kind email/domain/company/person, value, reason, channels, hard, lifted* |

## Prospect statuses

`new → researching → review | qualified | rejected → sent_to_outbound →
contacted → replied → meeting → opportunity → won | lost`, plus `exhausted`.
