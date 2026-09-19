import type { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import { Container } from "@/components/ui";
import { CourseSignIn } from "@/components/course/CourseSignIn";

export const metadata: Metadata = {
  title: "Course sign in",
  description: "Sign in to your AgenticBots course account.",
  alternates: { canonical: "/course/login" },
  // A login page has nothing to rank for and should never appear in
  // search results above the page that actually sells the course.
  robots: { index: false, follow: true },
};

export default function CourseLoginPage() {
  return (
    <>
      <Header />
      <main>
        <Container className="py-16 sm:py-24">
          <div className="mx-auto max-w-[400px]">
            <CourseSignIn />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
