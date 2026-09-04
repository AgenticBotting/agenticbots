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
      updated="September 3, 2026"
      intro="This policy explains what we collect when you use agenticbots.dev, why we collect it, and what we do and do not do with it."
      sections={[
        { h: "What we collect", p: [
          "When you submit a bot plan request or contact form we collect the information you type: your name, email address, company, the area you want help with, and anything you write in the message field.",
          "We also collect standard technical information automatically — IP address, browser type, pages visited and referring URL — for security, rate limiting and understanding which pages are useful.",
        ]},
        { h: "How we use it", p: [
          "To respond to your request and prepare the bot plan you asked for. To follow up about that request. To improve the site.",
          "We do not sell your information. We do not share it with advertisers. We do not add you to unrelated marketing lists because you filled in a form.",
        ]},
        { h: "Who we share it with", p: [
          "Service providers who help us operate: our email delivery provider, our email marketing platform, and our hosting provider. Each processes data only to provide their service to us.",
          "We will disclose information if legally required to do so, and we will tell you unless prohibited.",
        ]},
        { h: "Retention", p: [
          "We keep enquiry records for as long as the business relationship is active, and for a reasonable period afterward for our own records. You can ask us to delete yours at any time.",
        ]},
        { h: "Your rights", p: [
          "You can ask what we hold about you, ask us to correct it, ask us to delete it, and unsubscribe from any email at any time. Email us and we will action it.",
        ]},
        { h: "Cookies", p: [
          "We use only what is necessary to make the site work and to understand aggregate traffic. We do not run third-party advertising trackers on this site.",
        ]},
      ]}
    />
  );
}
