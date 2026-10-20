import { Rng, clamp, hashString } from './rng';
import { curOvr } from './attributes';
import { getClub, getCountry, getLeague, leaguesOf } from './data';
import { addLog } from './log';
import { buildRounds, clubLeagueId, clubLvl, clubStd, dyn, ensureCountry, roundRng, simScore } from './world';
import { leagueWeek, profileOf } from './calendar';
import { seasonOf, swOf } from './time';
import { hnorm, hunit, stream } from './streams';
import { u15Rate } from './roulette';
import { emptyRec } from './records';
import { STAGE_TAG, effOvr, playPlayerMatch, playTeamOnly, stageStd, type MatchOut } from './match';
import { schoolsOf, type SchoolKind } from '../data/schools';
import { BTEAM_COUNTRIES, SCHOOL_NAMES, isSchoolStage, STAGE_EXPECT, STAGE_ORDER, STAGE_LABEL, STAGE_TEAMS, YOUTH_NAMES, gamesFor, nextStage } from './stages';
import { genName } from './relations';
import { pushMatchLine } from './matchtext';
import { fireEvent, getEvent } from './events';
import { isCosmetic } from './flags';
import { makePerson } from './relations';
import { trigMoment } from './season';
import { makeGoals } from './goals';
import type { Fixture, GameState, LeaderRow, YouthRT, YouthStage } from './types';

const CUP_ROUNDS = ['16강', '8강', '4강', '결승'];

export function hasAcademy(id: string, stage: YouthStage): boolean {
  const c = getClub(id);
  const r = u15Rate(c.lvl0, getCountry(c.country).infra);
  const rate = stage === 'U15' ? r : Math.min(1, r + 0.12);
  return hunit(`acad:${id}`) < rate;
}

export function teamSt(s: GameState, id: string, stage: YouthStage): number {
  const d = dyn(s, id);
  const cs = getClub(id);
  const base = 0.75 * d.st + 12.5;
  const acad = (cs.acad - 50) / 9;
  const noise = hnorm(`yt:${id}:${stage}:${seasonOf(s.week)}`) * 2.4;
  return clamp(base + acad + noise, 15, 95);
}

function poolOf(s: GameState, stage: YouthStage, own: string): string[] {
  const country = getClub(own).country;
  if (isSchoolStage(stage)) {
    const ids = schoolsOf(country, stage as SchoolKind).map((x) => x.id);
    if (!ids.includes(own)) ids.push(own);
    return ids.sort((a, b) => getClub(b).st0 - getClub(a).st0 || (a < b ? -1 : 1));
  }
  ensureCountry(s, country);
  const ids: string[] = [];
  for (const l of leaguesOf(country)) for (const id of l.clubIds) if (id === own || hasAcademy(id, stage)) ids.push(id);
  if (ids.length < 6) {
    const rest: string[] = [];
    for (const l of leaguesOf(country)) for (const id of l.clubIds) if (!ids.includes(id)) rest.push(id);
    rest.sort((a, b) => dyn(s, b).st - dyn(s, a).st || (a < b ? -1 : 1));
    for (const id of rest) {
      if (ids.length >= 6) break;
      ids.push(id);
    }
  }
  ids.sort((a, b) => dyn(s, b).st - dyn(s, a).st || (a < b ? -1 : 1));
  return ids;
}

export interface LeaguePlan { ids: string[]; group: number; groups: number; name: string; cupName: string; adult: boolean }

export function leagueNameOf(country: string, stage: YouthStage, group: number, groups: number): string {
  const sch = isSchoolStage(stage) ? SCHOOL_NAMES[country]?.[stage as SchoolKind] : undefined;
  const base = sch ? sch.league : YOUTH_NAMES[country]?.league[stage] ?? `${getCountry(country).ko} ${stage === 'RES' ? '리저브' : stage} 리그`;
  return groups > 1 ? `${base} ${group + 1}부` : base;
}

export function planLeague(s: GameState, own: string, stage: YouthStage): LeaguePlan {
  const country = getClub(own).country;
  const pool = poolOf(s, stage, own);
  let n = Math.min(STAGE_TEAMS[stage], pool.length - (pool.length % 2));
  if (n < 6) n = Math.min(pool.length, 6);
  const groups = Math.max(1, Math.ceil(pool.length / n));
  const idx = pool.indexOf(own);
  const group = Math.min(groups - 1, Math.floor(idx / n));
  let ids = pool.slice(group * n, group * n + n);
  if (ids.length < n) ids = pool.slice(pool.length - n);
  const rng = stream(s.cfg.seed, `ylp:${own}:${stage}`, seasonOf(s.week));
  rng.shuffle(ids);
  return {
    ids, group, groups, name: leagueNameOf(country, stage, group, groups),
    cupName: isSchoolStage(stage) ? SCHOOL_NAMES[country]?.[stage as SchoolKind].cup ?? '' : stage === 'U17' || stage === 'U19' ? YOUTH_NAMES[country]?.cup[stage] ?? `${getCountry(country).ko} ${stage} 컵` : '',
    adult: stage === 'RES' && BTEAM_COUNTRIES.has(country)
  };
}

function calOfClub(s: GameState, clubId: string) {
  return profileOf(getLeague(clubLeagueId(s, clubId)).cal);
}

function hasContYouth(s: GameState, clubId: string, stage: YouthStage): boolean {
  return stage === 'U19' && getCountry(getClub(clubId).country).confed === 'UEFA' && clubLvl(s, clubId) >= 6;
}

function cupOpponent(s: GameState, yt: YouthRT, clubId: string, round: number): { id: string; name: string; st: number } {
  const rr = roundRng(s, `ycop:${clubId}`, round);
  const pool = yt.ids.length > 1 ? poolOf(s, yt.stage, clubId).filter((id) => id !== clubId) : [];
  if (!pool.length) return { id: '', name: `${CUP_ROUNDS[round]} 상대`, st: clamp(yt.st[clubId] - 2 + round * 2, 15, 95) };
  const q = clamp(0.8 - 0.17 * round + rr.normal(0, 0.12), 0, 0.98);
  const id = pool[Math.min(pool.length - 1, Math.floor(q * pool.length))];
  return { id, name: getClub(id).name, st: teamSt(s, id, yt.stage) };
}

function pushCupRound(s: GameState, yt: YouthRT, clubId: string, round: number, kind: 'ycup' | 'ycont'): void {
  const cal = calOfClub(s, clubId);
  const rr = roundRng(s, `ycw:${kind}:${clubId}`, round);
  let w: number;
  let comp: string;
  let opp: { id: string; name: string; st: number };
  if (kind === 'ycup') {
    w = yt.stage === 'UNI' && getClub(clubId).country === 'US' ? [14, 16, 18, 20][round] : cal.cupWeeks[3 + round];
    comp = yt.cupName;
    opp = cupOpponent(s, yt, clubId, round);
  } else {
    const L = cal.leagueWeeks;
    w = L[Math.min(L.length - 1, Math.floor(L.length * [0.3, 0.5, 0.7, 0.9][round]))];
    comp = yt.contName;
    opp = { id: '', name: `${comp} ${CUP_ROUNDS[round]} 상대`, st: clamp(yt.st[clubId] + 1 + round * 2 + rr.normal(0, 4), 15, 95) };
  }
  yt.fixtures.push({ w, comp, kind, opp: opp.name, oppSt: opp.st, ko: true, stage: CUP_ROUNDS[round], home: rr.chance(0.5), big: false, final: round === 3, round, oppId: opp.id });
  yt.fixtures.sort((a, b) => a.w - b.w);
}

export function setupYouthSeason(s: GameState, mid: boolean): void {
  const own = s.career.clubId;
  if (s.phase !== 'youth' || !own || s.career.retired) {
    s.yt = null;
    return;
  }
  const stage = s.career.youthStage;
  const season = seasonOf(s.week);
  const plan = planLeague(s, own, stage);
  const n = plan.ids.length;
  const games = gamesFor(n);
  const st: Record<string, number> = {};
  const table: Record<string, [number, number, number, number]> = {};
  for (const id of plan.ids) {
    st[id] = teamSt(s, id, stage);
    table[id] = [0, 0, 0, 0];
  }
  const key = `${stage}:${hashString([...plan.ids].sort().join('|'))}`;
  const cal = calOfClub(s, own);
  const rounds = buildRounds(plan.ids);
  const sw = swOf(s.week);
  const fall = stage === 'UNI' && getClub(own).country === 'US';
  const wk = (r: number): number => (fall ? 4 + Math.floor((r * 16) / games) : leagueWeek(cal, r, games));
  const yt: YouthRT = {
    s: season, stage, key, name: plan.name, cupName: plan.cupName, contName: '', ids: plan.ids, st, table, round: 0, games, fixtures: [],
    cupAlive: false, cupRound: 0, contAlive: false, contRound: 0, adult: plan.adult, group: plan.group, groups: plan.groups
  };
  let r0 = 0;
  if (mid) {
    while (r0 < games && wk(r0) < sw) r0++;
    for (let r = 0; r < r0; r++) {
      const rr = roundRng(s, `yl:${key}`, r);
      for (const [h, a] of rounds[r]) {
        const [hg, ag] = simScore(rr, st[h], st[a]);
        recordYouth(yt, h, a, hg, ag);
      }
    }
    yt.round = r0;
  }
  const ncRounds = rounds.length;
  for (let r = r0; r < ncRounds; r++) {
    const pair = rounds[r].find(([h, a]) => h === own || a === own);
    if (!pair) continue;
    const home = pair[0] === own;
    const opp = home ? pair[1] : pair[0];
    yt.fixtures.push({
      w: wk(r), comp: plan.name, kind: 'yleague', opp: `${getClub(opp).name} ${STAGE_TAG[stage]}`, oppSt: st[opp], ko: false,
      stage: `${r + 1}라운드`, home, big: getClub(opp).city === getClub(own).city, final: false, round: r, oppId: opp
    });
  }
  s.yt = yt;
  if (plan.cupName) {
    const first = [0, 1, 2, 3].find((i) => (fall ? [14, 16, 18, 20][i] : cal.cupWeeks[3 + i]) > sw);
    if (first !== undefined) {
      yt.cupAlive = true;
      yt.cupRound = first;
      pushCupRound(s, yt, own, first, 'ycup');
    }
  }
  if (hasContYouth(s, own, stage) && !mid) {
    yt.contName = 'UEFA 유스리그';
    yt.contAlive = true;
    pushCupRound(s, yt, own, 0, 'ycont');
  }
  yt.fixtures.sort((a, b) => a.w - b.w);
}

export function recordYouth(yt: YouthRT, h: string, a: string, hg: number, ag: number): void {
  const th = yt.table[h];
  const ta = yt.table[a];
  if (!th || !ta) return;
  th[1] += hg; th[2] += ag; th[3]++;
  ta[1] += ag; ta[2] += hg; ta[3]++;
  if (hg > ag) th[0] += 3;
  else if (hg < ag) ta[0] += 3;
  else { th[0]++; ta[0]++; }
}

export function youthRanking(yt: YouthRT): string[] {
  const ids = yt.ids.slice();
  ids.sort((a, b) => {
    const ta = yt.table[a];
    const tb = yt.table[b];
    if (tb[0] !== ta[0]) return tb[0] - ta[0];
    const gda = ta[1] - ta[2];
    const gdb = tb[1] - tb[2];
    if (gdb !== gda) return gdb - gda;
    if (tb[1] !== ta[1]) return tb[1] - ta[1];
    return a < b ? -1 : 1;
  });
  return ids;
}

export function youthRank(s: GameState): number {
  const yt = s.yt;
  if (!yt || !s.career.clubId || !yt.table[s.career.clubId]) return 0;
  return youthRanking(yt).indexOf(s.career.clubId) + 1;
}

export function starBoost(s: GameState): number {
  if (!s.career.clubId || s.ab.playShare < 0.35) return 0;
  return clamp((curOvr(s.ab) - stageStd(s, s.career.clubId, s.career.youthStage)) * 0.3, 0, 9);
}

function playRound(s: GameState, yt: YouthRT, round: number, own: string): [string, string, number, number] | null {
  const rd = buildRounds(yt.ids)[round];
  if (!rd) return null;
  const rr = roundRng(s, `yl:${yt.key}`, round);
  const boost = starBoost(s);
  let mine: [string, string, number, number] | null = null;
  for (const [h, a] of rd) {
    const [hg, ag] = simScore(rr, yt.st[h] + (h === own ? boost : 0), yt.st[a] + (a === own ? boost : 0));
    if (h === own || a === own) { mine = [h, a, hg, ag]; continue; }
    recordYouth(yt, h, a, hg, ag);
  }
  return mine;
}

export function youthTrophy(s: GameState, name: string): void {
  const club = getClub(s.career.clubId).name;
  const year = s.career.yCur.year;
  s.career.yTrophies.push({ year, name, club, stage: s.career.youthStage });
  s.career.yCur.trophies.push(name);
  s.st.morale = clamp(s.st.morale + 6, 0, 100);
  s.st.happy = clamp(s.st.happy + 4, 0, 100);
  if (isCosmetic()) s.cues.push('trophy');
  addLog(s, 'milestone', '유스 트로피', `${club} ${STAGE_LABEL[s.career.youthStage]}에서 ${name}을(를) 들어 올렸다.`, [], { star: true });
}

function readiness(s: GameState): number {
  return s.career.clubId ? curOvr(s.ab) - clubStd(s, s.career.clubId) : -30;
}

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function nextCup(s: GameState, fx: Fixture, out: MatchOut): void {
  const yt = s.yt;
  if (!yt) return;
  const isCup = fx.kind === 'ycup';
  if (out.result === 'W') {
    if (fx.final) {
      youthTrophy(s, `${fx.comp} 우승`);
      if (isCup) yt.cupAlive = false;
      else yt.contAlive = false;
    } else {
      const r = fx.round + 1;
      if (isCup) yt.cupRound = r;
      else yt.contRound = r;
      pushCupRound(s, yt, s.career.clubId, r, fx.kind as 'ycup' | 'ycont');
    }
  } else if (isCup) {
    yt.cupAlive = false;
  } else {
    yt.contAlive = false;
  }
}

export function listedThisWeek(s: GameState): boolean {
  return s.career.entry.step >= 2 && s.ev.flags.listedW === s.week;
}

function playYouthMatch(s: GameState, rng: Rng, fx: Fixture, listed: boolean): void {
  const yt = s.yt;
  const clubId = s.career.clubId;
  if (!yt || !clubId) return;
  const mySt = yt.st[clubId] + starBoost(s);
  const e = s.career.entry;
  let pre: { hg: number; ag: number; penWin?: boolean };
  let mine: [string, string, number, number] | null = null;
  if (fx.kind === 'yleague') {
    mine = playRound(s, yt, fx.round, clubId);
    yt.round = fx.round + 1;
    pre = mine ? { hg: mine[2], ag: mine[3] } : { hg: 0, ag: 0 };
  } else {
    const rr = roundRng(s, `yc:${fx.kind}:${clubId}`, fx.round);
    const [hg, ag] = fx.home ? simScore(rr, mySt, fx.oppSt) : simScore(rr, fx.oppSt, mySt);
    pre = { hg, ag, penWin: rr.chance(0.5 + (mySt - fx.oppSt) / 200) };
  }
  const stage = yt.stage;
  let out: MatchOut;
  if (listed) {
    out = playTeamOnly(s, rng, fx, mySt, pre);
    out.homeName = fx.home ? `${getClub(clubId).name} ${STAGE_TAG[stage]}` : fx.opp;
    out.awayName = fx.home ? fx.opp : `${getClub(clubId).name} ${STAGE_TAG[stage]}`;
    out.line = `${out.homeName} ${out.hg}-${out.ag} ${out.awayName}`;
  } else {
    let fxp = fx;
    let optStage: YouthStage | undefined;
    const up = nextStage(stage);
    const season = seasonOf(s.week);
    if (fx.kind === 'yleague' && up && (up !== 'RES' || s.career.signed) && !s.st.injury) {
      if (e.callupSeason !== season) { e.callupSeason = season; e.callups = 0; }
      const marginUp = effOvr(s) - stageStd(s, clubId, up);
      if (e.callups < 4 && marginUp >= -3 && rng.chance(0.07)) {
        e.callups += 1;
        fxp = { ...fx, comp: `${STAGE_LABEL[up]} 경기 차출`, oppSt: fx.oppSt + 4 };
        optStage = up;
        addLog(s, 'milestone', `${STAGE_LABEL[up]} 경기 차출`, `${getClub(clubId).name} ${STAGE_LABEL[up]} 팀 경기에 차출됐다. 한 단계 위의 속도를 맛보았다.`, [], { star: true });
        if (!s.ev.flags.callup_first) {
          s.ev.flags.callup_first = s.week;
          fireEvent(s, rng, getEvent('ys_callup_one'));
        }
      }
    }
    out = playPlayerMatch(s, rng, fxp, true, { pre, mySt: optStage ? mySt + 4 : mySt, stage: optStage });
    if (optStage) out.fx = fxp;
  }
  if (mine) recordYouth(yt, mine[0], mine[1], mine[2], mine[3]);
  const cur = s.career.yCur;
  cur.avail += 1;
  if (fx.kind !== 'yleague') nextCup(s, fx, out);
  if (out.played) {
    const bm = cur.best;
    if (!bm || out.rating > bm.rating) cur.best = { w: s.week, rating: out.rating, line: out.line, comp: `${out.fx.comp} ${fx.stage}`, goals: out.goals, assists: out.assists, mins: out.mins, result: out.result, momentText: bm ? bm.momentText : undefined };
    if (isCosmetic() && (out.goals > 0 || out.assists > 0)) s.cues.push('goal');
    const notable = out.goals >= 2 || out.rc > 0 || out.rating >= 9 || fx.final || (out.goals >= 1 && cur.goals === 1);
    if (notable) {
      const bits: string[] = [];
      if (out.goals >= 3) bits.push('해트트릭');
      else if (out.goals === 2) bits.push('멀티골');
      else if (out.goals === 1 && cur.goals === 1) bits.push('시즌 첫 골');
      if (out.rc > 0) bits.push('퇴장');
      if (fx.final) bits.push(fx.stage);
      if (out.rating >= 9) bits.push(`평점 ${out.rating.toFixed(1)}`);
      addLog(s, 'match', `${out.fx.comp} ${fx.stage}`, `${out.line}. ${bits.join(' · ')}. ${out.mins}분 출전, ${out.goals}골 ${out.assists}도움.`, [], { tier: stage === 'RES' ? 'r' : 'y' });
    }
  }
  pushMatchLine(s, out.fx, out);
  trigMoment(s, rng, out, 'y');
}

export function youthToday(s: GameState, rng: Rng, sw: number, listed: boolean): void {
  const yt = s.yt;
  if (!yt) return;
  const todays = yt.fixtures.filter((f) => f.w === sw);
  if (!todays.length) return;
  yt.fixtures = yt.fixtures.filter((f) => f.w !== sw);
  for (const fx of todays) playYouthMatch(s, rng, fx, listed);
}

export function closeYouthCurrent(s: GameState): void {
  const cur = s.career.yCur;
  if (!cur.done && (cur.apps > 0 || cur.mins > 0 || cur.avail > 0)) s.career.ySeasons.push({ ...cur, done: true, stage: cur.stage ?? s.career.youthStage });
  cur.done = true;
}

export function openYouthRec(s: GameState): void {
  const own = s.career.clubId;
  if (!own) return;
  const rec = emptyRec(seasonOf(s.week), own, `${getClub(own).name} ${STAGE_LABEL[s.career.youthStage]}`, '', s.yt ? s.yt.name : '', clubLvl(s, own));
  rec.stage = s.career.youthStage;
  s.career.yCur = rec;
}

export function openYouthSeason(s: GameState): void {
  if (s.phase !== 'youth' || !s.career.clubId) {
    s.yt = null;
    return;
  }
  s.career.entry.callups = 0;
  s.career.entry.callupSeason = seasonOf(s.week);
  setupYouthSeason(s, false);
  openYouthRec(s);
}

export function restageYouth(s: GameState): void {
  closeYouthCurrent(s);
  setupYouthSeason(s, true);
  openYouthRec(s);
}

export function changeYouthClub(s: GameState): void {
  const e = s.career.entry;
  if (!s.career.debuted) {
    e.step = 0;
    e.trainW = -1;
    e.squadW = -1;
    e.squadN = 0;
  }
  restageYouth(s);
}

export interface YouthLeaders { scorers: LeaderRow[]; assisters: LeaderRow[] }

export function youthLeaders(s: GameState): YouthLeaders | null {
  const yt = s.yt;
  const own = s.career.clubId;
  if (!yt || !own) return null;
  const r = stream(s.cfg.seed, 'ylead', yt.s * 10 + STAGE_TEAMS[yt.stage]);
  const cur = s.career.yCur;
  const frac = clamp(yt.round / Math.max(1, yt.games), 0.05, 1);
  const mk = (kind: 'g' | 'a'): LeaderRow[] => {
    const rows: LeaderRow[] = [];
    for (const id of yt.ids) {
      const total = (kind === 'g' ? yt.table[id][1] : yt.table[id][1] * 0.6) ;
      const shares = kind === 'g' ? [r.float(0.2, 0.36), r.float(0.11, 0.2)] : [r.float(0.12, 0.22), r.float(0.09, 0.16)];
      const cn = getClub(id);
      shares.forEach((sh) => rows.push({ name: genName(r, cn.country).name, club: `${cn.name} ${STAGE_TAG[yt.stage]}`, v: Math.max(0, Math.round(total * sh)), me: false }));
    }
    rows.push({ name: s.p.name, club: `${getClub(own).name} ${STAGE_TAG[yt.stage]}`, v: kind === 'g' ? cur.goals : cur.assists, me: true });
    rows.sort((a, b) => b.v - a.v || (a.me ? -1 : 1));
    return rows.slice(0, 10);
  };
  void frac;
  return { scorers: mk('g'), assisters: mk('a') };
}

export function finishYouthSeason(s: GameState, rng: Rng): void {
  const yt = s.yt;
  const own = s.career.clubId;
  if (!yt || !own) return;
  const cur = s.career.yCur;
  const rank = youthRanking(yt).indexOf(own) + 1;
  cur.pos = rank;
  cur.leagueName = yt.name;
  cur.stage = yt.stage;
  if (rank === 1 && yt.table[own][3] >= yt.games * 0.8) youthTrophy(s, `${yt.name} 우승`);
  const frac = cur.mins / Math.max(1, yt.games * 90);
  const avg = cur.ratingN ? cur.ratingSum / cur.ratingN : 0;
  const year = cur.year;
  const aw = (name: string) => {
    s.career.yAwards.push({ year, name });
    cur.awards.push(name);
    s.st.happy = clamp(s.st.happy + 3, 0, 100);
    addLog(s, 'milestone', '유스 개인상', `${name} 수상!`, [], { star: true });
  };
  if (s.ab.pos !== 'GK' && cur.goals >= 6 && frac >= 0.35) {
    const top = rng.normal(13, 3) * (yt.games / 26);
    if (cur.goals >= top) aw(`${yt.name} 득점왕`);
  }
  if (cur.assists >= 6 && frac >= 0.35) {
    const top = rng.normal(9, 2.5) * (yt.games / 26);
    if (cur.assists >= top) aw(`${yt.name} 도움왕`);
  }
  if (avg >= 7.0 && frac >= 0.5 && rank <= 3 && rng.chance(clamp((avg - 6.9) * 0.5, 0, 0.6))) aw(`${yt.name} 최우수 선수`);
  s.career.ySeasons.push({ ...cur, done: true });
  cur.done = true;
}

export function ensureFcoach(s: GameState, rng: Rng): void {
  if (s.people.fcoach) return;
  const own = s.career.clubId;
  const tmp = { nextId: s.ev.nextId };
  s.people.fcoach = makePerson(rng, tmp, 'coach', getClub(own).country, { age: rng.int(40, 63), refYear: 2026 + seasonOf(s.week), job: '1군 감독', rel: 0, clubId: own });
  s.people.fcoach.traitVal = rng.normal(0, 0.45);
  s.ev.nextId = tmp.nextId;
}

export function entryWeekly(s: GameState, rng: Rng, age: number): void {
  if (s.phase !== 'youth' || !s.career.clubId || s.career.retired || s.st.injury) return;
  const e = s.career.entry;
  const sw = swOf(s.week);
  if (sw < 3 || sw > 46 || s.career.track !== 'pro') return;
  const R = readiness(s);
  const pot = (s.ab.pot - curOvr(s.ab)) * 0.08;
  if (e.step === 0) {
    if (age < 15 || s.career.youthStage === 'U15') return;
    const p = 0.045 * logistic((R + 3 + pot + e.jumps * 2) / 3.2);
    if (rng.next() < p) {
      e.step = 1;
      e.trainW = s.week;
      ensureFcoach(s, rng);
      addLog(s, 'milestone', '1군 훈련 합류', `${getClub(s.career.clubId).name} 1군 훈련에 처음 합류했다. 주 1~2회 형들과 같은 운동장에 선다.`, [], { star: true });
      fireEvent(s, rng, getEvent('ys_first_team_first'));
    }
  } else if (e.step === 1) {
    if (age < 16 || s.week - e.trainW < 6) return;
    const p = 0.05 * logistic((R - 1 + pot) / 3);
    if (rng.next() < p) {
      e.step = 2;
      e.squadW = s.week;
      addLog(s, 'milestone', '1군 명단 등록', `${getClub(s.career.clubId).name} 1군 경기 명단에 처음 이름이 올랐다. 벤치에서 경기를 지켜본다.`, [], { star: true });
      fireEvent(s, rng, getEvent('ys_squad_first'));
    }
  }
}

export function rollListing(s: GameState, rng: Rng): boolean {
  const e = s.career.entry;
  if (e.step < 2 || s.st.injury) return false;
  const R = readiness(s);
  const p = clamp(0.22 + 0.55 * logistic((R - 2) / 3.5), 0.1, 0.9);
  const ok = rng.next() < p;
  if (ok) {
    s.ev.flags.listedW = s.week;
    e.squadN += 1;
  }
  return ok;
}

export function settleCheck(s: GameState, rng: Rng): void {
  if (s.phase !== 'youth' || !s.career.debuted || s.career.retired) return;
  const cur = s.career.cur;
  if (cur.apps >= 6 && cur.apps >= 0.22 * Math.max(1, cur.avail)) settleToPro(s, rng, '1군 정착');
}

export function settleToPro(s: GameState, rng: Rng, why: string): void {
  const e = s.career.entry;
  if (e.step < 1) { e.step = 1; e.trainW = s.week; }
  if (e.step < 2) { e.step = 2; e.squadW = s.week; }
  s.phase = 'pro';
  closeYouthCurrent(s);
  s.yt = null;
  s.goals = makeGoals(s);
  addLog(s, 'milestone', why, `${getClub(s.career.clubId).name} 1군에 자리를 잡았다. 이제 리저브·유스 경기에는 나서지 않는다.`, [], { star: true });
  void rng;
}

export function midSeasonJump(s: GameState, rng: Rng): void {
  const yt = s.yt;
  const e = s.career.entry;
  const season = seasonOf(s.week);
  if (!yt || !s.career.clubId || s.phase !== 'youth' || e.midChecked === season || s.st.injury || s.decision || s.decQueue.length) return;
  e.midChecked = season;
  const stage = s.career.youthStage;
  const up = nextStage(stage);
  if (!up || (up === 'RES' && !s.career.signed)) return;
  const cur = s.career.yCur;
  if (cur.avail < 8 || cur.ratingN < 6) return;
  const margin = curOvr(s.ab) - stageStd(s, s.career.clubId, stage);
  const avg = cur.ratingSum / cur.ratingN;
  const share = cur.apps / Math.max(1, cur.avail);
  if (margin >= 16 && avg >= 7.5 && share >= 0.7 && stage === 'U15') fireEvent(s, rng, getEvent('ys_jump_double'));
  else if (margin >= 9 && avg >= 7.2 && share >= 0.7) fireEvent(s, rng, getEvent('ys_jump_offer'));
}

export function applyJump(s: GameState, rng: Rng, n: number): void {
  const e = s.career.entry;
  let stage = s.career.youthStage;
  for (let i = 0; i < n; i++) {
    const nx = nextStage(stage);
    if (!nx || (nx === 'RES' && !s.career.signed)) break;
    stage = nx;
  }
  if (stage === s.career.youthStage) return;
  const prev = s.career.youthStage;
  closeYouthCurrent(s);
  s.career.youthStage = stage;
  s.career.stageSeasons = 0;
  e.jumps += 1;
  e.jumpW = s.week;
  e.boostEnd = s.week + 16;
  if (stage !== 'U19' && n >= 2) e.doubleJump = true;
  if (STAGE_ORDER.indexOf(stage) - STAGE_ORDER.indexOf(prev) >= 2) e.doubleJump = true;
  setupYouthSeason(s, true);
  openYouthRec(s);
  s.goals = makeGoals(s);
  addLog(s, 'milestone', '월반', `시즌 도중 ${STAGE_LABEL[prev]}에서 ${STAGE_LABEL[stage]}로 올라갔다. 초반에는 출전 시간이 줄지만 성장 속도는 빨라진다.`, [], { star: true });
  void rng;
}

export function expectedGap(s: GameState, age: number): number {
  return age - STAGE_EXPECT[s.career.youthStage];
}

export function youthHeadline(s: GameState): string {
  const e = s.career.entry;
  if (s.phase !== 'youth') return '';
  if (s.career.debuted) return '1군 데뷔';
  if (e.step >= 2) return '1군 명단';
  if (e.step === 1) return '1군 훈련 합류';
  return '';
}
