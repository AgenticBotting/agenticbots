import { ActivityLog } from "./ProductUI";

/**
 * Formerly an animated "factory" illustration. Replaced (Oct 2026) with a
 * plain rendering of the product: the bot's job list for this page, as
 * it appears in the client dashboard. Same props, so every call site
 * keeps working.
 */

const DEFAULT_STATIONS = [
  { label: "Answered a missed call by text", meta: "38s" },
  { label: "Followed up on an open quote", meta: "12m" },
  { label: "Booked an estimate on the calendar", meta: "26m" },
  { label: "Logged every conversation to the CRM", meta: "41m" },
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
