import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BotPlanFlow, ConsoleGreeting } from "@/components/marketing";
import { MarketingOnly } from "@/components/marketing/MarketingOnly";
import { JsonLd, orgLd, webSiteLd } from "@/components/JsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://agenticbots.dev";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#080A08" },
    { media: "(prefers-color-scheme: dark)", color: "#080A08" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AgenticBots — A coordinated BOT workforce",
    template: "%s | AgenticBots",
  },
  description:
    "A managed BOT workforce for contractors. Connect marketing, sales and customer operations with defined workflows, human approvals and reviewable activity.",
  keywords: [
    "agentic bots",
    "AI marketing automation",
    "AI sales bots",
    "lead generation bots",
    "AI SDR",
    "marketing bots",
    "revenue operations automation",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "AgenticBots",
    url: SITE_URL,
    title: "AgenticBots — A coordinated BOT workforce",
    description:
      "Specialized BOTS, connected workflows and ongoing operation for contractors and local service businesses.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgenticBots — A coordinated BOT workforce",
    description:
      "Specialized BOTS, connected workflows and ongoing operation for contractors and local service businesses.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <JsonLd data={[orgLd, webSiteLd]} />
        {children}
        <MarketingOnly>
          <BotPlanFlow />
          <ConsoleGreeting />
        </MarketingOnly>

      </body>
    </html>
  );
}
