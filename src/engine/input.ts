// Keyboard + mouse input with rebindable actions. Edges are latched per frame.
// (Extracted from the shared engine layer; Pegwork's actions below.)

export const ACTIONS = ['left', 'right', 'drop', 'dryRun', 'pause', 'mute', 'debug'] as const;
export type Action = (typeof ACTIONS)[number];

/** Debug keys exist only in dev builds or with ?debug in the address. */
export const DEBUG_KEYS = !!import.meta.env?.DEV || (typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug'));

export const ACTION_LABELS: Record<Action, string> = {
  left: 'Column left', right: 'Column right', drop: 'Drop a marble', dryRun: 'Run the Dry Run',
  pause: 'Pause / close', mute: 'Mute', debug: 'Debug overlay',
};

export const DEFAULT_BINDS: Record<Action, string[]> = {
  left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'], drop: ['Space', 'Enter'], dryRun: ['KeyR'],
  pause: ['Escape'], mute: ['KeyM'], debug: ['Backquote'],
};

export function keyLabel(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  const map: Record<string, string> = {
    ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right', ShiftLeft: 'LShift',
    ShiftRight: 'RShift', ControlLeft: 'LCtrl', Escape: 'Esc', Backquote: '`', Equal: '=', Minus: '-',
    Space: 'Space', Tab: 'Tab', Enter: 'Enter', NumpadAdd: 'Num+', NumpadSubtract: 'Num-', Backspace: 'Bksp',
  };
  return map[code] ?? code;
}

export class Input {
  down = new Set<string>();
  pressed = new Set<string>();
  released = new Set<string>();
  binds: Record<Action, string[]> = structuredClone(DEFAULT_BINDS);
  mouse = { x: 0, y: 0, down: [false, false, false], pressed: [false, false, false], released: [false, false, false], wheel: 0, wheelX: 0, moved: false };
  /** Modifier keys and click count latched when the last button went down (a click is judged by these, not by the keys at draw time). */
  press = { shift: false, ctrl: false, count: 1 };
  /** Typed characters this frame (for text fields). */
  text = '';
  /** When true, actions are suppressed (a text field has focus). */
  textFocus = false;
  /** Set by UI to capture the next key for rebinding. */
  captureKey: ((code: string) => void) | null = null;
  ctrl = false;
  shift = false;

  attach(el: HTMLElement) {
    window.addEventListener('keydown', (e) => {
      if (this.captureKey) {
        e.preventDefault();
        const cb = this.captureKey;
        this.captureKey = null;
        cb(e.code);
        return;
      }
      if (!e.repeat) this.pressed.add(e.code);
      this.down.add(e.code);
      this.ctrl = e.ctrlKey || e.metaKey;
      this.shift = e.shiftKey;
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) this.text += e.key;
      if (e.key === 'Backspace') this.text += '\b';
      if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow') || e.code === 'Backquote') e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      this.down.delete(e.code);
      this.released.add(e.code);
      this.ctrl = e.ctrlKey || e.metaKey;
      this.shift = e.shiftKey;
    });
    window.addEventListener('blur', () => {
      this.down.clear();
      this.shift = this.ctrl = false;
      this.mouse.down = [false, false, false];
    });
    el.addEventListener('mousemove', (e) => {
      this.mouse.x = e.offsetX;
      this.mouse.y = e.offsetY;
      this.mouse.moved = true;
    });
    el.addEventListener('mousedown', (e) => {
      if (e.button > 2) return;
      this.mouse.down[e.button] = true;
      this.mouse.pressed[e.button] = true;
      this.shift = e.shiftKey;
      this.ctrl = e.ctrlKey;
      this.press = { shift: e.shiftKey, ctrl: e.ctrlKey || e.metaKey, count: Math.max(1, e.detail || 1) };
      e.preventDefault();
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button > 2) return;
      this.mouse.down[e.button] = false;
      this.mouse.released[e.button] = true;
    });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('wheel', (e) => {
      this.mouse.wheel += Math.sign(e.deltaY);
      this.mouse.wheelX += Math.sign(e.deltaX);
      e.preventDefault();
    }, { passive: false });
  }

  isDown(a: Action): boolean {
    if (this.textFocus) return false;
    for (const k of this.binds[a]) if (this.down.has(k)) return true;
    return false;
  }

  wasPressed(a: Action): boolean {
    if (this.textFocus && a !== 'pause') return false;
    for (const k of this.binds[a]) if (this.pressed.has(k)) return true;
    return false;
  }

  keyPressed(code: string) {
    return this.pressed.has(code);
  }

  /** Consume an action edge so lower UI layers don't also react. */
  consume(a: Action) {
    for (const k of this.binds[a]) this.pressed.delete(k);
  }

  consumeMouse(button = 0) {
    this.mouse.pressed[button] = false;
    this.mouse.released[button] = false;
  }

  endFrame() {
    this.pressed.clear();
    this.released.clear();
    this.mouse.pressed = [false, false, false];
    this.mouse.released = [false, false, false];
    this.mouse.wheel = 0;
    this.mouse.wheelX = 0;
    this.mouse.moved = false;
    this.text = '';
  }
}
