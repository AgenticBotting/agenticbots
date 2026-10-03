/**
 * Per-offer presentation: what makes each service page look and read like
 * its own product instead of a template with the noun swapped. Keyed by
 * catalog category slug. Copy here is page furniture — the SEO-governed
 * copy (owns/excludes, geoIntro) stays in catalog.ts.
 */

export interface Offer {
  /** Tools this bot actually plugs into, contractor-relevant first. */
  tools: string[];
  /** The signature section that sits under the hero visual. */
  signature: { eyebrow: string; heading: string; accent: string; sub: string };
  /** Who it is the best fit for, one line. */
  bestFor: string;
  /** Activity rows for the city-page console. `p` = local place names. */
  feed: (p: string[]) => { t: string; body: string }[];
  /** Related offers, by category slug. */
  pairs: string[];
}

export const OFFERS: Record<string, Offer> = {
  "paid-media": {
    tools: ["Google Ads", "Local Services Ads", "Meta Ads", "Google Business Profile", "CallRail", "GA4"],
    signature: { eyebrow: "What daily management does to cost", heading: "The same budget,", accent: "bought better.", sub: "Nothing about the platforms changes. What changes is how often anyone looks, so wasted spend is cut the day it shows up." },
    bestFor: "Contractors spending $2,000+ a month on Google or Meta ads",
    feed: (p) => [
      { t: "2m", body: `Read 214 search terms · ${p[0]} campaign · 6 negatives added` },
      { t: "9m", body: "Paused an ad set running 2.1× target cost per lead" },
      { t: "31m", body: `Budget shifted toward ${p[1] ?? p[0]} · after-hours calls` },
      { t: "1h", body: "LSA dispute filed on a spam lead" },
    ],
    pairs: ["inbound", "cro", "analytics"],
  },
  seo: {
    tools: ["Google Search Console", "Google Business Profile", "GA4", "WordPress", "Webflow", "Ahrefs"],
    signature: { eyebrow: "Rank tracking, daily", heading: "Climbing for the searches", accent: "that book jobs.", sub: "We track the terms your customers type, not vanity keywords, and fix what holds each page back every week." },
    bestFor: "Contractors who want calls from Google without paying per click",
    feed: (p) => [
      { t: "4m", body: "Crawled 312 pages · 3 broken links repaired" },
      { t: "22m", body: `New service page published for ${p[0]}` },
      { t: "48m", body: `Internal links wired to the ${p[1] ?? p[0]} page` },
      { t: "1h", body: "Schema re-validated across the site · 0 errors" },
    ],
    pairs: ["reviews", "content", "cro"],
  },
  content: {
    tools: ["WordPress", "Google Business Profile", "Facebook", "Instagram", "YouTube", "Canva"],
    signature: { eyebrow: "Your publishing week", heading: "One job site photo,", accent: "five channels.", sub: "Before-and-afters, project stories and seasonal tips, drafted in your voice and published on schedule." },
    bestFor: "Contractors with great work and no time to post about it",
    feed: (p) => [
      { t: "6m", body: `Project story drafted · kitchen remodel in ${p[0]}` },
      { t: "25m", body: "Before/after cut into 3 social posts" },
      { t: "52m", body: `GBP post published for ${p[1] ?? p[0]}` },
      { t: "1h", body: "Next week's calendar filled · 5 pieces" },
    ],
    pairs: ["seo", "reviews", "email"],
  },
  email: {
    tools: ["Gmail", "Outlook", "Mailchimp", "HubSpot", "Jobber", "Housecall Pro"],
    signature: { eyebrow: "A quote follow-up sequence", heading: "Every quote followed up,", accent: "until they answer.", sub: "The sequence stops the moment they reply or book. Nobody gets chased for a job they already gave you." },
    bestFor: "Contractors sending quotes that go quiet",
    feed: (p) => [
      { t: "3m", body: `Quote follow-up #2 sent · roof estimate in ${p[0]}` },
      { t: "17m", body: "Reply detected → sequence stopped, owner notified" },
      { t: "40m", body: "14 bounced addresses cleaned from the list" },
      { t: "1h", body: `Storm-season email queued for ${p[1] ?? p[0]}` },
    ],
    pairs: ["enablement", "reactivation", "inbound"],
  },
  cro: {
    tools: ["GA4", "Microsoft Clarity", "Google Tag Manager", "WordPress", "Webflow", "CallRail"],
    signature: { eyebrow: "A live test", heading: "More calls from", accent: "the traffic you already have.", sub: "We find where visitors hesitate, test a fix, and only ship it once the numbers prove it." },
    bestFor: "Contractors getting traffic that doesn't turn into calls",
    feed: (p) => [
      { t: "5m", body: "Quote form cut from 9 fields to 4 · test started" },
      { t: "28m", body: `Click-to-call bar added on mobile · ${p[0]} pages` },
      { t: "50m", body: "Variant B ahead at 94% confidence · still running" },
      { t: "1h", body: "Slow script removed from the booking page" },
    ],
    pairs: ["paid-media", "seo", "inbound"],
  },
  analytics: {
    tools: ["GA4", "CallRail", "Google Ads", "Jobber", "ServiceTitan", "QuickBooks"],
    signature: { eyebrow: "Your Monday report", heading: "What you spent and", accent: "what it booked.", sub: "One page, plain English, every week. Which channel paid for itself and which one didn't." },
    bestFor: "Owners who can't tell which marketing actually works",
    feed: (p) => [
      { t: "8m", body: "Calls matched to booked jobs · 41 of 44 attributed" },
      { t: "26m", body: `Cost per booked job · ${p[0]} Google Ads: $86` },
      { t: "44m", body: "Tracking gap found on the contact form · fixed" },
      { t: "1h", body: "Weekly summary written and emailed to the owner" },
    ],
    pairs: ["paid-media", "crm", "cro"],
  },
  "lead-generation": {
    tools: ["Apollo", "LinkedIn", "Dodge Construction", "BuildZoom", "Google Maps", "HubSpot"],
    signature: { eyebrow: "Your target list", heading: "Property managers and GCs,", accent: "verified and ready.", sub: "The commercial buyers who hire your trade, found, checked and handed over before anyone makes a call." },
    bestFor: "Commercial contractors who sell to GCs, facilities and property managers",
    feed: (p) => [
      { t: "7m", body: `42 property managers found in ${p[0]}` },
      { t: "21m", body: "Contacts verified · 6 bad emails removed" },
      { t: "39m", body: `New permit filed near ${p[1] ?? p[0]} → GC added` },
      { t: "1h", body: "Weekly list delivered to your CRM" },
    ],
    pairs: ["outbound", "crm", "enablement"],
  },
  outbound: {
    tools: ["Gmail", "Outlook", "LinkedIn", "Instantly", "HubSpot", "Calendly"],
    signature: { eyebrow: "Outreach that sounds like you", heading: "Bid lists and walk-throughs,", accent: "booked on autopilot.", sub: "Short, specific emails to the commercial buyers on your list, with replies routed to you the moment someone bites." },
    bestFor: "Commercial contractors who need more bid invitations",
    feed: (p) => [
      { t: "3m", body: `Intro sent to 18 facilities managers in ${p[0]}` },
      { t: "19m", body: "Reply: “send your capabilities sheet” → owner pinged" },
      { t: "37m", body: "Walk-through booked Tuesday 9am" },
      { t: "1h", body: "Inbox health checked · deliverability steady" },
    ],
    pairs: ["lead-generation", "enablement", "crm"],
  },
  inbound: {
    tools: ["Your phone line", "Website forms", "Google LSA", "Jobber", "Housecall Pro", "ServiceTitan"],
    signature: { eyebrow: "One lead, handled", heading: "Answered before they", accent: "call the next name.", sub: "The whole sequence, from missed call to booked appointment, without anyone reaching for a phone." },
    bestFor: "Any contractor who misses calls on the job or after hours",
    feed: (p) => [
      { t: "38s", body: `Missed call from ${p[0]} → texted back in 38 seconds` },
      { t: "6m", body: "Form lead → reply sent in 44 seconds" },
      { t: "52m", body: "After-hours quote request answered and booked" },
      { t: "1h", body: "No-show rescheduled · confirmation sent" },
    ],
    pairs: ["reviews", "crm", "email"],
  },
  crm: {
    tools: ["Jobber", "Housecall Pro", "ServiceTitan", "HubSpot", "GoHighLevel", "QuickBooks"],
    signature: { eyebrow: "Your pipeline, kept current", heading: "Every job in the right column,", accent: "without anyone typing.", sub: "Calls, texts and quotes logged automatically, so you can see what's coming in and what's stuck." },
    bestFor: "Contractors whose CRM is out of date by Wednesday",
    feed: (p) => [
      { t: "1m", body: `Call logged → ${p[0]} estimate updated, next step set` },
      { t: "12m", body: "14 stale estimates flagged for follow-up" },
      { t: "40m", body: "Quote sent → stage moved, reminder scheduled" },
      { t: "1h", body: "9 duplicate customers merged" },
    ],
    pairs: ["inbound", "enablement", "reactivation"],
  },
  enablement: {
    tools: ["Jobber", "Housecall Pro", "ServiceTitan", "QuickBooks", "DocuSign", "Google Drive"],
    signature: { eyebrow: "A quote, start to signed", heading: "Quotes out in minutes,", accent: "chased until they sign.", sub: "Built from your price book, sent the same day, and followed up when the customer opens it." },
    bestFor: "Contractors losing jobs because quotes go out late",
    feed: (p) => [
      { t: "4m", body: `Quote built from site notes · ${p[0]} HVAC replacement` },
      { t: "15m", body: "Sent for approval → owner approved by text" },
      { t: "33m", body: "Customer opened the quote twice → follow-up sent" },
      { t: "1h", body: "Signed · deposit link delivered" },
    ],
    pairs: ["email", "crm", "inbound"],
  },
  reviews: {
    tools: ["Google Business Profile", "Jobber", "Housecall Pro", "ServiceTitan", "Your texting number", "Facebook"],
    signature: { eyebrow: "Your review inbox", heading: "More five-star reviews,", accent: "every one answered.", sub: "Asked the day the job closes, replied to within a day, and unhappy customers sent to you first." },
    bestFor: "Contractors with happy customers and too few reviews",
    feed: (p) => [
      { t: "12m", body: `Review request sent · water heater job in ${p[0]}` },
      { t: "34m", body: "New 5★ review → reply posted in your voice" },
      { t: "51m", body: "3★ check-in reply → routed to the owner privately" },
      { t: "1h", body: `${p[1] ?? p[0]} map-pack rating now 4.8 · 112 reviews` },
    ],
    pairs: ["seo", "inbound", "reactivation"],
  },
  reactivation: {
    tools: ["Jobber", "Housecall Pro", "ServiceTitan", "QuickBooks", "Your texting number", "Mailchimp"],
    signature: { eyebrow: "Your customer list, this season", heading: "Repeat work from customers", accent: "you already have.", sub: "Tune-ups, maintenance reminders and old estimates, timed to the season and booked straight onto your calendar." },
    bestFor: "Contractors with a customer list and a slow season",
    feed: (p) => [
      { t: "9m", body: `AC tune-up reminder sent · 86 customers in ${p[0]}` },
      { t: "27m", body: "Reply “yes, next week” → booked Thursday 2pm" },
      { t: "45m", body: "Old estimate follow-up · 12 quotes from spring" },
      { t: "1h", body: "2 opt-outs recorded · never contacted again" },
    ],
    pairs: ["reviews", "email", "crm"],
  },
};

export function getOffer(slug: string): Offer | undefined {
  return OFFERS[slug];
}
