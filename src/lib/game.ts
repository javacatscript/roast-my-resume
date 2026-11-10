import { praiseCard } from '@/lib/canned';
import { normalizeText } from '@/lib/segment';
import type { ScanResult } from '@/lib/scanner';
import type { Intensity, ScannedBullet } from '@/lib/types';

export type Phase = 'input' | 'scanning' | 'playing' | 'done';
export type Choice = 'pending' | 'rewrite' | 'original' | 'edited';

export interface GameCard {
  bullet: ScannedBullet;
  status: 'queued' | 'roasting' | 'ready';
  source: 'ai' | 'canned';
  roast: string;
  /** For canned cards this holds the rule tip, never a fake rewrite. */
  rewrite: string;
  choice: Choice;
  edited?: string;
}

export interface GameState {
  phase: Phase;
  intensity: Intensity;
  cards: GameCard[];
  index: number;
  aiAvailable: boolean;
  notice?: string;
}

export type GameAction =
  | { type: 'start-scan'; intensity: Intensity }
  | { type: 'scan-done'; result: ScanResult }
  | { type: 'card-start'; index: number }
  | { type: 'delta'; index: number; roast: string; rewrite: string }
  | { type: 'card-ready'; index: number; roast: string; rewrite: string }
  | { type: 'card-fallback'; index: number; roast: string; tip: string; disableAi: boolean; notice?: string }
  | { type: 'choose'; choice: Exclude<Choice, 'pending' | 'edited'> }
  | { type: 'edit'; text: string }
  | { type: 'next' }
  | { type: 'reset' };

export const initialState: GameState = {
  phase: 'input',
  intensity: 'high',
  cards: [],
  index: 0,
  aiAvailable: true,
};

const patch = (s: GameState, index: number, p: Partial<GameCard>): GameState => ({
  ...s,
  cards: s.cards.map((c, i) => (i === index ? { ...c, ...p } : c)),
});

export function gameReducer(s: GameState, a: GameAction): GameState {
  switch (a.type) {
    case 'start-scan':
      return { ...initialState, phase: 'scanning', intensity: a.intensity };
    case 'scan-done': {
      if (a.result.empty) {
        return {
          ...initialState,
          intensity: s.intensity,
          notice: "Couldn't find any bullets in that. Paste your experience section, one bullet per line.",
        };
      }
      if (a.result.clean) {
        const p = praiseCard(s.intensity);
        const card: GameCard = {
          bullet: { id: 0, text: p.original, start: 0, end: 0, flags: [], score: 0 },
          status: 'ready',
          source: 'canned',
          roast: p.roast,
          rewrite: p.tip,
          choice: 'pending',
        };
        return { ...s, phase: 'playing', index: 0, cards: [card] };
      }
      const cards = a.result.flagged.map<GameCard>((bullet) => ({
        bullet, status: 'queued', source: 'ai', roast: '', rewrite: '', choice: 'pending',
      }));
      return { ...s, phase: 'playing', index: 0, cards };
    }
    case 'card-start':
      return patch(s, a.index, { status: 'roasting', roast: '', rewrite: '' });
    case 'delta':
      return patch(s, a.index, { status: 'roasting', roast: a.roast, rewrite: a.rewrite });
    case 'card-ready':
      return patch(s, a.index, { status: 'ready', source: 'ai', roast: a.roast, rewrite: a.rewrite });
    case 'card-fallback': {
      const next = patch(s, a.index, {
        status: 'ready', source: 'canned', roast: a.roast, rewrite: a.tip,
      });
      return a.disableAi
        ? { ...next, aiAvailable: false, notice: a.notice ?? next.notice }
        : next;
    }
    case 'choose': {
      const c = s.cards[s.index];
      if (!c || c.status !== 'ready' || c.choice !== 'pending') return s;
      return patch(s, s.index, { choice: a.choice });
    }
    case 'edit': {
      const c = s.cards[s.index];
      if (!c || c.status !== 'ready' || c.choice !== 'pending') return s;
      return patch(s, s.index, { choice: 'edited', edited: a.text });
    }
    case 'next':
      return s.index >= s.cards.length - 1
        ? { ...s, phase: 'done' }
        : { ...s, index: s.index + 1 };
    case 'reset':
      return initialState;
  }
}

/** Rebuilds the resume with each chosen AI rewrite or edit swapped in for its bullet, by source offset. */
export function applyChoices(originalText: string, cards: GameCard[]): string {
  const src = normalizeText(originalText);
  const edits = cards
    .map((c) => ({
      start: c.bullet.start,
      end: c.bullet.end,
      text:
        c.choice === 'edited'
          ? c.edited
          : c.choice === 'rewrite' && c.source === 'ai'
            ? c.rewrite
            : undefined,
    }))
    .filter((e): e is { start: number; end: number; text: string } => !!e.text && e.end > e.start)
    .sort((a, b) => b.start - a.start);

  let out = src;
  let limit = src.length;
  for (const e of edits) {
    if (e.end > limit) continue;
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
    limit = e.start;
  }
  return out;
}
