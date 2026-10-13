// The app: the scaler, the loop, input, sound, and the current screen. The marble board was wiped
// (DECISIONS #19); until Milestone 0's debug floor lands this draws a placeholder card.
import { GameLoop } from '../engine/loop';
import { Input } from '../engine/input';
import { Audio } from '../engine/audio/audio';
import { UI } from '../ui/ui';
import { loadSheets } from '../render/sheets';
import { resetSprites } from '../render/atlas';
import { C } from '../data/palette';
import { Scaler, SCREEN_W, SCREEN_H } from './screen';
import { loadSettings, saveSettings } from './settings';

export class App {
  scaler: Scaler;
  input = new Input();
  ui = new UI();
  audio: Audio;
  loop: GameLoop;
  /** e2e: draw every frame at this alpha instead of the loop's (set by renderNow) */
  fixedAlpha: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.scaler = new Scaler(canvas);
    this.input.attach(canvas);
    const settings = loadSettings();
    this.audio = new Audio(settings);
    this.audio.muted = settings.muted;
    loadSheets().then(() => resetSprites());
    this.ui.sfx = (id) => this.audio.sfx(id);
    const unlock = () => this.audio.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    this.loop = new GameLoop(() => {}, (dt, alpha) => this.frame(dt, alpha));
    this.loop.start();
    (window as any).__app = this;
  }

  renderNow(alpha: number) {
    this.fixedAlpha = alpha;
    this.frame(0, alpha);
  }

  private frame(dt: number, _alpha: number) {
    const ctx = this.scaler.ctx;
    const inside = this.input.mouse.x >= 0;
    const [mx, my] = inside ? this.scaler.toLogical(this.input.mouse.x, this.input.mouse.y) : [-1, -1];
    if (this.input.wasPressed('mute')) {
      this.audio.muted = !this.audio.muted;
      this.audio.applySettings(this.audio.vol);
      saveSettings({ ...this.audio.vol, muted: this.audio.muted });
    }
    this.ui.begin(ctx, this.input, mx, my, dt);
    this.ui.fill(0, 0, SCREEN_W, SCREEN_H, C.ink);
    this.ui.text('CARPET JOINT', SCREEN_W / 2, SCREEN_H / 2 - 10, C.pink, { align: 'center' });
    this.ui.text('rebuilding: Milestone 0', SCREEN_W / 2, SCREEN_H / 2 + 4, C.steel, { align: 'center' });
    this.ui.end();
    this.scaler.present();
    this.audio.update();
    this.input.endFrame();
  }
}
