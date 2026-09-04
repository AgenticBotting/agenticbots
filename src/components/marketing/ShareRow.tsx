"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** X and LinkedIn have no lucide glyphs — traced from the marks. */
function LinkedInMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM2.9 21.5h4.16V9.4H2.9v12.1Zm7.06 0h4.15v-6.36c0-1.68.32-3.3 2.4-3.3 2.05 0 2.08 1.92 2.08 3.4v6.26h4.16v-7.1c0-3.6-.78-6.38-5-6.38-2.02 0-3.38 1.11-3.94 2.16h-.06V9.4H9.96v12.1Z" />
    </svg>
  );
}

function XMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.21-6.81-5.96 6.81H1.69l7.73-8.84L1.27 2.25h6.82l4.71 6.23 5.44-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.11l11.97 15.64Z" />
    </svg>
  );
}

/**
 * Share controls. Shown as icon buttons in the masthead and as a labeled
 * row at the end of the article, matching the reference layout.
 */
export function ShareRow({
  url,
  title,
  variant = "row",
  className,
}: {
  url: string;
  title: string;
  variant?: "row" | "compact";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const links = [
    { label: "Share on X", href: `https://x.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`, Icon: XMark },
    { label: "Share on LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`, Icon: LinkedInMark },
  ];

  const btn = "flex h-9 w-9 items-center justify-center border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:border-ink-950 hover:text-[var(--foreground)] transition-colors";

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the share links still work */
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {variant === "row" && (
        <span className="mono text-[10.5px] uppercase tracking-[0.11em] text-[var(--text-muted)] mr-1.5">Share</span>
      )}
      {links.map(({ label, href, Icon }) => (
        <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={btn}>
          <Icon className="w-4 h-4" />
        </a>
      ))}
      <button type="button" onClick={copy} aria-label="Copy link" className={btn}>
        {copied ? <Check className="w-4 h-4 text-[var(--accent-text)]" strokeWidth={3} /> : <Link2 className="w-4 h-4" />}
      </button>
      <span role="status" className="text-[12.5px] text-[var(--accent-text)] font-semibold">{copied ? "Copied" : ""}</span>
    </div>
  );
}
