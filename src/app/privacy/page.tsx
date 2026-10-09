import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How AgenticBots collects, uses and protects your information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="October 9, 2026"
      intro="This policy explains how information is handled across our website, proposal intake and business service platform."
      sections={[
        {
                "h": "Scope and contact",
                "p": [
                        "AgenticBots provides business marketing and managed BOT services. This notice covers our website, proposal requests, business accounts and service platform. Contact hello@agenticbots.dev about privacy, access, correction, deletion or marketing opt-outs. Our intended market is the United States.",
                        "For information a client provides to us to operate its services, we act under that client’s instructions and agreement. If your request concerns a client’s customer records, we will identify the responsible business and coordinate the response."
                ]
        },
        {
                "h": "Information you provide",
                "p": [
                        "Proposal and contact forms collect your name, business email, company, website, optional phone number, service priorities and message. Qualification questions also collect your current tools, team size and structure, revenue range, budget ranges, purchasing role and implementation timeline.",
                        "Business accounts contain your name, email, organization, role, password hash, invitation and session records. Staff passkey registration stores a public verification key; the private passkey stays with your authenticator. Service records may include requests, conversations, prepared work, approval decisions, BOT activity, integration connection status and business configuration.",
                        "Billing records contain service agreements, invoices, amounts, payment status and operator-entered references for manual payments. We do not ask for card numbers in these forms. Do not put passwords, access tokens, health information, financial account numbers or identity documents in contact forms or request messages."
                ]
        },
        {
                "h": "Technical and business research information",
                "p": [
                        "Hosting and security systems may process IP addresses, request metadata and browser information to deliver the service, prevent abuse and investigate problems. Application sign-in rate limits use hashed identifiers. Security and audit records document access and important account actions.",
                        "Business research may include company websites, locations, business contact details, job titles, public business information and its source. Public availability alone does not permit every use: provider permissions, client instructions and contact preferences govern whether information can be retained, reused or contacted. Private client records are kept separate from shared business research."
                ]
        },
        {
                "h": "Purposes and sharing",
                "p": [
                        "We use information to respond to enquiries, prepare proposals, administer accounts and agreements, deliver requested services, route work for approval, maintain security, handle payments and answer privacy requests. Submitting an enquiry does not subscribe you to a marketing list.",
                        "Authorized hosting, database, cloud infrastructure and email delivery providers process information needed to operate those functions. When a client enables BOT processing or integrations, selected model and tool providers may receive the minimum task information needed under the agreed configuration. Credentials are held server-side and are not intended to enter BOT prompts or client pages.",
                        "We do not currently sell personal information, share it for cross-context behavioral advertising or run marketing campaigns. We may disclose information when legally required, to protect rights and security, or in a business transaction subject to applicable safeguards. We cannot promise that data is processed only in the United States; provider terms and processing locations must be considered for each engagement."
                ]
        },
        {
                "h": "Cookies, tracking and communications",
                "p": [
                        "The site uses necessary account and security cookies. Optional analytics, advertising pixels and session replay are disabled. We do not load tracking scripts on account, form, message or billing pages. If optional tracking is introduced, this notice and the consent controls must be updated before activation.",
                        "Service replies concern your enquiry or account. Marketing email is not currently enabled. Any future marketing program must provide an unsubscribe mechanism, a valid sender postal address and a process that honors opt-outs. You can already request no marketing contact by emailing us."
                ]
        },
        {
                "h": "Retention and your choices",
                "p": [
                        "We retain information only as needed for the stated purpose, the service agreement, security and applicable recordkeeping obligations. Specific retention and deletion schedules are reviewed before a live engagement. We may need to keep restricted financial, audit or dispute records when deletion of operational information is appropriate. Backup copies may persist until their retention period expires.",
                        "You can request access, correction, deletion or no marketing contact by email. Signed-in clients can also use Account & privacy in the client portal. We record requests, verify identity and authority using proportionate means, and explain the outcome or any lawful limitation. Do not email identity documents unless we have arranged an appropriate verification method.",
                        "Privacy rights vary by residence and applicable law. We will evaluate applicable requests without unlawful discrimination, explain any refusal and provide a way to ask us to review it. A business account does not establish authority to obtain another person’s information."
                ]
        },
        {
                "h": "Children, security and changes",
                "p": [
                        "These services are intended for adults acting for businesses, not children. We do not knowingly collect personal information from children under 13. If you believe a child supplied information, contact us so we can restrict processing, verify the circumstances and arrange deletion where required.",
                        "We use access restrictions, tenant boundaries and other technical and organizational safeguards. No system can guarantee complete security. This notice may change as services and providers change; the version date identifies the current notice, and material changes will be communicated where required."
                ]
        }
]}
    />
  );
}
