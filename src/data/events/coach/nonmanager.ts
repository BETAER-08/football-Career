import type { RawEvent } from '../../schema';
import { cc, ch } from '../helpers';

const C: ('coach')[] = ['coach'];
const YOUTH = 'coachRole:youthCoach';
const ASST = 'coachRole:assistant';
const YA = 'coachRole:youthCoach|assistant';
const NONE = 'coachRole:none';

export const coachNonManager: RawEvent[] = [
  ch('cn_prospect_direction', C, 4, [
    '재능 있는 유망주 한 명의 육성 방향을 정해야 한다. 기술을 먼저 다질지, 몸을 키울지, 출전 시간을 먼저 줄지 의견이 갈린다.',
    '월간 육성 회의에서 한 선수의 성장 계획이 논의됐다. 최종 결정은 {name}의 몫이다.'
  ], [
    cc('기술 중심으로 길게 본다', ['개인 기술 훈련 비중을 높였다. 선수의 터치가 눈에 띄게 부드러워졌다.', 'development+0.3 coachFame+0.2'], {
      chk: '55 development*0.3 tactics*0.1', pv: '육성↑ 명성↑ 시간 소요',
      bad: ['기술 훈련에 쏠리다 보니 피지컬 격차가 벌어졌다.', 'development-0.1 rel.director-2']
    }),
    cc('피지컬을 먼저 끌어올린다', ['웨이트와 회복 프로그램을 늘렸다. 몸이 한결 단단해졌다.', 'development+0.2 management+0.1'], {
      chk: '55 development*0.2 management*0.2', pv: '피지컬↑ 부상 위험',
      bad: ['과한 부하로 선수가 근육 통증을 호소했다.', 'stress+4 rel.director-2']
    }),
    cc('출전 시간을 먼저 보장해 경험을 쌓게 한다', ['성적과 육성의 균형을 잡았다. 구단은 불안해했다.', 'development+0.1 rel.director-2 coachFame-0.1'], { pv: '경험↑ 구단 신뢰↓' })
  ], { cond: [YOUTH], cd: 80, max: 3, xg: 'youth_dev', tier: 'minor' }),
  ch('cn_tactics_clash', C, 4, [
    '감독이 선호하는 전술에 {name:은} 동의하기 어렵다. 훈련 중 미묘한 신경전이 이어졌다.',
    '수석코치로서 감독의 포메이션 변경 지시에 의문이 든다. 코칭스태프 회의에서 의견을 낼 기회가 왔다.'
  ], [
    cc('회의에서 공개적으로 의견을 낸다', ['데이터를 근거로 논리적으로 설명했다. 회의실의 공기가 달라졌다.', 'tactics+0.2 coachFame+0.3'], {
      chk: '52 tactics*0.3 leadership*0.2 rel.owner*0.05', pv: '전술 영향력↑ 감독 관계 위험',
      bad: ['감독이 공개 비판으로 받아들였다. 이후 대화가 줄었다.', 'rel.owner-4 stress+4'],
      worst: ['회의가 감정싸움으로 번졌다. 구단 수뇌부까지 소식이 닿았다.', 'rel.owner-8 coachFame-1']
    }),
    cc('감독의 방식을 따른다', ['불편하지만 감독의 지시대로 훈련을 진행했다.', 'stress+2 tactics-0.05 coachFame-0.1'], { pv: '갈등 회피 영향력↓' }),
    cc('따로 조용히 설득한다', ['식사 자리에서 부드럽게 의견을 전했다. 감독이 조금은 귀를 기울였다.', 'tactics+0.1 rel.owner+1'], {
      chk: '55 management*0.3 media*0.1', pv: '영향력 유지 설득 실패 위험',
      bad: ['설득이 통하지 않았다. 감독은 선을 그었다.', 'stress+3 coachFame-0.2']
    })
  ], { cond: [ASST], cd: 80, max: 3, xg: 'staff_conflict', tier: 'minor', again: '감독과 전술로 충돌했던 지난번에는 "{prev}" 쪽을 택했다.' }),
  ch('cn_caretaker_offer', C, 3, [
    '성적 부진으로 감독이 갑작스레 물러났다. 구단은 임시로 팀을 맡을 사람을 찾고 있다. 단장이 {name}의 이름을 꺼냈다.',
    '감독 대행 제안이 도착했다. 기간은 확정되지 않았고, 성적이 나쁘면 책임도 함께 져야 한다.'
  ], [
    cc('감독 대행을 맡는다', ['수석코치에서 순식간에 사령탑이 됐다. 첫 훈련에서 선수들의 시선이 무거웠다.', 'coachFame+1.5 leadership+0.3 fx:coachOffers=more fu:fu_coach@8-22'], { chk: '50 tactics*0.25 leadership*0.25 management*0.15', pv: '명성↑↑ 경력 도약 실패 위험', great: ['연승을 이끌며 대행 꼬리표를 떼자는 목소리가 높았다.', 'coachFame+3 leadership+0.5 fx:coachOffers=more fu:fu_coach@8-22'], bad: ['선수단 장악에 실패했다. 대행 기간은 쓰라린 기억으로 남았다.', 'coachFame-1 stress+8 rel.owner-3 fu:fu_coach@8-22'], worst: ['대행 기간에 연패를 거듭했다. 비난이 쏟아졌다.', 'coachFame-3 stress+10 fu:fu_coach@8-22'] }),
    cc('정중히 사양한다', ['아직은 준비가 덜 됐다고 말했다. 구단은 다른 대행을 찾았다.', 'coachFame-0.3 rel.owner-2 stress-1 fu:fu_coach@8-22'], { pv: '위험 회피 기회 상실' })
  ], { cond: [ASST], cd: 150, max: 2, xg: 'caretaker', tier: 'major' }),
  ch('cn_rival_club_job', C, 3, [
    '다른 구단에서 {name:을} 코칭스태프로 데려가고 싶다는 연락이 왔다. 지금 팀과의 계약은 아직 남아 있다.',
    '에이전트를 통해 코치직 제안이 들어왔다. 더 큰 구단이고 책임도 크다.'
  ], [
    cc('면접을 보러 간다', ['새 구단의 단장과 마주 앉았다. 준비해 온 구상을 차분히 설명했다.', 'fx:coachOffers=more coachFame+0.4 fu:fu_coach@8-22'], { chk: '50 coachFame*0.25 tactics*0.2 leadership*0.1', pv: '이직 제안↑ 평판 위험', bad: ['면접 소식이 새어 나가 현 구단과 서먹해졌다.', 'coachFame-0.5 rel.owner-4 fu:fu_coach@8-22'] }),
    cc('지금 자리에 남는다', ['현 구단에 남기로 했다. 코칭스태프 동료들이 반가워했다.', 'rel.owner+2 hid.loyalty+2 coachFame-0.2 stress+1 fu:fu_coach@8-22'], { pv: '충성↑ 기회 상실' })
  ], { cond: [YA], cd: 100, max: 3, xg: 'job_offer', tier: 'major' }),
  ch('cn_license_practicum', C, 3, [
    '자격증 과정의 현장 실습 시간이다. 현직 구단 훈련에 참관하고 일부 세션을 직접 지도해야 한다.',
    '교육원 강사가 실습 평가를 예고했다. 훈련장에서 직접 지도하는 모습이 평가 대상이다.'
  ], [
    cc('현장에서 적극적으로 지도한다', ['세션을 직접 이끌며 선수들의 반응을 살폈다. 강사가 메모를 남겼다.', 'tactics+0.2 leadership+0.1 coachFame+0.2'], {
      chk: '50 tactics*0.3 leadership*0.2', pv: '실력↑ 평가 위험',
      bad: ['설명이 길어지고 훈련 흐름이 끊겼다. 평가 점수가 아쉬웠다.', 'stress+4 coachFame-0.2']
    }),
    cc('관찰 위주로 배운다', ['남이 하는 지도를 지켜보며 노트에 적었다. 실습 점수는 평이했다.', 'tactics+0.05 data+0.05 coachFame-0.2 stress-1'], { pv: '안전한 학습 평가 점수↓' })
  ], { cond: ['studying'], cd: 26, max: 4, xg: 'license_class', tier: 'minor' }),
  ch('cn_pundit_gig', C, 3, [
    '구직 중인 {name}에게 방송사가 해설 객원을 제안했다. 몇 경기만 맡으면 된다고 한다.',
    '라디오 방송 해설자 자리가 비었다. 지도자 구직 기간의 수입원이 될 수 있다.'
  ], [
    cc('해설 객원으로 출연한다', ['마이크 앞에서 전술을 짚었다. 생각보다 말이 막힘없이 나왔다.', 'coachFame+0.4 media+0.3 cashw+2'], {
      chk: '52 media*0.3 coachFame*0.15', pv: '수입↑ 인지도↑ 말실수 위험',
      bad: ['순간 흥분해 감독 한 명을 정면 비판하고 말았다. 구단들의 시선이 싸늘하다.', 'coachFame-0.6 rel.media-3']
    }),
    cc('현장 복귀에 집중하며 거절한다', ['방송 대신 훈련 노트와 구직 서류를 다시 펼쳤다.', 'stress+2 coachFame-0.2'], { pv: '현장 집중 수입 기회 상실' })
  ], { cond: [NONE], cd: 60, max: 3, xg: 'jobless_work', tier: 'minor' }),
  ch('cn_analyst_gig', C, 3, [
    '프로 구단 분석팀에서 외주 분석 업무를 제안했다. 경기당 보고서를 써 주면 보수를 준다고 한다.',
    '구직이 길어지는 사이 데이터 분석 업체가 협업을 제안했다. 돈은 되지만 시간이 많이 든다.'
  ], [
    cc('데이터 분석 외주를 맡는다', ['밤새 영상을 끊어 가며 보고서를 썼다. 숫자가 이야기를 해 주기 시작했다.', 'data+0.3 cashw+2 fatigue+3'], {
      chk: '52 data*0.3 tactics*0.15', pv: '분석력↑ 수입↑ 피로↑',
      bad: ['납기에 쫓겨 보고서 품질이 들쭉날쭉했다. 업체의 반응이 시큰둥하다.', 'data+0.05 stress+4 cashw+1']
    }),
    cc('쉬면서 구직에 매달린다', ['이력서를 다시 다듬고 인맥에게 안부를 돌렸다. 시간이 더디게 갔다.', 'stress+3 cashw-1'], { pv: '구직 집중 지출↑' })
  ], { cond: [NONE], cd: 60, max: 3, xg: 'jobless_work', tier: 'minor' }),
  ch('cn_unemployed_slump', C, 3, [
    '일자리 없이 몇 달이 흘렀다. 연락처의 이름들이 하나둘 답이 없다. 이대로 잊히는 건 아닐까 하는 불안이 커진다.',
    '아침에 일어나도 갈 곳이 없다. 훈련 일정표 대신 비어 있는 달력이 눈에 들어온다.'
  ], [
    cc('여러 구단을 직접 방문해 인맥을 쌓는다', ['여러 구단 훈련장을 돌며 코칭스태프와 차를 마셨다. 몇몇은 연락처를 건넸다.', 'fx:coachOffers=more coachFame+0.3 cashw-1'], {
      chk: '50 coachFame*0.25 media*0.15 management*0.15', pv: '제안↑ 비용↑',
      bad: ['여비만 쓰고 별 소득이 없었다. 마음이 더 가라앉았다.', 'cashw-2 stress+5']
    }),
    cc('자격증과 공부에 시간을 쓴다', ['전술서를 다시 읽고 영상 분석에 시간을 보냈다. 언젠가를 위한 준비다.', 'tactics+0.2 data+0.1 coachFame-0.3 cashw-1'], { pv: '실력↑ 인지도↓' })
  ], { cond: [NONE], cd: 80, max: 3, xg: 'jobless_slump', tier: 'minor' }),
  ch('cn_youth_parent', C, 3, [
    '유스 선수의 학부모가 구단에 항의 전화를 했다. 출전 시간이 적다는 것이다. 감독과 단장이 {name}에게 대응을 맡겼다.',
    '훈련장 입구에서 학부모들이 기다리고 있다. 출전 기회와 선발 기준을 설명해 달라고 한다.'
  ], [
    cc('데이터를 보여 주며 차분히 설명한다', ['훈련 기록과 평가표를 함께 보며 설명했다. 학부모들의 표정이 풀렸다.', 'rel.owner+2 development+0.1 stress-1'], {
      chk: '55 data*0.2 media*0.2 leadership*0.1', pv: '신뢰↑ 갈등 해소',
      bad: ['설명이 변명처럼 들렸다. 항의는 더 커졌다.', 'stress+5 rel.owner-3']
    }),
    cc('책임을 감독과 단장에게 넘긴다', ['"결정은 윗선에서 합니다." 학부모들은 불만을 안고 돌아갔다.', 'rel.owner-3 leadership-0.1 stress-2'], { pv: '책임 회피 구단 신뢰↓' })
  ], { cond: [YOUTH], cd: 80, max: 3, xg: 'parent_relation', tier: 'minor' }),
  ch('cn_youth_release', C, 3, [
    '시즌 말 유스 선수 몇 명의 계약 유지 여부를 정해야 한다. 성장 가능성은 낮지만 성실한 아이가 한 명 있다.',
    '구단은 유스 인원을 줄이라고 한다. 리스트에서 누구를 뺄지 코칭스태프 회의가 열렸다.'
  ], [
    cc('냉정하게 방출 명단을 제출한다', ['숫자와 영상으로 판단했다. 마음은 편치 않았다.', 'development+0.1 management+0.1 stress+4'], {
      chk: '55 data*0.2 management*0.2 development*0.1', pv: '효율↑ 마음 무거움',
      bad: ['판단이 조급했다는 비판이 나왔다. 방출된 선수의 가족이 구단에 항의했다.', 'rel.owner-2 stress+7']
    }),
    cc('한 시즌 더 기회를 준다', ['한 번 더 기회를 줬다. 선수의 눈빛이 달라졌다.', 'development+0.05 rel.owner-1 coachFame-0.2'], { pv: '성장 기회 구단 부담' })
  ], { cond: [YOUTH], cd: 80, max: 3, xg: 'youth_cut', tier: 'minor' }),
  ch('cn_blame_game', C, 3, [
    '연패가 이어지자 감독이 기자회견에서 "코칭스태프의 준비가 부족했다"고 말했다. 누구를 겨냥한 말인지 모두 안다.',
    '구단 수뇌부가 책임 소재를 가리려 한다. 감독은 {name}의 이름을 슬쩍 언급했다.'
  ], [
    cc('묵묵히 받아들인다', ['말을 아꼈다. 마음에 가시가 박힌 채 훈련을 이어 갔다.', 'stress+5 leadership+0.05 rel.owner-1'], { pv: '충돌 회피 스트레스↑' }),
    cc('사실 관계를 정리해 단장에게 보고한다', ['훈련 기록과 경기 분석을 정리해 단장에게 전달했다. 단장이 고개를 끄덕였다.', 'rel.owner+3 coachFame+0.3'], {
      chk: '52 management*0.2 data*0.2 media*0.1', pv: '신뢰↑ 감독 관계 위험',
      bad: ['보고가 감독의 귀에 들어갔다. 관계가 돌이킬 수 없이 서먹해졌다.', 'rel.owner-4 stress+5']
    })
  ], { cond: [ASST], cd: 100, max: 2, xg: 'staff_conflict', tier: 'minor' }),
  ch('cn_media_request', C, 3, [
    '기자 한 명이 인터뷰를 요청했다. 최근 육성 성과에 대한 이야기를 듣고 싶다고 한다.',
    '지역 방송이 코치진 인터뷰를 요청했다. 감독이 바빠서 대신 나가 달라는 부탁이다.'
  ], [
    cc('짧게 응한다', ['핵심만 간결하게 말했다. 기사에 이름이 정확히 실렸다.', 'coachFame+0.5 rel.media+3'], {
      chk: '55 media*0.3', pv: '인지도↑ 말실수 위험',
      bad: ['말이 꼬여 엉뚱한 제목이 붙었다. 감독이 불편한 기색을 보였다.', 'rel.media-4 coachFame-0.3 stress+3']
    }),
    cc('구단 규정을 이유로 거절한다', ['"저는 감독님을 보좌할 뿐입니다." 기자는 아쉬운 표정으로 돌아갔다.', 'rel.media-2 coachFame-0.1'], { pv: '안전 인지도 기회 상실' })
  ], { cond: [YA], cd: 60, max: 4, xg: 'staff_media', tier: 'minor' }),
  ch('cn_scout_report', C, 3, [
    '단장이 영입 후보 몇 명의 평가를 요청했다. 코치로서 보고서를 올릴 기회다.',
    '이적시장을 앞두고 스카우트팀과 코칭스태프의 의견이 갈렸다. {name}의 평가가 중요한 변수가 될 것이다.'
  ], [
    cc('분석 보고서를 정리해 올린다', ['영상과 데이터를 엮은 보고서를 올렸다. 단장이 꼼꼼히 읽었다.', 'data+0.2 rel.director+3 coachFame+0.3'], {
      chk: '52 data*0.3 tactics*0.15', pv: '신뢰↑ 평가 오류 위험',
      bad: ['추천했던 선수가 기대에 미치지 못했다. 단장이 보고서를 다시 꺼냈다.', 'rel.director-3 stress+3']
    }),
    cc('구두로 간단히 의견만 전한다', ['복도에서 몇 마디 의견을 건넸다. 기록으로는 남지 않았다.', 'rel.director-1 data-0.05'], { pv: '안전 기록 부재' })
  ], { cond: [ASST], cd: 60, max: 3, xg: 'transfer_input', tier: 'minor' })
];
