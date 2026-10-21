import { openYouthSeason } from './yleague';
import { Rng, seedState, clamp, hashString } from './rng';
import { ALL_ATTRS, ATTR_GROUP, HIDDEN_KEYS, type AttrKey, type GameConfig, type GameState, type HiddenKey, type Person, type Pos } from './types';
import { ageProgress, curOvr, makeCeil, ovrOf, YOUTH_BONUS, START_MIN, rawForAnchored } from './attributes';
import { initWorld } from './worldsim';
import { STATE_VERSION } from './migrate';
import { getClub, getCountry, citiesOf } from './data';
import { rollOrigin, potentialMean, type RouletteResult } from './roulette';
import { FATHER_JOBS, MOTHER_JOBS, genName, makePerson, mediaPerson, randomPos } from './relations';
import { START_AGE, START_BIRTH_YEAR, START_YEAR } from './time';
import { ensureCountry } from './world';
import { emptyRec } from './records';
import { setupClubSeason } from './transfer';

export const TRAIT_LABEL: Record<string, string> = {
  fkSpec: '프리킥 스페셜리스트', physical: '몸싸움 선호', runner: '침투형', playmaker: '플레이메이커', shooter: '강한 슈팅',
  aerial: '헤더 강자', sweeper: '스위퍼 키퍼', bigMatch: '큰 경기 강자', ambi: '약발 무시', ironman: '철인', leaderT: '그라운드의 리더',
  dribbler: '드리블러', tackler: '태클 장인', crosser: '크로스 마스터', fragile: '유리몸', hothead: '다혈질', clutch: '결정적 순간의 사나이'
};

const ADJ: Record<Pos, Pos[]> = {
  ST: ['LW', 'RW', 'AM'], LW: ['RW', 'ST', 'AM'], RW: ['LW', 'ST', 'AM'], AM: ['CM', 'LW', 'RW', 'ST'], CM: ['AM', 'DM'],
  DM: ['CM', 'CB'], CB: ['DM', 'LB', 'RB'], LB: ['RB', 'LW', 'CB'], RB: ['LB', 'RW', 'CB'], GK: []
};

export function secondaryFor(rng: Rng, pos: Pos): Partial<Record<Pos, number>> {
  const out: Partial<Record<Pos, number>> = {};
  const adj = ADJ[pos].slice();
  rng.shuffle(adj);
  const n = pos === 'GK' ? 0 : rng.int(1, 2);
  for (let i = 0; i < n && i < adj.length; i++) out[adj[i]] = rng.int(20, 55);
  return out;
}

function cdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

function hiddenInit(rng: Rng, incomeTier: number, supportive: number): Record<HiddenKey, number> {
  const h = {} as Record<HiddenKey, number>;
  for (const k of HIDDEN_KEYS) h[k] = clamp(Math.round(rng.normal(50, 18)), 5, 95);
  h.thrift = clamp(h.thrift + (3 - incomeTier) * 4, 5, 95);
  h.family = clamp(Math.round(h.family * 0.6 + supportive * 0.4), 5, 95);
  h.ambition = clamp(h.ambition + (3 - incomeTier) * 3, 5, 95);
  return h;
}

function rumorText(pot: number, start: number, rng: Rng): string {
  const p = pot + rng.normal(0, 3.5);
  const lo = Math.round(Math.max(start + 4, pot - 5));
  const hi = Math.round(Math.min(95, pot + 5));
  const now = start >= 54 ? '지금도 또래 중 눈에 띄는 완성도이고' : start >= 47 ? '지금은 또래 평균 정도이고' : '지금은 아직 다듬을 곳이 많고';
  const tail = `시작 오버롤 ${Math.round(start)}, 잠재력은 ${lo}~${hi}쯤으로 점쳐진다.`;
  if (p >= 84) return `스카우트들 사이에서 "몇 년에 한 번 나올 재능"이라는 말이 돈다. ${now} ${tail}`;
  if (p >= 77) return `또래 최상위권이라는 평가가 스카우트 사이에 퍼져 있다. ${now} ${tail}`;
  if (p >= 70) return `꾸준히 크면 프로 무대까지는 닿을 수 있다는 소문이다. ${now} ${tail}`;
  if (p >= 62) return `재능은 평범하지만 성실함이 장점이라는 평이다. ${now} ${tail}`;
  return `재능보다 노력으로 승부를 봐야 한다는 이야기가 들린다. ${now} ${tail}`;
}

function famExpPick(rng: Rng): string {
  return rng.weighted(
    ['없음', '아버지가 하부리그 선수 출신', '삼촌이 프로 선수였다', '형이 유소년 선수로 뛴다', '할아버지가 동네 클럽 감독이었다', '어머니가 학교 체육 교사다'],
    [38, 14, 8, 14, 10, 16]
  );
}

function storyLines(rng: Rng, s: GameState, origin: RouletteResult, famExp: string): string[] {
  const name = s.p.name;
  const sib = s.people.sibling1;
  const lines: string[] = [];
  const city = s.p.hometown;
  const tier = s.p.incomeTier;
  const pool: [boolean, string[]][] = [
    [tier <= 2, [`${city}의 좁은 골목에서 ${sib ? '형제와' : '친구들과'} 맨발로 공을 찼다.`, `낡은 공 하나를 번갈아 차며 해가 질 때까지 골목을 뛰어다녔다.`]],
    [tier >= 4, [`집 근처 사설 클럽에서 일찍부터 정식 코칭을 받았다.`, `주말마다 아버지가 운전해 먼 훈련장까지 데려다주었다.`]],
    [famExp !== '없음', [`${famExp}. 어릴 때부터 축구가 집안의 화제였다.`, `${famExp}. 그 덕에 공이 늘 가까이 있었다.`]],
    [s.p.foot === 'L', [`왼발이 유난히 좋아 동네에서 별명이 붙었다.`]],
    [s.p.growth === 'late', [`또래보다 한참 작아 늘 몸싸움에서 밀렸지만 발밑만은 지지 않았다.`]],
    [s.p.growth === 'early', [`또래보다 키가 훌쩍 커서 어린 나이에 형들과 어울려 뛰었다.`]],
    [s.hid.pro > 62, [`모두가 돌아간 저녁에도 혼자 남아 벽에 공을 찼다.`]],
    [s.hid.temper > 65, [`경기에서 지면 며칠씩 말이 없어지는 아이였다.`]],
    [s.hid.social > 65, [`어디서든 금세 친구를 만드는 성격이라 팀에서도 늘 중심이었다.`]],
    [s.hid.family > 70, [`가족과 떨어지는 일이 가장 큰 걱정이었다.`]],
    [s.p.supportive < 40, [`부모님은 공부를 더 바랐고, 축구는 마지못해 허락받았다.`]],
    [s.ab.a.pace > 11, [`달리기만큼은 학교에서 누구에게도 지지 않았다.`]],
    [s.ab.a.passing > 10.5, [`공을 받으면 고개부터 드는 아이였다.`]],
    [s.p.dorm, [`${origin.country === s.p.country ? '' : ''}집을 떠나 구단 숙소에서 첫 시즌을 맞이한다.`]]
  ];
  const cand = pool.filter(([ok]) => ok).map(([, arr]) => rng.pick(arr));
  rng.shuffle(cand);
  const n = rng.int(3, 4);
  for (let i = 0; i < n && i < cand.length; i++) lines.push(cand[i]);
  if (lines.length < 3) lines.push(`${name}은(는) 어느 날 지역 스카우트의 눈에 띄어 유스 테스트를 받게 되었다.`);
  return lines.slice(0, 4);
}

export const START_MAX = 60;

export function scaleToOvr(a: Record<AttrKey, number>, pos: Pos, target: number): void {
  const base = {} as Record<AttrKey, number>;
  for (const k of ALL_ATTRS) base[k] = a[k];
  const want = rawForAnchored(target);
  let lo = 0.2;
  let hi = 6;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    const test = {} as Record<AttrKey, number>;
    for (const k of ALL_ATTRS) test[k] = clamp(base[k] * m, 1, 20);
    if (ovrOf(test, pos) < want) lo = m;
    else hi = m;
  }
  const f = (lo + hi) / 2;
  for (const k of ALL_ATTRS) a[k] = clamp(base[k] * f, 1, 20);
}

export interface Created { state: GameState; origin: RouletteResult }

export function originFromSeed(cfg: GameConfig): RouletteResult {
  const r = new Rng(seedState(cfg.seed + '|origin'));
  return rollOrigin(r);
}

export function createState(cfg: GameConfig, originIn?: RouletteResult): Created {
  const origin = originIn ?? originFromSeed(cfg);
  const rng = new Rng(seedState(cfg.seed + '|life'));
  const country = getCountry(origin.country);
  const club = getClub(origin.clubId);
  const nameGen = genName(rng, country.code);
  const name = cfg.name.trim() ? cfg.name.trim() : nameGen.name;
  const en = cfg.name.trim() ? cfg.name.trim() : nameGen.en;
  const month = rng.int(1, 6);
  const day = rng.int(1, 28);
  const cities = citiesOf(country.code);
  const cw = cities.map((c) => c.pop * (c.ko === club.city ? 6 : 1));
  const hc = rng.weighted(cities, cw);
  const sameAsClub = rng.chance(0.4);
  const hometown = sameAsClub ? club.city : hc.ko;
  const hometownEn = sameAsClub ? (cities.find((c) => c.ko === club.city)?.en ?? club.city) : hc.en;
  const dorm = hometown !== club.city;
  const z = rng.normal(0, 1) + ((country.gini - 35) / 60) * (origin.level >= 5 ? 0.6 : 0) + (origin.level >= 5 ? 0.25 : 0);
  const incomeTier = clamp(1 + Math.floor(5 * cdf(z)), 1, 5);
  const supportive = clamp(Math.round(rng.normal(66, 18)), 5, 98);
  const foot = rng.weighted<'R' | 'L' | 'B'>(['R', 'L', 'B'], [77, 20, 3]);
  const growth = rng.weighted<'early' | 'normal' | 'late'>(['early', 'normal', 'late'], [25, 50, 25]);
  const finalHeight = Math.round(clamp(rng.normal(country.height, 6.5), 150, 205));
  const frac = (growth === 'early' ? 0.935 : growth === 'late' ? 0.87 : 0.905) + rng.normal(0, 0.008);
  const height = Math.round(finalHeight * frac);
  const bmi = clamp(rng.normal(18.6, 1.5), 14.5, 26);
  const weight = Math.round(bmi * (height / 100) * (height / 100));
  const build = bmi < 17.4 ? '마름' : bmi > 20.2 ? '건장' : '보통';
  const pos: Pos = cfg.pos === 'random' ? randomPos(rng) : cfg.pos;
  const startLo = START_MIN[origin.level] ?? 40;
  const startOvr = Math.round(rng.float(startLo, START_MAX) * 10) / 10;
  let pot = rng.normal(potentialMean(origin.level, country.infra), 8);
  if (rng.chance(0.02)) pot += 8;
  pot += (startOvr - startLo) * 0.5;
  pot = Math.max(pot, (startOvr + 8.1) / 1.12);
  pot = clamp(Math.round(pot * 10) / 10, 38, 93);
  const nz = () => rng.normal(0, 1);
  const ceil = makeCeil(pos, pot, nz);
  const a = {} as Record<AttrKey, number>;
  const prev = {} as Record<AttrKey, number>;
  for (const k of ALL_ATTRS) {
    const g = ATTR_GROUP[k];
    const isGkAttr = g === 'gk';
    if (isGkAttr && pos !== 'GK') a[k] = ceil[k];
    else a[k] = clamp(ceil[k] * ageProgress(g, START_AGE, growth) + rng.normal(0, 0.5), 1, 20);
    prev[k] = a[k];
  }
  for (const k of ALL_ATTRS) ceil[k] = Math.min(20, ceil[k] * 1.14);
  scaleToOvr(a, pos, startOvr - YOUTH_BONUS);
  for (const k of ALL_ATTRS) if (ATTR_GROUP[k] !== 'gk' || pos === 'GK') ceil[k] = Math.max(ceil[k], a[k]);
  const hid = hiddenInit(rng, incomeTier, supportive);
  const refYear = START_YEAR;
  const st0 = { nextId: 1 };
  const people: Record<string, Person> = {};
  const clubCountry = country.code;
  const coachAge = rng.int(36, 58);
  people.coach = makePerson(rng, st0, 'coach', clubCountry, { age: coachAge, refYear, job: '유스 감독', rel: rng.int(0, 15), clubId: club.id });
  const fAge = rng.int(34, 52);
  const mAge = rng.int(33, 50);
  const fjob = rng.pick(FATHER_JOBS[incomeTier - 1]);
  const mjob = rng.pick(MOTHER_JOBS[incomeTier - 1]);
  const dadN = genName(rng, country.code);
  const momN = genName(rng, country.code);
  people.father = makePerson(rng, st0, 'father', country.code, { age: fAge, refYear, job: fjob, rel: rng.int(30, 70), name: dadN.name, en: dadN.en });
  people.mother = makePerson(rng, st0, 'mother', country.code, { age: mAge, refYear, job: mjob, rel: rng.int(35, 75), name: momN.name, en: momN.en });
  const nSib = rng.weighted([0, 1, 2, 3], [24, 42, 24, 10]);
  for (let i = 1; i <= nSib; i++) {
    people[`sibling${i}`] = makePerson(rng, st0, 'sibling', country.code, { age: clamp(START_AGE + rng.int(-6, 7), 3, 28), refYear, job: '학생', rel: rng.int(20, 65) });
  }
  const mateKeys = ['mate1', 'mate2', 'mate3'];
  for (const k of mateKeys) {
    people[k] = makePerson(rng, st0, 'mate', country.code, {
      age: START_AGE, refYear, job: '유스 동기', rel: rng.int(0, 30), pos: randomPos(rng), ovr: Math.round(pot * 0.6 + rng.normal(-3, 4)), pot: Math.round(pot + rng.normal(0, 6)), clubId: club.id
    });
  }
  people.captain = makePerson(rng, st0, 'captain', country.code, { age: START_AGE + 1, refYear, job: '유스팀 주장', rel: rng.int(0, 20), pos: randomPos(rng), ovr: Math.round(pot * 0.64), pot: Math.round(pot + 3), clubId: club.id });
  people.rival = makePerson(rng, st0, 'rival', country.code, { age: START_AGE, refYear, job: '같은 포지션 경쟁자', rel: rng.int(-20, 5), pos, ovr: Math.round(pot * 0.6), pot: Math.round(pot + rng.normal(2, 6)), clubId: club.id });
  people.fans = makePerson(rng, st0, 'fans', country.code, { age: 30, refYear, name: '팬', en: 'Fans', job: '서포터즈', rel: 0 });
  people.media = mediaPerson(rng, st0, country.code, refYear);
  people.media.rel = 0;
  const famExp = famExpPick(rng);
  const lgStat = getClub(origin.clubId).lg0;
  const ab = {
    a, ceil, prev, height, weight, bodyFat: Math.round(clamp(rng.normal(14, 2.5), 8, 24) * 10) / 10, pos, sec: secondaryFor(rng, pos),
    traits: [] as string[], pot: Math.min(95, Math.round(pot * 1.12 * 10) / 10), playShare: 0.6, growthMul: 1, dispAdj: 0, hFrac0: height / finalHeight, bmi0: weight / ((height / 100) * (height / 100))
  };
  ab.dispAdj = YOUTH_BONUS;
  const rumor = rumorText(Math.min(95, pot * 1.12), startOvr, rng);
  const state: GameState = {
    v: STATE_VERSION,
    cfg,
    rng: [0, 0, 0, 0],
    week: 0,
    phase: 'youth',
    ended: false,
    endReason: '',
    p: {
      name, en, birth: { y: START_BIRTH_YEAR, m: month, d: day }, country: country.code, hometown, hometownEn, dorm, foot, build, growth,
      finalHeight, story: [], rumor, startClubId: club.id, startLeagueId: lgStat, startLvl: origin.level, startOvr, incomeTier, supportive, famExp
    },
    ab,
    hid,
    st: {
      health: 100, fatigue: 10, sharp: 60, morale: 60, happy: 60, stress: 20, burnout: 0, form: [], sleep: 60 + Math.round(rng.normal(0, 8)), diet: 50 + Math.round(rng.normal(0, 8)),
      drink: 0, smoker: false, injury: null, injHist: [], chronic: {}, rehabEarly: false, recur: null
    },
    fin: {
      cash: 30, deposit: 0, stocks: 0, realEstate: 0, business: 0, debt: 0, sponsorYear: 0, followers: 20, housing: dorm ? 'dorm' : 'family',
      homeCity: hometown, car: 0, livingTier: Math.max(1, Math.min(4, incomeTier - 1)), familySupport: 0, trainer: 0, nutritionist: 0, psychCoach: 0,
      agentSkill: 0, agentFee: 0, yearIncome: 0, yearIncomeAcc: 0, stockIndex: 100, foundation: 0, stadium: false, parentsHouse: false
    },
    fame: { dom: 0, abroad: 0, value: Math.round(50 + pot * 2), peakValue: 0, peakFame: 0 },
    life: {
      eduLevel: 0, eduProgress: 0, studying: true, lang: { [country.lang]: 100 }, romance: 'single', romanceW: 0, children: 0, divorced: false,
      mil: country.mil ? 'pending' : 'none', milEnd: 0, habit: 0, vacationW: -99
    },
    nat: { stage: 'none', stageW: -1, lastWhy: [], matches: [], pool: {}, poolS: {}, coachStyle: 'attack', coachUntil: -1, mins10: [], injEndW: -99, ageRecs: [], caps: 0, goals: 0, youthCaps: 0, status: 'none', declined: 0, lastCallW: -99, tournaments: [], wcCount: 0, debut: false },
    career: {
      clubId: club.id, contract: {
        clubId: club.id, role: 'prospect', wage: 0, startW: 0, endW: 52 * 6, signing: 0, appBonus: 0, goalBonus: 0, titleBonus: 0, buyout: 0, loanFrom: '', youth: true
      },
      debuted: false, debutW: -1, seasons: [], cur: emptyRec(0, club.id, club.name, lgStat, '', origin.level), trophies: [], awards: [],
      clubsHist: [{ clubId: club.id, fromS: 0, toS: -1 }], maxLvl: origin.level, playedLvl5: false, lvl5Apps: 0, bigClub: false, retired: false, retireAge: 0, retireReason: '',
      freeAgentW: -1, lastOfferW: -99, upBias: 0, rejectCount: 0, endedByInjury: false, fixtures: [], cupAlive: true, cupRound: 0, contAlive: false,
      contStage: 0, contComp: '', contQualified: '', contPts: 0, contGames: 0, seasonMinsAcc: 0, seasonAvailAcc: 0, lastSeasonPos: 0, youthJudged: false, youthFailW: -1, youthStage: 'U15', stageSeasons: 0, scholar: 0,
      signed: false, track: 'pro', yCur: emptyRec(0, club.id, `${club.name} U15`, '', '', origin.level), ySeasons: [], yTrophies: [], yAwards: [],
      entry: { step: 0, trainW: -1, squadW: -1, squadN: 0, jumps: 0, jumpW: -1, boostEnd: -1, callups: 0, callupSeason: -1, doubleJump: false, midChecked: -1 },
      promisedRole: 'prospect', loanOut: false, nextLoanClub: '', transferReq: -1, reqStance: '', mkt: null, pre: null, faPressureW: -1, reqDir: '', resCur: emptyRec(0, club.id, '', '', '', origin.level), resSeasons: []
    },
    coach: {
      entered: false, licenses: { C: 0, B: 0, A: 0, P: 0 }, studying: '', studyEnd: 0, coachSeasons: 0, role: 'none', clubId: '', natCountry: '', contract: null,
      skills: { tactics: 0, development: 0, leadership: 0, management: 0, media: 0, data: 0, language: 0 }, talent: 0, cap: 0, fame: 0, peakFame: 0,
      standing: 60, fired: 0, recs: [], squad: [], offers: [], managerSeasons: 0, assistantSeasons: 0, everManager: false, everBig: false, everNat: false,
      jobless: 0, halfFired: false, tablePos: 0, tablePts: 0, tableTarget: 0, quit: false, trophies: [], lastOfferW: -99, seasonPts: 0, seasonGames: 0
    },
    post: { path: 'none', adminRole: '', skill: 0, rep: 0, income: 0, enteredW: 0, legendEvents: 0, ms: {}, msWeek: {}, lastAsk: -1, askCount: 0, endedBy: '', epiWeeks: 0 },
    people,
    ev: { cd: {}, count: {}, recent: [], flags: {}, sched: [], pendSrc: {}, last: {}, bud: { s: -1, choiceT: 0, choiceN: 0, majorN: 0, minorN: 0, passT: 0, passN: 0, lastChoiceW: -99 }, actCd: {}, actUse: {}, nextId: st0.nextId, logSeq: 1, lastRollW: 0 },
    world: { countries: {}, leagues: {}, cupSeed: hashString(cfg.seed) },
    decision: null,
    decQueue: [],
    result: null,
    log: [],
    toasts: [],
    focus: 'tech',
    auto: false,
    inputs: [],
    score: 0,
    extra: { champs: 0, ballon: 0, podium: 0, lastSwitch: 0 },
    decCtx: {},
    hist: [],
    wld: initWorld(cfg.seed, people, club.id, country.code, origin.level, START_YEAR),
    reviews: [],
    pendingReview: -1,
    goals: null,
    dream: '',
    dreamHits: [],
    snap: { ovr: 0, val: 0, wage: 0, fame: 0, standing: 60 },
    cues: [],
    why: {},
    recent: [],
    yt: null
  };
  state.snap = { ovr: curOvr(state.ab), val: state.fame.value, wage: 0, fame: 0, standing: 60 };
  state.rng = seedState(cfg.seed + '|sim');
  state.p.story = storyLines(rng, state, origin, famExp);
  ensureCountry(state, country.code);
  setupClubSeason(state, club.id, false);
  openYouthSeason(state);
  return { state, origin };
}
