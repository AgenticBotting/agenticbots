import { requireOperatorPage } from "@/server/auth/guard";
import { ProspectingNav } from "@/components/platform/ProspectingNav";

export default async function ProspectingLayout({ children }: { children: React.ReactNode }) {
  await requireOperatorPage();
  return (
    <>
      <ProspectingNav />
      {children}
    </>
  );
}
