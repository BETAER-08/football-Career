import { isCosmetic } from './flags';
import { hashString } from './rng';
import { getClub } from './data';
import type { Fixture, GameState, MatchLine } from './types';
import type { MatchOut } from './match';
import { josa } from './josa';

function pick<T>(arr: T[], key: string): T {
  return arr[hashString(key) % arr.length];
}

export function reportLine(s: GameState, fx: Fixture, out: MatchOut): string {
  const k = `${s.cfg.seed}|${s.week}|${fx.comp}`;
  const min = (a: number, b: number) => a + (hashString(k + 'm') % (b - a + 1));
  const bits: string[] = [];
  if (!out.played) return s.st.injury ? '부상으로 결장했다.' : '출전 명단에 들지 못했다.';
  const win = out.result === 'W';
  if (out.goals >= 3) bits.push('해트트릭');
  else if (out.goals === 2) bits.push(pick(['멀티골', '두 골을 몰아쳤다'], k));
  else if (out.goals === 1) {
    const decisive = win && out.myGoals - out.oppGoals === 1;
    bits.push(decisive ? `후반 ${min(60, 89)}분 결승골` : `${pick(['전반', '후반'], k + 'h')} ${min(8, 85)}분 득점`);
  }
  if (out.assists >= 1) bits.push(out.goals ? `도움 ${out.assists}` : decisiveAssist(out, k, min));
  if (out.cs && !out.goals) bits.push('무실점 방어 기여');
  if (!bits.length) {
    if (out.mins < 40) bits.push(`교체 투입 ${out.mins}분${out.goals + out.assists === 0 ? ', 슈팅 ' + (1 + (hashString(k + 's') % 2)) + '회' : ''}`);
    else if (out.oppGoals >= 3) bits.push('수비 라인이 흔들린 경기');
    else bits.push(pick(['안정적인 경기 운영', '꾸준히 라인을 지켰다', '활동량으로 존재감을 보였다'], k + 'x'));
  }
  if (out.rc) bits.push('퇴장');
  const old = oldMateNote(s, fx);
  return `${bits.join(' · ')} · 평점 ${out.rating.toFixed(1)}${old}`;
}

function decisiveAssist(out: MatchOut, k: string, min: (a: number, b: number) => number): string {
  return out.result === 'W' && out.myGoals - out.oppGoals === 1 ? `후반 ${min(55, 89)}분 결승골 도움` : `${pick(['전반', '후반'], k + 'a')} ${min(8, 85)}분 도움`;
}

function oldMateNote(s: GameState, fx: Fixture): string {
  if (!fx.oppId) return '';
  const f = s.wld.faces.find((x) => x.status === 'pro' && x.clubId === fx.oppId);
  if (!f) return '';
  return ` · 상대 ${getClub(fx.oppId).name}에는 ${f.role === 'rival' ? '라이벌' : '옛 동료'} ${josa(f.name, '이')} 있었다`;
}

export function pushMatchLine(s: GameState, fx: Fixture, out: MatchOut): void {
  if (!isCosmetic() || fx.kind === 'friendly') return;
  const m: MatchLine = { w: s.week, comp: fx.comp, stage: fx.stage, line: out.line, report: reportLine(s, fx, out), result: out.result };
  s.recent.push(m);
  if (s.recent.length > 14) s.recent.shift();
}

export function commentary(s: GameState, out: MatchOut): string {
  const k = `${s.cfg.seed}|${s.week}|c`;
  const left = 8 + (hashString(k) % 16);
  const first = out.hg + out.ag === 0 ? '전반은 서로 탐색전 끝에 0-0으로 마쳤다.' : out.hg + out.ag <= 2 ? '전반은 팽팽한 흐름이었다.' : '전반부터 골이 오가는 난타전이었다.';
  return `${first}\n지금 스코어는 ${out.homeName} ${out.hg}-${out.ag} ${out.awayName}.\n남은 시간은 약 ${left}분. 이 장면에서 흐름이 갈린다.`;
}
