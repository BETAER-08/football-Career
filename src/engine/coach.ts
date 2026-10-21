import { LEVEL_WAGE_MULT, LEVEL_STARTER_OVR } from '../data/countries';
import { TOURNAMENTS } from '../data/competitions';
import { Rng, clamp, hashString } from './rng';
import { sys } from './narrative';
import { addLog, toast } from './log';
import { ageAt, seasonOf, swOf, yearOf, START_YEAR } from './time';
import { clubLvl, clubSt, dyn, ensureCountry, endSeasonCountry, positionOf, ranking, membersOf, clubLeagueId } from './world';
import { allCountries, getClub, getCountry, getLeague, leaguesOf } from './data';
import { makePerson, randomPos } from './relations';
import { setupClubSeason } from './transfer';
import { presentOffers, hasPendingOffer } from './offers';
import { playTeamOnly, natTeamBase } from './match';
import type { CoachRec, CoachState, Contract, GameState, Offer, Person, Pos } from './types';
import { awardTrophy, matchesThisWeek } from './season';
import { formatKRW } from './finance';

export const LICENSE_NAME: Record<string, string> = { C: 'C급', B: 'B급', A: 'A급', P: 'P급(프로)' };

export function licenseLabel(code: string, key: 'C' | 'B' | 'A' | 'P'): string {
  const c = getCountry(code);
  const uefa = c.confed === 'UEFA';
  const afc = c.confed === 'AFC';
  const base = { C: 'C', B: 'B', A: 'A', P: 'Pro' }[key];
  if (uefa) return key === 'P' ? 'UEFA Pro 라이선스' : key === 'A' ? 'UEFA A 라이선스' : key === 'B' ? 'UEFA B 라이선스' : 'UEFA C 라이선스';
  if (afc) return key === 'P' ? 'AFC Pro 라이선스' : `AFC ${base} 라이선스`;
  if (c.confed === 'CAF') return key === 'P' ? 'CAF A 프로 라이선스' : `CAF ${base} 라이선스`;
  if (c.confed === 'CONMEBOL') return key === 'P' ? 'CONMEBOL Pro 라이선스' : `CONMEBOL ${base} 라이선스`;
  return key === 'P' ? 'CONCACAF Pro 라이선스' : `CONCACAF ${base} 라이선스`;
}

const PASS_RATE = { C: 0.85, B: 0.6, A: 0.45, P: 0.35 };
const NEED_SEASONS = { C: 0, B: 1, A: 3, P: 5 };

export function licenseLevel(s: GameState): number {
  const l = s.coach.licenses;
  return l.P ? 4 : l.A ? 3 : l.B ? 2 : l.C ? 1 : 0;
}

export function nextLicense(s: GameState): 'C' | 'B' | 'A' | 'P' | null {
  const lv = licenseLevel(s);
  return lv >= 4 ? null : (['C', 'B', 'A', 'P'] as const)[lv];
}

export function canStudy(s: GameState): { ok: boolean; reason: string; key: 'C' | 'B' | 'A' | 'P' | null } {
  const key = nextLicense(s);
  if (!key) return { ok: false, reason: '모든 자격증을 취득했다', key };
  if (s.coach.studying) return { ok: false, reason: '이미 과정을 이수 중이다', key };
  if (s.phase === 'pro' || s.phase === 'youth') {
    if (ageAt(s.p.birth, s.week) < 28) return { ok: false, reason: '28세 이상부터 등록할 수 있다', key };
    if (key !== 'C' && key !== 'B') return { ok: false, reason: '현역 중에는 C·B급만 취득할 수 있다', key };
  }
  if (s.coach.coachSeasons < NEED_SEASONS[key]) return { ok: false, reason: `지도 경력 ${NEED_SEASONS[key]}시즌이 필요하다`, key };
  if (key === 'P' && !(s.coach.everManager || s.coach.assistantSeasons > 0)) return { ok: false, reason: '감독 또는 수석코치 경험이 필요하다', key };
  return { ok: true, reason: '', key };
}

export function startStudy(s: GameState, key: 'C' | 'B' | 'A' | 'P'): void {
  s.coach.studying = key;
  s.coach.studyEnd = s.week + 26;
  addLog(s, 'system', '지도자 과정', `${licenseLabel(s.p.country, key)} 과정에 등록했다. (약 26주)`, []);
}

export function studyWeekly(s: GameState, rng: Rng): void {
  const c = s.coach;
  if (!c.studying || s.week < c.studyEnd) return;
  const key = c.studying;
  c.studying = '';
  const bonus = (s.focus === 'license' ? 0.06 : 0) + (c.skills.tactics / 400) + (s.life.eduLevel * 0.01);
  const p = clamp(PASS_RATE[key] + bonus, 0.05, 0.97);
  if (rng.next() < p) {
    c.licenses[key] = 1;
    c.fame = clamp(c.fame + 1.2, 0, 100);
    addLog(s, 'milestone', '자격증 취득', `${licenseLabel(s.p.country, key)} 취득에 성공했다.`, [], { star: true });
    toast(s, `${licenseLabel(s.p.country, key)} 합격`);
  } else {
    s.st.morale = clamp(s.st.morale - 6, 0, 100);
    addLog(s, 'system', '자격증 불합격', `${licenseLabel(s.p.country, key)} 시험에서 떨어졌다. 다시 도전할 수 있다.`, []);
  }
}

export function initCoach(s: GameState, rng: Rng): void {
  const c = s.coach;
  if (c.entered) return;
  c.entered = true;
  c.talent = Math.round(rng.normal(0, 1) * 100) / 100;
  c.cap = clamp(55 + c.talent * 15, 30, 92);
  const pos = s.ab.pos;
  const mid = ['DM', 'CM', 'AM'].includes(pos) ? 6 : pos === 'GK' ? 2 : 3;
  const base = 14 + Math.min(10, s.career.seasons.length * 0.6);
  const langs = Object.keys(s.life.lang).filter((k) => (s.life.lang[k] ?? 0) >= 40).length;
  c.skills = {
    tactics: clamp(base + mid + (s.ab.a.vision - 10) * 0.8, 5, c.cap),
    development: clamp(base + (s.hid.social - 50) / 8 + (s.life.eduLevel >= 2 ? 2 : 0), 5, c.cap),
    leadership: clamp(base + (s.ab.a.leadership - 8) * 1.4 + (s.people.captain && s.ab.traits.includes('leaderT') ? 4 : 0), 5, c.cap),
    management: clamp(base + (s.life.children > 0 ? 3 : 0) + (s.hid.social - 50) / 10, 5, c.cap),
    media: clamp(base + s.fame.dom / 10 + (s.hid.social - 50) / 10, 5, c.cap),
    data: clamp(base + s.life.eduLevel * 3, 5, c.cap),
    language: clamp(10 + langs * 14, 0, 100)
  };
  const fame = s.fame.peakFame * 0.45 + s.career.maxLvl * 3 + s.nat.caps * 0.12 + s.extra.ballon * 14 + s.career.trophies.length * 1.2 + (s.ab.traits.includes('leaderT') ? 3 : 0) + s.nat.wcCount * 3;
  c.fame = clamp(fame, 0, 72);
  c.peakFame = c.fame;
  c.standing = 60;
  if (!c.licenses.C) {
    startStudy(s, 'C');
  }
  addLog(s, 'milestone', '지도자의 길', `지도자의 길에 들어섰다. 지도자 재능은 아직 아무도 모른다.`, [], { star: true });
}

export function coachBonus(s: GameState): number {
  const k = s.coach.skills;
  const avg = (k.tactics * 1.2 + k.development * 0.6 + k.leadership + k.management * 0.9 + k.data * 0.7 + k.media * 0.2) / 4.6;
  return (avg - 45) / 11;
}

function coachWage(s: GameState, lvl: number, role: string): number {
  const mult = role === 'manager' ? 1 : role === 'assistant' ? 0.45 : role === 'youth' ? 0.22 : 1.1;
  return Math.round(7000 * LEVEL_WAGE_MULT[lvl] * mult * (1 + s.coach.fame / 90) * (0.5 + getCountry(s.p.country).econ));
}

type OfferRole = 'youth' | 'assistant' | 'manager' | 'national';

const ROLE_RANK: Record<OfferRole, number> = { youth: 0, assistant: 1, manager: 2, national: 3 };
const ROLE_LIC: Record<OfferRole, number> = { youth: 1, assistant: 2, manager: 3, national: 4 };
const ROLE_ORDER: OfferRole[] = ['youth', 'assistant', 'manager', 'national'];

const ROLE_WEIGHTS: Record<OfferRole, Record<keyof CoachState['skills'], number>> = {
  youth: { development: 0.35, leadership: 0.15, tactics: 0.15, data: 0.1, language: 0.1, media: 0.05, management: 0.1 },
  assistant: { tactics: 0.35, leadership: 0.2, data: 0.15, development: 0.1, management: 0.1, media: 0.05, language: 0.05 },
  manager: { tactics: 0.25, management: 0.2, leadership: 0.2, media: 0.1, data: 0.1, language: 0.1, development: 0.05 },
  national: { tactics: 0.2, management: 0.2, leadership: 0.2, media: 0.15, language: 0.15, data: 0.05, development: 0.05 }
};

const LEVEL_CAPS: ReadonlyArray<readonly [number, number]> = [[75, 6], [60, 5], [45, 4], [30, 3], [-Infinity, 2]];

const DIRECTOR_STYLES = ['육성 중시형', '성과 중시형', '안정 추구형', '공격 투자형'];

export function roleOfRec(label: string): OfferRole | null {
  if (!label) return null;
  if (label.includes('국가대표')) return 'national';
  if (label.includes('유스')) return 'youth';
  if (label.includes('수석')) return 'assistant';
  return 'manager';
}

export function currentOfferRole(s: GameState): OfferRole | null {
  const c = s.coach;
  if (c.role === 'youthCoach') return 'youth';
  if (c.role === 'assistant') return 'assistant';
  if (c.role === 'manager') return 'manager';
  if (c.role === 'national') return 'national';
  const last = c.recs[c.recs.length - 1];
  return last ? roleOfRec(last.role) : null;
}

export function coachScore(s: GameState, role: OfferRole): { score: number; ability: number; recent: number } {
  const c = s.coach;
  const w = ROLE_WEIGHTS[role];
  let ability = 0;
  for (const k of Object.keys(w) as (keyof CoachState['skills'])[]) ability += c.skills[k] * w[k];
  const recent = clamp(c.standing, 0, 100);
  return { score: c.fame * 0.45 + ability * 0.35 + recent * 0.2, ability, recent };
}

export function levelCap(score: number, role: OfferRole, lic: number): number {
  const adj = score + (role === 'manager' ? 0 : 6);
  let cap = 2;
  for (const [min, lv] of LEVEL_CAPS) if (adj >= min) { cap = lv; break; }
  if (lic <= 3) cap = Math.min(cap, 3);
  return cap;
}

export function allowedOfferRoles(s: GameState): { role: OfferRole; downOnly: boolean; viaLevel: boolean }[] {
  const lic = licenseLevel(s);
  const cur = currentOfferRole(s);
  const c = s.coach;
  const out: { role: OfferRole; downOnly: boolean; viaLevel: boolean }[] = [];
  const add = (r: OfferRole, downOnly = false, viaLevel = false): void => {
    if (lic >= ROLE_LIC[r] && !out.some((x) => x.role === r)) out.push({ role: r, downOnly, viaLevel });
  };
  if (cur === null) { add('youth'); add('assistant'); return out; }
  add(cur);
  if (cur === 'national') add('manager');
  else if (cur !== 'manager') add(ROLE_ORDER[ROLE_RANK[cur] + 1]);
  else add('national');
  const underperf = c.role === 'manager' && c.tablePos > 0 && c.tablePos - c.tableTarget >= 5;
  if (ROLE_RANK[cur] > 0 && (c.jobless >= 26 || underperf)) add(ROLE_ORDER[ROLE_RANK[cur] - 1], true);
  if (ROLE_RANK[cur] > 0 && c.clubId) add(ROLE_ORDER[ROLE_RANK[cur] - 1], true, true);
  return out;
}

function langScore(s: GameState, code: string): number {
  const lang = getCountry(code).lang;
  if (getCountry(s.p.country).lang === lang) return 100;
  return Math.min(100, (s.life.lang[lang] ?? 0) + s.coach.skills.language * 0.3);
}

function coachedCodes(s: GameState): Set<string> {
  const out = new Set<string>();
  for (const r of s.coach.recs) {
    if (r.clubId.startsWith('NAT:')) out.add(r.clubId.slice(4));
    else {
      try { out.add(getClub(r.clubId).country); } catch { continue; }
    }
  }
  if (s.coach.clubId) out.add(getClub(s.coach.clubId).country);
  return out;
}

function playedCodes(s: GameState): Set<string> {
  const out = new Set<string>();
  for (const r of s.career.seasons) {
    try { out.add(getClub(r.clubId).country); } catch { continue; }
  }
  return out;
}

export function hasTie(s: GameState, code: string): boolean {
  if (code === s.p.country) return true;
  return coachedCodes(s).has(code) || playedCodes(s).has(code) || langScore(s, code) >= 50 || getCountry(code).confed === getCountry(s.p.country).confed;
}

function budgetTier(fin: number): string {
  return fin >= 70 ? '풍족' : fin >= 40 ? '보통' : '빠듯';
}

export function genCoachOffers(s: GameState, rng: Rng, n: number): Offer[] {
  const out: Offer[] = [];
  const lic = licenseLevel(s);
  if (lic < 1) return out;
  const allowed = allowedOfferRoles(s);
  if (!allowed.length) return out;
  const cur = currentOfferRole(s);
  const curLvl = s.coach.clubId ? clubLvl(s, s.coach.clubId) : 0;
  const home = getCountry(s.p.country);
  const coached = coachedCodes(s);
  const played = playedCodes(s);
  const homeFirst = (r: OfferRole) => (r === 'national' ? 0.93 : 0.7);
  for (let i = 0; i < n; i++) {
    const wts = allowed.map((a) => {
      const sc = coachScore(s, a.role).score;
      if (a.role === 'national') return sc >= 65 ? 0.05 + (sc - 65) / 300 : 0;
      let w = a.role === cur ? 3 : a.downOnly ? 0.6 : 1.8;
      if (a.role === 'manager' && s.coach.assistantSeasons > 0) w += 1;
      return w;
    });
    if (wts.every((w) => w <= 0)) break;
    const pick = allowed[rng.weightedIndex(wts)];
    const role = pick.role;
    const sc = coachScore(s, role);
    if (role === 'national') {
      let code = s.p.country;
      if (!rng.chance(homeFirst(role))) {
        const alt = allCountries().filter((c) => c.code !== s.p.country && sc.score >= 80 && (coached.has(c.code) || played.has(c.code) || langScore(s, c.code) >= 50 || c.confed === home.confed));
        if (!alt.length) continue;
        code = rng.pick(alt).code;
      }
      if (out.some((o) => o.clubId === `NAT:${code}`)) continue;
      const cc = getCountry(code);
      out.push({
        id: s.ev.nextId++, clubId: `NAT:${code}`, role: 'starter', wage: Math.round(coachWage(s, Math.min(5, cc.top), 'national')), years: 4, signing: 0, appBonus: 0, goalBonus: 0, buyout: 0, loan: false, trial: false, exp: s.week + 10, coachName: '', coachStyle: '', first: false, fromAgent: false, tag: 'national',
        cinfo: { country: code, leagueName: '대표팀', level: Math.min(5, cc.top), target: 0, budget: '협회 지원', director: '협회', reason: `점수 ${Math.round(sc.score)}점, 대표팀 감독 후보` }
      });
      continue;
    }
    const cap = levelCap(sc.score, role, lic);
    const levels = [2, 3, 4, 5, 6].filter((L) => L <= cap && (!pick.viaLevel || L >= curLvl + 2));
    if (!levels.length) continue;
    const lw = levels.map((L) => {
      let v = L === cap ? 4 : L === cap - 1 ? 3 : L === cap - 2 ? 1.2 : 0.4;
      if (L === 5) v *= 0.03;
      if (L === 6) v *= 0.015;
      return v;
    });
    const L = levels[rng.weightedIndex(lw)];
    const homeOk = home.top >= L;
    let code = s.p.country;
    if (!homeOk || !rng.chance(homeFirst(role))) {
      const fc0 = allCountries().filter((c) => c.code !== s.p.country && c.top >= L && !(langScore(s, c.code) < 30 && (role === 'manager')));
      const fcTie = fc0.filter((c) => hasTie(s, c.code));
      const fc = fcTie.length ? fcTie : fc0;
      if (!fc.length) { if (!homeOk) continue; } else {
        const fw = fc.map((c) => {
          let w = Math.sqrt(leaguesOf(c.code).reduce((a, lg) => a + lg.clubIds.length, 0));
          const tie = hasTie(s, c.code);
          if (coached.has(c.code)) w *= 3;
          if (played.has(c.code)) w *= 2;
          if (langScore(s, c.code) >= 50) w *= 2.5;
          if (c.confed === home.confed) w *= 1.6;
          if (!tie) w *= 0.01;
          return w;
        });
        code = fc[rng.weightedIndex(fw)].code;
      }
    }
    const cands: string[] = [];
    ensureCountry(s, code);
    for (const lg of leaguesOf(code)) for (const id of lg.clubIds) if (clubLvl(s, id) === L && id !== s.coach.clubId) cands.push(id);
    if (!cands.length) continue;
    const id = rng.pick(cands);
    if (out.some((o) => o.clubId === id)) continue;
    const years = role === 'manager' ? rng.int(1, 3) : 2;
    const cs = getClub(id);
    const lgId = clubLeagueId(s, id);
    const rank = ranking2(s, lgId);
    const target = Math.max(1, Math.min(rank.length, rank.indexOf(id) + 1));
    const dir = DIRECTOR_STYLES[hashString(`dir|${id}`) % DIRECTOR_STYLES.length];
    const why = pick.downOnly ? '이직 사유: 상황 변화로 한 단계 낮은 직책 제안' : role === cur ? '같은 직책 이직 제안' : cur === null ? '첫 지도자 자리 제안' : '한 단계 높은 직책 제안';
    out.push({
      id: s.ev.nextId++, clubId: id, role: 'starter', wage: coachWage(s, L, role), years, signing: 0, appBonus: 0, goalBonus: 0, buyout: 0, loan: false, trial: false, exp: s.week + 10, coachName: '', coachStyle: '', first: false, fromAgent: false, tag: role,
      cinfo: { country: cs.country, leagueName: getLeague(lgId).ko, level: L, target, budget: budgetTier(cs.fin0), director: dir, reason: `점수 ${Math.round(sc.score)}점 · ${why}` }
    });
  }
  return out;
}

export function coachRoleLabel(tag: string): string {
  return { youth: '유스 코치', assistant: '수석코치', manager: '감독', national: '국가대표 감독' }[tag] ?? '코치';
}

export function coachOfferLabel(o: Offer): string {
  const role = { youth: '유스 코치', assistant: '수석코치', manager: '감독', national: '국가대표 감독' }[o.tag] ?? '코치';
  if (o.clubId.startsWith('NAT:')) return `${getCountry(o.clubId.slice(4)).natTeam} · ${role} · 연봉 ${formatKRW(o.wage)}`;
  const c = getClub(o.clubId);
  return `${c.name} · ${getCountry(c.country).ko} · ${role} · 연봉 ${formatKRW(o.wage)}`;
}

export function acceptCoachJob(s: GameState, rng: Rng, o: Offer): void {
  const c = s.coach;
  const role = o.tag === 'youth' ? 'youthCoach' : o.tag === 'assistant' ? 'assistant' : o.tag === 'national' ? 'national' : 'manager';
  if (c.clubId || c.role !== 'none') closeCoachSeason(s, rng, false, '이직');
  c.role = role;
  const con: Contract = { clubId: o.clubId, role: 'starter', wage: o.wage, startW: s.week, endW: s.week + o.years * 52, signing: 0, appBonus: 0, goalBonus: 0, titleBonus: 0, buyout: 0, loanFrom: '', youth: false };
  c.contract = con;
  c.halfFired = false;
  c.standing = Math.max(55, c.standing);
  if (role === 'national') {
    c.natCountry = o.clubId.slice(4);
    c.clubId = '';
    c.everNat = true;
    c.seasonPts = 0;
    c.seasonGames = 0;
    addLog(s, 'milestone', '지도자 부임', `${getCountry(c.natCountry).natTeam} 감독으로 부임했다.`, [], { star: true });
  } else {
    c.clubId = o.clubId;
    c.natCountry = '';
    const cs = getClub(o.clubId);
    const lvl = clubLvl(s, o.clubId);
    if (role === 'manager') { c.everManager = true; if (lvl >= 5) c.everBig = true; }
    s.career.clubId = '';
    setupClubSeason(s, o.clubId, true);
    const lgId = clubLeagueId(s, o.clubId);
    const rank = ranking2(s, lgId);
    c.tableTarget = Math.max(1, Math.min(rank.length, rank.indexOf(o.clubId) + 1));
    buildStaffPeople(s, rng, o.clubId);
    buildSquad(s, rng, o.clubId);
    addLog(s, 'milestone', '지도자 부임', sys(s, 'coachAppoint', { club: cs.name, role: role === 'manager' ? '감독' : role === 'assistant' ? '수석코치' : '유스 코치' }), [], { star: true });
  }
  c.lastOfferW = s.week;
  s.focus = 'tactics';
  s.fin.cash += 0;
  toast(s, role === 'national' ? '국가대표 감독 부임' : `${getClub(o.clubId).name} 부임`);
}

function ranking2(s: GameState, lgId: string): string[] {
  const ids = membersOf(s, lgId);
  return ids.sort((a, b) => dyn(s, b).st - dyn(s, a).st);
}

export function buildStaffPeople(s: GameState, rng: Rng, clubId: string): void {
  const code = getClub(clubId).country;
  const year = yearOf(s.week);
  s.people.director = makePerson(rng, s.ev, 'director', code, { age: rng.int(42, 66), refYear: year, job: '단장', rel: rng.int(-10, 15), clubId });
  s.people.owner = makePerson(rng, s.ev, 'owner', code, { age: rng.int(48, 74), refYear: year, job: '구단주', rel: rng.int(-10, 12), clubId });
  s.people.media = makePerson(rng, s.ev, 'media', code, { age: rng.int(30, 56), refYear: year, job: '담당 기자', rel: rng.int(-10, 10) });
}

export function buildSquad(s: GameState, rng: Rng, clubId: string): void {
  const code = getClub(clubId).country;
  const year = yearOf(s.week);
  const std = clubStatic(s, clubId);
  const n = rng.int(8, 12);
  const squad: Person[] = [];
  for (let i = 0; i < n; i++) {
    const age = rng.int(18, 35);
    const p = makePerson(rng, s.ev, 'player', code, { age, refYear: year, job: i === 0 ? '주장' : '선수', rel: rng.int(-10, 30), pos: randomPos(rng) as Pos, ovr: Math.round(std + rng.normal(0, 4)), pot: 0, clubId });
    p.pot = Math.round(p.ovr + Math.max(0, 25 - age) * rng.float(0.2, 1.1));
    p.trait = rng.pick(['성실', '다혈질', '리더형', '자유분방', '조용한 노력파', '관심받기 좋아함', '신중']);
    squad.push(p);
  }
  s.coach.squad = squad;
}

function clubStatic(s: GameState, clubId: string): number {
  const lvl = clubLvl(s, clubId);
  return LEVEL_STARTER_OVR[lvl] + (dyn(s, clubId).st - 55) * 0.1;
}

export function closeCoachSeason(s: GameState, rng: Rng, fired: boolean, reason: string, count = false): void {
  const c = s.coach;
  if (!c.role || c.role === 'none') return;
  const season = seasonOf(s.week);
  if (c.role !== 'national' && c.clubId) {
    const lgId = clubLeagueId(s, c.clubId);
    const rt = s.world.leagues[lgId];
    let pos = c.tablePos;
    if (rt && rt.table[c.clubId]) pos = ranking(s, lgId).indexOf(c.clubId) + 1;
    const rec: CoachRec = {
      s: season, year: START_YEAR + season, clubId: c.clubId, clubName: getClub(c.clubId).name, leagueName: getLeague(lgId).ko,
      role: roleLabel(c.role), pos, target: c.tableTarget, pts: rt && rt.table[c.clubId] ? rt.table[c.clubId][0] : 0, trophies: s.career.cur.trophies.slice(), fired
    };
    c.recs.push(rec);
  } else if (c.role === 'national') {
    c.recs.push({ s: season, year: START_YEAR + season, clubId: `NAT:${c.natCountry}`, clubName: getCountry(c.natCountry).natTeam, leagueName: '대표팀', role: '국가대표 감독', pos: 0, target: 0, pts: c.seasonPts, trophies: [], fired });
  }
  if (count) {
    if (c.role === 'assistant') c.assistantSeasons += 1;
    if (c.role === 'manager') c.managerSeasons += 1;
    c.coachSeasons += 1;
  }
}

export function roleLabel(r: string): string {
  return { youthCoach: '유스 코치', assistant: '수석코치', manager: '감독', national: '국가대표 감독', none: '무직' }[r] ?? r;
}

export function fireCoach(s: GameState, rng: Rng, why: string): void {
  const c = s.coach;
  closeCoachSeason(s, rng, true, why);
  c.fired += 1;
  c.fame = clamp(c.fame - 4 - (c.role === 'manager' ? 2 : 0), 0, 100);
  c.standing = 55;
  s.st.morale = clamp(s.st.morale - 15, 0, 100);
  s.st.stress = clamp(s.st.stress + 10, 0, 100);
  const comp = c.contract ? Math.round(c.contract.wage * Math.max(0.3, (c.contract.endW - s.week) / 52) * 0.7) : 0;
  s.fin.cash += comp;
  addLog(s, 'milestone', '경질', `${why} ${c.role === 'national' ? '대표팀' : c.clubId ? getClub(c.clubId).name : ''}에서 물러나게 됐다.`, [{ k: '위약금 수령', d: comp, u: '만' }], { star: true });
  leaveJob(s);
}

export function leaveJob(s: GameState): void {
  const c = s.coach;
  c.role = 'none';
  c.clubId = '';
  c.natCountry = '';
  c.contract = null;
  c.squad = [];
  c.tablePos = 0;
  c.tablePts = 0;
  s.career.fixtures.length = 0;
  s.career.cupAlive = false;
  s.career.contAlive = false;
  c.jobless = 0;
}

export function resignCoach(s: GameState, rng: Rng): void {
  closeCoachSeason(s, rng, false, '사임');
  addLog(s, 'milestone', '사임', sys(s, 'coachResign', { club: c0(s) }), [], { star: true });
  leaveJob(s);
}

function c0(s: GameState): string {
  return s.coach.clubId ? getClub(s.coach.clubId).name : s.coach.natCountry ? getCountry(s.coach.natCountry).natTeam : '지도자 직';
}

export function targetFor(s: GameState): number {
  return s.coach.tableTarget;
}

export function openCoachSeason(s: GameState): void {
  const c = s.coach;
  if (c.role === 'none' || !c.clubId) return;
  setupClubSeason(s, c.clubId, false);
  const lgId = clubLeagueId(s, c.clubId);
  const rank = ranking2(s, lgId);
  c.tableTarget = Math.max(1, Math.min(rank.length, rank.indexOf(c.clubId) + 1));
  c.halfFired = false;
  s.career.cur.trophies = [];
}

export function coachMatchWeek(s: GameState, rng: Rng): void {
  const c = s.coach;
  const sw = swOf(s.week);
  if (c.role === 'national') return;
  if (!c.clubId || c.role === 'none') return;
  const todays = matchesThisWeek(s, sw);
  for (const fx of todays) {
    const mySt = clubSt(s, c.clubId) + coachBonus(s) * (c.role === 'manager' ? 1 : c.role === 'assistant' ? 0.4 : 0.15);
    playCoachFixture(s, rng, fx, mySt);
  }
}

import { playRoundOthers, record } from './world';
import { nextCupOrCont } from './season';
import type { Fixture } from './types';
import { josa } from './josa';

function playCoachFixture(s: GameState, rng: Rng, fx: Fixture, mySt: number): void {
  const c = s.coach;
  const lgId = s.career.cur.leagueId;
  if (fx.kind === 'league') {
    const rt = s.world.leagues[lgId];
    if (rt) {
      playRoundOthers(s, lgId, fx.round, c.clubId);
      rt.round = fx.round + 1;
    }
  }
  const out = playTeamOnly(s, rng, fx, mySt);
  if (fx.kind === 'league') {
    const home = fx.home ? c.clubId : fx.oppId;
    const away = fx.home ? fx.oppId : c.clubId;
    record(s, lgId, home, away, out.hg, out.ag);
    c.seasonGames += 1;
    c.seasonPts += out.result === 'W' ? 3 : out.result === 'D' ? 1 : 0;
    c.tablePos = positionOf(s, lgId, c.clubId);
    if (c.seasonGames % 8 === 0) {
      const n = Math.max(2, membersOf(s, lgId).length);
      const expected = (1 - (c.tableTarget - 1) / (n - 1)) * 0.9 + 0.8;
      const ppg = c.seasonPts / c.seasonGames;
      c.standing = clamp(c.standing + clamp((ppg - expected) * 22, -11, 11), 0, 100);
    }
  }
  if (fx.kind === 'cup' || fx.kind === 'cont') nextCupOrCont(s, fx, out, c.clubId);
  if (out.result === 'W') s.st.morale = clamp(s.st.morale + 0.8, 0, 100);
  else if (out.result === 'L') s.st.morale = clamp(s.st.morale - 0.8, 0, 100);
  s.fame.dom += 0;
}

export function coachSeasonEnd(s: GameState, rng: Rng): void {
  const c = s.coach;
  if (c.role === 'none') {
    c.fame = clamp(c.fame * 0.93, 0, 100);
    return;
  }
  if (c.role === 'national') {
    nationalSeasonPerf(s, rng);
  } else if (c.clubId) {
    const lgId = s.career.cur.leagueId;
    const rt = s.world.leagues[lgId];
    if (rt && rt.table[c.clubId]) {
      const rank = ranking(s, lgId);
      const pos = rank.indexOf(c.clubId) + 1;
      c.tablePos = pos;
      const n = rank.length;
      let perf = (c.tableTarget - pos) / Math.max(1, n - 1);
      if (pos === 1) {
        awardTrophy(s, `${getLeague(lgId).ko} 우승`, c.clubId);
        c.trophies.push({ year: yearOf(s.week), name: `${getLeague(lgId).ko} 우승`, club: getClub(c.clubId).name });
        perf += 0.25;
      }
      const lvl = clubLvl(s, c.clubId);
      const w = LEVEL_WAGE_MULT[lvl];
      const roleMul = c.role === 'manager' ? 1 : c.role === 'assistant' ? 0.45 : 0.18;
      const gain = (perf * 22 + (pos === 1 ? 10 : 0)) * Math.sqrt(w) * 0.55 * roleMul;
      c.fame = clamp(c.fame * 0.93 + Math.max(0, gain) + (c.role === 'manager' ? 2.1 : 0.9) * (lvl / 3), 0, 100);
      if (c.role === 'manager') c.standing = clamp(c.standing + perf * 45 + (pos === 1 ? 15 : 0) + (60 - c.standing) * 0.1, 0, 100);
      c.trophies.push(...s.career.cur.trophies.filter((t) => !t.includes('리그')).map((t) => ({ year: yearOf(s.week), name: t, club: getClub(c.clubId).name })));
    }
  }
  c.peakFame = Math.max(c.peakFame, c.fame);
  developSquad(s, rng);
  for (const k of ['tactics', 'development', 'leadership', 'management', 'media', 'data'] as const) {
    c.skills[k] = clamp(c.skills[k] + rng.float(0.2, 1.4) * (c.skills[k] < c.cap ? 1 : 0), 0, c.cap);
  }
  if (c.role === 'manager' && c.standing < 30) {
    fireCoach(s, rng, '성적 부진으로 경질됐다.');
    return;
  }
  if (c.role === 'national' && c.standing < 30) {
    fireCoach(s, rng, '대표팀 성적 부진으로 협회가 결별을 통보했다.');
    return;
  }
  const con = c.contract;
  if (con && con.endW <= s.week + 1) {
    const renew = (c.role === 'manager' ? c.standing >= 45 && rng.chance(c.standing >= 70 ? 0.93 : 0.7) : rng.chance(0.85));
    if (renew) {
      con.endW += (c.role === 'manager' ? 2 : 2) * 52;
      con.wage = Math.round(con.wage * 1.08);
      addLog(s, 'system', '재계약', sys(s, 'coachRenew'), []);
    } else {
      closeCoachSeason(s, rng, false, '계약 만료', true);
      leaveJob(s);
      addLog(s, 'system', '계약 만료', sys(s, 'coachExpire'), []);
      return;
    }
  }
  closeCoachSeason(s, rng, false, '시즌 종료', true);
  c.seasonPts = 0;
  c.seasonGames = 0;
  c.halfFired = false;
  if (c.clubId) {
    ensureCountry(s, getClub(c.clubId).country);
    const lgId = s.career.cur.leagueId;
    const rank = s.world.leagues[lgId] ? ranking(s, lgId) : null;
    const cc = getClub(c.clubId).country;
    endSeasonCountry(s, cc, lgId, rank);
    s.world.countries[cc].initS = seasonOf(s.week) + 1;
  }
}

function nationalSeasonPerf(s: GameState, rng: Rng): number {
  const c = s.coach;
  const cc = getCountry(c.natCountry);
  const year = yearOf(s.week) + 1;
  let perf = 0;
  let any = false;
  for (const t of TOURNAMENTS) {
    if (t.confed !== 'ALL' && t.confed !== cc.confed) continue;
    if (year < t.firstYear || (year - t.firstYear) % t.every !== 0) continue;
    any = true;
    const strength = natTeamBase(c.natCountry) + coachBonus(s);
    const qualP = t.id === 'WC' ? 1 / (1 + Math.exp(-(cc.natBase - 66) / 5)) : 1 / (1 + Math.exp(-(cc.natBase - 58) / 6));
    if (!rng.chance(qualP)) {
      perf -= 0.5;
      addLog(s, 'system', t.ko, `${josa(cc.natTeam, '이')} ${year} ${t.ko} 본선에 오르지 못했다.`, []);
      continue;
    }
    const stages = t.stages.length;
    let reached = 0;
    for (let i = 0; i < stages - 1 + 1; i++) {
      const opp = clamp(62 + rng.normal(0, 8) + i * 2.4, 35, 95);
      const win = rng.chance(1 / (1 + Math.exp(-(strength - opp) / 9)) * (i === 0 ? 1.15 : 1));
      if (!win) break;
      reached = i + 1;
    }
    const target = Math.max(1, Math.round((cc.natBase - 55) / 12));
    perf += (reached - target) * 0.25;
    if (reached >= stages) {
      awardTrophy(s, `${t.ko} 우승 (${year}, 감독)`, '');
      c.trophies.push({ year, name: `${t.ko} 우승`, club: cc.natTeam });
      perf += 0.6;
    }
    addLog(s, 'system', t.ko, `${josa(cc.natTeam, '은')} ${year} ${t.ko}에서 ${t.stages[Math.min(stages - 1, Math.max(0, reached - 1))]}까지 올랐다.`, []);
  }
  if (!any) perf = (rng.normal(0, 0.15) + coachBonus(s) * 0.03);
  c.fame = clamp(c.fame * 0.93 + Math.max(0, perf * 14) + 1.5, 0, 100);
  c.standing = clamp(c.standing + perf * 40 + (60 - c.standing) * 0.1, 0, 100);
  return perf;
}

function developSquad(s: GameState, rng: Rng): void {
  const c = s.coach;
  const dev = c.skills.development;
  for (const p of c.squad) {
    const age = yearOf(s.week) + 1 - p.birthYear;
    if (age < 25) p.ovr = Math.min(p.pot, p.ovr + Math.round(rng.float(0, 3) + dev / 40));
    else if (age > 31) p.ovr = Math.max(30, p.ovr - rng.int(0, 2));
    if (age >= 36 || (age >= 33 && rng.chance(0.25))) {
      p.gone = true;
    }
  }
  const alive = c.squad.filter((p) => !p.gone);
  while (alive.length < 8 && c.clubId) {
    const code = getClub(c.clubId).country;
    const age = rng.int(18, 28);
    const np = makePerson(rng, s.ev, 'player', code, { age, refYear: yearOf(s.week) + 1, job: '선수', rel: rng.int(-5, 20), pos: randomPos(rng) as Pos, ovr: Math.round(clubStatic(s, c.clubId) + rng.normal(0, 4)), clubId: c.clubId });
    np.pot = Math.round(np.ovr + Math.max(0, 25 - age));
    alive.push(np);
  }
  c.squad = alive;
}

export function coachWeekly(s: GameState, rng: Rng): void {
  const c = s.coach;
  const sw = swOf(s.week);
  if (sw === 0 && s.week > 0 && c.role !== 'none') openCoachSeason(s);
  studyWeekly(s, rng);
  if (c.role === 'none') {
    c.jobless += 1;
    if (!s.decision && licenseLevel(s) >= 1 && c.jobless % 4 === 2 && rng.next() < 0.6 && !hasPendingOffer(s)) {
      const offers = genCoachOffers(s, rng, rng.int(1, 3));
      if (offers.length) presentOffers(s, offers, 'coachjob', '지도자 제안', '지도자로서 일할 기회가 찾아왔다.', true);
    }
  } else {
    if (c.role !== 'national') coachMatchWeek(s, rng);
    if (!s.decision && !hasPendingOffer(s) && s.week - c.lastOfferW > 40 && rng.next() < 0.012 + c.fame / 4000) {
      const offers = genCoachOffers(s, rng, 2);
      if (offers.length) { c.lastOfferW = s.week; presentOffers(s, offers, 'coachjob', '이직 제안', '다른 구단에서 당신을 눈여겨봤다.', true); }
    }
    if (c.role === 'manager' && sw === 30 && !c.halfFired && c.standing < 18) {
      c.halfFired = true;
      fireCoach(s, rng, '전반기 성적이 형편없어 시즌 도중 경질됐다.');
    }
  }
}

