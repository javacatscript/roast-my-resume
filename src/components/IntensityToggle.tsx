'use client';
import type { Intensity } from '@/lib/types';

const OPTIONS: { value: Intensity; label: string; hint: string }[] = [
  { value: 'mild', label: 'Mild', hint: 'gentle teasing' },
  { value: 'medium', label: 'Medium', hint: 'sarcastic' },
  { value: 'high', label: 'High', hint: 'no mercy' },
];

export function IntensityToggle({
  value,
  onChange,
}: {
  value: Intensity;
  onChange: (i: Intensity) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Roast intensity" className="flex gap-2">
      {OPTIONS.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`rounded-lg border px-4 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-roast ${
              active
                ? 'border-roast bg-roast/15 text-text shadow-[0_0_18px_-4px_var(--roast)]'
                : 'border-white/10 bg-panel text-muted hover:border-white/25'
            }`}
          >
            <span className="font-semibold">{o.label}</span>
            <span className="ml-2 hidden text-xs opacity-70 sm:inline">{o.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
