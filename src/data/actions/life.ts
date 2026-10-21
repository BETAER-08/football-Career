import type { RawAction } from '../schema';

const ALL: ('youth' | 'pro' | 'coach' | 'postcareer')[] = ['youth', 'pro', 'coach', 'postcareer'];
const ADULT: ('pro' | 'coach' | 'postcareer')[] = ['pro', 'coach', 'postcareer'];

export const lifeActions: RawAction[] = [
  {
    id: 'vacation', group: 'life', label: '휴가', desc: '며칠 일상에서 벗어나 쉰다. 감각은 조금 무뎌진다.', phase: ALL, cond: [], cooldown: 8, cost: 400, pv: '스트레스↓↓ 피로↓↓ 경기 감각↓',
    ok: { t: '휴대폰을 끄고 며칠을 보냈다. 돌아와 보니 세상이 조금 가벼워 보였다.', fx: 'stress-25 fatigue-30 happy+8 sharp-8' }
  },
  {
    id: 'holiday_abroad', group: 'life', label: '해외 휴양', desc: '비시즌에 멀리 떠나 푹 쉰다. 감각은 무뎌진다.', phase: ALL, cond: ['cash>=600'], cooldown: 26, cost: 600, pv: '스트레스↓↓ 피로↓↓ 경기 감각↓',
    ok: { t: '낯선 해변에서 며칠을 보냈다. 시계를 보지 않는 날들이 오랜만이었다.', fx: 'stress-26 fatigue-30 happy+9 sharp-9' }
  },
  {
    id: 'holiday_home', group: 'life', label: '고향 가족과 휴가', desc: '고향에서 가족과 시간을 보낸다. 훈련 리듬은 느슨해진다.', phase: ALL, cond: [], cooldown: 26, cost: 200, pv: '가족 관계↑ 스트레스↓ 경기 감각↓',
    ok: { t: '어머니의 밥상과 아버지의 서툰 농담. 짐을 풀지 않아도 편안한 며칠이었다.', fx: 'stress-20 fatigue-22 rel.father+4 rel.mother+5 happy+8 sharp-6' }
  },
  {
    id: 'holiday_train', group: 'life', label: '비시즌 개인 훈련', desc: '쉬는 대신 개인 훈련 계획을 짠다. 피로가 쌓인다.', phase: ['youth', 'pro'], cond: [], cooldown: 26, cost: 100, pv: '지구력↑ 근력↑ 피로↑',
    ok: { t: '새벽 러닝과 웨이트로 비시즌을 채웠다. 몸은 단단해졌지만 마음은 쉴 틈이 없었다.', fx: 'attr.stamina+0.25 attr.strength+0.2 fatigue+6 hid.pro+1' }
  },
  {
    id: 'night_out', group: 'life', label: '친구들과 밤 외출', desc: '야식과 게임, 수다로 밤을 보낸다. 반복하면 재미가 줄고 몸이 상한다.', phase: ALL, cond: [], cooldown: 6, diminish: 0.2, cost: 80, pv: '행복↑ 동료 관계↑ 수면↓ 피로↑',
    ok: { t: '늦은 시간까지 웃고 떠들었다. 다음 날 아침이 조금 힘들 것 같다.', fx: 'happy+5 rel.mates+3 sleep-5 fatigue+4 drink+2' }
  },
  {
    id: 'diet_control', group: 'life', label: '식단 관리', desc: '당분간 먹는 것을 철저히 챙긴다. 즐거움은 줄어든다.', phase: ['youth', 'pro'], cond: [], cooldown: 8, diminish: 0.15, cost: 100, pv: '식단↑ 건강↑ 행복↓',
    ok: { t: '도시락을 싸 다니며 식단표를 지켰다. 몸이 가벼워지는 느낌이 든다.', fx: 'diet+8 health+2 hid.pro+0.5 happy-2' }
  },
  {
    id: 'start_dating', group: 'life', label: '연애 시작', desc: '마음에 드는 사람에게 다가간다.', phase: ALL, cond: ['age>=17', 'single'], cooldown: 26, pv: '행복↑ 관계↑ / 거절 가능',
    check: '38 hid.social*0.35 fameD*0.2 happy*0.1',
    ok: { t: '용기 내어 건넨 한마디가 통했다. 연락이 이어졌고, 어느새 연인이 되었다.', fx: 'fx:romance happy+4' },
    bad: { t: '조심스럽게 마음을 전했지만 정중히 거절당했다.', fx: 'morale-3 stress+2' }
  },
  {
    id: 'propose', group: 'life', label: '청혼', desc: '오래 만난 연인에게 청혼한다.', phase: ADULT, cond: ['dating', 'age>=21'], cooldown: 52, pv: '결혼 / 거절 가능',
    check: '50 rel.partner*0.35 hid.family*0.15',
    ok: { t: '반지를 건네자 {partner:이} 눈물을 글썽이며 고개를 끄덕였다.', fx: 'fx:marry' },
    bad: { t: '{partner:은} "조금 더 시간이 필요하다"고 말했다.', fx: 'rel.partner-6 stress+4' }
  },
  {
    id: 'plan_child', group: 'life', label: '자녀 계획', desc: '아이를 갖기로 마음먹는다. 소식은 시간이 걸려 찾아온다.', phase: ADULT, cond: ['married'], cooldown: 52, pv: '가족 관계↑ 아이 탄생 예정',
    check: '68 rel.partner*0.15',
    ok: { t: '{partner:과} 함께 가족을 늘리기로 했다. 설렘과 걱정이 섞인 날들이 이어진다.', fx: 'happy+4 fu:child_birth@36-48' },
    bad: { t: '아직은 때가 아닌 듯하다. 서로를 위로하며 시간을 두기로 했다.', fx: 'stress+3' }
  },
  {
    id: 'visit_parents', group: 'life', label: '부모 방문', desc: '바쁜 일정 속에서 고향에 다녀온다.', phase: ALL, cond: [], cooldown: 8, cost: 200, pv: '가족 관계↑ 행복↑',
    ok: { t: '고향집 식탁에 앉았다. 어머니가 차려준 밥을 말없이 두 그릇 비웠다.', fx: 'rel.father+5 rel.mother+6 happy+6 stress-8' }
  },
  {
    id: 'enroll_college', group: 'life', label: '대학 등록', desc: '운동과 학업을 병행한다. 시간이 많이 든다.', phase: ADULT, cond: ['age>=18', 'edu<2', 'cash>=1200'], cooldown: 52, cost: 1200, pv: '학력↑ 피로↑',
    handler: 'enroll', ok: { t: '대학 강의실에 첫 발을 들였다. 낯선 책상 앞에서 새로운 기분이 들었다.', fx: 'stress+3 happy+2' }
  },
  {
    id: 'online_degree', group: 'life', label: '온라인 학업 등록', desc: '시간 제약이 적은 온라인 학위 과정을 듣는다.', phase: ADULT, cond: ['age>=18', 'edu<3', 'cash>=400'], cooldown: 52, cost: 400, pv: '학력↑',
    handler: 'enroll', ok: { t: '온라인 강의를 신청했다. 이동 시간에 틈틈이 들을 수 있다.' }
  },
  {
    id: 'study_language', group: 'life', label: '언어 공부', desc: '현재 뛰는 나라의 언어(국내라면 영어)를 공부한다. 해외 적응과 지도자 해외 진출에 도움이 된다.', phase: ALL, cond: [], cooldown: 6, cost: 150, pv: '언어↑ 해외 적응↑',
    handler: 'studyLang', ok: { t: '단어장과 회화 앱을 붙들고 한 주를 보냈다. 귀가 조금씩 열린다.', fx: 'stress+1 hid.adapt+0.6' }
  },
  {
    id: 'checkup', group: 'life', label: '건강검진', desc: '정밀 검진으로 몸 상태를 점검한다.', phase: ALL, cond: [], cooldown: 26, cost: 150, pv: '건강↑ 만성 통증↓',
    handler: 'checkup', ok: { t: '구석구석 검사를 받았다. 의사가 몇 가지 생활 습관을 짚어 주었다.', fx: 'health+4 stress-2' }
  },
  {
    id: 'counseling', group: 'life', label: '심리 상담', desc: '전문가와 마음의 짐을 나눈다.', phase: ALL, cond: [], cooldown: 8, cost: 200, pv: '스트레스↓↓ 번아웃↓',
    ok: { t: '상담실에서 처음으로 마음속 이야기를 소리 내어 말했다. 한결 숨쉬기가 편해졌다.', fx: 'stress-16 burnout-14 happy+4' }
  },
  {
    id: 'quit_habit', group: 'life', label: '금주·금연 시도', desc: '술과 담배를 끊어 본다. 의지가 필요하다.', phase: ALL, cond: ['drink>=10'], cooldown: 13, pv: '건강↑ / 실패 가능',
    check: '48 hid.pro*0.35 sleep*0.1', handler: 'quitHabit',
    ok: { t: '한 달이 지났다. 아침에 눈뜨는 느낌이 달라졌다.', fx: 'health+5 sleep+6 morale+3 flag:quit_smoke' },
    bad: { t: '며칠을 버텼지만 스트레스가 오자 다시 손이 갔다.', fx: 'morale-3' }
  },
  {
    id: 'meet_friends', group: 'life', label: '친구 모임', desc: '오랜 친구들과 시간을 보낸다.', phase: ALL, cond: [], cooldown: 8, diminish: 0.2, cost: 100, pv: '행복↑ 스트레스↓',
    ok: { t: '오랜 친구들과 늦게까지 웃었다. 축구 이야기는 의외로 별로 나오지 않았다.', fx: 'happy+5 stress-6 rel.mates+2 drink+4 fatigue+3' }
  }
];
