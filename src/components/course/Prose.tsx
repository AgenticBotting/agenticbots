import type { Block } from "@/lib/course-content";

/**
 * The reading surface.
 *
 * Wider measure than the blog for one reason: code. A 68ch column wraps
 * a command line in the middle of a flag, and a wrapped command is one
 * someone pastes wrong.
 */
export function Prose({ blocks }: { blocks: Block[] }) {
  return (
    <article className="space-y-5">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "h2":
            return (
              <h2 key={index} className="display-lg pt-4 mt-4 border-t border-[var(--border)]">
                {block.text}
              </h2>
            );

          case "p":
            return (
              <p key={index} className="text-[16.5px] leading-[1.7] text-[var(--text-body)]">
                {block.text}
              </p>
            );

          case "ul":
            return (
              <ul key={index} className="space-y-2.5">
                {block.items.map((item, i) => (
                  <li key={i} className="flex gap-3 text-[16px] leading-[1.65] text-[var(--text-body)]">
                    <span className="mt-[10px] h-1.5 w-1.5 shrink-0 bg-[var(--color-accent-500)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );

          case "ol":
            return (
              <ol key={index} className="space-y-2.5">
                {block.items.map((item, i) => (
                  <li key={i} className="flex gap-3 text-[16px] leading-[1.65] text-[var(--text-body)]">
                    <span className="mono text-[12px] text-[var(--accent-text)] mt-[5px] shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            );

          case "code":
            return (
              <div key={index} className="border border-[var(--border)]">
                {block.file && (
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-alt)] border-b border-[var(--border)]">
                    <span className="mono text-[11px] text-[var(--text-secondary)]">{block.file}</span>
                    <span className="mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                      {block.lang}
                    </span>
                  </div>
                )}
                <pre className="overflow-x-auto p-3.5 bg-[var(--color-ink-950)]">
                  <code className="mono text-[12.5px] leading-[1.6] text-[var(--color-ink-200)] whitespace-pre">
                    {block.text}
                  </code>
                </pre>
              </div>
            );

          case "note":
            return (
              <aside key={index} className="border-l-2 border-[var(--color-accent-500)] bg-[var(--bg-alt)] px-4 py-3.5">
                {block.title && (
                  <p className="mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--accent-text)]">
                    {block.title}
                  </p>
                )}
                <p className="text-[15px] leading-[1.6] mt-1.5 text-[var(--text-body)]">{block.text}</p>
              </aside>
            );

          case "quote":
            return (
              <blockquote key={index} className="border-l-2 border-[var(--foreground)] pl-4 py-1">
                <p className="text-[17px] leading-[1.55] font-semibold tracking-[-0.015em] text-[var(--foreground)]">
                  {block.text}
                </p>
              </blockquote>
            );
        }
      })}
    </article>
  );
}
