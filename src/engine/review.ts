import { CONT_SLOTS } from '../data/competitions';
import { curOvr } from './attributes';
import { getClub, getLeague } from './data';
import { isCosmetic } from './flags';
import { currentWage } from './finance';
import { goalValue, makeGoals } from './goals';
import { genName } from './relations';
import { clamp } from './rng';
import { stream } from './streams';
import { awardPrize } from './season';
import { seasonOf, yearOf } from './time';
import { clubLeagueId, ranking } from './world';
import type { GameState, LeaderRow, ReviewAward, SeasonReview, TableRow } from './types';

export interface ClubAwardCalc { mates: { r: number; young: boolean }[]; poy: boolean; young: boolean }

export function clubAwardCalc(seed: string, season: number, avg: number, age: number, apps: number): ClubAwardCalc {
  const r = stream(seed, 'clubaward', season);
  const mates: { r: number; young: boolean }[] = [];
  for (let i = 0; i < 6; i++) mates.push({ r: clamp(r.normal(6.5, 0.32), 5.7, 7.9), young: i >= 4 });
  const best = Math.max(...mates.map((m) => m.r));
  const bestYoung = Math.max(...mates.filter((m) => m.young).map((m) => m.r));
  const ok = apps >= 12 && avg > 0;
  return { mates, poy: ok && avg >= best, young: ok && age <= 21 && avg >= bestYoung };
}

export function clubAwards(s: GameState): void {
  const cur = s.career.cur;
  if (s.phase !== 'pro' || !s.career.clubId || cur.apps < 12) return;
  const avg = cur.ratingN ? cur.ratingSum / cur.ratingN : 0;
  const age = yearOf(s.week) - s.p.birth.y;
  const c = clubAwardCalc(s.cfg.seed, seasonOf(s.week), avg, age, cur.apps);
  const name = getClub(s.career.clubId).name;
  if (c.poy) awardPrize(s, `${name} 올해의 선수`, 0);
  if (c.young) awardPrize(s, `${name} 영플레이어`, 0);
}

function slots(code: string): number {
  return (CONT_SLOTS[code] ?? []).reduce((a, [, n]) => a + n, 0);
}

function table(s: GameState, lgId: string, clubId: string): { rows: TableRow[]; idx: number } {
  const lg = getLeague(lgId);
  const rt = s.world.leagues[lgId];
  const rank = ranking(s, lgId);
  const n = rank.length;
  const cont = lg.tier === 1 ? slots(lg.country) : 0;
  const rows: TableRow[] = rank.map((id, i) => {
    const t = rt.table[id];
    let zone: TableRow['zone'] = '';
    if (i === 0) zone = 'champ';
    else if (i < cont) zone = 'cont';
    else if (lg.down > 0 && i >= n - lg.down) zone = 'down';
    return { id, name: getClub(id).name, pts: t[0], gf: t[1], ga: t[2], zone };
  });
  return { rows, idx: rank.indexOf(clubId) };
}

export function leaders(s: GameState, lgId: string, season: number, mine: { goals: number; assists: number; name: string; club: string }, topScorer: boolean, topAssist: boolean): { scorers: LeaderRow[]; assisters: LeaderRow[] } {
  const rt = s.world.leagues[lgId];
  const r = stream(s.cfg.seed, 'lead', season);
  const mk = (kind: 'g' | 'a'): LeaderRow[] => {
    const rows: LeaderRow[] = [];
    for (const id of rt.order) {
      const gf = rt.table[id][1];
      const total = kind === 'g' ? gf : gf * 0.64;
      const shares = kind === 'g' ? [r.float(0.2, 0.36), r.float(0.11, 0.2), r.float(0.07, 0.13)] : [r.float(0.12, 0.22), r.float(0.09, 0.16), r.float(0.06, 0.11)];
      const cn = getClub(id);
      shares.forEach((sh, i) => {
        if (i >= 2 && r.next() < 0.5) return;
        rows.push({ name: genName(r, cn.country).name, club: cn.name, v: Math.max(1, Math.round(total * sh)), me: false });
      });
    }
    rows.sort((a, b) => b.v - a.v);
    return rows.slice(0, 12);
  };
  const place = (rows: LeaderRow[], v: number, won: boolean): LeaderRow[] => {
    let list = rows;
    if (won) list = list.map((x) => ({ ...x, v: Math.min(x.v, Math.max(0, v - 1)) }));
    else if (list.length && v > list[0].v) list[0] = { ...list[0], v: v + (r.next() < 0.5 ? 0 : 1) };
    const me: LeaderRow = { name: mine.name, club: mine.club, v, me: true };
    list = [...list, me].sort((a, b) => b.v - a.v || (a.me ? -1 : 1));
    if (won) {
      const i = list.findIndex((x) => x.me);
      if (i > 0) [list[0], list[i]] = [list[i], list[0]];
    }
    return list.slice(0, 10);
  };
  const sc = mk('g');
  const as = mk('a');
  const topS = sc[9]?.v ?? 0;
  const topA = as[9]?.v ?? 0;
  return {
    scorers: mine.goals >= topS || topScorer ? place(sc, mine.goals, topScorer) : sc.slice(0, 10),
    assisters: mine.assists >= topA || topAssist ? place(as, mine.assists, topAssist) : as.slice(0, 10)
  };
}

export function progressLeaders(s: GameState, lgId: string): { scorers: LeaderRow[]; assisters: LeaderRow[] } | null {
  const rt = s.world.leagues[lgId];
  if (!rt) return null;
  const clubId = s.phase === 'coach' ? s.coach.clubId : s.career.clubId;
  const n = rt.order.length;
  const total = (n % 2 === 0 ? n - 1 : n) * 2;
  const frac = clamp(rt.round / Math.max(1, total), 0.05, 1);
  const cur = s.career.cur;
  const out = leaders(s, lgId, 1000 + seasonOf(s.week), { goals: cur.goals, assists: cur.assists, name: s.p.name, club: clubId ? getClub(clubId).name : '' }, false, false);
  const scale = (rows: LeaderRow[]) => rows.map((x) => (x.me ? x : { ...x, v: Math.max(0, Math.round(x.v * frac)) })).sort((a, b) => b.v - a.v).slice(0, 10);
  return { scorers: scale(out.scorers), assisters: scale(out.assisters) };
}

function bestParagraph(s: GameState): string {
  const b = s.career.cur.best;
  if (!b) return '이번 시즌에는 기억에 남을 만한 장면이 많지 않았다. 다음 시즌을 기약한다.';
  if (b.momentText) return b.momentText;
  const bits: string[] = [];
  if (b.goals) bits.push(`${b.goals}골`);
  if (b.assists) bits.push(`${b.assists}도움`);
  const contrib = bits.length ? `${bits.join(' ')}을(를) 기록하며 ` : '';
  return `${b.comp}에서 ${b.line}. ${b.mins}분을 뛰며 ${contrib}평점 ${b.rating.toFixed(1)}으로 시즌 최고의 경기를 만들었다.`;
}

export function buildPlayerReview(s: GameState): void {
  if (!isCosmetic()) return;
  const cur = s.career.cur;
  const clubId = s.career.clubId;
  if (!clubId || !s.world.leagues[cur.leagueId]) return;
  const season = seasonOf(s.week);
  const lgId = cur.leagueId;
  const lg = getLeague(lgId);
  const { rows, idx } = table(s, lgId, clubId);
  const clubName = getClub(clubId).name;
  const awardsAll = cur.awards;
  const topS = awardsAll.some((a) => a.includes('득점왕'));
  const topA = awardsAll.some((a) => a.includes('도움왕'));
  const lead = leaders(s, lgId, season, { goals: cur.goals, assists: cur.assists, name: s.p.name, club: clubName }, topS, topA);
  const avg = cur.ratingN ? cur.ratingSum / cur.ratingN : 0;
  const age = yearOf(s.week) - s.p.birth.y;
  const calc = clubAwardCalc(s.cfg.seed, season, avg, age, cur.apps);
  const nr = stream(s.cfg.seed, 'poynames', season);
  const poy = calc.mates.map((m) => ({ name: genName(nr, getClub(clubId).country).name, rating: Math.round(m.r * 100) / 100 }));
  if (avg > 0) poy.push({ name: s.p.name, rating: Math.round(avg * 100) / 100 });
  poy.sort((a, b) => b.rating - a.rating);
  const awards: ReviewAward[] = awardsAll.map((name) => ({ name, scope: name.startsWith(clubName) ? 'club' : 'league', mine: true }));
  const goalsOut = s.goals && s.goals.settled
    ? [s.goals.club, s.goals.personal].map((d, i) => ({ label: `${i === 0 ? '구단 기대' : '개인'}: ${d.label} (${d.metric === 'rating' ? goalValue(s, d).toFixed(2) : goalValue(s, d)}/${d.target})`, done: !!d.done, reward: d.done ? '사기·감독 관계·명성 상승' : '사기 하락' }))
    : [];
  const rev: SeasonReview = {
    s: season, year: cur.year, role: 'player', clubName, leagueName: lg.ko, pos: cur.pos, n: rows.length,
    rec: { apps: cur.apps, starts: cur.starts, mins: cur.mins, goals: cur.goals, assists: cur.assists, cs: cur.cs, avg, yc: cur.yc, rc: cur.rc, injDays: cur.injDays },
    table: rows, myIdx: idx, scorers: lead.scorers, assisters: lead.assisters, awards, clubPoy: poy.slice(0, 5), best: bestParagraph(s),
    change: { ovr: curOvr(s.ab) - s.snap.ovr, val: s.fame.value - s.snap.val, wage: currentWage(s) - s.snap.wage, fame: s.fame.dom - s.snap.fame },
    trophies: cur.trophies.slice(), goals: goalsOut, next: { club: '', personal: '' }
  };
  const nx = makeGoals(s);
  if (nx) rev.next = { club: nx.club.label, personal: nx.personal.label };
  s.reviews.push(rev);
  if (s.reviews.length > 30) s.reviews.shift();
  s.pendingReview = season;
}

export function buildCoachReview(s: GameState): void {
  if (!isCosmetic()) return;
  const c = s.coach;
  if (c.role === 'none' || !c.clubId) return;
  const lgId = clubLeagueId(s, c.clubId);
  if (!s.world.leagues[lgId]) return;
  const season = seasonOf(s.week);
  const lg = getLeague(lgId);
  const { rows, idx } = table(s, lgId, c.clubId);
  const squad = c.squad.length ? c.squad.slice().sort((a, b) => b.ovr - a.ovr) : [];
  const mvp = squad.length ? squad[Math.floor(stream(s.cfg.seed, 'mvp', season).next() * Math.min(3, squad.length))].name : '-';
  const trophies = s.career.cur.trophies.slice();
  const rev: SeasonReview = {
    s: season, year: yearOf(s.week), role: 'coach', clubName: getClub(c.clubId).name, leagueName: lg.ko, pos: idx + 1, n: rows.length,
    rec: { apps: 0, starts: 0, mins: 0, goals: 0, assists: 0, cs: 0, avg: 0, yc: 0, rc: 0, injDays: 0 },
    table: rows, myIdx: idx, scorers: [], assisters: [], awards: [], clubPoy: [], best: '',
    change: { ovr: 0, val: 0, wage: 0, fame: c.fame - s.snap.fame }, trophies, goals: [], next: { club: '', personal: '' },
    coach: { target: c.tableTarget, pts: rows[idx] ? rows[idx].pts : 0, mvp, standing: c.standing, standingDelta: c.standing - s.snap.standing }
  };
  s.reviews.push(rev);
  if (s.reviews.length > 30) s.reviews.shift();
  s.pendingReview = season;
}

export function patchCoachReview(s: GameState): void {
  const last = s.reviews[s.reviews.length - 1];
  if (!last || last.role !== 'coach' || last.s !== seasonOf(s.week) || !last.coach) return;
  last.coach.standing = s.coach.standing;
  last.coach.standingDelta = s.coach.standing - s.snap.standing;
  last.change.fame = s.coach.fame - s.snap.fame;
}
