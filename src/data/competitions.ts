export interface ContComp {
  id: string;
  ko: string;
  confed: 'UEFA' | 'CONMEBOL' | 'AFC' | 'CAF' | 'CONCACAF';
  rank: number;
  mean: number;
  sd: number;
  advance: number;
}

export const CONT_COMPS: Record<string, ContComp> = {
  UCL: { id: 'UCL', ko: 'UEFA 챔피언스리그', confed: 'UEFA', rank: 1, mean: 82, sd: 7, advance: 10 },
  UEL: { id: 'UEL', ko: 'UEFA 유로파리그', confed: 'UEFA', rank: 2, mean: 72, sd: 7, advance: 10 },
  LIB: { id: 'LIB', ko: '코파 리베르타도레스', confed: 'CONMEBOL', rank: 1, mean: 72, sd: 7, advance: 10 },
  ACL: { id: 'ACL', ko: 'AFC 챔피언스리그 엘리트', confed: 'AFC', rank: 1, mean: 68, sd: 7, advance: 10 },
  CAF: { id: 'CAF', ko: 'CAF 챔피언스리그', confed: 'CAF', rank: 1, mean: 56, sd: 7, advance: 9 },
  CCC: { id: 'CCC', ko: 'CONCACAF 챔피언스컵', confed: 'CONCACAF', rank: 1, mean: 66, sd: 7, advance: 9 }
};

export const CONT_SLOTS: Record<string, [string, number][]> = {
  GB: [['UCL', 4], ['UEL', 2]],
  DE: [['UCL', 4], ['UEL', 2]],
  FR: [['UCL', 3], ['UEL', 2]],
  IT: [['UCL', 4], ['UEL', 2]],
  ES: [['UCL', 4], ['UEL', 2]],
  NL: [['UCL', 2], ['UEL', 2]],
  PT: [['UCL', 2], ['UEL', 2]],
  TR: [['UCL', 1], ['UEL', 2]],
  HR: [['UCL', 1], ['UEL', 1]],
  BR: [['LIB', 6]],
  AR: [['LIB', 5]],
  CO: [['LIB', 3]],
  UY: [['LIB', 3]],
  JP: [['ACL', 3]],
  KR: [['ACL', 3]],
  CN: [['ACL', 2]],
  SA: [['ACL', 3]],
  IR: [['ACL', 2]],
  IN: [['ACL', 1]],
  ID: [['ACL', 1]],
  VN: [['ACL', 1]],
  NG: [['CAF', 2]],
  EG: [['CAF', 2]],
  MA: [['CAF', 2]],
  GH: [['CAF', 1]],
  SN: [['CAF', 1]],
  CD: [['CAF', 2]],
  ET: [['CAF', 1]],
  KE: [['CAF', 1]],
  US: [['CCC', 3]],
  MX: [['CCC', 4]]
};

export const CONT_LP_WEEKS = [8, 10, 13, 15, 19, 21, 24, 26];
export const CONT_KO_WEEKS = [30, 35, 40, 45];
export const CONT_KO_NAMES = ['16강', '8강', '4강', '결승'];
export const CUP_WEEKS = [8, 13, 18, 23, 29, 36, 44];
export const CUP_STAGE_NAMES = ['1라운드', '2라운드', '3라운드', '16강', '8강', '4강', '결승'];
export const INTL_WINDOWS = [10, 14, 18, 36, 40];

export interface Tournament {
  id: string;
  ko: string;
  confed: 'ALL' | 'UEFA' | 'CONMEBOL' | 'AFC' | 'CAF' | 'CONCACAF';
  firstYear: number;
  every: number;
  teams: number;
  stages: string[];
}

export const TOURNAMENTS: Tournament[] = [
  { id: 'WC', ko: 'FIFA 월드컵', confed: 'ALL', firstYear: 2030, every: 4, teams: 48, stages: ['조별리그', '32강', '16강', '8강', '4강', '결승'] },
  { id: 'EURO', ko: 'UEFA 유로', confed: 'UEFA', firstYear: 2028, every: 4, teams: 24, stages: ['조별리그', '16강', '8강', '4강', '결승'] },
  { id: 'COPA', ko: '코파 아메리카', confed: 'CONMEBOL', firstYear: 2028, every: 4, teams: 16, stages: ['조별리그', '8강', '4강', '결승'] },
  { id: 'ASIAN', ko: 'AFC 아시안컵', confed: 'AFC', firstYear: 2027, every: 4, teams: 24, stages: ['조별리그', '16강', '8강', '4강', '결승'] },
  { id: 'AFCON', ko: '아프리카 네이션스컵', confed: 'CAF', firstYear: 2027, every: 2, teams: 24, stages: ['조별리그', '16강', '8강', '4강', '결승'] },
  { id: 'GOLD', ko: 'CONCACAF 골드컵', confed: 'CONCACAF', firstYear: 2027, every: 2, teams: 16, stages: ['조별리그', '8강', '4강', '결승'] }
];

export const COMPETITIONS_META = { note: '대회 명칭과 주기는 실제를 근사하며 세부 방식은 단순화했습니다.', estimate: true };

export type AgeLevel = 'u17' | 'u20' | 'u23';
export type AgeKind = 'wc' | 'cont' | 'multi';

export interface AgeTournament {
  id: string;
  ko: string;
  confed: 'ALL' | 'UEFA' | 'CONMEBOL' | 'AFC' | 'CAF' | 'CONCACAF';
  level: AgeLevel;
  kind: AgeKind;
  ageMax: number;
  wild: number;
  sw: number;
  firstYear: number;
  every: number;
  teams: number;
  stages: string[];
}

const S16 = ['조별리그', '8강', '4강', '결승'];
const S24 = ['조별리그', '16강', '8강', '4강', '결승'];
const S48 = ['조별리그', '32강', '16강', '8강', '4강', '결승'];

const CONT: [AgeTournament['confed'], string, string, string, number, number][] = [
  ['UEFA', 'UEFA U-17 유로', 'UEFA U-19 유로', 'UEFA', 1, 19],
  ['CONMEBOL', '남미 U-17 선수권', '남미 U-20 선수권', 'CONMEBOL', 2, 20],
  ['AFC', 'AFC U-17 아시안컵', 'AFC U-20 아시안컵', 'AFC', 2, 20],
  ['CAF', 'CAF U-17 네이션스컵', 'CAF U-20 네이션스컵', 'CAF', 2, 20],
  ['CONCACAF', 'CONCACAF U-17 선수권', 'CONCACAF U-20 선수권', 'CONCACAF', 2, 20]
];

export const AGE_TOURNAMENTS: AgeTournament[] = [
  { id: 'U17WC', ko: 'FIFA U-17 월드컵', confed: 'ALL', level: 'u17', kind: 'wc', ageMax: 17, wild: 0, sw: 18, firstYear: 2026, every: 1, teams: 48, stages: S48 },
  { id: 'U20WC', ko: 'FIFA U-20 월드컵', confed: 'ALL', level: 'u20', kind: 'wc', ageMax: 20, wild: 0, sw: 10, firstYear: 2027, every: 2, teams: 24, stages: S24 },
  { id: 'OLY', ko: '올림픽 남자 축구', confed: 'ALL', level: 'u23', kind: 'multi', ageMax: 23, wild: 3, sw: 3, firstYear: 2028, every: 4, teams: 16, stages: S16 },
  { id: 'ASIAD', ko: '아시안게임 남자 축구', confed: 'AFC', level: 'u23', kind: 'multi', ageMax: 23, wild: 3, sw: 10, firstYear: 2026, every: 4, teams: 24, stages: S24 },
  ...CONT.flatMap(([confed, k17, k20, , every17, age20]): AgeTournament[] => [
    { id: `${confed}_U17`, ko: k17, confed, level: 'u17', kind: 'cont', ageMax: 17, wild: 0, sw: 40, firstYear: 2027, every: every17, teams: 16, stages: S16 },
    { id: `${confed}_U20`, ko: k20, confed, level: 'u20', kind: 'cont', ageMax: age20, wild: 0, sw: 28, firstYear: 2027, every: 2, teams: 16, stages: S16 }
  ])
];

export const AGE_META = { note: '연령별 대회의 주기·출생 연도 기준은 실제 규정을 근사했습니다. 대륙 대회는 예선을 겸하며 8강 이상이 월드컵 본선 진출로 이어집니다.', estimate: true };

export function ageHeld(t: AgeTournament, year: number): boolean {
  return year >= t.firstYear && (year - t.firstYear) % t.every === 0;
}

export function ageEligible(t: AgeTournament, birthYear: number, year: number): boolean {
  return birthYear >= year - t.ageMax;
}

export function ageEligibleYears(birthYear: number, confed: string, from: number, to: number): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const t of AGE_TOURNAMENTS) {
    if (t.confed !== 'ALL' && t.confed !== confed) continue;
    const ys: number[] = [];
    for (let y = from; y <= to; y++) if (ageHeld(t, y) && ageEligible(t, birthYear, y)) ys.push(y);
    out[t.id] = ys;
  }
  return out;
}

export function ageSchedule(from: number, to: number): { year: number; id: string; ko: string }[] {
  const rows: { year: number; id: string; ko: string }[] = [];
  for (let y = from; y <= to; y++) for (const t of AGE_TOURNAMENTS) if (ageHeld(t, y) && t.kind !== 'cont') rows.push({ year: y, id: t.id, ko: t.ko });
  return rows;
}
