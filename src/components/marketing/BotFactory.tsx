import { ActivityLog } from "./ProductUI";

/**
 * Formerly an animated "factory" illustration. Replaced (Oct 2026) with a
 * plain rendering of the product: the bot's job list for this page, as
 * it appears in the client dashboard. Same props, so every call site
 * keeps working.
 */

const DEFAULT_STATIONS = [
  { label: "Operating mandate accepted", meta: "2m" },
  { label: "System access reviewed", meta: "14m" },
  { label: "Approval policy loaded", meta: "37m" },
  { label: "BOT ACTIVITY record opened", meta: "1h" },
];

export function BotFactory({
  place,
  stations,
  title,
}: {
  place?: string;
  stations?: { label: string; meta: string }[];
  title?: string;
}) {
  const rows = stations?.length
    ? stations.slice(0, 4).map((s, i) => ({ t: ["2m", "14m", "37m", "1h"][i], body: `${s.label} · ${s.meta.toLowerCase()}` }))
    : DEFAULT_STATIONS.map((s) => ({ t: s.meta, body: s.label }));
  return (
    <ActivityLog
      title={title?.replace(/, going to work$/, "") ?? "Your bots"}
      crumb={place}
      rows={rows}
      summary={[
        { label: "Mandate", value: "Defined" },
        { label: "Authority", value: "Scoped" },
        { label: "Activity", value: "Recorded" },
      ]}
    />
  );
}
