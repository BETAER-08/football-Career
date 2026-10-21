import { AWARDS } from '../data/awards';
import { CONT_COMPS, CONT_SLOTS, TOURNAMENTS, type Tournament } from '../data/competitions';
import { LEVEL_STARTER_OVR } from '../data/countries';
import { allClubIds, allCountries, getClub, getCountry, getLeague, leaguesOf } from './data';
import { curOvr } from './attributes';
import { dreamHit } from './dream';
import { isCosmetic } from './flags';
import { addLog, toast } from './log';
import { genName, randomPos } from './relations';
import { Rng, clamp } from './rng';
import { hnorm, stream, wrng } from './streams';
import { seasonOf, yearOf } from './time';
import { clubLeagueId, ranking, simScore } from './world';
import { awardPrize } from './season';
import type { BallonRec, Face, GameState, Person, Pos, SeasonChamps, Star, TournRec, WorldInfo } from './types';

interface Nation { id: string; ko: string; base: number; confed: string; code: string }

const X = (ko: string, base: number, confed: string): Nation => ({ id: `x:${ko}`, ko, base, confed, code: '' });

const EXTRA_NATIONS: Nation[] = [
  ...[['폴란드', 70], ['스위스', 72], ['덴마크', 72], ['스웨덴', 68], ['오스트리아', 70], ['세르비아', 66], ['체코', 66], ['우크라이나', 66], ['벨기에', 76], ['스코틀랜드', 64], ['노르웨이', 64], ['헝가리', 62], ['핀란드', 58], ['루마니아', 62], ['슬로베니아', 58], ['아일랜드', 58]].map(([k, b]) => X(k as string, b as number, 'UEFA')),
  ...[['카메룬', 68], ['알제리', 68], ['튀니지', 66], ['코트디부아르', 70], ['말리', 62], ['남아프리카공화국', 62], ['부르키나파소', 58], ['앙골라', 56], ['가봉', 54], ['기니', 54], ['잠비아', 54], ['탄자니아', 50], ['모잠비크', 50], ['우간다', 52], ['베냉', 50], ['적도기니', 50]].map(([k, b]) => X(k as string, b as number, 'CAF')),
  ...[['호주', 68], ['우즈베키스탄', 62], ['이라크', 60], ['카타르', 62], ['아랍에미리트', 58], ['요르단', 58], ['태국', 52], ['오만', 52], ['바레인', 50], ['팔레스타인', 48], ['레바논', 48], ['시리아', 50], ['키르기스스탄', 46], ['말레이시아', 46]].map(([k, b]) => X(k as string, b as number, 'AFC')),
  ...[['칠레', 66], ['페루', 62], ['에콰도르', 68], ['파라과이', 64], ['베네수엘라', 60], ['볼리비아', 54]].map(([k, b]) => X(k as string, b as number, 'CONMEBOL')),
  ...[['캐나다', 64], ['코스타리카', 60], ['파나마', 58], ['자메이카', 56], ['온두라스', 54], ['엘살바도르', 50], ['아이티', 48], ['쿠바', 44], ['트리니다드토바고', 46], ['과테말라', 48], ['퀴라소', 46], ['수리남', 44]].map(([k, b]) => X(k as string, b as number, 'CONCACAF'))
];

let nationCache: Nation[] | null = null;
function nations(): Nation[] {
  if (nationCache) return nationCache;
  nationCache = [...allCountries().map((c) => ({ id: c.code, ko: c.ko, base: c.natBase, confed: c.confed as string, code: c.code })), ...EXTRA_NATIONS];
  return nationCache;
}

export const CORE_CODES = ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'PT', 'TR', 'HR', 'BR', 'AR', 'CO', 'UY'];

let eliteCache: { lvl6: string[]; lvl5: string[] } | null = null;
function elite(): { lvl6: string[]; lvl5: string[] } {
  if (eliteCache) return eliteCache;
  const lvl6: string[] = [];
  const lvl5: string[] = [];
  for (const id of allClubIds()) {
    const l = getClub(id).lvl0;
    if (l >= 6) lvl6.push(id);
    if (l >= 5) lvl5.push(id);
  }
  eliteCache = { lvl6, lvl5 };
  return eliteCache;
}

function pickClub(rng: Rng, ids: string[]): string {
  return rng.weighted(ids, ids.map((id) => Math.exp(getClub(id).st0 / 12)));
}

function makeStar(rng: Rng, id: number, year: number, young: boolean): Star {
  const cs = getCountry(rng.weighted(allCountries().map((c) => c.code), allCountries().map((c) => c.big + 0.01)));
  const n = genName(rng, cs.code);
  const age = young ? rng.int(18, 20) : rng.weighted([19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33], [2, 4, 6, 8, 9, 9, 9, 8, 8, 7, 6, 5, 4, 3, 2]);
  const base = young ? rng.float(72, 80) : 84 + Math.pow(rng.next(), 1.7) * 11;
  const ovr = Math.round(base * 10) / 10;
  const pot = Math.round(Math.max(ovr, young ? rng.float(86, 95) : ovr + (age < 24 ? rng.float(0, 4) : 0)) * 10) / 10;
  return {
    id, name: n.name, en: n.en, country: cs.code, birthYear: year - age, clubId: pickClub(rng, elite().lvl6), pos: randomPos(rng), ovr, pot, retired: false
  };
}

export function initWorld(seed: string, people: Record<string, Person>, startClubId: string, country: string, startLvl: number, startYear: number): WorldInfo {
  const r = stream(seed, 'init');
  const stars: Star[] = [];
  for (let i = 0; i < 40; i++) stars.push(makeStar(r, i + 1, startYear, false));
  const faces: Face[] = [];
  for (const k of ['mate1', 'mate2', 'mate3', 'rival']) {
    const p = people[k];
    if (!p) continue;
    faces.push({
      key: k, role: k === 'rival' ? 'rival' : 'mate', name: p.name, en: p.en, country, pos: (p.pos || 'CM') as Pos, ovr: p.ovr, pot: p.pot, birthYear: p.birthYear,
      clubId: startClubId, status: 'youth', debutS: -1, caps: 0, injuredS: -1, wedS: -1, coachS: -1, lvl: startLvl, told: ''
    });
  }
  return {
    stars, nextStarId: 41, faces, ballon: [], tourn: [], champs: { s: -1, leagues: {}, cups: {}, cont: {} }, ceremony: null, ceremonyDue: false,
    youthCoach: { name: people.coach ? people.coach.name : '', retireS: r.int(5, 9) },
    feeRec: { club: {}, league: {} }
  };
}

function strOf(s: GameState, id: string): number {
  const cs = getClub(id);
  const c = s.world.countries[cs.country];
  if (c && c.clubs[id]) return c.clubs[id].st;
  return cs.st0;
}

function myClubId(s: GameState): string {
  return s.phase === 'coach' ? s.coach.clubId : s.career.clubId;
}

function rankCountry(s: GameState, code: string, season: number): string[] {
  const top = leaguesOf(code)[0];
  const mine = myClubId(s);
  if (mine && s.world.leagues[top.id] && clubLeagueId(s, mine) === top.id) return ranking(s, top.id);
  const r = wrng(s, 'lg:' + code, season);
  const ids = top.clubIds.slice();
  const sc: Record<string, number> = {};
  for (const id of ids) sc[id] = strOf(s, id) + r.normal(0, 6.3);
  return ids.sort((a, b) => sc[b] - sc[a]);
}

function drawCup(s: GameState, code: string, season: number, mine: string): string {
  const r = wrng(s, 'cup:' + code, season);
  const ids: string[] = [];
  for (const lg of leaguesOf(code).slice(0, 2)) for (const id of lg.clubIds) ids.push(id);
  const pool = mine ? ids.filter((id) => id !== mine) : ids;
  const w = pool.map((id) => Math.exp((strOf(s, id) + r.normal(0, 9)) / 7));
  return pool[r.weightedIndex(w)];
}

export interface WorldCore {
  ranks: Record<string, string[]>;
  champs: SeasonChamps;
}

function computeChamps(s: GameState, season: number, codes: string[]): WorldCore {
  const ranks: Record<string, string[]> = {};
  const champs: SeasonChamps = { s: season, leagues: {}, cups: {}, cont: {} };
  const myTrophies = s.career.cur.trophies;
  const mine = myClubId(s);
  for (const code of codes) {
    ranks[code] = rankCountry(s, code, season);
    champs.leagues[code] = ranks[code][0];
  }
  if (isCosmetic()) {
    for (const code of codes) {
      let won = '';
      for (const l of leaguesOf(code)) if (mine && getClub(mine).country === code && myTrophies.includes(`${l.cup} 우승`)) won = mine;
      champs.cups[code] = won || drawCup(s, code, season, mine && getClub(mine).country === code ? mine : '');
    }
  }
  const comps: Record<string, string[]> = {};
  for (const code of codes) {
    const slots = CONT_SLOTS[code];
    if (!slots) continue;
    let i = 0;
    for (const [comp, n] of slots) {
      for (let j = 0; j < n && i < ranks[code].length; j++, i++) (comps[comp] ??= []).push(ranks[code][i]);
    }
  }
  for (const [comp, ids] of Object.entries(comps)) {
    if (ids.length < 2) continue;
    const info = CONT_COMPS[comp];
    if (mine && myTrophies.includes(`${info.ko} 우승`)) {
      champs.cont[comp] = mine;
      continue;
    }
    const r = wrng(s, 'cont:' + comp, season);
    const out = mine && s.career.contQualified === comp ? mine : '';
    const pool = ids.filter((id) => id !== out);
    const w = pool.map((id) => Math.exp((strOf(s, id) + r.normal(0, 8)) / 5));
    champs.cont[comp] = pool[r.weightedIndex(w)];
  }
  return { ranks, champs };
}

interface Bracket { winner: Nation; runner: Nation; semis: Nation[]; final: string; playerStage: string }

function simTournament(s: GameState, t: Tournament, year: number): Bracket | null {
  const r = wrng(s, 'tourn:' + t.id, year);
  const pc = s.p.country;
  const key = `T:${t.id}:${year}`;
  const flagQ = s.ev.flags[`${key}:q`];
  const mine = flagQ !== undefined && flagQ >= 0;
  const all = nations();
  const ofConf = all.filter((n) => t.confed === 'ALL' || n.confed === t.confed);
  const rating = (n: Nation) => n.base + hnorm(`${s.cfg.seed}|${n.id}|${year}`) * 3.5 + r.normal(0, 1);
  const pool = ofConf.slice().sort((a, b) => rating(b) - rating(a));
  const field: Nation[] = [];
  const mineNation = all.find((n) => n.id === pc);
  if (mine && mineNation && !pool.slice(0, t.teams).includes(mineNation)) field.push(mineNation);
  for (const n of pool) if (field.length < t.teams && !field.includes(n)) field.push(n);
  if (field.length < t.teams) {
    for (const n of all.filter((x) => !ofConf.includes(x)).sort((a, b) => rating(b) - rating(a))) {
      if (field.length >= t.teams) break;
      if (!field.includes(n)) field.push(n);
    }
  }
  const str = (n: Nation) => n.base + hnorm(`${s.cfg.seed}|${n.id}|${year}|f`) * 2.5;
  const koRounds = t.stages.length - 1;
  const stage = mine ? (s.ev.flags[`${key}:stage`] ?? -1) : -1;
  const champ = mine && s.ev.flags[`T:won:${t.id}:${year}`] !== undefined;
  const sorted = field.slice().sort((a, b) => str(b) - str(a));
  const G = Math.floor(field.length / 4);
  const pots: Nation[][] = [];
  for (let p = 0; p < 4; p++) pots.push(sorted.slice(p * G, (p + 1) * G));
  const groups: Nation[][] = Array.from({ length: G }, () => []);
  for (const pot of pots) {
    const sh = r.shuffle(pot.slice());
    sh.forEach((n, i) => groups[i].push(n));
  }
  const rows: { n: Nation; g: number; pts: number; gd: number; gf: number; grp: number }[] = [];
  groups.forEach((gr, gi) => {
    const tb = gr.map((n) => ({ n, g: gi, pts: 0, gd: 0, gf: 0, grp: gi }));
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
      const [a, b] = simScore(r, str(tb[i].n) - 2, str(tb[j].n) - 2);
      tb[i].gf += a; tb[j].gf += b; tb[i].gd += a - b; tb[j].gd += b - a;
      if (a > b) tb[i].pts += 3; else if (b > a) tb[j].pts += 3; else { tb[i].pts++; tb[j].pts++; }
    }
    tb.sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || r.next() - 0.5);
    const idx = tb.findIndex((x) => x.n.id === pc);
    if (mine && idx >= 0) {
      const adv = stage >= 3;
      if (adv && idx >= 2) [tb[1], tb[idx]] = [tb[idx], tb[1]];
      if (!adv && idx < 2) [tb[2], tb[idx]] = [tb[idx], tb[2]];
    }
    rows.push(...tb);
  });
  const K = 2 ** koRounds;
  const adv: typeof rows = [];
  for (let gi = 0; gi < G; gi++) adv.push(...rows.filter((x) => x.grp === gi).slice(0, 2));
  const thirds = rows.filter((_, i) => i % 4 === 2).sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf);
  for (const th of thirds) if (adv.length < K && !(mine && th.n.id === pc && stage < 3)) adv.push(th);
  let alive = r.shuffle(adv.slice(0, K).map((x) => x.n));
  const semis: Nation[] = [];
  let finalText = '';
  let runner: Nation = alive[0];
  for (let rd = 0; rd < koRounds; rd++) {
    const next: Nation[] = [];
    if (alive.length === 4) semis.push(...alive);
    for (let i = 0; i + 1 < alive.length; i += 2) {
      const a = alive[i];
      const b = alive[i + 1];
      let aw: boolean;
      let [ga, gb] = simScore(r, str(a), str(b));
      if (ga === gb) aw = r.chance(0.5 + (str(a) - str(b)) / 200);
      else aw = ga > gb;
      if (mine && (a.id === pc || b.id === pc)) {
        const pcWins = champ || 3 + rd < stage;
        aw = a.id === pc ? pcWins : !pcWins;
        if (aw && ga <= gb) ga = gb + 1;
        if (!aw && gb <= ga) gb = ga + 1;
      }
      next.push(aw ? a : b);
      if (rd === koRounds - 1) {
        runner = aw ? b : a;
        finalText = `${a.ko} ${ga}-${gb} ${b.ko}`;
      }
    }
    alive = next;
  }
  const winner = alive[0];
  const placed = !mine ? '' : champ ? '우승' : stage < 0 ? '' : stage < 3 ? '조별리그 탈락' : `${t.stages[Math.min(t.stages.length - 1, t.stages.length - koRounds + (stage - 3))]} 탈락`;
  return { winner, runner, semis: semis.filter((n) => n !== winner && n !== runner), final: finalText, playerStage: mine ? placed : '' };
}

function tournamentsOf(year: number): Tournament[] {
  return TOURNAMENTS.filter((t) => year >= t.firstYear && (year - t.firstYear) % t.every === 0);
}

function ageOf(star: { birthYear: number }, year: number): number {
  return year - star.birthYear;
}

function updateStars(s: GameState, season: number, year: number): void {
  const r = wrng(s, 'stars', season);
  const w = s.wld;
  for (const st of w.stars) {
    if (st.retired) continue;
    const age = ageOf(st, year);
    if (age <= 24) st.ovr = Math.min(st.pot, st.ovr + Math.max(0, r.normal(1.2, 0.9)));
    else if (age <= 29) st.ovr += r.normal(0.1, 0.7);
    else st.ovr -= 0.4 + 0.25 * (age - 30) + Math.abs(r.normal(0, 0.5));
    st.ovr = Math.round(st.ovr * 10) / 10;
    if (r.chance(0.12)) st.clubId = pickClub(r, elite().lvl5);
    const pr = age >= 33 ? 0.06 * Math.pow(age - 32, 1.4) : 0;
    const low = age >= 29 && st.ovr < 80 ? 0.35 : 0;
    if (r.chance(Math.min(0.95, pr + low))) st.retired = true;
  }
  for (let i = 0; i < w.stars.length; i++) {
    if (w.stars[i].retired) w.stars[i] = makeStar(r, w.nextStarId++, year, true);
  }
}

export interface BallonOut { rec: BallonRec; playerRank: number }

function playerBallonScore(s: GameState, champ: boolean, contWin: boolean, tournBonus: number): { score: number; avg: number } | null {
  const cur = s.career.cur;
  if (s.phase !== 'pro' || !s.career.clubId || cur.apps < 10 || cur.lvl < 4) return null;
  if (ageAtSeasonEnd(s) < 20) return null;
  const rt = s.world.leagues[cur.leagueId];
  const games = Math.max(1, rt ? (rt.order.length - 1) * 2 : 34);
  const frac = cur.mins / (games * 90);
  const avg = cur.ratingN ? cur.ratingSum / cur.ratingN : 0;
  const score = curOvr(s.ab) + (champ ? 2.5 : 0) + (contWin ? 5 : 0) + tournBonus + cur.goals * 0.08 + cur.assists * 0.04 + (cur.lvl >= 6 ? 1.5 : 0) + (frac < 0.5 ? -4 : 0) + (avg - 7) * 2;
  return { score, avg };
}

function ageAtSeasonEnd(s: GameState): number {
  return yearOf(s.week) - s.p.birth.y;
}

const NATION_BONUS = [6, 3, 1.5];

function ballon(s: GameState, season: number, year: number, core: WorldCore, tourn: Map<string, { winner: string; runner: string; semis: string[] }>): void {
  const r = wrng(s, 'ballon', season);
  const champOf = (id: string): boolean => {
    const cc = getClub(id).country;
    return core.champs.leagues[cc] === id;
  };
  const contBonus = (id: string): number => {
    let b = 0;
    for (const [comp, w] of Object.entries(core.champs.cont)) if (w === id) b += comp === 'UCL' ? 5 : comp === 'UEL' ? 2.5 : comp === 'LIB' ? 3 : 1;
    return b;
  };
  const natBonus = (code: string): number => {
    let b = 0;
    for (const t of tourn.values()) {
      if (t.winner === code) b += NATION_BONUS[0];
      else if (t.runner === code) b += NATION_BONUS[1];
      else if (t.semis.includes(code)) b += NATION_BONUS[2];
    }
    return b;
  };
  const scored: { name: string; club: string; country: string; score: number; me: boolean }[] = [];
  for (const st of s.wld.stars) {
    if (st.retired) continue;
    const score = st.ovr + r.normal(0, 2.4) + (champOf(st.clubId) ? 2.5 : 0) + contBonus(st.clubId) + natBonus(st.country);
    scored.push({ name: st.name, club: st.clubId, country: st.country, score, me: false });
  }
  const cur = s.career.cur;
  let myBonus = 0;
  if (tourn.size && s.nat.caps > 0) for (const [id, t] of tourn) {
    void id;
    const code = s.p.country;
    if (t.winner === code) myBonus += NATION_BONUS[0];
    else if (t.runner === code) myBonus += NATION_BONUS[1];
    else if (t.semis.includes(code)) myBonus += NATION_BONUS[2];
  }
  const my = s.career.clubId ? playerBallonScore(s, cur.pos === 1, contBonus(s.career.clubId) >= 5, myBonus) : null;
  let rank = 0;
  let winnerIsPlayer = false;
  if (my) {
    scored.push({ name: s.p.name, club: s.career.clubId, country: s.p.country, score: my.score, me: true });
  }
  scored.sort((a, b) => b.score - a.score);
  let idx = scored.findIndex((x) => x.me);
  if (idx === 0 && my && my.avg < 7.2) {
    [scored[0], scored[1]] = [scored[1], scored[0]];
    idx = 1;
  }
  if (my && idx >= 0) {
    rank = idx + 1;
    winnerIsPlayer = idx === 0;
  }
  const rec: BallonRec = {
    s: season, year, top: scored.slice(0, 3).map((x) => ({ name: x.name, club: x.club, country: x.country })), player: my ? rank : 0,
    playerScore: my ? Math.round(my.score * 10) / 10 : 0, winnerIsPlayer
  };
  s.wld.ballon.push(rec);
  if (s.wld.ballon.length > 40) s.wld.ballon.shift();
  s.wld.ceremony = rec;
  if (my && rank >= 2 && rank <= 3 && my.avg >= 7.2 && r.chance(0.5)) {
    const conf = getCountry(s.p.country).confed;
    ballonRunnerAward(s, conf);
  }
  if (my && rank >= 1 && rank <= 3) s.extra.podium += 1;
  if (winnerIsPlayer) ballonWin(s);
}

function ballonRunnerAward(s: GameState, conf: string): void {
  awardPrize(s, AWARDS.continental[conf] ?? AWARDS.continental.UEFA, 2);
}
function ballonWin(s: GameState): void {
  awardPrize(s, AWARDS.ballon, 8);
  s.extra.ballon += 1;
  dreamHit(s, 'ballon', '발롱도르 수상은 어린 시절의 꿈이었다.');
}

function ageFace(f: Face, year: number): number {
  return year - f.birthYear;
}

function progressFaces(s: GameState, season: number, year: number): void {
  const w = s.wld;
  for (const f of w.faces) {
    if (f.status === 'retired' || f.status === 'quit') continue;
    const r = wrng(s, 'face:' + f.key, season);
    const age = ageFace(f, year);
    const prog = clamp((age - 12) / 13, 0, 1);
    const target = f.pot * (0.5 + 0.5 * Math.pow(prog, 0.9));
    f.ovr = age <= 29 ? f.ovr + (target - f.ovr) * 0.38 + r.normal(0, 1.1) : f.ovr - (0.4 + 0.2 * (age - 30)) + r.normal(0, 0.6);
    f.ovr = Math.round(f.ovr * 10) / 10;
    if (f.status === 'youth') {
      if (age >= 17 && (r.chance(0.55) || age >= 19)) {
        const lvlBy = [6, 5, 4, 3, 2].find((L) => f.ovr + r.normal(0, 2.5) >= LEVEL_STARTER_OVR[L] - 8 + (age < 19 ? 2 : 0)) ?? 0;
        if (lvlBy === 0) {
          f.status = 'quit';
          f.lvl = 0;
          continue;
        }
        f.status = 'pro';
        f.debutS = season;
        f.lvl = lvlBy;
        const home = r.chance(0.8);
        const code = home ? f.country : r.pick(allCountries()).code;
        const cands = leaguesOf(code).flatMap((lg) => lg.clubIds).filter((id) => getClub(id).lvl0 === Math.min(lvlBy, getCountry(code).top));
        const any = cands.length ? cands : leaguesOf(f.country).flatMap((lg) => lg.clubIds);
        f.clubId = r.pick(any);
      }
      continue;
    }
    if (r.chance(0.28)) {
      const L = [6, 5, 4, 3, 2].find((L2) => f.ovr + r.normal(0, 3) >= LEVEL_STARTER_OVR[L2] - 6) ?? 2;
      const code = r.chance(0.7) ? f.country : r.pick(allCountries()).code;
      const cands = leaguesOf(code).flatMap((lg) => lg.clubIds).filter((id) => getClub(id).lvl0 === Math.min(L, getCountry(code).top));
      if (cands.length) {
        f.clubId = r.pick(cands);
        f.lvl = getClub(f.clubId).lvl0;
      }
    }
    if (f.lvl >= 4 && f.caps === 0 && f.ovr >= getCountry(f.country).natBase - 8 && r.chance(0.35)) f.caps = 1;
    else if (f.caps > 0) f.caps += r.int(0, 6);
    if (r.chance(0.07)) f.injuredS = season;
    if (age >= 24 && f.wedS < 0 && r.chance(0.08)) f.wedS = season;
    const retP = age >= 32 ? 0.12 * (age - 31) : 0;
    const injRet = f.injuredS === season && r.chance(0.07) ? 1 : 0;
    if (injRet || r.chance(Math.min(0.9, retP))) {
      f.status = 'retired';
      if (r.chance(0.45)) f.coachS = season + r.int(1, 3);
    }
  }
}

function tell(f: Face, k: string): boolean {
  if (f.told.split(',').includes(k)) return false;
  f.told = f.told ? `${f.told},${k}` : k;
  return true;
}

function faceNews(s: GameState, season: number): void {
  const year = yearOf(s.week);
  for (const f of s.wld.faces) {
    const club = f.clubId ? getClub(f.clubId).name : '';
    const label = f.role === 'rival' ? '라이벌' : '유스 동기';
    if (f.status === 'pro' && f.debutS === season && tell(f, 'debut')) addLog(s, 'world', `${label} ${f.name}`, `${label} ${f.name}이(가) ${club}에서 프로 무대에 데뷔했다는 소식이 들렸다.`, []);
    if (f.status === 'quit' && tell(f, 'quit')) addLog(s, 'world', `${label} ${f.name}`, `${label} ${f.name}은(는) 프로의 문턱을 넘지 못하고 축구를 그만뒀다고 한다.`, []);
    if (f.status === 'retired' && tell(f, 'retire')) addLog(s, 'world', `${label} ${f.name}`, `${label} ${f.name}이(가) 현역에서 은퇴했다는 소식이 전해졌다.`, []);
    if (f.status === 'pro' && f.caps >= 1 && ageFace(f, year) < 40 && tell(f, 'cap')) addLog(s, 'world', `${label} ${f.name}`, `${label} ${f.name}이(가) 처음으로 ${getCountry(f.country).natTeam} 명단에 이름을 올렸다.`, []);
    if (f.status === 'pro' && f.injuredS === season && tell(f, `inj${season}`)) addLog(s, 'world', `${label} ${f.name}`, `${label} ${f.name}이(가) 큰 부상으로 한동안 결장한다는 소식이다.`, []);
    if (f.status !== 'youth' && f.status !== 'quit' && f.wedS === season && tell(f, 'wed')) addLog(s, 'world', `${label} ${f.name}`, `${label} ${f.name}이(가) 결혼한다는 소식이 들렸다.`, []);
  }
}

function ballonEligible(s: GameState): boolean {
  const cur = s.career.cur;
  return s.phase === 'pro' && !!s.career.clubId && cur.lvl >= 4 && cur.apps >= 10 && ageAtSeasonEnd(s) >= 20 && curOvr(s.ab) >= 76;
}

export function worldSeasonEnd(s: GameState): void {
  const season = seasonOf(s.week);
  const year = yearOf(s.week);
  if (s.wld.champs.s === season) return;
  const cosmetic = isCosmetic();
  if (cosmetic || ballonEligible(s)) {
    const codes = cosmetic ? allCountries().map((c) => c.code) : CORE_CODES.slice();
    const core = computeChamps(s, season, codes);
    s.wld.champs = core.champs;
    const tourn = new Map<string, { winner: string; runner: string; semis: string[] }>();
    for (const t of tournamentsOf(year)) {
      const b = simTournament(s, t, year);
      if (!b) continue;
      tourn.set(t.id, { winner: b.winner.code || b.winner.id, runner: b.runner.code || b.runner.id, semis: b.semis.map((x) => x.code || x.id) });
      const rec: TournRec = { s: season, year, id: t.id, ko: t.ko, winner: b.winner.ko, runner: b.runner.ko, semis: b.semis.map((x) => x.ko), player: b.playerStage };
      s.wld.tourn.push(rec);
      if (s.wld.tourn.length > 16) s.wld.tourn.shift();
      if (cosmetic) {
        addLog(s, 'world', `${year} ${t.ko}`, `${year} ${t.ko}에서 ${b.winner.ko}이(가) 우승했다. 결승 ${b.final}.`, [], { star: true });
        toast(s, `🏆 ${year} ${t.ko} 우승: ${b.winner.ko}`);
      }
    }
    ballon(s, season, year, core, tourn);
    if (cosmetic) worldNews(s, core);
  }
  s.wld.champs.s = season;
  updateStars(s, season, year);
  progressFaces(s, season, year);
  if (cosmetic) faceNews(s, season);
}

function worldNews(s: GameState, core: WorldCore): void {
  const year = yearOf(s.week);
  const big = ['GB', 'ES', 'DE', 'IT', 'FR', 'NL', 'PT', 'BR', 'AR'];
  const parts: string[] = [];
  for (const c of big) {
    const id = core.champs.leagues[c];
    if (id) parts.push(`${getLeague(leaguesOf(c)[0].id).ko} ${getClub(id).name}`);
  }
  addLog(s, 'world', `${year} 시즌 우승팀`, `주요 리그 우승: ${parts.join(' · ')}.`, []);
  for (const [comp, id] of Object.entries(core.champs.cont)) {
    const info = CONT_COMPS[comp];
    addLog(s, 'world', info.ko, `${info.ko} 결승에서 ${getClub(id).name}이(가) 정상에 올랐다.`, []);
    if (comp === 'UCL' || comp === 'LIB') toast(s, `🏆 ${info.ko}: ${getClub(id).name} 우승`);
  }
}

export function ceremonyWeek(s: GameState): void {
  const c = s.wld.ceremony;
  if (!c || s.wld.ceremonyDue || c.s >= seasonOf(s.week)) return;
  if (c.player < 1 || c.player > 3) return;
  s.wld.ceremonyDue = true;
  if (!isCosmetic()) return;
  const t = c.top;
  addLog(s, 'world', `${c.year} 발롱도르 시상식`, `${c.year} 발롱도르 시상식이 열렸다. 3위 ${t[2].name}, 2위 ${t[1].name}, 그리고 수상자는 ${t[0].name}(${getClub(t[0].club).name})!${c.player ? ` ${s.p.name}은(는) ${c.player}위에 올랐다.` : ''}`, [], { star: true });
  toast(s, `🏆 ${c.year} 발롱도르: ${t[0].name}`);
}

export function coreHash(s: GameState): string {
  const w = s.wld;
  const o = {
    st: w.stars.map((x) => [x.id, x.name, x.clubId, x.ovr, x.retired]),
    b: w.ballon,
    t: w.tourn.map((x) => [x.year, x.id, x.winner, x.runner]),
    f: w.faces.map((x) => [x.key, x.ovr, x.clubId, x.status, x.caps, x.injuredS, x.wedS, x.coachS]),
    lg: CORE_CODES.map((c) => w.champs.leagues[c]),
    ct: ['UCL', 'UEL', 'LIB'].map((c) => w.champs.cont[c])
  };
  return JSON.stringify(o);
}
