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
      updated="September 3, 2026"
      intro="These terms cover your use of this website. Engagements for actual work are governed by the separate written agreement we sign with you, which takes precedence over anything here."
      sections={[
        { h: "Using this site", p: [
          "You may use this site for lawful purposes. Do not attempt to disrupt it, probe it for vulnerabilities without permission, or scrape it at a volume that degrades it for others.",
        ]},
        { h: "What we publish here", p: [
          "Content on this site is provided for general information. Pricing shown is a starting point, not a quote, and does not constitute an offer. Scope and price for any engagement are set in a written agreement.",
          "Case examples and metrics describe outcomes we have seen. They are not a prediction or guarantee of your results.",
        ]},
        { h: "Services", p: [
          "Work we perform is governed by a signed statement of work covering scope, fees, timelines, ownership and termination. Nothing on this page overrides it.",
          "Where we build on third-party platforms, those platforms' own terms apply to your accounts and we do not control their availability, pricing or policy changes.",
        ]},
        { h: "Ownership", p: [
          "The content, design and code of this site belong to us. Work product created for a client under a signed agreement belongs to that client as set out in the agreement.",
        ]},
        { h: "Liability", p: [
          "This site is provided as is. To the fullest extent permitted by law we are not liable for indirect or consequential loss arising from its use. Liability under a signed services agreement is governed by that agreement.",
        ]},
        { h: "Changes", p: [
          "We may update these terms. The date at the top reflects the most recent change. Continued use of the site after an update means you accept it.",
        ]},
      ]}
    />
  );
}
