import { describe, it, expect, beforeEach } from 'vitest';
import { checkLimit, __resetLimits } from '@/lib/ratelimit';
import { RATE } from '@/lib/limits';

beforeEach(() => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  __resetLimits();
});

describe('checkLimit (in-memory mode)', () => {
  it('blocks the call after the per-IP max, with a retryAfter', async () => {
    for (let i = 0; i < RATE.perIpMax; i++) {
      expect((await checkLimit('1.1.1.1')).ok).toBe(true);
    }
    const r = await checkLimit('1.1.1.1');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.retryAfter).toBeGreaterThan(0);
  });

  it('does not affect a different IP', async () => {
    for (let i = 0; i < RATE.perIpMax + 1; i++) await checkLimit('1.1.1.1');
    expect((await checkLimit('2.2.2.2')).ok).toBe(true);
  });
});
