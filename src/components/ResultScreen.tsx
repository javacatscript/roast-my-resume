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
  'rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold transition hover:border-white/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

export function ResultScreen({ cards, finalText, onReset }: Props) {
  function download() {
    const url = URL.createObjectURL(new Blob([finalText], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume-roasted.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-12">
      <header>
        <h2 className="text-4xl font-black">
          Roast <span className="text-rewrite">complete</span>
        </h2>
        <p className="mt-2 text-muted">Here is what changed. Copy it, download it, or go again.</p>
      </header>

      <ul className="flex flex-col gap-4">
        {cards.map((c, i) => {
          const a = afterText(c);
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.06, 0.6) }}
              className="rounded-xl border border-white/10 bg-panel p-4"
            >
              <p className="text-xs uppercase tracking-widest text-roast">Before</p>
              <p className="mt-1 text-sm text-muted line-through decoration-roast/50">{c.bullet.text}</p>
              <p className="mt-3 flex items-center gap-2 text-xs uppercase tracking-widest text-rewrite">
                After
                {a.aiRewrite && (
                  <span className="rounded bg-rewrite/15 px-2 py-0.5 normal-case tracking-normal">AI rewrite</span>
                )}
              </p>
              <p className="mt-1 text-sm">{a.text}</p>
            </motion.li>
          );
        })}
      </ul>

      <div className="flex flex-wrap gap-3">
        <button type="button" className={`${btn} bg-white text-black`} onClick={() => navigator.clipboard.writeText(finalText)}>
          Copy resume
        </button>
        <button type="button" className={btn} onClick={download}>
          Download .txt
        </button>
        <button type="button" className={btn} onClick={onReset}>
          Start over
        </button>
      </div>
    </main>
  );
}
