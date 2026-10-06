/**
 * The AgenticBots service catalog — the single source of truth.
 *
 * Two pillars (Marketing = demand creation, Sales = revenue capture),
 * thirteen categories beneath them. Every service page, the mega menu,
 * the footer sitemap and sitemap.ts read from this file. Nothing else
 * hardcodes a service name or URL.
 */

import { z } from "zod";

export type PillarSlug = "marketing" | "sales";

export interface Highlight { title: string; body: string }
export interface Faq { q: string; a: string }
export interface Metric { value: string; label: string }

export interface Contrast { today: string; after: string }

export interface Category {
  /** Zero-padded index. Drives the numeral system that replaced icons. */
  index: string;
  slug: string;
  name: string;
  pillar: PillarSlug;
  /** The mass-market handle, e.g. "Ads Bot". */
  botName: string;
  /** One line. Used in nav, cards and meta descriptions. */
  blurb: string;
  /** Plain-English promise. Used as the page's hero subhead. */
  outcome: string;
  headline: string;
  intro: string;
  /** The full capability list, rendered as a checklist. */
  capabilities: string[];
  highlights: Highlight[];
  metrics: Metric[];
  /** Three before/after pairs. The most persuasive block on the page. */
  contrast: Contrast[];
  /** Four jobs for the hero factory scene. Kept short — they render inside
      a fixed-width station box, and SVG text does not wrap. */
  stations: { label: string; meta: string }[];
  faqs: Faq[];
}

export interface Pillar {
  slug: PillarSlug;
  name: string;
  tagline: string;
  /** One short line. Nav rows only — `intro` is far too long there. */
  menuBlurb: string;
  headline: string;
  intro: string;
  categories: Category[];
}

/* ─────────────────────────────  MARKETING  ───────────────────────────── */

const MARKETING: Category[] = [
  {
    index: "01",
    slug: "paid-media",
    name: "Paid Media / PPC",
    pillar: "marketing",
    botName: "Ads Bot",
    blurb: "Campaigns built, launched and tuned every day — not once a quarter.",
    outcome: "Your ad budget goes to the searches that actually book work.",
    headline: "Ads that get watched every day, not every quarter.",
    intro:
      "Most ad accounts are set up once and then left alone. Ads Bot reads the search terms, the spend and the conversions daily, kills what is wasting money, and shifts budget toward what is booking jobs.",
    capabilities: [
      "Google Search campaign build + management",
      "Google Shopping / Performance Max",
      "Meta (Facebook/Instagram) ad creation + optimization",
      "LinkedIn Ads",
      "TikTok / YouTube / Pinterest ads",
      "Programmatic / display / retargeting",
      "Ad creative generation (copy + image variants)",
      "Bid management and budget pacing",
      "A/B testing ad variations",
      "Landing page creation for campaigns",
      "UTM tagging and attribution tracking",
    ],
    highlights: [
      { title: "Daily search-term review", body: "Every query that triggered an ad gets read. Junk gets a negative keyword before it burns another day of budget, not at the end of the month." },
      { title: "Creative that keeps coming", body: "New headline, copy and image variants generated and rotated in continuously, so performance does not decay while you wait on a designer." },
      { title: "Budget that follows results", body: "Spend moves toward the campaigns, ad groups and hours of day that produce booked work — automatically, with a ceiling you set." },
      { title: "A landing page per offer", body: "Clicks land on a page built to answer the one question they arrived with, instead of a homepage that makes them hunt." },
    ],
    metrics: [
      { value: "Daily", label: "Search-term and bid review" },
      { value: "24/7", label: "Budget pacing and anomaly alerts" },
      { value: "1 view", label: "Spend, leads, cost per booked job" },
    ],
    stations: [
      { label: "Reading search terms", meta: "Every query, daily" },
      { label: "Killing wasted spend", meta: "Negatives before noon" },
      { label: "Writing new ads", meta: "Variants on rotation" },
      { label: "Moving the budget", meta: "Toward booked work" },
    ],
    contrast: [
      { today: "Search terms get reviewed when someone remembers. Budget burns on junk queries for weeks.", after: "Every query that triggered an ad is read daily. Junk gets a negative before it costs a second day." },
      { today: "One set of ads runs until performance decays and somebody notices.", after: "New headline, copy and image variants generated and rotated continuously." },
      { today: "Clicks land on a homepage and hunt for the phone number.", after: "Each offer gets a page built to answer the one question the click arrived with." },
    ],
    faqs: [
      { q: "Do you need access to my ad accounts?", a: "Yes — read and write access to the accounts you want managed. You stay the owner of every account and can revoke access at any time." },
      { q: "What if I have no campaigns yet?", a: "Then we build from zero: keyword research, campaign structure, ad copy, conversion tracking and landing pages. First campaigns are usually live inside two weeks." },
      { q: "Is my ad spend included?", a: "No. You pay platforms directly, so your spend stays yours and fully visible. We manage the account on top of it." },
    ],
  },
  {
    index: "02",
    slug: "seo",
    name: "SEO",
    pillar: "marketing",
    botName: "SEO Bot",
    blurb: "Technical fixes, keyword coverage and pages that rank — continuously.",
    outcome: "You show up when someone searches for what you sell.",
    headline: "Rankings are maintenance, not a project.",
    intro:
      "SEO fails when it is treated as a one-time audit. SEO Bot crawls your site on a schedule, catches what broke, writes the pages you are missing, and tracks whether any of it moved.",
    capabilities: [
      "Technical site audits (crawl errors, speed, schema)",
      "Keyword research and clustering",
      "On-page optimization (title tags, meta, headers, internal links)",
      "Content brief creation",
      "Long-form content writing",
      "Programmatic SEO (templated pages at scale)",
      "Local SEO / Google Business Profile management",
      "Link building outreach",
      "Rank tracking and reporting",
      "Competitor gap analysis",
    ],
    highlights: [
      { title: "A crawl that never stops", body: "Broken links, missing schema, slow pages and orphaned URLs are caught on a schedule and fixed, instead of discovered a year later." },
      { title: "The gap between you and page one", body: "Competitor coverage is mapped against yours so you can see exactly which topics they own and you do not." },
      { title: "Pages at scale, not filler", body: "Programmatic templates cover service-by-location and question-based searches with pages built to actually answer, not to pad a count." },
      { title: "Local presence handled", body: "Google Business Profile posts, categories, service areas, photos and review responses kept current week over week." },
    ],
    metrics: [
      { value: "Weekly", label: "Full technical crawl" },
      { value: "Daily", label: "Rank tracking across your keyword set" },
      { value: "Monthly", label: "Competitor gap refresh" },
    ],
    stations: [
      { label: "Crawling your site", meta: "Nightly, every page" },
      { label: "Fixing what broke", meta: "Links, speed, schema" },
      { label: "Writing the pages", meta: "The ones you lack" },
      { label: "Watching rankings", meta: "Movement, not vanity" },
    ],
    contrast: [
      { today: "An audit lands once a year, gets read, and the fixes never ship.", after: "The site is crawled on a schedule and what broke gets fixed the same week." },
      { today: "You find out a competitor owns a topic when a customer mentions them.", after: "Coverage gaps are mapped continuously, ranked by what closing them is worth." },
      { today: "Nobody has time to write the two hundred pages the search demand justifies.", after: "Templated pages cover service-by-location and question searches, each built to actually answer." },
    ],
    faqs: [
      { q: "How long until I see movement?", a: "Technical fixes can show up in weeks. New content and authority typically take three to six months. Anyone promising page one in thirty days is selling something else." },
      { q: "Do you write the content or just brief it?", a: "Both. You choose. Some teams want briefs their own writers execute; most want the full draft delivered ready to review." },
      { q: "Will the pages read like AI wrote them?", a: "They are drafted by BOTS and reviewed before publishing. Thin, generic pages hurt rankings, so the quality gate is the whole point." },
    ],
  },
  {
    index: "03",
    slug: "content",
    name: "Content Marketing",
    pillar: "marketing",
    botName: "Content Bot",
    blurb: "A calendar that fills itself, in your voice, across every format.",
    outcome: "You publish consistently without hiring a content team.",
    headline: "One idea becomes eight assets.",
    intro:
      "The hard part of content is not writing it once — it is publishing every week for a year. Content Bot runs the calendar, drafts the work, and turns each piece into everything downstream of it.",
    capabilities: [
      "Blog strategy and editorial calendar",
      "Article and guide writing",
      "Case study creation",
      "White paper / ebook production",
      "Infographic and visual asset creation",
      "Content repurposing (blog → social → email → video script)",
      "Podcast show notes and transcription",
      "Video scripting",
    ],
    highlights: [
      { title: "Repurposing on rails", body: "One long-form piece becomes social posts, an email, a video script and a set of graphics — automatically, the day it publishes." },
      { title: "Your voice, captured once", body: "We build a voice profile from your existing writing and calls, so drafts sound like your business rather than a template." },
      { title: "Case studies that get written", body: "The asset every business wants and never finishes. Interview questions, draft, and layout handled end to end." },
      { title: "A calendar you can see", body: "What is planned, drafted, in review and published — visible at all times, not living in someone's head." },
    ],
    metrics: [
      { value: "Many", label: "Assets cut from one source piece" },
      { value: "Weekly", label: "Publishing cadence, held" },
      { value: "1", label: "Voice profile, applied everywhere" },
    ],
    stations: [
      { label: "Turning one into ten", meta: "Every source piece" },
      { label: "Holding the calendar", meta: "Weekly, without fail" },
      { label: "Keeping your voice", meta: "Captured once, reused" },
      { label: "Filing everything", meta: "Where the team looks" },
    ],
    contrast: [
      { today: "A post goes up in January. The next one goes up when someone feels guilty.", after: "The calendar is planned, drafted and published on cadence without anybody chasing it." },
      { today: "A long piece is written once and never used again.", after: "It becomes social posts, an email, a video script and graphics the day it publishes." },
      { today: "Case studies stay on the wish list for two years.", after: "Interview questions, draft and layout handled end to end, so they actually get finished." },
    ],
    faqs: [
      { q: "Do I have to review every piece?", a: "You approve on whatever level you want — every piece, weekly batches, or only new formats. Most teams start with full review and loosen it after a month." },
      { q: "Can it write about a technical field?", a: "Yes, with source material. We pull from your existing docs, recorded calls and subject-matter interviews rather than inventing expertise." },
      { q: "Who owns the content?", a: "You do, entirely — including the voice profile and every draft, published or not." },
    ],
  },
  {
    index: "04",
    slug: "email",
    name: "Email Marketing",
    pillar: "marketing",
    botName: "Email Bot",
    blurb: "Sequences that follow up forever so you never have to remember.",
    outcome: "Every lead gets followed up with, whether or not you have time.",
    headline: "The follow-up you keep meaning to send.",
    intro:
      "Most revenue lost in email is not lost to bad copy — it is lost to sequences nobody ever built. Email Bot writes them, sends them, and stops them the moment a lead converts.",
    capabilities: [
      "List building and lead magnet creation",
      "Welcome sequence design",
      "Newsletter writing and sending",
      "Drip / nurture campaign builds",
      "Segmentation and list hygiene",
      "A/B subject line and send-time testing",
      "Re-engagement and win-back campaigns",
      "Deliverability monitoring",
    ],
    highlights: [
      { title: "Quote follow-up that stops itself", body: "Every unaccepted quote gets a timed nudge sequence that shuts off automatically the second the job is booked." },
      { title: "Deliverability watched", body: "SPF, DKIM, DMARC, bounce rates and spam complaints monitored, so your sends keep landing in the inbox." },
      { title: "Lists that stay clean", body: "Hard bounces removed, dead contacts sunset, and segments rebuilt from live CRM data instead of a stale export." },
      { title: "Tested, not guessed", body: "Subject lines and send times tested against your actual list, with winners rolled forward automatically." },
    ],
    metrics: [
      { value: "0", label: "Quotes that go unfollowed" },
      { value: "Auto", label: "Sequence exit the moment a lead converts" },
      { value: "Weekly", label: "Deliverability and list health check" },
    ],
    stations: [
      { label: "Sorting the list", meta: "By what they did" },
      { label: "Sending the follow-up", meta: "Not just the blast" },
      { label: "Rewriting subjects", meta: "What actually opens" },
      { label: "Watching deliverability", meta: "Before it slips" },
    ],
    contrast: [
      { today: "Quotes go out and nobody follows up unless the customer calls first.", after: "Every unaccepted quote gets a timed nudge that stops the moment the job is booked." },
      { today: "The list is a stale export somebody made last year.", after: "Segments rebuild from live CRM data, bounces are removed, dead contacts sunset." },
      { today: "Sends land in spam and nobody knows why.", after: "SPF, DKIM, DMARC, bounce rate and complaints are monitored before deliverability slips." },
    ],
    faqs: [
      { q: "Which email platform do you work in?", a: "Yours. MailerLite, Klaviyo, HubSpot, ActiveCampaign, Mailchimp and most others. If you have none, we will recommend one that fits your list size." },
      { q: "Will this hurt my sender reputation?", a: "The opposite is the goal — list hygiene and deliverability monitoring are part of the build specifically to protect it." },
      { q: "Can it email my existing customer list?", a: "Yes, provided the list is opted in. We segment by service history and lifecycle stage so people get relevant messages." },
    ],
  },
  {
    index: "05",
    slug: "cro",
    name: "Conversion Rate Optimization",
    pillar: "marketing",
    botName: "Conversion Bot",
    blurb: "Turn more of the traffic you already pay for into actual leads.",
    outcome: "More of your existing visitors turn into calls and forms.",
    headline: "The cheapest lead is the visitor you already have.",
    intro:
      "You are already paying for the traffic. Conversion Bot watches what visitors actually do on the page, finds where they hesitate, and tests fixes against live traffic instead of opinion.",
    capabilities: [
      "Heatmap and session recording analysis",
      "A/B and multivariate testing",
      "Form optimization",
      "Checkout and funnel flow redesign",
      "Pricing page testing",
      "Pop-up and exit-intent offers",
      "Page speed optimization",
      "Personalization (dynamic content by segment)",
    ],
    highlights: [
      { title: "Recordings, actually watched", body: "Session replays and heatmaps reviewed at volume to find the exact scroll depth and form field where people give up." },
      { title: "Forms cut to the bone", body: "Every field you do not need to follow up is a lead you lose. Forms trimmed to what actually matters, then tested." },
      { title: "Mobile treated as primary", body: "Tap targets, load speed and click-to-call placement fixed for the phone, where most of your traffic already is." },
      { title: "Tested before it ships", body: "Changes run as structured tests against live traffic. Winners stay, losers revert, and you see which was which." },
    ],
    metrics: [
      { value: "Always on", label: "Heatmap and session capture" },
      { value: "Per test", label: "Statistical significance before rollout" },
      { value: "Mobile", label: "First, not last" },
    ],
    stations: [
      { label: "Reading the drop-off", meta: "Where they leave" },
      { label: "Shipping the test", meta: "Not planning it" },
      { label: "Cutting form fields", meta: "The ones nobody needs" },
      { label: "Calling the winner", meta: "On the numbers" },
    ],
    contrast: [
      { today: "You pay for the traffic and guess why it does not convert.", after: "Session replays and heatmaps show the exact field and scroll depth where people give up." },
      { today: "The form asks for eleven things because someone added a field in 2021.", after: "Forms are cut to what you actually need to follow up, then tested against live traffic." },
      { today: "The site was checked on a phone once, at launch.", after: "Tap targets, load speed and click-to-call are built for mobile first, where the traffic is." },
    ],
    faqs: [
      { q: "Do I need a lot of traffic for testing?", a: "For A/B tests, yes — a few thousand sessions a month minimum. Below that we make evidence-based fixes from recordings rather than run underpowered tests." },
      { q: "Will you redesign my whole site?", a: "Not unless it is the actual problem. Most gains come from the first screen, the form and the mobile experience." },
      { q: "Who implements the changes?", a: "We do, on your site, with your review before anything goes live." },
    ],
  },
  {
    index: "06",
    slug: "analytics",
    name: "Analytics & Reporting",
    pillar: "marketing",
    botName: "Analytics Bot",
    blurb: "One view of what you spent and what it produced.",
    outcome: "You know which channel is paying for itself and which is not.",
    headline: "Reporting you can actually read.",
    intro:
      "Fifteen dashboards is the same as none. Analytics Bot connects spend to pipeline to revenue and reports it in a single view you can open in under a minute.",
    capabilities: [
      "Dashboard setup (GA4, Looker, etc.)",
      "Attribution modeling",
      "Marketing mix modeling",
      "Weekly / monthly performance reporting",
      "Forecasting spend vs. pipeline",
      "Funnel drop-off analysis",
    ],
    highlights: [
      { title: "Spend tied to booked revenue", body: "Not impressions and click-through rate. Cost per lead and cost per closed job, per channel, per campaign." },
      { title: "Attribution that survives scrutiny", body: "Multi-touch models set up properly so the last-click channel stops taking credit for everything upstream of it." },
      { title: "Drop-off, located", body: "Funnel analysis that names the specific step losing you the most people, ranked by what fixing it is worth." },
      { title: "Reports that arrive", body: "Weekly and monthly summaries delivered to your inbox in plain language, without you logging into anything." },
    ],
    metrics: [
      { value: "1", label: "Dashboard, not fifteen" },
      { value: "Weekly", label: "Plain-language performance summary" },
      { value: "Channel", label: "Level cost-per-booked-job visibility" },
    ],
    stations: [
      { label: "Joining the sources", meta: "Ads, CRM, calls" },
      { label: "Naming the truth", meta: "One number, agreed" },
      { label: "Flagging the change", meta: "Before you ask" },
      { label: "Writing the report", meta: "Monday, automatically" },
    ],
    contrast: [
      { today: "Fifteen dashboards, and no one can say which channel paid for itself.", after: "One view: spend, leads, cost per lead and cost per closed job, per channel." },
      { today: "Last-click takes credit for everything upstream of it.", after: "Multi-touch attribution set up properly, so the channels that started deals get counted." },
      { today: "Reporting means someone exports spreadsheets on a Friday.", after: "Weekly and monthly summaries arrive written in plain language, no login required." },
    ],
    faqs: [
      { q: "Do you replace GA4?", a: "No — we configure it properly and put a readable layer on top, alongside your ad platforms and CRM." },
      { q: "Can you report on offline closes?", a: "Yes, if your CRM records them. That connection is usually the highest-value piece of the whole setup." },
      { q: "What if my tracking is currently broken?", a: "Very common. Fixing conversion tracking is normally the first thing we do, because every other number depends on it." },
    ],
  },
];

/* ───────────────────────────────  SALES  ─────────────────────────────── */

const SALES: Category[] = [
  {
    index: "07",
    slug: "lead-generation",
    name: "Lead Generation",
    pillar: "sales",
    botName: "Prospecting Bot",
    blurb: "Build and enrich the list of people actually worth contacting.",
    outcome: "You always have a list of qualified people to reach out to.",
    headline: "Stop selling to whoever answers.",
    intro:
      "Outbound fails on the list far more often than on the message. Prospecting Bot defines who is worth contacting, finds them, enriches them, and watches for signals that now is the moment.",
    capabilities: [
      "ICP definition and TAM mapping",
      "Contact list building and enrichment",
      "Intent data monitoring",
      "LinkedIn prospecting",
      "Cold email copywriting and sequencing",
      "Cold call scripting",
      "Direct mail / gifting campaigns",
    ],
    highlights: [
      { title: "Your ICP, written down", body: "Firmographics, triggers and disqualifiers defined explicitly, so the list stops filling with people who will never buy." },
      { title: "Enriched, not just scraped", body: "Names, roles, direct contacts, tech stack and company signals appended, then verified before anyone gets contacted." },
      { title: "Timing signals", body: "Hiring posts, funding, expansion, tech changes and site visits monitored so outreach lands when there is a reason to." },
      { title: "Scripts built from real calls", body: "Cold call and email copy written from what actually gets responses in your market, then revised on the data." },
    ],
    metrics: [
      { value: "Verified", label: "Every contact before outreach" },
      { value: "Continuous", label: "Intent and trigger monitoring" },
      { value: "1", label: "Documented ICP everyone works from" },
    ],
    stations: [
      { label: "Building the list", meta: "Fit, not volume" },
      { label: "Verifying contacts", meta: "Before you burn one" },
      { label: "Watching for triggers", meta: "Hiring, funding, moves" },
      { label: "Queuing the outreach", meta: "Ready when you are" },
    ],
    contrast: [
      { today: "The list is whoever came up in a search, contacted in whatever order.", after: "An explicit ICP with firmographics, triggers and disqualifiers everyone works from." },
      { today: "Contacts are scraped, half the emails bounce, the domain takes the damage.", after: "Records are enriched from licensed sources and verified before anyone is contacted." },
      { today: "You reach out on a Tuesday because it is Tuesday.", after: "Hiring posts, funding, expansion and site visits are watched, so outreach lands with a reason." },
    ],
    faqs: [
      { q: "Where does the contact data come from?", a: "Licensed enrichment providers and public sources, verified before use. We do not buy scraped lists of unknown origin." },
      { q: "Is this compliant?", a: "Outreach is built to respect CAN-SPAM, GDPR and CASL depending on where you sell. Opt-outs are honored automatically." },
      { q: "Do I need a big market for this to work?", a: "No. Small, tightly-defined markets usually perform better because the targeting can be much more specific." },
    ],
  },
  {
    index: "08",
    slug: "outbound",
    name: "Outbound Execution",
    pillar: "sales",
    botName: "Outbound Bot",
    blurb: "Multi-channel sequences that run and follow up without you.",
    outcome: "Consistent outreach goes out whether or not anyone remembers.",
    headline: "The cadence nobody forgets to run.",
    intro:
      "Outbound dies at step three, when the person running it gets busy. Outbound Bot runs every sequence to completion across email, LinkedIn and phone, and sorts the replies as they come in.",
    capabilities: [
      "Multi-channel outreach sequences (email + LinkedIn + phone)",
      "Inbox warm-up and sending-domain health",
      "Reply detection and sentiment sorting",
      "Meeting booking and calendar coordination",
      "Follow-up cadence management",
    ],
    highlights: [
      { title: "Every step, every time", body: "Sequences run to the last touch. No lead falls out because the week got busy." },
      { title: "Inboxes warmed properly", body: "Domains, sending accounts and volume ramped correctly so your outreach lands rather than getting filtered." },
      { title: "Replies sorted for you", body: "Interested, not now, wrong person and unsubscribe separated automatically. You only see the ones worth your time." },
      { title: "Meetings booked into your calendar", body: "Time zones, buffers and availability handled, with the context from the thread attached to the invite." },
    ],
    metrics: [
      { value: "Every", label: "Step of the sequence, actually sent" },
      { value: "Auto", label: "Reply triage and sentiment sorting" },
      { value: "Warmed", label: "Sending infrastructure, monitored" },
    ],
    stations: [
      { label: "Sending the sequence", meta: "Every step, on time" },
      { label: "Reading the replies", meta: "Sorting real interest" },
      { label: "Warming the domains", meta: "So you land in inbox" },
      { label: "Booking the meeting", meta: "Straight to calendar" },
    ],
    contrast: [
      { today: "Sequences die at step three when the person running them gets busy.", after: "Every sequence runs to the last touch, across email, LinkedIn and phone." },
      { today: "Volume goes up, the sending domain gets burned, and the main domain goes with it.", after: "Separate sending domains, warmed properly, bounce rate capped and monitored." },
      { today: "Replies pile up in one inbox and get triaged whenever.", after: "Interested, not now, wrong person and unsubscribe are sorted automatically." },
    ],
    faqs: [
      { q: "Will this get my domain blacklisted?", a: "Not if it is set up right. We send from separate domains, warm them properly and cap volume — protecting your primary domain is the point." },
      { q: "Does a real person write the replies?", a: "The bot handles routine replies and scheduling. Anything with buying intent or nuance is routed to you with full context." },
      { q: "Can it work my existing CRM list?", a: "Yes — re-engaging dormant CRM contacts is usually the fastest win before any cold list gets touched." },
    ],
  },
  {
    index: "09",
    slug: "inbound",
    name: "Inbound Lead Handling",
    pillar: "sales",
    botName: "Speed-to-Lead Bot",
    blurb: "Every call, form and chat answered in seconds, day or night.",
    outcome: "You stop losing leads to whoever called them back first.",
    headline: "The first to answer wins the job.",
    intro:
      "A lead that waits an hour is calling your competitor. Speed-to-Lead Bot answers every inbound within seconds, qualifies in real conversation, and books straight onto your calendar.",
    capabilities: [
      "Speed-to-lead response",
      "Lead scoring and qualification",
      "Form and chat inquiry routing",
      "Demo / consultation scheduling",
      "Lead-to-account matching",
    ],
    highlights: [
      { title: "Missed-call text-back", body: "A missed call gets an immediate text that starts qualifying — before your competitor's voicemail even picks up." },
      { title: "Real conversation, not a decision tree", body: "The BOT answers questions, asks the qualifying ones back, and knows when to hand off to a human instead of guessing." },
      { title: "Booked, not just captured", body: "Qualified leads land on your real calendar with service-area and buffer rules applied, not a generic scheduling link." },
      { title: "Scored on the way in", body: "Every lead ranked by fit and urgency so your team works the ones worth working first." },
    ],
    metrics: [
      { value: "<60s", label: "Typical first response, any hour" },
      { value: "24/7", label: "Nights, weekends and holidays covered" },
      { value: "0", label: "Inbound leads left unanswered" },
    ],
    stations: [
      { label: "Catching the call", meta: "Missed means texted" },
      { label: "Answering the question", meta: "In real conversation" },
      { label: "Qualifying on fit", meta: "Before your time goes" },
      { label: "Booking the slot", meta: "On the right calendar" },
    ],
    contrast: [
      { today: "A missed call at 6pm gets returned at 9am. The job is already booked elsewhere.", after: "A text goes back within seconds and starts qualifying before a competitor picks up." },
      { today: "A form fill sits in an inbox until end of day.", after: "It gets a real reply in under a minute, at any hour, including weekends." },
      { today: "Everyone works whichever lead is loudest.", after: "Every lead is scored on fit and urgency, so the team works the ones worth working." },
    ],
    faqs: [
      { q: "Will customers know it is a bot?", a: "It never claims to be a person. It is fast, useful and hands off to a human the moment the conversation needs one." },
      { q: "What if it cannot answer something?", a: "It escalates. Clear rules define what gets handed to a human, and it follows them rather than improvising." },
      { q: "Does this work with my phone system?", a: "It connects to most SMS and VoIP providers. If yours is unusual we confirm compatibility before anything is scoped." },
    ],
  },
  {
    index: "10",
    slug: "crm",
    name: "CRM Management",
    pillar: "sales",
    botName: "CRM Bot",
    blurb: "Records created, stages updated and data cleaned without manual entry.",
    outcome: "Your pipeline is accurate without anyone updating it by hand.",
    headline: "A CRM that is actually current.",
    intro:
      "Nobody updates the CRM, so nobody trusts the CRM. CRM Bot logs every call, email and meeting, moves deals through stages on real signals, and cleans the duplicates nobody has time for.",
    capabilities: [
      "Contact and deal record creation",
      "Pipeline stage updates",
      "Activity logging (calls, emails, meetings)",
      "Duplicate merging and data cleanup",
      "Custom field and workflow automation",
      "Deal velocity and aging alerts",
    ],
    highlights: [
      { title: "Zero manual entry", body: "Calls, emails and meetings logged against the right record automatically, with the notes attached." },
      { title: "Stages that reflect reality", body: "Deals advance on real signals — a proposal sent, a meeting held — not on someone remembering to drag a card." },
      { title: "Duplicates handled", body: "Merged on a schedule with clear rules, so your reporting stops counting the same company three times." },
      { title: "Aging deals surfaced", body: "Anything stuck too long in a stage triggers an alert before it quietly dies." },
    ],
    metrics: [
      { value: "Auto", label: "Activity logging on every touch" },
      { value: "Daily", label: "Duplicate and hygiene pass" },
      { value: "Alerted", label: "Stalled deals, before they go cold" },
    ],
    stations: [
      { label: "Logging the call", meta: "Nobody types it up" },
      { label: "Moving the stage", meta: "When the work moves" },
      { label: "Merging duplicates", meta: "Quietly, in the night" },
      { label: "Flagging stale deals", meta: "Before they die" },
    ],
    contrast: [
      { today: "Nobody updates the CRM, so nobody trusts it, so nobody updates it.", after: "Calls, emails and meetings log themselves against the right record automatically." },
      { today: "Deals sit in a stage because nobody dragged the card.", after: "Stages advance on real signals — a proposal sent, a meeting held." },
      { today: "The same company appears three times and the forecast counts it three times.", after: "Duplicates are merged on a schedule with explicit rules." },
    ],
    faqs: [
      { q: "Which CRMs do you support?", a: "HubSpot, Salesforce, Pipedrive, Close, GoHighLevel, Zoho and most others with an open API." },
      { q: "Will it overwrite what my reps entered?", a: "No. Human-entered data wins by default; the bot fills gaps and flags conflicts rather than silently replacing anything." },
      { q: "What if our CRM data is a mess right now?", a: "Cleanup is normally the first phase. There is no point automating on top of records nobody trusts." },
    ],
  },
  {
    index: "11",
    slug: "enablement",
    name: "Sales Enablement",
    pillar: "sales",
    botName: "Proposal Bot",
    blurb: "Quotes, proposals and contracts generated the same day they are asked for.",
    outcome: "Proposals go out in minutes instead of sitting for a week.",
    headline: "The proposal that goes out today.",
    intro:
      "Deals cool while proposals sit unwritten. Proposal Bot builds the quote, the contract and the business case from your pricing and the deal record, ready to send the same day.",
    capabilities: [
      "Proposal and quote generation",
      "Contract and e-signature workflows",
      "Competitive battle cards",
      "Objection handling playbooks",
      "ROI calculators and business case builders",
      "Mutual action plans",
    ],
    highlights: [
      { title: "Quotes from your real pricing", body: "Generated off your rate card and the deal record, so the numbers are right and the format is consistent." },
      { title: "Signature to close", body: "E-signature flows wired end to end, with reminders on unsigned documents and the CRM updated on completion." },
      { title: "Battle cards that stay current", body: "Competitor positioning and objection responses updated as the market moves, not written once in 2022." },
      { title: "The business case, built", body: "ROI models your buyer can take to their own decision-maker, filled in with their numbers rather than generic ones." },
    ],
    metrics: [
      { value: "Same day", label: "Proposal turnaround" },
      { value: "Auto", label: "Signature reminders and CRM updates" },
      { value: "Current", label: "Battle cards, continuously refreshed" },
    ],
    stations: [
      { label: "Building the quote", meta: "Minutes, not a week" },
      { label: "Chasing the signature", meta: "Politely, repeatedly" },
      { label: "Keeping the pricing", meta: "One source of truth" },
      { label: "Filing the paperwork", meta: "Where it belongs" },
    ],
    contrast: [
      { today: "A quote takes four days because the person who knows the pricing is travelling.", after: "It is generated from your rate card and the deal record the same day it is asked for." },
      { today: "Signed contracts go missing between an inbox and a folder.", after: "E-signature runs end to end with reminders, and the CRM updates on completion." },
      { today: "Objection answers live in the head of your best rep.", after: "Battle cards and objection playbooks are written down and kept current as the market moves." },
    ],
    faqs: [
      { q: "Can it use our existing proposal template?", a: "Yes. We build from your template and pricing so output looks like yours, only faster." },
      { q: "Which e-signature tools work?", a: "DocuSign, PandaDoc, Dropbox Sign and most others with an API." },
      { q: "Does a human review before it sends?", a: "By default yes. Some teams enable auto-send for standard quotes under a threshold they set." },
    ],
  },
  {
    index: "12",
    slug: "reviews",
    name: "Review Generation",
    pillar: "sales",
    botName: "Reviews Bot",
    blurb: "Every finished job asked for a Google review, every review answered.",
    outcome: "More five-star reviews, so you win the map pack and the comparison.",
    headline: "The reviews you already earned.",
    intro:
      "Most happy customers never leave a review because nobody asked at the right moment. Reviews Bot asks every one of them by text the day the job closes, answers every review that comes in, and sends the unhappy ones to you before they go public.",
    capabilities: [
      "Review requests by text when a job is marked done",
      "One-tap links straight to your Google review form",
      "A polite reminder for anyone who did not respond",
      "Replies written for every new review, in your voice",
      "Unhappy customers routed to you before they post",
      "Review count and rating tracked against local competitors",
    ],
    highlights: [
      { title: "Asked at the right moment", body: "The request goes out the day the job closes, while the crew's name is still fresh, not three weeks later in a newsletter." },
      { title: "One tap to Google", body: "The text links straight to your review form. No searching for your listing, no account confusion." },
      { title: "Every review answered", body: "Thank-yous for the good ones and calm, specific replies to the rough ones, drafted in your voice and posted on your rules." },
      { title: "Problems caught privately", body: "A quick satisfaction check runs first. Anyone unhappy reaches you directly, so you can fix it before it turns into a one-star review." },
    ],
    metrics: [
      { value: "Day 0", label: "Review request after every finished job" },
      { value: "100%", label: "Of new reviews get a reply" },
      { value: "Private", label: "Unhappy customers reach you first" },
    ],
    stations: [
      { label: "Job marked done", meta: "The trigger" },
      { label: "Asking for the review", meta: "By text, same day" },
      { label: "Replying to reviews", meta: "Every single one" },
      { label: "Flagging a problem", meta: "Before it posts" },
    ],
    contrast: [
      { today: "You ask for reviews when you remember, which is almost never.", after: "Every finished job gets a request by text the same day, with a one-tap link." },
      { today: "Reviews sit unanswered for months, good and bad.", after: "Every review gets a reply in your voice within a day." },
      { today: "You find out a customer was unhappy from a one-star review.", after: "A quick check-in reaches them first, and you hear about it privately." },
    ],
    faqs: [
      { q: "Is it allowed to filter out unhappy customers?", a: "We never block anyone from leaving a review. Unhappy customers are offered a direct line to you first, and can still post publicly. That keeps you within Google's rules." },
      { q: "How does it know a job is done?", a: "From your CRM, field service app or invoicing tool, whichever marks the job closed. If you use none of those, a one-tap text from your crew works too." },
      { q: "Do you post replies without my approval?", a: "Your call. Most owners approve the first few weeks of replies, then let positive ones post automatically and keep approval on the rest." },
    ],
  },
  {
    index: "13",
    slug: "reactivation",
    name: "Customer Reactivation",
    pillar: "sales",
    botName: "Reactivation Bot",
    blurb: "Past customers and old estimates turned back into booked work.",
    outcome: "Repeat work from customers you already have, without buying a single lead.",
    headline: "The customers you already have.",
    intro:
      "Your cheapest next job is sitting in your customer list. Reactivation Bot works it: seasonal tune-ups, maintenance reminders, warranty check-ins and a friendly follow-up on every estimate that never turned into a job.",
    capabilities: [
      "Seasonal tune-up and maintenance reminders",
      "Follow-up on old estimates that never booked",
      "Service anniversary and warranty check-ins",
      "Past-customer campaigns by text and email",
      "Replies handled and appointments booked automatically",
      "Do-not-contact and opt-outs respected on every send",
    ],
    highlights: [
      { title: "Your list, finally worked", body: "Every past customer and every old estimate gets a reason to hear from you, on a schedule that fits your trade and season." },
      { title: "Timed to the season", body: "AC tune-ups before the heat, furnace checks before the cold, gutter and roof checks after storm season. The calendar runs itself." },
      { title: "Replies turn into bookings", body: "When someone answers, the bot handles the back-and-forth and puts the appointment on your calendar, the same way Speed-to-Lead does." },
      { title: "No ad spend required", body: "These are people who already know you. It is the highest-return campaign most contractors never run." },
    ],
    metrics: [
      { value: "$0", label: "Ad spend for repeat work" },
      { value: "Seasonal", label: "Reminders timed to your trade" },
      { value: "Booked", label: "Replies go straight to the calendar" },
    ],
    stations: [
      { label: "Reading your list", meta: "Who is due" },
      { label: "Sending the reminder", meta: "Timed to the season" },
      { label: "Handling the reply", meta: "Questions answered" },
      { label: "Booking the visit", meta: "On your calendar" },
    ],
    contrast: [
      { today: "Past customers hear from you when they call you.", after: "Every one gets a well-timed reminder before they need to think about it." },
      { today: "Estimates that did not close are forgotten after one follow-up.", after: "They get a friendly check-in weeks later, when timing or budget may have changed." },
      { today: "Slow season means waiting for the phone to ring.", after: "Your own customer list fills the calendar first." },
    ],
    faqs: [
      { q: "How old can the list be?", a: "Any age. Older contacts get cleaned and verified before anything sends, so you are not texting numbers that changed hands." },
      { q: "Is texting past customers legal?", a: "With the right consent, yes. We check how each contact was collected, register your texting number, honor every opt-out and use email where text consent is missing." },
      { q: "Will it annoy my customers?", a: "It sends a few well-timed messages a year, not a weekly blast. Anyone who replies stop is never contacted again." },
    ],
  },
];

/* ─────────────────────────────  ASSEMBLY  ────────────────────────────── */

export const CATALOG: Pillar[] = [
  {
    slug: "marketing",
    name: "Marketing",
    tagline: "Demand creation",
    menuBlurb: "Ads, search, content, social and email — run every day.",
    headline: "Bots that make people find you.",
    intro:
      "Everything that fills the top of your funnel — ads, search, content, social, email and the pages they land on — operated continuously by specialized BOTS.",
    categories: MARKETING,
  },
  {
    slug: "sales",
    name: "Sales",
    tagline: "Revenue capture",
    menuBlurb: "Answering, following up, quoting and closing — every time.",
    headline: "Bots that turn interest into booked revenue.",
    intro:
      "Everything after the click — answering, qualifying, following up, quoting, closing and keeping the customer — handled the same way every time, at any hour.",
    categories: SALES,
  },
];

export const ALL_CATEGORIES: Category[] = CATALOG.flatMap((p) => p.categories);

export function getPillar(slug: string): Pillar | undefined {
  return CATALOG.find((p) => p.slug === slug);
}

export function getCategory(pillar: PillarSlug, slug: string): Category | undefined {
  return getPillar(pillar)?.categories.find((c) => c.slug === slug);
}

export function categoryHref(c: Category): string {
  return `/${c.pillar}/${c.slug}`;
}

/* ══════════════════════════════════════════════════════════════════════
   SERVICE LAYER

   The fields the /services template needs on top of the national copy
   above. Kept as one keyed block rather than scattered through the 13
   records so the whole set stays reviewable side by side — which is the
   only way the `owns` disjointness below is auditable by a human.

   `owns` / `excludes` are the cannibalization contract. A term may be
   owned by exactly one service; excluded terms may appear at most twice
   in a page body. scripts/topic-gate.mjs enforces both against the
   rendered corpus. See docs/SERVICE-CONTENT-BLUEPRINT.md §1.
   ══════════════════════════════════════════════════════════════════════ */

export interface ServiceMeta {
  /** Flat, globally unique. Becomes /services/{serviceSlug}. */
  serviceSlug: string;
  /** The head term. `name` stays the taxonomy label for nav. */
  serviceName: string;
  /** One line under the H1. Short — it sits at display weight. */
  hook: string;
  /** The geo lede. Deliberately NOT `intro`: reusing the national
      paragraph on 924 city pages is the doorway pattern we gate against. */
  geoIntro: string;
  implementationWeeks: number;
  baseline: { metric: string; value: string }[];
  /** Rotated per city by djb2. Five minimum, or the rotation repeats
      visibly across a metro cluster. */
  valueProps: string[];
  owns: string[];
  excludes: string[];
}

const SERVICE_META: Record<string, ServiceMeta> = {
  "paid-media": {
    serviceSlug: "agentic-ppc-management",
    serviceName: "Agentic PPC",
    hook: "Reviewed daily, not quarterly.",
    geoIntro:
      "An ad account managed by a BOT reads every search term, every day, and moves budget while the human agencies are preparing next month's slide deck. Same platforms, radically shorter feedback loop.",
    implementationWeeks: 2,
    baseline: [
      { metric: "Search-term review cadence", value: "daily" },
      { metric: "Creative variants in rotation", value: "continuous" },
      { metric: "Budget-shift latency", value: "<24h" },
    ],
    valueProps: [
      "Search terms read daily, junk negatived before it burns a second day of budget",
      "Budget follows booked work, not last quarter's assumptions",
      "Creative variants rotate continuously instead of decaying for months",
      "Every campaign tied to cost per booked job, not impressions",
      "Bids move within hours of the data moving",
    ],
    owns: [
      "search term report", "negative keyword", "quality score", "performance max",
      "bid management", "budget pacing", "ad creative rotation", "cost per booked job",
    ],
    excludes: ["core web vitals", "keyword cluster", "lifecycle email", "activity logging"],
  },

  seo: {
    serviceSlug: "agentic-seo",
    serviceName: "Agentic SEO",
    hook: "Maintenance, not a one-time audit.",
    geoIntro:
      "Rankings decay because nobody re-crawls, re-writes and re-links after the audit PDF lands. A BOT runs the crawl on a schedule, fixes what broke, and closes coverage gaps while they are still cheap.",
    implementationWeeks: 3,
    baseline: [
      { metric: "Technical crawl cadence", value: "weekly" },
      { metric: "Rank tracking", value: "daily" },
      { metric: "Content gap refresh", value: "monthly" },
    ],
    valueProps: [
      "The crawl runs weekly, so what breaks gets fixed while it is still cheap",
      "Competitor coverage gaps mapped and closed in priority order",
      "Local pages built to answer real searches, never to pad a count",
      "Rankings tracked daily against the terms that actually book work",
      "Technical debt caught on a schedule instead of at the annual audit",
    ],
    owns: [
      "core web vitals", "crawl budget", "technical audit", "keyword cluster",
      "internal linking", "schema markup", "rank tracking", "content gap",
    ],
    excludes: ["bid management", "quality score", "sequence cadence", "proposal turnaround"],
  },

  content: {
    serviceSlug: "agentic-content-marketing",
    serviceName: "Agentic Content Marketing",
    hook: "One idea, eight assets, every week.",
    geoIntro:
      "Publishing dies the week the person who volunteered gets busy. A BOT works a running calendar, cuts every source piece into the formats each channel wants, and holds the cadence whether or not anyone remembers it is Tuesday.",
    implementationWeeks: 3,
    baseline: [
      { metric: "Publishing cadence", value: "weekly" },
      { metric: "Assets per source piece", value: "8+" },
      { metric: "Voice profile applied", value: "everywhere" },
    ],
    valueProps: [
      "A calendar that fills itself instead of emptying the week you get busy",
      "One recorded idea becomes the post, the email, the clips and the captions",
      "Your voice profile applied to every asset, so nothing reads like stock copy",
      "Formats cut to what each channel actually rewards rather than one post reposted",
      "A publishing cadence that holds through your busy season, not just January",
      "Briefs written from live search demand, not from what someone felt like writing",
    ],
    owns: [
      "editorial calendar", "content repurposing", "voice profile", "content brief",
      "publishing cadence", "topic cluster", "asset variant", "long-form draft",
    ],
    excludes: ["bid management", "deliverability", "stage advancement", "review velocity"],
  },

  email: {
    serviceSlug: "agentic-email-marketing",
    serviceName: "Agentic Email Marketing",
    hook: "The follow-up that never forgets.",
    geoIntro:
      "Most revenue lost in email is not lost to bad copy, it is lost to sequences nobody ever built. A BOT writes them, sends them, watches list health, and stops the moment a lead converts so nobody gets sold something they already bought.",
    implementationWeeks: 2,
    baseline: [
      { metric: "Quotes left unfollowed", value: "0" },
      { metric: "Sequence exit on conversion", value: "automatic" },
      { metric: "Deliverability and list check", value: "weekly" },
    ],
    valueProps: [
      "Every quote gets followed up, whether or not anyone remembers to do it",
      "Sequences exit the moment a lead converts, so nobody is sold what they bought",
      "Deliverability and sender reputation watched weekly, before the inbox stops trusting you",
      "Lists segmented by what people actually did, not by when they were imported",
      "Re-engagement and win-back running quietly against the people who went cold",
      "Subject lines and send times tested continuously instead of guessed once",
    ],
    owns: [
      "lifecycle email", "drip sequence", "deliverability", "sender reputation",
      "list hygiene", "segmentation", "win-back", "abandoned quote",
    ],
    excludes: ["sequence cadence", "inbox warm-up", "ad creative rotation", "internal linking"],
  },

  cro: {
    serviceSlug: "agentic-cro",
    serviceName: "Agentic CRO",
    hook: "The cheapest lead you already paid for.",
    geoIntro:
      "You are already buying the traffic. A BOT watches where those visitors hesitate, builds the test, runs it to significance, and ships the winner instead of leaving three years of opinions unresolved in a spreadsheet.",
    implementationWeeks: 2,
    baseline: [
      { metric: "Session and heatmap capture", value: "always on" },
      { metric: "Significance before rollout", value: "per test" },
      { metric: "Mobile treatment", value: "first" },
    ],
    valueProps: [
      "More of the traffic you already pay for turns into calls and filled forms",
      "Tests run to statistical significance before anything ships site-wide",
      "Form fields that quietly lose people get found and cut",
      "Mobile treated as the primary layout, because that is where the traffic is",
      "Session capture shows the hesitation you cannot see in a conversion number",
      "Render-blocking scripts on the money pages removed where they cost conversions",
    ],
    owns: [
      "a/b test", "statistical significance", "form field abandonment", "session recording",
      "heatmap", "landing page variant", "mobile conversion", "friction audit",
    ],
    excludes: ["crawl budget", "core web vitals", "star rating", "sequence cadence"],
  },

  analytics: {
    serviceSlug: "agentic-analytics",
    serviceName: "Agentic Marketing Analytics",
    hook: "One dashboard, not fifteen tabs.",
    geoIntro:
      "Most owners have more reporting than they have answers. A BOT wires the tracking once, reconciles the numbers that disagree, and writes the weekly summary in plain language so the next decision is obvious.",
    implementationWeeks: 2,
    baseline: [
      { metric: "Dashboards to check", value: "1" },
      { metric: "Plain-language summary", value: "weekly" },
      { metric: "Cost per booked job", value: "by channel" },
    ],
    valueProps: [
      "One dashboard that answers what you spent and what it produced",
      "A weekly summary written in plain language, not a wall of charts",
      "Cost per booked job visible per channel, so the losing one is obvious",
      "Tracking wired once and audited, so the numbers stop disagreeing",
      "Funnel drop-off located and named, not left as a mystery in the middle",
      "Attribution that survives someone calling instead of filling in the form",
    ],
    owns: [
      "attribution model", "conversion tracking", "funnel drop-off", "channel reporting",
      "utm taxonomy", "data reconciliation", "weekly summary", "cost per acquisition",
    ],
    excludes: ["ad creative rotation", "editorial calendar", "proposal turnaround", "maintenance reminder"],
  },

  "lead-generation": {
    serviceSlug: "agentic-lead-generation",
    serviceName: "Agentic Lead Generation",
    hook: "Stop selling to whoever answers.",
    geoIntro:
      "A list nobody scrubbed is a list nobody should call. A BOT builds the profile from your closed-won, finds the accounts that match it, verifies every contact, and watches for the triggers that make a cold account warm.",
    implementationWeeks: 3,
    baseline: [
      { metric: "Contact verification", value: "before outreach" },
      { metric: "Intent and trigger monitoring", value: "continuous" },
      { metric: "Documented ICP", value: "1" },
    ],
    valueProps: [
      "A documented ideal customer profile everyone actually works from",
      "Every contact verified before a single message goes out",
      "Hiring, funding and expansion triggers watched so timing stops being luck",
      "The addressable list built from your closed-won, not bought off a shelf",
      "Records enriched with the firmographics that decide whether to bother",
      "A standing list of qualified people, so nobody starts Monday from zero",
    ],
    owns: [
      "ideal customer profile", "total addressable market", "contact verification",
      "data enrichment", "intent signal", "buying trigger", "list building", "firmographic",
    ],
    excludes: ["sequence cadence", "inbox warm-up", "quality score", "database reactivation"],
  },

  outbound: {
    serviceSlug: "agentic-outbound-sdr",
    serviceName: "Agentic Outbound SDR",
    hook: "The cadence nobody forgets to run.",
    geoIntro:
      "Outbound does not fail on the first touch, it fails on the fifth that nobody sent. A BOT runs the full multi-channel cadence, keeps the sending infrastructure healthy, and sorts the replies so a human only reads the ones worth answering.",
    implementationWeeks: 3,
    baseline: [
      { metric: "Sequence steps actually sent", value: "every" },
      { metric: "Reply triage", value: "automatic" },
      { metric: "Sending infrastructure", value: "warmed" },
    ],
    valueProps: [
      "Every step of the sequence actually goes out, including the fifth one",
      "Sending domains warmed and separated so your main domain stays clean",
      "Replies triaged by sentiment, so a human reads only what deserves reading",
      "Multi-channel touches sequenced rather than fired all at once",
      "Follow-up that continues on schedule through your busiest week",
      "Bounce and spam signals watched before they cost you the whole domain",
    ],
    owns: [
      "sequence cadence", "multi-channel touch", "inbox warm-up", "sending domain",
      "reply triage", "sentiment sorting", "bounce rate", "outbound step",
    ],
    excludes: ["lifecycle email", "deliverability", "ideal customer profile", "internal linking"],
  },

  inbound: {
    serviceSlug: "agentic-speed-to-lead",
    serviceName: "Agentic Speed-to-Lead",
    hook: "Under a minute, any hour.",
    geoIntro:
      "The first responder wins the job, and the decay is measured in minutes. A BOT answers every call, form and chat within seconds, qualifies in real conversation, and books straight onto the calendar.",
    implementationWeeks: 2,
    baseline: [
      { metric: "First response", value: "<60s" },
      { metric: "Coverage", value: "24/7" },
      { metric: "Escalation to humans", value: "rule-based" },
    ],
    valueProps: [
      "Every inbound answered in under a minute, at 2pm or 2am",
      "Missed calls get a text back before the caller dials a competitor",
      "Qualified leads land on the calendar, not in a callback queue",
      "Every lead scored on fit and urgency before a human touches it",
      "Nights, weekends and holidays covered without an answering service",
    ],
    owns: [
      "first response time", "missed call text back", "after-hours coverage",
      "live qualification", "instant booking", "speed to lead", "inbound routing", "call answering",
    ],
    excludes: ["sequence cadence", "ideal customer profile", "review request", "crawl budget"],
  },

  crm: {
    serviceSlug: "agentic-crm-automation",
    serviceName: "Agentic CRM Automation",
    hook: "Records that update themselves.",
    geoIntro:
      "A CRM nobody updates is a reporting liability you pay monthly for. A BOT logs every call, email and meeting against the right record, advances stages on evidence, and merges the duplicates nobody has time for.",
    implementationWeeks: 2,
    baseline: [
      { metric: "Activity logging", value: "automatic" },
      { metric: "Duplicate hygiene", value: "daily" },
      { metric: "Stalled-deal alerts", value: "real-time" },
    ],
    valueProps: [
      "Every call, email and meeting logs itself against the right record",
      "Stages advance on evidence — a proposal sent, a meeting held",
      "Duplicates merge on a schedule with rules, not on a rainy Friday",
      "Stalled deals surface before they quietly die",
      "The forecast finally matches what the pipeline actually holds",
    ],
    owns: [
      "activity logging", "stage advancement", "duplicate merge", "record hygiene",
      "stalled deal", "pipeline accuracy", "data entry", "contact record",
    ],
    excludes: ["repeat business", "google review", "seasonal tune-up", "bid management"],
  },

  enablement: {
    serviceSlug: "agentic-proposal-automation",
    serviceName: "Agentic Proposal Automation",
    hook: "The proposal that goes out today.",
    geoIntro:
      "Most quotes lose to the calendar, not to the competitor. A BOT assembles the proposal from live pricing the same day it is asked for, chases the signature, and keeps the answers your team needs current instead of two years stale.",
    implementationWeeks: 2,
    baseline: [
      { metric: "Proposal turnaround", value: "same day" },
      { metric: "Signature reminders", value: "automatic" },
      { metric: "Battle cards", value: "current" },
    ],
    valueProps: [
      "Proposals go out the day they are asked for, not the week after",
      "Pricing pulled from one current source instead of last quarter's file",
      "Signature chased automatically until it is signed or formally dead",
      "Battle cards and objection answers kept current, not written once in 2022",
      "Every quote logged back to the deal without anyone re-typing it",
      "Terms and scope assembled consistently, so nothing gets promised twice",
    ],
    owns: [
      "proposal turnaround", "quote assembly", "e-signature", "battle card",
      "objection handling", "pricing table", "scope of work", "signature reminder",
    ],
    excludes: ["ad creative rotation", "crawl budget", "intent signal", "reputation management"],
  },

  reviews: {
    serviceSlug: "agentic-review-generation",
    serviceName: "Agentic Review Generation",
    hook: "Every finished job, asked.",
    geoIntro:
      "Local customers pick between three contractors by star rating and review count before they ever call. A BOT asks every finished job for a Google review the same day, answers every review that lands, and routes unhappy customers to the owner before they post.",
    implementationWeeks: 1,
    baseline: [
      { metric: "Review request timing", value: "same day" },
      { metric: "Review replies", value: "every review" },
      { metric: "Unhappy customers", value: "routed privately" },
    ],
    valueProps: [
      "Every finished job asked for a review the same day, by text, with a one-tap link",
      "Every new review answered in your voice, good ones and rough ones",
      "Unhappy customers reach you directly before they reach Google",
      "Your rating and review count tracked against the local competition",
      "A steady flow of fresh reviews instead of a burst after a promo",
      "Crew names and job details pulled in so each request feels personal",
    ],
    owns: [
      "review request", "google review", "review response", "star rating",
      "review velocity", "negative review alert", "reputation management", "review link",
    ],
    excludes: ["bid management", "drip sequence", "database reactivation"],
  },
  reactivation: {
    serviceSlug: "agentic-customer-reactivation",
    serviceName: "Agentic Customer Reactivation",
    hook: "Repeat work, no new leads.",
    geoIntro:
      "The cheapest job a contractor books is from someone who already hired them. A BOT works the customer list on a seasonal calendar, follows up on estimates that went quiet, and books the replies straight onto the schedule.",
    implementationWeeks: 2,
    baseline: [
      { metric: "Seasonal reminders", value: "automatic" },
      { metric: "Old estimate follow-up", value: "scheduled" },
      { metric: "Replies to bookings", value: "handled" },
    ],
    valueProps: [
      "Tune-ups and maintenance reminders sent before the season, not after the breakdown",
      "Estimates that went quiet followed up when timing or budget may have changed",
      "Past customers hear from you a few times a year, before they need to search",
      "Replies handled and booked onto your calendar without a phone call",
      "Slow seasons filled from your own list before you spend on ads",
      "Opt-outs and consent honored on every message, every time",
    ],
    owns: [
      "past customer", "dormant customer", "maintenance reminder", "seasonal tune-up",
      "repeat business", "database reactivation", "service anniversary", "lapsed customer",
    ],
    excludes: ["review request", "bid management", "keyword cluster", "ideal customer profile"],
  },
};

/* ── Assembly + validation ─────────────────────────────────────────────
   Parsed at module load, so a bad record fails the build rather than the
   SERP. The superRefine is the important half: it proves no two services
   claim the same term, which is what stops the /marketing-vs-/local
   duplication from quietly reappearing the next time a service is added. */

export type Service = Category & ServiceMeta & { headlinePattern: string };

const ServiceMetaSchema = z.object({
  serviceSlug: z.string().regex(/^agentic-[a-z0-9-]+$/, "service slugs are agentic-prefixed"),
  serviceName: z.string().min(2),
  hook: z.string().min(10).max(48),
  geoIntro: z.string().min(120),
  implementationWeeks: z.number().int().min(1).max(8),
  baseline: z.array(z.object({ metric: z.string().min(3), value: z.string().min(1) })).min(2),
  valueProps: z.array(z.string().min(30)).min(5),
  owns: z.array(z.string().min(3)).min(6),
  excludes: z.array(z.string().min(3)).min(3),
});

/** seo-checks.mjs caps the rendered <title> at 70. The service routes set
 *  `title.absolute`, so there is no " | AgenticBots" suffix to budget for;
 *  the longest city label in cities-dataset.json is "Palm Beach Gardens, FL". */
const LONGEST_CITY_LABEL = 22;
const TITLE_CAP = 70;

export const ALL_SERVICES: Service[] = (() => {
  const rows = ALL_CATEGORIES.map((c) => {
    const meta = SERVICE_META[c.slug];
    if (!meta) throw new Error(`catalog: no SERVICE_META for "${c.slug}"`);
    const parsed = ServiceMetaSchema.parse(meta);
    return {
      ...c,
      ...parsed,
      headlinePattern: `${parsed.serviceName} Company in {city}, {st}`,
    };
  });

  /* Every term belongs to exactly one service. */
  const claimed = new Map<string, string>();
  for (const s of rows) {
    for (const term of s.owns) {
      const prior = claimed.get(term);
      if (prior) {
        throw new Error(
          `catalog: "${term}" is owned by both "${prior}" and "${s.serviceSlug}". ` +
            `One page per topic — reassign it (docs/SERVICE-CONTENT-BLUEPRINT.md §1).`
        );
      }
      claimed.set(term, s.serviceSlug);
    }
  }

  for (const s of rows) {
    /* An exclude nobody owns is dead weight in the gate. */
    for (const term of s.excludes) {
      if (!claimed.has(term)) {
        throw new Error(
          `catalog: "${s.serviceSlug}" excludes "${term}", which no service owns. ` +
            `Either own it somewhere or drop the exclusion.`
        );
      }
      if (s.owns.includes(term)) {
        throw new Error(`catalog: "${s.serviceSlug}" both owns and excludes "${term}".`);
      }
    }

    /* Fail in milliseconds here rather than after a 13,700-page build. */
    const titleLen = s.headlinePattern.replace("{city}, {st}", "").length + LONGEST_CITY_LABEL;
    if (titleLen > TITLE_CAP) {
      throw new Error(
        `catalog: "${s.serviceSlug}" yields a ${titleLen}-char <title> in the longest US city ` +
          `(cap ${TITLE_CAP}). Shorten serviceName.`
      );
    }
  }

  const slugs = new Set(rows.map((s) => s.serviceSlug));
  if (slugs.size !== rows.length) throw new Error("catalog: duplicate serviceSlug");
  return rows;
})();

export function getService(serviceSlug: string): Service | undefined {
  return ALL_SERVICES.find((s) => s.serviceSlug === serviceSlug);
}

/** Resolve by the legacy catalog slug — used while consumers migrate. */
export function getServiceByCategorySlug(slug: string): Service | undefined {
  return ALL_SERVICES.find((s) => s.slug === slug);
}

/** The canonical URL for a service — the one place any link to one is
 *  built. Accepts either a catalog record or a Service, so consumers that
 *  iterate `pillar.categories` for the nav taxonomy keep working. */
export function serviceHref(c: { slug: string }): string {
  const svc = ALL_SERVICES.find((s) => s.slug === c.slug || s.serviceSlug === c.slug);
  if (!svc) throw new Error(`catalog: no service for "${c.slug}"`);
  return `/services/${svc.serviceSlug}`;
}

/** A service's geo child. */
export function serviceGeoHref(c: { slug: string }, state: string, city?: string): string {
  const base = serviceHref(c);
  return city ? `${base}/${state}/${city}` : `${base}/${state}`;
}
