import { describe, it, expect, vi } from 'vitest';

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {},
  getDocument: vi.fn(),
}));
import * as pdfjs from 'pdfjs-dist';
import { extractPdfText, NoTextLayerError } from '@/lib/pdf';

const fakeDoc = (pages: string[][]) => ({
  promise: Promise.resolve({
    numPages: pages.length,
    getPage: async (n: number) => ({
      getTextContent: async () => ({ items: pages[n - 1].map((str) => ({ str, hasEOL: true })) }),
    }),
  }),
});

const file = () => new File([new Uint8Array([1, 2, 3])], 'resume.pdf', { type: 'application/pdf' });

describe('extractPdfText', () => {
  it('rejects with NoTextLayerError when the pdf has no selectable text', async () => {
    vi.mocked(pdfjs.getDocument).mockReturnValue(fakeDoc([[''], ['']]) as never);
    await expect(extractPdfText(file())).rejects.toBeInstanceOf(NoTextLayerError);
  });

  it('joins text from every page', async () => {
    vi.mocked(pdfjs.getDocument).mockReturnValue(
      fakeDoc([
        ['• Led a team of five engineers to ship the thing'],
        ['• Cut latency by forty percent across the board'],
      ]) as never,
    );
    const text = await extractPdfText(file());
    expect(text).toContain('Led a team of five engineers');
    expect(text).toContain('Cut latency by forty percent');
  });
});
