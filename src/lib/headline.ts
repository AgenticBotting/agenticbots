import React from "react";

const MAX_EMPHASIS_WORDS = 3;

/**
 * Colors the tail of a headline green — the "one strategically important
 * phrase" rule. Prefers the clause after a final comma or em dash, but
 * caps the emphasis at three words: a long green clause stops reading as
 * emphasis and starts reading as two-tone text.
 *
 * `.em-green` resolves to --accent-text on white and the on-dark accent inside `.on-dark`,
 * so the same markup is legible on either surface.
 */
export function renderHeadline(text: string): React.ReactNode {
  const words = text.split(" ");
  if (words.length < 4) return text;

  const breaks = [text.lastIndexOf(", "), text.lastIndexOf(" — ")];
  const at = Math.max(...breaks);

  let head: string;
  let tail: string;

  if (at > 0) {
    const gap = text.startsWith(" — ", at) ? 3 : 2;
    const clause = text.slice(at + gap);
    const clauseWords = clause.split(" ");
    if (clauseWords.length <= MAX_EMPHASIS_WORDS) {
      head = text.slice(0, at + gap);
      tail = clause;
    } else {
      head = words.slice(0, -MAX_EMPHASIS_WORDS).join(" ") + " ";
      tail = words.slice(-MAX_EMPHASIS_WORDS).join(" ");
    }
  } else {
    const n = Math.min(MAX_EMPHASIS_WORDS, words.length - 2);
    head = words.slice(0, -n).join(" ") + " ";
    tail = words.slice(-n).join(" ");
  }

  return React.createElement(
    React.Fragment,
    null,
    head,
    React.createElement("span", { className: "em-green" }, tail)
  );
}
