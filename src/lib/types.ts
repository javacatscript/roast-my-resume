export type Intensity = 'mild' | 'medium' | 'high';
export type RuleId =
  | 'weak-phrase'
  | 'no-metric'
  | 'passive'
  | 'repeated-verb'
  | 'too-long';

export interface Bullet {
  id: number;
  text: string;
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
