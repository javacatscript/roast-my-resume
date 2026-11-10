'use client';
import { motion } from 'motion/react';

export function ScanView({ text, reducedMotion }: { text: string; reducedMotion: boolean }) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim()).slice(0, 14);
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-12 sm:px-8">
      <p role="status" className="mb-4 text-lg font-bold">
        Scanning for crimes against writing…
      </p>
      <div className="doc relative overflow-hidden rounded-md bg-[#fffdf9] p-6 text-[15px] leading-7 text-[#3b312c] shadow-[0_30px_80px_-24px_rgba(0,0,0,0.5)]">
        {lines.map((l, i) => (
          <p key={i} className="truncate">
            {l}
          </p>
        ))}
        {!reducedMotion && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 h-20 bg-gradient-to-b from-transparent via-[#ff6a3d]/40 to-transparent"
            initial={{ top: '-20%' }}
            animate={{ top: '105%' }}
            transition={{ duration: 1.4, ease: 'easeInOut' }}
          />
        )}
      </div>
    </div>
  );
}
