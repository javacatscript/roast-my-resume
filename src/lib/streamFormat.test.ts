import { describe, it, expect } from 'vitest';
import { REWRITE_MARK, TAGS_MARK, splitPartial, parseCard } from '@/lib/streamFormat';

describe('splitPartial', () => {
  it('is in the roast phase before any delimiter', () => {
    expect(splitPartial('You wrote "helped with"')).toEqual({
      roast: 'You wrote "helped with"',
      rewrite: '',
      phase: 'roast',
    });
  });

  it('moves to the rewrite phase after the rewrite delimiter', () => {
    const r = splitPartial(`Bad.${REWRITE_MARK}Led a team of`);
    expect(r).toEqual({ roast: 'Bad.', rewrite: 'Led a team of', phase: 'rewrite' });
  });

  it('moves to the tags phase and keeps roast and rewrite intact', () => {
    const r = splitPartial(`Bad.${REWRITE_MARK}Led 5 engineers.${TAGS_MARK}weak-phrase`);
    expect(r).toEqual({ roast: 'Bad.', rewrite: 'Led 5 engineers.', phase: 'tags' });
  });
});

describe('parseCard', () => {
  const good = `Bad bullet.${REWRITE_MARK}Led 5 engineers.${TAGS_MARK}weak-phrase, no-metric`;

  it('parses a complete valid card', () => {
    expect(parseCard(good)).toEqual({
      roast: 'Bad bullet.',
      rewrite: 'Led 5 engineers.',
      tags: ['weak-phrase', 'no-metric'],
    });
  });

  it('allows empty tags', () => {
    expect(parseCard(`Bad.${REWRITE_MARK}Better.${TAGS_MARK}`)?.tags).toEqual([]);
  });

  it('returns null when the rewrite section is missing', () => {
    expect(parseCard('Only a roast.')).toBeNull();
  });

  it('returns null when the roast is empty', () => {
    expect(parseCard(`${REWRITE_MARK}Better.${TAGS_MARK}x`)).toBeNull();
  });

  it('returns null when the roast is over 400 characters', () => {
    expect(parseCard(`${'a'.repeat(401)}${REWRITE_MARK}Better.${TAGS_MARK}x`)).toBeNull();
  });

  it('returns null when more than 5 tags are given', () => {
    expect(parseCard(`Bad.${REWRITE_MARK}Better.${TAGS_MARK}a,b,c,d,e,f`)).toBeNull();
  });
});
