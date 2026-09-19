/**
 * The course, as data.
 *
 * Same principle as the blog: typed content in the repo, no CMS. Lessons
 * are structured rather than markdown so the landing page, the portal and
 * the progress tracking all read the same objects, and so a lesson can
 * carry code, downloads and a video without a parser deciding what is
 * what.
 *
 * The curriculum is public — the landing page lists every lesson by name.
 * Hiding the syllabus behind the purchase is how a $49 product looks like
 * a $49 gamble. What is gated is the content itself.
 */

export interface Lesson {
  slug: string;
  title: string;
  /** One line on the landing page's curriculum list. */
  summary: string;
  minutes: number;
  /** Free preview lessons are readable without buying. Two of them. */
  free?: boolean;
  /** What the lesson ships beyond the written steps. */
  assets?: { kind: "video" | "repo" | "template" | "checklist"; label: string }[];
}

export interface Module {
  number: string;
  title: string;
  /** What someone can do at the end of this module that they could not before. */
  outcome: string;
  lessons: Lesson[];
}

export const COURSE = {
  slug: "programmatic-google-ads",
  title: "Programmatic Google Ads with Claude Code",
  tagline: "Run a Google Ads account from the terminal — built, launched and managed through the API.",
  priceCents: 4900,
  /** Shown struck through only if it is real. Left null until it is. */
  compareAtCents: null as number | null,
  summary:
    "A complete build: authenticate against the Google Ads API, create campaigns from a config file, pull performance every morning, and let Claude Code do the daily work an account manager charges a retainer for. Written steps, working code, and the repo to clone.",
  audience: [
    "You run ads for your own business and resent the hours",
    "You manage accounts for clients and want the same hours back",
    "You are technical enough to open a terminal and paste a command",
  ],
  notFor: [
    "Anyone looking for a magic script that prints money",
    "Anyone who wants to avoid understanding how the account works",
  ],
  requirements: [
    "A Google Ads account (a live one, or a test account — the course covers both)",
    "Claude Code installed, and an Anthropic API key",
    "Node or Python — every example ships in both",
  ],
  outcomes: [
    "A working Google Ads API connection with refresh tokens that do not expire on you",
    "Campaigns, ad groups, keywords and ads created from a file you can version control",
    "A morning report that lands before you open the laptop",
    "Claude Code reading yesterday's search terms and proposing negatives with reasons",
    "Guardrails so an agent can never spend more than you decided it could",
  ],
} as const;

export const MODULES: Module[] = [
  {
    number: "01",
    title: "Get connected",
    outcome: "You can make an authenticated API call and see your own account data come back.",
    lessons: [
      {
        slug: "why-the-api",
        title: "Why the API beats the interface",
        summary: "What becomes possible when the account is code, and what genuinely does not.",
        minutes: 6,
        free: true,
        assets: [{ kind: "video", label: "6 min walkthrough" }],
      },
      {
        slug: "developer-token",
        title: "Developer token, OAuth and the test account",
        summary: "The approval path, start to finish, including what to write on the application.",
        minutes: 14,
        free: true,
        assets: [{ kind: "checklist", label: "Application checklist" }],
      },
      {
        slug: "first-call",
        title: "Your first authenticated call",
        summary: "Refresh tokens that keep working, and a call that returns your campaigns.",
        minutes: 12,
        assets: [
          { kind: "video", label: "12 min walkthrough" },
          { kind: "repo", label: "auth/ starter" },
        ],
      },
      {
        slug: "claude-code-setup",
        title: "Wiring it into Claude Code",
        summary: "A skill that gives Claude Code the account context and the commands it may run.",
        minutes: 15,
        assets: [{ kind: "repo", label: "Claude Code skill" }],
      },
    ],
  },
  {
    number: "02",
    title: "Build a campaign from a file",
    outcome: "A full campaign structure exists in your account, created from config you can diff.",
    lessons: [
      {
        slug: "campaign-as-config",
        title: "The account as a config file",
        summary: "Campaign, ad groups, keywords and ads described in one file a human can read.",
        minutes: 16,
        assets: [{ kind: "template", label: "campaign.yaml" }],
      },
      {
        slug: "creating-resources",
        title: "Creating resources with mutate operations",
        summary: "Batched creates, temporary resource ids, and what to do when half of it fails.",
        minutes: 18,
        assets: [
          { kind: "video", label: "18 min walkthrough" },
          { kind: "repo", label: "build/ scripts" },
        ],
      },
      {
        slug: "naming-and-structure",
        title: "Structure that survives contact with reality",
        summary: "Naming conventions that make later automation possible instead of painful.",
        minutes: 10,
        assets: [{ kind: "template", label: "Naming convention" }],
      },
      {
        slug: "dry-run",
        title: "Validate-only: building without spending",
        summary: "Run the whole build against the API with nothing created, until it is right.",
        minutes: 9,
      },
    ],
  },
  {
    number: "03",
    title: "Reporting that arrives without you",
    outcome: "Yesterday's numbers land in your inbox each morning, in plain language.",
    lessons: [
      {
        slug: "gaql",
        title: "GAQL without the guesswork",
        summary: "The query language, the fields that matter, and the ones that mislead.",
        minutes: 17,
        assets: [{ kind: "template", label: "Query cookbook" }],
      },
      {
        slug: "morning-report",
        title: "The morning report",
        summary: "Spend, conversions, and what changed — written by Claude Code, not a dashboard.",
        minutes: 14,
        assets: [
          { kind: "video", label: "14 min walkthrough" },
          { kind: "repo", label: "report/ scripts" },
        ],
      },
      {
        slug: "conversion-truth",
        title: "Making conversions mean something",
        summary: "Offline conversion imports, so the bot optimises to booked work, not form fills.",
        minutes: 19,
      },
    ],
  },
  {
    number: "04",
    title: "The daily work, automated",
    outcome: "Search terms, budgets and bids get reviewed every day whether you do or not.",
    lessons: [
      {
        slug: "search-terms",
        title: "Search term review on a schedule",
        summary: "Claude Code reads yesterday's terms and proposes negatives with its reasoning.",
        minutes: 20,
        assets: [
          { kind: "video", label: "20 min walkthrough" },
          { kind: "repo", label: "daily/ scripts" },
        ],
      },
      {
        slug: "budget-pacing",
        title: "Budget pacing between campaigns",
        summary: "Move money toward what converts, inside limits you set in advance.",
        minutes: 16,
      },
      {
        slug: "ad-testing",
        title: "Ad testing that never stops",
        summary: "Generate variants, ship them, retire the losers on evidence.",
        minutes: 15,
        assets: [{ kind: "template", label: "Ad copy prompts" }],
      },
    ],
  },
  {
    number: "05",
    title: "Guardrails",
    outcome: "You can hand an agent the account without lying awake about it.",
    lessons: [
      {
        slug: "spend-limits",
        title: "Hard limits an agent cannot cross",
        summary: "Caps enforced in your code, not in the prompt — the difference matters.",
        minutes: 13,
        assets: [{ kind: "repo", label: "guardrails/" }],
      },
      {
        slug: "approval-gates",
        title: "What needs a human, and when",
        summary: "Auto-apply the safe changes, queue the rest for a thirty-second review.",
        minutes: 12,
      },
      {
        slug: "audit-log",
        title: "Logging every change",
        summary: "A record of what changed, when, and why — the thing you will want in month three.",
        minutes: 11,
        assets: [{ kind: "checklist", label: "Pre-launch checklist" }],
      },
    ],
  },
];

export const ALL_LESSONS = MODULES.flatMap((module) =>
  module.lessons.map((lesson) => ({ ...lesson, module: module.number, moduleTitle: module.title }))
);

export const COURSE_STATS = {
  modules: MODULES.length,
  lessons: ALL_LESSONS.length,
  minutes: ALL_LESSONS.reduce((sum, lesson) => sum + lesson.minutes, 0),
  videos: ALL_LESSONS.filter((l) => l.assets?.some((a) => a.kind === "video")).length,
  downloads: ALL_LESSONS.filter((l) => l.assets?.some((a) => a.kind !== "video")).length,
};

export const FAQS = [
  {
    q: "Do I need to be a developer?",
    a: "You need to be comfortable opening a terminal and running a command someone gives you. Every script is provided working, and every step explains what it does and why. If you have ever edited a config file, you will be fine.",
  },
  {
    q: "How long does the Google Ads API approval take?",
    a: "Basic access usually comes back within a few days, and the course starts you on a test account so you can build the whole thing while you wait. The application checklist in module one is the part most people get wrong.",
  },
  {
    q: "Will this get my account suspended?",
    a: "No. Everything here uses the official API the way Google intends, inside their rate limits. The guardrails module exists specifically so an automated change can never do something you did not authorise.",
  },
  {
    q: "What does it cost to run once I have built it?",
    a: "The API is free. You pay for Claude usage, which for a daily review of one account is a few dollars a month, and your ad spend, which is unchanged.",
  },
  {
    q: "Does it work with multiple accounts?",
    a: "Yes. The scripts take an account id, so running them across a manager account is a loop. The naming conventions lesson is what makes that painless later.",
  },
  {
    q: "What if it is not for me?",
    a: "Email us within 30 days and we refund it, no questions and no forms. Two lessons are free to read before you buy so you can judge the style first.",
  },
];
