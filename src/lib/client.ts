import type { RoastRequest } from '@/lib/limits';

export const STALL_MS = 12000;

export class RoastError extends Error {
  /**
   * rate-limit / unavailable / network: the AI should be considered off.
   * rejected: the server refused this one request (e.g. 400); other cards are fine.
   * interrupted: a stream stalled or died midway; worth one retry.
   */
  kind: 'rate-limit' | 'unavailable' | 'network' | 'rejected' | 'interrupted';
  retryAfter?: number;
  constructor(kind: RoastError['kind'], message: string, retryAfter?: number) {
    super(message);
    this.kind = kind;
    this.retryAfter = retryAfter;
  }
}

const isAbort = (e: unknown) => e instanceof DOMException && e.name === 'AbortError';

export async function streamRoast(
  req: RoastRequest,
  onDelta: (raw: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const ctl = new AbortController();
  const onOuterAbort = () => ctl.abort();
  if (signal?.aborted) ctl.abort();
  signal?.addEventListener('abort', onOuterAbort, { once: true });

  let stalled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const arm = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      stalled = true;
      ctl.abort();
    }, STALL_MS);
  };
  const callerAborted = () => !!signal?.aborted;

  try {
    arm();
    let res: Response;
    try {
      res = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(req),
        signal: ctl.signal,
      });
    } catch (e) {
      if (stalled) throw new RoastError('interrupted', 'Timed out');
      if (callerAborted() || isAbort(e)) throw new DOMException('Aborted', 'AbortError');
      throw new RoastError('network', 'Network error');
    }
    if (res.status === 429) {
      const ra = Number(res.headers.get('Retry-After'));
      throw new RoastError('rate-limit', 'Rate limited', Number.isFinite(ra) ? ra : undefined);
    }
    if (res.status === 400) throw new RoastError('rejected', 'Request rejected');
    if (!res.ok || !res.body) throw new RoastError('unavailable', 'AI unavailable');

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let full = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        arm();
        full += dec.decode(value, { stream: true });
        onDelta(full);
      }
    } catch (e) {
      if (stalled) throw new RoastError('interrupted', 'Timed out');
      if (callerAborted()) throw new DOMException('Aborted', 'AbortError');
      throw new RoastError('interrupted', isAbort(e) ? 'Stream aborted' : 'Stream interrupted');
    }
    return full;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onOuterAbort);
  }
}
