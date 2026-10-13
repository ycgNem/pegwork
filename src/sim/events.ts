// Events out: what happened this tick, for the renderer, the sound and the tests. The queue is
// drained by whoever reads it (Game.drain); the sim never reads its own events back.

export type GameEvent =
  | { t: 'dropped'; marble: number; column: number; stake: number }
  | { t: 'contact'; marble: number; body: number; part: number; mat: string; speed: number }
  | { t: 'landed'; marble: number; cup: number; mult: number; tags: number; payout: number }
  | { t: 'jammed'; marble: number }
  | { t: 'rejected'; reason: string };
