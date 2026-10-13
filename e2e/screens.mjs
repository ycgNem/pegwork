// Screenshot sweep + overlap audit: every screen in a scripted state, one PNG each. For each shot
// the UI's overlap audit (src/ui/audit.ts) lists texts that clash, overflow their panel or button,
// or get painted over; shots with issues also get a <name>.issues.png with the problems boxed.
// Results: e2e/out/screens/ (report.md, report.json, PNGs); the previous run is kept in
// e2e/out/screens-prev/. Usage: npm run screens [-- name,name]
import fs from 'node:fs';
import { open, step, toPage } from './lib.mjs';

const only = process.argv[2]?.split(',');
const out = 'e2e/out/screens', prev = out + '-prev';
if (!only && fs.existsSync(out)) {
  fs.rmSync(prev, { recursive: true, force: true });
  fs.renameSync(out, prev);
}
fs.mkdirSync(out, { recursive: true });

const { browser, page, errors } = await open();
await page.evaluate(async () => {
  window.__app.ui.audit = true;
  window.__audit = await import('/src/ui/audit.ts');
});

const report = [];
async function shot(name) {
  await step(page, 0, 0.5);
  await step(page, 0, 0.5); // the audit reads the last complete frame
  await page.screenshot({ path: `${out}/${name}.png` });
  const { issues, k } = await page.evaluate(() => {
    const ui = window.__app.ui;
    return { issues: window.__audit.findIssues(ui.lastAudit, { w: ui.w, h: ui.h }), k: window.__app.scaler.k / window.__app.scaler.dpr };
  });
  report.push({ name, issues });
  if (issues.length) {
    await page.evaluate(({ issues, k }) => {
      const c = document.getElementById('game').getBoundingClientRect();
      const root = document.createElement('div');
      root.id = '__auditOverlay';
      root.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99';
      const col = { clash: '#ff2d55', overflow: '#ff9500', covered: '#00c7ff' };
      for (const i of issues)
        for (const [r, dashed] of [[i.rect, false], [i.otherRect, true]]) {
          if (!r) continue;
          const b = document.createElement('div');
          b.style.cssText = `position:absolute;left:${c.left + r.x * k}px;top:${c.top + r.y * k}px;width:${r.w * k}px;height:${r.h * k}px;outline:2px ${dashed ? 'dashed' : 'solid'} ${col[i.type]}`;
          root.appendChild(b);
        }
      document.body.appendChild(root);
    }, { issues, k });
    await page.screenshot({ path: `${out}/${name}.issues.png` });
    await page.evaluate(() => document.getElementById('__auditOverlay')?.remove());
  }
  console.log(`${issues.length ? '!' : ' '} ${name}${issues.length ? `  (${issues.length} issue${issues.length > 1 ? 's' : ''})` : ''}`);
}

// name -> setup; run in order, each from where the last left off
const H = 1620;
const order = (cmd) => page.evaluate((c) => window.__app.screen.order(c), cmd);
const SC = {
  'day-1': async () => { await page.mouse.move(1, 1); },
  'day-1-buy-tip': async () => { const [x, y] = await toPage(page, 82 + 300 - 60, 70 + 22 + 10 + 10 + 14 + 3); await page.mouse.move(x, y); },
  'floor-open': async () => { await page.mouse.move(1, 1); await order({ t: 'openDoors' }); },
  'floor-busy': async () => { await step(page, Math.round(2.5 * H)); },
  'bet-tooltip': async () => { const [x, y] = await toPage(page, 470, 18 + 28 + 11 + 2 * 11 + 3); await page.mouse.move(x, y); },
  'sweat-tooltip': async () => { const [x, y] = await toPage(page, 480, 16 + 184 + 17 + 14 + 3); await page.mouse.move(x, y); },
  'wheel-selected': async () => {
    await page.mouse.move(1, 1);
    await page.evaluate(() => { window.__app.screen.selected = 1; });
  },
  'danger-flash': async () => {
    await order({ t: 'setLimits', table: 1, min: 500, max: 50000 });
    await page.evaluate(() => { window.__app.screen.rs.time = 0; });
    const [x, y] = await toPage(page, 104 + 11 * 16 + 8, 64 + 5 * 16 + 8);
    await page.mouse.move(x, y);
  },
  'whale': async () => {
    await page.mouse.move(1, 1);
    await order({ t: 'spawn', type: 'highRoller' });
    await step(page, 400);
  },
  'day-2': async () => {
    await page.evaluate(() => { window.__app.screen.game.s.cage = 5000000; });
    await step(page, 10 * H);
  },
  'bust': async () => {
    await page.evaluate(() => {
      const s = window.__app.screen;
      s.newSeason();
      s.order({ t: 'openDoors' });
      s.order({ t: 'setLimits', table: 1, min: 2500, max: 250000 });
      s.order({ t: 'setLimits', table: 0, min: 2500, max: 250000 });
      for (let i = 0; i < 3; i++) s.order({ t: 'spawn', type: 'highRoller' });
      for (let t = 0; t < 20000 && !s.game.s.busted; t++) s.tick();
    });
  },
};

for (const [name, setup] of Object.entries(SC)) {
  if (only && !only.includes(name)) continue;
  await setup();
  await shot(name);
}

const total = report.reduce((n, r) => n + r.issues.length, 0);
const md = [`# Screens overlap report`, '', `${report.length} shots, ${total} issue${total === 1 ? '' : 's'}.`, ''];
for (const r of report) {
  md.push(`## ${r.name}: ${r.issues.length ? r.issues.length + ' issue(s)' : 'clean'}`);
  for (const i of r.issues) md.push(`- ${i.type}: "${i.text}" ${i.other ? `vs ${i.other}` : ''} at ${JSON.stringify(i.rect)}`);
  md.push('');
}
if (errors.length) md.push('## Console errors', '', ...errors.map((e) => `- ${e}`));
fs.writeFileSync(`${out}/report.md`, md.join('\n'));
fs.writeFileSync(`${out}/report.json`, JSON.stringify({ report, errors }, null, 1));
console.log(`${total} issue(s), ${errors.length} console error(s); report in ${out}/report.md`);
await browser.close();
