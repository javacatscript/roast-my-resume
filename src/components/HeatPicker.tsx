'use client';
import { useState } from 'react';
import { IntensityToggle } from '@/components/IntensityToggle';
import { cannedRoast } from '@/lib/canned';
import type { Intensity, ScannedBullet } from '@/lib/types';

const TEXT = 'Responsible for managing the frontend release process';
export const HEAT_SAMPLE: ScannedBullet = {
  id: 0,
  text: TEXT,
  start: 0,
  end: TEXT.length,
  flags: [{ rule: 'weak-phrase', detail: 'uses the weak phrase "responsible for"' }],
  score: 3,
};

export function HeatPicker() {
  const [level, setLevel] = useState<Intensity>('high');
  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[auto_1fr] lg:items-start">
      <IntensityToggle value={level} onChange={setLevel} />
      <div className="rounded-[1.5rem] border border-line bg-surface p-6 sm:p-7">
        <p className="doc text-lg text-muted line-through decoration-roast/60">{HEAT_SAMPLE.text}</p>
        <p aria-live="polite" className="mt-4 border-l-2 border-roast pl-4 text-[17px] font-medium leading-snug text-roast">
          {cannedRoast(HEAT_SAMPLE, level)}
        </p>
      </div>
    </div>
  );
}
