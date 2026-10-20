import { Rng, clamp } from './rng';
import { getCountry, namePool } from './data';
import type { GameState, Person, PersonKind, Pos } from './types';

export interface GenName { name: string; en: string }

export function genName(rng: Rng, code: string): GenName {
  const pool = namePool(code);
  const c = getCountry(code);
  const g = rng.pick(pool.given);
  const s = rng.pick(pool.surname);
  if (c.nameOrder === 'surname') return { name: s[1] + c.nameJoin + g[1], en: `${s[0]} ${g[0]}` };
  return { name: `${g[1]} ${s[1]}`, en: `${g[0]} ${s[0]}` };
}

export const COACH_STYLES = ['공격 축구를 선호', '수비 안정을 중시', '점유율 축구', '빠른 역습', '강한 압박', '엄격한 규율', '선수와 소통하는 타입', '유망주를 믿고 쓰는 타입', '베테랑 위주 기용', '로테이션을 즐김'];
export const AGENT_STYLES = ['협상에 강한 노련파', '발이 넓은 인맥형', '신뢰가 가는 성실파', '수수료에 민감한 사람', '언론 플레이에 능한 사람', '해외 구단과 연줄이 닿는 사람'];
export const FATHER_JOBS: string[][] = [
  ['일용직 노동자', '농부', '택시 기사', '건설 현장 인부', '청소 노동자'],
  ['공장 근로자', '배달 기사', '소규모 상점 주인', '버스 기사', '경비원'],
  ['회사원', '공무원', '자영업자', '교사', '기술자'],
  ['중견 기업 간부', '변호사', '의사', '개인 병원 원장', '건축가'],
  ['기업 임원', '중소기업 대표', '투자자', '부동산 사업가', '대형 병원 의사']
];
export const MOTHER_JOBS: string[][] = [
  ['가사 노동', '시장 상인', '식당 보조', '청소 노동자', '농부'],
  ['마트 직원', '미용사', '식당 주인', '재봉사', '간병인'],
  ['회사원', '교사', '간호사', '공무원', '약사'],
  ['대학 강사', '회계사', '변호사', '의사', '디자이너'],
  ['기업 임원', '병원 원장', '사업가', '건축가', '변호사']
];
const MEDIA_FIRST = ['기자', '해설위원', '칼럼니스트', '방송 기자', '스포츠 편집장'];

export function makePerson(rng: Rng, st: { nextId: number }, kind: PersonKind, country: string, opt: Partial<Person> & { age?: number; refYear: number }): Person {
  const n = genName(rng, country);
  const age = opt.age ?? 30;
  const style =
    opt.style ??
    (kind === 'coach' || kind === 'natcoach' ? rng.pick(COACH_STYLES) : kind === 'agent' ? rng.pick(AGENT_STYLES) : '');
  return {
    id: `p${st.nextId++}`,
    kind,
    name: opt.name ?? n.name,
    en: opt.en ?? n.en,
    birthYear: opt.refYear - age,
    job: opt.job ?? '',
    style,
    rel: opt.rel ?? Math.round(rng.normal(10, 14)),
    ovr: opt.ovr ?? 0,
    pot: opt.pot ?? 0,
    pos: opt.pos ?? '',
    clubId: opt.clubId ?? '',
    gone: false,
    note: opt.note ?? '',
    trait: opt.trait ?? '',
    traitVal: opt.traitVal ?? 0
  };
}

export function relChange(s: GameState, key: string, d: number): number {
  const p = s.people[key];
  if (!p) return 0;
  const before = p.rel;
  p.rel = clamp(p.rel + d, -100, 100);
  return p.rel - before;
}

export function relOf(s: GameState, key: string): number {
  const p = s.people[key];
  return p ? p.rel : 0;
}

export function personAge(p: Person, year: number): number {
  return year - p.birthYear;
}

export function mediaPerson(rng: Rng, st: { nextId: number }, country: string, refYear: number): Person {
  return makePerson(rng, st, 'media', country, { age: rng.int(32, 55), refYear, job: rng.pick(MEDIA_FIRST), rel: 0 });
}

export const POS_LIST: Pos[] = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'];
export const POS_W = [13.6, 18.2, 9.1, 9.1, 9.1, 13.6, 9.1, 9.1, 9.1, 13.6];

export function posPercent(pos: Pos): number {
  return (POS_W[POS_LIST.indexOf(pos)] / POS_W.reduce((a, b) => a + b, 0)) * 100;
}

export function randomPos(rng: Rng): Pos {
  return rng.weighted<Pos>(POS_LIST, POS_W);
}
