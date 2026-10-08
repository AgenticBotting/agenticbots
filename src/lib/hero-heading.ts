import glyphWidths from "@/data/hero-glyph-widths.json";

const widths: Record<string, number> = glyphWidths;

/** Conservative em advances: Geist + 8% weight headroom, or the wider
 * size-adjusted Arial Bold fallback. Negative tracking adds further clearance.
 * Unknown glyphs reserve 1.25em; accents use their decomposed base character.
 * Keep this table in sync if the site's Geist family/600 weight changes. */
export function heroTextWidth(text: string): number {
  return [...text.normalize("NFD")].reduce((sum, char) =>
    sum + (/\p{Mark}/u.test(char) ? 0 : widths[char] ?? 1.25), 0);
}

export type HeroWord = { text: string; accent: boolean };

/** Two complete, unbroken rows, sized by their actual container in CSS.
 * Prefer the editorial accent break when it costs at most 12% of the best fit. */
export function balanceHeroHeading(text: string, accent = "", preferTwoLines = false) {
  const words: HeroWord[] = [
    ...text.trim().split(/\s+/).filter(Boolean).map(text => ({ text, accent: false })),
    ...accent.trim().split(/\s+/).filter(Boolean).map(text => ({ text, accent: true })),
  ];
  const width = (line: HeroWord[]) => heroTextWidth(line.map(word => word.text).join(" "));
  if (words.length < 2 || (!accent && !preferTwoLines && width(words) <= 12)) {
    return { lines: [words], width: Math.max(1, width(words)) };
  }
  let split = 1;
  let best = Infinity;
  for (let i = 1; i < words.length; i++) {
    const longest = Math.max(width(words.slice(0, i)), width(words.slice(i)));
    if (longest < best) { best = longest; split = i; }
  }
  const editorialBreak = words.findIndex(word => word.accent);
  if (editorialBreak > 0 && Math.max(width(words.slice(0, editorialBreak)), width(words.slice(editorialBreak))) <= best * 1.12) {
    split = editorialBreak;
  }
  const lines = [words.slice(0, split), words.slice(split)];
  return { lines, width: Math.max(...lines.map(width)) };
}
