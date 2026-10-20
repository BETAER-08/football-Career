import { Rng, clamp } from './rng';
import { addLog } from './log';
import { ageAt } from './time';
import { getCountry } from './data';
import { endGame } from './lifecycle';
import { initCoach } from './coach';
import { buildDecision, getEvent, markFired, pushDecision } from './events';
import type { GameState } from './types';

export type PathId = 'coach' | 'pundit' | 'admin' | 'business' | 'left';

export function adminWage(s: GameState): number {
  const base = s.post.adminRole === 'gm' ? 26000 : s.post.adminRole === 'td' ? 11000 : 4500;
  return Math.round(base * (0.5 + getCountry(s.p.country).econ) * (1 + s.post.rep / 120));
}

export const EPI_PATHS = ['pundit', 'admin', 'business'] as const;
export type EpiPath = (typeof EPI_PATHS)[number];

export const MILESTONES: Record<EpiPath, string[]> = {
  pundit: ['지역 방송 고정 출연', '전국 방송 해설위원', '대륙 대회 결승 중계', '월드컵 메인 해설'],
  admin: ['스카우트', '테크니컬 디렉터', '단장', '협회 임원 · 해외 구단 단장'],
  business: ['축구 교실 개업', '지점 확장', '유소년 아카데미 설립', '하부리그 구단 지분 인수']
};

const ADMIN_ROLE: ('' | 'scout' | 'td' | 'gm')[] = ['', 'scout', 'td', 'gm', 'gm'];
const PUNDIT_MULT = [0.4, 1, 1.5, 2.2, 3.4];

export function isEpiPath(p: string): p is EpiPath {
  return (EPI_PATHS as readonly string[]).includes(p);
}

export function msOf(s: GameState, path: string): number {
  return s.post.ms[path] ?? 0;
}

export function applyMilestones(s: GameState): void {
  const p = s.post;
  if (p.path === 'admin') {
    p.adminRole = ADMIN_ROLE[Math.min(4, msOf(s, 'admin'))];
    p.income = adminWage(s);
  } else if (p.path === 'pundit') {
    p.income = punditIncome(s);
  }
}

export function punditIncome(s: GameState): number {
  const p = s.post;
  return Math.round((800 + p.rep * 90 + p.skill * 20) * (0.5 + getCountry(s.p.country).econ) * PUNDIT_MULT[Math.min(4, msOf(s, 'pundit'))]);
}

export function advanceMilestone(s: GameState): string {
  const path = s.post.path;
  if (!isEpiPath(path)) return '';
  const n = msOf(s, path);
  if (n >= 4) return '';
  s.post.ms[path] = n + 1;
  s.post.msWeek[path] = s.week;
  applyMilestones(s);
  return MILESTONES[path][n];
}

export function setPath(s: GameState, rng: Rng, path: PathId): void {
  if (path === 'left') {
    endGame(s, '축구계를 떠나 새로운 삶을 시작했다.');
    return;
  }
  if (path === 'coach') {
    if (s.phase === 'coach') return;
    initCoach(s, rng);
    s.phase = 'coach';
    s.focus = 'tactics';
    s.post.path = 'none';
    s.post.income = 0;
    return;
  }
  s.phase = 'postcareer';
  s.post.path = path;
  s.post.enteredW = s.week;
  s.post.skill = Math.max(s.post.skill, 12);
  if (path === 'pundit') {
    s.focus = 'media';
    addLog(s, 'milestone', '해설·방송', '방송국에서 객원 해설로 첫발을 뗐다. 고정 자리는 아직 멀다.', [], { star: true });
  } else if (path === 'admin') {
    s.focus = 'study';
    addLog(s, 'milestone', '구단 행정', '구단 행정 견습으로 출근을 시작했다. 정식 직함은 아직이다.', [], { star: true });
  } else if (path === 'business') {
    const stake = Math.round(Math.max(0, s.fin.cash * 0.5 + s.fin.deposit * 0.3));
    s.fin.cash -= Math.min(s.fin.cash, Math.round(stake * 0.6));
    s.fin.deposit = Math.max(0, s.fin.deposit - Math.round(stake * 0.4));
    s.fin.business += stake;
    s.post.income = 0;
    s.focus = 'business';
    addLog(s, 'milestone', '사업', `사업에 뛰어들었다. 초기 자본 ${stake.toLocaleString('ko-KR')}만원.`, [], { star: true });
  }
  applyMilestones(s);
}

export function epilogueDone(s: GameState): boolean {
  const path = s.post.path;
  return isEpiPath(path) && msOf(s, path) >= 4;
}

export function postWeekly(s: GameState, rng: Rng): void {
  const age = ageAt(s.p.birth, s.week);
  if (age >= 75) {
    endGame(s, '75세에 이르렀다. 긴 축구 인생이 막을 내린다.');
    return;
  }
  const p = s.post;
  if (isEpiPath(p.path)) p.epiWeeks += 1;
  if (p.path === 'pundit') {
    p.skill = clamp(p.skill + 0.03, 0, 100);
    p.rep = clamp(p.rep + 0.02 + (s.focus === 'media' ? 0.04 : 0), 0, 100);
    p.income = punditIncome(s);
  } else if (p.path === 'admin') {
    p.skill = clamp(p.skill + 0.04 + (s.focus === 'study' ? 0.04 : 0), 0, 100);
    p.rep = clamp(p.rep + 0.015 + (s.focus === 'network' ? 0.04 : 0), 0, 100);
    p.income = adminWage(s);
  } else if (p.path === 'business') {
    p.skill = clamp(p.skill + 0.02 + (s.focus === 'business' ? 0.04 : 0), 0, 100);
    const r = rng.normal(0.0009 + p.skill / 200000 + msOf(s, 'business') * 0.0002, 0.012);
    s.fin.business = Math.max(0, Math.round(s.fin.business * (1 + r)));
    s.fin.cash += s.fin.business * 0.0006;
  }
  if (isEpiPath(p.path) && !s.decision && !s.decQueue.length) {
    const due = p.lastAsk < 0 ? epilogueDone(s) || p.epiWeeks >= 520 : s.week - p.lastAsk >= 260;
    if (due) {
      p.lastAsk = s.week;
      const def = getEvent('epi_wrap');
      markFired(s, def);
      s.decCtx = {};
      pushDecision(s, buildDecision(s, rng, def));
    }
  }
}
