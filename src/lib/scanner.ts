import { segmentBullets } from '@/lib/segment';
import type { Bullet, Flag, RuleId, ScannedBullet } from '@/lib/types';

export interface ScanResult {
  all: ScannedBullet[];
  flagged: ScannedBullet[];
  /** No bullets could be found in the input at all. */
  empty: boolean;
  /** Bullets were found and none of them were flagged. */
  clean: boolean;
}

const WEIGHTS: Record<RuleId, number> = {
  'weak-phrase': 3,
  'no-metric': 2,
  passive: 2,
  'repeated-verb': 1,
  'too-long': 1,
};

const WEAK_PHRASE =
  /\b(responsible for|helped with|helped to|worked on|assisted (?:in|with)|involved in|participated in)\b/i;
const METRIC = /\d|%|\$|\b(dozens|hundreds|thousands|millions|billions)\b/i;
const PASSIVE = /\b(?:was|were|been|being|is|are)\s+\w+(?:ed|en)\s+by\b/i;
const TOO_LONG = 220;

const firstWord = (t: string) => t.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '') ?? '';

function withScore(b: Bullet, flags: Flag[]): ScannedBullet {
  return { ...b, flags, score: flags.reduce((n, f) => n + WEIGHTS[f.rule], 0) };
}

export interface Mark {
  start: number;
  end: number;
}

/** Where a red pen would point: the exact words behind each flag that has a phrase to mark. */
export function markSpans(text: string, flags: Flag[]): Mark[] {
  const marks: Mark[] = [];
  const has = (r: RuleId) => flags.some((f) => f.rule === r);
  const push = (m: RegExpMatchArray | null) => {
    if (m && m.index !== undefined) marks.push({ start: m.index, end: m.index + m[0].length });
  };
  if (has('weak-phrase')) push(text.match(WEAK_PHRASE));
  if (has('passive')) push(text.match(PASSIVE));
  if (has('repeated-verb')) push(text.match(/^\S+/));
  if (has('too-long') && text.length > TOO_LONG) {
    const start = text.lastIndexOf(' ', TOO_LONG) + 1;
    if (start > 0 && start < text.length) marks.push({ start, end: text.length });
  }
  marks.sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: Mark[] = [];
  for (const m of marks) {
    const last = merged[merged.length - 1];
    if (last && m.start <= last.end) last.end = Math.max(last.end, m.end);
    else merged.push({ ...m });
  }
  return merged;
}

export function scanBullet(b: Bullet): ScannedBullet {
  const flags: Flag[] = [];
  const weak = b.text.match(WEAK_PHRASE);
  if (weak) flags.push({ rule: 'weak-phrase', detail: `uses the weak phrase "${weak[0].toLowerCase()}"` });
  if (!METRIC.test(b.text)) flags.push({ rule: 'no-metric', detail: 'has no number or measurable result' });
  if (PASSIVE.test(b.text)) flags.push({ rule: 'passive', detail: 'is written in passive voice' });
  if (b.text.length > TOO_LONG) flags.push({ rule: 'too-long', detail: 'is too long to skim' });
  return withScore(b, flags);
}

export function scanResume(text: string, maxCards = 8): ScanResult {
  const seen = new Set<string>();
  const all = segmentBullets(text).map((b) => {
    const scanned = scanBullet(b);
    const verb = firstWord(b.text);
    if (verb && seen.has(verb)) {
      return withScore(b, [
        ...scanned.flags,
        { rule: 'repeated-verb', detail: `starts with "${verb}" again` },
      ]);
    }
    if (verb) seen.add(verb);
    return scanned;
  });
  const flagged = all
    .filter((b) => b.flags.length > 0)
    .sort((a, b) => b.score - a.score || a.id - b.id)
    .slice(0, maxCards);
  return { all, flagged, empty: all.length === 0, clean: all.length > 0 && flagged.length === 0 };
}
