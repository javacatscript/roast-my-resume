import { z } from 'zod';

export const MAX_CARDS = 8;
export const MAX_BULLET_CHARS = 400;
export const MAX_RESUME_CHARS = 15000;
export const RATE = { perIpWindowSeconds: 600, perIpMax: 20, globalDailyMax: 1500 };

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
