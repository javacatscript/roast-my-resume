import { describe, it, expect } from 'vitest';
import { resolveTheme, THEME_INIT_SCRIPT, THEME_KEY, DEFAULT_THEME } from '@/lib/theme';

describe('resolveTheme', () => {
  it('accepts the two valid themes', () => {
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
  });

  it.each([null, undefined, '', 'purple', 'LIGHT'])('falls back to dark for %j', (v) => {
    expect(resolveTheme(v as string | null | undefined)).toBe('dark');
    expect(DEFAULT_THEME).toBe('dark');
  });
});

describe('THEME_INIT_SCRIPT', () => {
  const run = (storage: Pick<Storage, 'getItem'>) => {
    const doc = { documentElement: { dataset: {} as Record<string, string> } };
    new Function('document', 'localStorage', THEME_INIT_SCRIPT)(doc, storage);
    return doc.documentElement.dataset.theme;
  };

  it('applies a stored light theme before first paint', () => {
    expect(run({ getItem: (k: string) => (k === THEME_KEY ? 'light' : null) })).toBe('light');
  });

  it('defaults to dark when nothing is stored', () => {
    expect(run({ getItem: () => null })).toBe('dark');
  });

  it('defaults to dark when storage throws', () => {
    expect(
      run({
        getItem: () => {
          throw new Error('blocked');
        },
      }),
    ).toBe('dark');
  });

  it('ignores an unknown stored value', () => {
    expect(run({ getItem: () => 'neon' })).toBe('dark');
  });
});
