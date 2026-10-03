# AgenticBots Platform — Architecture

AgenticBots **operates** Bots for clients. The platform has two surfaces in
one Next.js app, on top of one isolated runtime per client:

- **Operator console** (`/ops`, served at `ops.agenticbots.dev`) — where the
  AgenticBots team runs every client, Bot, run, automation, integration,
  invoice and runtime.
- **Client portal** (`/portal`, served at `app.agenticbots.dev`) — results,
  activity, approvals, requests, integrations and reports. Nothing technical.

Decisions and their reasons: `docs/adr/0001-platform-decisions.md`.

## 1. Overall architecture

```mermaid
flowchart LR
  subgraph Browser
    OP[Operator<br/>ops.agenticbots.dev]
    CL[Client<br/>app.agenticbots.dev]
  end
  subgraph Vercel["Vercel — Next.js 16 (this repo)"]
    UI[Server components + server actions]
    API[Route handlers /api/*]
    SVC[Service layer<br/>authz · billing · runs · approvals]
    RA[RuntimeAdapter]
    AWSC[AWS control<br/>OIDC role]
    CRON[Vercel Cron → /api/internal/sync]
  end
  DB[(Convex<br/>pf_* tables)]
  subgraph AWS["AWS — one EC2 per client"]
    SSM[Systems Manager<br/>lifecycle document]
    SM[Secrets Manager<br/>agenticbots/prod/tenants/*]
    EC2[EC2 + encrypted EBS]
    CW[CloudWatch]
  end
  CF[Cloudflare Tunnel + Access]
  OP --> UI
  CL --> UI
  UI --> SVC
  API --> SVC
  CRON --> SVC
  SVC --> DB
  SVC --> RA
  RA -- HTTPS + service token + Bot key --> CF --> EC2
  SVC --> AWSC --> SSM --> EC2
  AWSC --> SM
  AWSC --> CW
```

The browser only ever talks to AgenticBots. Runtime URLs, keys and AWS
identifiers stay on the server.

## 2. Operator console flow

```mermaid
flowchart TD
  D[Dashboard: what needs attention] --> C[Client]
  C --> B[Bots → Bot: run · model · skills · integrations · disable]
  C --> R[Runs → Run: timelines · usage · stop · retry]
  C --> Q[Requests: route to person / Bot · start run · reply]
  C --> AP[Approvals]
  C --> AU[Automations]
  C --> IN[Integrations: check · verify · disconnect]
  C --> INF[Infrastructure: health · restart · deployments]
  C --> BI[Billing: agreement · invoice · record payment]
  C --> SUS[Suspend / Reactivate]
  D --> MON[Monitoring: incidents + logs by correlation id]
```

## 3. Client portal flow

```mermaid
flowchart TD
  L[Sign in] --> O[Overview: results · approvals · request box · Bots · activity]
  O --> A[Approvals: approve / decline with preview]
  O --> RQ[Requests: submit · follow status · reply · see deliverables]
  O --> ACT[Activity feed]
  O --> I[Integrations: Connected / Needs Attention / Disconnected]
  O --> RP[Reports: counts of real work]
```

Every portal object is built by `src/server/views/client.ts` projections:
fields a client may not see are never copied, not filtered afterwards.

## 4. Tenant isolation

```mermaid
flowchart TB
  subgraph App["Shared app (authorization in code, every call)"]
    P[can(actor, permission, orgId)]
  end
  subgraph T1["Acme Roofing"]
    E1[EC2 + EBS + KMS key]
    S1[Secrets: agenticbots/prod/tenants/acme-…/*]
    R1[Instance role: reads ONLY acme-… secrets]
  end
  subgraph T2["Bob's Plumbing"]
    E2[EC2 + EBS + KMS key]
    S2[Secrets: agenticbots/prod/tenants/bobs-…/*]
    R2[Instance role: reads ONLY bobs-… secrets]
  end
  P --> T1
  P --> T2
```

- One EC2, one engine deployment, one KMS key and one IAM role per client.
  Unrelated clients never share an engine.
- In the database every tenant record carries `orgId` (indexed). The service
  layer loads a record, then proves `can(actor, …, record.orgId)`; a record
  from another tenant is reported as **not found** (URL-id probing reveals
  nothing). Tests: `tests/security/authz.test.ts`.

## 5. Bot → runtime profile mapping

```mermaid
flowchart LR
  BT[Bot type<br/>catalog: seo] --> BI[Client Bot instance<br/>Acme → SEO Bot<br/>model · skills · integrations · instructions]
  BI --> PR["Runtime profile 'seo'<br/>own API key · own skills dir · own memory"]
  PR --> URL["/p/seo/v1/* on Acme's runtime"]
```

Bot types live in `src/config/bot-catalog.ts` (derived from the website's
catalog). Instances live in the `bots` table.

## 6. Bot Run lifecycle

```mermaid
stateDiagram-v2
  [*] --> queued: startRun (idempotency key)
  queued --> running: runtime accepted
  running --> waiting_for_approval: approval.request
  waiting_for_approval --> running: approved
  waiting_for_approval --> completed: denied (nothing sent)
  running --> completed
  running --> failed
  running --> cancelled: stop
  running --> interrupted: runtime restart
  completed --> [*]
  failed --> [*]
```

The browser starts a run and receives an AgenticBots run id; the work runs
on the client runtime regardless of the browser. Live updates come over a
reconnectable SSE stream (`/api/runs/:id/events`, 25s connections,
`Last-Event-ID` resume); `/api/internal/sync` reconciles every minute.

## 7. Request flow

```mermaid
sequenceDiagram
  participant C as Client
  participant P as Platform
  participant O as Operator
  participant B as Bot
  C->>P: Submit request (no Bot choice)
  P->>O: New request in queue
  O->>P: Assign operator / Bot, start Bot Run
  P->>B: Run
  B-->>P: Drafts ready → approval
  P->>C: Needs your approval
  C->>P: Approve
  P->>B: Execution run (idempotent on approval id)
  B-->>P: Result + METRICS
  P->>C: Activity + result; request Completed
```

## 8. Approval flow

```mermaid
flowchart TD
  A{Action type} -->|read-only research| AUTO[Runs autonomously]
  A -->|send · publish · ad change · CRM write · delete| GATE[Stops for approval]
  GATE --> K{Kind}
  K -->|runtime: run parked| RT[POST /v1/runs/id/approval once / deny]
  K -->|deliverable: drafts| DL[Approve → start execution run]
  RT --> AUD[Audit + activity]
  DL --> AUD
  GATE -->|expires| EXP[Expired → runtime told deny]
```

## 9. Manual billing flow

```mermaid
flowchart LR
  SA[Service agreement] --> INV[Invoice draft] --> SENT[Mark sent<br/>deliver via your process]
  SENT --> PAY[Client pays ACH / wire / check]
  PAY --> REC[Operator records payment<br/>amount · date · method · reference]
  REC --> BAL[Invoice balance + status<br/>account standing · billing events · audit]
```

No card processor. `BillingProvider` is the seam for QuickBooks/Xero/Bill.com/
Stripe later; `ManualBillingProvider` is the default.

## 10. Billing suspension flow

```mermaid
flowchart TD
  DUE[Invoice due] --> PD[Past due] --> GR[Grace period] --> EL[Eligible for suspension]
  EL --> OPD{Operator decides}
  OPD -->|call client / extend| GR
  OPD -->|suspend: billing| SUS[Block execution → stop runs → SSM stop-runtime<br/>EBS untouched]
  EL -.->|only if agreement auto_suspend_enabled| SUS
```

Default `auto_suspend_enabled = false`.

## 11. Payment → eligible for reactivation

```mermaid
flowchart TD
  P[Payment recorded] --> S{Suspended for billing<br/>and nothing past due?}
  S -->|no| N[Standing updated]
  S -->|yes| E[PAYMENT RECEIVED —<br/>CLIENT ELIGIBLE FOR REACTIVATION]
  E --> O{Operator clicks Reactivate}
  O --> ST[SSM start-runtime → wait for health → verify capabilities → active]
  E -.->|only if auto_reactivate_on_payment AND no manual/security hold AND healthy| ST
```

## 12. Secret flow

```mermaid
sequenceDiagram
  participant B as Browser
  participant S as AgenticBots server
  participant M as Secrets Manager
  participant R as Client runtime
  B->>S: Start run (session cookie only)
  S->>S: Resolve org → runtime → Bot → secret refs
  S->>M: GetSecretValue (OIDC role, tenant path)
  M-->>S: endpoint + service token + Bot key
  S->>R: HTTPS via tunnel (headers)
  S-->>B: AgenticBots run id (no secrets)
  S->>S: Audit (no secret values)
```

## 13. AWS runtime architecture

```mermaid
flowchart TB
  subgraph VPC["VPC (one per environment)"]
    subgraph EC2["EC2 t3.medium — tenant X (SG: no inbound)"]
      DC[Docker Compose]
      H[engine container<br/>gateway, profiles ads/seo/…]
      T[cloudflared]
      DC --> H
      DC --> T
      T -->|agb-hermes:8642 on private network| H
    end
    EBS[(EBS gp3 encrypted<br/>/opt/agenticbots/data)]
    EC2 --- EBS
  end
  DLM[DLM daily snapshots] --> EBS
  SSMD[SSM document<br/>fixed actions only] --> EC2
  KMS[KMS key per tenant] --> EBS
  CWA[CloudWatch agent: disk] --> CW[(CloudWatch alarms)]
  T -->|outbound only| CFE[Cloudflare edge + Access]
```

## Code map

| Concern | Where |
|---|---|
| Domain types | `src/lib/platform/types.ts` |
| Bot catalog / skills / integrations config | `src/config/*` |
| Storage (memory for demo/tests, Convex for prod) | `src/server/db/*`, `convex/platform.ts` |
| Auth, sessions, roles, permissions | `src/server/auth/*` |
| Runtime abstraction | `src/server/runtime/adapter.ts` |
| Engine-specific code (isolated) | `src/server/runtime/hermes/*` |
| Demo runtime | `src/server/runtime/demo/adapter.ts` |
| Event translation / error sanitization | `src/server/runtime/translate.ts`, `errors.ts` |
| Services | `src/server/services/*` |
| Billing domain + providers | `src/server/billing/*` (`providers/manual.ts`) |
| AWS control (OIDC) | `src/server/aws/control.ts` |
| Client projections | `src/server/views/*` |
| Operator console | `src/app/ops/*` |
| Client portal | `src/app/portal/*` |
| API | `src/app/api/*` |
| Terraform | `infra/terraform` |
| Runtime bundle (compose, lifecycle) | `infra/runtime` |
| Skills | `runtime/skills` |
| Provisioning CLI | `ops/cli.ts` |
