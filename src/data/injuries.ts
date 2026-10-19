import { InjurySchema, type InjuryDef } from './schema';

export const INJURIES_META = {
  note: '부상 빈도와 기간은 프로 선수 연구에서 알려진 대략적인 분포(근육 부상 비중 최대, 평균 결장 3~5주, 전방십자인대 연 0.5~1%)를 근사한 추정치입니다.',
  estimate: true,
  source: '유럽 프로축구 부상 추적 연구 범주(UEFA Elite Club Injury Study 계열) 근사'
};

const raw = [
  { id: 'hamstring', ko: '햄스트링 근육 부상', part: '허벅지 뒤', weight: 22, minW: 2, maxW: 6, recur: 0.14, loss: 'pace-0.05' },
  { id: 'calf', ko: '종아리 근육 부상', part: '종아리', weight: 10, minW: 1, maxW: 4, recur: 0.1 },
  { id: 'groin', ko: '사타구니 부상', part: '사타구니', weight: 9, minW: 2, maxW: 6, recur: 0.12 },
  { id: 'quad', ko: '대퇴사두근 부상', part: '허벅지 앞', weight: 7, minW: 2, maxW: 5, recur: 0.08 },
  { id: 'ankle', ko: '발목 염좌', part: '발목', weight: 16, minW: 1, maxW: 5, recur: 0.1 },
  { id: 'mcl', ko: '무릎 내측인대 손상', part: '무릎', weight: 5, minW: 4, maxW: 10, recur: 0.07, loss: 'agility-0.1' },
  { id: 'meniscus', ko: '반월판 손상', part: '무릎', weight: 3, minW: 6, maxW: 16, recur: 0.08, loss: 'agility-0.2,pace-0.1' },
  { id: 'acl', ko: '전방십자인대 파열', part: '무릎', weight: 0.4, minW: 28, maxW: 44, recur: 0.06, loss: 'pace-0.6,accel-0.5,agility-0.4,jumping-0.3', severe: true },
  { id: 'metatarsal', ko: '중족골 골절', part: '발', weight: 2, minW: 6, maxW: 12, recur: 0.05 },
  { id: 'shoulder', ko: '어깨 탈구', part: '어깨', weight: 1.2, minW: 3, maxW: 8, recur: 0.1 },
  { id: 'concussion', ko: '뇌진탕', part: '머리', weight: 3, minW: 1, maxW: 3, recur: 0.04 },
  { id: 'back', ko: '허리 근육통', part: '허리', weight: 4, minW: 1, maxW: 4, recur: 0.15 },
  { id: 'achilles', ko: '아킬레스건염', part: '발목', weight: 3, minW: 3, maxW: 10, recur: 0.2, loss: 'accel-0.15' },
  { id: 'contusion', ko: '타박상', part: '다리', weight: 20, minW: 1, maxW: 2, recur: 0.02 },
  { id: 'illness', ko: '감기·몸살', part: '전신', weight: 15, minW: 1, maxW: 2, recur: 0.03 },
  { id: 'stress', ko: '피로골절', part: '정강이', weight: 1.5, minW: 8, maxW: 14, recur: 0.12, loss: 'stamina-0.1' },
  { id: 'hernia', ko: '탈장', part: '복부', weight: 0.6, minW: 6, maxW: 10, recur: 0.05 }
];

export const INJURIES: InjuryDef[] = raw.map((r) => InjurySchema.parse(r));
export const INJURY_BY_ID: Record<string, InjuryDef> = Object.fromEntries(INJURIES.map((i) => [i.id, i]));
