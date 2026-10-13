// The app: the scaler, the loop, input, sound, and the current screen (Milestone 0: the debug
// floor). The sim ticks at a fixed 60 Hz; frames interpolate the crowd with the loop's alpha.
import { GameLoop } from '../engine/loop';
import { Input } from '../engine/input';
import { Audio } from '../engine/audio/audio';
import { UI } from '../ui/ui';
import { definePlaceholders } from '../render/placeholders';
import { loadSheets } from '../render/sheets';
import { resetSprites } from '../render/atlas';
import { Scaler } from './screen';
import { FloorScreen } from './floorScreen';
import { loadSettings, saveSettings } from './settings';

export class App {
  scaler: Scaler;
  input = new Input();
  ui = new UI();
  audio: Audio;
  loop: GameLoop;
  screen: FloorScreen;
  /** e2e: draw every frame at this alpha instead of the loop's (set by renderNow) */
  fixedAlpha: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.scaler = new Scaler(canvas);
    this.input.attach(canvas);
    const settings = loadSettings();
    this.audio = new Audio(settings);
    this.audio.muted = settings.muted;
    definePlaceholders();
    loadSheets().then(() => resetSprites());
    this.ui.sfx = (id) => this.audio.sfx(id);
    const unlock = () => this.audio.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    this.loop = new GameLoop(() => this.screen.tick(), (dt, alpha) => this.frame(dt, alpha));
    this.screen = new FloorScreen(1, this.loop);
    this.screen.sfx = (id, v, p) => this.audio.sfx(id, v, p);
    this.loop.start();
    (window as any).__app = this;
  }

  /** e2e: draw one frame now at a fixed alpha (and keep drawing at it). */
  renderNow(alpha: number) {
    this.fixedAlpha = alpha;
    this.frame(0, alpha);
  }

  private frame(dt: number, alpha: number) {
    if (this.fixedAlpha !== null) alpha = this.fixedAlpha;
    const ctx = this.scaler.ctx;
    const inside = this.input.mouse.x >= 0;
    const [mx, my] = inside ? this.scaler.toLogical(this.input.mouse.x, this.input.mouse.y) : [-1, -1];
    if (this.input.wasPressed('mute')) {
      this.audio.muted = !this.audio.muted;
      this.audio.applySettings(this.audio.vol);
      saveSettings({ ...this.audio.vol, muted: this.audio.muted });
    }
    this.ui.begin(ctx, this.input, mx, my, dt);
    this.screen.frame(ctx, this.ui, this.input, alpha);
    this.ui.end();
    this.scaler.present();
    this.audio.update();
    this.input.endFrame();
  }
}
