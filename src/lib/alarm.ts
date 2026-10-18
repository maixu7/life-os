// A loud alarm that keeps ringing until you stop it (or snooze it), made
// with the Web Audio API so no sound files are needed. Phones only allow
// sound after the first tap, so the audio is unlocked on the first touch.

export type AlarmTone = "classic" | "siren" | "bell" | "digital" | "rooster";
export const TONES: [AlarmTone, string][] = [
  ["classic", "⏰ Classic beep"], ["digital", "📟 Digital (fast beeps)"], ["siren", "🚨 Siren"], ["bell", "🔔 Bell"], ["rooster", "🐓 Rising wake-up"],
];
export type AlarmPrefs = { tone: AlarmTone; volume: number; maxMin: number; snoozeMin: number; vibrate: boolean; wake?: boolean; bed?: boolean; phase?: boolean };
export const DEFAULT_ALARM: AlarmPrefs = { tone: "classic", volume: 1, maxMin: 5, snoozeMin: 5, vibrate: true, wake: false, bed: false, phase: true };

const KEY = "lifeos-alarm";
export function alarmPrefs(): AlarmPrefs {
  try { return { ...DEFAULT_ALARM, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; } catch { return DEFAULT_ALARM; }
}
export function saveAlarmPrefs(p: Partial<AlarmPrefs>) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...alarmPrefs(), ...p })); } catch {}
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
function audio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    // A compressor lets the alarm be loud without crackling.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -6; comp.ratio.value = 4;
    master = ctx.createGain();
    master.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return { ctx, master: master! };
}

// Call once: the first tap anywhere unlocks sound for later alarms.
export function unlockAudioOnTap() {
  const go = () => {
    try {
      const { ctx: c, master: m } = audio();
      const o = c.createOscillator(), g = c.createGain();
      g.gain.value = 0.0001; o.connect(g).connect(m); o.start(); o.stop(c.currentTime + 0.05);
    } catch {}
  };
  window.addEventListener("pointerdown", go, { once: true, capture: true });
  window.addEventListener("keydown", go, { once: true, capture: true });
}

function note(freq: number, at: number, len: number, type: OscillatorType, vol: number, slideTo?: number) {
  const { ctx: c, master: m } = audio();
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  if (slideTo) o.frequency.linearRampToValueAtTime(slideTo, at + len);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(Math.max(0.001, vol), at + 0.01);
  g.gain.setValueAtTime(Math.max(0.001, vol), at + len * 0.8);
  g.gain.exponentialRampToValueAtTime(0.0001, at + len);
  o.connect(g).connect(m);
  o.start(at); o.stop(at + len + 0.02);
}

// One burst of the tone; returns how long it lasts in seconds.
function burst(tone: AlarmTone, vol: number, round: number): number {
  const { ctx: c } = audio();
  const t = c.currentTime + 0.02;
  // It starts a bit quieter and reaches full volume after a few rounds.
  const v = vol * Math.min(1, 0.55 + round * 0.15);
  switch (tone) {
    case "digital":
      for (let i = 0; i < 4; i++) note(2000, t + i * 0.12, 0.07, "square", v * 0.5);
      return 0.9;
    case "siren":
      note(650, t, 0.6, "sawtooth", v * 0.45, 1300); note(1300, t + 0.6, 0.6, "sawtooth", v * 0.45, 650);
      return 1.25;
    case "bell":
      [880, 1320, 1760].forEach((f, i) => note(f, t, 1.1, "sine", v * (0.9 - i * 0.25)));
      note(880, t + 0.55, 0.9, "triangle", v * 0.6);
      return 1.5;
    case "rooster":
      note(500 + round * 40, t, 0.5, "square", v * 0.4, 900 + round * 60); note(900, t + 0.55, 0.25, "square", v * 0.4);
      return 1.1;
    default: // classic: two loud beeps
      note(1000, t, 0.18, "square", v * 0.5); note(1000, t + 0.25, 0.18, "square", v * 0.5); note(1250, t + 0.5, 0.25, "square", v * 0.5);
      return 1.05;
  }
}

let ringing: { stop: () => void } | null = null;
export const isRinging = () => !!ringing;

// Rings until stop() is called or maxMin minutes pass. rounds limits short alerts.
export function ring(opts: Partial<AlarmPrefs> & { rounds?: number } = {}): () => void {
  stopRing();
  const p = { ...alarmPrefs(), ...opts };
  // Alarms ring even when game sounds are off: that switch is for chimes.
  let alive = true, round = 0, timer: ReturnType<typeof setTimeout> | undefined;
  const until = Date.now() + p.maxMin * 60_000;
  const loop = () => {
    if (!alive) return;
    if (Date.now() > until || (opts.rounds && round >= opts.rounds)) { stop(); return; }
    let len = 1;
    try { len = burst(p.tone, p.volume, round); } catch {}
    if (p.vibrate) try { navigator.vibrate?.([400, 150, 400]); } catch {}
    round++;
    timer = setTimeout(loop, (len + 0.35) * 1000);
  };
  const stop = () => {
    alive = false;
    if (timer) clearTimeout(timer);
    try { navigator.vibrate?.(0); } catch {}
    if (ringing?.stop === stop) ringing = null;
  };
  ringing = { stop };
  loop();
  return stop;
}
export function stopRing() { ringing?.stop(); ringing = null; }

// The alarm screen listens for these events, so any part of the app can ring.
export type AlarmEvent = { title: string; body?: string; icon?: string; rounds?: number; onDone?: () => void };
export function fireAlarm(e: AlarmEvent) {
  window.dispatchEvent(new CustomEvent<AlarmEvent>("lifeos-alarm", { detail: e }));
}
