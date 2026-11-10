import { describe, it, expect } from 'vitest';
import { cannedRoast, ruleTip, praiseCard, keepOriginalMock } from '@/lib/canned';
import type { Intensity, RuleId, ScannedBullet } from '@/lib/types';

const RULES: RuleId[] = ['weak-phrase', 'no-metric', 'passive', 'repeated-verb', 'too-long'];
const LEVELS: Intensity[] = ['mild', 'medium', 'high'];
const SWEAR = /\b(damn|hell|crap)\b/i;
const HARD = /fuck|shit|bitch|cunt|nigg|fag/i;

const bullet = (rule: RuleId, id = 0): ScannedBullet => ({
  id,
  text: 'x',
  start: 0,
  end: 1,
  flags: [{ rule, detail: '' }],
  score: 1,
});

describe('cannedRoast', () => {
  it.each(RULES.flatMap((r) => LEVELS.map((l) => [r, l] as const)))(
    'returns a roast for %s at %s',
    (rule, level) => {
      expect(cannedRoast(bullet(rule), level).length).toBeGreaterThan(10);
    },
  );

  it('is deterministic for the same bullet', () => {
    const b = bullet('weak-phrase', 3);
    expect(cannedRoast(b, 'high')).toBe(cannedRoast(b, 'high'));
  });

  it('varies by bullet id', () => {
    const seen = new Set([0, 1, 2, 3].map((i) => cannedRoast(bullet('no-metric', i), 'high')));
    expect(seen.size).toBeGreaterThan(1);
  });

  it('uses the highest-weight flag', () => {
    const b: ScannedBullet = {
      id: 0,
      text: 'x',
      start: 0,
      end: 1,
      score: 5,
      flags: [
        { rule: 'too-long', detail: '' },
        { rule: 'weak-phrase', detail: '' },
      ],
    };
    expect(cannedRoast(b, 'medium')).toBe(cannedRoast(bullet('weak-phrase'), 'medium'));
  });
});

describe('profanity limits', () => {
  const everything = (level: Intensity) =>
    [
      ...RULES.flatMap((r) => [0, 1, 2, 3].map((i) => cannedRoast(bullet(r, i), level))),
      ...[0, 1, 2, 3].map(() => keepOriginalMock(level)),
      praiseCard(level).roast,
    ].join('\n');

  it.each(['mild', 'medium'] as const)('%s has no swearing', (level) => {
    expect(everything(level)).not.toMatch(SWEAR);
  });

  it.each(LEVELS)('%s never uses hard profanity or slurs', (level) => {
    expect(everything(level)).not.toMatch(HARD);
  });
});

describe('ruleTip / praiseCard / keepOriginalMock', () => {
  it.each(RULES)('has a tip for %s', (rule) => {
    expect(ruleTip(rule).length).toBeGreaterThan(5);
  });

  it.each(LEVELS)('praise card is complete at %s', (level) => {
    const p = praiseCard(level);
    expect(p.original.length).toBeGreaterThan(0);
    expect(p.roast.length).toBeGreaterThan(10);
    expect(p.tip.length).toBeGreaterThan(5);
  });

  it.each(LEVELS)('keepOriginalMock is non-empty at %s', (level) => {
    expect(keepOriginalMock(level).length).toBeGreaterThan(10);
  });
});
