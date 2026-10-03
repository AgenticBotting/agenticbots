# Operator console UI/UX audit

Scope: every page in the /ops sidebar. Goal: make the control center readable at a glance, with fewer text tables and numbers that carry visual context.

## Problems found across the console

- Dense text tables on nearly every page, with no visual summary above them.
- Numbers had no context: no trend, no meter, no comparison to a target.
- Client names were repeated on every row instead of grouping rows by client.
- Action buttons stacked vertically and pushed rows tall.
- Filter chips had no counts, so you had to click each one to see whether anything was in it.
- Create forms (automations) were always open and took up half the page.
- The runs list was unbounded.

## Shared visual layer (new)

`src/components/platform/viz.tsx` plus the "Operator console: visual layer" block in `platform.css`:

- KPI tiles with a sparkline or meter
- Segmented status bars that double as filters
- Status lights
- Client avatars
- Horizontal bar rows
- Activity timeline
- Tone-edged cards

`StackedColumns` in `charts.tsx` provides a stacked daily chart with a legend, tooltips and keyboard focus. Status colors (good / live / watch / bad / quiet / info) are used only for status.

## Page by page

| Page | Before | After | Still worth doing |
|---|---|---|---|
| Dashboard | Text lists of incidents, runs, payments | "Control center" with 8 KPI tiles (MRR, Bots working, failed runs, past due), a 14-day runs chart, fleet health bar with per-server lights, one unified "Needs attention" queue, payments, and an activity timeline | Date range switcher |
| Clients | Wide table | Card grid: tone edge, MRR/Bots/approvals, 14-day run bars, server lights, badges. Table still available via toggle. Sort by "needs attention first" | Saved views |
| Bots | Flat table, client repeated per row, separate Error column | Status bar with filters; rows grouped by client with avatar and "N of M on"; model chip; error shown under status | Bulk pause/resume |
| Runs | Unbounded list | KPIs (7-day runs, success rate, median time, model cost), runs per day chart, chips with counts, paginated (30, then "Show 50 more") | Run detail redesign |
| Requests | Table | Kanban board (New, Reviewing, In progress, Waiting on client, Done in 30 days) with priority edges, avatars, assignee. List view kept | Drag between lanes |
| Approvals | Table | Chip counts added | Card layout like the client portal |
| Automations | Always-open form, stacked buttons | KPI row, chips with counts, "New automation" opens a collapsible form, actions in one row | Next-run timeline |
| Integrations | One long table | Status bar, one panel per client (problems first), provider rows with status and a Check button | Reconnect flow |
| Infrastructure | Table of runtimes | Card per server: server/engine/tunnel/backup lights, disk meter, heartbeat and backup ages, versions, actions; deployment history timeline | Disk trend chart |
| Usage | Several tables | 5 KPIs, "Margin by client" and "Model cost by Bot" bars; detail tables in a disclosure | Month-over-month comparison |
| Monitoring | Table of incidents | Severity bar, incident cards with "Client sees" callout and Investigating/Resolve/Ignore buttons; logs table kept | Log search |
| Billing | Wide table | KPIs (MRR, outstanding with past-due meter, received this month, margin), payment-status bar, slimmer table with avatars | Aging buckets chart |
| Skills | Table | Card per skill: version, read-only/writes, stale-version warning, allowed Bot types, assignments | |
| Audit log | Plain table | Actor avatar and action chip | Filters by actor/action |
| Settings | Form | Unchanged | Group into sections |

## Next candidates

Client detail, Bot detail and Run detail pages have not been redesigned yet. They should reuse the same primitives.

## Seeing it locally

Reset demo data (Settings, then Reset demo data, or delete `.platform-data/demo-state.json`), run `npm run demo`, and sign in as admin@agenticbots.demo. The seed now includes 2 weeks of routine runs so the charts have shape.
