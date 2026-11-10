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

  it('records source offsets that cover exactly the bullet text', () => {
    const text = '• Led a team of five engineers';
    const [b] = segmentBullets(text);
    expect(text.slice(b.start, b.end)).toBe('Led a team of five engineers');
  });

  it('offsets of a wrapped bullet span its continuation lines', () => {
    const text = '• Reduced the cost of cloud\n  infrastructure across regions';
    const [b] = segmentBullets(text);
    expect(b.text).toBe('Reduced the cost of cloud infrastructure across regions');
    expect(text.slice(b.start, b.end)).toBe('Reduced the cost of cloud\n  infrastructure across regions');
  });

  it.each([
    [' Led a team of five engineers'],
    [' Led a team of five engineers'],
    ['o\tLed a team of five engineers'],
    ['1. Led a team of five engineers'],
    ['2) Led a team of five engineers'],
    ['•Led a team of five engineers'],
    ['◆ Led a team of five engineers'],
    ['➢ Led a team of five engineers'],
    ['► Led a team of five engineers'],
    ['— Led a team of five engineers'],
  ])('strips the extra bullet glyph in %j', (line) => {
    expect(segmentBullets(line)[0].text).toBe('Led a team of five engineers');
  });

  it('does not treat a word that starts with o as a bullet marker', () => {
    expect(segmentBullets('Owned the entire billing platform migration end to end')[0].text).toMatch(/^Owned/);
  });

  it('merges a wrapped line that starts with a digit', () => {
    const out = segmentBullets('• Reduced cloud spend across all regions by\n42% in two quarters');
    expect(out).toHaveLength(1);
    expect(out[0].text).toBe('Reduced cloud spend across all regions by 42% in two quarters');
  });

  it('merges a wrapped line that starts with a capital after a long unfinished line', () => {
    const out = segmentBullets(
      '• Migrated the nightly batch pipeline of data jobs to the serverless platform running on\nAWS Lambda for processing 10k events',
    );
    expect(out).toHaveLength(1);
  });

  it('does not merge a company line into the previous short bullet', () => {
    const out = segmentBullets(
      '• Assisted in migrating legacy components to React\nNorthpine Labs\n• Improved the checkout experience for users',
    );
    expect(out.map((b) => b.text)).toEqual([
      'Assisted in migrating legacy components to React',
      'Improved the checkout experience for users',
    ]);
  });

  it('in a document with bullets, ignores contact, summary and education lines', () => {
    const out = segmentBullets(
      [
        'jane@example.com | linkedin.com/in/jane | Portland, OR',
        'Frontend engineer with six years of experience building products',
        '• Cut latency 38% by caching hot queries across the whole fleet',
        'Bachelor of Science in Computer Science, Oregon State University',
      ].join('\n'),
    );
    expect(out.map((b) => b.text)).toEqual(['Cut latency 38% by caching hot queries across the whole fleet']);
  });

  it('without any bullet markers, drops contact, degree and skills lines but keeps prose', () => {
    const out = segmentBullets(
      [
        'jane@example.com | linkedin.com/in/jane | Portland, OR',
        'Bachelor of Science in Computer Science, Oregon State University',
        'React, TypeScript, Node, GraphQL, AWS, Docker, Kubernetes',
        'Built an internal component library adopted by six teams',
      ].join('\n'),
    );
    expect(out.map((b) => b.text)).toEqual(['Built an internal component library adopted by six teams']);
  });
});
