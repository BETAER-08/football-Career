let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicTimer: number | null = null;
let musicOn = false;

function ensure(): AudioContext | null {
  try {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function blip(freq = 660, dur = 0.12, type: OscillatorType = 'square', vol = 0.12): void {
  const c = ensure();
  if (!c || !master) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.connect(g);
  g.connect(master);
  o.start();
  o.stop(c.currentTime + dur + 0.02);
}

export function reelStop(i: number): void {
  const base = [520, 660, 820][i] ?? 600;
  blip(base, 0.09, 'square', 0.14);
  setTimeout(() => blip(base * 1.5, 0.12, 'triangle', 0.1), 70);
}

export function tick(speed: number): void {
  blip(900 + speed * 500, 0.025, 'square', 0.035);
}

export function click(): void {
  blip(900, 0.04, 'square', 0.05);
}

export function chime(): void {
  blip(784, 0.15, 'triangle', 0.1);
  setTimeout(() => blip(1046, 0.2, 'triangle', 0.1), 110);
}

const SCALE = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];

function pad(freq: number, t0: number, dur: number): void {
  const c = ctx;
  if (!c || !master) return;
  const o = c.createOscillator();
  const o2 = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o2.type = 'triangle';
  o.frequency.value = freq;
  o2.frequency.value = freq * 1.002;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(0.05, t0 + dur * 0.4);
  g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  o2.connect(g);
  g.connect(master);
  o.start(t0);
  o2.start(t0);
  o.stop(t0 + dur + 0.1);
  o2.stop(t0 + dur + 0.1);
}

let step = 0;
function bar(): void {
  const c = ctx;
  if (!c) return;
  const t = c.currentTime + 0.05;
  const chords = [[0, 2, 4], [5, 0, 2], [3, 5, 0], [4, 6, 1]];
  const chord = chords[step % chords.length];
  chord.forEach((n, i) => pad(SCALE[n % SCALE.length] / (i === 0 ? 2 : 1), t + i * 0.12, 5.4));
  const m = SCALE[(step * 3 + 2) % SCALE.length] * 2;
  pad(m, t + 1.6, 1.8);
  pad(SCALE[(step * 5 + 1) % SCALE.length] * 2, t + 3.2, 1.8);
  step++;
}

export function setMusic(on: boolean): void {
  musicOn = on;
  if (on) {
    if (!ensure()) return;
    if (musicTimer === null) {
      bar();
      musicTimer = window.setInterval(bar, 5600);
    }
  } else if (musicTimer !== null) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
}

export function isMusicOn(): boolean {
  return musicOn;
}

export function sfx(kind: string): void {
  if (kind === 'goal') {
    for (let i = 0; i < 7; i++) setTimeout(() => blip(180 + Math.random() * 260, 0.22, 'sawtooth', 0.045), i * 45);
    setTimeout(() => blip(523, 0.18, 'triangle', 0.08), 40);
  } else if (kind === 'trophy') {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, i === 3 ? 0.5 : 0.18, 'square', 0.09), i * 150));
  } else if (kind === 'transfer') {
    blip(880, 0.1, 'triangle', 0.1);
    setTimeout(() => blip(1175, 0.16, 'triangle', 0.1), 120);
  }
}
