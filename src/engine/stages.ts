import type { YouthStage } from './types';

export const STAGE_ORDER: YouthStage[] = ['U15', 'U17', 'U19', 'RES'];
export const STAGE_TEAMS: Record<YouthStage, number> = { U15: 12, U17: 14, U19: 16, RES: 14, HS: 12, UNI: 12 };
export const STAGE_AGE: Record<YouthStage, number> = { U15: 14.5, U17: 16, U19: 18, RES: 20, HS: 17, UNI: 20 };
export const STAGE_EXPECT: Record<YouthStage, number> = { U15: 14, U17: 15.5, U19: 17.5, RES: 19.5, HS: 16.5, UNI: 20 };
export const STAGE_REF = 3.5;
export const STAGE_LABEL: Record<YouthStage, string> = { U15: 'U15', U17: 'U17', U19: 'U19', RES: '리저브', HS: '고교', UNI: '대학' };

export function nextStage(st: YouthStage): YouthStage | null {
  const i = STAGE_ORDER.indexOf(st);
  return i < 0 || i + 1 >= STAGE_ORDER.length ? null : STAGE_ORDER[i + 1];
}

export function gamesFor(teams: number): number {
  return (teams % 2 === 0 ? teams - 1 : teams) * 2;
}

const MIN_PRO_AGE: Record<string, number> = { GB: 17 };

export function minProAge(country: string): number {
  return MIN_PRO_AGE[country] ?? 16;
}

export const BTEAM_COUNTRIES = new Set(['ES', 'DE', 'PT', 'NL']);

export interface YouthNames { league: Partial<Record<YouthStage, string>>; cup: Partial<Record<YouthStage, string>> }

export const YOUTH_NAMES: Record<string, YouthNames> = {
  GB: { league: { U19: 'U18 프리미어리그', RES: '프리미어리그 2' }, cup: { U19: 'FA 유스컵' } },
  DE: { league: { U17: 'U17 분데스리가', U19: 'U19 분데스리가', RES: '레기오날리가(B팀)' }, cup: { U19: 'DFB 유스컵' } },
  ES: { league: { U19: '디비시온 데 오노르 후베닐', RES: '프리메라 페데라시온(B팀)' }, cup: { U19: '코파 데 캄페오네스 후베닐' } },
  IT: { league: { U17: '캄피오나토 나치오날레 U17', U19: '캄피오나토 프리마베라' }, cup: { U19: '코파 이탈리아 프리마베라' } },
  FR: { league: { U17: '샹피오나 나시오날 U17', U19: '샹피오나 나시오날 U19' }, cup: { U19: '쿠프 감바르델라' } },
  NL: { league: { U19: '에레디비시 U19', RES: '에이르스터 디비지(B팀)' }, cup: {} },
  PT: { league: { U19: '캄페오나투 나시오날 데 주니오르스', RES: '리가 포르투갈 2(B팀)' }, cup: {} },
  BR: { league: { U17: '캄페오나투 브라질레이루 Sub-17', U19: '캄페오나투 브라질레이루 Sub-20' }, cup: { U19: '코파 두 브라지우 Sub-20' } },
  US: { league: { U15: 'MLS NEXT U15', U17: 'MLS NEXT U17', U19: 'MLS NEXT U19' }, cup: {} },
  JP: { league: { U19: '프린스리그 U-18 프리미어' }, cup: { U19: '프린스 다카마도노미야배' } },
  KR: { league: { U15: 'K리그 주니어 U15', U17: 'K리그 주니어 U17', U19: 'K리그 주니어 U18' }, cup: {} },
  MX: { league: { U19: '리가 MX Sub-20' }, cup: {} },
  AR: { league: { U19: '레세르바 아르헨티나' }, cup: {} }
};

export function isSchoolStage(st: YouthStage): boolean {
  return st === 'HS' || st === 'UNI';
}

export const SCHOOL_NAMES: Record<string, { HS: { league: string; cup: string }; UNI: { league: string; cup: string } }> = {
  KR: { HS: { league: '전국 고등축구리그', cup: '고교 축구 왕중왕전' }, UNI: { league: 'U리그', cup: '대학축구선수권' } },
  JP: { HS: { league: '프린스리그', cup: '전국 고교축구선수권' }, UNI: { league: '지역 대학 리그', cup: '전일본 대학선수권' } },
  US: { HS: { league: '고교 리그', cup: '주 대항전' }, UNI: { league: 'NCAA 디비전 I', cup: 'NCAA 토너먼트' } }
};
