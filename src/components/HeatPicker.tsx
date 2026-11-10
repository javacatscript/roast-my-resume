'use client';
import { useState } from 'react';
import { IntensityToggle } from '@/components/IntensityToggle';
import { Marked } from '@/components/Marked';
import { cannedRoast } from '@/lib/canned';
import { markSpans } from '@/lib/scanner';
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
      <div className="paper p-6 sm:p-7">
        <p className="doc text-xl leading-snug">
          <Marked text={HEAT_SAMPLE.text} spans={markSpans(HEAT_SAMPLE.text, HEAT_SAMPLE.flags)} />
        </p>
        <div className="mt-3 flex gap-2 font-pen text-[1.65rem] leading-[1.1] text-roast">
          <svg aria-hidden className="mt-1.5 shrink-0" width="28" height="24" viewBox="0 0 26 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M24 19C12 19 5 13 3 3M3 3l-1.5 6M3 3l6 2" />
          </svg>
          <p aria-live="polite">{cannedRoast(HEAT_SAMPLE, level)}</p>
        </div>
      </div>
    </div>
  );
}
