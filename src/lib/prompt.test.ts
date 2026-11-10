import { describe, it, expect } from 'vitest';
import { buildMessages } from '@/lib/prompt';
import { REWRITE_MARK, TAGS_MARK } from '@/lib/streamFormat';
import type { Flag, Intensity } from '@/lib/types';

const flags: Flag[] = [{ rule: 'weak-phrase', detail: 'uses the weak phrase "responsible for"' }];
const sys = (i: Intensity) => buildMessages('Responsible for stuff', flags, i)[0].content;
const user = (i: Intensity = 'high') => buildMessages('Responsible for stuff', flags, i)[1].content;

describe('buildMessages', () => {
  it('returns exactly one system then one user message', () => {
    const m = buildMessages('x bullet here', flags, 'high');
    expect(m.map((x) => x.role)).toEqual(['system', 'user']);
  });

  it('spells out the output format with both delimiters', () => {
    expect(sys('high')).toContain(REWRITE_MARK.trim());
    expect(sys('high')).toContain(TAGS_MARK.trim());
  });

  it('treats the bullet as untrusted data', () => {
    expect(sys('high')).toMatch(/untrusted/i);
    expect(sys('high')).toMatch(/ignore (any )?instructions/i);
  });

  it('forbids invented facts and mentions placeholders', () => {
    expect(sys('high')).toMatch(/never invent/i);
    expect(sys('high')).toContain('[X%]');
  });

  it('restricts the roast to the writing, never the person', () => {
    expect(sys('high')).toMatch(/never.*(name|gender|age)/i);
  });

  it('allows mild swearing only at high', () => {
    expect(sys('high')).toMatch(/damn|hell|crap/);
    expect(sys('high')).toMatch(/never use (f-words|the f-word|strong profanity)|no f-bombs/i);
    expect(sys('medium')).toMatch(/no swearing/i);
    expect(sys('mild')).toMatch(/no swearing/i);
  });

  it.each(['mild', 'medium', 'high'] as const)('never names a comedian at %s', (i) => {
    expect(sys(i) + user(i)).not.toMatch(/burr|sloss/i);
  });

  it('wraps the bullet in delimiters and lists flag details', () => {
    expect(user()).toContain('<bullet>Responsible for stuff</bullet>');
    expect(user()).toContain('uses the weak phrase "responsible for"');
  });

  it('asks for a short roast so it fits the validation cap', () => {
    expect(sys('high')).toMatch(/at most 300 characters/i);
  });

  it('asks that a rewrite never claims an outcome the user did not state', () => {
    expect(sys('high')).toMatch(/never (claim|invent).*(result|outcome|impact)/i);
  });
});
