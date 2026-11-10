import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

  describe('per-IP daily cap', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-10T00:30:00Z'));
    });
    afterEach(() => vi.useRealTimers());

    it('stops one IP at the daily cap even when each window is respected', async () => {
      const windows = RATE.perIpDailyMax / RATE.perIpMax;
      for (let w = 0; w < windows; w++) {
        for (let i = 0; i < RATE.perIpMax; i++) {
          expect((await checkLimit('3.3.3.3')).ok).toBe(true);
        }
        vi.advanceTimersByTime((RATE.perIpWindowSeconds + 1) * 1000);
      }
      const r = await checkLimit('3.3.3.3');
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.retryAfter).toBeGreaterThan(0);
      expect((await checkLimit('4.4.4.4')).ok).toBe(true);
    });

    it('keeps the per-IP daily cap below the global daily cap', () => {
      expect(RATE.perIpDailyMax).toBeLessThan(RATE.globalDailyMax);
    });
  });
});
