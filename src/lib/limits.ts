import { z } from 'zod';

export const MAX_CARDS = 8;
export const MAX_BULLET_CHARS = 400;
export const MAX_RESUME_CHARS = 15000;
export const RATE = { perIpWindowSeconds: 600, perIpMax: 20, perIpDailyMax: 200, globalDailyMax: 1500 };

/** Shortens a bullet to the server's cap on a word boundary so the request is never rejected for length. */
export function fitBullet(text: string): string {
  if (text.length <= MAX_BULLET_CHARS) return text;
  const cut = text.slice(0, MAX_BULLET_CHARS - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > MAX_BULLET_CHARS / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

export const roastRequestSchema = z.object({
  bullet: z.string().trim().min(1).max(MAX_BULLET_CHARS),
  flags: z
    .array(
      z.object({
        rule: z.enum(['weak-phrase', 'no-metric', 'passive', 'repeated-verb', 'too-long']),
        detail: z.string().max(120),
      }),
    )
    .max(5),
  intensity: z.enum(['mild', 'medium', 'high']),
});

export type RoastRequest = z.infer<typeof roastRequestSchema>;

export function validateRoastRequest(
  body: unknown,
): { ok: true; data: RoastRequest } | { ok: false; error: string } {
  const r = roastRequestSchema.safeParse(body);
  return r.success
    ? { ok: true, data: r.data }
    : { ok: false, error: r.error.issues[0]?.message ?? 'Invalid request' };
}
