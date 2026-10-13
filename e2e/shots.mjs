// The Milestone 0 screenshots: the debug board with a marble mid-fall, and the Dry Run histogram
// (300 drops) for the column under the mouse. Usage: npm run shots (dev server on BASE).
import { open, outDir, step, toPage } from './lib.mjs';

const out = outDir();
const { browser, page, errors } = await open();

// a marble mid-fall: dropped above column 10, 40 ticks in (two-thirds of a second)
await page.evaluate(() => window.__app.screen.drop(9));
await step(page, 40, 0.5);
await page.screenshot({ path: `${out}/m0-marble-midfall.png` });
console.log('shot m0-marble-midfall');

// three more marbles at different heights, then the histogram for the column under the mouse
await page.evaluate(() => { const s = window.__app.screen; s.drop(4); });
await step(page, 12);
await page.evaluate(() => window.__app.screen.drop(15));
await step(page, 12);
await page.evaluate(() => window.__app.screen.drop(10));
await step(page, 10, 0.5);
const [mx, my] = await toPage(page, 12 + 10 * 8 + 4, 100);
await page.mouse.move(mx, my);
await step(page, 0, 0.5);
await page.screenshot({ path: `${out}/m0-dryrun-histogram.png` });
console.log('shot m0-dryrun-histogram');

// run everything in play to the cups for the results line
await step(page, 400);
await page.mouse.move(1, 1);
await step(page, 0);
await page.screenshot({ path: `${out}/m0-after-drops.png` });
console.log('shot m0-after-drops');

console.log('errors:', errors.length);
for (const e of errors) console.log(e);
await browser.close();
if (errors.length) process.exitCode = 1;
