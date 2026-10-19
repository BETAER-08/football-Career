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
