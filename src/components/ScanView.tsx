'use client';
import { motion } from 'motion/react';

// A ragged top edge for the char line, so it reads as burnt paper and not a gradient wipe.
const RAGGED =
  'polygon(0 7px,4% 2px,9% 8px,15% 1px,22% 7px,29% 3px,36% 9px,44% 2px,52% 8px,60% 1px,68% 7px,75% 3px,83% 9px,90% 2px,96% 7px,100% 4px,100% 100%,0 100%)';

export function ScanView({ text, reducedMotion }: { text: string; reducedMotion: boolean }) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim()).slice(0, 14);
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-12 sm:px-8">
      <p role="status" className="mb-5 text-lg font-bold">
        Scanning for crimes against writing…
      </p>
      <div className="paper doc relative overflow-hidden p-6 text-[15px] leading-7 sm:p-8">
        {lines.map((l, i) => (
          <p key={i} className="truncate">
            {l}
          </p>
        ))}
        {!reducedMotion && (
          <motion.div
            data-burn
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{
              background: 'linear-gradient(to bottom, #ff9a1f 0, #ff3d2e 5px, #3a170b 16px, #1b0d08 100%)',
              clipPath: RAGGED,
            }}
            initial={{ height: '0%' }}
            animate={{ height: '100%' }}
            transition={{ duration: 1.4, ease: 'easeIn' }}
          />
        )}
      </div>
    </div>
  );
}
