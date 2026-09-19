import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { CourseProvider } from "@/components/course/CourseProvider";

/**
 * The signed-in half of the course.
 *
 * A route group, so the URLs stay /course/login, /course/portal and
 * /course/checkout — but only these three pages read a session cookie,
 * and only these three are server-rendered per request.
 *
 * The landing page and the public lesson pages sit outside this group
 * and stay static, which is the whole point: the pages that sell the
 * course are the ones that need to be fast and indexable.
 */
export default function SecureCourseLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthNextjsServerProvider>
      <CourseProvider>{children}</CourseProvider>
    </ConvexAuthNextjsServerProvider>
  );
}
