'use client';
import { useEffect, useState } from 'react';

/** Reveals `text` character by character when enabled; otherwise returns it whole. */
export function useTypewriter(text: string, enabled: boolean, msPerChar = 16): string {
  const [progress, setProgress] = useState({ text: '', n: 0 });
  const n = progress.text === text ? progress.n : 0;

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      setProgress((p) => {
        const cur = p.text === text ? p.n : 0;
        if (cur >= text.length) {
          clearInterval(id);
          return p.text === text ? p : { text, n: cur };
        }
        return { text, n: cur + 1 };
      });
    }, msPerChar);
    return () => clearInterval(id);
  }, [text, enabled, msPerChar]);

  return enabled ? text.slice(0, n) : text;
}
