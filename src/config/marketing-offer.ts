/** Public commercial terms. Shared by the homepage and pricing page. */
export const AUDIT_OFFER = {
  name: "BOT workflow audit",
  price: 499,
  priceLabel: "$499",
  turnaround: "two business days",
  cta: "Request a $499 workflow audit",
  shortCta: "BOT audit · $499",
} as const;

export const MARKETING_PLANS = [
  {
    key: "one", name: "One BOT", label: "Single operating mandate", setup: 7500, monthly: 2500,
    from: false, featured: false, botRange: "One defined workflow",
    description: "Deploy one managed BOT against a defined business process, with documented integrations, authority and acceptance criteria.",
    features: ["One specialized BOT", "Workflow discovery and configuration", "Agreed integrations and acceptance testing", "Monitored launch and ongoing maintenance", "Monthly activity and results review"],
  },
  {
    key: "growth", name: "Growth System", label: "Coordinated operating system", setup: 15000, monthly: 3500,
    from: true, featured: true, botRange: "Initial 3–5 BOT deployment. Expansion to 10 by scope.",
    description: "Coordinate multiple workflows across demand generation, revenue operations and customer lifecycle management through a phased deployment.",
    features: ["An initial system of 3–5 specialized BOTS", "Expansion to 10 BOTS by agreed scope", "Connected workflows across your tools", "Shared reporting and approval controls", "Ongoing monitoring, maintenance and tuning"],
  },
  {
    key: "enterprise", name: "Enterprise", label: "Built around your organization", setup: null, monthly: null,
    from: false, featured: false, botRange: "Custom architecture, BOT count and operating capacity.",
    description: "For multiple locations, complex operating models or requirements that need dedicated architecture and governance.",
    features: ["A custom number of BOTS and workflows", "Multiple teams, brands or locations", "Custom integrations and operating capacity", "Defined access and approval policies", "Support and reporting agreed for your team"],
  },
] as const;

export function formatPlanPrice(value: number | null, from = false): string {
  return value === null ? "Custom" : `${from ? "From " : ""}$${value.toLocaleString("en-US")}`;
}

export const PRICING_SCOPE_NOTE = "Your proposal defines the BOTS, workflows, integrations, included usage and support. Growth expansion is scoped separately; ten BOTS are not included at the starting retainer. Ad spend and third-party usage charges are separate and agreed before launch.";

export const PRICING_FAQ = [
  { q: "What does setup include?", a: "Discovery, workflow design, BOT configuration, agreed integrations, testing and a monitored launch. You approve the scope and acceptance criteria before the build starts." },
  { q: "Does Growth include ten BOTS for $3,500 a month?", a: "No. Growth starts with a scoped system of 3–5 BOTS. You can expand to ten as your needs grow. Additional setup, operating capacity and support are quoted before you approve an expansion." },
  { q: "What does the retainer cover?", a: "Operating and maintaining the agreed system: monitoring, tuning, issue handling and reporting. Included usage, integrations and support are written into your proposal so you can see exactly what is covered." },
  { q: "Are ad spend and usage charges included?", a: "Ad spend is separate and paid through your own accounts. Third-party usage charges and any included allowance are specified in the proposal. Additional paid usage requires approval." },
  { q: "What stays under my control?", a: "Your customer relationships and business accounts remain yours. Access, approval rules, data handling and the handover process are defined before launch. Sending, publishing, changing ads and writing to connected systems require human approval." },
  { q: "Do I need to choose a package now?", a: `No. The ${AUDIT_OFFER.priceLabel} ${AUDIT_OFFER.name} identifies a credible starting workflow before you select an implementation package. You receive written findings within ${AUDIT_OFFER.turnaround}. Implementation timing is confirmed after we understand your scope.` },
];
