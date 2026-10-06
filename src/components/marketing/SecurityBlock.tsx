import { Section } from "@/components/ui";

/**
 * Security & governance (audit fix #2). No humor in this section — spec rule.
 */
const ITEMS = [
  {
    t: "Tenant isolation",
    b: "Private client records are scoped to one organization, and each client runtime is isolated from every other deployment.",
  },
  {
    t: "Human authorization",
    b: "External communications, publishing, advertising changes and writes to connected systems follow explicit approval policies.",
  },
  {
    t: "Reviewable activity",
    b: "BOT RUNS, decisions, approvals and operator changes produce an activity and audit record for authorized review.",
  },
  {
    t: "Operational controls",
    b: "Deployments use monitored launch procedures, defined exception paths and controls to pause work when review is required.",
  },
  {
    t: "Least-privilege access",
    b: "Each BOT receives only the access required for its mandate. Write access and connected-system authority are scoped before launch.",
  },
  {
    t: "Documented operating scope",
    b: "The proposal defines integrations, authority, approval requirements, service boundaries and support responsibilities before implementation.",
  },
];

export function SecurityBlock() {
  return (
    <Section
      id="security"
      variant="dark"
      eyebrow="Security & governance"
      heading="Controls designed into every deployment."
      sub="Access, authority, approvals and reviewability are established as operating requirements before a BOT enters production."
    >
      <dl className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-ink-700 border border-ink-700">
        {ITEMS.map((it) => (
          <div key={it.t} className="bg-ink-800 p-7">
            <dt className="display-md text-white">{it.t}</dt>
            <dd className="body-sm mt-3">{it.b}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
