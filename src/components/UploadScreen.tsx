'use client';
import { useId, useState } from 'react';
import { IntensityToggle } from '@/components/IntensityToggle';
import { SAMPLE_RESUME } from '@/data/sampleResume';
import { MAX_RESUME_CHARS } from '@/lib/limits';
import { NoTextLayerError, extractPdfText } from '@/lib/pdf';
import type { Intensity } from '@/lib/types';

export function UploadScreen({ onStart }: { onStart: (text: string, i: Intensity) => void }) {
  const [text, setText] = useState('');
  const [intensity, setIntensity] = useState<Intensity>('high');
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileId = useId();

  const tooLong = text.length > MAX_RESUME_CHARS;
  const error = tooLong
    ? `That's too long. Keep it under ${MAX_RESUME_CHARS.toLocaleString()} characters.`
    : pdfError;
  const canStart = text.trim().length > 0 && !tooLong && !busy;

  async function onFile(file: File | undefined) {
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
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-12">
      <header>
        <h1 className="text-5xl font-black tracking-tight">
          Resume <span className="text-roast drop-shadow-[0_0_18px_var(--roast)]">Roast</span>
        </h1>
        <p className="mt-3 text-muted">
          Drop in your resume. Every weak bullet gets roasted, then fixed. Brace yourself.
        </p>
      </header>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your resume here…"
        aria-label="Resume text"
        rows={12}
        className="w-full rounded-xl border border-white/10 bg-panel p-4 font-mono text-sm text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-roast"
      />

      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor={fileId}
          className="cursor-pointer rounded-lg border border-white/10 bg-panel px-4 py-2 text-sm hover:border-white/25 focus-within:outline-2 focus-within:outline-roast"
        >
          Upload PDF
        </label>
        <input
          id={fileId}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => {
            setPdfError(null);
            setText(SAMPLE_RESUME);
          }}
          className="rounded-lg border border-white/10 bg-panel px-4 py-2 text-sm hover:border-white/25"
        >
          Try the sample
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-roast">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <IntensityToggle value={intensity} onChange={setIntensity} />
        <button
          type="button"
          disabled={!canStart}
          onClick={() => onStart(text, intensity)}
          className="rounded-lg bg-roast px-6 py-3 font-bold text-black transition enabled:hover:shadow-[0_0_28px_var(--roast)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start the roast
        </button>
      </div>

      <p className="text-xs text-muted">
        Your resume is sent to Groq to generate the roast. It isn&apos;t stored.
      </p>
    </main>
  );
}
