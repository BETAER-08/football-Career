import { AWARDS } from '../data/awards';
import { isSchoolId } from '../data/schools';
import { clubAwards, buildPlayerReview } from './review';
import { settleGoals, makeGoals } from './goals';
import { worldSeasonEnd } from './worldsim';
import { checkDreamSeason } from './dream';
import { isCosmetic } from './flags';
import { recordWhy } from './why';
import { ALL_ATTRS } from './types';
import { pushMatchLine, commentary } from './matchtext';
import { CONT_COMPS, CONT_KO_NAMES, CONT_KO_WEEKS, INTL_WINDOWS, TOURNAMENTS } from '../data/competitions';
import { Rng, clamp } from './rng';
import { curOvr, shownOvr, youthCallMin } from './attributes';
import { addLog, toast } from './log';
import { ageAt, seasonOf, swOf, START_YEAR, yearOf } from './time';
import { clubLvl, clubSt, clubStd, endSeasonCountry, playRoundOthers, ranking, ensureCountry, roundRng, simScore } from './world';
import { getClub, getCountry, getLeague } from './data';
import { playPlayerMatch, playTeamOnly, recordLeagueResult, natTeamBase, type MatchOut } from './match';
import { finishYouthSeason, openYouthSeason, rollListing } from './yleague';
import { buildYouthReview } from './review';
import { setupClubSeason, scheduleCup, updateRole } from './transfer';
import { yearEndFinance, marketValue } from './finance';
import { seasonEndGrowth } from './growth';
import { emptyRec } from './records';
import { getEvent, momentFor, pushDecision, buildDecision, markFired } from './events';
import { calcSeasonScore } from './scoring';
import type { Fixture, GameState } from './types';
import { TRAIT_LABEL } from './player';

export function openSeason(s: GameState): void {
  s.career.seasonMinsAcc = 0;
  s.career.seasonAvailAcc = 0;
  if (s.career.clubId) {
    const club = getClub(s.career.clubId);
    s.career.cur = emptyRec(seasonOf(s.week), s.career.clubId, club.name, '', '', 2, !!s.career.contract?.loanFrom);
    if (isSchoolId(s.career.clubId)) s.career.fixtures.length = 0;
    else setupClubSeason(s, s.career.clubId, false);
    openYouthSeason(s);
    const lvl = clubLvl(s, s.career.clubId);
    s.career.cur.lvl = lvl;
    s.career.maxLvl = Math.max(s.career.maxLvl, lvl);
    if (lvl >= 5) s.career.playedLvl5 = s.career.playedLvl5 || false;
    updateRole(s);
  } else {
    s.career.cur = emptyRec(seasonOf(s.week), '', '', '', '', 2);
    s.career.fixtures.length = 0;
  }
  s.goals = makeGoals(s);
  snapSeason(s);
}

function gamesOfLeague(s: GameState, lg: string): number {
  const rt = s.world.leagues[lg];
  if (!rt) return 0;
  const n = rt.order.length;
  return (n % 2 === 0 ? n - 1 : n) * 2;
}

export interface MatchSummary { out: MatchOut; clubId: string }

export function nextCupOrCont(s: GameState, fx: Fixture, out: MatchOut, clubId: string): void {
  const rng = roundRng(s, `cupn:${clubId}:${fx.kind}`, fx.round + 1);
  const lgId = s.career.cur.leagueId;
  if (fx.kind === 'cup') {
    if (out.result === 'W') {
      if (fx.final) {
        const name = `${fx.comp} 우승`;
        awardTrophy(s, name, clubId);
        s.career.cupAlive = false;
      } else {
        const st = fx.round + 1;
        s.career.cupRound = st;
        scheduleCup(s, rng, clubId, lgId, st);
      }
    } else {
      s.career.cupAlive = false;
    }
  } else if (fx.kind === 'cont') {
    const comp = CONT_COMPS[s.career.contComp];
    if (!comp) return;
    if (fx.stage.startsWith('리그 페이즈')) {
      s.career.contGames += 1;
      s.career.contPts += out.result === 'W' ? 3 : out.result === 'D' ? 1 : 0;
      if (s.career.contGames >= 8) {
        if (s.career.contPts >= comp.advance) {
          const oppSt = comp.mean + 1 + rng.normal(0, comp.sd);
          s.career.fixtures.push({ w: CONT_KO_WEEKS[0], comp: comp.ko, kind: 'cont', opp: `${comp.ko} 16강 상대`, oppSt, ko: true, stage: CONT_KO_NAMES[0], home: rng.chance(0.5), big: false, final: false, round: 0, oppId: '' });
          s.career.fixtures.sort((a, b) => a.w - b.w);
          s.career.contStage = 0;
          toast(s, `${comp.ko} 리그 페이즈 통과! 16강에 진출했다.`);
        } else {
          s.career.contAlive = false;
          addLog(s, 'system', comp.ko, `${comp.ko} 리그 페이즈에서 탈락했다 (승점 ${s.career.contPts}).`, []);
        }
      }
    } else if (out.result === 'W') {
      if (fx.final) {
        awardTrophy(s, `${comp.ko} 우승`, clubId);
        s.career.contAlive = false;
      } else {
        const r = fx.round + 1;
        s.career.contStage = r;
        const oppSt = comp.mean + 2 + r * 2 + rng.normal(0, comp.sd);
        s.career.fixtures.push({ w: CONT_KO_WEEKS[r], comp: comp.ko, kind: 'cont', opp: `${comp.ko} ${CONT_KO_NAMES[r]} 상대`, oppSt, ko: true, stage: CONT_KO_NAMES[r], home: rng.chance(0.5), big: false, final: r === 3, round: r, oppId: '' });
        s.career.fixtures.sort((a, b) => a.w - b.w);
      }
    } else {
      s.career.contAlive = false;
      addLog(s, 'system', comp.ko, `${comp.ko} ${fx.stage}에서 탈락했다.`, []);
    }
  }
}

export function awardTrophy(s: GameState, name: string, clubId: string): void {
  const club = clubId ? getClub(clubId).name : '대표팀';
  const year = START_YEAR + seasonOf(s.week);
  s.career.trophies.push({ year, name, club });
  s.career.cur.trophies.push(name);
  s.fame.dom = clamp(s.fame.dom + 3, 0, 100);
  s.st.morale = clamp(s.st.morale + 8, 0, 100);
  s.st.happy = clamp(s.st.happy + 6, 0, 100);
  s.extra.champs += 1;
  if (isCosmetic()) s.cues.push('trophy');
  addLog(s, 'milestone', '트로피', `${club}에서 ${name}을(를) 들어 올렸다!`, [], { star: true });
  toast(s, `🏆 ${name}`);
}

export function awardPrize(s: GameState, name: string, pts = 0): void {
  const year = START_YEAR + seasonOf(s.week);
  s.career.awards.push({ year, name });
  s.career.cur.awards.push(name);
  s.fame.dom = clamp(s.fame.dom + 2.5 + pts, 0, 100);
  s.fame.abroad = clamp(s.fame.abroad + 1.5 + pts, 0, 100);
  s.st.happy = clamp(s.st.happy + 5, 0, 100);
  if (isCosmetic()) s.cues.push('trophy');
  addLog(s, 'milestone', '개인상', `${name} 수상!`, [], { star: true });
  toast(s, `🏅 ${name}`);
}

export function trigMoment(s: GameState, rng: Rng, out: MatchOut, tier = 'f'): void {
  if (!out.moment) return;
  const def = momentFor(s, out.moment);
  if (!def) return;
  markFired(s, def);
  s.decCtx = { opp: out.fx.opp, tier };
  const d = buildDecision(s, rng, def);
  d.ctx = isCosmetic() ? commentary(s, out) : out.line;
  pushDecision(s, d);
}

function namesFor(s: GameState, fx: Fixture, out: MatchOut): void {
  const me = getClub(s.career.clubId).name;
  out.homeName = fx.home ? me : fx.opp;
  out.awayName = fx.home ? fx.opp : me;
  out.line = `${out.homeName} ${out.hg}-${out.ag} ${out.awayName}${out.pens ? (out.penWin ? ' (승부차기 승)' : ' (승부차기 패)') : ''}`;
}

function afterPlayed(s: GameState, rng: Rng, fx: Fixture, out: MatchOut): void {
  if (out.played && fx.kind !== 'friendly') {
    const bm = s.career.cur.best;
    if (!bm || out.rating > bm.rating) s.career.cur.best = { w: s.week, rating: out.rating, line: out.line, comp: `${fx.comp} ${fx.stage}`, goals: out.goals, assists: out.assists, mins: out.mins, result: out.result, momentText: bm ? bm.momentText : undefined };
    if (isCosmetic() && (out.goals > 0 || out.assists > 0)) s.cues.push('goal');
  }
  pushMatchLine(s, fx, out);
  if (out.played && fx.kind !== 'friendly') {
    const notable = out.firstPro || out.goals >= 2 || out.rc > 0 || out.rating >= 9 || fx.final || (out.goals >= 1 && s.career.cur.goals === 1) || (out.started && s.career.cur.starts === 1);
    if (notable) {
      const bits: string[] = [];
      if (out.firstPro) bits.push('1군 데뷔전');
      if (out.goals >= 3) bits.push('해트트릭');
      else if (out.goals === 2) bits.push('멀티골');
      else if (out.goals === 1 && s.career.cur.goals === 1) bits.push('시즌 첫 골');
      if (out.rc > 0) bits.push('퇴장');
      if (fx.final) bits.push(`${fx.stage}`);
      if (out.rating >= 9) bits.push(`평점 ${out.rating.toFixed(1)}`);
      addLog(s, 'match', `${fx.comp} ${fx.stage}`, `${out.line}. ${bits.join(' · ')}. ${out.mins}분 출전, ${out.goals}골 ${out.assists}도움.`, [], { star: out.firstPro || out.goals >= 3, tier: 'f' });
    }
  }
  if (out.firstPro && out.played) s.ev.flags.pro_debut = s.week;
  if (out.goals > 0 && !s.ev.flags.first_goal && s.phase !== 'youth' && out.played) {
    s.ev.flags.first_goal = s.week;
    addLog(s, 'milestone', '프로 데뷔골', `${out.line}. 데뷔골을 터뜨렸다!`, [], { star: true });
  }
  if (out.played && s.career.bigClub && s.career.cur.lvl >= 5 && (fx.kind === 'league' || fx.kind === 'cup' || fx.kind === 'cont')) {
    s.career.lvl5Apps += 1;
    if (s.career.lvl5Apps >= 5) s.career.playedLvl5 = true;
  }
  trigMoment(s, rng, out);
}

function playFirstTeamAsYouth(s: GameState, rng: Rng, fx: Fixture, pre: { hg: number; ag: number } | undefined): void {
  const clubId = s.career.clubId;
  const lgId = s.career.cur.leagueId;
  if (fx.kind === 'friendly' || fx.kind === 'intl') return;
  const mySt = clubSt(s, clubId);
  let p: { hg: number; ag: number; penWin?: boolean } | undefined = pre;
  if (fx.kind !== 'league') {
    const rr = roundRng(s, `fc:${fx.kind}:${clubId}`, fx.round * 3 + (fx.kind === 'cont' ? 1 : 0));
    const [hg, ag] = fx.home ? simScore(rr, mySt, fx.oppSt) : simScore(rr, fx.oppSt, mySt);
    p = { hg, ag, penWin: rr.chance(0.5 + (mySt - fx.oppSt) / 200) };
  }
  const listed = s.ev.flags.intlAway === s.week ? false : rollListing(s, rng);
  const out = listed && s.career.signed ? playPlayerMatch(s, rng, fx, false, { pre: p, bench: true, mySt }) : playTeamOnly(s, rng, fx, mySt, p);
  if (!out.played) namesFor(s, fx, out);
  if (fx.kind === 'league') recordLeagueResult(s, lgId, clubId, fx, out);
  else nextCupOrCont(s, fx, out, clubId);
  s.career.cur.avail += 1;
  if (!listed) return;
  afterPlayed(s, rng, fx, out);
}

export function playFixtureToday(s: GameState, rng: Rng, fx: Fixture, youth: boolean): void {
  const clubId = s.career.clubId;
  const lgId = s.career.cur.leagueId;
  let mine: [string, string, number, number] | null = null;
  if (fx.kind === 'league') {
    const rt = s.world.leagues[lgId];
    if (rt) {
      mine = playRoundOthers(s, lgId, fx.round, clubId);
      rt.round = fx.round + 1;
    }
  }
  const pre = mine ? { hg: mine[2], ag: mine[3] } : undefined;
  if (youth) {
    playFirstTeamAsYouth(s, rng, fx, pre);
    return;
  }
  let out: MatchOut;
  if (s.phase === 'coach' || s.ev.flags.intlAway === s.week) out = playTeamOnly(s, rng, fx, clubSt(s, clubId), pre);
  else out = playPlayerMatch(s, rng, fx, false, pre ? { pre } : {});
  if (fx.kind === 'league') recordLeagueResult(s, lgId, clubId, fx, out);
  if (fx.kind === 'cup' || fx.kind === 'cont') nextCupOrCont(s, fx, out, clubId);
  s.career.cur.avail += fx.kind === 'friendly' ? 0 : 1;
  if (s.ev.flags.intlAway === s.week) return;
  afterPlayed(s, rng, fx, out);
}

export function matchesThisWeek(s: GameState, sw: number): Fixture[] {
  const list = s.career.fixtures;
  const out: Fixture[] = [];
  for (let i = 0; i < list.length; i++) if (list[i].w === sw) out.push(list[i]);
  if (out.length) {
    s.career.fixtures = list.filter((f) => f.w !== sw);
  }
  return out;
}

export function trainingWeekLoad(s: GameState): void {
  const st = s.st;
  const rec = 3 + s.ab.a.recovery * 0.5 + st.sleep / 40 + (s.fin.trainer > 0 ? 0.8 : 0) + (s.fin.nutritionist > 0 ? 0.5 : 0);
  const load = 3.3 + (s.phase === 'youth' ? 0.2 : 0);
  st.fatigue = clamp(st.fatigue + load - rec + (st.fatigue > 70 ? 0 : 0), 0, 100);
  if (!s.st.injury) st.sharp = clamp(st.sharp - 1.2, 20, 100);
  st.stress = clamp(st.stress + (st.stress > 45 ? -0.7 : 0.2) + (s.fin.debt > 0 ? 0.1 : 0), 0, 100);
  st.morale += (55 - st.morale) * 0.03;
  st.happy += (58 + (s.fin.cash > 0 ? 2 : 0) - st.happy) * 0.025;
  if (st.stress > 75) st.burnout = clamp(st.burnout + 0.6, 0, 100);
  else st.burnout = clamp(st.burnout - 0.4, 0, 100);
  if (st.fatigue > 85 || st.burnout > 70) st.morale = clamp(st.morale - 0.4, 0, 100);
  const age = ageAt(s.p.birth, s.week);
  const drinkUp = age >= 18 ? (s.hid.social > 60 ? 0.22 : 0.06) + (st.stress > 65 ? 0.1 : 0) : 0;
  st.drink = clamp(st.drink + drinkUp - 0.1 - (s.fin.psychCoach > 0 ? 0.05 : 0), 0, 100);
  st.sleep = clamp(st.sleep + (72 - st.stress * 0.45 - st.drink * 0.3 + (s.fin.housing === 'own' ? 4 : 0) - st.sleep) * 0.02, 0, 100);
  st.diet = clamp(st.diet + (s.fin.nutritionist > 0 ? 0.1 : 0) - (st.stress > 70 ? 0.05 : 0) + (50 + s.hid.pro * 0.2 - st.diet) * 0.005, 0, 100);
  st.health = clamp(st.health + (st.injury ? 0 : 0.35), 0, 100);
}

function nearestOpp(s: GameState, rng: Rng): { name: string; st: number } {
  const st = clamp(60 + rng.normal(0, 9), 25, 92);
  return { name: '상대 대표팀', st };
}

export function playIntl(s: GameState, rng: Rng, label: string, ko = false, final = false): MatchOut {
  const opp = nearestOpp(s, rng);
  const fx: Fixture = { w: swOf(s.week), comp: label, kind: 'intl', opp: opp.name, oppSt: opp.st, ko, stage: label, home: rng.chance(0.5), big: false, final, round: -1, oppId: '' };
  s.nat.caps += 0;
  const out = playPlayerMatch(s, rng, fx, false);
  if (out.played) {
    s.nat.caps += 1;
    s.nat.goals += out.goals;
    if (!s.nat.debut) {
      s.nat.debut = true;
      addLog(s, 'milestone', 'A매치 데뷔', `${getCountry(s.p.country).natTeam} 유니폼을 입고 A매치에 데뷔했다.`, [], { star: true, dream: s.dream === 'national' });
    }
    s.fame.dom = clamp(s.fame.dom + 0.6, 0, 100);
    s.fame.abroad = clamp(s.fame.abroad + 0.3, 0, 100);
  }
  trigMoment(s, rng, out);
  return out;
}

export function natCallScore(s: GameState): number {
  const age = ageAt(s.p.birth, s.week);
  if (age < 18) return -9;
  const ovr = curOvr(s.ab);
  const base = natTeamBase(s.p.country);
  const form = s.st.form.length ? s.st.form.reduce((a, b) => a + b, 0) / s.st.form.length : 6.3;
  const lvl = s.career.clubId ? clubLvl(s, s.career.clubId) : 1;
  const apps = s.career.cur.apps;
  let x = (ovr - (base - 4)) / 3 + (form - 6.5) * 0.7 + s.fame.dom / 80 + (lvl - 3) * 0.2;
  if (s.career.cur.mins < 400 && swOf(s.week) > 20) x -= 0.8;
  if (apps < 3 && swOf(s.week) > 14) x -= 0.6;
  return x;
}

export function intlWindow(s: GameState, rng: Rng, sw: number): void {
  if (!INTL_WINDOWS.includes(sw)) return;
  if (s.st.injury || s.phase !== 'pro' || !s.career.clubId) return;
  const age = ageAt(s.p.birth, s.week);
  if (s.week - s.nat.lastCallW < 6) return;
  const x = natCallScore(s);
  const p = 1 / (1 + Math.exp(-x));
  if (rng.next() < p) {
    s.nat.lastCallW = s.week;
    const id = s.nat.caps === 0 ? 'nat_first_call' : 'nat_call';
    const def = getEvent(id);
    if (!s.people.natcoach) {
      s.people.natcoach = makeNatCoach(s, rng);
    }
    s.decCtx = {};
    pushDecision(s, buildDecision(s, rng, def));
    markFired(s, def);
  } else if (age >= 15 && age <= 20 && s.nat.status !== 'senior' && shownOvr(s.ab, age) >= youthCallMin(natTeamBase(s.p.country))) {
    const ovr = curOvr(s.ab);
    const yb = (ovr - (s.career.clubId ? clubStd(s, s.career.clubId) : 45) + 4) / 5 + s.fame.dom / 100;
    if (rng.next() < 1 / (1 + Math.exp(-yb)) * 0.55) {
      s.nat.youthCaps += 1;
      s.nat.status = 'youth';
      s.fame.dom = clamp(s.fame.dom + 0.8, 0, 100);
      if (s.nat.youthCaps === 1) addLog(s, 'milestone', '연령별 대표팀', `${getCountry(s.p.country).natTeam} 연령별 대표팀에 선발됐다.`, [], { star: true });
      else toast(s, '연령별 대표팀 소집에 응했다.');
    }
  }
}

import { makePerson } from './relations';
function makeNatCoach(s: GameState, rng: Rng) {
  return makePerson(rng, s.ev, 'natcoach', s.p.country, { age: rng.int(45, 66), refYear: yearOf(s.week), job: '대표팀 감독', rel: 0 });
}

export function tournamentWeek(s: GameState, rng: Rng, sw: number): void {
  if (sw < 44 || sw > 51) return;
  const year = yearOf(s.week);
  const c = getCountry(s.p.country);
  for (const t of TOURNAMENTS) {
    if (t.confed !== 'ALL' && t.confed !== c.confed) continue;
    if (year < t.firstYear || (year - t.firstYear) % t.every !== 0) continue;
    const key = `T:${t.id}:${year}`;
    if (sw === 44 && !(key in s.ev.flags)) {
      const qualP = t.id === 'WC' ? 1 / (1 + Math.exp(-(c.natBase - 66) / 5)) : 1 / (1 + Math.exp(-(c.natBase - 58) / 6));
      s.ev.flags[key] = s.week;
      s.ev.flags[`${key}:q`] = rng.chance(qualP) ? s.week : -1;
      if (s.ev.flags[`${key}:q`] >= 0) addLog(s, 'system', t.ko, `${c.natTeam}이(가) ${year} ${t.ko} 본선에 진출했다.`, []);
      else if (s.nat.caps > 0 || natCallScore(s) > 0) addLog(s, 'system', t.ko, `${c.natTeam}은(는) ${year} ${t.ko} 본선 진출에 실패했다.`, []);
    }
    if (s.ev.flags[`${key}:q`] === undefined || s.ev.flags[`${key}:q`] < 0) continue;
    const stageIdx = sw - 44;
    const alive = s.ev.flags[`${key}:alive`];
    if (stageIdx === 0 && alive === undefined) {
      s.ev.flags[`${key}:alive`] = 1;
      s.ev.flags[`${key}:pts`] = 0;
    }
    if (s.ev.flags[`${key}:alive`] !== 1) continue;
    const age = ageAt(s.p.birth, s.week);
    const x = natCallScore(s) + 0.6;
    const inSquad = age >= 18 && !s.st.injury && (s.ev.flags[`${key}:squad`] !== undefined ? s.ev.flags[`${key}:squad`] === 1 : (() => { const v = rng.next() < 1 / (1 + Math.exp(-x)) ? 1 : 0; s.ev.flags[`${key}:squad`] = v; return v === 1; })());
    const grp = stageIdx < 3;
    const stagesKo = t.stages.length - 1;
    const koIdx = stageIdx - 3;
    const label = grp ? `${t.ko} 조별리그` : `${t.ko} ${t.stages[Math.min(t.stages.length - 1, t.stages.length - stagesKo + koIdx)]}`;
    const finalStage = !grp && koIdx === stagesKo - 1;
    const strength = natTeamBase(s.p.country);
    const oppSt = clamp(62 + rng.normal(0, 8) + (grp ? 0 : 3 + koIdx * 2.2), 35, 95);
    let res: 'W' | 'D' | 'L';
    if (inSquad) {
      const fx: Fixture = { w: sw, comp: label, kind: 'intl', opp: '상대', oppSt, ko: !grp, stage: label, home: false, big: false, final: finalStage, round: -1, oppId: '' };
      const out = playPlayerMatch(s, rng, fx, false);
      if (out.played) { s.nat.caps += 1; s.nat.goals += out.goals; if (!s.nat.debut) s.nat.debut = true; }
      trigMoment(s, rng, out);
      res = out.result;
    } else {
      const fx: Fixture = { w: sw, comp: label, kind: 'intl', opp: '상대', oppSt, ko: !grp, stage: label, home: false, big: false, final: finalStage, round: -1, oppId: '' };
      const o = playTeamOnly(s, rng, fx, strength);
      res = o.result;
    }
    const resultWin = res === 'W';
    if (grp) {
      s.ev.flags[`${key}:pts`] += res === 'W' ? 3 : res === 'D' ? 1 : 0;
      if (stageIdx === 2) {
        if (s.ev.flags[`${key}:pts`] < 4) {
          s.ev.flags[`${key}:alive`] = 0;
          addLog(s, 'system', t.ko, `${c.natTeam}은(는) ${t.ko} 조별리그에서 탈락했다.`, []);
        }
      }
    } else if (!resultWin) {
      s.ev.flags[`${key}:alive`] = 0;
      addLog(s, 'system', t.ko, `${c.natTeam}은(는) ${t.ko} ${t.stages[Math.min(t.stages.length - 1, t.stages.length - stagesKo + koIdx)]}에서 탈락했다.`, []);
    } else if (finalStage) {
      s.ev.flags[`${key}:alive`] = 0;
      if (inSquad) awardTrophy(s, `${t.ko} 우승 (${year})`, '');
      else addLog(s, 'system', t.ko, `${c.natTeam}이(가) ${t.ko}에서 우승했다!`, []);
      s.ev.flags[`T:won:${t.id}:${year}`] = s.week;
    }
    if (sw === 44 && inSquad) {
      s.nat.tournaments.push(`${year} ${t.ko}`);
      if (t.id === 'WC') s.nat.wcCount += 1;
      s.fame.abroad = clamp(s.fame.abroad + 2, 0, 100);
    }
  }
}

export function endSeason(s: GameState, rng: Rng): void {
  const age = ageAt(s.p.birth, s.week);
  const cur = s.career.cur;
  const clubId = s.career.clubId;
  const season = seasonOf(s.week);
  const lgId = cur.leagueId;
  const country = clubId ? getClub(clubId).country : s.p.country;
  const rt = s.world.leagues[lgId];
  let finalRank: string[] | null = null;
  if (clubId && rt) {
    finalRank = ranking(s, lgId);
    cur.pos = finalRank.indexOf(clubId) + 1;
    s.career.lastSeasonPos = cur.pos;
    if (cur.pos === 1 && s.phase !== 'youth') awardTrophy(s, `${getLeague(lgId).ko} 우승`, clubId);
  }
  const games = clubId ? gamesOfLeague(s, lgId) : 0;
  const yth = s.phase === 'youth' && !!s.yt;
  if (yth) finishYouthSeason(s, rng);
  const shareGames = yth && s.yt ? s.yt.games : games;
  const shareMins = yth ? s.career.yCur.mins + cur.mins : cur.mins;
  s.ab.playShare = clamp(0.6 * s.ab.playShare + 0.4 * (shareGames > 0 ? shareMins / (shareGames * 90) : 0), 0, 1);
  if (clubId && cur.apps > 0 && s.phase !== 'youth') seasonAwards(s, rng, cur.pos, games, age);
  clubAwards(s);
  const goalRes = settleGoals(s, rng);
  void goalRes;
  worldSeasonEnd(s);
  cur.avail = Math.max(cur.avail, cur.apps);
  if (clubId) {
    if (!cur.done && !(s.phase === 'youth' && cur.apps === 0)) {
      s.career.seasons.push({ ...cur, done: true });
      s.score += calcSeasonScore(s, cur, games);
    }
    cur.done = true;
  }
  if (clubId) {
    const rankSet = finalRank;
    ensureCountry(s, country);
    const info = endSeasonCountry(s, country, lgId, rankSet);
    s.world.countries[country].initS = season + 1;
    if (info.promoted.includes(clubId)) addLog(s, 'milestone', '승격', `${getClub(clubId).name}이(가) 상위 리그로 승격했다!`, [], { star: true });
    if (info.relegated.includes(clubId)) addLog(s, 'milestone', '강등', `${getClub(clubId).name}이(가) 강등됐다.`, [], { star: true });
  }
  seasonEndGrowth(s, age);
  if (isCosmetic()) for (const k of ALL_ATTRS) recordWhy(s, `attr.${k}`, '시즌 훈련·성장', s.ab.a[k] - s.ab.prev[k]);
  s.ab.prev = { ...s.ab.a };
  s.hist.push({ s: season, age, ovr: Math.round(curOvr(s.ab) * 10) / 10, val: s.fame.value, fame: Math.round(s.fame.dom) });
  s.career.seasonMinsAcc = 0;
  s.career.seasonAvailAcc = 0;
  checkTraits(s);
  yearEndFinance(s, rng);
  s.fame.value = marketValue(s);
  s.fame.peakValue = Math.max(s.fame.peakValue, s.fame.value);
  s.fame.peakFame = Math.max(s.fame.peakFame, s.fame.dom);
  s.fame.dom = clamp(s.fame.dom * 0.97, 0, 100);
  s.fame.abroad = clamp(s.fame.abroad * 0.97, 0, 100);
  agePeople(s, rng);
  s.st.chronic = Object.fromEntries(Object.entries(s.st.chronic).map(([k, v]) => [k, Math.max(0, v - 0.25)]).filter(([, v]) => (v as number) > 0));
  checkDreamSeason(s);
  if (yth) buildYouthReview(s);
  else buildPlayerReview(s);
}

export function snapSeason(s: GameState): void {
  s.snap = { ovr: curOvr(s.ab), val: s.fame.value, wage: s.career.contract ? s.career.contract.wage : s.coach.contract ? s.coach.contract.wage : 0, fame: s.phase === 'coach' ? s.coach.fame : s.fame.dom, standing: s.coach.standing };
}

export function seasonAwards(s: GameState, rng: Rng, pos: number, games: number, age: number): void {
  const cur = s.career.cur;
  const lvl = cur.lvl;
  const avg = cur.ratingN ? cur.ratingSum / cur.ratingN : 0;
  const frac = cur.mins / Math.max(1, games * 90);
  const lg = getLeague(cur.leagueId);
  if (cur.goals >= 8 && frac >= 0.4 && s.ab.pos !== 'GK') {
    const top = rng.normal(15 + 2.2 * lvl, 3.2) * (games / 34);
    if (cur.goals >= top) awardPrize(s, `${lg.ko} ${AWARDS.topScorer}`, lvl * 0.3);
  }
  if (cur.assists >= 8 && frac >= 0.4) {
    const top = rng.normal(10 + 1.2 * lvl, 2.5) * (games / 34);
    if (cur.assists >= top) awardPrize(s, `${lg.ko} ${AWARDS.topAssist}`, lvl * 0.2);
  }
  if (avg >= 7.1 && frac >= 0.45 && pos > 0 && pos <= Math.max(3, Math.round(lg.clubs.split(';').length / 4))) {
    const p = clamp((avg - 7) * 0.6 + (pos === 1 ? 0.25 : 0.05), 0, 0.8);
    if (rng.next() < p) awardPrize(s, `${lg.ko} ${AWARDS.leaguePlayer}`, lvl * 0.4);
  }
  if (age <= 21 && avg >= 6.9 && frac >= 0.35) {
    if (rng.next() < clamp((avg - 6.8) * 0.7, 0, 0.7)) awardPrize(s, `${lg.ko} ${AWARDS.youngPlayer}`, lvl * 0.2);
  }
  if (s.ab.pos === 'GK' && cs(cur) >= 12 && frac >= 0.6 && rng.next() < 0.35) awardPrize(s, `${lg.ko} ${AWARDS.goldenGlove}`, lvl * 0.2);
  if (avg >= 7.0 && frac >= 0.5 && rng.next() < clamp((avg - 6.9) * 0.4, 0, 0.5)) awardPrize(s, `${lg.ko} ${AWARDS.bestEleven}`, lvl * 0.15);
}

function cs(c: { cs: number }): number {
  return c.cs;
}

export function checkTraits(s: GameState): void {
  const a = s.ab.a;
  const have = new Set(s.ab.traits);
  const add = (id: string, cond: boolean) => {
    if (cond && !have.has(id) && have.size < 6) {
      have.add(id);
      s.ab.traits = [...have];
      addLog(s, 'milestone', '플레이 특성', `새로운 플레이 특성을 얻었다: ${TRAIT_LABEL[id]}.`, [], {});
    }
  };
  const gk = s.ab.pos === 'GK';
  add('fkSpec', a.freeKicks >= 15);
  add('physical', a.strength >= 15 && a.aggression >= 12 && !gk);
  add('runner', a.pace >= 15 && a.positioning >= 13 && ['ST', 'LW', 'RW', 'AM'].includes(s.ab.pos));
  add('playmaker', a.passing >= 15 && a.vision >= 15 && !gk);
  add('shooter', a.longShots >= 14 && a.shooting >= 14);
  add('aerial', a.heading >= 15 && a.jumping >= 14);
  add('sweeper', gk && a.kicking >= 13 && a.buildUp >= 13);
  add('bigMatch', s.hid.bigGame >= 75);
  add('ambi', a.weakFoot >= 15);
  add('leaderT', a.leadership >= 15);
  add('dribbler', a.dribbling >= 16 && a.agility >= 14);
  add('tackler', a.tackling >= 16);
  add('crosser', a.crossing >= 16);
  add('clutch', s.hid.bigGame >= 85 && a.composure >= 14);
  if (s.hid.injuryProne >= 80 && !have.has('fragile') && have.size < 6) { have.add('fragile'); s.ab.traits = [...have]; }
  if (s.hid.temper >= 85 && !have.has('hothead') && have.size < 6) { have.add('hothead'); s.ab.traits = [...have]; }
  if (s.hid.injuryProne <= 25 && a.recovery >= 14) add('ironman', true);
}

export function agePeople(s: GameState, rng: Rng): void {
  const year = yearOf(s.week) + 1;
  for (const k of Object.keys(s.people)) {
    const p = s.people[k];
    if (p.gone) continue;
    const age = year - p.birthYear;
    if (p.kind === 'mate' || p.kind === 'rival' || p.kind === 'captain' || p.kind === 'friend') {
      if (age < 24) { p.ovr = Math.min(p.pot, p.ovr + rng.int(1, 4)); }
      else if (age > 31) p.ovr = Math.max(30, p.ovr - rng.int(0, 2));
      if (age >= 35 && rng.chance(0.4)) { p.gone = true; p.note = '은퇴'; }
    }
  }
}
