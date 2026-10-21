import { CountrySchema, type Country } from './schema';

export const COUNTRIES_META = {
  note: '국가별 수치는 추정치이며 실제 통계와 다를 수 있습니다.',
  estimate: true
};

const flagOf = (code: string): string =>
  String.fromCodePoint(...[...code].map((ch) => 0x1f1a5 + ch.charCodeAt(0)));

type Row = [
  string, string, string, number, number, number, number, number, number,
  Country['confed'], number, number, number, string, 'given' | 'surname', '' | ' ', string, boolean
];

const rows: Row[] = [
  ['IN', '인도', 'India', 3, 0.2, 0.2, 60, 800, 0, 'AFC', 166, 33, 0.3, '힌디어', 'given', ' ', '인도 대표팀', false],
  ['CN', '중국', 'China', 3, 0.4, 0.45, 64, 2500, 1, 'AFC', 172, 38, 0.35, '중국어', 'surname', '', '중국 대표팀', false],
  ['NG', '나이지리아', 'Nigeria', 3, 0.3, 0.15, 74, 1500, 30, 'CAF', 169, 35, 0.25, '영어', 'given', ' ', '나이지리아 대표팀', false],
  ['PK', '파키스탄', 'Pakistan', 2, 0.1, 0.15, 52, 80, 0, 'AFC', 167, 30, 0.2, '우르두어', 'given', ' ', '파키스탄 대표팀', false],
  ['ID', '인도네시아', 'Indonesia', 3, 0.3, 0.3, 60, 1500, 2, 'AFC', 165, 38, 0.25, '인도네시아어', 'given', ' ', '인도네시아 대표팀', false],
  ['CD', '콩고민주공화국', 'DR Congo', 3, 0.15, 0.05, 68, 400, 20, 'CAF', 167, 42, 0.2, '프랑스어', 'given', ' ', '콩고민주공화국 대표팀', false],
  ['ET', '에티오피아', 'Ethiopia', 2, 0.1, 0.08, 56, 300, 0, 'CAF', 168, 35, 0.25, '암하라어', 'given', ' ', '에티오피아 대표팀', false],
  ['US', '미국', 'United States', 4, 0.8, 0.95, 75, 2500, 25, 'CONCACAF', 177, 41, 0.4, '영어', 'given', ' ', '미국 대표팀', false],
  ['BD', '방글라데시', 'Bangladesh', 2, 0.1, 0.2, 50, 200, 0, 'AFC', 166, 33, 0.2, '벵골어', 'given', ' ', '방글라데시 대표팀', false],
  ['BR', '브라질', 'Brazil', 5, 0.7, 0.45, 82, 9000, 120, 'CONMEBOL', 173, 52, 0.35, '포르투갈어', 'given', ' ', '브라질 대표팀', false],
  ['EG', '이집트', 'Egypt', 3, 0.45, 0.3, 70, 1200, 3, 'CAF', 170, 32, 0.22, '아랍어', 'given', ' ', '이집트 대표팀', false],
  ['MX', '멕시코', 'Mexico', 4, 0.6, 0.5, 74, 8500, 8, 'CONCACAF', 170, 45, 0.35, '스페인어', 'given', ' ', '멕시코 대표팀', false],
  ['PH', '필리핀', 'Philippines', 2, 0.15, 0.3, 50, 150, 0, 'AFC', 164, 41, 0.25, '타갈로그어', 'given', ' ', '필리핀 대표팀', false],
  ['KE', '케냐', 'Kenya', 2, 0.15, 0.12, 56, 300, 2, 'CAF', 170, 41, 0.3, '영어', 'given', ' ', '케냐 대표팀', false],
  ['VN', '베트남', 'Vietnam', 3, 0.35, 0.3, 60, 500, 0, 'AFC', 168, 36, 0.3, '베트남어', 'surname', ' ', '베트남 대표팀', false],
  ['TR', '튀르키예', 'Türkiye', 5, 0.6, 0.55, 74, 3500, 15, 'UEFA', 175, 44, 0.3, '튀르키예어', 'given', ' ', '튀르키예 대표팀', false],
  ['IR', '이란', 'Iran', 3, 0.4, 0.4, 70, 1000, 2, 'AFC', 173, 40, 0.25, '페르시아어', 'given', ' ', '이란 대표팀', false],
  ['GH', '가나', 'Ghana', 3, 0.3, 0.2, 72, 800, 25, 'CAF', 169, 43, 0.25, '영어', 'given', ' ', '가나 대표팀', false],
  ['JP', '일본', 'Japan', 4, 0.85, 0.85, 76, 2500, 25, 'AFC', 171, 33, 0.45, '일본어', 'surname', ' ', '일본 대표팀', false],
  ['CO', '콜롬비아', 'Colombia', 4, 0.55, 0.4, 76, 2000, 25, 'CONMEBOL', 171, 54, 0.3, '스페인어', 'given', ' ', '콜롬비아 대표팀', false],
  ['FR', '프랑스', 'France', 6, 0.95, 0.85, 85, 4000, 200, 'UEFA', 176, 32, 0.5, '프랑스어', 'given', ' ', '프랑스 대표팀', false],
  ['DE', '독일', 'Germany', 6, 0.95, 0.9, 84, 3500, 180, 'UEFA', 180, 31, 0.45, '독일어', 'given', ' ', '독일 대표팀', false],
  ['MA', '모로코', 'Morocco', 4, 0.5, 0.3, 76, 1000, 35, 'CAF', 172, 40, 0.3, '아랍어', 'given', ' ', '모로코 대표팀', false],
  ['GB', '잉글랜드', 'England', 6, 0.95, 0.85, 84, 4500, 250, 'UEFA', 177, 35, 0.45, '영어', 'given', ' ', '잉글랜드 대표팀', false],
  ['SA', '사우디아라비아', 'Saudi Arabia', 4, 0.5, 0.8, 70, 1200, 0, 'AFC', 170, 46, 0, '아랍어', 'given', ' ', '사우디아라비아 대표팀', false],
  ['SN', '세네갈', 'Senegal', 3, 0.4, 0.12, 76, 600, 30, 'CAF', 172, 40, 0.3, '프랑스어', 'given', ' ', '세네갈 대표팀', false],
  ['AR', '아르헨티나', 'Argentina', 5, 0.7, 0.5, 83, 5000, 80, 'CONMEBOL', 175, 42, 0.35, '스페인어', 'given', ' ', '아르헨티나 대표팀', false],
  ['IT', '이탈리아', 'Italy', 6, 0.9, 0.8, 83, 4000, 220, 'UEFA', 177, 35, 0.45, '이탈리아어', 'given', ' ', '이탈리아 대표팀', false],
  ['ES', '스페인', 'Spain', 6, 0.95, 0.8, 85, 8000, 300, 'UEFA', 176, 34, 0.45, '스페인어', 'given', ' ', '스페인 대표팀', false],
  ['KR', '대한민국', 'South Korea', 4, 0.8, 0.8, 74, 1300, 6, 'AFC', 175, 31, 0.38, '한국어', 'surname', '', '대한민국 대표팀', true],
  ['NL', '네덜란드', 'Netherlands', 5, 0.95, 0.9, 82, 1500, 50, 'UEFA', 183, 29, 0.45, '네덜란드어', 'given', ' ', '네덜란드 대표팀', false],
  ['PT', '포르투갈', 'Portugal', 5, 0.9, 0.65, 83, 2000, 60, 'UEFA', 174, 34, 0.3, '포르투갈어', 'given', ' ', '포르투갈 대표팀', false],
  ['HR', '크로아티아', 'Croatia', 4, 0.75, 0.6, 80, 600, 30, 'UEFA', 181, 29, 0.3, '크로아티아어', 'given', ' ', '크로아티아 대표팀', false],
  ['UY', '우루과이', 'Uruguay', 4, 0.65, 0.55, 80, 900, 25, 'CONMEBOL', 175, 40, 0.3, '스페인어', 'given', ' ', '우루과이 대표팀', false]
];

export const COUNTRIES: Country[] = rows.map((r) =>
  CountrySchema.parse({
    code: r[0], ko: r[1], en: r[2], flag: flagOf(r[0]), top: r[3], infra: r[4], econ: r[5], natBase: r[6],
    pros: r[7], big: r[8], confed: r[9], height: r[10], gini: r[11], tax: r[12], lang: r[13],
    nameOrder: r[14], nameJoin: r[15], natTeam: r[16], mil: r[17]
  })
);

export const COUNTRY_BY_CODE: Record<string, Country> = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));

export const LEVEL_STARTER_OVR: Record<number, number> = { 2: 47, 3: 56, 4: 64, 5: 72, 6: 79 };
export const LEVEL_WAGE_MULT: Record<number, number> = { 2: 0.6, 3: 1, 4: 2.2, 5: 5, 6: 9 };
export const LEVEL_SCORE_WEIGHT: Record<number, number> = { 2: 2, 3: 4, 4: 7, 5: 12, 6: 18 };
