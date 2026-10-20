import { applyFx } from './fx';
import { addLog } from './log';
import { formatKRW } from './finance';
import { positionOf } from './world';
import { youthRank } from './yleague';
import type { Rng } from './rng';
import { activeLeagueId, calOf } from './calendar';
import { swOf } from './time';
import type { GameState } from './types';

export function midSeasonSummary(s: GameState, rng: Rng): void {
  if (swOf(s.week) !== calOf(s).midSeason) return;
  const clubId = s.phase === 'coach' ? s.coach.clubId : s.career.clubId;
  if (!clubId || s.career.retired) return;
  if (s.phase === 'youth' && s.yt) {
    youthSummary(s, rng);
    return;
  }
  const lgId = activeLeagueId(s);
  const rt = s.world.leagues[lgId];
  const row = rt ? rt.table[clubId] : undefined;
  if (!rt || !row || row[3] === 0) return;
  const pos = positionOf(s, lgId, clubId);
  const n = rt.order.length;
  const zone = pos <= n / 3 ? 'top' : pos > (2 * n) / 3 ? 'bottom' : 'mid';
  const gd = row[1] - row[2];
  const parts = [`리그 ${pos}위(${n}팀 중) · ${row[3]}경기 승점 ${row[0]} · 득실 ${gd >= 0 ? '+' : ''}${gd}`];
  if (s.phase === 'coach') {
    parts.push(`입지 ${Math.round(s.coach.standing)}`);
  } else {
    const cur = s.career.cur;
    const avg = cur.ratingN ? cur.ratingSum / cur.ratingN : 0;
    parts.push(`출전 ${cur.apps}경기 · ${cur.goals}골 ${cur.assists}도움${avg ? ` · 평균 평점 ${avg.toFixed(1)}` : ''}`);
    const wage = s.career.contract ? s.career.contract.wage : 0;
    if (wage > 0) parts.push(`이번 시즌 수령 연봉 약 ${formatKRW(Math.round(s.fin.yearIncomeAcc))}`);
  }
  const mood = zone === 'top' ? '상위권에서 시즌 후반부를 맞는다. 라커룸 분위기가 좋다.' : zone === 'bottom' ? '하위권에서 시즌 후반부를 맞는다. 연패의 기억이 아직 무겁다.' : '중위권에서 시즌 후반부를 맞는다.';
  const fx = zone === 'top' ? 'morale+3 happy+2' : zone === 'bottom' ? 'morale-3 stress+3' : '';
  const chips = applyFx(s, { rng }, fx);
  addLog(s, 'system', '시즌 중간 점검', `${parts.join('. ')}. ${mood}`, chips);
}

function youthSummary(s: GameState, rng: Rng): void {
  const yt = s.yt;
  const clubId = s.career.clubId;
  if (!yt || !clubId) return;
  const row = yt.table[clubId];
  if (!row || row[3] === 0) return;
  const pos = youthRank(s);
  const n = yt.ids.length;
  const zone = pos <= n / 3 ? 'top' : pos > (2 * n) / 3 ? 'bottom' : 'mid';
  const cur = s.career.yCur;
  const avg = cur.ratingN ? cur.ratingSum / cur.ratingN : 0;
  const gd = row[1] - row[2];
  const parts = [
    `${yt.name} ${pos}위(${n}팀 중) · ${row[3]}경기 승점 ${row[0]} · 득실 ${gd >= 0 ? '+' : ''}${gd}`,
    `출전 ${cur.apps}경기 · ${cur.goals}골 ${cur.assists}도움${avg ? ` · 평균 평점 ${avg.toFixed(1)}` : ''}`
  ];
  const mood = zone === 'top' ? '상위권에서 시즌 후반부를 맞는다.' : zone === 'bottom' ? '하위권에서 시즌 후반부를 맞는다. 잔류 걱정이 앞선다.' : '중위권에서 시즌 후반부를 맞는다.';
  const chips = applyFx(s, { rng }, zone === 'top' ? 'morale+3 happy+2' : zone === 'bottom' ? 'morale-3 stress+3' : '');
  addLog(s, 'system', '시즌 중간 점검', `${parts.join('. ')}. ${mood}`, chips);
}
