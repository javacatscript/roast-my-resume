'use client';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useTypewriter } from '@/hooks/useTypewriter';

export const DEMO = {
  good: 'Cut dashboard load time 42% by lazy-loading charts and images',
  bad: 'Responsible for managing the frontend release process',
  roast: '"Responsible for" is a job description wearing an accomplishment costume.',
  rewrite: 'Led frontend releases for [N] teams, shipping [X] a month',
  last: 'Built an internal component library adopted by 6 product teams',
};

// 0 scanning, 1 roasting, 2 fixing, 3 holding the finished frame
const PHASE_MS = [1700, 2400, 2300, 3600];
const EMBERS = [8, 22, 38, 54, 68, 82].map((left, i) => ({ left, delay: i * 0.12, drift: (i % 2 ? 1 : -1) * (6 + i * 3) }));

export function HeroDemo({ reducedMotion }: { reducedMotion: boolean }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const id = setTimeout(() => setPhase((p) => (p + 1) % PHASE_MS.length), PHASE_MS[phase]);
    return () => clearTimeout(id);
  }, [phase, reducedMotion]);

  const shown = reducedMotion ? 3 : phase;
  const roast = useTypewriter(DEMO.roast, shown === 1, 18);
  const struck = shown >= 1;

  return (
    <div
      role="img"
      aria-label={`Example: the bullet "${DEMO.bad}" gets roasted and rewritten as "${DEMO.rewrite}".`}
      className="relative mx-auto w-full max-w-[34rem] lg:rotate-[1.2deg]"
    >
      <div className="doc relative overflow-hidden rounded-md bg-[#fffdf9] p-7 text-[#1b1412] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)] sm:p-9" aria-hidden>
        <p className="text-2xl font-semibold tracking-tight">Jordan Example</p>
        <p className="text-sm text-[#6b5f58]">Frontend engineer</p>
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
                animate={{ opacity: struck ? 0.55 : 1 }}
                transition={{ duration: 0.4 }}
                className={struck ? 'text-[#7a6d65] line-through decoration-[#d92d20] decoration-2' : ''}
              >
                {DEMO.bad}
              </motion.span>
            </div>

            {shown === 1 && !reducedMotion && (
              <div className="pointer-events-none absolute inset-x-0 -top-1 h-8">
                {EMBERS.map((e, i) => (
                  <span
                    key={i}
                    className="absolute top-3 size-1.5 rounded-full bg-gradient-to-t from-[#d92d20] to-[#ff9a1f]"
                    style={{
                      left: `${e.left}%`,
                      animation: `ember-rise 1.2s ${e.delay}s ease-out infinite`,
                      ['--drift' as string]: `${e.drift}px`,
                    }}
                  />
                ))}
              </div>
            )}

            {shown >= 1 && (
              <p className="mt-2 border-l-2 border-[#d92d20] pl-3 font-sans text-[13px] font-medium leading-snug text-[#c2261f]">
                {shown >= 2 ? DEMO.roast : roast}
              </p>
            )}

            {shown >= 2 && (
              <motion.p
                initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="mt-3 rounded-sm bg-[#d8f5e8] px-2.5 py-1.5 text-[#0b5c40]"
              >
                {DEMO.rewrite}
              </motion.p>
            )}
          </li>

          <li className="flex gap-3">
            <span className="text-[#9b8f88]">•</span>
            <span>{DEMO.last}</span>
          </li>
        </ul>

        {shown === 0 && !reducedMotion && (
          <motion.div
            className="pointer-events-none absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-[#ff6a3d]/35 to-transparent"
            initial={{ top: '-12%' }}
            animate={{ top: '102%' }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
        )}
      </div>
    </div>
  );
}
