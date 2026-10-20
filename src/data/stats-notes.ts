import { StatNoteSchema, type StatNote } from './schema';

export const STAT_NOTES_META = { note: '통계 근거 문구는 대략적인 추정치이며 정확한 수치와 다를 수 있습니다.', estimate: true };

const raw: StatNote[] = [
  { id: 'inj_freq', text: '엘리트 프로 선수는 시즌당 평균 1.5~2.5회 부상을 입는 것으로 알려져 있습니다.', est: true },
  { id: 'inj_muscle', text: '축구 선수 부상 중 근육 부상이 가장 흔한 유형입니다.', est: true },
  { id: 'inj_acl', text: '전방십자인대 파열은 프로 선수 연간 약 0.5~1%에서 발생하며 복귀까지 7~10개월이 걸리고, 이후 재파열 위험이 높아집니다.', est: true },
  { id: 'inj_recur', text: '복귀 직후에는 같은 부위 재발 위험이 높아집니다.', est: true },
  { id: 'inj_early', text: '조기 복귀는 재발 위험을 높이는 것으로 알려져 있습니다.', est: true },
  { id: 'inj_concussion', text: '뇌진탕은 축구에서 드물지 않으며 충분한 휴식이 권고됩니다.', est: true },
  { id: 'youth_rate', text: '프로 아카데미 입단자 중 성인 프로에 데뷔하는 비율은 대체로 10~25% 수준입니다. (이 게임에서는 게임성을 위해 높게 보정됨)', est: true },
  { id: 'youth_stage', text: '아카데미는 대개 U15, U17, U19처럼 연령대 팀으로 운영되며 시즌 말마다 승급·잔류·방출을 심사합니다. 16세 무렵에는 장학 계약(유스 계약)이 이어지는 경우가 많습니다.', est: true },
  { id: 'relative_age', text: '유스 선발에서는 생월이 빠른 선수가 유리한 상대 연령 효과가 알려져 있습니다.', est: true },
  { id: 'late_bloom', text: '성장 곡선이 늦은 선수는 십대에는 밀려도 성인이 되며 따라잡는 경우가 있습니다.', est: true },
  { id: 'retire_age', text: '프로 데뷔자의 평균 은퇴 나이는 31~35세로 알려져 있습니다.', est: true },
  { id: 'divorce', text: '혼인 관계 중 상당수가 이혼으로 이어지며 선수 가정도 예외가 아닙니다. (국가 통계 근사)', est: true },
  { id: 'econ_crisis', text: '큰 경기 침체는 십수 년 주기로 찾아오며 자산 가격에 영향을 줍니다. (국가 통계 근사)', est: true },
  { id: 'club_wages', text: '하부 리그 구단의 임금 체불과 재정 위기는 드물지 않게 보고됩니다.', est: true },
  { id: 'gambling', text: '프로 선수 중 도박 문제 위험군 비율이 일반 인구보다 높다는 보고가 있습니다.', est: true },
  { id: 'agent_fee', text: '에이전트 수수료는 보통 연봉·이적료의 3~10% 수준입니다.', est: true },
  { id: 'agent_fraud', text: '선수의 재정 관리를 맡긴 대리인과의 분쟁은 은퇴 선수 파산의 주요 원인 중 하나로 꼽힙니다.', est: true },
  { id: 'broke', text: '은퇴 후 몇 해 안에 재정 문제를 겪는 프로 스포츠 선수 비율은 결코 낮지 않다고 알려져 있습니다.', est: true },
  { id: 'contract_len', text: '프로 선수 계약은 보통 2~4년 단위입니다.', est: true },
  { id: 'burnout', text: '프로 선수의 번아웃과 정신 건강 문제 보고는 일반 인구와 비슷하거나 높습니다.', est: true },
  { id: 'cup_upset', text: '컵 대회에서는 하위 팀이 상위 팀을 꺾는 이변이 종종 일어납니다.', est: true },
  { id: 'shootout', text: '승부차기 성공률은 대략 75% 안팎입니다.', est: true },
  { id: 'home_adv', text: '홈 팀이 원정 팀보다 승률이 높은 홈 어드밴티지가 알려져 있습니다.', est: true },
  { id: 'coach_tenure', text: '프로 리그 감독의 평균 재임 기간은 1~2년대로 짧습니다.', est: true },
  { id: 'coach_fired', text: '시즌 중 감독 교체는 흔하며 성적 부진 후 몇 달 안에 이루어지는 경우가 많습니다.', est: true },
  { id: 'coach_lic', text: '상위 라이선스일수록 합격률이 낮고 경력 요건이 붙습니다.', est: true },
  { id: 'pundit_bias', text: '은퇴 선수 중 방송 해설로 전환하는 사례는 지명도가 높은 선수에 집중됩니다.', est: true },
  { id: 'abroad_adapt', text: '해외 이적 선수는 언어와 문화 적응에 시간이 걸리며 첫 시즌 부진이 흔합니다.', est: true },
  { id: 'sleep', text: '수면은 회복과 부상 예방에 중요한 요인으로 알려져 있습니다.', est: true },
  { id: 'alcohol', text: '음주는 수면의 질과 회복 속도를 떨어뜨립니다.', est: true },
  { id: 'smoking', text: '흡연은 지구력과 회복에 악영향을 줍니다.', est: true },
  { id: 'media', text: '소셜 미디어 발언이 구단 징계로 이어지는 사례는 프로 스포츠에서 자주 보고됩니다.', est: true },
  { id: 'doping', text: '도핑 검사에서 오염된 보충제가 원인으로 지목되는 사례가 있습니다.', est: true },
  { id: 'match_fix', text: '하부 리그와 상금이 적은 대회일수록 승부조작 제의에 노출되기 쉽다고 알려져 있습니다.', est: true },
  { id: 'nat_call', text: '대표팀 소집은 소속 팀 출전 기록과 폼의 영향을 크게 받습니다.', est: true },
  { id: 'transfer_value', text: '이적 시장가치는 나이와 잠재력에 크게 좌우됩니다.', est: true },
  { id: 'edu', text: '유소년 선수의 학업 병행은 은퇴 후 진로 선택의 폭을 넓힙니다.', est: true },
  { id: 'heavy_help', text: '힘든 감정이 오래 이어지면 전문 상담 기관이나 가까운 사람에게 도움을 요청하는 것이 중요합니다.', est: false },
  { id: 'inflation', text: '물가 상승과 환율 변동은 자산의 실질 가치에 영향을 줍니다.', est: true },
  { id: 'bonus', text: '프로 선수 계약에는 출전·득점 보너스 조항이 흔히 포함됩니다.', est: true },
  { id: 'loan', text: '유망주의 임대는 출전 시간을 확보하는 흔한 방법입니다.', est: true },
  { id: 'veteran', text: '30대 중반 이후에는 신체 능력이 눈에 띄게 줄고 회복 기간이 길어집니다.', est: true },
  { id: 'scout', text: '스카우트 보고서의 잠재력 평가는 어릴수록 오차가 큽니다.', est: true },
  { id: 'fan', text: '팬과의 관계는 성적과 태도에 따라 빠르게 변합니다.', est: true },
  { id: 'wc', text: '월드컵은 4년에 한 번 열리며 본선 진출은 소수 국가에만 허락됩니다.', est: true },
  { id: 'military', text: '대한민국 남성은 병역 의무가 있으며 올림픽 3위 이상 또는 아시안게임 금메달 시 체육요원 혜택이 주어집니다.', est: false }
];

export const STAT_NOTES: Record<string, StatNote> = Object.fromEntries(raw.map((r) => { const n = StatNoteSchema.parse(r); return [n.id, n]; }));

export function noteText(key: string): string {
  const n = STAT_NOTES[key];
  if (!n) throw new Error(`stat note ${key}`);
  return `자료 · ${n.text}${n.est ? ' (추정)' : ''}`;
}
