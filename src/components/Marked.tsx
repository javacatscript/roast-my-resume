import type { Mark } from '@/lib/scanner';

/** Renders text with the given spans underlined in red pen. Spans must be sorted and non-overlapping. */
export function Marked({ text, spans }: { text: string; spans: Mark[] }) {
  const out: React.ReactNode[] = [];
  let at = 0;
  spans.forEach((m, i) => {
    if (m.start > at) out.push(text.slice(at, m.start));
    out.push(
      <mark key={i} className="pen">
        {text.slice(m.start, m.end)}
      </mark>,
    );
    at = m.end;
  });
  if (at < text.length) out.push(text.slice(at));
  return <>{out}</>;
}
