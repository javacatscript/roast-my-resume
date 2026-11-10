import type { RoastRequest } from '@/lib/limits';

export class RoastError extends Error {
  kind: 'rate-limit' | 'unavailable' | 'network';
  retryAfter?: number;
  constructor(kind: RoastError['kind'], message: string, retryAfter?: number) {
    super(message);
    this.kind = kind;
    this.retryAfter = retryAfter;
  }
}

export async function streamRoast(
  req: RoastRequest,
  onDelta: (raw: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  let res: Response;
  try {
    res = await fetch('/api/roast', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
      signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new RoastError('network', 'Network error');
  }
  if (res.status === 429) {
    const ra = Number(res.headers.get('Retry-After'));
    throw new RoastError('rate-limit', 'Rate limited', Number.isFinite(ra) ? ra : undefined);
  }
  if (!res.ok || !res.body) throw new RoastError('unavailable', 'AI unavailable');

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      full += dec.decode(value, { stream: true });
      onDelta(full);
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new RoastError('network', 'Stream interrupted');
  }
  return full;
}
