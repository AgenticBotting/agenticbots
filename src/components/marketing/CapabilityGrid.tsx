import { Check } from "lucide-react";

/** The full line-item list for a category, as a scannable checklist. */
export function CapabilityGrid({ items }: { items: string[] }) {
  return (
    <ul className="grid sm:grid-cols-2 gap-x-10 gap-y-0 border-t border-[var(--border)]">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-3 py-3.5 border-b border-[var(--border)]"
        >
          <Check
            className="w-4 h-4 mt-0.5 shrink-0 text-[var(--accent-text)]"
            strokeWidth={2.5}
          />
          <span className="text-[14.5px] leading-snug text-[var(--text-secondary)]">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}
