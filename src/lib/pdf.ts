export class NoTextLayerError extends Error {
  constructor() {
    super('This PDF has no selectable text.');
    this.name = 'NoTextLayerError';
  }
}

const MIN_CHARS = 40;

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;

  const pages: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    let out = '';
    for (const item of content.items) {
      if (!('str' in item)) continue;
      out += item.str;
      out += item.hasEOL ? '\n' : ' ';
    }
    pages.push(out);
  }

  const text = pages.join('\n').replace(/[ \t]+\n/g, '\n').trim();
  if (text.length < MIN_CHARS) throw new NoTextLayerError();
  return text;
}
