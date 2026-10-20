import type { RawEvent } from '../../schema';
import { cc, ch, pa } from '../helpers';

const Y: ('youth')[] = ['youth'];

export const youthStages: RawEvent[] = [
  pa('ys_review_promote', Y, 1, [
    '시즌 말 승급 심사. {coach} 감독이 명단을 읽어 내려가다 {name}의 이름에서 멈췄다. 다음 시즌은 {stage} 팀에서 뛰게 된다.',
    '게시판에 승급 명단이 붙었다. 손가락으로 줄을 따라 내려가다 {name}의 이름을 찾았다. 이제 {stage}다.'
  ], 'morale+6 happy+4 rel.coach+2', { sched: true, cd: 0, max: 4, note: 'youth_stage' }),
  pa('ys_review_stay', Y, 1, [
    '심사 결과는 잔류였다. 한 시즌 더 {stage} 팀에서 보여 줄 기회가 주어졌다. 동기들이 하나둘 위 연령대로 올라가는 모습을 지켜보았다.',
    '"이번엔 아니다." {coach} 감독은 짧게 말했다. 잔류. 같은 라커룸, 같은 번호, 하지만 같은 마음은 아니다.'
  ], 'morale-4 stress+3 hid.pro+1', { sched: true, cd: 0, max: 6, note: 'youth_stage' }),
  ch('ys_release_notice', Y, 1, [
    '구단 사무실에서 서류 한 장을 받았다. 승급 심사 탈락, 그리고 계약 해지 통보였다. {coach} 감독은 "축구가 끝난 게 아니다"라고만 했다.',
    '시즌 마지막 날, 짐을 싸라는 연락이 왔다. 숙소 복도가 평소보다 길게 느껴졌다. 아직 열다섯 안팎인 {name}에게는 너무 이른 이별이다.'
  ], [
    cc('하위 구단 아카데미 입단 테스트에 응한다', ['짐을 싸서 여러 구단의 테스트를 돌았다. 아직 끝난 게 아니다.', 'fx:youthMove=down stress+4'], {
      chk: '58 ovr*0.3 hid.adapt*0.1 hid.pro*0.1', pv: '기회 유지 스트레스↑',
      bad: ['원하던 곳은 아니었지만 지역의 작은 클럽 유스가 받아 주었다. 훈련 환경은 눈에 띄게 달라졌다.', 'fx:youthMove=low morale-6 pot-1'],
      worst: ['어느 구단도 연락을 주지 않았다. 전화기를 한참 들여다보다 공을 장롱 깊숙이 넣었다.', 'fx:youthQuit']
    }),
    cc('아버지가 아는 지역 클럽에서 다시 시작한다', ['동네 클럽의 낡은 운동장에서 다시 공을 찼다. 시설도 코칭도 한참 부족하다.', 'fx:youthMove=low pot-0.8 morale-5 sharp-4'], { pv: '출전 기회 유지 성장 정체' }),
    cc('축구를 그만둔다', ['오랫동안 품어 온 꿈을 접었다. 마지막으로 공을 만져 본 날이었다.', 'fx:youthQuit'], { pv: '진로 변경' })
  ], { sched: true, cd: 0, max: 4, xg: 'release_path', note: 'youth_rate' }),
  ch('ys_scholar_offer', Y, 1, [
    '{coach} 감독이 구단 사무실로 불렀다. 장학 계약서가 책상 위에 놓여 있었다. 소액의 수당과 숙소·학업 지원이 포함된 유스 계약이다.',
    '구단 직원이 장학 계약서를 내밀었다. "내년까지 우리와 함께하자"는 말이 낯설었다. 아직 프로 계약은 아니지만 첫 번째 정식 문서다.'
  ], [
    cc('바로 서명한다', ['부모님과 나란히 서명했다. 이름이 계약서에 처음 찍혔다.', 'fx:scholar=low morale+5 happy+3 hid.loyalty+3 hid.ambition-2 flag:scholar_bound'], { pv: '소속 안정 야망↓' }),
    cc('수당과 지원 조건을 협상한다', ['에이전트 없이 부모님과 조건표를 들고 앉았다. 숫자 하나하나가 긴장됐다.', 'fx:scholar=high morale+6'], {
      chk: '55 ovr*0.2 rel.coach*0.15 hid.social*0.1', pv: '수당↑ 협상 결렬 위험',
      great: ['구단이 의외로 양보했다. 수당과 교육 지원 모두 기대 이상이다.', 'fx:scholar=high morale+8 rel.coach+3'],
      bad: ['구단은 기본 조건 외엔 어렵다고 했다. 분위기가 살짝 식었다.', 'fx:scholar=low rel.coach-4 morale-3'],
      worst: ['욕심이 과하다는 인상을 주고 말았다. 제안서가 슬며시 회수됐다.', 'fx:scholar=none rel.coach-8 morale-8']
    }),
    cc('다른 구단의 제안을 알아본다', ['부모님과 의논해 다른 구단의 반응을 살펴보기로 했다. 시간이 흘렀다.', 'fu:ys_poach_up@4-12 hid.ambition+1 stress+3'], {
      chk: '50 ovr*0.25 hid.ambition*0.1 fameD*0.2', pv: '상위 구단 접촉 기회 계약 철회 위험',
      bad: ['기다리는 사이 구단은 서류를 다른 선수에게 넘겼다. 이제 아무것도 정해진 게 없다.', 'fx:scholar=none morale-6 rel.coach-5']
    })
  ], { sched: true, cd: 0, max: 1, xg: 'scholar', note: 'youth_stage' }),
  ch('ys_scholar_denied', Y, 1, [
    '장학 계약 명단이 발표됐다. 동기 몇 명의 이름이 있었지만 {name}의 이름은 없었다. {coach} 감독은 "아직 판단을 미루는 것뿐"이라고 했지만 위로로 들렸다.',
    '구단은 이번 시즌 장학 계약을 소수에게만 제안했다. 그 안에 포함되지 못했다. 방출 위험이 한층 가까워졌다는 사실을 모두가 안다.'
  ], [
    cc('이를 악물고 증명해 보인다', ['남들보다 먼저 나와 공을 찼다. 다음 심사에서는 이름이 불리길 바랐다.', 'fx:scholar=none hid.pro+2 stress+4 fatigue+4'], {
      chk: '50 hid.pro*0.3 rel.coach*0.15 fatigue*-0.1', pv: '재기회 가능 스트레스↑',
      great: ['꾸준한 노력이 감독의 눈에 들었다. 소액이지만 뒤늦게 장학 계약서가 도착했다.', 'fx:scholar=low morale+6 rel.coach+3'],
      bad: ['욕심은 컸지만 몸이 따라 주지 않았다. 지친 기색이 역력하다.', 'fx:scholar=none morale-5 stress+6']
    }),
    cc('다른 구단 테스트를 알아본다', ['에이전트와 지인을 통해 다른 구단 테스트 일정을 잡았다.', 'fx:scholar=none fx:youthMove=same morale+2'], {
      chk: '48 ovr*0.3 hid.adapt*0.1', pv: '새 출발 가능 성공 불확실',
      bad: ['테스트 결과는 신통치 않았다. 돌아오는 길이 유난히 멀었다.', 'fx:scholar=none morale-6 rel.coach-4']
    }),
    cc('결과를 받아들이고 훈련에 집중한다', ['장학 계약이 전부는 아니라고 스스로를 다독였다. 그래도 마음 한구석이 쓰리다.', 'fx:scholar=none morale-4 stress+3 hid.ambition-1'], { pv: '방출 위험↑' })
  ], { sched: true, cd: 0, max: 1, xg: 'scholar', note: 'youth_stage' }),
  ch('ys_poach_up', Y, 3, [
    '상위 구단 아카데미 스카우트가 직접 찾아왔다. {name}의 움직임이 인상적이었다며 입단 테스트를 제안했다. 소속팀 모르게 이루어진 접촉이다.',
    '큰 구단 유스 책임자가 부모님께 전화를 걸어 왔다. 더 높은 수준에서 뛰어 볼 생각이 없느냐는 이야기였다.'
  ], [
    cc('이적을 받아들인다', ['짐을 꾸려 새 도시로 옮겼다. 훈련의 속도와 동기들의 수준이 한 단계 다르다.', 'fx:youthMove=up flag:moved_up morale+5 stress+4 rel.mates-3'], {
      chk: '55 ovr*0.35 hid.adapt*0.1 hid.ambition*0.1', pv: '수준↑ 환경 변화 스트레스↑',
      great: ['테스트 첫날부터 눈에 띄었다. 구단은 즉시 이적을 확정했다.', 'fx:youthMove=up flag:moved_up morale+8 fameD+0.5 stress+3'],
      bad: ['테스트에서 기대한 인상을 남기지 못했다. 소문이 돌아 소속팀 감독과도 어색해졌다.', 'morale-5 rel.coach-3 stress+3']
    }),
    cc('지금 팀에 남는다', ['이 팀에서 더 증명하기로 했다. {coach} 감독이 조용히 고개를 끄덕였다.', 'rel.coach+3 hid.loyalty+2 hid.ambition-2 morale-2'], { pv: '감독 관계↑ 기회 상실' }),
    cc('시간을 달라고 말한다', ['부모님과 길게 이야기했다. 결정은 미뤄졌다.', 'rel.father+2 stress+3 fu:ys_poach_late@8-16'], { pv: '결정 보류 기회 만료 가능' })
  ], { cond: ['ovr>=38', 'lvl<=5', '!flag:moved_up'], cd: 80, max: 2, xg: 'academy_move', tier: 'major' }),
  pa('ys_poach_late', Y, 1, [
    '답을 미루는 사이 상위 구단은 다른 선수를 택했다. 한 번의 기회가 조용히 지나갔다.',
    '뒤늦게 연락해 본 구단은 이미 명단을 확정한 뒤였다. 아쉬움이 한동안 가시지 않았다.'
  ], 'morale-4 hid.ambition+1', { sched: true, cd: 0, max: 2 }),
  ch('ys_big_club_cut', Y, 3, [
    '빅클럽 아카데미에서 성장 속도가 정체된 선수들의 정리가 시작됐다. 구단은 {name}에게 하위 구단 이적을 권했다. "더 많이 뛸 수 있는 곳"이라는 표현이 정중했다.',
    '유스 디렉터가 면담을 요청했다. 이곳의 경쟁은 치열하고, 다른 구단에서 출전 시간을 얻는 편이 낫다는 것이 구단의 결론이다.'
  ], [
    cc('권유를 받아들이고 하위 구단으로 간다', ['떠나는 날 라커룸에서 몇몇 동기가 어색하게 포옹했다. 새 구단에서는 첫 주부터 선발 명단에 들었다.', 'fx:youthMove=down morale-4 happy-2 sharp+4 attr.positioning+0.1 fu:fu_career@10-26'], { pv: '출전 시간↑ 사기↓' }),
    cc('남아서 끝까지 경쟁한다', ['"여기서 증명하겠습니다." 디렉터가 한동안 말없이 서류를 덮었다.', 'hid.pro+2 rel.coach+3 flag:staying_big fu:fu_career@10-26'], { chk: '42 ovr*0.3 hid.pro*0.2 rel.coach*0.2', pv: '잔류 가능 방출 위험', bad: ['성과를 보이지 못했고, 구단은 강제로 이적을 통보했다.', 'fx:youthMove=down morale-6 rel.coach-4 fu:fu_career@10-26'], worst: ['가장 낮은 수준의 지역 클럽으로 옮기게 됐다. 성장이 크게 꺾였다.', 'fx:youthMove=low morale-10 pot-1.5 fu:fu_career@10-26'] })
  ], { cond: ['lvl>=5', 'pot<=70'], cd: 150, max: 1, xg: 'academy_move', tier: 'major' }),
  ch('ys_youth_cup_call', Y, 3, [
    '지역 유스 선발 대회 소집 명단에 이름이 올랐다. 소속 구단은 같은 주에 중요한 대회를 앞두고 있다.',
    '연령별 선발팀 코치가 {name}을(를) 추천했다는 소식이 들렸다. 구단 일정과 겹치는 소집이다.'
  ], [
    cc('선발팀 소집에 응한다', ['낯선 유니폼을 입고 낯선 동료들과 뛰었다. 속도가 달랐다.', 'fx:youthCap fameD+0.6 morale+5 fatigue+6'], {
      chk: '55 ovr*0.3 hid.bigGame*0.15 fatigue*-0.2', pv: '명성↑ 피로↑ 부상 위험',
      great: ['대회에서 눈에 띄는 활약을 펼쳤다. 상위 구단 스카우트의 이름이 수첩에 올랐다.', 'fx:youthCap fameD+1 morale+8 attr.composure+0.2'],
      bad: ['과로와 낯선 환경에 지쳐 경기력이 떨어졌다. 소속팀 감독도 좋은 표정이 아니다.', 'fatigue+10 rel.coach-3 sharp-3'],
      worst: ['대회 중 발목을 접질렸다.', 'fx:inj=ankle rel.coach-3']
    }),
    cc('구단 대회에 집중한다', ['소속 팀과 함께하기로 했다. 감독이 환히 웃었다.', 'rel.coach+3 fameD-0.2 morale-1'], { pv: '감독 관계↑ 명성 기회 상실' })
  ], { cond: ['youthCall'], cd: 52, max: 3, xg: 'national', tier: 'minor' }),
  ch('ys_first_team_first', Y, 3, [
    '1군 감독이 유스 선수 몇 명을 훈련에 불렀다. 그 안에 {name}도 있다. 라커룸에서 처음 보는 선수들이 눈인사를 건넸다.',
    '내일 1군 오전 훈련에 합류하라는 지시가 내려왔다. TV에서만 보던 얼굴들이 같은 운동장에 서 있다.'
  ], [
    cc('주눅 들지 않고 부딪혀 본다', ['공을 받는 순간 템포가 달랐지만 물러서지 않았다. 훈련 말미에 한 선수가 어깨를 두드렸다.', 'attr.firstTouch+0.2 sharp+4 rel.fcoach+3 flag:first_team_train morale+4'], {
      chk: '55 ovr*0.3 hid.bigGame*0.15 attr.composure*1', pv: '성장↑ 감독 관계↑ 위축 위험',
      bad: ['속도에 압도당했다. 두 번의 패스 미스 뒤 목소리가 작아졌다.', 'morale-6 stress+5 flag:first_team_train rel.captain-2']
    }),
    cc('구경한다는 마음으로 한 발 물러선다', ['기본적인 움직임만 하며 조용히 훈련을 마쳤다. 기회는 지나갔다.', 'morale-2 attr.composure+0.05 flag:first_team_train rel.coach-2'], { pv: '위험 회피 인상 약화' })
  ], { sched: true, cd: 0, max: 1, xg: 'first_team', tier: 'major' }),
  ch('ys_growth_body', Y, 3, [
    '몇 달 사이 키가 훌쩍 컸다. 무릎이 쑤시고 몸이 마음을 따라오지 못한다. 트레이너가 부하 조절을 권했다.',
    '성장통이 시작됐다. 정강이와 무릎 주변이 욱신거린다. 훈련 도중 자꾸 균형을 잃는다.'
  ], [
    cc('훈련 부하를 조절하고 몸에 맞춰 간다', ['트레이너와 상의해 운동량과 회복 일정을 조정했다. 몸이 조금씩 새 키에 적응했다.', 'health+3 attr.balance+0.15 sharp-2'], {
      chk: '58 health*0.15 sleep*0.2 hid.pro*0.2', pv: '건강↑ 균형↑ 경기 감각↓',
      bad: ['조절은 했지만 불편함이 이어졌다. 체중 관리가 미흡했다.', 'health-3 stress+3']
    }),
    cc('개의치 않고 평소대로 훈련한다', ['참을 수 있다고 믿었다. 훈련량은 그대로였고 통증도 그대로였다.', 'fatigue+6 health-2 attr.pace+0.1'], { pv: '훈련량 유지 피로↑' })
  ], { cond: ['age<=16'], cd: 52, max: 2, xg: 'body', tier: 'minor' }),
  ch('ys_study_clash', Y, 3, [
    '시험 일정과 오전 훈련이 매주 부딪힌다. 학교는 출석을, 구단은 훈련을 요구한다. 어느 쪽도 양보하지 않는 분위기다.',
    '담임 선생님과 코치가 같은 날 면담을 요청했다. 학업과 축구, 둘 다 붙들기엔 하루가 너무 짧다.'
  ], [
    cc('학교와 구단 사이 일정 조율을 요청한다', ['부모님과 함께 양쪽을 오가며 일정을 조정했다. 쉽지는 않았지만 숨통이 트였다.', 'edu+3 rel.coach+1 flag:study_balance'], {
      chk: '55 rel.coach*0.2 hid.social*0.1 hid.family*0.1', pv: '학업 유지 훈련 유지 조율 실패 위험',
      bad: ['어느 쪽도 만족하지 못했다. 양쪽 모두에게 한 소리씩 들었다.', 'edu-3 rel.coach-3 stress+4']
    }),
    cc('훈련을 줄이고 학업에 집중한다', ['성적은 안정됐지만 경기 감각이 떨어졌다. 감독은 말이 없었다.', 'edu+6 sharp-4 rel.coach-3'], { pv: '학력↑ 경기 감각↓ 감독 관계↓' }),
    cc('학업을 접고 축구에 올인한다', ['교과서를 덮었다. 훈련장에서는 한결 가벼워졌지만 부모님의 표정은 무거웠다.', 'sharp+3 attr.firstTouch+0.15 edu-6 rel.mother-4'], { pv: '훈련 집중 학력↓ 가족 관계↓' })
  ], { cond: ['age<=17'], cd: 60, max: 2, xg: 'study', tier: 'minor' }),
  ch('ys_mate_released', Y, 3, [
    '같은 방을 쓰던 동기가 방출됐다는 소식이 숙소에 돌았다. 짐을 싸는 그의 뒷모습을 모두가 못 본 척했다.',
    '아침 훈련에 동기 한 명이 보이지 않았다. 어젯밤 방출 통보를 받았다고 한다. 다음은 누구일지 아무도 말하지 않는다.'
  ], [
    cc('동기를 찾아가 위로한다', ['밤늦게 그의 방을 찾았다. 오래 말없이 앉아 있다가 연락처를 주고받았다.', 'rel.mates+6 happy-2 stress+2'], {
      chk: '52 hid.social*0.2 rel.mates*0.2 hid.family*0.1', pv: '동료 관계↑ 마음 무거움',
      bad: ['위로의 말이 서툴렀다. 그에게는 오히려 상처가 됐다.', 'rel.mates-2 stress+4']
    }),
    cc('내 훈련에 집중한다', ['감정을 접어 두고 훈련에만 몰두했다. 하지만 밤이 되자 자꾸 빈 침대가 눈에 들어왔다.', 'stress+2 hid.pro+1 rel.mates-4 happy-3'], { pv: '프로의식↑ 동료 관계↓' })
  ], { cd: 60, max: 3, xg: 'mate_news', tier: 'minor' })
];
