// Performance in the browser: the Sweat (500 nights; budget 50 ms, CLAUDE.md) on a busy floor, and
// frame times with the crowd in. Usage: npm run perf (dev server on BASE).
import fs from 'node:fs';
import { open, outDir } from './lib.mjs';

const out = outDir();
const { browser, page, errors } = await open();
const sw = await page.evaluate(async () => {
  const { sweat } = await import('/src/sim/sweat.ts');
  const s = window.__app.screen;
  for (const tb of [0, 1]) s.order({ t: 'setLimits', table: tb, min: 500, max: 50000 });
  for (let i = 0; i < 14; i++) s.order({ t: 'spawn', type: i % 5 ? 'tourist' : 'highRoller' });
  // a deep cage so the whales can't bust the house before we measure
  s.game.s.cage = 1e9;
  for (let t = 0; t < 900; t++) s.tick();
  const g = s.game.s;
  const seated = g.agents.filter((a) => a.phase === 'seated').length;
  sweat(g, 500, 1);
  const times = [];
  for (let k = 0; k < 10; k++) {
    const t0 = performance.now();
    sweat(g, 500, 100 + k);
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  return { seated, medianMs: times[5], worstMs: times[9] };
});
console.log('the Sweat, 500 nights:', sw, sw.worstMs < 50 ? 'within the 50 ms budget' : 'OVER the 50 ms budget');

await page.evaluate(() => {
  const app = window.__app;
  app.fixedAlpha = null;
  app.loop.paused = false;
  app.loop.speed = 2;
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
console.log('frames at 2x:', frames);
fs.writeFileSync(`${out}/perf.json`, JSON.stringify({ sweat: sw, frames }, null, 1));
console.log('errors:', errors.length);
for (const e of errors) console.log(e);
await browser.close();
if (sw.worstMs >= 50 || errors.length) process.exitCode = 1;
