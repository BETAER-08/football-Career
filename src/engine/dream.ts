import { addLog } from './log';
import { netWorth } from './finance';
import type { GameState } from './types';

export function dreamHit(s: GameState, id: string, text: string): void {
  if (s.dream !== id || s.dreamHits.includes(id)) return;
  s.dreamHits.push(id);
  addLog(s, 'milestone', '꿈에 다가서다', text, [], { star: true, dream: true });
}

export function dreamAchieved(s: GameState, id: string): boolean {
  switch (id) {
    case 'legend': return s.career.clubsHist.filter((h) => h.clubId === s.p.startClubId).reduce((a, h) => a + Math.max(0, (h.toS < 0 ? Math.floor(s.week / 52) : h.toS) - h.fromS), 0) >= 8 && s.career.debuted;
    case 'bigstarter': return s.career.seasons.some((r) => r.lvl >= 5 && r.starts >= 20);
    case 'national': return s.nat.caps >= 10;
    case 'ballon': return s.extra.ballon >= 1;
    case 'rich': return netWorth(s) >= 500000;
    default: return false;
  }
}

export function checkDreamSeason(s: GameState): void {
  if (!s.dream) return;
  if (s.dream === 'legend' && s.career.clubId === s.p.startClubId && dreamAchieved(s, 'legend')) dreamHit(s, 'legend', '어린 시절 입단했던 고향 팀에서 어느새 레전드로 불리고 있다.');
  if (s.dream === 'bigstarter' && dreamAchieved(s, 'bigstarter')) dreamHit(s, 'bigstarter', '빅리그에서 당당히 주전으로 한 시즌을 보냈다.');
  if (s.dream === 'rich' && dreamAchieved(s, 'rich')) dreamHit(s, 'rich', '통장의 숫자가 어린 시절 상상하던 수준을 넘어섰다.');
  if (s.dream === 'national' && dreamAchieved(s, 'national')) dreamHit(s, 'national', '대표팀 유니폼을 입고 뛴 경기가 어느새 열 번을 넘었다.');
}
