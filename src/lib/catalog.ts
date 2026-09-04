/**
 * The AgenticBots service catalog — the single source of truth.
 *
 * Two pillars (Marketing = demand creation, Sales = revenue capture),
 * thirteen categories beneath them. Every service page, the mega menu,
 * the footer sitemap and sitemap.ts read from this file. Nothing else
 * hardcodes a service name or URL.
 */

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
      { q: "Will the pages read like AI wrote them?", a: "They are drafted by agents and reviewed before publishing. Thin, generic pages hurt rankings, so the quality gate is the whole point." },
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
      "Inbox warm-up and deliverability",
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
      { today: "Volume goes up, deliverability falls over, the main domain gets burned.", after: "Separate domains, warmed properly, volume capped and monitored." },
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
    headline: "Five minutes is the whole game.",
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
      { title: "Real conversation, not a decision tree", body: "The agent answers questions, asks the qualifying ones back, and knows when to hand off to a human instead of guessing." },
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
    slug: "account-management",
    name: "Account Management",
    pillar: "sales",
    botName: "Retention Bot",
    blurb: "Onboarding, adoption, upsells and renewals — tracked and triggered.",
    outcome: "Customers get followed up with after the sale, not just before it.",
    headline: "The revenue you already won.",
    intro:
      "Winning a customer is the expensive part. Retention Bot handles onboarding, watches usage for churn risk, and surfaces the expansion and renewal moments before they pass.",
    capabilities: [
      "Onboarding workflow triggers",
      "Usage and adoption tracking",
      "Upsell and cross-sell identification",
      "QBR preparation and deck building",
      "Renewal reminders and churn risk scoring",
      "NPS and customer feedback collection",
    ],
    highlights: [
      { title: "Onboarding that runs itself", body: "Every new customer gets the same sequence of check-ins, resources and milestones, without anyone tracking it manually." },
      { title: "Churn risk, scored early", body: "Drops in usage, unanswered emails and support patterns combined into a risk score that fires while there is still time." },
      { title: "Expansion, surfaced", body: "Accounts showing the signals for an upsell or cross-sell flagged to your team with the reasoning attached." },
      { title: "QBR decks pre-built", body: "Usage, results and next-quarter recommendations assembled before the meeting instead of the night before." },
    ],
    metrics: [
      { value: "Day 1", label: "Onboarding triggers on close" },
      { value: "Scored", label: "Churn risk across every account" },
      { value: "Ahead", label: "Renewal reminders, well before the date" },
    ],
    stations: [
      { label: "Watching for silence", meta: "The churn tell" },
      { label: "Sending the check-in", meta: "After the sale, too" },
      { label: "Spotting the upsell", meta: "From how they use it" },
      { label: "Asking for the review", meta: "At the right moment" },
    ],
    contrast: [
      { today: "Onboarding depends on who picked up the account that week.", after: "Every new customer gets the same check-ins, resources and milestones, triggered on close." },
      { today: "You learn about churn when the cancellation email arrives.", after: "Usage drops, silence and support patterns combine into a risk score that fires early." },
      { today: "Expansion happens when a customer thinks to ask.", after: "Accounts showing upsell signals are flagged to your team with the reasoning attached." },
    ],
    faqs: [
      { q: "Does this replace our CS team?", a: "No — it removes the tracking and prep work so they spend their time on the conversations that need a person." },
      { q: "What data does churn scoring need?", a: "Whatever you have: product usage, email engagement, support tickets, invoice history. More signals sharpen it, but it works with few." },
      { q: "Can it send the NPS surveys?", a: "Yes, on your cadence, with responses routed back into the CRM and detractors escalated immediately." },
    ],
  },
  {
    index: "13",
    slug: "revops",
    name: "Revenue Operations",
    pillar: "sales",
    botName: "RevOps Bot",
    blurb: "Forecasting, territories, commissions and clean handoffs between teams.",
    outcome: "You can see what is coming and where deals are getting dropped.",
    headline: "The seams between your teams.",
    intro:
      "Most revenue leaks at a handoff. RevOps Bot manages the forecast, the territories, the commission math and the SLAs between teams so nothing falls into the gap.",
    capabilities: [
      "Territory and quota planning",
      "Commission calculation",
      "Pipeline forecasting",
      "Win/loss analysis",
      "Handoff workflows (SDR → AE → CS)",
      "SLA tracking between teams",
    ],
    highlights: [
      { title: "A forecast built on behavior", body: "Weighted on deal activity and historical conversion rates rather than whatever the rep felt like typing." },
      { title: "Handoffs with a checklist", body: "SDR to AE to CS transitions carry required context, and an incomplete handoff does not go through." },
      { title: "Commission math, settled", body: "Calculated from closed-won data automatically, so nobody spends the first week of the month arguing about a spreadsheet." },
      { title: "Win/loss, actually analyzed", body: "Reasons captured at close and aggregated into patterns you can act on, instead of anecdotes." },
    ],
    metrics: [
      { value: "Weekly", label: "Forecast refresh on live pipeline" },
      { value: "Tracked", label: "SLA compliance between every team" },
      { value: "Auto", label: "Commission calculation from closed-won" },
    ],
    stations: [
      { label: "Cleaning the pipeline", meta: "What is really there" },
      { label: "Forecasting honestly", meta: "No hopeful math" },
      { label: "Routing the leads", meta: "To whoever can close" },
      { label: "Reporting the leaks", meta: "Where deals drop" },
    ],
    contrast: [
      { today: "The forecast is whatever the reps felt like typing on Friday.", after: "It is weighted on deal activity and your own historical conversion rates." },
      { today: "Deals fall into the gap between SDR, AE and CS.", after: "Handoffs carry required context, and an incomplete one does not go through." },
      { today: "The first week of every month is spent arguing about a commission spreadsheet.", after: "Commission calculates from closed-won data automatically." },
    ],
    faqs: [
      { q: "Is this useful for a small team?", a: "The forecasting and handoff pieces are. Territories and commission automation start paying off around five or more reps." },
      { q: "How accurate is the forecast?", a: "It improves with history. After roughly two quarters of clean data it is typically far closer than rep-entered projections." },
      { q: "Does it need a specific CRM?", a: "No, but it needs the CRM to be reasonably clean — which is why CRM Bot usually gets built first." },
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
      "Everything that fills the top of your funnel — ads, search, content, social, email and the pages they land on — run continuously by agents instead of sporadically by whoever has time.",
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
