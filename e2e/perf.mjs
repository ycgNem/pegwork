// Performance in the browser: the Dry Run (300 drops; budget 50 ms, DESIGN.md §1) and frame times
// with marbles in play. Usage: npm run perf (dev server on BASE).
import fs from 'node:fs';
import { open, outDir } from './lib.mjs';

const out = outDir();
const { browser, page, errors } = await open();
const dry = await page.evaluate(async () => {
  const { dryRun } = await import('/src/sim/dryrun.ts');
  const { MARBLES } = await import('/src/data/marbles.ts');
  const board = window.__app.screen.game.s.board;
  dryRun(board, MARBLES.steel, 9, 300, 1);
  const times = [];
  for (let c = 0; c < 20; c++) {
    const t0 = performance.now();
    dryRun(board, MARBLES.steel, c, 300, 1000 + c);
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  return { medianMs: times[10], worstMs: times[19] };
});
console.log('dry run, 300 drops:', dry, dry.worstMs < 50 ? 'within the 50 ms budget' : 'OVER the 50 ms budget');

// live: twenty marbles in play, frame times over 3 seconds
await page.evaluate(() => {
  const app = window.__app;
  app.fixedAlpha = null;
  app.loop.paused = false;
  app.screen.game.s.bankroll = 1e7;
  for (let c = 0; c < 20; c++) app.screen.drop(c);
});
const frames = await page.evaluate(() => new Promise((resolve) => {
  const L = window.__app.loop;
  const samples = [];
  let last = performance.now();
  const f = () => {
    const now = performance.now();
    samples.push(now - last);
    last = now;
    if (samples.length < 180) requestAnimationFrame(f);
    else {
      samples.sort((a, b) => a - b);
      resolve({ avgFrameMs: samples.reduce((a, b) => a + b, 0) / samples.length, p95: samples[Math.floor(samples.length * 0.95)], tickMs: L.tickMs, drawMs: L.frameMs });
    }
  };
  requestAnimationFrame(f);
}));
console.log('frames:', frames);
fs.writeFileSync(`${out}/perf.json`, JSON.stringify({ dry, frames }, null, 1));
console.log('errors:', errors.length);
for (const e of errors) console.log(e);
await browser.close();
if (dry.worstMs >= 50 || errors.length) process.exitCode = 1;
