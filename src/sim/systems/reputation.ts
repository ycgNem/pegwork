// Word of mouth (DESIGN.md §5, pillar 3): a gambler who leaves up 50% or more talks the house up;
// one who goes broke inside an hour talks it down a little. Everyone else is quiet.
import { GAMBLER_TYPES } from '../../data/gamblers';
import type { GameState } from '../state';

export const WOM = {
  upShare: 500,
  brokeShare: 900,
  brokeMinutes: 60,
  brokePenalty: 300,
  derivation: 'DESIGN.md §5: +WoM when leaving up 50%; -0.3 WoM when broke inside 60 minutes',
} as const;

export function reputationSystem(g: GameState) {
  for (const e of g.now) {
    if (e.t !== 'left') continue;
    const wom = GAMBLER_TYPES[e.type].wom;
    if (e.net * 1000 >= e.start * WOM.upShare) {
      g.wom += wom;
      g.stats.leftUp++;
    } else if (-e.net * 1000 >= e.start * WOM.brokeShare && e.minutes <= WOM.brokeMinutes) {
      g.wom -= Math.round((wom * WOM.brokePenalty) / 1000);
      g.stats.leftBroke++;
    }
  }
}
