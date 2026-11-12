'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Marked } from '@/components/Marked';
import { Spinner } from '@/components/Spinner';
import { Stamp } from '@/components/Stamp';
import { keepOriginalMock } from '@/lib/canned';
import type { GameCard } from '@/lib/game';
import { markSpans } from '@/lib/scanner';
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
  'btn px-4 py-2.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fire';
const quiet = `${btn} bg-surface2 text-text`;

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
  const spans = markSpans(card.bullet.text, card.bullet.flags);
  const stamped = card.choice === 'original' || praise;

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
    : { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 } };

  return (
    <motion.article
      ref={articleRef}
      tabIndex={-1}
      data-reduced-motion={String(reducedMotion)}
      {...enter}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      className="paper relative w-full p-5 outline-none sm:p-8"
    >
      <div role="status" aria-live="polite" className="sr-only">
        {ready ? `Roast: ${card.roast} ${canned ? 'Tip' : 'Rewrite'}: ${card.rewrite}` : ''}
      </div>

      {card.choice === 'original' && (
        <div className="absolute right-4 top-4 z-10">
          <Stamp label="Rejected" tone="bad" size="sm" reducedMotion={reducedMotion} />
        </div>
      )}
      {praise && (
        <div className="absolute right-4 top-4 z-10">
          <Stamp label="Clean paper" tone="clean" size="sm" reducedMotion={reducedMotion} />
        </div>
      )}

      <p className={`doc text-xl leading-snug sm:text-2xl ${stamped ? 'pr-32 sm:pr-36' : ''}`}>
        <Marked text={card.bullet.text} spans={spans} />
      </p>

      <motion.div
        data-note
        data-shake={shake ? 'true' : undefined}
        animate={shake ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
        className="mt-4 flex min-h-8 gap-2 font-pen text-[1.65rem] leading-[1.1] text-roast"
      >
        <svg aria-hidden className="mt-1.5 shrink-0" width="28" height="24" viewBox="0 0 26 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M24 19C12 19 5 13 3 3M3 3l-1.5 6M3 3l6 2" />
        </svg>
        <p>
          {roast}
          {card.status === 'roasting' && !roast && (
            <span data-loading="roast" className="inline-flex items-center gap-2 text-base text-muted">
              <Spinner /> Sharpening the red pen…
            </span>
          )}
          {typing && (
            <span aria-hidden className="ml-0.5 inline-block h-5 w-2 translate-y-0.5 bg-roast motion-safe:animate-pulse">
              &nbsp;
            </span>
          )}
        </p>
      </motion.div>

      {ready && (
        <motion.div
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: reducedMotion ? 0 : 0.25 }}
          data-rewrite
          className={`relative mt-6 pl-6 transition-opacity ${card.choice === 'original' ? 'opacity-50' : ''}`}
        >
          <svg aria-hidden className="absolute left-1 top-0 -translate-y-3" width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="var(--rewrite)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 13L9 3l7 10" />
          </svg>
          <p className="flex items-center gap-2 text-xs font-semibold text-rewrite">
            {canned ? 'Tip' : 'Rewrite'}
            {canned && !praise && (
              <span className="rounded bg-surface2 px-2 py-0.5 font-medium text-muted">AI unavailable</span>
            )}
          </p>
          <p className="doc mt-1 rounded-sm bg-[#d8f5e8] px-3 py-2 text-lg leading-snug text-[#0b4f38] sm:text-xl">
            {card.rewrite}
          </p>
        </motion.div>
      )}

      {card.status === 'roasting' && (
        <div data-loading="rewrite" aria-hidden className="mt-6 pl-6">
          <p className="flex items-center gap-2 text-xs font-semibold text-rewrite">
            <Spinner /> Writing a better version…
          </p>
          <div className="mt-2 space-y-2">
            <div className="h-5 w-full animate-pulse rounded-sm bg-[#d8f5e8]" />
            <div className="h-5 w-2/3 animate-pulse rounded-sm bg-[#d8f5e8]" />
          </div>
        </div>
      )}

      {editing ? (
        <div className="mt-6 flex flex-col gap-3">
          <textarea
            ref={draftRef}
            aria-label="Edit bullet"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="doc w-full rounded-[5px] border-2 border-edge bg-white p-3 text-base text-text focus-visible:outline-2 focus-visible:outline-fire"
          />
          <div className="flex gap-2">
            <button type="button" className={`${btn} fire-fill`} disabled={!draft.trim()} onClick={() => { onEdit(draft.trim()); setEditing(false); }}>
              Save
            </button>
            <button type="button" className={quiet} onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : decided || praise ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {praise && 'Go on, enjoy it.'}
            {card.choice === 'original' && keepOriginalMock(intensity)}
            {card.choice === 'rewrite' && 'Rewrite locked in.'}
            {card.choice === 'edited' && 'Your edit is saved.'}
          </p>
          <button ref={nextRef} type="button" className={`${btn} fire-fill`} onClick={onNext}>
            {isLast ? 'See results' : 'Next bullet →'}
          </button>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap gap-2.5">
          {!canned && (
            <button ref={primaryRef} type="button" disabled={!ready} className={`${btn} bg-rewrite text-white`} onClick={() => onChoose('rewrite')}>
              Keep rewrite
            </button>
          )}
          <button type="button" disabled={!ready} className={quiet} onClick={() => onChoose('original')}>
            Keep original
          </button>
          <button
            ref={editRef}
            type="button"
            disabled={!ready}
            className={quiet}
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
