// Web Audio: the master, music and SFX buses, the jsfxr bank (src/engine/audio/sfxr.ts) and a few
// synthesized placeholder sounds. Carpet Joint's real sound pass is Milestone 7; until then the floor
// gets a tick on brass, a knock on wood and a clunk in a tin cup.
import { playSfxr } from './sfxr';
import { Music } from './music';

export interface Vol { master: number; music: number; sfx: number }

type Env = { a: number; d: number; s?: number; r?: number };

/** the music bus's level at full music volume, under the sound effects */
const MUSIC_LEVEL = 0.24;

export class Audio {
  ctx: AudioContext | null = null;
  master!: GainNode;
  musicBus!: GainNode;
  sfxBus!: GainNode;
  music: Music | null = null;
  vol: Vol;
  muted = false;
  private lastSfx = new Map<string, number>();

  constructor(settings: Vol) {
    this.vol = { ...settings };
  }

  /** Browsers allow sound only after a user gesture: call this from the first click or key. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      const ctx: AudioContext = new AC();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.connect(ctx.destination);
      this.musicBus = ctx.createGain();
      this.sfxBus = ctx.createGain();
      this.musicBus.connect(this.master);
      this.sfxBus.connect(this.master);
      this.applyVol();
      this.music = new Music(ctx, this.musicBus);
      this.music.start(0, ctx.currentTime + 0.3);
    } catch {
      this.ctx = null;
      this.music = null;
    }
  }

  applySettings(s: Vol) {
    this.vol = { ...s };
    this.applyVol();
  }

  private applyVol() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.muted ? 0 : this.vol.master, t, 0.05);
    this.musicBus.gain.setTargetAtTime(this.vol.music * MUSIC_LEVEL, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(this.vol.sfx * 0.7, t, 0.05);
  }

  update() {
    if (this.ctx && this.music) this.music.update(this.ctx.currentTime);
  }

  private tone(freq: number, type: OscillatorType, env: Env, vol: number, t0 = 0, slide = 0) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + t0;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + env.a + env.d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + env.a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol * (env.s ?? 0.001)), t + env.a + env.d);
    if (env.r) g.gain.exponentialRampToValueAtTime(0.0001, t + env.a + env.d + env.r);
    o.connect(g);
    g.connect(this.sfxBus);
    o.start(t);
    o.stop(t + env.a + env.d + (env.r ?? 0) + 0.05);
  }

  /** Play a named sound. `v` scales volume; `pitch` multiplies the pitch. */
  sfx(id: string, v = 1, pitch = 1) {
    const ctx = this.ctx;
    if (!ctx || v <= 0.02) return;
    const now = ctx.currentTime;
    if (now - (this.lastSfx.get(id) ?? 0) < 0.03) return;
    this.lastSfx.set(id, now);
    if (playSfxr(ctx, this.sfxBus, id, 0.35 * v, pitch)) return;
    switch (id) {
      case 'click': this.tone(900, 'square', { a: 0.002, d: 0.04 }, 0.05 * v); break;
      // chips on felt: a short soft tick
      case 'chip': this.tone(1800 * pitch, 'triangle', { a: 0.001, d: 0.03 }, 0.035 * v); break;
      // a win paid: two bright notes
      case 'win': this.tone(660 * pitch, 'square', { a: 0.002, d: 0.06 }, 0.04 * v); this.tone(990 * pitch, 'square', { a: 0.002, d: 0.08 }, 0.035 * v, 0.06); break;
      // the cage drawer: a low clunk
      case 'cage': this.tone(160 * pitch, 'square', { a: 0.002, d: 0.1 }, 0.06 * v, 0, 0.6); break;
    }
  }
}
