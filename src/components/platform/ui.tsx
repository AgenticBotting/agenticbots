import Link from "next/link";
import { BotIndex } from "@/components/ui/BotIndex";
import { getBotType } from "@/config/bot-catalog";
import { ago, dateTime } from "@/lib/platform/format";
import { cn } from "@/lib/utils";

export function PageHead({
  title,
  description,
  crumbs,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  crumbs?: { href: string; label: string }[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="pf-page-head">
      <div>
        {crumbs && crumbs.length > 0 && (
          <nav className="pf-crumbs" aria-label="Breadcrumb">
            {crumbs.map((c, i) => (
              <span key={c.href}>
                <Link href={c.href}>{c.label}</Link>
                {i < crumbs.length - 1 && <span aria-hidden="true"> / </span>}
              </span>
            ))}
          </nav>
        )}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="pf-actions">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  sub,
  action,
  flush,
  children,
  className,
  id,
}: {
  title?: React.ReactNode;
  sub?: React.ReactNode;
  action?: React.ReactNode;
  flush?: boolean;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section className={cn("pf-panel", flush && "pf-panel-flush", className)} id={id} aria-label={typeof title === "string" ? title : undefined}>
      {(title || action) && (
        <header className="pf-panel-head">
          <div>
            {title && <h2>{title}</h2>}
            {sub && <div className="sub">{sub}</div>}
          </div>
          {action}
        </header>
      )}
      <div className="pf-panel-body">{children}</div>
    </section>
  );
}

export function Stats({ children }: { children: React.ReactNode }) {
  return <div className="pf-stats">{children}</div>;
}

export function Stat({ value, label, href, tone }: { value: React.ReactNode; label: string; href?: string; tone?: "bad" | "watch" }) {
  const cls = cn("pf-stat", tone === "bad" && "is-bad", tone === "watch" && "is-watch");
  const body = (
    <>
      <div className="v">{value}</div>
      <div className="l">{label}</div>
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function KV({ rows }: { rows: [React.ReactNode, React.ReactNode][] }) {
  return (
    <dl className="pf-kv">
      {rows.map(([k, v], i) => (
        <div key={i} style={{ display: "contents" }}>
          <dt>{k}</dt>
          <dd>{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="pf-empty">
      <strong>{title}</strong>
      {children}
    </div>
  );
}

export function Table({ head, children, empty }: { head: React.ReactNode[]; children: React.ReactNode; empty?: React.ReactNode }) {
  const hasRows = Array.isArray(children) ? children.flat().filter(Boolean).length > 0 : !!children;
  return (
    <div className="pf-table-wrap">
      <table className="pf-table">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col" className={typeof h === "string" && /^(Cost|Usage|Amount|Balance|Runs|Tokens|Value|Outstanding|Paid|Total|Occurrences|Est\.)/.test(h) ? "num" : undefined}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {!hasRows && (empty ?? <Empty title="Nothing here yet" />)}
    </div>
  );
}

export function BotName({ typeKey, name, href, size = "sm" }: { typeKey: string; name: string; href?: string; size?: "sm" | "md" }) {
  const icon = getBotType(typeKey)?.icon ?? "00";
  const inner = (
    <span className="inline-flex items-center gap-2.5 align-middle">
      <BotIndex index={icon} size={size} tone="dark" className={size === "sm" ? "!h-7 !w-7 !text-[11px]" : undefined} />
      <span className="font-semibold text-[var(--foreground)]">{name}</span>
    </span>
  );
  return href ? (
    <Link href={href} className="hover:underline">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export function When({ iso }: { iso?: string }) {
  if (!iso) return <span className="pf-muted">—</span>;
  return (
    <time dateTime={iso} title={dateTime(iso)}>
      {ago(iso)}
    </time>
  );
}

export function Banner({ tone, children, action }: { tone: "bad" | "watch" | "good"; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className={`pf-banner ${tone}`} role={tone === "bad" ? "alert" : "status"}>
      <div>{children}</div>
      {action}
    </div>
  );
}

export function Tabs({ items, current }: { items: { href: string; label: string; key: string; count?: number }[]; current: string }) {
  return (
    <nav className="pf-tabs" aria-label="Sections">
      {items.map((t) => (
        <Link key={t.key} href={t.href} aria-current={t.key === current ? "page" : undefined}>
          {t.label}
          {t.count ? <span className="pf-muted"> {t.count}</span> : null}
        </Link>
      ))}
    </nav>
  );
}

export function FilterLinks({ items, current }: { items: { href: string; label: string; key: string }[]; current: string }) {
  return (
    <div className="pf-filters" role="group" aria-label="Filter">
      {items.map((i) => (
        <Link key={i.key} href={i.href} className="pf-chiplink" aria-current={i.key === current ? "true" : undefined}>
          {i.label}
        </Link>
      ))}
    </div>
  );
}

export function Bar({ pct, tone }: { pct: number; tone?: "watch" | "bad" }) {
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div className={cn("pf-bar", tone)} role="meter" aria-valuenow={Math.round(p)} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${p}%` }} />
    </div>
  );
}
