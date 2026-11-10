'use client';
import { motion } from 'motion/react';
import type { VerdictTone } from '@/lib/verdict';

/** A rubber stamp. It is deliberately crooked, and it lands with a thump. Only use it on paper. */
export function Stamp({
  label,
  tone,
  reducedMotion,
  size = 'lg',
}: {
  label: string;
  tone: VerdictTone;
  reducedMotion: boolean;
  size?: 'lg' | 'sm';
}) {
  return (
    <motion.div
      role="img"
      aria-label={`Verdict: ${label}`}
      data-reduced-motion={String(reducedMotion)}
      initial={reducedMotion ? false : { scale: 2.4, opacity: 0, rotate: -16 }}
      animate={{ scale: 1, opacity: 0.93, rotate: -7 }}
      transition={{ type: 'spring', stiffness: 420, damping: 16, mass: 0.9 }}
      className={`stamp stamp-${tone} ${size === 'lg' ? 'text-3xl sm:text-4xl' : 'text-lg'}`}
    >
      {label}
    </motion.div>
  );
}
