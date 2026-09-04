import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BotPlanFlow, ExitIntent, RogueBot } from "@/components/marketing";
import Script from "next/script";
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
  alternates: { canonical: "/" },
  title: {
    default: "AgenticBots — Bots that get you customers",
    template: "%s | AgenticBots",
  },
  description:
    "We build and run the bots that find your customers and follow up until they buy — ads, SEO, email, outbound and CRM, handled continuously.",
  keywords: [
    "agentic bots",
    "AI marketing automation",
    "AI sales agents",
    "lead generation bots",
    "AI SDR",
    "marketing agents",
    "revenue operations automation",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "AgenticBots",
    url: SITE_URL,
    title: "AgenticBots — Bots that get you customers",
    description:
      "Marketing bots that find your customers. Sales bots that follow up until they buy.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgenticBots — Bots that get you customers",
    description:
      "Marketing bots that find your customers. Sales bots that follow up until they buy.",
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
        <BotPlanFlow />
        <ExitIntent />
        <RogueBot />
        {process.env.NEXT_PUBLIC_UMAMI_URL && process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <Script
            defer
            src={`${process.env.NEXT_PUBLIC_UMAMI_URL.replace(/\/$/, "")}/script.js`}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
