import { AGE_TOURNAMENTS, ageEligible, ageHeld, type AgeTournament } from '../data/competitions';
import { Rng, clamp } from './rng';
import { curOvr } from './attributes';
import { getCountry } from './data';
import { addLog, toast } from './log';
import { applyFx } from './fx';
import { fireEvent, getEvent } from './events';
import { playPlayerMatch, playTeamOnly, natTeamBase } from './match';
import { awardPrize, awardTrophy, trigMoment } from './season';
import { yearOf } from './time';
import type { Fixture, GameState } from './types';

const GROUP_WEEKS = 3;
const ADJ: Record<string, number> = { u17: -12, u20: -7, u23: -4 };

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function flagKey(t: AgeTournament, year: number): string {
  return `A:${t.id}:${year}`;
}

export function tournamentLength(t: AgeTournament): number {
  return GROUP_WEEKS + t.stages.length - 1;
}

function stageLabel(t: AgeTournament, idx: number): string {
  if (idx < GROUP_WEEKS) return `${t.ko} 조별리그`;
  return `${t.ko} ${t.stages[Math.min(t.stages.length - 1, idx - GROUP_WEEKS + 1)]}`;
}

function callScore(s: GameState, t: AgeTournament): number {
  const base = natTeamBase(s.p.country) + ADJ[t.level];
  const form = s.st.form.length ? s.st.form.reduce((a, b) => a + b, 0) / s.st.form.length : 6.3;
  const stageBonus = s.phase === 'pro' ? 0.8 : s.career.track === 'school' ? -0.3 : s.career.entry.step >= 1 ? 0.5 : 0;
  return (curOvr(s.ab) - (base - 18)) / 3 + (form - 6.3) * 0.6 + Math.min(1, s.nat.youthCaps * 0.15) + stageBonus + s.fame.dom / 100;
}

function qualifies(s: GameState, t: AgeTournament, year: number, rng: Rng): boolean {
  const c = getCountry(s.p.country);
  if (t.kind === 'cont') return true;
  if (t.id === 'ASIAD') return rng.chance(0.85);
  if (t.id === 'OLY') return rng.chance(logistic((c.natBase - 62) / 6));
  const cont = AGE_TOURNAMENTS.find((x) => x.kind === 'cont' && x.confed === c.confed && x.level === t.level);
  const reach = cont && ageHeld(cont, year) ? s.ev.flags[`${flagKey(cont, year)}:reach`] : undefined;
  if (reach !== undefined) return reach >= 1;
  return rng.chance(logistic((c.natBase - 60) / 5));
}

function clubRefuseP(s: GameState): number {
  if (s.phase === 'pro') return clamp(0.08 + 0.15 * ({ starter: 3, rotation: 2, prospect: 1, backup: 0 }[s.career.contract?.role ?? 'backup']), 0.05, 0.6);
  return s.career.signed ? 0.15 : 0.04;
}

function recordEnd(s: GameState, t: AgeTournament, year: number, result: string, rng: Rng): void {
  const key = flagKey(t, year);
  const apps = s.ev.flags[`${key}:apps`] ?? 0;
  const goals = s.ev.flags[`${key}:goals`] ?? 0;
  const assists = s.ev.flags[`${key}:assists`] ?? 0;
  const awards: string[] = [];
  if (apps > 0) {
    const rs = (s.ev.flags[`${key}:rs`] ?? 0) / apps;
    const deep = result === '우승' || result === '준우승' || result === '3위' || result === '4강';
    const give = (n: string) => { awards.push(n); awardPrize(s, `${t.ko} ${n}`, 1.5); };
    if (goals >= 4 && rng.chance(0.55)) give('골든부트');
    if (deep && rs >= 7.4 && rng.chance(0.45)) give('골든볼');
    if (s.ab.pos === 'GK' && deep && (s.ev.flags[`${key}:cs`] ?? 0) >= 2 && rng.chance(0.5)) give('골든글러브');
    const lvl = t.level === 'u17' ? 1.2 : t.level === 'u20' ? 1.8 : 2.2;
    const depth = result === '우승' ? 2 : result === '준우승' ? 1.5 : result === '3위' || result === '4강' ? 1 : result === '8강' ? 0.6 : 0.3;
    const perf = clamp((rs - 6) * 0.8 + goals * 0.15, 0, 3);
    s.fame.abroad = clamp(s.fame.abroad + lvl * (depth + perf) * 0.6, 0, 100);
    s.fame.dom = clamp(s.fame.dom + lvl * (depth + perf) * 0.4, 0, 100);
  }
  const inSquad = s.ev.flags[`${key}:squad`] === 1;
  if (inSquad) s.nat.ageRecs.push({ year, id: t.id, name: t.ko, result, apps, goals, assists, awards });
  addLog(s, inSquad ? 'milestone' : 'world', t.ko, `${getCountry(s.p.country).natTeam}은(는) ${year} ${t.ko}에서 ${result}${inSquad ? ` (${s.p.name} ${apps}경기 ${goals}골 ${assists}도움)` : ''}.`, [], { star: inSquad });
  if (inSquad) toast(s, `${t.ko} ${result}`);
  medalCheck(s, rng, t, result, inSquad && apps > 0);
}

function medalCheck(s: GameState, rng: Rng, t: AgeTournament, result: string, played: boolean): void {
  if (t.kind !== 'multi' || s.p.country !== 'KR' || s.life.mil === 'exempt' || s.life.mil === 'done' || s.life.mil === 'serving') return;
  const gold = result === '우승';
  const medal = t.id === 'OLY' ? gold || result === '준우승' || result === '3위' : gold;
  const tried = s.ev.flags.mil_medal !== undefined;
  if (played && medal) {
    s.life.mil = 'exempt';
    addLog(s, 'milestone', '병역 특례', `${t.ko} ${result}으로 병역 특례를 받았다.`, [], { star: true });
    return;
  }
  if (tried) {
    delete s.ev.flags.mil_medal;
    applyFx(s, { rng }, 'fu:kr_mil_force@12-24 morale-4 stress+4');
  }
}

export function ageTournamentWeek(s: GameState, rng: Rng, sw: number): void {
  if (!s.career.clubId || s.career.retired || (s.phase !== 'youth' && s.phase !== 'pro')) return;
  const year = yearOf(s.week);
  const c = getCountry(s.p.country);
  for (const t of AGE_TOURNAMENTS) {
    if (t.confed !== 'ALL' && t.confed !== c.confed) continue;
    const idx = sw - t.sw;
    if (idx < 0 || idx >= tournamentLength(t) || !ageHeld(t, year)) continue;
    const key = flagKey(t, year);
    const f = s.ev.flags;
    if (idx === 0 && !(key in f)) {
      f[key] = s.week;
      f[`${key}:q`] = qualifies(s, t, year, rng) ? 1 : 0;
      f[`${key}:alive`] = f[`${key}:q`];
      f[`${key}:pts`] = 0;
      const age = year - s.p.birth.y;
      const eligible = ageEligible(t, s.p.birth.y, year);
      const wild = !eligible && t.wild > 0 && age <= t.ageMax + 8 && curOvr(s.ab) >= natTeamBase(s.p.country) - 10 && rng.chance(0.12);
      const roll = (eligible || wild) && !s.st.injury ? rng.next() < logistic(callScore(s, t) - (wild ? 1.5 : 0)) : false;
      f[`${key}:squad`] = roll ? 1 : 0;
      if (f[`${key}:q`]) {
        addLog(s, 'world', t.ko, `${year} ${t.ko}이(가) 개막했다. ${c.natTeam}이(가) 출전한다.`, []);
        if (roll) {
          s.nat.status = s.nat.status === 'senior' ? 'senior' : 'youth';
          s.nat.youthCaps += 1;
          if (t.kind !== 'cont' && rng.chance(clubRefuseP(s))) {
            f[`${key}:squad`] = 0;
            f.ageRefuse = s.week;
            f.ageRefuseKey = [...AGE_TOURNAMENTS].findIndex((x) => x.id === t.id) * 10000 + year;
            fireEvent(s, rng, getEvent('nat_youth_refuse'));
          } else addLog(s, 'milestone', t.ko, `${year} ${t.ko} 대표팀 명단에 이름을 올렸다.${wild ? ' 와일드카드 선발이다.' : ''}`, [], { star: true });
        }
      } else addLog(s, 'world', t.ko, `${c.natTeam}은(는) ${year} ${t.ko} 본선 진출에 실패했다.`, []);
    }
    if (f[`${key}:alive`] !== 1) continue;
    const grp = idx < GROUP_WEEKS;
    const koIdx = idx - GROUP_WEEKS;
    const label = stageLabel(t, idx);
    const final = !grp && koIdx === t.stages.length - 2;
    const adj = ADJ[t.level];
    const mySt = c.natBase + adj;
    const oppSt = clamp(60 + adj + rng.normal(0, 8) + (grp ? 0 : 3 + koIdx * 2.2), 25, 92);
    const fx: Fixture = { w: sw, comp: label, kind: 'intl', opp: '상대', oppSt, ko: !grp, stage: label, home: false, big: false, final, round: -1, oppId: '' };
    const inSquad = f[`${key}:squad`] === 1 && !s.st.injury;
    let res: 'W' | 'D' | 'L';
    if (inSquad) {
      const std = t.level === 'u23' ? c.natBase - 8 : c.natBase * 0.5 + 6 + (t.level === 'u20' ? 3 : 0) - 9;
      const out = playPlayerMatch(s, rng, fx, s.phase === 'youth', { mySt, std });
      f.intlAway = s.week;
      if (out.played) {
        f[`${key}:apps`] = (f[`${key}:apps`] ?? 0) + 1;
        f[`${key}:goals`] = (f[`${key}:goals`] ?? 0) + out.goals;
        f[`${key}:assists`] = (f[`${key}:assists`] ?? 0) + out.assists;
        f[`${key}:rs`] = (f[`${key}:rs`] ?? 0) + out.rating;
        if (out.cs) f[`${key}:cs`] = (f[`${key}:cs`] ?? 0) + 1;
      }
      trigMoment(s, rng, out, s.phase === 'youth' ? 'y' : 'f');
      res = out.result;
    } else res = playTeamOnly(s, rng, fx, mySt).result;
    if (grp) {
      f[`${key}:pts`] += res === 'W' ? 3 : res === 'D' ? 1 : 0;
      if (idx === GROUP_WEEKS - 1) {
        if (f[`${key}:pts`] < 4) {
          f[`${key}:alive`] = 0;
          f[`${key}:reach`] = 0;
          recordEnd(s, t, year, '조별리그 탈락', rng);
        } else f[`${key}:reach`] = 1;
      }
    } else if (res !== 'W') {
      f[`${key}:alive`] = 0;
      const name = t.stages[Math.min(t.stages.length - 1, koIdx + 1)];
      f[`${key}:reach`] = koIdx + 1;
      let result = `${name} 탈락`;
      if (name === '결승') result = '준우승';
      else if (name === '4강' && rng.chance(0.5)) result = '3위';
      recordEnd(s, t, year, result, rng);
    } else if (final) {
      f[`${key}:alive`] = 0;
      f[`${key}:reach`] = koIdx + 2;
      if (inSquad && f[`${key}:apps`] > 0 && t.kind !== 'cont') awardTrophy(s, `${t.ko} 우승 (${year})`, '');
      recordEnd(s, t, year, '우승', rng);
    }
    if (f[`${key}:alive`] === 1 && !grp) f[`${key}:reach`] = koIdx + 2;
  }
}
