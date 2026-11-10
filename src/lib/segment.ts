import type { Bullet } from '@/lib/types';

/** Normalizes line endings. Bullet offsets refer to the normalized text. */
export function normalizeText(text: string): string {
  return text.replace(/\r\n?/g, '\n');
}

// Symbol bullets may be glued to the text ("•Led"); Word-exported PDFs use private-use glyphs.
const GLYPH = /^[•●▪◦‣◆■○➢►▸✓·]\s*/;
// ASCII/dash markers, Word's second-level "o", and numbering need whitespace after them.
const MARK = /^(?:[*\-–—−]|o|\d{1,2}[.)])\s+/;

const prefixLength = (line: string) => (line.match(GLYPH) ?? line.match(MARK))?.[0].length ?? 0;

const MIN_UNBULLETED_WORDS = 5;
const WRAP_PREV_MIN_LENGTH = 70;
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

const isAllCaps = (l: string) => /^[A-Z0-9 &/,.\-]+$/.test(l);
const DEGREE = /\b(bachelor|master|b\.?s\.?c?\.?|m\.?s\.?c?\.?|ph\.?d|university|college|institute|gpa)\b/i;

function isNoise(l: string): boolean {
  if (/@|https?:|www\.|linkedin\.|github\.com|\|/i.test(l)) return true;
  if (isAllCaps(l) || DEGREE.test(l)) return true;
  const commas = (l.match(/,/g) ?? []).length;
  return commas >= 3 && commas * 3 >= words(l);
}

function shouldMerge(line: string, prev: string): boolean {
  if (/^[a-z0-9$(]/.test(line)) return true;
  return (
    prev.length >= WRAP_PREV_MIN_LENGTH &&
    !/[.!?:;]$/.test(prev) &&
    !isAllCaps(line) &&
    !isNoise(line) &&
    words(line) > 3
  );
}

interface Item {
  start: number;
  end: number;
  parts: string[];
}

export function segmentBullets(text: string): Bullet[] {
  const src = normalizeText(text);
  const lines: { content: string; start: number }[] = [];
  let pos = 0;
  for (const raw of src.split('\n')) {
    const lead = raw.length - raw.trimStart().length;
    lines.push({ content: raw.trim(), start: pos + lead });
    pos += raw.length + 1;
  }
  const hasBullets = lines.some((l) => l.content && prefixLength(l.content) > 0);

  const items: Item[] = [];
  let open: Item | null = null;
  let prev = '';

  for (const { content, start } of lines) {
    if (!content) {
      open = null;
      continue;
    }
    const pl = prefixLength(content);
    if (pl > 0) {
      const body = content.slice(pl).trim();
      if (!body) {
        open = null;
      } else {
        const bodyStart = start + content.indexOf(body, pl);
        open = { start: bodyStart, end: start + content.length, parts: [body] };
        items.push(open);
      }
    } else if (open && shouldMerge(content, prev)) {
      open.end = start + content.length;
      open.parts.push(content);
    } else if (!hasBullets && !isNoise(content) && words(content) >= MIN_UNBULLETED_WORDS) {
      open = { start, end: start + content.length, parts: [content] };
      items.push(open);
    } else {
      open = null;
    }
    prev = content;
  }

  return items.map((it, id) => ({ id, text: it.parts.join(' '), start: it.start, end: it.end }));
}
