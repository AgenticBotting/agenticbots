/**
 * Blog content.
 *
 * Deliberately dependency-free: posts are structured blocks rather than
 * markdown, so there is no parser in the bundle and the typography is
 * fully controlled. Add a post by appending to POSTS.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "callout"; variant: "note" | "warning" | "insight" | "result"; title?: string; text: string }
  | { type: "stat"; value: string; label: string; detail?: string };

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string;      // ISO
  readMinutes: number;
  category: string;
  body: Block[];
}

export const POSTS: Post[] = [
  {
    slug: "speed-to-lead-is-the-whole-game",
    title: "Response time is an operating-control problem",
    excerpt:
      "Inbound performance depends on ownership, channel coverage, qualification rules and escalation—not a single promise about response speed.",
    date: "2026-08-18",
    readMinutes: 6,
    category: "Sales",
    body: [
      { type: "p", text: "Many businesses buy demand before they define who owns the response, which channels are covered, what qualifies an opportunity and when a person must take over." },
      { type: "p", text: "The result is an operating gap: inquiries enter several systems, teams work from different queues and management cannot reconstruct what happened." },
      { type: "h2", text: "What the control model requires" },
      { type: "p", text: "Response speed matters, but an enterprise-ready design starts with the conditions under which a response should occur and the authority the system is allowed to use." },
      { type: "ul", items: [
        "Every inbound source has a named owner and routing rule.",
        "Qualification criteria are explicit and testable.",
        "Channel coverage and service levels are defined per deployment.",
      ]},
      { type: "p", text: "A useful baseline comes from your own systems: volume by source, time to ownership, qualification completion, escalation rate and disposition quality." },
      { type: "h2", text: "Why the fix keeps failing" },
      { type: "p", text: "Most response processes depend on individual memory. The work crosses inboxes, call systems, calendars and CRM records without one accountable path." },
      { type: "quote", text: "A response workflow is reliable only when ownership, authority and exceptions are visible." },
      { type: "h2", text: "What a BOT mandate changes" },
      { type: "p", text: "A managed inbound-response mandate coordinates CRM and Outbound BOTS around the sources, rules and escalation paths included in the deployment." },
      { type: "ul", items: [
        "Inbound sources enter a defined ownership and routing process.",
        "Responses are prepared from approved business rules.",
        "Qualification and scheduling follow configured criteria.",
        "CRM updates and external messages follow the approval policy.",
      ]},
      { type: "callout", variant: "insight", text: "The proposal should name the covered channels, target service levels, human escalation points and system-of-record policy before implementation begins." },
      { type: "p", text: "The practical goal is a controlled operating path that management can inspect and improve—not an unsupported universal response-time promise." },
    ],
  },
  {
    slug: "what-agentic-actually-means",
    title: "What a production BOT actually requires",
    excerpt:
      "The word has been stretched to cover everything from a chatbot to a spreadsheet macro. Here is the distinction that matters when you are buying.",
    date: "2026-07-29",
    readMinutes: 5,
    category: "Fundamentals",
    body: [
      { type: "p", text: "The word agentic now covers everything from a chatbot to a workflow engine. A buyer needs a clearer standard: the BOT must have a defined mandate, bounded tools, explicit authority and a reviewable activity record." },
      { type: "h2", text: "Automation versus BOTS" },
      { type: "p", text: "Automation follows a fixed path. If this, then that. It is reliable and it is limited: the moment reality steps outside the path you drew, it stops or does the wrong thing." },
      { type: "p", text: "A BOT receives a mandate and a bounded set of tools. It can interpret inputs and prepare next actions, while the authority policy determines what can proceed and what requires a person." },
      { type: "h2", text: "Why that distinction matters commercially" },
      { type: "ul", items: [
        "Automation breaks on the exceptions. Exceptions are most of your business.",
        "BOTS identify exceptions and escalate the ones they should not touch.",
        "Automation needs someone to maintain the branches forever.",
        "BOTS need rules, monitoring and review throughout operation.",
      ]},
      { type: "h2", text: "The honest limitation" },
      { type: "p", text: "BOTS are not magic and should not receive blanket authority. Production operation requires clear escalation rules, a full activity record and acceptance criteria for each workflow." },
      { type: "quote", text: "If a vendor cannot show what a BOT did, why it acted and which authority allowed it, the control model is incomplete." },
      { type: "p", text: "Ask for the activity record. Ask what happens when the BOT is unsure. Ask which actions require approval. Those answers reveal more than a polished demo." },
    ],
  },
  {
    slug: "your-crm-is-lying-to-you",
    title: "Your CRM is lying to you",
    excerpt:
      "Nobody updates it, so nobody trusts it, so nobody updates it. Here is how that loop actually gets broken.",
    date: "2026-07-08",
    readMinutes: 5,
    category: "Operations",
    body: [
      { type: "p", text: "There is a specific death spiral that happens to every CRM. It goes like this: reps do not update records because it is tedious. The data goes stale. Managers stop trusting the pipeline. Reporting moves to a spreadsheet. And now updating the CRM is genuinely pointless, so nobody does it at all." },
      { type: "h2", text: "The usual fix does not work" },
      { type: "p", text: "The standard response is process — mandatory fields, weekly hygiene meetings, a stern email about data discipline. This works for about three weeks. It fails because it is asking people to do administrative work that produces no value for them personally." },
      { type: "h2", text: "What actually breaks the loop" },
      { type: "p", text: "Calls, emails and meetings already exist as data somewhere. A CRM BOT can detect missing or stale records, prepare corrections and route conflicts for review instead of guessing." },
      { type: "ul", items: [
        "Activity is reconciled from approved source systems.",
        "Stage changes are prepared from defined evidence.",
        "Duplicate and stale-record exceptions are surfaced with explicit rules.",
        "Writes follow the configured approval policy; conflicts route to a person.",
      ]},
      { type: "quote", text: "A CRM nobody trusts is worse than no CRM, because you are still paying for it and still making decisions from it." },
      { type: "h2", text: "Start with cleanup, not automation" },
      { type: "p", text: "There is no point automating on top of records nobody believes. Clean first, then automate the maintenance, then build reporting on it. In that order — the reverse never holds." },
    ],
  },
];

/** Slugified h2s for the table of contents. */
export function postHeadings(post: Post): { id: string; text: string }[] {
  return post.body
    .filter((b): b is Extract<Block, { type: "h2" }> => b.type === "h2")
    .map((b) => ({
      id: b.text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-"),
      text: b.text,
    }));
}

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export const SORTED_POSTS = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
