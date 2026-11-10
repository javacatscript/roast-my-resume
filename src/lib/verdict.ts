import type { GameCard } from '@/lib/game';

export type VerdictTone = 'good' | 'mid' | 'bad' | 'clean';

export interface Verdict {
  label: 'Clean paper' | 'Rejected' | 'Shortlisted' | 'Maybe pile';
  tone: VerdictTone;
  /** Roasted bullets (the praise card is not one). */
  total: number;
  /** Bullets that ended up with an AI rewrite or the user's own edit. */
  changed: number;
  keptOriginal: number;
}

export function verdict(cards: GameCard[]): Verdict {
  const roasted = cards.filter((c) => c.bullet.flags.length > 0);
  const total = roasted.length;
  const changed = roasted.filter(
    (c) => c.choice === 'edited' || (c.choice === 'rewrite' && c.source === 'ai'),
  ).length;
  const keptOriginal = roasted.filter((c) => c.choice === 'original').length;

  if (total === 0) return { label: 'Clean paper', tone: 'clean', total, changed, keptOriginal };
  if (keptOriginal / total >= 0.5) return { label: 'Rejected', tone: 'bad', total, changed, keptOriginal };
  if (changed / total >= 0.75) return { label: 'Shortlisted', tone: 'good', total, changed, keptOriginal };
  return { label: 'Maybe pile', tone: 'mid', total, changed, keptOriginal };
}
