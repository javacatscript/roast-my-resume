import { describe, it, expect } from 'vitest';

describe('tooling', () => {
  it('runs tests with the @ alias and jsdom', async () => {
    expect(typeof document).toBe('object');
    const mod = await import('@/test/alias-probe');
    expect(mod.probe).toBe('ok');
  });
});
