'use client';
import type { Intensity } from '@/lib/types';

const OPTIONS: { value: Intensity; label: string }[] = [
  { value: 'mild', label: 'Mild' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function IntensityToggle({ value, onChange }: { value: Intensity; onChange: (i: Intensity) => void }) {
  return (
    <div role="radiogroup" aria-label="Roast intensity" className="inline-flex rounded-md border-2 border-edge bg-surface2 p-1">
      {OPTIONS.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
              if (!d) return;
              e.preventDefault();
              const next = OPTIONS[(i + d + OPTIONS.length) % OPTIONS.length].value;
              onChange(next);
              (e.currentTarget.parentElement?.querySelector(`[data-v="${next}"]`) as HTMLElement | null)?.focus();
            }}
            data-v={o.value}
            className={`whitespace-nowrap rounded-[4px] px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fire ${
              active ? 'fire-fill' : 'text-muted hover:text-text'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
