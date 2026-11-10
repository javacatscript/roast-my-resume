'use client';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Marked } from '@/components/Marked';
import { useTypewriter } from '@/hooks/useTypewriter';
import { markSpans } from '@/lib/scanner';

export const DEMO = {
  good: 'Cut dashboard load time 42% by lazy-loading charts and images',
  bad: 'Responsible for managing the frontend release process',
  roast: '"Responsible for" is a job description wearing an accomplishment costume.',
  rewrite: 'Led frontend releases for [N] teams, shipping [X] a month',
  last: 'Built an internal component library adopted by 6 product teams',
};

// 0 scanning, 1 roasting, 2 fixing, 3 holding the finished frame
const PHASE_MS = [1700, 2400, 2300, 3600];
const BAD_MARKS = markSpans(DEMO.bad, [{ rule: 'weak-phrase', detail: '' }]);

export function HeroDemo({ reducedMotion }: { reducedMotion: boolean }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const id = setTimeout(() => setPhase((p) => (p + 1) % PHASE_MS.length), PHASE_MS[phase]);
    return () => clearTimeout(id);
  }, [phase, reducedMotion]);

  const shown = reducedMotion ? 3 : phase;
  const roast = useTypewriter(DEMO.roast, shown === 1, 18);
  const marked = shown >= 1;
  const replaced = shown >= 2;

  return (
    <div
      role="img"
      aria-label={`Example: the bullet "${DEMO.bad}" gets roasted and rewritten as "${DEMO.rewrite}".`}
      className="relative mx-auto w-full max-w-[34rem] [filter:drop-shadow(6px_6px_0_var(--paper-shadow))]"
    >
      {/* paperclip */}
      <svg aria-hidden className="absolute -top-4 left-9 z-10" width="22" height="52" viewBox="0 0 22 52" fill="none" stroke="#8a8f98" strokeWidth="2.4" strokeLinecap="round">
        <path d="M15 12v27a6 6 0 0 1-12 0V9a8 8 0 0 1 16 0v28a3.5 3.5 0 0 1-7 0V14" />
      </svg>

      <div className="paper doc relative overflow-hidden !border-b-0 !shadow-none p-7 pb-9 text-[#1b1412] sm:p-9 sm:pb-11" aria-hidden>
        <span className="coffee-ring -right-5 bottom-4" />
        <p className="text-2xl font-semibold tracking-tight">John Doe</p>
        <p className="text-sm text-[#6b5f58]">Software engineer</p>
        <hr className="my-4 border-[#e6ddd6]" />

        <ul className="space-y-4 text-[15px] leading-snug sm:text-base">
          <li className="flex gap-3">
            <span className="text-[#9b8f88]">•</span>
            <span>{DEMO.good}</span>
          </li>

          <li className="relative">
            <div className="flex gap-3">
              <span className="text-[#9b8f88]">•</span>
              <motion.span
                animate={{ opacity: replaced ? 0.5 : 1 }}
                transition={{ duration: 0.4 }}
                className={replaced ? 'line-through decoration-[#c2261f] decoration-2' : ''}
              >
                <Marked text={DEMO.bad} spans={marked ? BAD_MARKS : []} />
              </motion.span>
            </div>

            {shown >= 1 && (
              <div className="mt-2 flex gap-2 pl-5 font-pen text-[1.35rem] leading-[1.1] text-[#c2261f]">
                <svg aria-hidden className="mt-1 shrink-0" width="26" height="22" viewBox="0 0 26 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M24 19C12 19 5 13 3 3M3 3l-1.5 6M3 3l6 2" />
                </svg>
                <p>{shown >= 2 ? DEMO.roast : roast}</p>
              </div>
            )}

            {shown >= 2 && (
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="relative mt-4 pl-5"
              >
                <svg aria-hidden className="absolute left-0 top-0 -translate-y-3.5" width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="#0b6b4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 13L9 3l7 10" />
                </svg>
                <p className="rounded-sm bg-[#d8f5e8] px-2.5 py-1.5 text-[#0b5c40]">{DEMO.rewrite}</p>
              </motion.div>
            )}
          </li>

          <li className="flex gap-3">
            <span className="text-[#9b8f88]">•</span>
            <span>{DEMO.last}</span>
          </li>
        </ul>

        {shown === 0 && !reducedMotion && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 h-[3px] bg-[#e0392b]"
            initial={{ top: '-2%' }}
            animate={{ top: '100%' }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
        )}
      </div>
      <div aria-hidden className="torn-edge" />
    </div>
  );
}
