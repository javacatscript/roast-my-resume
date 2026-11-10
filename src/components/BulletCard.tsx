'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { keepOriginalMock } from '@/lib/canned';
import type { GameCard } from '@/lib/game';
import { useTypewriter } from '@/hooks/useTypewriter';
import type { Intensity } from '@/lib/types';

interface Props {
  card: GameCard;
  intensity: Intensity;
  onChoose: (c: 'rewrite' | 'original') => void;
  onEdit: (text: string) => void;
  onNext: () => void;
  reducedMotion: boolean;
  isLast?: boolean;
}

const btn =
  'rounded-lg border px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-40';

export function BulletCard({ card, intensity, onChoose, onEdit, onNext, reducedMotion, isLast }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const articleRef = useRef<HTMLElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const editRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);
  const wasEditing = useRef(false);

  const ready = card.status === 'ready';
  const canned = card.source === 'canned';
  const decided = card.choice !== 'pending';
  const praise = card.bullet.flags.length === 0;
  const roast = useTypewriter(card.roast, canned && ready && !reducedMotion);
  const typing = card.status === 'roasting' || (canned && ready && roast.length < card.roast.length);
  const shake = !reducedMotion && intensity === 'high' && ready && !canned;

  // Keyboard flow: a new card takes focus, then hands it to the first action when it is ready,
  // then to the continue button once a choice is made.
  useEffect(() => {
    articleRef.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (!ready || decided || praise || editing) return;
    const active = document.activeElement;
    if (!active || active === document.body || active === articleRef.current) {
      (primaryRef.current ?? editRef.current)?.focus();
    }
  }, [ready, decided, praise, editing]);
  useEffect(() => {
    if (decided || praise) nextRef.current?.focus();
  }, [decided, praise]);
  useEffect(() => {
    if (editing) draftRef.current?.focus();
    else if (wasEditing.current) editRef.current?.focus();
    wasEditing.current = editing;
  }, [editing]);

  const enter = reducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 40, scale: 0.94 },
        animate: { opacity: 1, y: 0, scale: 1 },
      };

  return (
    <motion.article
      ref={articleRef}
      tabIndex={-1}
      data-reduced-motion={String(reducedMotion)}
      {...enter}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      className="w-full rounded-2xl border border-white/10 bg-panel p-6 shadow-[0_0_40px_-18px_var(--roast)]"
    >
      <div role="status" aria-live="polite" className="sr-only">
        {ready ? `Roast: ${card.roast} ${canned ? 'Tip' : 'Rewrite'}: ${card.rewrite}` : ''}
      </div>
      <p className="text-xs uppercase tracking-widest text-muted">Original</p>
      <p className="mt-1 text-lg">{card.bullet.text}</p>

      <motion.div
        data-shake={shake ? 'true' : undefined}
        animate={shake ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
        className="mt-5 rounded-xl border border-roast/30 bg-roast/10 p-4"
      >
        <p className="text-xs uppercase tracking-widest text-roast">Roast</p>
        <p className="mt-1 min-h-6 text-roast/95">
          {roast}
          {typing && <span aria-hidden className="ml-0.5 inline-block w-2 animate-pulse bg-roast">&nbsp;</span>}
        </p>
      </motion.div>

      {ready && (
        <motion.div
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, rotateX: -90 }}
          animate={reducedMotion ? { opacity: 1 } : { opacity: 1, rotateX: 0 }}
          transition={{ type: 'spring', stiffness: 160, damping: 18, delay: reducedMotion ? 0 : 0.3 }}
          style={{ transformPerspective: 900 }}
          className="mt-4 rounded-xl border border-rewrite/30 bg-rewrite/10 p-4"
        >
          <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-rewrite">
            {canned ? 'Tip' : 'Rewrite'}
            {canned && !praise && (
              <span className="rounded bg-white/10 px-2 py-0.5 normal-case tracking-normal text-muted">
                AI unavailable
              </span>
            )}
          </p>
          <p className="mt-1 text-rewrite">{card.rewrite}</p>
        </motion.div>
      )}

      {editing ? (
        <div className="mt-5 flex flex-col gap-3">
          <textarea
            ref={draftRef}
            aria-label="Edit bullet"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-white/15 bg-panel2 p-3 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              className={`${btn} border-rewrite bg-rewrite text-black`}
              disabled={!draft.trim()}
              onClick={() => {
                onEdit(draft.trim());
                setEditing(false);
              }}
            >
              Save
            </button>
            <button type="button" className={`${btn} border-white/15`} onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : decided || praise ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {praise && 'Go on, enjoy it.'}
            {card.choice === 'original' && keepOriginalMock(intensity)}
            {card.choice === 'rewrite' && 'Rewrite locked in.'}
            {card.choice === 'edited' && 'Your edit is saved.'}
          </p>
          <button ref={nextRef} type="button" className={`${btn} border-white bg-white text-black`} onClick={onNext}>
            {isLast ? 'See results' : 'Next bullet →'}
          </button>
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap gap-2">
          {!canned && (
            <button
              ref={primaryRef}
              type="button"
              disabled={!ready}
              className={`${btn} border-rewrite bg-rewrite text-black`}
              onClick={() => onChoose('rewrite')}
            >
              Keep rewrite
            </button>
          )}
          <button
            type="button"
            disabled={!ready}
            className={`${btn} border-white/20`}
            onClick={() => onChoose('original')}
          >
            Keep original
          </button>
          <button
            ref={editRef}
            type="button"
            disabled={!ready}
            className={`${btn} border-white/20`}
            onClick={() => {
              setDraft(canned ? card.bullet.text : card.rewrite);
              setEditing(true);
            }}
          >
            Edit
          </button>
        </div>
      )}
    </motion.article>
  );
}
