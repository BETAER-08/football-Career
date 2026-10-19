import { Rng, clamp } from './rng';
import { addLog } from './log';
import { ageAt } from './time';
import { getCountry } from './data';
import { endGame } from './lifecycle';
import { initCoach } from './coach';
import type { GameState } from './types';

export type PathId = 'coach' | 'pundit' | 'admin' | 'business' | 'left';

export function adminWage(s: GameState): number {
  const base = s.post.adminRole === 'gm' ? 26000 : s.post.adminRole === 'td' ? 11000 : 4500;
  return Math.round(base * (0.5 + getCountry(s.p.country).econ) * (1 + s.post.rep / 120));
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
    s.post.income = Math.round((800 + s.post.rep * 90) * (0.5 + getCountry(s.p.country).econ));
    s.focus = 'media';
    addLog(s, 'milestone', '해설·방송', '방송국과 해설위원 계약을 맺었다.', [], { star: true });
  } else if (path === 'admin') {
    s.post.adminRole = 'scout';
    s.post.income = adminWage(s);
    s.focus = 'study';
    addLog(s, 'milestone', '구단 행정', '구단 스카우트로 새 출발을 했다.', [], { star: true });
  } else if (path === 'business') {
    const stake = Math.round(Math.max(0, s.fin.cash * 0.5 + s.fin.deposit * 0.3));
    s.fin.cash -= Math.min(s.fin.cash, Math.round(stake * 0.6));
    s.fin.deposit = Math.max(0, s.fin.deposit - Math.round(stake * 0.4));
    s.fin.business += stake;
    s.post.income = 0;
    s.focus = 'business';
    addLog(s, 'milestone', '사업', `사업에 뛰어들었다. 초기 자본 ${stake.toLocaleString('ko-KR')}만원.`, [], { star: true });
  }
}

export function postWeekly(s: GameState, rng: Rng): void {
  const age = ageAt(s.p.birth.y, s.week);
  if (age >= 75) {
    endGame(s, '75세에 이르렀다. 긴 축구 인생이 막을 내린다.');
    return;
  }
  const p = s.post;
  if (p.path === 'pundit') {
    p.skill = clamp(p.skill + 0.03, 0, 100);
    p.rep = clamp(p.rep + 0.02 + (s.focus === 'media' ? 0.04 : 0), 0, 100);
    p.income = Math.round((800 + p.rep * 90 + p.skill * 20) * (0.5 + getCountry(s.p.country).econ));
  } else if (p.path === 'admin') {
    p.skill = clamp(p.skill + 0.04 + (s.focus === 'study' ? 0.04 : 0), 0, 100);
    p.rep = clamp(p.rep + 0.015 + (s.focus === 'network' ? 0.04 : 0), 0, 100);
    const yrs = (s.week - p.enteredW) / 52;
    if (p.adminRole === 'scout' && yrs >= 3 && p.skill >= 40) {
      p.adminRole = 'td';
      addLog(s, 'milestone', '승진', '테크니컬 디렉터로 승진했다.', [], { star: true });
    } else if (p.adminRole === 'td' && yrs >= 8 && p.skill >= 62 && p.rep >= 45) {
      p.adminRole = 'gm';
      addLog(s, 'milestone', '승진', '단장 자리에 올랐다.', [], { star: true });
    }
    p.income = adminWage(s);
  } else if (p.path === 'business') {
    p.skill = clamp(p.skill + 0.02 + (s.focus === 'business' ? 0.04 : 0), 0, 100);
    const r = rng.normal(0.0009 + p.skill / 200000, 0.012);
    s.fin.business = Math.max(0, Math.round(s.fin.business * (1 + r)));
    s.fin.cash += s.fin.business * 0.0006;
  }
}
