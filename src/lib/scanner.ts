import { segmentBullets } from '@/lib/segment';
import type { Bullet, Flag, RuleId, ScannedBullet } from '@/lib/types';

export interface ScanResult {
  all: ScannedBullet[];
  flagged: ScannedBullet[];
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
  return { all, flagged, clean: flagged.length === 0 };
}
