'use client';
import { useState } from 'react';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import { BossBar } from '@/components/BossBar';
import { BulletCard } from '@/components/BulletCard';
import { ScanView } from '@/components/ScanView';
import { UploadScreen } from '@/components/UploadScreen';
import { useRoastGame } from '@/hooks/useRoastGame';

export default function Home() {
  const reducedMotion = useReducedMotion() ?? false;
  const game = useRoastGame();
  const [original, setOriginal] = useState('');
  const { state } = game;
  const card = state.cards[state.index];

  if (state.phase === 'input') {
    return (
      <UploadScreen
        onStart={(text, intensity) => {
          setOriginal(text);
          game.start(text, intensity);
        }}
      />
    );
  }

  if (state.phase === 'scanning') return <ScanView text={original} reducedMotion={reducedMotion} />;

  if (state.phase === 'done') {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6">
        <h2 className="text-3xl font-black">Roast complete</h2>
        <button className="rounded-lg bg-white px-5 py-2 font-semibold text-black" onClick={game.reset}>
          Start over
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <BossBar current={state.index + 1} total={state.cards.length} />
        </div>
        <button onClick={game.reset} className="text-xs text-muted underline hover:text-text">
          Quit
        </button>
      </div>
      {state.notice && (
        <p role="status" className="rounded-lg border border-white/10 bg-panel2 px-4 py-2 text-sm text-muted">
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
    </main>
  );
}
