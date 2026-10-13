// Settings in localStorage (volumes and mute). Reads and writes never throw: a private window or
// blocked storage just means defaults.
export interface Settings { master: number; music: number; sfx: number; muted: boolean }

const KEY = 'pegwork:settings';
const DEFAULTS: Settings = { master: 0.8, music: 0.6, sfx: 0.8, muted: false };

export function loadSettings(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable */
  }
}
