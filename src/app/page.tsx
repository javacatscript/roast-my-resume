'use client';
import { useState } from 'react';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import { BossBar } from '@/components/BossBar';
import { BulletCard } from '@/components/BulletCard';
import { Landing } from '@/components/Landing';
import { ResultScreen } from '@/components/ResultScreen';
import { ScanView } from '@/components/ScanView';
import { SiteNav } from '@/components/SiteNav';
import { useRoastGame } from '@/hooks/useRoastGame';

export default function Home() {
  const reducedMotion = useReducedMotion() ?? false;
  const game = useRoastGame();
  const [original, setOriginal] = useState('');
  const { state } = game;
  const card = state.cards[state.index];

  if (state.phase === 'input') {
    return (
      <Landing
        reducedMotion={reducedMotion}
        message={state.notice}
        onStart={(text, intensity) => {
          setOriginal(text);
          game.start(text, intensity);
        }}
      />
    );
  }

  return (
    <>
      <SiteNav>
        {state.phase === 'playing' && (
          <button onClick={game.reset} className="rounded-lg px-3 py-2 text-sm text-muted underline underline-offset-4 hover:text-text focus-visible:outline-2 focus-visible:outline-fire">
            Quit
          </button>
        )}
      </SiteNav>
      <main>
        {state.phase === 'scanning' && <ScanView text={original} reducedMotion={reducedMotion} />}

        {state.phase === 'done' && (
          <ResultScreen
            cards={state.cards}
            originalText={original}
            finalText={game.finalText(original)}
            onReset={game.reset}
          />
        )}

        {state.phase === 'playing' && (
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-10 sm:px-8">
            <BossBar current={state.index + 1} total={state.cards.length} />
            {state.notice && (
              <p role="status" className="rounded-xl border border-line bg-surface2 px-4 py-2.5 text-sm text-muted">
                {state.notice}
              </p>
            )}
            <AnimatePresence mode="wait">
              {card && (
                <BulletCard
                  key={state.index}
                  card={card}
                  intensity={state.intensity}
                  reducedMotion={reducedMotion}
                  isLast={state.index === state.cards.length - 1}
                  onChoose={game.choose}
                  onEdit={game.saveEdit}
                  onNext={game.next}
                />
              )}
            </AnimatePresence>
          </div>
        )}
      </main>
    </>
  );
}
