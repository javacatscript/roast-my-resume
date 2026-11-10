'use client';
import { motion } from 'motion/react';

export function ScanView({ text, reducedMotion }: { text: string; reducedMotion: boolean }) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim()).slice(0, 14);
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6 py-12">
      <p role="status" className="text-sm uppercase tracking-widest text-roast">
        Scanning for crimes against writing…
      </p>
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-panel p-5 font-mono text-xs leading-6 text-muted">
        {lines.map((l, i) => (
          <p key={i} className="truncate">{l}</p>
        ))}
        {!reducedMotion && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-roast/40 to-transparent"
            initial={{ top: '-15%' }}
            animate={{ top: '100%' }}
            transition={{ duration: 1.4, ease: 'easeInOut' }}
          />
        )}
      </div>
    </main>
  );
}
