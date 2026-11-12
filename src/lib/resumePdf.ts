const PAGE = { w: 595.28, h: 841.89 }; // A4 in pt
const MARGIN = 54;
const FONT_SIZE = 11;
const LINE_HEIGHT = 15;
const BULLET = /^(\s*[•\-*–]\s+)/;

/** Lay the resume text out as a plain, single-column A4 PDF. jsPDF is loaded on demand. */
export async function buildResumePdf(text: string): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_SIZE);

  const maxWidth = PAGE.w - MARGIN * 2;
  let y = MARGIN;
  const put = (line: string, indent: number) => {
    if (y > PAGE.h - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
    doc.text(line, MARGIN + indent, y, { baseline: 'top' });
    y += LINE_HEIGHT;
  };

  for (const raw of text.replace(/\t/g, '    ').split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      y += LINE_HEIGHT / 2;
      continue;
    }
    const marker = BULLET.exec(line)?.[1];
    // Wrapped lines of a bullet hang under its text, not under the bullet character.
    const hang = marker ? doc.getTextWidth(marker) : 0;
    const wrapped: string[] = doc.splitTextToSize(line, maxWidth - hang);
    wrapped.forEach((l, i) => (i === 0 ? put(l, 0) : put(l.trimStart(), hang)));
  }
  return doc.output('blob');
}
