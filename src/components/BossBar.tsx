'use client';
import { motion } from 'motion/react';

export function BossBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-muted">
        <span>Bullet {current} of {total}</span>
        <span className="text-roast">Boss: your resume</span>
      </div>
      <div
        role="progressbar"
        aria-label="Roast progress"
        aria-valuemin={0}
        aria-valuenow={current}
        aria-valuemax={total}
        className="h-3 overflow-hidden rounded-full border border-white/10 bg-panel"
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-roast to-[#ff8a5c] shadow-[0_0_14px_var(--roast)]"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}
