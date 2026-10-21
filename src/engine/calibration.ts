import cal from '../data/calibration.json';

export interface Calibration {
  youthBoost: number;
  injEndScale: number;
  retireScale: number;
  m: Record<string, number>;
}

const current: Calibration = {
  youthBoost: cal.youthBoost,
  injEndScale: cal.injEndScale,
  retireScale: (cal as { retireScale?: number }).retireScale ?? 1,
  m: { ...(cal.m as Record<string, number>) }
};

export function getCal(): Calibration {
  return current;
}

export function setCal(p: Partial<Calibration>): void {
  if (p.youthBoost !== undefined) current.youthBoost = p.youthBoost;
  if (p.injEndScale !== undefined) current.injEndScale = p.injEndScale;
  if (p.retireScale !== undefined) current.retireScale = p.retireScale;
  if (p.m) current.m = { ...p.m };
}

export function mFor(code: string): number {
  const v = current.m[code];
  return v === undefined ? 1 : v;
}

export function setM(code: string, v: number): void {
  current.m[code] = v;
}

export function effM(code: string, ovr: number): number {
  const m = Math.max(mFor(code), 1e-6);
  const e = Math.min(1, Math.max(0, 1 - (ovr - 75) / 15));
  return Math.pow(m, e);
}
