import { LEVEL_SCORE_WEIGHT } from '../data/countries';
import { clamp } from './rng';
import type { GameState, SeasonRec } from './types';

export function calcSeasonScore(s: GameState, cur: SeasonRec, games: number): number {
  const lvl = cur.lvl >= 2 ? cur.lvl : 2;
  const w = LEVEL_SCORE_WEIGHT[lvl] ?? 2;
  const ratio = clamp(cur.mins / Math.max(1, games * 90), 0, 1);
  const avg = cur.ratingN ? cur.ratingSum / cur.ratingN : 6;
  const adj = 0.7 + 0.6 * clamp((avg - 5.5) / 2, 0, 1);
  let pts = w * ratio * adj * 3;
  for (const t of cur.trophies) pts += t.includes('우승') ? (t.includes('월드컵') ? 60 : w * 1.6) : w;
  for (const a of cur.awards) pts += a.includes('발롱도르') ? 120 : w * 1.2;
  pts += cur.intApps * 0.8 + cur.intGoals * 0.8;
  return Math.round(pts * 10) / 10;
}

export type Grade = '전설' | 'S' | 'A' | 'B' | 'C' | 'D' | '프로 데뷔 실패';

export function percentileOf(score: number, dist: number[]): number {
  if (!dist.length) return 50;
  let below = 0;
  for (const d of dist) if (d < score) below++;
  return (below / dist.length) * 100;
}

export function gradeFromPercentile(p: number): Grade {
  if (p >= 99) return '전설';
  if (p >= 90) return 'S';
  if (p >= 70) return 'A';
  if (p >= 40) return 'B';
  if (p >= 15) return 'C';
  return 'D';
}

export function coachGrade(peakFame: number): string {
  if (peakFame >= 85) return '명장';
  if (peakFame >= 68) return 'S';
  if (peakFame >= 50) return 'A';
  if (peakFame >= 32) return 'B';
  if (peakFame >= 16) return 'C';
  return 'D';
}

export function playerGrade(s: GameState, dist: number[]): { grade: Grade; percentile: number } {
  if (!s.career.debuted) return { grade: '프로 데뷔 실패', percentile: 0 };
  const p = percentileOf(s.score, dist);
  return { grade: gradeFromPercentile(p), percentile: p };
}
