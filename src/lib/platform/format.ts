/** Formatting helpers — client-safe, no data access. */

export function money(cents: number | undefined, opts: { exact?: boolean } = {}): string {
  const c = cents ?? 0;
  return (c / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts.exact || c % 100 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

export function usd(n: number | undefined, digits = 2): string {
  return (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function num(n: number | undefined): string {
  return (n ?? 0).toLocaleString("en-US");
}

export function compact(n: number | undefined): string {
  return (n ?? 0).toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 });
}

export function dateLabel(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
}

export function dateTime(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function timeOnly(iso: string | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
}

export function ago(iso: string | undefined, now = Date.now()): string {
  if (!iso) return "never";
  const s = Math.round((now - Date.parse(iso)) / 1000);
  if (s < 0) return inFuture(-s);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return dateLabel(iso);
}

function inFuture(s: number): string {
  const m = Math.round(s / 60);
  if (m < 60) return `in ${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `in ${h}h`;
  return `in ${Math.round(h / 24)}d`;
}

export function duration(startIso?: string, endIso?: string): string {
  if (!startIso) return "—";
  const ms = (endIso ? Date.parse(endIso) : Date.now()) - Date.parse(startIso);
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function titleCase(s: string): string {
  const t = s.replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function shortId(id: string | undefined): string {
  return id ? id.slice(0, 8) : "—";
}
