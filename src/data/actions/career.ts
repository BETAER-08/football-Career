import type { RawAction } from '../schema';

const PL: ('youth' | 'pro')[] = ['youth', 'pro'];
const PRO: ('pro')[] = ['pro'];

export const careerActions: RawAction[] = [
  {
    id: 'hire_trainer', group: 'career', label: '개인 트레이너 고용', desc: '맞춤형 훈련으로 성장이 빨라지고 부상이 줄어든다. 매주 비용이 든다.', phase: PL, cond: ['trainer<1', 'age>=15', 'cash>=300'], cooldown: 13, cost: 300, pv: '성장↑ 부상 위험↓ 지출↑',
    handler: 'hireTrainer', ok: { t: '개인 트레이너와 계약했다. 첫 세션부터 몸의 쓰는 법이 달라졌다.', fx: 'morale+3' }
  },
  {
    id: 'dismiss_trainer', group: 'career', label: '개인 트레이너 해고', desc: '비용을 줄인다.', phase: PL, cond: ['trainer>=1'], cooldown: 13, pv: '지출↓',
    handler: 'dismissTrainer', ok: { t: '트레이너와 계약을 마무리했다.' }
  },
  {
    id: 'hire_nutritionist', group: 'career', label: '영양사 고용', desc: '식단 관리로 회복과 컨디션을 끌어올린다.', phase: PL, cond: ['age>=15', 'cash>=250'], cooldown: 26, cost: 250, pv: '식단↑ 회복↑',
    handler: 'hireNutri', ok: { t: '영양사가 식단표를 새로 짰다. 야식과 달콤한 음료가 정리됐다.', fx: 'health+3' }
  },
  {
    id: 'hire_psych', group: 'career', label: '심리 코치 고용', desc: '압박감과 슬럼프를 다루는 법을 배운다.', phase: PL, cond: ['age>=15', 'cash>=250'], cooldown: 26, cost: 250, pv: '스트레스↓ 멘탈↑',
    handler: 'hirePsych', ok: { t: '심리 코치와 첫 상담을 했다. 숨 쉬는 법부터 다시 배웠다.', fx: 'attr.composure+0.3 stress-4' }
  },
  {
    id: 'training_camp', group: 'career', label: '추가 훈련 캠프', desc: '짧고 강한 집중 훈련. 성과는 크지만 몸이 상할 수 있다.', phase: PL, cond: ['!injured', 'cash>=400'], cooldown: 13, cost: 400, pv: '기술↑ 신체↑ 피로↑↑',
    check: '62 hid.pro*0.25 health*0.2 fatigue*-0.3', handler: 'camp',
    great: { t: '이를 악문 보람이 있었다. 몸이 한 단계 올라선 느낌이다.', fx: 'morale+4' },
    ok: { t: '힘들었지만 확실히 얻은 게 있다.' },
    bad: { t: '무리한 일정에 몸이 비명을 질렀다. 얻은 것에 비해 피로가 컸다.', fx: 'morale-3' },
    worst: { t: '캠프 중 몸에 이상이 느껴졌다. 결국 병원을 찾았다.', fx: 'fx:inj=calf morale-5' }
  },
  {
    id: 'change_agent', group: 'career', label: '에이전트 영입 · 교체', desc: '새 에이전트와 계약한다. 능력은 만나 보기 전에는 알 수 없다.', phase: PL, cond: ['age>=15', 'cash>=200'], cooldown: 26, cost: 200, pv: '이적 협상력 변동',
    ok: { t: '새 에이전트와 계약서에 서명했다. 수수료 이야기도 빠지지 않았다.', fx: 'fx:newAgent' }
  },
  {
    id: 'ask_playtime', group: 'career', label: '감독 면담 (출전 시간 요청)', desc: '출전 기회를 직접 요청한다. 감독과의 관계가 중요하다.', phase: PRO, cond: ['hasClub'], cooldown: 13, pv: '출전↑ 감독 관계 변동',
    check: '42 rel.coach*0.3 ovr*0.4 hid.pro*0.1', handler: 'roleUp',
    ok: { t: '{coach} 감독이 고개를 끄덕였다. "다음 경기부터 지켜보겠다."' },
    bad: { t: '{coach} 감독은 "경쟁은 훈련장에서 하는 것"이라고 선을 그었다.', fx: 'rel.coach-6 morale-4' }
  },
  {
    id: 'transfer_request', group: 'career', label: '이적 요청', desc: '새 팀을 찾겠다고 구단에 공식 요청한다. 팬과 감독의 시선이 차가워진다.', phase: PRO, cond: ['hasClub', 'contractLeft>12'], cooldown: 26, confirm: true, pv: '이적 제안↑↑ 감독 관계↓ 팬 관계↓',
    handler: 'transferReq', ok: { t: '구단에 이적 의사를 전했다. 에이전트와 다른 구단들이 분주해졌다.', fx: 'fx:offers=many' }
  },
  {
    id: 'renew_request', group: 'career', label: '재계약 요청', desc: '계약 연장과 연봉 인상을 요구한다.', phase: PRO, cond: ['hasClub', 'contractLeft<=104'], cooldown: 26, pv: '연봉↑ 계약 연장 / 감독 관계 변동',
    check: '36 ovr*0.5 rel.coach*0.15 agent*0.3', handler: 'renewReq',
    great: { t: '구단이 의외로 적극적이었다. 연봉과 기간 모두 만족스러운 조건이 나왔다.' },
    ok: { t: '무난한 선에서 재계약이 성사됐다.' },
    bad: { t: '구단은 "지금은 어렵다"며 협상 테이블을 정리했다.', fx: 'morale-4 rel.director-3' }
  },
  {
    id: 'position_change', group: 'career', label: '포지션 변경 요청', desc: '숙련도가 쌓인 부 포지션으로 주 포지션을 옮긴다.', phase: PRO, cond: ['hasClub'], cooldown: 52, pv: '주 포지션 변경',
    check: '30 rel.coach*0.2 attr.firstTouch*1 attr.vision*0.5', handler: 'posChange',
    ok: { t: '감독이 새 포지션을 맡겨 보기로 했다. 처음엔 어색했지만 조금씩 눈에 익었다.', fx: 'fx:secPos=CM' },
    bad: { t: '감독은 현재 포지션이 팀에 더 필요하다고 했다.', fx: 'morale-3' }
  },
  {
    id: 'interview', group: 'career', label: '언론 인터뷰', desc: '언론을 통해 이미지를 만든다. 말 한마디가 헤드라인이 될 수 있다.', phase: PRO, cond: ['hasClub'], cooldown: 8, pv: '명성↑ 언론 관계 변동',
    check: '58 hid.controversy*-0.3 hid.social*0.2 rel.media*0.1',
    great: { t: '솔직하고 재치 있는 답변이 화제가 됐다. 팬들이 인터뷰를 돌려 봤다.', fx: 'fameD+1.2 rel.media+8 rel.fans+4' },
    ok: { t: '무난한 인터뷰였다. 기사는 짧게 나갔다.', fx: 'fameD+0.4 rel.media+2' },
    bad: { t: '말이 조금 꼬이면서 기사 제목이 엉뚱하게 뽑혔다.', fx: 'rel.media-5 rel.fans-2' },
    worst: { t: '농담 한 마디가 비난 여론으로 번졌다. 구단이 해명 자료까지 냈다.', fx: 'rel.media-10 rel.fans-8 rel.coach-4 stress+8' }
  },
  {
    id: 'sns_post', group: 'career', label: 'SNS 게시', desc: '근황을 올려 팔로워를 늘린다. 논란 성향이 있으면 위험하다.', phase: PRO, cond: ['age>=15'], cooldown: 4, pv: '팔로워↑ 팬 관계 변동',
    check: '66 hid.controversy*-0.35 hid.pro*0.1',
    great: { t: '훈련 영상 한 편이 크게 퍼졌다. 팔로워가 눈에 띄게 늘었다.', fx: 'followers+30 rel.fans+3' },
    ok: { t: '게시물에 응원 댓글이 달렸다.', fx: 'followers+8' },
    bad: { t: '올린 글이 오해를 샀다. 댓글창이 어수선하다.', fx: 'rel.fans-4 stress+3' },
    worst: { t: '게시물이 논란에 휘말려 삭제했지만 캡처가 돌아다닌다.', fx: 'rel.fans-9 rel.media-6 rel.coach-3 fu:sns_apology@2-6' }
  },
  {
    id: 'sponsor_deal', group: 'career', label: '스폰서 협상', desc: '용품·브랜드 후원 계약을 협상한다. 이름값이 필요하다.', phase: PRO, cond: ['fameD>=8', 'hasClub'], cooldown: 26, pv: '수입↑ / 협상 결렬 가능',
    check: '30 fameD*0.6 agent*0.25 ovr*0.15',
    great: { t: '브랜드가 장기 후원을 제안했다. 조건이 파격적이다.', fx: 'sponsor+3000 rel.fans+2' },
    ok: { t: '무난한 후원 계약이 성사됐다.', fx: 'sponsor+1200' },
    bad: { t: '브랜드는 "시기상조"라며 협상을 접었다.', fx: 'morale-3' }
  },
  {
    id: 'decline_national', group: 'career', label: '대표팀 차출 고사', desc: '이번 시즌 대표팀 소집을 사양하겠다고 협회에 전한다.', phase: PRO, cond: ['caps>=1'], cooldown: 52, pv: '대표팀 감독 관계↓ 피로↓',
    handler: 'declineNat', ok: { t: '협회에 소집 고사 의사를 전달했다. 구단 일정과 몸 상태를 우선하기로 했다.', fx: 'fatigue-5 rel.natcoach-5 rel.coach+2' }
  },
  {
    id: 'coach_license', group: 'career', label: '지도자 자격증 과정 등록', desc: '지도자의 길을 위한 자격증 과정에 등록한다. 현역 중에는 28세 이상, C·B급만 가능하다.', phase: ['youth', 'pro', 'coach', 'postcareer'], cond: [], cooldown: 4, cost: 400, pv: '자격증 취득 확률 약 35~85%',
    handler: 'coachLicense', ok: { t: '지도자 자격증 과정에 등록했다. 교재 첫 장부터 낯선 용어가 쏟아졌다.', fx: 'stress+2' }
  },
  {
    id: 'retire_now', group: 'career', label: '은퇴 선언', desc: '언제든 현역에서 물러날 수 있다. 되돌릴 수 없다.', phase: ['youth', 'pro'], cond: ['age>=15'], cooldown: 0, confirm: true, pv: '선수 생활 종료',
    handler: 'retire', ok: { t: '기자회견장에서 마이크를 잡았다. 마지막으로 인사를 건넸다.' }
  },
  {
    id: 'press_conference', group: 'career', label: '기자회견 태도 정하기', desc: '지도자로서 기자회견에서 어떤 톤으로 말할지 정한다.', phase: ['coach'], cond: ['coachRole:manager'], cooldown: 8, pv: '명성 변동 입지 변동',
    check: '50 media*0.35 rel.media*0.1 standing*0.1',
    great: { t: '차분하면서도 단호한 답변이 칭찬을 받았다. 구단 수뇌부도 만족했다.', fx: 'coachFame+1.2 standing+4 rel.media+6' },
    ok: { t: '무난한 기자회견이었다.', fx: 'coachFame+0.2' },
    bad: { t: '선수 탓으로 들릴 수 있는 발언이 나왔다. 라커룸 분위기가 싸늘하다.', fx: 'standing-4 coachFame-0.6 rel.media-4' }
  },
  {
    id: 'request_signing', group: 'career', label: '영입 요청', desc: '단장에게 선수 영입을 요청한다.', phase: ['coach'], cond: ['coachRole:manager'], cooldown: 26, pv: '전력↑ 단장 관계 변동',
    check: '38 rel.director*0.3 management*0.3 coachFame*0.2', handler: 'requestSigning',
    great: { t: '구단이 적극적으로 움직였다. 요청한 포지션에 즉시 전력 보강이 이뤄졌다.', fx: 'standing+3 rel.director+5' },
    ok: { t: '예산 안에서 영입이 성사됐다.', fx: 'rel.director+2' },
    bad: { t: '단장은 "예산이 없다"는 말만 반복했다.', fx: 'rel.director-5' }
  },
  {
    id: 'promote_youth', group: 'career', label: '유스 승격', desc: '유스 출신 유망주를 1군에 올린다.', phase: ['coach'], cond: ['coachRole:manager'], cooldown: 26, pv: '육성↑ 전력 변동',
    check: '50 development*0.3 management*0.15', handler: 'promoteYouth',
    great: { t: '승격시킨 유망주가 훈련장에서 눈에 띄는 활약을 보였다.', fx: 'development+0.8 rel.owner+3' },
    ok: { t: '유망주 한 명을 1군 명단에 올렸다.', fx: 'development+0.3' },
    bad: { t: '준비가 덜 된 선수를 올린 것 아니냐는 비판이 나왔다.', fx: 'standing-2' }
  },
  {
    id: 'change_tactic', group: 'career', label: '전술 변경', desc: '포메이션과 전술을 바꿔 분위기를 바꾼다.', phase: ['coach'], cond: ['coachRole:manager'], cooldown: 13, pv: '입지 변동',
    check: '48 tactics*0.5 data*0.15', handler: 'changeTactic',
    great: { t: '전술 변화가 제대로 먹혀들었다. 선수들이 새 틀 안에서 살아났다.' },
    ok: { t: '전술 변화는 팀에 조금씩 스며들었다.' },
    bad: { t: '변화가 오히려 혼란을 불렀다.' },
    worst: { t: '전술 변경이 대실패로 이어졌고, 라커룸에서 불만이 새어 나왔다.', fx: 'rel.captain-8' }
  },
  {
    id: 'player_talk', group: 'career', label: '선수 면담', desc: '핵심 선수와 개별 면담을 갖는다.', phase: ['coach'], cond: ['coachRole:manager|assistant'], cooldown: 8, pv: '선수단 관리↑',
    check: '54 leadership*0.3 management*0.3',
    ok: { t: '면담 후 선수의 표정이 한결 밝아졌다.', fx: 'management+0.4 standing+1.5' },
    bad: { t: '면담이 길어졌지만 서로의 입장만 확인했다.', fx: 'standing-1' }
  },
  {
    id: 'training_abroad', group: 'career', label: '해외 연수', desc: '해외 구단과 지도자 과정을 돌며 배운다.', phase: ['coach', 'postcareer'], cond: ['cash>=800'], cooldown: 52, cost: 800, pv: '전술↑ 언어↑ 데이터↑',
    ok: { t: '해외 클럽의 훈련 방식과 분석 시스템을 가까이서 보았다. 노트가 빼곡해졌다.', fx: 'tactics+1.2 data+1.2 langSkill+4 coachFame+0.4' }
  },
  {
    id: 'resign_job', group: 'career', label: '사임', desc: '현재 지도자 직책에서 물러난다.', phase: ['coach'], cond: [], cooldown: 0, confirm: true, pv: '지도자 직 종료',
    handler: 'resign', ok: { t: '사임 의사를 전달했다. 짐을 정리하는 동안 라커룸이 유난히 조용했다.' }
  },
  {
    id: 'coach_retire', group: 'career', label: '지도자 은퇴', desc: '지도자 생활을 접고 축구 인생을 마무리한다. 되돌릴 수 없다.', phase: ['coach'], cond: [], cooldown: 0, confirm: true, pv: '축구 인생 종료',
    handler: 'coachRetire', ok: { t: '마지막 기자회견에서 오랜 시간 함께한 사람들에게 인사했다.' }
  },
  {
    id: 'to_pundit', group: 'career', label: '해설·방송으로 전환', desc: '진로를 해설·방송으로 바꾼다.', phase: ['coach', 'postcareer'], cond: [], cooldown: 26, pv: '평판↑ 수입 변동',
    handler: 'toPundit', ok: { t: '방송국과 새 계약을 맺었다.' }
  },
  {
    id: 'to_admin', group: 'career', label: '구단 행정으로 전환', desc: '스카우트·테크니컬 디렉터·단장으로 이어지는 행정 라인으로 간다.', phase: ['coach', 'postcareer'], cond: [], cooldown: 26, pv: '전문성↑',
    handler: 'toAdmin', ok: { t: '구단 행정 직원으로 새 출발한다.' }
  },
  {
    id: 'to_business', group: 'career', label: '사업으로 전환', desc: '사업에 집중한다.', phase: ['coach', 'postcareer'], cond: [], cooldown: 26, pv: '수입 변동',
    handler: 'toBusiness', ok: { t: '사업에 전념하기로 했다.' }
  },
  {
    id: 'to_coach', group: 'career', label: '지도자로 복귀', desc: '다시 지도자의 길로 들어선다. 이미 딴 자격증은 그대로 인정된다.', phase: ['postcareer'], cond: [], cooldown: 26, pv: '지도자 직 탐색',
    handler: 'toCoach', ok: { t: '다시 지도자의 길로 돌아왔다.' }
  },
  {
    id: 'leave_football', group: 'career', label: '축구계를 떠난다', desc: '축구계를 떠나 이야기를 마무리한다. 되돌릴 수 없다.', phase: ['postcareer'], cond: [], cooldown: 0, confirm: true, pv: '축구 인생 종료',
    handler: 'leaveFootball', ok: { t: '축구와 이별하기로 했다.' }
  }
];
