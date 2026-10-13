// The Milestone 0 screenshots (CLAUDE.md "send screenshots"): the floor mid-night, the paytable
// editor with a bet's edge, volatility and hit rate, a whale with the Sweat over 10%, and the
// count room. Usage: npm run shots (dev server on BASE).
import { open, outDir, step, toPage } from './lib.mjs';

const out = outDir();
const { browser, page, errors } = await open();
const H = 1620;
const shot = async (name) => { await page.screenshot({ path: `${out}/${name}.png` }); console.log('shot', name); };

// 10:30 PM: the crowd is in
await page.mouse.move(1, 1);
await step(page, Math.round(2.5 * H), 0.5);
await shot('m0-floor-night');

// the editor: hover Any Seven on Hi-Lo for its odds
const [bx, by] = await toPage(page, 470, 18 + 28 + 11 + 2 * 11 + 3);
await page.mouse.move(bx, by);
await step(page, 0, 0.5);
await shot('m0-editor-odds');

// a whale walks in to $500 maximums at both tables: watch the Sweat
await page.mouse.move(1, 1);
await page.evaluate(() => {
  const s = window.__app.screen;
  s.order({ t: 'setLimits', table: 0, min: 500, max: 50000 });
  s.order({ t: 'setLimits', table: 1, min: 500, max: 50000 });
  s.order({ t: 'spawn', type: 'highRoller' });
});
await page.waitForFunction(() => {
  const s = window.__app.screen;
  for (let i = 0; i < 30; i++) s.tick();
  const w = s.game.s.agents.find((a) => a.type === 'highRoller');
  if (w?.phase === 'seated') s.selected = w.table;
  return w?.phase === 'seated';
});
await step(page, 120, 0.5);
await shot('m0-whale-sweat');

// run to 6am
await step(page, 10 * H, 0);
await shot('m0-count-room');

console.log('errors:', errors.length);
for (const e of errors) console.log(e);
await browser.close();
if (errors.length) process.exitCode = 1;
