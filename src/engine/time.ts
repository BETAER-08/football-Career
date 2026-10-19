export const START_YEAR = 2026;
export const WEEKS = 52;

export interface YMD { y: number; m: number; d: number }

export function seasonOf(w: number): number {
  return Math.floor(w / WEEKS);
}
export function swOf(w: number): number {
  return w % WEEKS;
}

const cache: Record<number, number> = {};
function seasonStartMs(s: number): number {
  let v = cache[s];
  if (v === undefined) {
    v = Date.UTC(START_YEAR + s, 6, 1);
    cache[s] = v;
  }
  return v;
}

export function dateOf(w: number): YMD {
  const s = seasonOf(w);
  const dt = new Date(seasonStartMs(s) + swOf(w) * 7 * 86400000);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

export function yearOf(w: number): number {
  return dateOf(w).y;
}

export function ageAt(birthYear: number, w: number): number {
  return yearOf(w) - birthYear;
}

export function seasonLabel(s: number): string {
  const y = START_YEAR + s;
  return `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
}

export function fmtDate(d: YMD): string {
  return `${d.y}.${String(d.m).padStart(2, '0')}.${String(d.d).padStart(2, '0')}`;
}

export function weekOfSeasonDate(sw: number): { m: number } {
  const dt = new Date(Date.UTC(2027, 6, 1) + sw * 7 * 86400000);
  return { m: dt.getUTCMonth() + 1 };
}

export function seasonOfYear(year: number): number {
  return year - START_YEAR;
}

export function weeksForYears(y: number): number {
  return Math.round(y * WEEKS);
}

export function secPerYear(lengthMin: 30 | 60 | 90): number {
  return lengthMin === 30 ? 75 : lengthMin === 60 ? 150 : 225;
}

export function monthOfSw(sw: number): number {
  return weekOfSeasonDate(sw).m;
}

export function isSummerWindow(sw: number): boolean {
  return sw <= 9;
}
export function isWinterWindow(sw: number): boolean {
  return sw >= 26 && sw <= 30;
}
export function isWindow(sw: number): boolean {
  return sw <= 9 || (sw >= 26 && sw <= 30);
}
export function seasonOfSeasonStartYear(y: number): number {
  return y - START_YEAR;
}
