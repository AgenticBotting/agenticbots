import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern use of agenticbots.dev and our services.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="October 9, 2026"
      intro="These terms cover your use of this website. Engagements for actual work are governed by the separate written agreement we sign with you, which takes precedence over anything here."
      sections={[
        { h: "Using this site", p: [
          "You may use this site for lawful purposes. Do not attempt to disrupt it, probe it for vulnerabilities without permission, or scrape it at a volume that degrades it for others.",
        ]},
        { h: "Business accounts", p: [
          "Accounts are for adults who are authorized to act for their business. Keep your access credentials private, use required security controls, and report suspected unauthorized access promptly. You are responsible for ensuring you have permission to provide information and connect business systems.",
          "BOT output can contain mistakes. Review prepared work and proposed actions before relying on them. Approving a draft records acceptance of that draft; a separate, specific approval is required for any enabled action that sends, publishes, changes advertising, writes to a business system or deletes information.",
        ]},
        { h: "What we publish here", p: [
          "Content on this site is provided for general information. Pricing shown is a starting point, not a quote, and does not constitute an offer. Scope and price for any engagement are set in a written agreement.",
          "Metrics, charts and consoles on this site describe what a deployment is built to do and are labelled as targets or illustrations. They are not client results and not a prediction or guarantee of your results.",
        ]},
        { h: "Services", p: [
          "Work we perform is governed by a signed statement of work covering scope, fees, timelines, ownership and termination. Nothing on this page overrides it.",
          "Where we build on third-party platforms, those platforms' own terms apply to your accounts and we do not control their availability, pricing or policy changes.",
        ]},
        { h: "Billing and cancellation", p: [
          "Submitting a proposal request is free and does not authorize payment, create a paid subscription or start recurring charges. Platform services require a separately signed agreement specifying fees, renewal, payment terms, scope, termination and any final charges. We currently record manual invoices and payments; this website does not provide an automatic subscription checkout for these services.",
          "Clients can submit a cancellation request through Account & privacy in the client portal or email hello@agenticbots.dev. No phone call is required. The request is recorded for review and its effective date follows the signed agreement; submitting it does not immediately stop service or erase required records. Confirmation and any final invoice are provided through the agreed service channel.",
        ]},
        { h: "Ownership", p: [
          "The content, design and code of this site belong to us. Work product created for a client under a signed agreement belongs to that client as set out in the agreement.",
        ]},
        { h: "Liability", p: [
          "This site is provided as is. To the fullest extent permitted by law we are not liable for indirect or consequential loss arising from its use. Liability under a signed services agreement is governed by that agreement.",
        ]},
        { h: "Changes", p: [
          "We may update these terms. The date at the top reflects the most recent change. Material account-term changes will be presented for notice or acceptance where required. Updated website terms do not silently change an existing signed service agreement.",
        ]},
      ]}
    />
  );
}
