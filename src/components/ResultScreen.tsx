'use client';
import { motion } from 'motion/react';
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
  'rounded-xl border border-line bg-surface2 px-4 py-2.5 text-sm font-semibold text-text transition hover:border-fire focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fire';

export function ResultScreen({ cards: allCards, finalText, onReset }: Props) {
  const cards = allCards.filter((c) => c.bullet.flags.length > 0);
  function download() {
    const url = URL.createObjectURL(new Blob([finalText], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume-roasted.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-10 sm:px-8">
      <header>
        <h2 className="text-4xl font-extrabold tracking-tight">Roast complete</h2>
        <p className="mt-2 text-muted">
          {cards.length > 0
            ? `${cards.filter((c) => afterText(c).text !== c.bullet.text).length} of ${cards.length} bullets changed. Copy it, download it, or go again.`
            : 'Copy it, download it, or go again.'}
        </p>
      </header>

      {cards.length === 0 && (
        <p className="rounded-xl bg-rewrite/12 p-4 font-medium text-rewrite ring-1 ring-rewrite/30">
          Nothing to fix. Your resume survived the roast untouched.
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {cards.map((c, i) => {
          const a = afterText(c);
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.06, 0.6) }}
              className="rounded-2xl border border-line bg-surface p-5"
            >
              <p className="text-xs font-semibold text-roast">Before</p>
              <p className="doc mt-1 text-base leading-snug text-muted line-through decoration-roast/50">{c.bullet.text}</p>
              <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-rewrite">
                After
                {a.aiRewrite && <span className="rounded bg-rewrite/15 px-2 py-0.5 font-medium">AI rewrite</span>}
              </p>
              <p className="doc mt-1 text-lg leading-snug">{a.text}</p>
            </motion.li>
          );
        })}
      </ul>

      <div className="flex flex-wrap gap-3">
        <button type="button" className={`${btn} fire-fill border-transparent`} onClick={() => navigator.clipboard.writeText(finalText)}>
          Copy resume
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
