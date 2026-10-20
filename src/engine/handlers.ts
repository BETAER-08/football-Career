import { registerFx } from './fx';
import { addLog, toast } from './log';
import { clamp } from './rng';
import { ageAt, seasonOf, yearOf } from './time';
import { genName, makePerson } from './relations';
import { INJURY_BY_ID } from '../data/injuries';
import { startInjury, injuryEndsCareer } from './health';
import { retirePlayer, endGame } from './lifecycle';
import { isCosmetic } from './flags';
import { leaveToFree, genOffers, joinClub, makeOfferFor, buildClubPeople, setupClubSeason, fallbackOffer } from './transfer';
import { presentOffers, hasPendingOffer } from './offers';
import { playIntl } from './season';
import { clubLvl } from './world';
import { getClub, getCountry, leaguesOf } from './data';
import type { GameState, PersonKind } from './types';
import { TRAIT_LABEL } from './player';
import { scholarWage } from './youth';

function afterInjury(s: GameState, rng: import('./rng').Rng, id: string): void {
  const age = ageAt(s.p.birth, s.week);
  if (injuryEndsCareer(s, rng, id, age)) {
    const def = INJURY_BY_ID[id];
    retirePlayer(s, rng, `${def.ko}의 후유증으로 더는 선수 생활을 이어갈 수 없었다.`, true);
  }
}

export function addPerson(s: GameState, rng: import('./rng').Rng, key: string, kind: PersonKind, opts: { age: number; job: string; rel: number }): void {
  s.people[key] = makePerson(rng, s.ev, kind, s.p.country, { age: opts.age, refYear: yearOf(s.week), job: opts.job, rel: opts.rel });
}

registerFx('inj', (s, { rng }, arg) => {
  if (s.st.injury) return;
  const age = ageAt(s.p.birth, s.week);
  const inj = startInjury(s, rng, arg || null, age);
  toast(s, `${inj.ko} (${inj.part}) — ${inj.total}주`);
  afterInjury(s, rng, inj.id);
});
registerFx('earlyReturn', (s) => {
  s.st.rehabEarly = true;
  s.st.morale = clamp(s.st.morale + 3, 0, 100);
});
registerFx('fullRehab', (s) => {
  s.st.rehabEarly = false;
  s.st.health = clamp(s.st.health + 4, 0, 100);
});
registerFx('newAgent', (s, { rng }, arg) => {
  const age = rng.int(34, 58);
  addPerson(s, rng, 'agent', 'agent', { age, job: '에이전트', rel: rng.int(10, 35) });
  s.fin.agentSkill = arg === 'good' ? rng.int(60, 90) : arg === 'bad' ? rng.int(15, 40) : rng.int(35, 80);
  s.fin.agentFee = rng.int(5, 10);
  addLog(s, 'system', '에이전트 계약', `${s.people.agent.name}와(과) 에이전트 계약을 맺었다.`, []);
});
registerFx('agentFee', (s, _c, arg) => {
  s.fin.agentFee = Number(arg);
});
registerFx('reinjure', (s) => {
  s.ev.flags.reinjure = s.week;
});
registerFx('agentGone', (s) => {
  if (s.people.agent) s.people.agent.gone = true;
  s.fin.agentSkill = 0;
});
registerFx('agentFraud', (s, { rng }) => {
  const loss = Math.round(s.fin.cash * rng.float(0.25, 0.5) + s.fin.deposit * rng.float(0.1, 0.3));
  s.fin.cash = Math.max(0, s.fin.cash - Math.round(s.fin.cash * 0.3));
  s.fin.deposit = Math.max(0, s.fin.deposit - Math.round(s.fin.deposit * 0.2));
  if (s.people.agent) { s.people.agent.gone = true; s.people.agent.rel = -90; }
  s.fin.agentSkill = 0;
  s.ev.flags.agent_fraud = s.week;
  return [{ k: '횡령 피해', d: -loss, u: '만' }];
});
registerFx('newCoach', (s, { rng }) => {
  const clubId = s.career.clubId;
  if (!clubId) return;
  const p = makePerson(rng, s.ev, 'coach', getClub(clubId).country, { age: rng.int(38, 62), refYear: yearOf(s.week), job: '신임 감독', rel: rng.int(-8, 8), clubId });
  p.traitVal = rng.normal(0, 0.55);
  s.people.coach = p;
  toast(s, `새 감독 ${p.name} 부임 (${p.style})`);
});
registerFx('romance', (s, { rng }) => {
  if (s.life.romance === 'dating' || s.life.romance === 'married') return;
  const age = ageAt(s.p.birth, s.week);
  addPerson(s, rng, 'partner', 'partner', { age: clamp(age + rng.int(-3, 4), 16, 45), job: rng.pick(['대학생', '간호사', '디자이너', '교사', '모델', '회사원', '요리사', '의대생']), rel: rng.int(30, 55) });
  s.life.romance = 'dating';
  s.life.romanceW = s.week;
  s.st.happy = clamp(s.st.happy + 6, 0, 100);
});
registerFx('breakup', (s) => {
  if (s.people.partner) { s.people.partner.gone = true; s.people.partner.rel = Math.min(s.people.partner.rel, 0); delete s.people.partner; }
  if (s.life.romance === 'dating') s.life.romance = 'single';
  s.st.happy = clamp(s.st.happy - 6, 0, 100);
});
registerFx('marry', (s) => {
  if (!s.people.partner) return;
  s.life.romance = 'married';
  s.life.romanceW = s.week;
  s.st.happy = clamp(s.st.happy + 8, 0, 100);
  s.people.partner.rel = clamp(s.people.partner.rel + 12, -100, 100);
  addLog(s, 'milestone', '결혼', `${s.people.partner.name}와(과) 결혼했다.`, [], { star: true });
});
registerFx('divorce', (s) => {
  if (s.life.romance !== 'married') return;
  s.life.romance = 'divorced';
  s.life.divorced = true;
  const loss = Math.round((s.fin.cash + s.fin.deposit * 0.5) * 0.35);
  s.fin.cash = Math.max(0, s.fin.cash - Math.round(loss * 0.6));
  s.fin.deposit = Math.max(0, s.fin.deposit - Math.round(loss * 0.4));
  delete s.people.partner;
  s.st.happy = clamp(s.st.happy - 14, 0, 100);
  s.st.stress = clamp(s.st.stress + 12, 0, 100);
  addLog(s, 'milestone', '이혼', '결혼 생활이 막을 내렸다.', [], { star: true });
  return [{ k: '재산 분할', d: -loss, u: '만' }];
});
registerFx('child', (s, { rng }) => {
  const n = s.life.children + 1;
  s.life.children = n;
  const nm = genName(rng, s.p.country);
  s.people[`child${n}`] = makePerson(rng, s.ev, 'child', s.p.country, { age: 0, refYear: yearOf(s.week), name: nm.name, en: nm.en, job: '자녀', rel: 70 });
  s.st.happy = clamp(s.st.happy + 7, 0, 100);
  addLog(s, 'milestone', '아이가 태어났다', `${nm.name}이(가) 태어났다.`, [], { star: true });
});
registerFx('parentIll', (s) => {
  s.ev.flags.parent_ill = s.week;
  s.st.stress = clamp(s.st.stress + 8, 0, 100);
});
registerFx('parentPass', (s, _c, arg) => {
  const key = arg === 'mother' ? 'mother' : 'father';
  const p = s.people[key];
  if (!p) return;
  p.gone = true;
  p.note = '별세';
  s.st.happy = clamp(s.st.happy - 16, 0, 100);
  s.st.stress = clamp(s.st.stress + 14, 0, 100);
  s.st.morale = clamp(s.st.morale - 10, 0, 100);
  s.ev.flags.bereaved = s.week;
});
registerFx('trait', (s, _c, arg) => {
  const add = arg.startsWith('+');
  const id = arg.slice(1);
  const set = new Set(s.ab.traits);
  if (add && set.size < 6 && !set.has(id)) { set.add(id); addLog(s, 'milestone', '플레이 특성', `플레이 특성 획득: ${TRAIT_LABEL[id] ?? id}`, []); }
  if (!add) set.delete(id);
  s.ab.traits = [...set];
});
registerFx('posShift', (s, _c, arg) => {
  const np = arg as import('./types').Pos;
  const prof = s.ab.sec[np] ?? 30;
  const old = s.ab.pos;
  s.ab.sec[old] = Math.max(30, 100 - Math.max(0, 70 - prof));
  delete s.ab.sec[np];
  s.ab.pos = np;
  addLog(s, 'milestone', '포지션 변경', `주 포지션이 ${np}(으)로 바뀌었다.`, []);
});
registerFx('secPos', (s, { rng }, arg) => {
  const np = arg as import('./types').Pos;
  s.ab.sec[np] = clamp((s.ab.sec[np] ?? 20) + rng.int(10, 25), 0, 100);
});
registerFx('natYes', (s, { rng }) => {
  if (s.st.injury || !s.career.clubId) return;
  s.nat.status = 'senior';
  const out = playIntl(s, rng, 'A매치');
  if (out.played) toast(s, `대표팀 경기: ${out.line}`);
  else toast(s, '대표팀 명단에 이름을 올렸지만 출전하지는 못했다.');
  if (s.people.natcoach) s.people.natcoach.rel = clamp(s.people.natcoach.rel + 4, -100, 100);
  if (s.people.coach) s.people.coach.rel = clamp(s.people.coach.rel + 1, -100, 100);
  s.st.fatigue = clamp(s.st.fatigue + 4, 0, 100);
});
registerFx('natNo', (s) => {
  s.nat.declined += 1;
  if (s.people.natcoach) s.people.natcoach.rel = clamp(s.people.natcoach.rel - 12, -100, 100);
  if (s.people.coach) s.people.coach.rel = clamp(s.people.coach.rel + 3, -100, 100);
  s.fame.dom = clamp(s.fame.dom - 1, 0, 100);
});
registerFx('release', (s) => {
  leaveToFree(s, '구단의 방출 통보');
});
registerFx('retire', (s, { rng }, arg) => {
  retirePlayer(s, rng, arg ? arg.replace(/_/g, ' ') : '스스로 내린 결정이었다.');
});
registerFx('youthQuit', (s, { rng }) => {
  retirePlayer(s, rng, '축구를 포기하기로 했다.');
});
registerFx('offers', (s, { rng }, arg) => {
  const curLvl = s.career.clubId ? clubLvl(s, s.career.clubId) : 1;
  if (arg === 'loan') {
    const list = genOffers(s, rng, 'window', 2).filter((o) => clubLvl(s, o.clubId) <= curLvl);
    if (list.length) presentOffers(s, [{ ...list[0], loan: true, years: 1 }], 'window', '임대 제안', '임대로 출전 기회를 얻을 수 있다.', true);
    return;
  }
  const n = arg === 'many' ? 3 : 2;
  let list = genOffers(s, rng, arg === 'free' ? 'free' : 'window', n);
  if (arg === 'up') list = list.filter((o) => clubLvl(s, o.clubId) > curLvl);
  if (list.length) presentOffers(s, list, 'window', '이적 제안', '새로운 제안이 도착했다.', true);
  else toast(s, '구체적인 제안으로 이어지지는 않았다.');
});
registerFx('youthMove', (s, { rng }, arg) => {
  const cur = s.career.clubId ? clubLvl(s, s.career.clubId) : s.p.startLvl;
  const top = getCountry(s.p.country).top;
  const lvl = clamp(arg === 'up' ? cur + 1 : arg === 'down' ? cur - 1 : arg === 'low' ? 2 : cur, 2, top);
  const lgs = leaguesOf(s.p.country);
  const cands: string[] = [];
  for (const l of lgs) for (const id of l.clubIds) if (clubLvl(s, id) === lvl && id !== s.career.clubId) cands.push(id);
  if (!cands.length) for (const l of lgs) for (const id of l.clubIds) if (clubLvl(s, id) <= cur && id !== s.career.clubId) cands.push(id);
  if (!cands.length) return;
  const id = rng.pick(cands);
  const cs = getClub(id);
  s.career.clubsHist[s.career.clubsHist.length - 1].toS = seasonOf(s.week);
  s.career.clubId = id;
  s.career.clubsHist.push({ clubId: id, fromS: seasonOf(s.week), toS: -1 });
  if (s.career.contract) { s.career.contract.clubId = id; }
  buildClubPeople(s, rng, id, false);
  setupClubSeason(s, rng, id, true);
  s.career.cur.clubId = id;
  s.career.cur.clubName = cs.name;
  s.p.dorm = true;
  s.fin.housing = 'dorm';
  if (s.career.scholar === 1 && s.career.contract) s.career.contract.wage = scholarWage(s, false);
  addLog(s, 'milestone', '유스 이적', `${cs.name} ${s.career.youthStage} 팀으로 옮겼다.`, [], { star: true });
});
registerFx('scholar', (s, _c, arg) => {
  const con = s.career.contract;
  if (arg === 'none') {
    s.career.scholar = 2;
    return;
  }
  s.career.scholar = 1;
  if (con) con.wage = scholarWage(s, arg === 'high');
  addLog(s, 'milestone', '장학 계약', `${getClub(s.career.clubId).name}와(과) 유스 장학 계약을 맺었다.`, [], { star: true });
  return [{ k: '장학 수당', d: con ? con.wage : 0, u: '만' }];
});
registerFx('youthCap', (s) => {
  s.nat.youthCaps += 1;
  if (s.nat.status === 'none') s.nat.status = 'youth';
  if (s.nat.youthCaps === 1) addLog(s, 'milestone', '연령별 대표팀', `${getCountry(s.p.country).natTeam} 연령별 대표팀에 처음 선발됐다.`, [], { star: true });
});
registerFx('clubCrash', (s) => {
  s.ev.flags.club_crash = s.week;
  s.ev.flags.wage_unpaid = s.week;
  s.st.stress = clamp(s.st.stress + 8, 0, 100);
});
registerFx('clubRecover', (s) => {
  delete s.ev.flags.wage_unpaid;
  delete s.ev.flags.club_crash;
});
registerFx('sponsor', (s, _c, arg) => {
  const v = Number(arg);
  s.fin.sponsorYear = Math.max(0, s.fin.sponsorYear + v);
});
registerFx('lifestyle', (s, _c, arg) => {
  if (arg === 'smoke') s.st.smoker = true;
  if (arg === 'quitSmoke') s.st.smoker = false;
});
registerFx('rivalNew', (s, { rng }) => {
  const clubId = s.career.clubId;
  const r = makePerson(rng, s.ev, 'rival', clubId ? getClub(clubId).country : s.p.country, { age: clamp(ageAt(s.p.birth, s.week) + rng.int(-2, 3), 15, 36), refYear: yearOf(s.week), job: '같은 포지션 경쟁자', rel: rng.int(-25, 0), pos: s.ab.pos, ovr: Math.round(curOvrSafe(s) + rng.normal(0, 3)), pot: 70, clubId });
  s.people.rival = r;
});
function curOvrSafe(s: GameState): number {
  return s.ab.pot * 0.9;
}
registerFx('fraudLoss', (s, { rng }, arg) => {
  const pct = arg ? Number(arg) : 0.3;
  const base = s.fin.stocks + s.fin.business + s.fin.deposit * 0.5;
  const loss = Math.round(Math.max(base, s.fin.cash * 0.3) * pct * rng.float(0.8, 1.2));
  let rem = loss;
  const take = (key: 'stocks' | 'business' | 'deposit' | 'cash') => {
    const t = Math.min(s.fin[key], rem);
    s.fin[key] -= t;
    rem -= t;
  };
  take('business'); take('stocks'); take('deposit'); take('cash');
  return [{ k: '투자 사기 피해', d: -loss + rem, u: '만' }];
});
registerFx('econ', (s, _c, arg) => {
  s.fin.stockIndex *= 1 + Number(arg) / 100;
  s.fin.stocks = Math.max(0, Math.round(s.fin.stocks * (1 + Number(arg) / 100)));
});
registerFx('wageCatchup', (s) => {
  const c = s.career.contract;
  if (c) {
    const back = Math.round(c.wage * 0.2);
    s.fin.cash += back;
    return [{ k: '체불 임금 수령', d: back, u: '만' }];
  }
});
registerFx('contractMove', (s, { rng }) => {
  const clubId = s.career.clubId;
  if (!clubId) return;
  const o = fallbackOffer(s, rng, 'free');
  if (o) { o.trial = false; joinClub(s, rng, o, '이적'); }
});
registerFx('clubOpt', (s, { rng }, arg) => {
  const clubId = s.career.clubId;
  if (!clubId) return;
  const o = makeOfferFor(s, rng, clubId, 'renew', { renew: true });
  if (!o) return;
  if (arg === 'raise' && s.career.contract) {
    s.career.contract.wage = Math.round(s.career.contract.wage * 1.12);
    s.career.contract.endW += 52;
  } else if (arg === 'extend' && s.career.contract) s.career.contract.endW += 78;
});
registerFx('role', (s, _c, arg) => {
  if (s.career.contract) s.career.contract.role = arg as import('./types').Role;
});
registerFx('doping', (s) => {
  s.ev.flags.doping = s.week;
});
registerFx('banned', (s, _c, arg) => {
  s.ev.flags.suspended = s.week;
  s.st.sharp = clamp(s.st.sharp - Number(arg || 10), 0, 100);
});
registerFx('studyDegree', (s) => {
  s.life.eduLevel = Math.max(s.life.eduLevel, 2);
});
registerFx('moveHome', (s) => {
  s.fin.housing = 'family';
});
registerFx('houseBuy', (s) => {
  s.fin.housing = 'own';
});

import { ensureSomeOffer } from './offers';
registerFx('trialOffers', (s, { rng }) => {
  leaveToFree(s, '구단 방출');
  const offers = ensureSomeOffer(s, rng, 'free').map((o) => ({ ...o, trial: true }));
  if (offers.length) presentOffers(s, offers, 'free', '입단 테스트 기회', '여러 구단에서 테스트를 제안해 왔다.', true);
});

registerFx('langUp', (s, _c, arg) => {
  const id = s.career.clubId || s.coach.clubId;
  const code = id ? getClub(id).country : s.p.country;
  const lang = code !== s.p.country ? getCountry(code).lang : '영어';
  const v = Number(arg || 4);
  s.life.lang[lang] = clamp((s.life.lang[lang] ?? 0) + v, 0, 100);
  return [{ k: `${lang} 숙련`, d: v }];
});

registerFx('enlist', (s, { rng }) => {
  if (s.life.mil === 'serving' || s.life.mil === 'done' || s.life.mil === 'exempt') return;
  const id = 'KR:Gimcheon Sangmu';
  const o = makeOfferFor(s, rng, id, 'mil', { loan: true });
  const base = o ?? fallbackOffer(s, rng, 'free');
  if (!base) return;
  s.life.mil = 'serving';
  s.life.milEnd = s.week + 78;
  joinClub(s, rng, { ...base, clubId: id, loan: true, trial: false, years: 2 }, '병역 이행(김천 상무)');
  s.life.mil = 'serving';
  if (s.career.contract) s.career.contract.endW = s.life.milEnd;
  s.st.stress = clamp(s.st.stress + 3, 0, 100);
  addLog(s, 'milestone', '입대', '김천 상무에 입대해 병역 의무를 이행하기 시작했다.', [], { star: true });
});
registerFx('exempt', (s) => {
  s.life.mil = 'exempt';
  s.st.happy = clamp(s.st.happy + 10, 0, 100);
  s.fame.dom = clamp(s.fame.dom + 3, 0, 100);
  addLog(s, 'milestone', '병역 특례', '국제대회 입상으로 병역 특례 혜택을 받았다.', [], { star: true });
});
registerFx('milDefer', (s) => {
  s.ev.flags.mil_defer = s.week;
});

import { genCoachOffers } from './coach';
registerFx('coachOffers', (s, { rng }) => {
  if (s.decision || hasPendingOffer(s)) return;
  const offers = genCoachOffers(s, rng, 2).filter((o) => o.tag !== s.coach.role.replace('youthCoach', 'youth') || o.clubId.startsWith('NAT:'));
  if (offers.length) presentOffers(s, offers, 'coachjob', '이직 제안', '새로운 자리를 제안받았다.', true);
  else toast(s, '구체적인 제안은 아직 오지 않았다.');
});

import { setPath } from './postcareer';
registerFx('goCoach', (s, { rng }) => {
  if (s.phase === 'postcareer') setPath(s, rng, 'coach');
});
registerFx('goAdmin', (s, { rng }) => {
  if (s.phase === 'postcareer') setPath(s, rng, 'admin');
});
registerFx('goPundit', (s, { rng }) => {
  if (s.phase === 'postcareer') setPath(s, rng, 'pundit');
});
registerFx('adminBoost', (s, _c, arg) => {
  const v = Number(arg || 3);
  s.post.skill = clamp(s.post.skill + v, 0, 100);
  s.post.rep = clamp(s.post.rep + v, 0, 100);
});

import { advanceMilestone, MILESTONES, isEpiPath } from './postcareer';
registerFx('msUp', (s) => {
  const name = advanceMilestone(s);
  if (!name) return;
  const n = s.post.ms[s.post.path] ?? 0;
  addLog(s, 'milestone', '이정표', `${name}에 이르렀다. (${n}/4)`, [], { star: true });
  toast(s, `이정표 달성: ${name}`);
  if (isCosmetic()) s.cues.push('trophy');
});
registerFx('msDelay', (s) => {
  if (isEpiPath(s.post.path)) s.post.msWeek[s.post.path] = s.week;
});
registerFx('epiAsk', (s) => {
  s.post.askCount += 1;
});
registerFx('epiEnd', (s) => {
  const path = s.post.path;
  s.post.endedBy = path;
  const done = isEpiPath(path) ? (s.post.ms[path] ?? 0) : 0;
  void MILESTONES;
  endGame(s, done >= 4 ? '모든 이정표를 지나 오랜 축구 인생을 조용히 마무리했다.' : '새로운 일상으로 걸어 들어가며 축구 인생을 마무리했다.');
});
