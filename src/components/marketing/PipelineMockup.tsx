import { Check, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Hero card: one lead, handled — told the way the business owner would
 * tell it. No telemetry, no tool names. The technical depth lives in
 * the AgentTrace section and the category pages.
 */

const STEPS = [
  { action: "Texted them back", at: "4 seconds" },
  { action: "Answered their questions", at: "38 seconds" },
  { action: "Booked Thursday, 10:00am", at: "2 minutes" },
  { action: "Saved it all to your CRM", at: "automatic" },
];

export function PipelineMockup() {
  return (
    <div className="card overflow-hidden shadow-lift">
      <div className="flex items-center justify-between gap-4 px-6 h-12 border-b border-[var(--border)] bg-[var(--bg-alt)]">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-accent-500 animate-pulse-dot" />
          <span className="text-[12.5px] font-semibold tracking-[-0.01em]">Your bot, working</span>
        </span>
        <span className="flex items-center gap-1.5 text-[12.5px] text-[var(--text-muted)]">
          <Phone className="w-3.5 h-3.5" />
          Missed call · 8:42pm
        </span>
      </div>

      <div className="px-6 pt-5 pb-4">
        <p className="text-[15px] leading-snug text-[var(--text-body)]">
          &ldquo;Hi — saw you called about a repair. What&rsquo;s going on?&rdquo;
        </p>
        <p className="body-xs mt-1.5">Sent while you were at dinner.</p>
      </div>

      <ul className="px-6 pb-5">
        {STEPS.map((s, i) => (
          <li
            key={s.action}
            className={cn(
              "flex items-center justify-between gap-4 py-3",
              i > 0 && "border-t border-[var(--border)]"
            )}
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-[var(--bg-tint)]">
                <Check className="w-3 h-3 text-[var(--accent-text)]" strokeWidth={3} />
              </span>
              <span className="text-[14px] text-[var(--text-body)] truncate">{s.action}</span>
            </span>
            <span className="text-[12.5px] text-[var(--text-muted)] shrink-0 tabular-nums">{s.at}</span>
          </li>
        ))}
      </ul>

      <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-alt)]">
        <p className="text-[13.5px] text-[var(--text-body)]">
          A new customer, booked in <strong className="font-semibold">2 minutes</strong> — and
          nobody picked up a phone.
        </p>
      </div>
    </div>
  );
}
