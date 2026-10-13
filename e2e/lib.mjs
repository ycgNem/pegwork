// Shared e2e setup: a headless browser on the dev server (BASE, default http://localhost:5183/),
// console errors collected, and helpers to drive the debug screen deterministically.
import { chromium } from 'playwright';
import fs from 'node:fs';

export const BASE = process.env.BASE ?? 'http://localhost:5183/';
/** 384x216 at x4 */
export const VIEW = { width: 1536, height: 864 };

export async function open() {
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: VIEW, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
  await page.goto(BASE);
  await page.waitForFunction(() => window.__app?.screen?.dryReady, null, { timeout: 20000 });
  // freeze the loop: the tests step the sim themselves so every shot is the same frame
  await page.evaluate(() => { window.__app.loop.paused = true; });
  return { browser, page, errors };
}

export function outDir(sub = '') {
  const d = 'e2e/out' + (sub ? '/' + sub : '');
  fs.mkdirSync(d, { recursive: true });
  return d;
}

/** Logical (384x216) point -> page point. */
export async function toPage(page, x, y) {
  return page.evaluate(([x, y]) => {
    const c = document.getElementById('game').getBoundingClientRect();
    const k = c.width / 384;
    return [c.left + (x + 0.5) * k, c.top + (y + 0.5) * k];
  }, [x, y]);
}

/** Step the sim `n` ticks and render one frame at `alpha`. */
export async function step(page, n, alpha = 0) {
  await page.evaluate(([n, alpha]) => {
    const app = window.__app;
    for (let i = 0; i < n; i++) app.screen.tick();
    app.renderNow(alpha);
  }, [n, alpha]);
}
