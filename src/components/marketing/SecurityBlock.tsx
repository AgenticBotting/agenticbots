import { Section } from "@/components/ui";

/**
 * Security & governance (audit fix #2). No humor in this section — spec rule.
 */
const ITEMS = [
  {
    t: "Your data stays in your accounts",
    b: "Bots operate inside your CRM, ad platforms and inbox under scoped credentials you grant and can revoke at any time. We do not warehouse your customer data on our side.",
  },
  {
    t: "Human-in-the-loop by default",
    b: "Every bot launches in monitored mode. Escalation rules are explicit: anything ambiguous, sensitive or high-value routes to a person instead of being guessed at.",
  },
  {
    t: "Every action is logged",
    b: "Full audit trail — what the bot did, when, on which record, and why. If you cannot see the log, you should not trust the agent. You can see the log.",
  },
  {
    t: "Rollback, always",
    b: "Actions are reversible or staged wherever the underlying platform allows it, and every bot can be paused instantly without breaking the systems it connects.",
  },
  {
    t: "Least-privilege access",
    b: "Each bot gets the narrowest scopes that let it do its job — read-only wherever writing is not required. Credentials are stored encrypted and rotated.",
  },
  {
    t: "DPA available",
    b: "Data processing agreement and security documentation available on request for procurement and legal review. SOC 2 alignment on the roadmap and stated honestly as such.",
  },
];

export function SecurityBlock() {
  return (
    <Section
      id="security"
      variant="dark"
      eyebrow="Security & governance"
      heading="Autonomy you can audit."
      sub="Enterprise buyers should not have to take an agent vendor's word for anything. This is how the fleet is governed."
    >
      <dl className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-ink-700 rounded-[var(--radius)] border border-ink-700">
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
