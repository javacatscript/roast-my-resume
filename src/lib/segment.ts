import type { Bullet } from '@/lib/types';

const BULLET_PREFIX = /^[•●▪◦‣*–-]\s+/;
const MIN_UNBULLETED_WORDS = 5;

export function segmentBullets(text: string): Bullet[] {
  const texts: string[] = [];
  let open = false;

  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!line) continue;

    if (BULLET_PREFIX.test(line)) {
      const body = line.replace(BULLET_PREFIX, '').trim();
      if (body) {
        texts.push(body);
        open = true;
      }
    } else if (open && /^[a-z]/.test(line)) {
      texts[texts.length - 1] += ` ${line}`;
    } else if (line.split(/\s+/).length >= MIN_UNBULLETED_WORDS) {
      texts.push(line);
      open = true;
    } else {
      open = false;
    }
  }

  return texts.map((t, id) => ({ id, text: t }));
}
