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
  | { type: "quote"; text: string };

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
    title: "Speed to lead is the whole game",
    excerpt:
      "Most businesses do not have a lead problem. They have a response-time problem, and it is costing them roughly half the customers they already paid to reach.",
    date: "2026-08-18",
    readMinutes: 6,
    category: "Sales",
    body: [
      { type: "p", text: "Ask a business owner why they are not growing and you will usually hear the same answer: not enough leads. Then you look at the data and find they got ninety inbound enquiries last month and called back forty-one of them." },
      { type: "p", text: "That is not a lead problem. That is a response problem, and it is the cheapest thing in the entire funnel to fix." },
      { type: "h2", text: "What the timing actually looks like" },
      { type: "p", text: "A person filling in a form at 8pm is not sitting patiently. They are filling in three more. Whoever answers first has an enormous advantage, and it decays fast — not over days, over minutes." },
      { type: "ul", items: [
        "Under five minutes: you are usually the only one who called.",
        "Under an hour: you are one of two or three.",
        "Next morning: the job is often already booked with someone else.",
      ]},
      { type: "p", text: "None of this is new. What is new is that you no longer need a human sitting by the phone to win it." },
      { type: "h2", text: "Why the fix keeps not happening" },
      { type: "p", text: "Every owner knows they should respond faster. The reason they do not is not laziness — it is that the responsibility falls on a person who is also doing four other jobs. At 8pm on a Friday, that person is not going to answer, and no amount of process documentation changes it." },
      { type: "quote", text: "The work is not hard. Doing it every single time, at every hour, is the part humans are bad at." },
      { type: "h2", text: "What a bot changes" },
      { type: "p", text: "A speed-to-lead bot answers in seconds, every time, at any hour. It does not replace your salesperson — it buys them the conversation. By the time a human picks it up, the lead has been answered, qualified and often booked." },
      { type: "ul", items: [
        "Missed call gets a text back before the caller has dialled a competitor.",
        "Form submission gets a real reply, not an autoresponder.",
        "Qualifying questions get asked while the person is still paying attention.",
        "The booking lands on a real calendar with the right buffers.",
      ]},
      { type: "p", text: "The point is not that a bot sells better than your team. It is that a bot is awake at 8pm on a Friday, and your team is not." },
    ],
  },
  {
    slug: "what-agentic-actually-means",
    title: "What “agentic” actually means, without the hype",
    excerpt:
      "The word has been stretched to cover everything from a chatbot to a spreadsheet macro. Here is the distinction that matters when you are buying.",
    date: "2026-07-29",
    readMinutes: 5,
    category: "Fundamentals",
    body: [
      { type: "p", text: "Every tool on the market is suddenly agentic. Most of them are not. The word is worth defining precisely, because the difference determines whether you are buying something that works or something that generates work." },
      { type: "h2", text: "Automation versus agents" },
      { type: "p", text: "Automation follows a fixed path. If this, then that. It is reliable and it is limited: the moment reality steps outside the path you drew, it stops or does the wrong thing." },
      { type: "p", text: "An agent is given a goal and a set of tools, and works out the steps. It can read a reply, decide it is a scheduling question rather than a pricing question, look at a calendar, propose three times, and update a record — none of which was scripted as a branch." },
      { type: "h2", text: "Why that distinction matters commercially" },
      { type: "ul", items: [
        "Automation breaks on the exceptions. Exceptions are most of your business.",
        "Agents handle the exception and escalate the ones they should not touch.",
        "Automation needs someone to maintain the branches forever.",
        "Agents need rules and review, which is far less ongoing work.",
      ]},
      { type: "h2", text: "The honest limitation" },
      { type: "p", text: "Agents are not magic and they should not be trusted blindly. The ones that work in production have three things: clear escalation rules, a full log of every action, and a monitored period before they run on their own." },
      { type: "quote", text: "If a vendor cannot show you the log of what their agent did and why, you are not buying an agent. You are buying a liability." },
      { type: "p", text: "Ask for the log. Ask what happens when it is unsure. Ask what it is not allowed to do. Those three answers tell you more than any demo." },
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
      { type: "p", text: "Stop asking humans to do it. Calls, emails and meetings already exist as data somewhere. A bot can log them against the right record, move the deal on real signals, and flag conflicts rather than guessing." },
      { type: "ul", items: [
        "Activity logged automatically from the systems where it already happened.",
        "Stages advanced on evidence — a proposal sent, a meeting held.",
        "Duplicates merged on a schedule with explicit rules.",
        "Human-entered data wins on conflict; the bot fills gaps and flags the rest.",
      ]},
      { type: "quote", text: "A CRM nobody trusts is worse than no CRM, because you are still paying for it and still making decisions from it." },
      { type: "h2", text: "Start with cleanup, not automation" },
      { type: "p", text: "There is no point automating on top of records nobody believes. Clean first, then automate the maintenance, then build reporting on it. In that order — the reverse never holds." },
    ],
  },
];

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export const SORTED_POSTS = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
