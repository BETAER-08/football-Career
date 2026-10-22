import { isCosmetic } from './flags';
import { hashString } from './rng';
import { getClub } from './data';
import type { Fixture, GameState, MatchLine } from './types';
import type { MatchOut } from './match';
import { josa } from './josa';

function pick<T>(arr: T[], key: string): T {
  return arr[hashString(key) % arr.length];
}

const BENCH_INJURY = ['부상으로 결장했다.', '몸 상태 탓에 경기장에 서지 못했다.', '부상 치료에 집중하며 경기를 지켜봤다.', '통증이 가시지 않아 명단에서 제외됐다.', '의무팀의 판단으로 결장했다.', '재활 훈련으로 경기를 대신했다.', '벤치에도 앉지 못하고 치료실에 머물렀다.', '회복에 전념하느라 경기를 놓쳤다.'];
const BENCH_OUT = ['출전 명단에 들지 못했다.', '이번 경기는 명단에서 제외됐다.', '경기장 밖에서 동료들을 응원했다.', '관중석에서 경기를 지켜봤다.', '벤치 밖에서 팀의 경기를 지켜봤다.', '출전 기회를 얻지 못했다.', '이번에는 엔트리에 포함되지 않았다.', '다음 기회를 기다리며 경기를 지켜봤다.'];
const HAT = ['해트트릭', '해트트릭 달성', '세 골을 몰아쳤다', '혼자 세 골을 책임졌다', '해트트릭으로 경기를 지배했다', '세 번 골망을 흔들었다', '해트트릭, 경기의 주인공', '한 경기 세 골의 맹활약'];
const MULTI = ['멀티골', '두 골을 몰아쳤다', '멀티골로 승부를 갈랐다', '두 번 골망을 흔들었다', '멀티골 맹활약', '한 경기 두 골을 기록했다', '두 골로 팀을 이끌었다', '연속 득점으로 존재감을 보였다'];
const WINNER = ['후반 {m}분 결승골', '후반 {m}분 승부를 가른 결승골', '후반 {m}분 결승 득점', '후반 {m}분 천금 같은 결승골', '후반 {m}분 팀을 승리로 이끈 골', '후반 {m}분 결정적인 결승골', '후반 {m}분 마지막 한 방', '후반 {m}분 결승골로 경기를 끝냈다'];
const EQUAL = ['후반 {m}분 동점골', '후반 {m}분 균형을 맞추는 동점 득점', '후반 {m}분 팀을 구한 동점골', '후반 {m}분 동점골로 패배를 막았다', '후반 {m}분 극적인 동점 득점', '후반 {m}분 승점을 지킨 동점골', '후반 {m}분 추격을 마무리한 동점골', '후반 {m}분 만회에 성공한 동점골'];
const GOAL = ['{h} {m}분 득점', '{h} {m}분 골망을 흔들었다', '{h} {m}분 골을 터뜨렸다', '{h} {m}분 득점에 성공했다', '{h} {m}분 마무리를 해냈다', '{h} {m}분 골 맛을 봤다', '{h} {m}분 팀의 골을 책임졌다', '{h} {m}분 슈팅이 골문을 갈랐다'];
const ASSIST_W = ['후반 {m}분 결승골 도움', '후반 {m}분 승부를 가른 어시스트', '후반 {m}분 결승골을 배달했다', '후반 {m}분 결승 득점을 도왔다', '후반 {m}분 날카로운 패스로 결승골 도움', '후반 {m}분 결승골의 시작이 됐다', '후반 {m}분 결정적인 도움', '후반 {m}분 마지막 패스로 승리를 만들었다'];
const ASSIST = ['{h} {m}분 도움', '{h} {m}분 어시스트 기록', '{h} {m}분 정확한 패스로 도움', '{h} {m}분 득점을 도왔다', '{h} {m}분 동료의 골을 배달했다', '{h} {m}분 날카로운 연결로 도움', '{h} {m}분 기회를 만들어 도움', '{h} {m}분 패스 한 번으로 골을 도왔다'];
const CS = ['무실점 방어 기여', '실점 없이 경기를 마쳤다', '수비 라인을 지켜 무실점', '무실점 승리의 주역', '골문을 지켜 낸 경기', '단단한 수비로 클린시트', '실점을 허용하지 않았다', '무실점 경기에 힘을 보탰다'];
const SUB = ['교체 투입 {n}분{s}', '후반 교체로 {n}분 소화{s}', '교체로 들어가 {n}분 동안 뛰었다{s}', '벤치에서 나와 {n}분 소화{s}', '교체 카드로 {n}분 출전{s}', '막판 교체 투입, {n}분{s}', '교체 출전 {n}분{s}', '짧은 시간 {n}분 출전{s}'];
const BIGLOSS = ['수비 라인이 흔들린 경기', '대량 실점에 고개를 숙였다', '수비가 무너진 경기', '골문이 속수무책으로 열렸다', '실점이 이어진 힘든 경기', '수비 조직이 흔들렸다', '쓰라린 대패를 맛봤다', '버티지 못한 수비 라인'];
const BIGWIN = ['대승에 힘을 보탰다', '팀의 대승 속에 안정적인 경기', '여유 있는 승리를 함께했다', '대승 분위기 속에 제 몫을 했다', '화력 쇼에 일조했다', '승리를 확실히 굳힌 경기', '일방적인 경기 속 활약', '팀 승리에 기여한 경기'];
const DRAW = ['승점 1점을 지킨 경기', '팽팽한 무승부 속에서 버텼다', '치열한 접전 끝 무승부', '승부를 가리지 못한 경기', '끝까지 물러서지 않은 경기', '아쉬움이 남는 무승부', '한 점의 소중함을 느낀 경기', '균형을 지킨 90분'];
const POOR = ['부진한 경기', '경기 내내 리듬을 찾지 못했다', '아쉬움이 남는 경기', '실수가 이어진 하루', '제 컨디션이 아니었던 경기', '답답한 경기력', '존재감이 희미했던 경기', '다음 경기를 기약해야 했다'];
const STARTER = ['안정적인 경기 운영', '꾸준히 라인을 지켰다', '활동량으로 존재감을 보였다', '묵묵히 제 역할을 해냈다', '팀의 균형을 유지했다', '선발로 나서 끝까지 뛰었다', '군더더기 없는 경기력', '궂은일을 도맡았다'];

function tpl(list: string[], key: string, vars: Record<string, string | number>): string {
  return pick(list, key).replace(/\{(\w+)\}/g, (_, n: string) => String(vars[n] ?? ''));
}

export function reportLine(s: GameState, fx: Fixture, out: MatchOut): string {
  const k = `${s.cfg.seed}|${s.week}|${fx.comp}`;
  const min = (a: number, b: number) => a + (hashString(k + 'm') % (b - a + 1));
  const half = pick(['전반', '후반'], k + 'h');
  const bits: string[] = [];
  if (!out.played) return s.st.injury ? pick(BENCH_INJURY, k + 'i') : pick(BENCH_OUT, k + 'o');
  const win = out.result === 'W';
  const diff = out.myGoals - out.oppGoals;
  if (out.goals >= 3) bits.push(pick(HAT, k + 'g'));
  else if (out.goals === 2) bits.push(pick(MULTI, k + 'g'));
  else if (out.goals === 1) {
    if (win && diff === 1) bits.push(tpl(WINNER, k + 'g', { m: min(60, 89) }));
    else if (out.result === 'D' && out.myGoals > 0) bits.push(tpl(EQUAL, k + 'g', { m: min(55, 89) }));
    else bits.push(tpl(GOAL, k + 'g', { h: half, m: min(8, 85) }));
  }
  if (out.assists >= 1) {
    if (out.goals) bits.push(`도움 ${out.assists}`);
    else if (win && diff === 1) bits.push(tpl(ASSIST_W, k + 'a', { m: min(55, 89) }));
    else bits.push(tpl(ASSIST, k + 'a', { h: pick(['전반', '후반'], k + 'ah'), m: min(8, 85) }));
  }
  if (out.cs && !out.goals) bits.push(pick(CS, k + 'c'));
  if (!bits.length) {
    if (out.mins < 40) {
      const shots = out.goals + out.assists === 0 ? ', 슈팅 ' + (1 + (hashString(k + 's') % 2)) + '회' : '';
      bits.push(tpl(SUB, k + 'x', { n: out.mins, s: shots }));
    } else if (out.oppGoals >= 3) bits.push(pick(BIGLOSS, k + 'x'));
    else if (win && diff >= 3) bits.push(pick(BIGWIN, k + 'x'));
    else if (out.result === 'D') bits.push(pick(DRAW, k + 'x'));
    else if (out.rating < 5.8) bits.push(pick(POOR, k + 'x'));
    else bits.push(pick(STARTER, k + 'x'));
  }
  if (out.rc) bits.push('퇴장');
  const old = oldMateNote(s, fx);
  return `${bits.join(' · ')} · 평점 ${out.rating.toFixed(2)}${old}`;
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
