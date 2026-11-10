'use client';
import { motion, useReducedMotion } from 'motion/react';

export function BossBar({ current, total }: { current: number; total: number }) {
  const reduced = useReducedMotion();
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;
  return (
    <div className="w-full">
      <p className="mb-2 text-sm font-semibold text-muted">Bullet {current} of {total}</p>
      <div
        role="progressbar"
        aria-label="Roast progress"
        aria-valuemin={0}
        aria-valuenow={current}
        aria-valuemax={total}
        className="h-3 overflow-hidden rounded-full bg-surface2 ring-1 ring-line"
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[var(--fire-b)] to-[var(--fire-a)] shadow-[var(--glow)]"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}
