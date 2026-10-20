export type SchoolKind = 'HS' | 'UNI';

export interface SchoolDef {
  id: string;
  ko: string;
  country: string;
  kind: SchoolKind;
  city: string;
  tier: 0 | 1 | 2;
  real: boolean;
  certain: boolean;
  st0: number;
}

interface RealRow { ko: string; city: string }

const REAL: Record<string, Record<SchoolKind, RealRow[]>> = {
  KR: {
    HS: [
      { ko: '보인고', city: '서울' }, { ko: '언남고', city: '서울' }, { ko: '경신고', city: '서울' }, { ko: '영등포공고', city: '서울' },
      { ko: '부평고', city: '인천' }, { ko: '풍생고', city: '성남' }, { ko: '청주대성고', city: '청주' }, { ko: '강릉제일고', city: '강릉' }
    ],
    UNI: [
      { ko: '연세대', city: '서울' }, { ko: '고려대', city: '서울' }, { ko: '한양대', city: '서울' }, { ko: '명지대', city: '용인' }, { ko: '건국대', city: '서울' },
      { ko: '성균관대', city: '서울' }, { ko: '중앙대', city: '서울' }, { ko: '경희대', city: '용인' }, { ko: '단국대', city: '천안' }, { ko: '동국대', city: '서울' }
    ]
  },
  JP: {
    HS: [
      { ko: '아오모리야마다고', city: '아오모리' }, { ko: '이치후나바시고', city: '후나바시' }, { ko: '마에바시이쿠에이고', city: '마에바시' },
      { ko: '류쓰케이자이대 가시와고', city: '가시와' }, { ko: '시즈오카가쿠엔고', city: '시즈오카' }, { ko: '오쓰고', city: '구마모토' },
      { ko: '히가시후쿠오카고', city: '후쿠오카' }, { ko: '야마나시가쿠인고', city: '고후' }, { ko: '데이쿄나가오카고', city: '나가오카' },
      { ko: '세이료고', city: '가나자와' }, { ko: '욧카이치주오공고', city: '욧카이치' }
    ],
    UNI: [
      { ko: '쓰쿠바대', city: '쓰쿠바' }, { ko: '와세다대', city: '도쿄' }, { ko: '메이지대', city: '도쿄' }, { ko: '준텐도대', city: '인자이' },
      { ko: '호세이대', city: '도쿄' }, { ko: '간세이가쿠인대', city: '니시노미야' }, { ko: '도인요코하마대', city: '요코하마' },
      { ko: '류쓰케이자이대', city: '류가사키' }, { ko: '니혼타이이쿠대', city: '요코하마' }, { ko: '리쓰쇼대', city: '구마가야' }
    ]
  },
  US: {
    HS: [],
    UNI: [
      { ko: '인디애나대', city: '블루밍턴' }, { ko: '애크런대', city: '애크런' }, { ko: '웨이크포레스트대', city: '윈스턴세일럼' }, { ko: '메릴랜드대', city: '칼리지파크' },
      { ko: 'UCLA', city: '로스앤젤레스' }, { ko: '스탠퍼드대', city: '스탠퍼드' }, { ko: '버지니아대', city: '샬러츠빌' }, { ko: '클렘슨대', city: '클렘슨' },
      { ko: '듀크대', city: '더럼' }, { ko: '노터데임대', city: '사우스벤드' }, { ko: '조지타운대', city: '워싱턴' }, { ko: '시러큐스대', city: '시러큐스' }
    ]
  }
};

const GEN_CITIES: Record<string, string[]> = {
  KR: ['수원', '울산', '창원', '전주', '포항', '제주', '대전', '광주', '대구', '부산', '인천', '서울', '청주', '천안', '춘천', '목포', '순천', '안동', '김해', '원주'],
  JP: ['삿포로', '센다이', '도쿄', '요코하마', '나고야', '교토', '오사카', '고베', '히로시마', '후쿠오카', '가고시마', '니가타', '시즈오카', '나가노', '구마모토', '오이타', '마쓰야마', '가나가와', '지바', '사이타마'],
  US: ['시애틀', '포틀랜드', '샌디에이고', '덴버', '댈러스', '휴스턴', '시카고', '디트로이트', '애틀랜타', '마이애미', '뉴욕', '보스턴', '필라델피아', '컬럼버스', '오스틴', '샬럿', '내슈빌', '솔트레이크시티', '새크라멘토', '캔자스시티']
};

const SUFFIX: Record<string, Record<SchoolKind, string[]>> = {
  KR: { HS: ['', '제일', '중앙', '동', '서'], UNI: ['', '제일', '중앙'] },
  JP: { HS: ['', '제일', '중앙', '북', '남'], UNI: ['', '제일', '중앙'] },
  US: { HS: [], UNI: ['', '주립', '시티'] }
};

const END: Record<string, Record<SchoolKind, string>> = { KR: { HS: '고', UNI: '대' }, JP: { HS: '고', UNI: '대' }, US: { HS: '고', UNI: '대' } };

const EXCLUDED_PRO_AFFILIATED = new Set(['매탄고', '현대고', '광양제철고', '오산고', '포항제철고', '대건고', '영생고', '금호고', '동래고']);

const COUNTS: Record<string, Record<SchoolKind, number>> = { KR: { HS: 40, UNI: 30 }, JP: { HS: 48, UNI: 36 }, US: { HS: 0, UNI: 56 } };

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

function build(): SchoolDef[] {
  const out: SchoolDef[] = [];
  for (const country of Object.keys(REAL)) {
    for (const kind of ['HS', 'UNI'] as SchoolKind[]) {
      const used = new Set<string>();
      for (const r of REAL[country][kind]) {
        used.add(r.ko);
        out.push({ id: `${country}:S:${kind}:${r.ko}`, ko: r.ko, country, kind, city: r.city, tier: 0, real: true, certain: true, st0: 62 + hash(r.ko) * 10 });
      }
      const gen: string[] = [];
      const suffixes = SUFFIX[country][kind];
      for (const suf of suffixes) for (const c of GEN_CITIES[country]) gen.push(`${c}${suf}${END[country][kind]}`);
      const names = gen.filter((n) => !used.has(n) && !EXCLUDED_PRO_AFFILIATED.has(n)).sort((a, b) => hash(a + kind) - hash(b + kind)).slice(0, COUNTS[country][kind]);
      names.forEach((ko, i) => {
        const tier = i < names.length * 0.45 ? 1 : 2;
        const base = tier === 1 ? 46 : 34;
        out.push({ id: `${country}:S:${kind}:${ko}`, ko, country, kind, city: ko.replace(/(제일|중앙|동|서|남|북|주립|시티)?[고대]$/, ''), tier, real: false, certain: false, st0: base + hash(ko) * 12 });
      });
    }
  }
  return out;
}

export const SCHOOLS: SchoolDef[] = build();
export const SCHOOL_COUNTRIES = ['KR', 'JP', 'US'];

export function schoolsOf(country: string, kind: SchoolKind): SchoolDef[] {
  return SCHOOLS.filter((x) => x.country === country && x.kind === kind);
}

export function isSchoolId(id: string): boolean {
  return id.includes(':S:');
}
