import type { RawAction } from '../schema';

const P: ('youth' | 'pro' | 'coach' | 'postcareer')[] = ['youth', 'pro', 'coach', 'postcareer'];
const ADULT: ('youth' | 'pro' | 'coach' | 'postcareer')[] = ['pro', 'coach', 'postcareer'];

export const moneyActions: RawAction[] = [
  {
    id: 'invest_deposit', group: 'money', label: '예금', desc: '안전하게 목돈을 불린다. 이자는 낮지만 잃을 일이 없다.', phase: P, cond: ['cash>=50'], cooldown: 2, param: 'amount', pv: '예금↑',
    handler: 'deposit', ok: { t: '{amt}만원을 예금했다. 통장에 찍힌 숫자가 마음을 편하게 한다.' }
  },
  {
    id: 'invest_stock', group: 'money', label: '주식', desc: '국가 경기와 시장 분위기에 따라 수익률이 오르내린다.', phase: ADULT, cond: ['cash>=100', 'age>=18'], cooldown: 2, param: 'amount', pv: '주식↑ 변동성↑',
    handler: 'stock', ok: { t: '{amt}만원어치 주식을 샀다. 경제 뉴스가 갑자기 눈에 들어온다.' }
  },
  {
    id: 'invest_estate', group: 'money', label: '부동산 구매', desc: '현금이 묶이지만 꾸준히 가치가 오르는 자산이다.', phase: ADULT, cond: ['cash>=1000', 'age>=19'], cooldown: 13, param: 'amount', pv: '부동산↑ 현금↓',
    handler: 'estate', ok: { t: '{amt}만원으로 부동산을 샀다. 중개 수수료와 세금이 생각보다 컸다.' }
  },
  {
    id: 'invest_business', group: 'money', label: '사업 투자', desc: '성공 확률은 낮지만 크게 불어날 수 있다. 은퇴 후를 대비하는 사람도 많다.', phase: ADULT, cond: ['cash>=500', 'age>=20'], cooldown: 26, param: 'amount',
    check: '30 hid.thrift*-0.12 hid.pro*0.08 postSkill*0.15', handler: 'business',
    great: { t: '지인이 소개한 사업이 의외로 크게 성공했다. 지분 가치가 껑충 뛰었다.' },
    ok: { t: '사업은 그럭저럭 자리를 잡았다. 투자금보다 조금 더 불어났다.' },
    bad: { t: '사업이 기대만큼 풀리지 않았다. 투자금의 절반 가까이가 묶이거나 사라졌다.', fx: 'stress+5' },
    worst: { t: '동업자가 문을 닫아 버렸다. 투자금 대부분이 증발했다.', fx: 'stress+10 happy-6' }
  },
  {
    id: 'buy_home', group: 'money', label: '집 구매 · 이사', desc: '숙소와 임대를 벗어나 내 집을 마련한다. 안정감이 생긴다.', phase: ADULT, cond: ['age>=19', 'housingOwn<1', 'cash>=15000'], cooldown: 52, cost: 15000, pv: '행복↑ 스트레스↓ 현금↓↓',
    handler: 'buyHome', ok: { t: '드디어 내 이름으로 된 집이 생겼다. 현관문을 열 때마다 묘한 안도감이 든다.', fx: 'happy+8 stress-6 fx:houseBuy' }
  },
  {
    id: 'rent_home', group: 'money', label: '집 임대 · 이사', desc: '구단 근처에 집을 구해 독립한다.', phase: ADULT, cond: ['age>=18', 'cash>=800'], cooldown: 26, cost: 800, pv: '행복↑',
    handler: 'rentHome', ok: { t: '구단 근처에 집을 구했다. 짐 정리가 끝나자 비로소 어른이 된 기분이 들었다.', fx: 'happy+4 sleep+3' }
  },
  {
    id: 'buy_car', group: 'money', label: '차 구매', desc: '이동이 편해지고 기분도 좋아지지만 유지비가 든다.', phase: ADULT, cond: ['age>=19', 'car<3', 'cash>=3000'], cooldown: 52, cost: 3000, pv: '행복↑ 현금↓',
    handler: 'buyCar', ok: { t: '새 차를 뽑았다. 훈련장 가는 길이 조금 즐거워졌다.', fx: 'happy+5' }
  },
  {
    id: 'parents_house', group: 'money', label: '부모님 집 마련', desc: '오랜 뒷바라지에 대한 보답. 가족 관계가 크게 좋아진다.', phase: ADULT, cond: ['age>=19', 'cash>=10000', 'tier<=3'], cooldown: 104, cost: 10000, pv: '가족 관계↑↑ 행복↑ 현금↓↓',
    handler: 'parentsHouse', ok: { t: '부모님께 새 집 열쇠를 건넸다. 어머니가 한참을 말없이 울었다.', fx: 'rel.father+18 rel.mother+22 happy+10 hid.family+2' }
  },
  {
    id: 'support_family', group: 'money', label: '가족 생활비 지원', desc: '매년 연봉의 일부를 가족에게 보낸다.', phase: ADULT, cond: ['age>=18', 'wage>=1000'], cooldown: 26, pv: '가족 관계↑ 매년 현금↓',
    handler: 'supportFamily', ok: { t: '매달 생활비를 부치기로 했다. 가족의 표정이 한결 편안해졌다.', fx: 'rel.father+6 rel.mother+8' }
  },
  {
    id: 'stop_support', group: 'money', label: '가족 지원 중단', desc: '가족 생활비 송금을 멈춘다.', phase: ADULT, cond: ['age>=18'], cooldown: 26, pv: '가족 관계↓',
    handler: 'stopSupport', ok: { t: '송금을 멈췄다. 가족은 아무 말도 하지 않았지만 분위기가 어색해졌다.', fx: 'rel.father-5 rel.mother-6' }
  },
  {
    id: 'donate', group: 'money', label: '기부', desc: '지역 사회나 자선 단체에 기부한다.', phase: ADULT, cond: ['cash>=300'], cooldown: 13, param: 'amount', pv: '명성↑ 행복↑',
    handler: 'donate', ok: { t: '{amt}만원을 기부했다. 기사에는 작게 실렸지만 마음은 가벼웠다.' }
  },
  {
    id: 'build_stadium', group: 'money', label: '고향 축구장 건립', desc: '내가 공을 차던 고향에 번듯한 축구장을 짓는다.', phase: ADULT, cond: ['age>=21', 'cash>=20000', 'fameD>=15'], cooldown: 260, cost: 20000, pv: '명성↑↑ 팬 관계↑ 현금↓↓',
    handler: 'stadium', ok: { t: '고향에 {name} 이름이 걸린 축구장이 문을 열었다. 아이들이 첫날부터 공을 차러 몰려들었다.', fx: 'happy+10 rel.fans+6 hid.family+2' }
  },
  {
    id: 'youth_foundation', group: 'money', label: '유소년 재단 설립', desc: '어린 선수들을 돕는 재단을 세운다. 은퇴 뒤에도 이어갈 수 있다.', phase: ADULT, cond: ['age>=24', 'cash>=15000', 'fameD>=15'], cooldown: 260, cost: 15000, pv: '명성↑ 평판↑ 현금↓↓',
    handler: 'foundation', ok: { t: '유소년 재단을 설립했다. 첫 장학생 명단을 직접 읽어 내려갔다.', fx: 'happy+7 fameD+1' }
  },
  {
    id: 'luxury', group: 'money', label: '사치 지출', desc: '기분 전환을 위해 크게 지른다. 자제력이 약하면 부작용이 따른다.', phase: ADULT, cond: ['age>=19', 'cash>=1500'], cooldown: 8, cost: 1500, pv: '행복↑ 프로의식 변동',
    check: '72 hid.pro*0.4 hid.thrift*0.2', handler: 'luxury',
    ok: { t: '값비싼 시계를 샀다. 기분 전환으로는 충분했다.' },
    bad: { t: '새벽까지 이어진 소비는 후회를 남겼다. 다음 날 훈련 때 몸이 무거웠다.', fx: 'fatigue+10 morale-4' }
  }
];
