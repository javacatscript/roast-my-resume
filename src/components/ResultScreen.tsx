'use client';
import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Spinner } from '@/components/Spinner';
import { Stamp } from '@/components/Stamp';
import { buildResumePdf } from '@/lib/resumePdf';
import { verdict } from '@/lib/verdict';
import type { GameCard } from '@/lib/game';

interface Props {
  cards: GameCard[];
  originalText: string;
  finalText: string;
  onReset: () => void;
}

function afterText(c: GameCard): { text: string; aiRewrite: boolean } {
  if (c.choice === 'edited' && c.edited) return { text: c.edited, aiRewrite: false };
  if (c.choice === 'rewrite' && c.source === 'ai') return { text: c.rewrite, aiRewrite: true };
  return { text: c.bullet.text, aiRewrite: false };
}

const btn =
  'btn bg-surface2 px-4 py-2.5 text-sm font-semibold text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fire';

export function ResultScreen({ cards: allCards, finalText, onReset }: Props) {
  const reducedMotion = useReducedMotion() ?? false;
  const v = verdict(allCards);
  const cards = allCards.filter((c) => c.bullet.flags.length > 0);
  const [makingPdf, setMakingPdf] = useState(false);
  const [pdfFailed, setPdfFailed] = useState(false);

  function save(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
  const download = () => save(new Blob([finalText], { type: 'text/plain' }), 'resume-roasted.txt');
  async function downloadPdf() {
    setMakingPdf(true);
    setPdfFailed(false);
    try {
      save(await buildResumePdf(finalText), 'resume-roasted.pdf');
    } catch {
      setPdfFailed(true);
    } finally {
      setMakingPdf(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-10 sm:px-8">
      <header>
        <h2 className="text-4xl font-extrabold tracking-tight">Roast complete</h2>
        <p className="mt-2 text-muted">Copy it, download it, or go again.</p>
      </header>

      <section aria-label="Verdict" className="paper relative p-6 pr-4 sm:p-8">
        <p className="doc max-w-[18rem] text-2xl leading-snug">
          {v.total > 0
            ? `${v.changed} of ${v.total} bullets changed`
            : 'Nothing to fix. Your resume survived the roast untouched.'}
        </p>
        {v.total > 0 && v.keptOriginal > 0 && (
          <p className="mt-1 text-sm text-muted">
            You kept the original on {v.keptOriginal} {v.keptOriginal === 1 ? 'bullet' : 'bullets'}.
          </p>
        )}
        <div className="mt-5 flex justify-end">
          <Stamp label={v.label} tone={v.tone} reducedMotion={reducedMotion} />
        </div>
      </section>

      <ul className="flex flex-col gap-4">
        {cards.map((c, i) => {
          const a = afterText(c);
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.06, 0.6) }}
              className="rounded-md border-2 border-edge bg-surface p-5"
            >
              {a.text === c.bullet.text ? (
                <>
                  <p className="text-xs font-semibold text-muted">Kept as written</p>
                  <p className="doc mt-1 text-lg leading-snug">{c.bullet.text}</p>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold text-roast">Before</p>
                  <p className="doc mt-1 text-base leading-snug text-muted line-through decoration-roast/50">{c.bullet.text}</p>
                  <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-rewrite">
                    After
                    {a.aiRewrite && <span className="rounded bg-rewrite/15 px-2 py-0.5 font-medium">AI rewrite</span>}
                  </p>
                  <p className="doc mt-1 text-lg leading-snug">{a.text}</p>
                </>
              )}
            </motion.li>
          );
        })}
      </ul>

      {pdfFailed && (
        <p role="alert" className="text-sm font-medium text-roast">
          Couldn&apos;t make the PDF. Try the .txt download instead.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" className={`${btn} fire-fill`} onClick={() => navigator.clipboard.writeText(finalText)}>
          Copy resume
        </button>
        <button type="button" className={`${btn} inline-flex items-center gap-2`} onClick={downloadPdf} disabled={makingPdf}>
          {makingPdf && <Spinner />}
          {makingPdf ? 'Making PDF…' : 'Download PDF'}
        </button>
        <button type="button" className={btn} onClick={download}>
          Download .txt
        </button>
        <button type="button" className={btn} onClick={onReset}>
          Start over
        </button>
      </div>
    </div>
  );
}
