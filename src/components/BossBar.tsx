'use client';
import { motion, useReducedMotion } from 'motion/react';

export function BossBar({ current, total }: { current: number; total: number }) {
  const reduced = useReducedMotion();
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;
  const step = total > 0 ? 100 / total : 100;
  return (
    <div className="w-full">
      <p className="mb-2 text-sm font-semibold text-muted">Bullet {current} of {total}</p>
      <div
        role="progressbar"
        aria-label="Roast progress"
        aria-valuemin={0}
        aria-valuenow={current}
        aria-valuemax={total}
        className="relative h-4 overflow-hidden rounded-[4px] border-2 border-edge bg-surface2"
      >
        <motion.div
          className="h-full bg-[var(--fire)]"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20 }}
        />
        {/* one segment per bullet */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(to right, transparent 0, transparent calc(${step}% - 2px), var(--edge) calc(${step}% - 2px), var(--edge) ${step}%)`,
          }}
        />
      </div>
    </div>
  );
}
