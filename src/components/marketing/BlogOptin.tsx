import { AuditForm } from "./AuditForm";

export function BlogOptin({ source = "blog", className }: { source?: string; className?: string }) {
  return <aside className={className}><AuditForm source={source} /></aside>;
}
