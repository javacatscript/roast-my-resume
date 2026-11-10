'use client';
import { useId, useState } from 'react';
import { IntensityToggle } from '@/components/IntensityToggle';
import { SAMPLE_RESUME } from '@/data/sampleResume';
import { MAX_RESUME_CHARS } from '@/lib/limits';
import { NoTextLayerError, extractPdfText } from '@/lib/pdf';
import type { Intensity } from '@/lib/types';

const secondary =
  'btn cursor-pointer bg-surface2 px-4 py-2.5 text-sm font-semibold text-text focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-fire';

export function UploadScreen({
  onStart,
  message,
}: {
  onStart: (text: string, i: Intensity) => void;
  message?: string;
}) {
  const [text, setText] = useState('');
  const [intensity, setIntensity] = useState<Intensity>('high');
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileId = useId();

  const tooLong = text.length > MAX_RESUME_CHARS;
  const error = tooLong
    ? `That's too long. Keep it under ${MAX_RESUME_CHARS.toLocaleString()} characters.`
    : (pdfError ?? message ?? null);
  const canStart = text.trim().length > 0 && !tooLong && !busy;

  async function onFile(input: HTMLInputElement) {
    const file = input.files?.[0];
    if (!file) return;
    setPdfError(null);
    setBusy(true);
    try {
      setText(await extractPdfText(file));
    } catch (e) {
      setPdfError(
        e instanceof NoTextLayerError
          ? 'This PDF has no selectable text. Paste the text instead.'
          : "Couldn't read that PDF. Paste the text instead.",
      );
    } finally {
      setBusy(false);
      input.value = ''; // lets the same file be chosen again after an error
    }
  }

  return (
    <div className="panel p-4 text-text sm:p-5">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your resume here, one bullet per line…"
        aria-label="Resume text"
        rows={4}
        className="w-full resize-y rounded-[5px] border-2 border-edge bg-bg p-4 text-[15px] leading-relaxed text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-fire"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <label htmlFor={fileId} className={secondary}>
          Upload PDF
        </label>
        <input id={fileId} type="file" accept="application/pdf" className="sr-only" onChange={(e) => onFile(e.target)} />
        <button
          type="button"
          onClick={() => {
            setPdfError(null);
            setText(SAMPLE_RESUME);
          }}
          className={secondary}
        >
          Try the sample
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-roast">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <IntensityToggle value={intensity} onChange={setIntensity} />
        <button
          type="button"
          disabled={!canStart}
          onClick={() => onStart(text, intensity)}
          className="btn fire-fill px-6 py-3 font-bold disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fire"
        >
          Let&apos;s Begin
        </button>
      </div>

    </div>
  );
}
