import { z } from 'zod';
import type { CardResult } from '@/lib/types';

export const REWRITE_MARK = '\n===REWRITE===\n';
export const TAGS_MARK = '\n===TAGS===\n';

export function splitPartial(raw: string): {
  roast: string;
  rewrite: string;
  phase: 'roast' | 'rewrite' | 'tags';
} {
  const r = raw.indexOf(REWRITE_MARK);
  if (r === -1) return { roast: raw, rewrite: '', phase: 'roast' };
  const roast = raw.slice(0, r);
  const afterRewrite = raw.slice(r + REWRITE_MARK.length);
  const t = afterRewrite.indexOf(TAGS_MARK);
  if (t === -1) return { roast, rewrite: afterRewrite, phase: 'rewrite' };
  return { roast, rewrite: afterRewrite.slice(0, t), phase: 'tags' };
}

const cardSchema = z.object({
  roast: z.string().trim().min(1).max(400),
  rewrite: z.string().trim().min(1).max(400),
  tags: z.array(z.string().trim().min(1).max(40)).max(5),
});

export function parseCard(raw: string): CardResult | null {
  const r = raw.indexOf(REWRITE_MARK);
  if (r === -1) return null;
  const after = raw.slice(r + REWRITE_MARK.length);
  const t = after.indexOf(TAGS_MARK);
  if (t === -1) return null; // the stream was cut off before the end
  const tagText = after.slice(t + TAGS_MARK.length);
  const parsed = cardSchema.safeParse({
    roast: raw.slice(0, r),
    rewrite: after.slice(0, t),
    tags: tagText.split(',').map((s) => s.trim()).filter(Boolean),
  });
  return parsed.success ? parsed.data : null;
}
