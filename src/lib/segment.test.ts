import { describe, it, expect } from 'vitest';
import { segmentBullets } from '@/lib/segment';

describe('segmentBullets', () => {
  it.each(['•', '●', '▪', '◦', '‣', '-', '*', '–'])(
    'strips the bullet character %s',
    (ch) => {
      expect(segmentBullets(`${ch} Led a team of five engineers`)[0].text).toBe(
        'Led a team of five engineers',
      );
    },
  );

  it('handles CRLF line endings', () => {
    const out = segmentBullets(
      '• Built the thing for customers\r\n• Fixed the other thing quickly',
    );
    expect(out).toHaveLength(2);
    expect(out[1].text).toBe('Fixed the other thing quickly');
  });

  it('merges wrapped continuation lines into the previous bullet', () => {
    const out = segmentBullets(
      '• Reduced the cost of cloud infrastructure across\nmultiple regions for customers',
    );
    expect(out).toHaveLength(1);
    expect(out[0].text).toBe(
      'Reduced the cost of cloud infrastructure across multiple regions for customers',
    );
  });

  it('drops short headers with no bullet character', () => {
    const out = segmentBullets('EXPERIENCE\n• Managed a team of nine people daily');
    expect(out).toHaveLength(1);
  });

  it('assigns 0-based ids in order', () => {
    const out = segmentBullets('• One two three four five\n• Six seven eight nine ten');
    expect(out.map((b) => b.id)).toEqual([0, 1]);
  });

  it('returns [] for empty input', () => {
    expect(segmentBullets('')).toEqual([]);
    expect(segmentBullets('   \n \r\n')).toEqual([]);
  });
});
