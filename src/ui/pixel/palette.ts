export type Rgb = [number, number, number];

export interface Tone {
  base: string;
  shadow: string;
  high: string;
  line: string;
}

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function rgbToHex(c: Rgb): string {
  return '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

export function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return rgbToHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}

export function darken(c: string, t: number): string {
  return mix(c, '#0b0710', t);
}

export function paler(c: string, t: number): string {
  return mix(c, '#ffffff', t);
}

export function hsl(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360;
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + hh / 30) % 12;
    return (l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255;
  };
  return rgbToHex([f(0), f(8), f(4)]);
}

export function luminance(c: string): number {
  const [r, g, b] = hexToRgb(c);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function readableOn(bg: string): string {
  return luminance(bg) > 0.62 ? '#14161d' : '#ffffff';
}

const SKIN_BASES = ['#f6d6c0', '#eebd98', '#d49c6e', '#b57a4d', '#8a5638', '#5f3b2b'];

export function skinTone(level: number): Tone {
  const base = SKIN_BASES[Math.max(0, Math.min(5, level))];
  const deep = level >= 4;
  return {
    base,
    shadow: mix(base, '#6a2f2a', deep ? 0.3 : 0.22),
    high: paler(base, deep ? 0.2 : 0.24),
    line: mix(base, '#1d0d0c', 0.62)
  };
}

const HAIR_BASES = ['#1d1b20', '#3a2518', '#5e3d24', '#86592f', '#c9a25a', '#e3cd8e', '#a84f21'];

export const HAIR_COLOR_COUNT = HAIR_BASES.length;

export function hairTone(index: number, age: number, grayRoll: number): Tone {
  const base = HAIR_BASES[Math.max(0, Math.min(HAIR_BASES.length - 1, index))];
  const gray = '#a6a8b0';
  const white = '#e2e4ea';
  let b = base;
  let hi = paler(base, index === 0 ? 0.2 : 0.24);
  if (index === 0) hi = '#4c4a56';
  if (age >= 45) {
    hi = mix(hi, gray, 0.8);
  }
  if (age >= 52 && grayRoll < 0.8) {
    b = mix(base, gray, Math.min(0.85, (age - 50) * 0.04));
    hi = mix(hi, white, 0.55);
  }
  if (age >= 60) {
    b = mix(base, gray, 0.55 + Math.min(0.4, (age - 60) * 0.04));
    hi = mix(white, gray, 0.2);
  }
  if (age >= 68 && grayRoll < 0.6) {
    b = mix(gray, white, 0.55);
    hi = '#f1f2f6';
  }
  return { base: b, shadow: darken(b, 0.3), high: hi, line: darken(b, 0.62) };
}

export const EYE_COLORS = ['#2b1a12', '#7a5230', '#4b6f93'];

export type Group = 'EA' | 'SEA' | 'SA' | 'MENA' | 'SSA' | 'EAF' | 'EURN' | 'EURS' | 'LATAM' | 'AMER';

const GROUP_OF: Record<string, Group> = {
  KR: 'EA', JP: 'EA', CN: 'EA',
  VN: 'SEA', ID: 'SEA', PH: 'SEA',
  IN: 'SA', PK: 'SA', BD: 'SA',
  EG: 'MENA', MA: 'MENA', SA: 'MENA', IR: 'MENA', TR: 'MENA',
  NG: 'SSA', CD: 'SSA', GH: 'SSA', SN: 'SSA', KE: 'SSA',
  ET: 'EAF',
  GB: 'EURN', DE: 'EURN', NL: 'EURN',
  FR: 'EURS', IT: 'EURS', ES: 'EURS', PT: 'EURS', HR: 'EURS',
  BR: 'AMER', CO: 'LATAM', MX: 'LATAM', AR: 'LATAM', UY: 'LATAM',
  US: 'AMER'
};

export interface Distribution {
  skin: number[];
  hair: number[];
  texture: number[];
  eyes: number[];
}

const DIST: Record<Group, Distribution> = {
  EA: { skin: [28, 46, 22, 4, 0, 0], hair: [88, 10, 2, 0, 0, 0, 0], texture: [90, 8, 2, 0], eyes: [78, 22, 0] },
  SEA: { skin: [6, 30, 44, 18, 2, 0], hair: [84, 13, 3, 0, 0, 0, 0], texture: [75, 18, 6, 1], eyes: [82, 18, 0] },
  SA: { skin: [0, 6, 28, 40, 22, 4], hair: [82, 15, 3, 0, 0, 0, 0], texture: [50, 38, 11, 1], eyes: [70, 28, 2] },
  MENA: { skin: [4, 22, 40, 24, 8, 2], hair: [60, 30, 8, 2, 0, 0, 0], texture: [28, 50, 21, 1], eyes: [50, 38, 12] },
  SSA: { skin: [0, 0, 2, 14, 40, 44], hair: [96, 4, 0, 0, 0, 0, 0], texture: [0, 2, 24, 74], eyes: [88, 12, 0] },
  EAF: { skin: [0, 2, 14, 34, 34, 16], hair: [92, 8, 0, 0, 0, 0, 0], texture: [0, 6, 40, 54], eyes: [86, 14, 0] },
  EURN: { skin: [34, 40, 18, 5, 2, 1], hair: [14, 24, 22, 8, 16, 12, 4], texture: [48, 38, 13, 1], eyes: [26, 24, 50] },
  EURS: { skin: [20, 42, 28, 8, 2, 0], hair: [22, 34, 24, 10, 6, 2, 2], texture: [42, 42, 15, 1], eyes: [44, 32, 24] },
  LATAM: { skin: [10, 26, 34, 20, 8, 2], hair: [38, 34, 18, 6, 2, 1, 1], texture: [38, 36, 22, 4], eyes: [62, 28, 10] },
  AMER: { skin: [16, 22, 24, 18, 14, 6], hair: [34, 28, 18, 8, 6, 3, 3], texture: [34, 30, 20, 16], eyes: [52, 30, 18] }
};

export function distributionOf(country: string): Distribution {
  return DIST[GROUP_OF[country] ?? 'AMER'];
}

export function pickWeighted(weights: readonly number[], roll: number): number {
  let sum = 0;
  for (const w of weights) sum += w;
  let acc = 0;
  const target = roll * sum;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (target < acc) return i;
  }
  return weights.length - 1;
}

export interface KitColors {
  primary: string;
  secondary: string;
  pattern: number;
  collar: number;
}

type NationalRow = [string, string, number, number, string];

const NATIONAL: Record<string, NationalRow> = {
  KR: ['#c8102e', '#f3f3f5', 0, 0, 'KOR'],
  JP: ['#1f3f9e', '#f3f3f5', 0, 1, 'JPN'],
  CN: ['#d4202a', '#f6c800', 0, 1, 'CHN'],
  VN: ['#d3202c', '#f6d000', 0, 1, 'VNM'],
  ID: ['#d0112b', '#f3f3f5', 0, 0, 'IDN'],
  PH: ['#1c4aa6', '#d1202f', 3, 0, 'PHL'],
  IN: ['#1b62c4', '#f08a1c', 3, 2, 'IND'],
  PK: ['#0c6d3b', '#f3f3f5', 0, 2, 'PAK'],
  BD: ['#0a7a54', '#d1202f', 3, 1, 'BGD'],
  EG: ['#c8102e', '#14161d', 3, 0, 'EGY'],
  MA: ['#c1272d', '#0b6b3d', 3, 1, 'MAR'],
  SA: ['#0b7a42', '#f3f3f5', 0, 1, 'SAU'],
  IR: ['#f3f3f5', '#c8102e', 3, 0, 'IRN'],
  TR: ['#e30a17', '#f3f3f5', 2, 1, 'TUR'],
  NG: ['#0f9b45', '#f3f3f5', 3, 1, 'NGA'],
  CD: ['#1ea0e0', '#f6d000', 3, 1, 'COD'],
  GH: ['#f3f3f5', '#e0262d', 3, 0, 'GHA'],
  SN: ['#f3f3f5', '#0f9b45', 3, 1, 'SEN'],
  KE: ['#c8102e', '#14161d', 2, 1, 'KEN'],
  ET: ['#0e8f3f', '#f6d000', 2, 0, 'ETH'],
  GB: ['#f3f3f5', '#1c2c5b', 0, 0, 'ENG'],
  DE: ['#f3f3f5', '#14161d', 0, 0, 'GER'],
  NL: ['#f36c21', '#14161d', 0, 0, 'NED'],
  FR: ['#1f3f8f', '#d1202f', 0, 0, 'FRA'],
  IT: ['#1b64c8', '#f3f3f5', 0, 1, 'ITA'],
  ES: ['#c60b1e', '#ffc400', 0, 1, 'ESP'],
  PT: ['#a8112c', '#0b7a2c', 0, 1, 'POR'],
  HR: ['#f3f3f5', '#d1202f', 1, 0, 'CRO'],
  BR: ['#f6d000', '#0b9a3c', 0, 1, 'BRA'],
  CO: ['#fcd116', '#1c3e96', 0, 0, 'COL'],
  MX: ['#0b7a4a', '#d1202f', 0, 1, 'MEX'],
  AR: ['#78acdc', '#f3f3f5', 1, 0, 'ARG'],
  UY: ['#5aa6e0', '#14161d', 0, 1, 'URU'],
  US: ['#1c2c5b', '#c82a3a', 2, 0, 'USA']
};

export function countryColors(code: string): KitColors {
  const row = NATIONAL[code];
  if (row) return { primary: row[0], secondary: row[1], pattern: row[2], collar: row[3] };
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0;
  return { primary: hsl(h % 360, 62, 46), secondary: '#f3f3f5', pattern: 0, collar: 0 };
}

export function countryCode3(code: string): string {
  const row = NATIONAL[code];
  return row ? row[4] : code;
}

export function hashString32(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function clubKit(clubId: string, hue: number): KitColors {
  const h = hashString32(clubId);
  const primary = hsl(hue, 66, 46);
  const options = ['#f3f3f5', '#161922', hsl(hue + 180, 58, 52), hsl(hue + 35, 70, 62), '#f3f3f5'];
  let secondary = options[h % options.length];
  if (luminance(primary) > 0.62 && secondary === '#f3f3f5') secondary = '#161922';
  return { primary, secondary, pattern: (h >>> 3) % 4, collar: (h >>> 6) % 3 };
}

export const SUIT_COLORS = ['#1f2937', '#2a2f3d', '#15171d', '#3a3f4b'];
export const SHIRT_COLORS = ['#f2f3f6', '#cfe0f2', '#e9e2d3', '#d6dbe3'];
export const TEE_COLORS = ['#8795a8', '#6f8f86', '#9a8f7c', '#7c88a8', '#a28080', '#6e7a89'];
export const TIE_COLORS = ['#b3262f', '#243f8c', '#1f6f4a', '#7a2f8a', '#c98b1a', '#2d3340'];

export function backgroundOf(hue: number | null): { base: string; band1: string; band2: string } {
  const base = hue === null ? '#d5d8de' : hsl(hue, 30, 86);
  return { base, band1: darken(base, 0.1), band2: darken(base, 0.2) };
}
