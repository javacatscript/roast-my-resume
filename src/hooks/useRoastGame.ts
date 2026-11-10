'use client';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { cannedRoast, ruleTip } from '@/lib/canned';
import { RoastError, streamRoast } from '@/lib/client';
import { applyChoices, gameReducer, initialState, type Choice } from '@/lib/game';
import { scanResume } from '@/lib/scanner';
import { parseCard, splitPartial } from '@/lib/streamFormat';
import type { Intensity, RuleId } from '@/lib/types';

const NOTICE = "AI roasts are unavailable right now, so you're getting the built-in ones.";
const PRIORITY: RuleId[] = ['weak-phrase', 'no-metric', 'passive', 'repeated-verb', 'too-long'];

export function useRoastGame({ scanDelayMs = 1500 }: { scanDelayMs?: number } = {}) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });
  const runId = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelAll = useCallback(() => {
    runId.current++;
    abort.current?.abort();
    if (timer.current) clearTimeout(timer.current);
  }, []);

  useEffect(() => cancelAll, [cancelAll]);

  const start = useCallback(
    (text: string, intensity: Intensity) => {
      cancelAll();
      dispatch({ type: 'start-scan', intensity });
      const result = scanResume(text);
      timer.current = setTimeout(() => dispatch({ type: 'scan-done', result }), scanDelayMs);
    },
    [cancelAll, scanDelayMs],
  );

  const roastCard = useCallback(async (index: number) => {
    const myRun = runId.current;
    const { cards, intensity, aiAvailable } = stateRef.current;
    const card = cards[index];
    const topRule = PRIORITY.find((r) => card.bullet.flags.some((f) => f.rule === r)) ?? 'no-metric';
    const fallback = (disableAi: boolean, notice?: string) =>
      dispatch({
        type: 'card-fallback', index,
        roast: cannedRoast(card.bullet, intensity),
        tip: ruleTip(topRule), disableAi, notice,
      });

    dispatch({ type: 'card-start', index });
    if (!aiAvailable) return fallback(false);

    const controller = new AbortController();
    abort.current = controller;
    const req = { bullet: card.bullet.text, flags: card.bullet.flags, intensity };

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const raw = await streamRoast(
          req,
          (partial) => {
            if (myRun !== runId.current) return;
            const p = splitPartial(partial);
            dispatch({ type: 'delta', index, roast: p.roast, rewrite: p.rewrite });
          },
          controller.signal,
        );
        if (myRun !== runId.current) return;
        const parsed = parseCard(raw);
        if (parsed) return dispatch({ type: 'card-ready', index, roast: parsed.roast, rewrite: parsed.rewrite });
        dispatch({ type: 'card-start', index });
      } catch (e) {
        if (myRun !== runId.current) return;
        if (e instanceof RoastError) return fallback(true, NOTICE);
        if (e instanceof DOMException && e.name === 'AbortError') return;
        return fallback(true, NOTICE);
      }
    }
    if (myRun === runId.current) fallback(false);
  }, []);

  const current = state.cards[state.index];
  useEffect(() => {
    if (state.phase === 'playing' && current?.status === 'queued') void roastCard(state.index);
  }, [state.phase, state.index, current?.status, roastCard]);

  return {
    state,
    start,
    choose: (c: Exclude<Choice, 'pending' | 'edited'>) => dispatch({ type: 'choose', choice: c }),
    saveEdit: (text: string) => dispatch({ type: 'edit', text }),
    next: () => dispatch({ type: 'next' }),
    reset: () => {
      cancelAll();
      dispatch({ type: 'reset' });
    },
    finalText: (originalText: string) => applyChoices(originalText, state.cards),
  };
}
