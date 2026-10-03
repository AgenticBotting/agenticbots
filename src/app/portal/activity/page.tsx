import { requirePortalPage } from "@/server/auth/guard";
import { portalData } from "@/server/views/portal";
import { Feed } from "@/components/platform/portal";

export const metadata = { title: "Activity" };

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ bot?: string }> }) {
  const { org } = await requirePortalPage();
  const d = await portalData(org);
  const bot = (await searchParams).bot;
  const items = bot ? d.activity.filter((a) => a.botName === bot) : d.activity;
  return (
    <>
      <h1>Activity</h1>
      <p className="lede">Everything your Bots did, in plain language.</p>
      <form className="pf-filters mt-6">
        <label className="sr-only" htmlFor="bot">Bot</label>
        <select id="bot" name="bot" defaultValue={bot ?? ""} className="field"><option value="">All Bots</option>{d.bots.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}</select>
        <button className="btn btn-outline">Show</button>
      </form>
      <Feed items={items.slice(0, 200)} />
    </>
  );
}
