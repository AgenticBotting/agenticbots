import type { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import { Container } from "@/components/ui";
import { Portal } from "@/components/course/Portal";

export const metadata: Metadata = {
  title: "Your course",
  description: "Lessons, downloads and progress for Programmatic Google Ads with Claude Code.",
  alternates: { canonical: "/course/portal" },
  robots: { index: false, follow: false },
};

export default function PortalPage() {
  return (
    <>
      <Header />
      <main>
        <Container className="py-12 sm:py-16 max-w-[900px]">
          <Portal />
        </Container>
      </main>
      <Footer />
    </>
  );
}
