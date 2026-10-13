// The 384x216 logical screen and the whole-number scaler (DESIGN.md §1, STYLE.md).
// Everything draws into a 384x216 buffer; each frame the buffer is copied to the display canvas
// at the largest whole-number scale that fits the window, letterboxed, with smoothing off.

export const SCREEN_W = 384;
export const SCREEN_H = 216;

/** The largest whole-number scale at which a w x h screen fits a window of device pixels. */
export function fitScale(winW: number, winH: number): number {
  return Math.max(1, Math.floor(Math.min(winW / SCREEN_W, winH / SCREEN_H)));
}

export class Scaler {
  readonly buffer: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  private out: CanvasRenderingContext2D;
  /** device pixels per logical pixel */
  k = 1;
  dpr = 1;

  constructor(private canvas: HTMLCanvasElement) {
    this.buffer = document.createElement('canvas');
    this.buffer.width = SCREEN_W;
    this.buffer.height = SCREEN_H;
    this.ctx = this.buffer.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
    this.out = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.dpr = window.devicePixelRatio || 1;
    const winW = Math.floor(window.innerWidth * this.dpr), winH = Math.floor(window.innerHeight * this.dpr);
    this.k = fitScale(winW, winH);
    const w = SCREEN_W * this.k, h = SCREEN_H * this.k;
    this.canvas.width = w;
    this.canvas.height = h;
    // letterbox: centered on whole device pixels
    this.canvas.style.width = `${w / this.dpr}px`;
    this.canvas.style.height = `${h / this.dpr}px`;
    this.canvas.style.left = `${Math.floor((winW - w) / 2) / this.dpr}px`;
    this.canvas.style.top = `${Math.floor((winH - h) / 2) / this.dpr}px`;
  }

  /** The mouse (CSS px within the canvas) in logical pixels. */
  toLogical(cssX: number, cssY: number): [number, number] {
    return [Math.floor((cssX * this.dpr) / this.k), Math.floor((cssY * this.dpr) / this.k)];
  }

  present() {
    this.out.imageSmoothingEnabled = false;
    this.out.drawImage(this.buffer, 0, 0, SCREEN_W * this.k, SCREEN_H * this.k);
  }
}
