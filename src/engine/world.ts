import { CONT_SLOTS } from '../data/competitions';
import { isSchoolId } from '../data/schools';
import { getClub, getLeague, leaguesOf, getCountry, type ClubStatic } from './data';
import { Rng } from './rng';
import { stream } from './streams';
import { seasonOf } from './time';
import type { ClubDyn, CountryRT, GameState } from './types';

export function rngOf(s: GameState): Rng {
  return new Rng(s.rng);
}

export function ensureCountry(s: GameState, code: string): CountryRT {
  const cur = seasonOf(s.week);
  let c = s.world.countries[code];
  if (c) {
    if (c.initS < cur) {
      while (c.initS < cur) {
        endSeasonCountry(s, code, '', null);
        c.initS++;
      }
    }
    return c;
  }
  const clubs: Record<string, ClubDyn> = {};
  for (const l of leaguesOf(code)) {
    for (const id of l.clubIds) {
      const cs = getClub(id);
      clubs[id] = { lg: cs.lg0, st: cs.st0, fin: cs.fin0 };
    }
  }
  c = { initS: 0, clubs, qual: {} };
  s.world.countries[code] = c;
  initQual(c, code);
  while (c.initS < cur) {
    endSeasonCountry(s, code, '', null);
    c.initS++;
  }
  return c;
}

function setQual(c: CountryRT, code: string, ranked: string[]): void {
  const slots = CONT_SLOTS[code];
  c.qual = {};
  if (!slots) return;
  let i = 0;
  for (const [comp, n] of slots) {
    for (let j = 0; j < n && i < ranked.length; j++, i++) c.qual[ranked[i]] = comp;
  }
}

function initQual(c: CountryRT, code: string): void {
  const slots = CONT_SLOTS[code];
  c.qual = {};
  if (!slots) return;
  const top = leaguesOf(code)[0];
  const ids = Object.keys(c.clubs).filter((id) => c.clubs[id].lg === top.id).sort((a, b) => c.clubs[b].st - c.clubs[a].st);
  let i = 0;
  for (const [comp, n] of slots) {
    for (let j = 0; j < n && i < ids.length; j++, i++) c.qual[ids[i]] = comp;
  }
}

export function dyn(s: GameState, id: string): ClubDyn {
  const cs = getClub(id);
  if (isSchoolId(id)) return { lg: cs.lg0, st: cs.st0, fin: cs.fin0 };
  return ensureCountry(s, cs.country).clubs[id];
}

export function clubSt(s: GameState, id: string): number {
  return dyn(s, id).st;
}

export function clubLeagueId(s: GameState, id: string): string {
  return dyn(s, id).lg;
}

export function clubLvl(s: GameState, id: string): number {
  const cs = getClub(id);
  const d = dyn(s, id);
  const l = getLeague(d.lg);
  return l.lvl + (cs.elite && d.lg === cs.lg0 && l.elite > 0 ? 1 : 0);
}

export function clubStd(s: GameState, id: string): number {
  const cs: ClubStatic = getClub(id);
  const d = dyn(s, id);
  const lg = getLeague(d.lg);
  const ease = EASE[cs.country] ?? 0;
  if (cs.elite && d.lg === cs.lg0 && lg.elite > 0) return cs.std0 + (d.st - cs.st0) * 0.35 - ease;
  return stdFromLevel(lg.lvl) + (d.st - (lg.top + lg.bottom) / 2) * 0.4 - ease;
}

const EASE: Record<string, number> = { US: 4.5, MX: 4.5, JP: 4.5, CO: 4.5, MA: 4.5, SA: 4.5, HR: 4.5, UY: 4.5, KR: 4.5, BR: 8, TR: 8, AR: 8, NL: 8, PT: 8 };

const STD: Record<number, number> = { 2: 47, 3: 56, 4: 64, 5: 72, 6: 79 };
function stdFromLevel(l: number): number {
  return STD[l] ?? 47;
}

export function membersOf(s: GameState, lgId: string): string[] {
  const lg = getLeague(lgId);
  const c = ensureCountry(s, lg.country);
  const out: string[] = [];
  for (const id in c.clubs) if (c.clubs[id].lg === lgId) out.push(id);
  return out;
}

const roundCache = new Map<string, [string, string][][]>();

export function buildRounds(order: string[]): [string, string][][] {
  const key = order.join('|');
  const hit = roundCache.get(key);
  if (hit) return hit;
  const ids = order.slice();
  if (ids.length % 2 === 1) ids.push('');
  const n = ids.length;
  const half: [string, string][][] = [];
  const arr = ids.slice();
  for (let r = 0; r < n - 1; r++) {
    const round: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a === '' || b === '') continue;
      round.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    half.push(round);
    arr.splice(1, 0, arr.pop() as string);
  }
  const second = half.map((rd) => rd.map(([a, b]) => [b, a] as [string, string]));
  const all = [...half, ...second];
  if (roundCache.size > 300) roundCache.clear();
  roundCache.set(key, all);
  return all;
}

export function gamesOf(s: GameState, lgId: string): number {
  const n = membersOf(s, lgId).length;
  return (n % 2 === 0 ? n - 1 : n) * 2;
}

export function startLeagueSeason(s: GameState, lgId: string): void {
  const rng = stream(s.cfg.seed, `lgs:${lgId}`, seasonOf(s.week));
  const ids = membersOf(s, lgId).sort();
  rng.shuffle(ids);
  const table: Record<string, [number, number, number, number]> = {};
  for (const id of ids) table[id] = [0, 0, 0, 0];
  s.world.leagues[lgId] = { id: lgId, round: 0, order: ids, table };
}

export function simScore(rng: Rng, stH: number, stA: number): [number, number] {
  const d = (stH - stA + 3) / 24;
  const lh = 1.38 * Math.exp(d);
  const la = 1.12 * Math.exp(-d);
  return [rng.poisson(lh), rng.poisson(la)];
}

export function record(s: GameState, lgId: string, h: string, a: string, hg: number, ag: number): void {
  const rt = s.world.leagues[lgId];
  if (!rt) return;
  const th = rt.table[h];
  const ta = rt.table[a];
  if (!th || !ta) return;
  th[1] += hg; th[2] += ag; th[3]++;
  ta[1] += ag; ta[2] += hg; ta[3]++;
  if (hg > ag) th[0] += 3;
  else if (hg < ag) ta[0] += 3;
  else { th[0]++; ta[0]++; }
}

export function roundRng(s: GameState, tag: string, n: number): Rng {
  return stream(s.cfg.seed, `${tag}:${seasonOf(s.week)}`, n);
}

export function playRoundOthers(s: GameState, lgId: string, round: number, skip: string): [string, string, number, number] | null {
  const rt = s.world.leagues[lgId];
  if (!rt) return null;
  const rounds = buildRounds(rt.order);
  const rd = rounds[round];
  if (!rd) return null;
  const rng = roundRng(s, `lr:${lgId}`, round);
  let mine: [string, string, number, number] | null = null;
  for (const [h, a] of rd) {
    const [hg, ag] = simScore(rng, dyn(s, h).st, dyn(s, a).st);
    if (h === skip || a === skip) { mine = [h, a, hg, ag]; continue; }
    record(s, lgId, h, a, hg, ag);
  }
  return mine;
}

export function ranking(s: GameState, lgId: string): string[] {
  const rt = s.world.leagues[lgId];
  const ids = rt.order.slice();
  ids.sort((a, b) => {
    const ta = rt.table[a];
    const tb = rt.table[b];
    if (tb[0] !== ta[0]) return tb[0] - ta[0];
    const gda = ta[1] - ta[2];
    const gdb = tb[1] - tb[2];
    if (gdb !== gda) return gdb - gda;
    if (tb[1] !== ta[1]) return tb[1] - ta[1];
    return a < b ? -1 : 1;
  });
  return ids;
}

export function positionOf(s: GameState, lgId: string, clubId: string): number {
  const rt = s.world.leagues[lgId];
  if (!rt || !rt.table[clubId]) return 0;
  return ranking(s, lgId).indexOf(clubId) + 1;
}

function quickRank(s: GameState, rng: Rng, lgId: string): string[] {
  const c = s.world.countries[getLeague(lgId).country];
  const ids: string[] = [];
  for (const id in c.clubs) if (c.clubs[id].lg === lgId) ids.push(id);
  const sc: Record<string, number> = {};
  for (const id of ids) sc[id] = c.clubs[id].st + rng.normal(0, 5.5);
  return ids.sort((a, b) => sc[b] - sc[a]);
}

export interface SeasonEndInfo {
  ranks: Record<string, string[]>;
  promoted: string[];
  relegated: string[];
}

export function endSeasonCountry(s: GameState, code: string, playerLg: string, finalRank: string[] | null): SeasonEndInfo {
  const c = s.world.countries[code];
  const rng = stream(s.cfg.seed, `cend:${code}`, c.initS);
  const lgs = leaguesOf(code);
  const ranks: Record<string, string[]> = {};
  for (const l of lgs) ranks[l.id] = l.id === playerLg && finalRank ? finalRank : quickRank(s, rng, l.id);
  const promoted: string[] = [];
  const relegated: string[] = [];
  setQual(c, code, ranks[lgs[0].id]);
  for (const l of lgs) {
    const r = ranks[l.id];
    const n = r.length;
    r.forEach((id, i) => {
      const d = c.clubs[id];
      const top = i < n / 3 ? 0.9 : i >= (2 * n) / 3 ? -0.9 : 0;
      const cs = getClub(id);
      d.st += 0.22 * (cs.st0 - d.st) + rng.normal(0, 2.2) + top;
    });
  }
  for (let i = 0; i + 1 < lgs.length; i++) {
    const U = lgs[i];
    const L = lgs[i + 1];
    const n = Math.min(L.up, U.down);
    if (n <= 0) continue;
    const down = ranks[U.id].slice(-n);
    const up = ranks[L.id].slice(0, n);
    for (const id of down) { c.clubs[id].lg = L.id; relegated.push(id); }
    for (const id of up) { c.clubs[id].lg = U.id; promoted.push(id); }
  }
  return { ranks, promoted, relegated };
}

export function countryOfClub(id: string): string {
  return getClub(id).country;
}

export function nationBase(code: string): number {
  return getCountry(code).natBase;
}
