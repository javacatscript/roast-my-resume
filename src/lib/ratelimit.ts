import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { RATE } from '@/lib/limits';

export type LimitResult = { ok: true } | { ok: false; retryAfter: number };

const hits = new Map<string, number[]>();
const ipDaily = new Map<string, { day: string; count: number }>();
let daily = { day: '', count: 0 };

export function __resetLimits() {
  hits.clear();
  ipDaily.clear();
  daily = { day: '', count: 0 };
}

const today = () => new Date().toISOString().slice(0, 10);
const secondsToMidnightUtc = () => {
  const n = new Date();
  const next = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + 1);
  return Math.max(1, Math.ceil((next - n.getTime()) / 1000));
};

function memoryCheck(ip: string): LimitResult {
  const now = Date.now();
  const windowMs = RATE.perIpWindowSeconds * 1000;
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= RATE.perIpMax) {
    hits.set(ip, recent);
    return { ok: false, retryAfter: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)) };
  }
  const mine = ipDaily.get(ip);
  const ipCount = mine && mine.day === today() ? mine.count : 0;
  if (ipCount >= RATE.perIpDailyMax) return { ok: false, retryAfter: secondsToMidnightUtc() };
  if (daily.day !== today()) daily = { day: today(), count: 0 };
  if (daily.count >= RATE.globalDailyMax) return { ok: false, retryAfter: secondsToMidnightUtc() };
  recent.push(now);
  hits.set(ip, recent);
  ipDaily.set(ip, { day: today(), count: ipCount + 1 });
  daily.count++;
  return { ok: true };
}

let upstash: { limiter: Ratelimit; redis: Redis } | null = null;
function getUpstash() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  if (!upstash) {
    const redis = Redis.fromEnv();
    upstash = {
      redis,
      limiter: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(RATE.perIpMax, `${RATE.perIpWindowSeconds} s`),
        prefix: 'resume-roast',
      }),
    };
  }
  return upstash;
}

export async function checkLimit(ip: string): Promise<LimitResult> {
  const u = getUpstash();
  if (!u) return memoryCheck(ip);
  try {
    const r = await u.limiter.limit(ip);
    if (!r.success) return { ok: false, retryAfter: Math.max(1, Math.ceil((r.reset - Date.now()) / 1000)) };
    const ipKey = `resume-roast:ipday:${today()}:${ip}`;
    const ipCount = await u.redis.incr(ipKey);
    if (ipCount === 1) await u.redis.expire(ipKey, 60 * 60 * 26);
    if (ipCount > RATE.perIpDailyMax) return { ok: false, retryAfter: secondsToMidnightUtc() };
    const key = `resume-roast:daily:${today()}`;
    const count = await u.redis.incr(key);
    if (count === 1) await u.redis.expire(key, 60 * 60 * 26);
    if (count > RATE.globalDailyMax) return { ok: false, retryAfter: secondsToMidnightUtc() };
    return { ok: true };
  } catch {
    return memoryCheck(ip);
  }
}
