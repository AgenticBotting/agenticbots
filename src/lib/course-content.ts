/**
 * Lesson bodies.
 *
 * Only the free previews are written so far — the rest are produced as
 * the course is recorded. A lesson with no body renders as "being
 * written", which is the honest state: promising content that does not
 * exist yet is the fastest way to earn a refund.
 *
 * Blocks rather than markdown, same as the blog: no parser in the
 * bundle, and code blocks keep their language and filename.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; lang: string; file?: string; text: string }
  | { type: "note"; title?: string; text: string }
  | { type: "quote"; text: string };

export const LESSON_BODIES: Record<string, Block[]> = {
  "why-the-api": [
    {
      type: "p",
      text: "The Google Ads interface is built for a person doing one thing at a time. That is the right design for a person, and the wrong one for the work that actually moves an account: the same review, on the same data, every single day, forever.",
    },
    {
      type: "p",
      text: "Here is the honest version of what changes when the account becomes code, and what does not.",
    },
    { type: "h2", text: "What genuinely changes" },
    {
      type: "ul",
      items: [
        "Review frequency. A daily search-term pass is twenty minutes of human attention or four seconds of script. The script wins because it happens on the days you are busy.",
        "Consistency. Naming, structure, negatives and budget rules get applied the same way every time, because they are written down as code rather than remembered.",
        "Reversibility. Changes made through a file you version control can be diffed, reviewed and rolled back. Changes made in the interface cannot.",
        "Scale. What you built for one account runs across thirty with a loop. This is the part that turns an hour a day into an hour a week.",
      ],
    },
    { type: "h2", text: "What does not change" },
    {
      type: "p",
      text: "The API does not know your business. It cannot tell you that the twelve-dollar click on \"emergency roof repair\" is worth four times the sixty-cent click on \"roof repair cost\", because that lives in your job data, not in Google's. Automation without that context optimises confidently toward the wrong thing.",
    },
    {
      type: "quote",
      text: "Automating a bad account structure gets you to the wrong answer faster, and with more confidence. Fix the structure first.",
    },
    { type: "h2", text: "Where Claude Code fits" },
    {
      type: "p",
      text: "Most of this course is ordinary scripting — authenticate, query, mutate. That part is deterministic and should stay that way; you do not want a language model deciding what a budget is.",
    },
    {
      type: "p",
      text: "What Claude Code is genuinely good at is the judgement layer in between: reading yesterday's four hundred search terms and telling you which twelve are waste and why, drafting ad variants against what already converts, and explaining in plain English what changed while you were asleep. The scripts do the doing; the model does the reading and the reasoning, and every decision it proposes is logged with its argument attached.",
    },
    {
      type: "note",
      title: "The shape of the whole course",
      text: "Scripts make the changes. Claude Code decides what to propose. Guardrails, written in code and not in a prompt, decide what it is allowed to do without asking you.",
    },
    { type: "h2", text: "What you need before the next lesson" },
    {
      type: "ol",
      items: [
        "A Google Ads account you can log in to — a live one is ideal, but the next lesson sets up a test account either way.",
        "Claude Code installed and working.",
        "Node 20 or later, or Python 3.11 or later. Every example ships in both.",
      ],
    },
    {
      type: "p",
      text: "Next: getting a developer token approved without the two-week round trip most people go through.",
    },
  ],

  "developer-token": [
    {
      type: "p",
      text: "Everything in this course runs on three credentials: a developer token, an OAuth client, and a refresh token. This lesson gets all three, in the order that avoids waiting.",
    },
    {
      type: "note",
      title: "Start this today",
      text: "Token approval takes a few days. Apply first, then build against a test account while you wait — nothing later in the course is blocked by it.",
    },
    { type: "h2", text: "1. The manager account" },
    {
      type: "p",
      text: "Developer tokens belong to manager accounts, not to ordinary ones. If you do not have a manager account, create one at ads.google.com/home/tools/manager-accounts — it is free, and linking your existing account to it changes nothing about how the account runs.",
    },
    { type: "h2", text: "2. Apply for the token" },
    {
      type: "p",
      text: "In the manager account: Tools → Setup → API Center. You get a token immediately, but it starts at test-account access, which only works against test accounts. Basic access is the one you want, and it is an application.",
    },
    {
      type: "p",
      text: "The application asks what you are building. This is where most rejections come from — vague answers read as reselling. Be specific and boring:",
    },
    {
      type: "code",
      lang: "text",
      file: "application-answer.txt",
      text: `We manage our own advertising account and use the API for internal
reporting and routine optimisation. Specifically:

· pull campaign, ad group and search term performance daily into our
  own reporting
· add negative keywords identified by that reporting
· adjust campaign budgets within limits set by our team
· create campaigns from an internal configuration file

The tool is internal only. We do not offer it to third parties, and we
do not store or display Google Ads data for anyone outside our company.`,
    },
    {
      type: "ul",
      items: [
        "Say internal use, if it is internal use. It is the fastest path.",
        "Name the specific operations. \"Automating our marketing\" gets a follow-up email; the list above usually does not.",
        "Do not mention reselling, white-labelling or dashboards for clients unless that is genuinely what you are doing — in which case say so and expect more questions.",
      ],
    },
    { type: "h2", text: "3. OAuth client" },
    {
      type: "p",
      text: "In Google Cloud Console: create a project, enable the Google Ads API, then Credentials → Create credentials → OAuth client ID → Desktop app. Desktop, not Web — it makes the local refresh-token step below work without hosting anything.",
    },
    {
      type: "p",
      text: "Download the JSON. You need two values from it: the client id and the client secret.",
    },
    { type: "h2", text: "4. The refresh token" },
    {
      type: "p",
      text: "This is the step people get wrong, and the symptom is an integration that dies a week later. A refresh token from a testing-mode OAuth app expires in seven days. Set the consent screen to production before you generate one.",
    },
    {
      type: "code",
      lang: "bash",
      file: "get-refresh-token.sh",
      text: `# Generates a long-lived refresh token against your OAuth client.
# Run it once; store what it prints.
npx google-ads-refresh-token \\
  --client-id "$GOOGLE_ADS_CLIENT_ID" \\
  --client-secret "$GOOGLE_ADS_CLIENT_SECRET"`,
    },
    {
      type: "note",
      title: "If your token keeps expiring",
      text: "Google Cloud Console → OAuth consent screen → Publishing status must say \"In production\". In \"Testing\" every refresh token dies after seven days, and the error you get back says nothing about why.",
    },
    { type: "h2", text: "5. Store them" },
    {
      type: "code",
      lang: "bash",
      file: ".env",
      text: `GOOGLE_ADS_DEVELOPER_TOKEN=...
GOOGLE_ADS_CLIENT_ID=...
GOOGLE_ADS_CLIENT_SECRET=...
GOOGLE_ADS_REFRESH_TOKEN=...
GOOGLE_ADS_LOGIN_CUSTOMER_ID=1234567890   # manager account, no dashes
GOOGLE_ADS_CUSTOMER_ID=9876543210         # the account you are working on`,
    },
    {
      type: "p",
      text: "Both customer ids go in without dashes. The login one is the manager account; the customer one is the account being changed. Getting these the wrong way round produces a permission error that reads like an authentication failure, and costs people an afternoon.",
    },
    {
      type: "p",
      text: "Next lesson: the first authenticated call, and seeing your own campaigns come back as JSON.",
    },
  ],
};

export function hasBody(slug: string): boolean {
  return Array.isArray(LESSON_BODIES[slug]) && LESSON_BODIES[slug].length > 0;
}
