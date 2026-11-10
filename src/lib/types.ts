export type Intensity = 'mild' | 'medium' | 'high';
export type RuleId =
  | 'weak-phrase'
  | 'no-metric'
  | 'passive'
  | 'repeated-verb'
  | 'too-long';

export interface Bullet {
  id: number;
  /** Bullet text with the marker removed and wrapped lines joined by single spaces. */
  text: string;
  /** Offsets of the bullet text (without its marker) in the normalized source text. */
  start: number;
  end: number;
}
export interface Flag {
  rule: RuleId;
  detail: string;
}
export interface ScannedBullet extends Bullet {
  flags: Flag[];
  score: number;
}
export interface CardResult {
  roast: string;
  rewrite: string;
  tags: string[];
}
