import type { RngState } from './rng';

export type Pos = 'GK' | 'CB' | 'LB' | 'RB' | 'DM' | 'CM' | 'AM' | 'LW' | 'RW' | 'ST';
export const POSITIONS: Pos[] = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'];
export const POS_LABEL: Record<Pos, string> = {
  GK: '골키퍼', CB: '센터백', LB: '왼쪽 풀백', RB: '오른쪽 풀백', DM: '수비형 미드필더', CM: '중앙 미드필더',
  AM: '공격형 미드필더', LW: '왼쪽 윙어', RW: '오른쪽 윙어', ST: '스트라이커'
};

export const TECH_KEYS = ['shooting', 'longShots', 'passing', 'longPassing', 'crossing', 'dribbling', 'firstTouch', 'tackling', 'marking', 'heading', 'freeKicks', 'penalties', 'weakFoot'] as const;
export const GK_KEYS = ['reflexes', 'handling', 'oneOnOne', 'aerial', 'kicking', 'buildUp'] as const;
export const PHYS_KEYS = ['pace', 'accel', 'stamina', 'strength', 'jumping', 'agility', 'balance', 'recovery'] as const;
export const MENTAL_KEYS = ['finishing', 'composure', 'vision', 'positioning', 'concentration', 'leadership', 'workRate', 'teamwork', 'aggression', 'creativity'] as const;
export type TechKey = (typeof TECH_KEYS)[number];
export type GkKey = (typeof GK_KEYS)[number];
export type PhysKey = (typeof PHYS_KEYS)[number];
export type MentalKey = (typeof MENTAL_KEYS)[number];
export type AttrKey = TechKey | GkKey | PhysKey | MentalKey;
export const ALL_ATTRS: AttrKey[] = [...TECH_KEYS, ...GK_KEYS, ...PHYS_KEYS, ...MENTAL_KEYS];
export type AttrGroup = 'tech' | 'gk' | 'phys' | 'mental';
export const ATTR_GROUP: Record<AttrKey, AttrGroup> = Object.fromEntries([
  ...TECH_KEYS.map((k) => [k, 'tech']), ...GK_KEYS.map((k) => [k, 'gk']),
  ...PHYS_KEYS.map((k) => [k, 'phys']), ...MENTAL_KEYS.map((k) => [k, 'mental'])
]) as Record<AttrKey, AttrGroup>;
export const ATTR_LABEL: Record<AttrKey, string> = {
  shooting: '슈팅', longShots: '중거리 슛', passing: '패스', longPassing: '롱패스', crossing: '크로스', dribbling: '드리블',
  firstTouch: '퍼스트터치', tackling: '태클', marking: '마킹', heading: '헤더', freeKicks: '프리킥', penalties: '페널티킥', weakFoot: '약발 능력',
  reflexes: '반응속도', handling: '핸들링', oneOnOne: '1대1', aerial: '공중볼', kicking: '킥', buildUp: '빌드업',
  pace: '속도', accel: '가속', stamina: '지구력', strength: '근력', jumping: '점프', agility: '민첩성', balance: '밸런스', recovery: '회복력',
  finishing: '결정력', composure: '침착성', vision: '시야', positioning: '위치선정', concentration: '집중력', leadership: '리더십',
  workRate: '활동량', teamwork: '팀워크', aggression: '공격성', creativity: '창의성'
};

export const HIDDEN_KEYS = ['pro', 'ambition', 'loyalty', 'temper', 'injuryProne', 'bigGame', 'adapt', 'controversy', 'social', 'thrift', 'family'] as const;
export type HiddenKey = (typeof HIDDEN_KEYS)[number];
export const HIDDEN_LABEL: Record<HiddenKey, string> = {
  pro: '프로의식', ambition: '야망', loyalty: '충성심', temper: '기질', injuryProne: '부상 체질', bigGame: '큰 경기 강심장',
  adapt: '해외 적응력', controversy: '논란 성향', social: '사교성', thrift: '검소함', family: '가족 중시'
};

export type Phase = 'youth' | 'pro' | 'coach' | 'postcareer';
export type Role = 'starter' | 'rotation' | 'prospect' | 'backup';
export const ROLE_LABEL: Record<Role, string> = { starter: '주전', rotation: '로테이션', prospect: '유망주', backup: '백업' };

export type PersonKind = 'coach' | 'captain' | 'mate' | 'rival' | 'agent' | 'father' | 'mother' | 'sibling' | 'partner' | 'child' | 'fans' | 'media' | 'natcoach' | 'director' | 'owner' | 'player' | 'friend';

export interface Person {
  id: string;
  kind: PersonKind;
  name: string;
  en: string;
  birthYear: number;
  job: string;
  style: string;
  rel: number;
  ovr: number;
  pot: number;
  pos: Pos | '';
  clubId: string;
  gone: boolean;
  note: string;
  trait: string;
  traitVal: number;
}

export interface Chip {
  k: string;
  d: number;
  u?: string;
}

export interface LogEntry {
  id: number;
  w: number;
  kind: 'passive' | 'choice' | 'system' | 'match' | 'milestone' | 'chain' | 'moment';
  title: string;
  text: string;
  chips: Chip[];
  note?: string;
  star?: boolean;
  heavy?: boolean;
  help?: string;
}

export interface Contract {
  clubId: string;
  role: Role;
  wage: number;
  startW: number;
  endW: number;
  signing: number;
  appBonus: number;
  goalBonus: number;
  titleBonus: number;
  buyout: number;
  loanFrom: string;
  youth: boolean;
}

export interface SeasonRec {
  s: number;
  year: number;
  clubId: string;
  clubName: string;
  leagueId: string;
  leagueName: string;
  lvl: number;
  apps: number;
  starts: number;
  mins: number;
  goals: number;
  assists: number;
  ratingSum: number;
  ratingN: number;
  cs: number;
  yc: number;
  rc: number;
  injDays: number;
  intApps: number;
  intGoals: number;
  pos: number;
  loan: boolean;
  trophies: string[];
  awards: string[];
  avail: number;
  done: boolean;
}

export interface TrophyRec { year: number; name: string; club: string }
export interface AwardRec { year: number; name: string }

export interface Injury {
  id: string;
  ko: string;
  part: string;
  weeksLeft: number;
  total: number;
  early: boolean;
  recurrence: boolean;
}

export interface Offer {
  id: number;
  clubId: string;
  role: Role;
  wage: number;
  years: number;
  signing: number;
  appBonus: number;
  goalBonus: number;
  buyout: number;
  loan: boolean;
  trial: boolean;
  exp: number;
  coachName: string;
  coachStyle: string;
  first: boolean;
  fromAgent: boolean;
  tag: string;
}

export interface Fixture {
  w: number;
  comp: string;
  kind: 'league' | 'cup' | 'cont' | 'friendly' | 'intl';
  opp: string;
  oppSt: number;
  ko: boolean;
  stage: string;
  home: boolean;
  big: boolean;
  final: boolean;
  round: number;
  oppId: string;
}

export interface LeagueRT {
  id: string;
  round: number;
  order: string[];
  table: Record<string, [number, number, number, number]>;
}

export interface ClubDyn { lg: string; st: number; fin: number }
export interface CountryRT { initS: number; clubs: Record<string, ClubDyn>; qual: Record<string, string> }

export interface Profile {
  name: string;
  en: string;
  birth: { y: number; m: number; d: number };
  country: string;
  hometown: string;
  hometownEn: string;
  dorm: boolean;
  foot: 'R' | 'L' | 'B';
  build: '마름' | '보통' | '건장';
  growth: 'early' | 'normal' | 'late';
  finalHeight: number;
  story: string[];
  rumor: string;
  startClubId: string;
  startLeagueId: string;
  startLvl: number;
  incomeTier: number;
  supportive: number;
  famExp: string;
}

export interface Abilities {
  a: Record<AttrKey, number>;
  ceil: Record<AttrKey, number>;
  prev: Record<AttrKey, number>;
  height: number;
  weight: number;
  bodyFat: number;
  pos: Pos;
  sec: Partial<Record<Pos, number>>;
  traits: string[];
  pot: number;
  playShare: number;
  growthMul: number;
}

export interface Status {
  health: number;
  fatigue: number;
  sharp: number;
  morale: number;
  happy: number;
  stress: number;
  burnout: number;
  form: number[];
  sleep: number;
  diet: number;
  drink: number;
  smoker: boolean;
  injury: Injury | null;
  injHist: { id: string; part: string; w: number }[];
  chronic: Record<string, number>;
  rehabEarly: boolean;
  recur: { id: string; w: number } | null;
}

export interface Finance {
  cash: number;
  deposit: number;
  stocks: number;
  realEstate: number;
  business: number;
  debt: number;
  sponsorYear: number;
  followers: number;
  housing: 'dorm' | 'family' | 'rent' | 'own';
  homeCity: string;
  car: number;
  livingTier: number;
  familySupport: number;
  trainer: number;
  nutritionist: number;
  psychCoach: number;
  agentSkill: number;
  agentFee: number;
  yearIncome: number;
  yearIncomeAcc: number;
  stockIndex: number;
  foundation: number;
  stadium: boolean;
  parentsHouse: boolean;
}

export interface Fame { dom: number; abroad: number; value: number; peakValue: number; peakFame: number }

export interface Life {
  eduLevel: number;
  eduProgress: number;
  studying: boolean;
  lang: Record<string, number>;
  romance: 'single' | 'dating' | 'married' | 'divorced';
  romanceW: number;
  children: number;
  divorced: boolean;
  mil: 'none' | 'pending' | 'serving' | 'done' | 'exempt';
  milEnd: number;
  habit: number;
  vacationW: number;
}

export interface NatState {
  caps: number;
  goals: number;
  youthCaps: number;
  status: 'none' | 'youth' | 'senior';
  declined: number;
  lastCallW: number;
  tournaments: string[];
  wcCount: number;
  debut: boolean;
}

export interface CareerState {
  clubId: string;
  contract: Contract | null;
  debuted: boolean;
  debutW: number;
  seasons: SeasonRec[];
  cur: SeasonRec;
  trophies: TrophyRec[];
  awards: AwardRec[];
  clubsHist: { clubId: string; fromS: number; toS: number }[];
  maxLvl: number;
  playedLvl5: boolean;
  lvl5Apps: number;
  bigClub: boolean;
  retired: boolean;
  retireAge: number;
  retireReason: string;
  freeAgentW: number;
  lastOfferW: number;
  upBias: number;
  rejectCount: number;
  endedByInjury: boolean;
  fixtures: Fixture[];
  cupAlive: boolean;
  cupRound: number;
  contAlive: boolean;
  contStage: number;
  contComp: string;
  contQualified: string;
  contPts: number;
  contGames: number;
  seasonMinsAcc: number;
  seasonAvailAcc: number;
  lastSeasonPos: number;
  youthJudged: boolean;
  youthFailW: number;
  promisedRole: Role;
  loanOut: boolean;
  nextLoanClub: string;
}

export interface CoachRec {
  s: number;
  year: number;
  clubId: string;
  clubName: string;
  leagueName: string;
  role: string;
  pos: number;
  target: number;
  pts: number;
  trophies: string[];
  fired: boolean;
}

export interface CoachState {
  entered: boolean;
  licenses: { C: number; B: number; A: number; P: number };
  studying: '' | 'C' | 'B' | 'A' | 'P';
  studyEnd: number;
  coachSeasons: number;
  role: 'none' | 'youthCoach' | 'assistant' | 'manager' | 'national';
  clubId: string;
  natCountry: string;
  contract: Contract | null;
  skills: { tactics: number; development: number; leadership: number; management: number; media: number; data: number; language: number };
  talent: number;
  cap: number;
  fame: number;
  peakFame: number;
  standing: number;
  fired: number;
  recs: CoachRec[];
  squad: Person[];
  offers: Offer[];
  managerSeasons: number;
  assistantSeasons: number;
  everManager: boolean;
  everBig: boolean;
  everNat: boolean;
  jobless: number;
  halfFired: boolean;
  tablePos: number;
  tablePts: number;
  tableTarget: number;
  quit: boolean;
  trophies: TrophyRec[];
  lastOfferW: number;
  seasonPts: number;
  seasonGames: number;
}

export interface PostState {
  path: 'none' | 'pundit' | 'admin' | 'business' | 'left';
  adminRole: '' | 'scout' | 'td' | 'gm';
  skill: number;
  rep: number;
  income: number;
  enteredW: number;
  legendEvents: number;
}

export interface EvState {
  cd: Record<string, number>;
  count: Record<string, number>;
  recent: string[];
  flags: Record<string, number>;
  sched: { id: string; at: number; exp: number }[];
  actCd: Record<string, number>;
  nextId: number;
  lastRollW: number;
}

export interface DecisionChoice {
  label: string;
  chips: Chip[];
  pct: number | null;
  disabled: string;
}

export interface Decision {
  uid: number;
  kind: 'event' | 'offer' | 'moment' | 'career' | 'youth' | 'retire' | 'coachjob';
  ref: string;
  title: string;
  text: string;
  choices: DecisionChoice[];
  w: number;
  heavy: boolean;
  help: string;
  ctx: string;
  offers: Offer[];
}

export interface ResultPanel {
  title: string;
  grade: 'great' | 'ok' | 'bad' | 'worst' | 'none';
  roll: number;
  need: number;
  text: string;
  changes: Chip[];
  later: boolean;
  w: number;
}

export interface WorldState {
  countries: Record<string, CountryRT>;
  leagues: Record<string, LeagueRT>;
  cupSeed: number;
}

export interface GameConfig {
  seed: string;
  name: string;
  pos: Pos | 'random';
  mode: 'normal' | 'daily' | 'code';
  code: string;
  lengthMin: 30 | 60 | 90;
}

export interface InputRec {
  w: number;
  t: 'focus' | 'choice' | 'action' | 'auto' | 'offer' | 'negotiate' | 'speed';
  a: string;
  b: number;
  c: string;
}

export interface Toast { id: number; w: number; text: string; chips: Chip[] }

export interface GameState {
  v: number;
  cfg: GameConfig;
  rng: RngState;
  week: number;
  phase: Phase;
  ended: boolean;
  endReason: string;
  p: Profile;
  ab: Abilities;
  hid: Record<HiddenKey, number>;
  st: Status;
  fin: Finance;
  fame: Fame;
  life: Life;
  nat: NatState;
  career: CareerState;
  coach: CoachState;
  post: PostState;
  people: Record<string, Person>;
  ev: EvState;
  world: WorldState;
  decision: Decision | null;
  decQueue: Decision[];
  result: ResultPanel | null;
  log: LogEntry[];
  toasts: Toast[];
  focus: string;
  auto: boolean;
  inputs: InputRec[];
  score: number;
  extra: { champs: number; ballon: number; lastSwitch: number };
  decCtx: Record<string, string>;
  hist: { s: number; age: number; ovr: number; val: number; fame: number }[];
}
