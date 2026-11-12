import { describe, it, expect } from 'vitest';
import { buildResumePdf } from '@/lib/resumePdf';

const read = async (b: Blob) => new TextDecoder('latin1').decode(await b.arrayBuffer());

describe('buildResumePdf', () => {
  it('produces a PDF', async () => {
    const blob = await buildResumePdf('Jane Doe\n\n• Led a team of 5 engineers');
    expect(blob.type).toBe('application/pdf');
    expect((await read(blob)).startsWith('%PDF-')).toBe(true);
  });

  it('spills long resumes onto more pages', async () => {
    const one = await read(await buildResumePdf('short'));
    const many = await read(await buildResumePdf(Array.from({ length: 200 }, (_, i) => `• line ${i}`).join('\n')));
    const pages = (s: string) => (s.match(/\/Type\s*\/Page\b/g) ?? []).length;
    expect(pages(one)).toBe(1);
    expect(pages(many)).toBeGreaterThan(2);
  });
});
