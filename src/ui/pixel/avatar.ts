import type { GameState } from '../../engine/types';
import { getClub } from '../../engine/data';
import { seed32 } from '../format';
import {
  EYE_COLORS,
  HAIR_COLOR_COUNT,
  SHIRT_COLORS,
  SUIT_COLORS,
  TEE_COLORS,
  TIE_COLORS,
  backgroundOf,
  clubKit,
  countryColors,
  darken,
  distributionOf,
  hairTone,
  hexToRgb,
  paler,
  luminance,
  mix,
  pickWeighted,
  skinTone,
  type KitColors,
  type Tone
} from './palette';
import {
  BEARDS,
  BROWS_ADULT,
  BROWS_YOUTH,
  COLLARS,
  EYES_ADULT,
  EYES_YOUTH,
  FACES,
  HAIR_STYLES,
  HAIR_THIN,
  MOUTHS,
  NECK,
  NOSES,
  TORSO_ADULT,
  TORSO_YOUTH,
  WRINKLES,
  type Grid,
  type Point
} from './parts';

export const AVATAR_SIZE = 32;

export type OutfitKind = 'kit' | 'jacket' | 'suit' | 'shirt' | 'tee';
export type Mood = 'neutral' | 'smile' | 'stern';

export interface OutfitSpec {
  kind: OutfitKind;
  kit?: KitColors;
}

export interface LookInput {
  seed: number;
  country: string;
  age: number;
  morale: number;
  outfit: OutfitSpec;
}

export interface Outfit {
  kind: OutfitKind;
  primary: string;
  secondary: string;
  pattern: number;
  collar: number;
  accent: string;
}

export interface AvatarLook {
  seed: number;
  age: number;
  youth: boolean;
  skin: number;
  face: number;
  hairStyle: number;
  hairColor: number;
  thin: number;
  grayRoll: number;
  eye: number;
  brow: number;
  nose: number;
  mood: Mood;
  beard: number;
  accessory: number;
  earSide: number;
  wrinkles: number;
  jaw: boolean;
  outfit: Outfit;
  bgHue: number | null;
}

export const HAIR_STYLE_COUNT = HAIR_STYLES.length;
export const FACE_SHAPE_COUNT = FACES.length - 1;
export const COLLAR_COUNT = 3;
export const PATTERN_COUNT = 4;
export const BEARD_KINDS = 4;
export const EYE_COLOR_COUNT = EYE_COLORS.length;
export const BROW_KINDS = 2;
export const MOOD_KINDS = 3;
export const ACCESSORY_KINDS = 3;
export const NOSE_KINDS = NOSES.length;
export const SKIN_LEVELS = 6;

const STYLE_WEIGHTS: Record<number, number[]> = {
  0: [20, 10, 16, 14, 0, 1, 4, 5, 9, 16, 0, 5],
  1: [16, 8, 12, 12, 8, 1, 5, 8, 8, 12, 1, 4],
  2: [10, 10, 8, 4, 26, 6, 4, 5, 4, 6, 8, 6],
  3: [12, 16, 8, 0, 16, 12, 2, 3, 3, 4, 14, 14]
};

const BEARD_WEIGHTS = [46, 24, 18, 12];
const ACCESSORY_WEIGHTS = [86, 8, 6];

function rnd(seed: number, i: number): number {
  let x = (seed ^ Math.imul(i + 1, 2654435761)) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 2246822519) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 3266489917) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

function moodOf(morale: number): Mood {
  if (morale >= 68) return 'smile';
  if (morale <= 38) return 'stern';
  return 'neutral';
}

function hueOfHex(hex: string): { h: number; s: number } {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  return { h: (h * 60 + 360) % 360, s };
}

function hueOfKit(kit: KitColors | undefined): number | null {
  if (!kit) return null;
  const a = hueOfHex(kit.primary);
  if (a.s >= 0.3) return a.h;
  const b = hueOfHex(kit.secondary);
  if (b.s >= 0.3) return b.h;
  return null;
}

function resolveOutfit(input: LookInput): Outfit {
  const { seed, outfit } = input;
  if (outfit.kind === 'kit' || outfit.kind === 'jacket') {
    const kit = outfit.kit ?? { primary: '#3a6bd8', secondary: '#f3f3f5', pattern: 0, collar: 0 };
    return {
      kind: outfit.kind,
      primary: kit.primary,
      secondary: kit.secondary,
      pattern: kit.pattern,
      collar: kit.collar,
      accent: TIE_COLORS[0]
    };
  }
  const tie = TIE_COLORS[Math.floor(rnd(seed, 14) * TIE_COLORS.length)];
  if (outfit.kind === 'suit') {
    const suit = SUIT_COLORS[Math.floor(rnd(seed, 15) * SUIT_COLORS.length)];
    return { kind: 'suit', primary: suit, secondary: '#f2f3f6', pattern: 0, collar: 0, accent: tie };
  }
  if (outfit.kind === 'shirt') {
    const shirt = SHIRT_COLORS[Math.floor(rnd(seed, 15) * SHIRT_COLORS.length)];
    return { kind: 'shirt', primary: shirt, secondary: paler(shirt, 0.4), pattern: 0, collar: 0, accent: tie };
  }
  const tee = TEE_COLORS[Math.floor(rnd(seed, 15) * TEE_COLORS.length)];
  return { kind: 'tee', primary: tee, secondary: darken(tee, 0.22), pattern: 0, collar: 0, accent: tie };
}

export function thinChance(age: number): number {
  return Math.max(0, Math.min(1, (age - 44) / 16)) * 0.55;
}

export function resolveLook(input: LookInput): AvatarLook {
  const { seed, country, age } = input;
  const dist = distributionOf(country);
  const youth = age < 18;
  const skin = pickWeighted(dist.skin, rnd(seed, 0));
  const face = Math.floor(rnd(seed, 1) * FACE_SHAPE_COUNT);
  const hairColor = Math.min(HAIR_COLOR_COUNT - 1, pickWeighted(dist.hair, rnd(seed, 2)));
  const texture = pickWeighted(dist.texture, rnd(seed, 3));
  let hairStyle = pickWeighted(STYLE_WEIGHTS[texture], rnd(seed, 4));
  const bald = HAIR_STYLES.findIndex((s) => s.id === 'bald');
  const buzz = HAIR_STYLES.findIndex((s) => s.id === 'buzz');
  if (youth && hairStyle === bald) hairStyle = buzz;
  const eye = pickWeighted(dist.eyes, rnd(seed, 5));
  const brow = rnd(seed, 6) < 0.42 ? 1 : 0;
  const nose = Math.floor(rnd(seed, 7) * NOSE_KINDS);
  const beardRaw = pickWeighted(BEARD_WEIGHTS, rnd(seed, 8));
  const beard = age >= 20 ? beardRaw : 0;
  const accessory = pickWeighted(ACCESSORY_WEIGHTS, rnd(seed, 9));
  const thinRoll = rnd(seed, 10);
  const pAny = thinChance(age);
  let thin = 0;
  if (thinRoll < pAny) thin = thinRoll < pAny * 0.38 ? 2 : 1;
  const wrinkleRoll = rnd(seed, 12);
  let wrinkles = 0;
  if (age >= 60) wrinkles = 3;
  else if (age >= 45) wrinkles = 2;
  else if (age >= 30 && wrinkleRoll < 0.6) wrinkles = 1;
  return {
    seed,
    age,
    youth,
    skin,
    face,
    hairStyle,
    hairColor,
    thin,
    grayRoll: rnd(seed, 11),
    eye,
    brow,
    nose,
    mood: moodOf(input.morale),
    beard,
    accessory,
    earSide: rnd(seed, 13) < 0.5 ? 0 : 1,
    wrinkles,
    jaw: age >= 30,
    outfit: resolveOutfit(input),
    bgHue: input.outfit.kind === 'kit' || input.outfit.kind === 'jacket' ? hueOfKit(input.outfit.kit) : null
  };
}

const G_SKIN = 1;
const G_HAIR = 2;
const G_CLOTH = 3;
const G_FREE = 4;

interface Buf {
  col: string[];
  line: string[];
  grp: Uint8Array;
}

const lineCache = new Map<string, string>();

function lineOf(color: string): string {
  let v = lineCache.get(color);
  if (!v) {
    v = darken(color, 0.5);
    lineCache.set(color, v);
  }
  return v;
}

function plot(b: Buf, x: number, y: number, color: string, grp: number, line?: string): void {
  if (x < 0 || x >= AVATAR_SIZE || y < 0 || y >= AVATAR_SIZE) return;
  const i = y * AVATAR_SIZE + x;
  b.col[i] = color;
  b.line[i] = line ?? lineOf(color);
  b.grp[i] = grp;
}

function at(b: Buf, x: number, y: number): number {
  if (x < 0 || x >= AVATAR_SIZE || y < 0 || y >= AVATAR_SIZE) return 255;
  return b.grp[y * AVATAR_SIZE + x];
}

function paint(b: Buf, g: Grid, fn: (ch: string, x: number, y: number) => [string, number, string?] | null): void {
  for (let r = 0; r < g.rows.length; r++) {
    const row = g.rows[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      const x = g.x + c;
      const y = g.y + r;
      const v = fn(ch, x, y);
      if (v) plot(b, x, y, v[0], v[1], v[2]);
    }
  }
}

function gridHas(g: Grid, x: number, y: number): boolean {
  const r = y - g.y;
  const c = x - g.x;
  if (r < 0 || r >= g.rows.length || c < 0 || c >= g.rows[r].length) return false;
  return g.rows[r][c] !== '.';
}

function points(b: Buf, list: readonly Point[], color: string, grp: number, line?: string): void {
  for (const [x, y] of list) plot(b, x, y, color, grp, line);
}

interface Palette {
  p: string;
  P: string;
  q: string;
  Q: string;
  w: string;
  x: string;
  t: string;
  u: string;
  c: string;
  L: string;
}

function outfitPalette(o: Outfit): Palette {
  const p = o.primary;
  const base: Palette = {
    p,
    P: darken(p, 0.2),
    q: o.secondary,
    Q: darken(o.secondary, 0.2),
    w: '#f2f3f6',
    x: darken(p, 0.5),
    t: o.accent,
    u: darken(o.accent, 0.3),
    c: o.secondary,
    L: luminance(p) > 0.62 ? '#2a2f3a' : '#f3f3f5'
  };
  if (o.kind === 'kit') {
    const near = luminance(o.secondary) > 0.62 && luminance(p) > 0.62 ? '#2a2f3a' : o.secondary;
    base.c = near;
  }
  if (o.kind === 'jacket') {
    base.c = darken(p, 0.18);
    base.x = darken(p, 0.55);
  }
  if (o.kind === 'suit') {
    base.x = darken(p, 0.45);
    base.c = '#f2f3f6';
  }
  if (o.kind === 'shirt') {
    base.c = luminance(p) > 0.8 ? darken(p, 0.1) : paler(p, 0.55);
    base.x = darken(p, 0.28);
    base.w = paler(p, 0.7);
  }
  if (o.kind === 'tee') {
    base.c = o.secondary;
  }
  return base;
}

function torsoColor(o: Outfit, pal: Palette, x: number, y: number): string {
  const shade = x >= 26;
  if (o.kind === 'kit') {
    let useQ = false;
    if (o.pattern === 1) useQ = Math.floor((x - 3) / 3) % 2 === 0;
    else if (o.pattern === 2) useQ = y === 28 || y === 29;
    else if (o.pattern === 3) useQ = x <= 6 || x >= 25;
    if (useQ) return shade ? pal.Q : pal.q;
    return shade ? pal.P : pal.p;
  }
  if (o.kind === 'jacket') {
    if (x <= 6 || x >= 25) return shade ? darken(pal.q, 0.2) : pal.q;
    return shade ? pal.P : pal.p;
  }
  return shade ? pal.P : pal.p;
}

function renderBody(b: Buf, look: AvatarLook): void {
  const o = look.outfit;
  const pal = outfitPalette(o);
  const torso = look.youth ? TORSO_YOUTH : TORSO_ADULT;
  paint(b, torso, (_c, x, y) => [torsoColor(o, pal, x, y), G_CLOTH]);
  if (o.kind === 'kit' || o.kind === 'jacket') {
    plot(b, 21, 27, pal.L, G_FREE);
    plot(b, 22, 27, pal.L, G_FREE);
  }
}

function renderNeckAndCollar(b: Buf, look: AvatarLook, skin: Tone): void {
  const o = look.outfit;
  const pal = outfitPalette(o);
  paint(b, NECK, (_c, _x, y) => [y <= 24 ? skin.shadow : skin.base, G_SKIN]);
  let collar: Grid;
  if (o.kind === 'kit') collar = [COLLARS.round, COLLARS.vneck, COLLARS.polo][o.collar % 3];
  else if (o.kind === 'jacket') collar = COLLARS.jacket;
  else if (o.kind === 'suit') collar = COLLARS.suit;
  else if (o.kind === 'shirt') collar = COLLARS.shirt;
  else collar = COLLARS.round;
  paint(b, collar, (ch, _x, y) => {
    if (ch === ':') return [y <= 24 ? skin.shadow : skin.base, G_SKIN];
    if (ch === 'c') return [pal.c, G_CLOTH, darken(pal.c, 0.35)];
    if (ch === 'w') return [pal.w, G_CLOTH, '#9a9ca6'];
    if (ch === 'x') return [pal.x, G_CLOTH];
    if (ch === 't') return [pal.t, G_CLOTH];
    if (ch === 'u') return [pal.u, G_CLOTH];
    return null;
  });
}

function hairColors(look: AvatarLook, skin: Tone): { tone: Tone; z: string } {
  const tone = hairTone(look.hairColor, look.age, look.grayRoll);
  return { tone, z: mix(tone.base, skin.base, 0.55) };
}

function hairChar(ch: string, hc: { tone: Tone; z: string }): string | null {
  if (ch === 'b') return hc.tone.base;
  if (ch === 'h') return hc.tone.high;
  if (ch === 'd') return hc.tone.shadow;
  if (ch === 'z') return hc.z;
  return null;
}

function renderFace(b: Buf, look: AvatarLook, skin: Tone): Grid {
  const part = look.youth ? FACES[FACES.length - 1] : FACES[look.face % FACE_SHAPE_COUNT];
  paint(b, part.face, (ch) => {
    if (ch === 'h') return [skin.high, G_SKIN, skin.line];
    if (ch === 'd' || ch === 'e') return [skin.shadow, G_SKIN, skin.line];
    return [skin.base, G_SKIN, skin.line];
  });
  if (look.jaw) {
    paint(b, part.jaw, (_c, x, y) => {
      const i = y * AVATAR_SIZE + x;
      return b.grp[i] === G_SKIN ? [mix(skin.shadow, skin.line, 0.18), G_SKIN, skin.line] : null;
    });
  }
  return part.face;
}

function renderWrinkles(b: Buf, look: AvatarLook, skin: Tone): void {
  if (look.wrinkles === 0) return;
  const w = WRINKLES[look.wrinkles - 1];
  const color = mix(skin.shadow, skin.line, 0.3);
  for (const [x, y] of w) {
    if (at(b, x, y) === G_SKIN) plot(b, x, y, color, G_SKIN, skin.line);
  }
}

function renderBeard(b: Buf, look: AvatarLook, skin: Tone, hc: { tone: Tone; z: string }): void {
  if (look.beard === 0) return;
  const g = BEARDS[look.beard - 1];
  const beardTone = look.age >= 45 ? hairTone(look.hairColor, look.age + 6, look.grayRoll) : hc.tone;
  const stub = mix(skin.base, beardTone.base, 0.42);
  paint(b, g, (ch, x, y) => {
    if (at(b, x, y) !== G_SKIN) return null;
    if (ch === 'z') return [stub, G_SKIN, skin.line];
    if (ch === 'd') return [beardTone.shadow, G_HAIR, beardTone.line];
    return [beardTone.base, G_HAIR, beardTone.line];
  });
}

function renderFeatures(b: Buf, look: AvatarLook, skin: Tone, hc: { tone: Tone; z: string }): void {
  const brows = look.youth ? BROWS_YOUTH : BROWS_ADULT;
  const browColor = darken(hc.tone.base, 0.12);
  const stern = look.mood === 'stern';
  const list = look.brow === 1 ? (stern ? brows.thickStern : brows.thick) : stern ? brows.thinStern : brows.thin;
  points(b, list, browColor, G_FREE);
  const lash = '#2b1c18';
  const iris = EYE_COLORS[look.eye % EYE_COLORS.length];
  for (const e of look.youth ? EYES_YOUTH : EYES_ADULT) {
    for (let r = 0; r < e.rows.length; r++) {
      for (let c = 0; c < e.rows[r].length; c++) {
        const ch = e.rows[r][c];
        const color = ch === 'k' ? lash : ch === 'w' ? '#f4f2ee' : iris;
        plot(b, e.x + c, e.y + r, color, G_FREE);
      }
    }
  }
  const noseColor = mix(skin.shadow, skin.line, 0.3);
  points(b, NOSES[look.nose % NOSES.length], noseColor, G_FREE);
  const lip = mix(skin.shadow, '#8c2f33', 0.55);
  points(b, MOUTHS[look.mood === 'neutral' ? 'neutral' : look.mood], lip, G_FREE);
}

function renderHair(b: Buf, look: AvatarLook, hc: { tone: Tone; z: string }, back: boolean): void {
  const style = HAIR_STYLES[look.hairStyle % HAIR_STYLES.length];
  const g = back ? style.back : style.front;
  if (!g) return;
  const thin = style.thinnable && !back ? look.thin : 0;
  const mask = thin > 0 ? HAIR_THIN[thin - 1] : null;
  paint(b, g, (ch, x, y) => {
    if (mask && thin === 1 && gridHas(mask, x, y)) return null;
    if (mask && thin === 2 && y <= 8) return null;
    const c = hairChar(ch, hc);
    if (!c) return null;
    return [c, G_HAIR, hc.tone.line];
  });
}

function renderAccessory(b: Buf, look: AvatarLook): void {
  if (look.accessory === 1) {
    const band = look.outfit.kind === 'kit' || look.outfit.kind === 'jacket' ? look.outfit.secondary : '#f2f3f6';
    const color = luminance(band) > 0.92 ? '#e8e9ee' : band;
    for (const y of [8, 9]) {
      let x1 = AVATAR_SIZE;
      let x2 = -1;
      for (let x = 0; x < AVATAR_SIZE; x++) {
        const gz = at(b, x, y);
        if (gz === G_SKIN || gz === G_HAIR) {
          x1 = Math.min(x1, x);
          x2 = Math.max(x2, x);
        }
      }
      for (let x = x1; x <= x2; x++) {
        if (at(b, x, y) !== G_SKIN && at(b, x, y) !== G_HAIR) continue;
        plot(b, x, y, y === 9 ? darken(color, 0.12) : color, G_CLOTH, darken(color, 0.4));
      }
    }
    return;
  }
  if (look.accessory === 2) {
    const lx = look.youth ? 8 : 7;
    const rx = look.youth ? 23 : 24;
    const gold = '#e9c35a';
    if (look.earSide === 0) plot(b, lx, 17, gold, G_FREE);
    else plot(b, rx, 17, gold, G_FREE);
  }
}

function outlinePass(b: Buf): void {
  const out = b.col.slice();
  for (let y = 0; y < AVATAR_SIZE; y++) {
    for (let x = 0; x < AVATAR_SIZE; x++) {
      const i = y * AVATAR_SIZE + x;
      const g = b.grp[i];
      if (g === 0 || g === G_FREE) continue;
      if (at(b, x - 1, y) === 0 || at(b, x + 1, y) === 0 || at(b, x, y - 1) === 0 || at(b, x, y + 1) === 0) out[i] = b.line[i];
    }
  }
  b.col = out;
}

export function renderRgba(look: AvatarLook): Uint8ClampedArray<ArrayBuffer> {
  const skin = skinTone(look.skin);
  const hc = hairColors(look, skin);
  const buf: Buf = { col: new Array<string>(AVATAR_SIZE * AVATAR_SIZE).fill(''), line: new Array<string>(AVATAR_SIZE * AVATAR_SIZE).fill(''), grp: new Uint8Array(AVATAR_SIZE * AVATAR_SIZE) };
  renderBody(buf, look);
  renderHair(buf, look, hc, true);
  renderNeckAndCollar(buf, look, skin);
  renderFace(buf, look, skin);
  renderWrinkles(buf, look, skin);
  renderBeard(buf, look, skin, hc);
  renderFeatures(buf, look, skin, hc);
  renderHair(buf, look, hc, false);
  renderAccessory(buf, look);
  outlinePass(buf);
  const bg = backgroundOf(look.bgHue);
  const out = new Uint8ClampedArray(new ArrayBuffer(AVATAR_SIZE * AVATAR_SIZE * 4));
  for (let y = 0; y < AVATAR_SIZE; y++) {
    const base = y === AVATAR_SIZE - 1 ? bg.band2 : y === AVATAR_SIZE - 2 ? bg.band1 : bg.base;
    const [br, bgc, bb] = hexToRgb(base);
    for (let x = 0; x < AVATAR_SIZE; x++) {
      const i = y * AVATAR_SIZE + x;
      const c = buf.grp[i] === 0 ? null : buf.col[i];
      const [r, g, bl] = c ? hexToRgb(c) : [br, bgc, bb];
      out[i * 4] = r;
      out[i * 4 + 1] = g;
      out[i * 4 + 2] = bl;
      out[i * 4 + 3] = 255;
    }
  }
  return out;
}

let stage: HTMLCanvasElement | null = null;

export function drawAvatar(canvas: HTMLCanvasElement, look: AvatarLook, scale: number): void {
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  const side = Math.max(AVATAR_SIZE, Math.round(AVATAR_SIZE * scale * dpr));
  canvas.width = side;
  canvas.height = side;
  canvas.style.width = `${AVATAR_SIZE * scale}px`;
  canvas.style.height = `${AVATAR_SIZE * scale}px`;
  const g = canvas.getContext('2d');
  if (!g) return;
  if (!stage) {
    stage = document.createElement('canvas');
    stage.width = AVATAR_SIZE;
    stage.height = AVATAR_SIZE;
  }
  const sg = stage.getContext('2d');
  if (!sg) return;
  const data = new ImageData(renderRgba(look), AVATAR_SIZE, AVATAR_SIZE);
  sg.putImageData(data, 0, 0);
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, side, side);
  g.drawImage(stage, 0, 0, side, side);
}

function recentNationalCall(g: GameState): boolean {
  if (g.phase !== 'youth' && g.phase !== 'pro') return false;
  const last = g.nat.matches[g.nat.matches.length - 1];
  return !!last && last.squad && last.w >= g.week - 1;
}

function safeKit(clubId: string): KitColors | null {
  if (!clubId) return null;
  try {
    const club = getClub(clubId);
    return clubKit(clubId, club.color);
  } catch {
    return null;
  }
}

export function outfitForGame(g: GameState): OutfitSpec {
  if (recentNationalCall(g)) return { kind: 'kit', kit: countryColors(g.p.country) };
  if (g.phase === 'youth') {
    const kit = safeKit(g.career.clubId || g.p.startClubId);
    return kit ? { kind: 'kit', kit } : { kind: 'tee' };
  }
  if (g.phase === 'pro') {
    const kit = safeKit(g.career.clubId);
    return kit ? { kind: 'kit', kit } : { kind: 'tee' };
  }
  const role = g.coach.role;
  if (g.phase === 'coach' || (g.phase === 'postcareer' && g.coach.entered && g.post.path === 'none')) {
    if (role === 'national') return { kind: 'suit' };
    if (role === 'none') return { kind: 'tee' };
    const kit = safeKit(g.coach.clubId);
    return kit ? { kind: 'jacket', kit } : { kind: 'tee' };
  }
  if (g.post.path === 'pundit' || g.post.path === 'admin') return { kind: 'suit' };
  if (g.post.path === 'business') return { kind: 'shirt' };
  return { kind: 'tee' };
}

export function lookInputForGame(g: GameState, age: number): LookInput {
  return {
    seed: seed32(g.cfg.seed),
    country: g.p.country,
    age,
    morale: g.st.morale,
    outfit: outfitForGame(g)
  };
}

export function lookForGame(g: GameState, age: number): AvatarLook {
  return resolveLook(lookInputForGame(g, age));
}
