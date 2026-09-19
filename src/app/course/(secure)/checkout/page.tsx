import type { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import { Container } from "@/components/ui";
import { Checkout } from "@/components/course/Checkout";
import { COURSE, COURSE_STATS } from "@/lib/course";

export const metadata: Metadata = {
  title: "Get the course",
  description: `Programmatic Google Ads with Claude Code — ${COURSE_STATS.lessons} lessons, the repo, and lifetime updates for $${(COURSE.priceCents / 100).toFixed(0)}.`,
  alternates: { canonical: "/course/checkout" },
  // Checkout should never be the page that ranks for the course.
  robots: { index: false, follow: true },
};

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main>
        <Container className="py-12 sm:py-16">
          <Checkout />
        </Container>
      </main>
      <Footer />
    </>
  );
}
