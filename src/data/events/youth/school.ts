import type { RawEvent } from '../../schema';
import { cc, ch, mo, pa } from '../helpers';

const Y: ('youth')[] = ['youth'];

export const youthSchool: RawEvent[] = [
  ch('ys_alt_young', Y, 1, [
    '구단 사무실에서 서류 한 장을 받았다. 산하 유스 승급 심사 탈락이다. {coach} 감독은 "고교 축구부에서 다시 증명해 보라"며 몇 군데 학교 이름을 적어 주었다.',
    '짐을 싸라는 통보를 받았다. 하지만 이 나라에는 학교 축구부라는 또 다른 길이 있다. 부모님은 학업을 이어 갈 수 있다는 데 조금 안도했다.'
  ], [
    cc('고교 축구부로 전학한다', ['새 교복을 입고 낯선 운동장에 섰다. 훈련 시설은 아카데미보다 못하지만 경기 수는 많다.', 'fx:school=HS morale-3 stress+3 hid.adapt+1'], { chk: '62 hid.adapt*0.15 ovr*0.15', pv: '출전 기회↑ 시설↓ 학업↑', bad: ['적응이 쉽지 않았다. 초반에는 벤치를 지켰다.', 'fx:school=HS morale-5 stress+5'] }),
    cc('하위 구단 아카데미 테스트에 응한다', ['짐을 싸서 여러 구단의 테스트를 돌았다. 아직 끝난 게 아니다.', 'fx:youthMove=down stress+4'], { pv: '프로 아카데미 유지 스트레스↑' }),
    cc('축구를 그만둔다', ['오랫동안 품어 온 꿈을 접었다. 마지막으로 공을 만져 본 날이었다.', 'fx:youthQuit'], { pv: '진로 변경' })
  ], { sched: true, cd: 0, max: 4, xg: 'release_path', note: 'youth_rate' }),
  ch('ys_alt_final', Y, 1, [
    '{coach} 감독이 조용히 불렀다. "프로 계약은 어렵겠다." 유스 계약이 끝났다. 하지만 대학 축구부, 하위 리그 테스트 등 갈 수 있는 길은 아직 남아 있다.',
    '구단은 계약 연장 없이 {name:을} 놓아주기로 했다. 지도자들과 부모님이 함께 앉아 진학과 테스트 사이에서 의견을 나눴다.'
  ], [
    cc('대학 축구부로 진학한다', ['입학 서류를 냈다. 수업과 훈련을 병행하는 새 생활이 시작된다.', 'fx:school=UNI stress+3 edu+4'], { pv: '학력↑ 프로 진입 기회 유지 시설↓' }),
    cc('하위 리그 입단 테스트에 도전한다', ['짐을 싸서 여러 구단의 테스트를 돌기로 했다. 아직 끝난 게 아니다.', 'fx:trialOffers stress+6'], { chk: '55 ovr*0.2 hid.pro*0.2', pv: '프로 직행 가능 스트레스↑', bad: ['연락은 좀처럼 오지 않았다. 몇 주를 기다린 끝에야 작은 구단 한 곳이 기회를 주었다.', 'fx:trialOffers stress+10 morale-5'] }),
    cc('축구를 그만둔다', ['오랫동안 품어온 꿈을 접었다. 마지막으로 공을 만져 본 날이었다.', 'fx:youthQuit'], { pv: '진로 변경' })
  ], { sched: true, cd: 0, max: 5, xg: 'release_path', note: 'youth_rate' }),
  ch('ys_school_scout', Y, 3, [
    '전국 대회 단골 명문 고교의 감독이 훈련장을 찾아왔다. 학교 축구부에서 더 많은 경기를 뛰어 보겠느냐는 제안이다. 학교는 학업과 병행하는 조건을 내걸었다.',
    '고교 축구부 코치가 부모님께 먼저 연락했다. 아카데미에서 벤치를 지키는 시간이 길다면 학교에서 주전으로 성장하는 길도 있다는 말이었다.'
  ], [
    cc('명문고로 전학한다', ['짐을 꾸려 새 학교로 옮겼다. 처음 뛴 연습경기에서 바로 선발로 나섰다.', 'fx:school=HS morale+3 stress+3 hid.adapt+1 fu:fu_career@10-26'], { chk: '50 ovr*0.2 hid.adapt*0.15', pv: '출전↑ 시설↓ 프로 진입은 졸업 시기', bad: ['적응이 쉽지 않았다. 초반 몇 주 동안 벤치를 지켰다.', 'fx:school=HS morale-4 stress+5 fu:fu_career@10-26'] }),
    cc('지금 아카데미에 남는다', ['프로 아카데미에서 끝까지 해 보기로 했다. 감독이 조용히 고개를 끄덕였다.', 'rel.coach+3 hid.loyalty+2 hid.ambition-1'], { pv: '감독 관계↑ 출전 부족 위험' })
  ], { cond: ['country:KR', 'age>=15', 'age<=16', '!signed', '!school', 'ytShare<0.5'], cd: 100, max: 1, xg: 'school_move', tier: 'major' }),
  ch('ys_after_hs', Y, 1, [
    '졸업을 앞두고 프로 구단에서는 연락이 오지 않았다. 담임 선생님과 감독이 진학 상담을 해 주었다. 대학 축구부 감독 몇 명이 관심을 보인다.',
    '고교 마지막 대회가 끝났다. 프로 입단 제안은 없었다. 이제 대학에서 4년을 더 증명하거나, 하위 리그의 문을 두드려야 한다.'
  ], [
    cc('대학 축구부로 진학한다', ['입학 허가서가 도착했다. 훈련과 수업을 병행하는 4년이 시작된다.', 'fx:school=UNI edu+4 stress+3'], { pv: '학력↑ 프로 진입 기회 유지' }),
    cc('하위 리그 입단 테스트를 본다', ['짐을 싸서 여러 구단의 테스트를 돌기로 했다.', 'fx:trialOffers stress+6'], { chk: '50 ovr*0.2 hid.pro*0.2', pv: '프로 직행 가능 스트레스↑', bad: ['테스트 결과는 신통치 않았다. 한참 뒤에야 작은 구단이 기회를 주었다.', 'fx:trialOffers stress+10 morale-5'] }),
    cc('축구를 그만둔다', ['오랫동안 품어온 꿈을 접었다.', 'fx:youthQuit'], { pv: '진로 변경' })
  ], { sched: true, cd: 0, max: 2, xg: 'release_path', tier: 'major' }),
  ch('ys_after_uni', Y, 1, [
    '대학 졸업이 다가왔지만 프로 구단의 제안은 오지 않았다. 학교 감독은 하위 리그 테스트를 권한다. 시간이 많지는 않다.',
    '졸업 후 진로를 정해야 한다. 축구를 계속하려면 하위 리그 테스트가 마지막 기회일 수 있다.'
  ], [
    cc('하위 리그 입단 테스트에 도전한다', ['졸업장을 가방에 넣고 테스트장으로 향했다.', 'fx:trialOffers stress+6'], { chk: '55 ovr*0.2 hid.pro*0.2', pv: '프로 직행 가능', bad: ['한동안 연락이 없었다. 몇 주 뒤 작은 구단이 기회를 주었다.', 'fx:trialOffers stress+10 morale-5'] }),
    cc('축구를 그만둔다', ['졸업장과 함께 선수의 꿈도 정리했다.', 'fx:youthQuit'], { pv: '진로 변경' })
  ], { sched: true, cd: 0, max: 3, xg: 'release_path', tier: 'major' }),
  ch('ys_undrafted', Y, 1, [
    '슈퍼드래프트 날, 지명 명단이 끝까지 읽혔지만 {name}의 이름은 없었다. 에이전트는 USL 구단 테스트를 권한다.',
    '드래프트에서 지명받지 못했다. 대학 시절의 기록은 남았지만 프로 구단의 선택은 다른 선수들에게 돌아갔다.'
  ], [
    cc('USL 구단 입단 테스트에 도전한다', ['지명 외 선수로 하위 리그 테스트에 도전한다.', 'fx:trialOffers stress+6'], { chk: '52 ovr*0.2 hid.pro*0.2', pv: '프로 직행 가능 스트레스↑', bad: ['긴 기다림 끝에 작은 구단 한 곳이 기회를 주었다.', 'fx:trialOffers stress+10 morale-5'] }),
    cc('축구를 그만둔다', ['대학 졸업장과 함께 다른 길을 찾기로 했다.', 'fx:youthQuit'], { pv: '진로 변경' })
  ], { sched: true, cd: 0, max: 2, xg: 'release_path', tier: 'major' }),
  pa('ys_draft_day', Y, 1, [
    'MLS 슈퍼드래프트 당일. 에이전트와 대기실에 앉아 이름이 불리기를 기다렸다. 손바닥에 땀이 찼다.',
    '드래프트 중계가 시작됐다. 한 명씩 호명될 때마다 심장이 내려앉았다. 마침내 마이크에서 {name}의 이름이 들렸다.'
  ], 'morale+6 fameD+0.4', { sched: true, cd: 0, max: 2 }),
  pa('ys_college_dropout', Y, 1, [
    '재학 중인 {name}에게 프로 구단이 정식으로 입단을 제안했다. 학업을 중단하고 프로로 가는 선택이다. 교수와 부모님이 함께 이야기를 나눴다.',
    '시즌 중 구단 스카우트가 직접 학교를 찾았다. 졸업 전에 프로 계약을 하자는 제안이 도착했다.'
  ], 'morale+5 hid.ambition+1 edu-2', { sched: true, cd: 0, max: 2 }),
  ch('ys_jp_dual', Y, 3, [
    'J리그 구단이 2종 등록 선수로 {name}의 등록을 제안했다. 학교 경기와 병행하며 1군 경기에 나설 수 있는 특별한 기회다.',
    '학교 감독이 불렀다. J리그 구단이 특별지정 선수 신청을 했다고 한다. 수업과 훈련, 그리고 1군 경기까지 일정이 빡빡해진다.'
  ], [
    cc('2종 등록을 받아들인다', ['학교 유니폼 대신 프로 유니폼을 입고 벤치에 앉았다. 후반 교체 사인이 나왔다.', 'fx:dualReg morale+6 fatigue+4 fameD+0.5 fu:fu_career@10-26'], { chk: '60 ovr*0.2 hid.bigGame*0.15', pv: '1군 데뷔 피로↑', bad: ['긴장한 탓에 짧은 출전 시간 동안 존재감이 옅었다.', 'fx:dualReg morale-3 fu:fu_career@10-26'] }),
    cc('학교 대회에 집중한다', ['먼저 학교의 우승에 집중하기로 했다.', 'rel.coach+3 hid.loyalty+2 hid.ambition-1'], { pv: '감독 관계↑' })
  ], { cond: ['country:JP', 'school', 'ovr>=42', '!debuted'], cd: 100, max: 1, xg: 'school_dual', tier: 'major' }),
  ch('ys_school_clash', Y, 3, [
    '학교 감독이 전술 문제로 {name:을} 연달아 벤치에 앉혔다. 선배들과의 서열 문제까지 얽혀 분위기가 험악하다.',
    '감독이 훈련 중 크게 언성을 높였다. 팀 규율을 이유로 한 번 더 벤치를 지키게 하겠다는 통보다.'
  ], [
    cc('감독과 면담해 오해를 푼다', ['조용히 감독실을 찾아가 솔직하게 이야기했다.', 'rel.coach+1 stress+3'], { chk: '48 hid.pro*0.2 hid.social*0.15 rel.coach*0.15', great: ['감독이 의외로 귀를 기울였다. 다음 경기 명단에 이름이 올랐다.', 'rel.coach+6 morale+6'], bad: ['대화는 평행선이었다. 분위기만 더 무거워졌다.', 'rel.coach-5 morale-4'] }),
    cc('묵묵히 훈련하며 기회를 기다린다', ['불만을 삼키고 훈련에 몰두했다.', 'hid.pro+2 morale-3 attr.workRate+0.1'], { pv: '프로의식↑ 사기↓' })
  ], { cond: ['school'], cd: 52, max: 2, xg: 'coach_relation', tier: 'minor' }),
  ch('ys_grade_warning', Y, 3, [
    '학업 성적 경고장이 날아왔다. 이대로면 대회 출전 자격이 박탈될 수 있다. 학교는 훈련 일정 조정을 요구한다.',
    '학점이 기준에 미달해 학사 경고를 받았다. 훈련과 수업 사이에서 균형을 잡지 못했다.'
  ], [
    cc('훈련을 줄이고 학업에 집중한다', ['시험 기간만큼은 수업에 매달렸다. 경기 감각이 조금 떨어졌다.', 'edu+5 sharp-3'], { pv: '학력↑ 경기 감각↓' }),
    cc('학교와 조율해 병행한다', ['담당 교수와 감독을 오가며 일정을 조정했다.', 'edu+2 fatigue+5 stress+4'], { chk: '52 hid.social*0.15 hid.pro*0.15 edu*0.2', pv: '학력 유지 피로↑', bad: ['조율은 실패했다. 대회 출전 자격이 흔들린다.', 'edu-3 rel.coach-4 morale-4'] })
  ], { cond: ['school'], cd: 52, max: 3, xg: 'study', tier: 'minor' }),
  mo('sc_cup_final', 'yfinal', Y, [
    '전국 대회 결승전. 스탠드는 학교 응원단과 가족, 스카우트들로 가득 찼다. 승부는 후반 막판까지 팽팽하다.',
    '학교의 명운이 걸린 결승. 감독이 마지막 교체 카드를 접고 {name}에게 전방 압박을 지시했다.'
  ], [
    cc('결정적인 한 방을 노린다', ['침착하게 공간을 찾아 슈팅했다.', 'rating+0.1'], { chk: '42 attr.finishing*2 attr.composure*2 hid.bigGame*0.25', great: ['공이 골망을 흔들었다! 학교 전체가 들썩였다. 스카우트의 수첩에 이름이 적혔다.', 'goal+1 rating+1.3 morale+10 fameD+0.7'], bad: ['슛은 골키퍼의 선방에 막혔다. 아쉬움이 컸다.', 'rating-0.3 morale-4'] }),
    cc('동료를 살려 우승을 노린다', ['패스 한 번으로 흐름을 바꿨다.', 'rating+0.3'], { chk: '58 attr.passing*1.5 attr.vision*1.5', great: ['정확한 패스가 우승 골로 이어졌다.', 'assist+1 rating+1 morale+9 rel.mates+4'], bad: ['패스가 끊겼다. 기회가 사라졌다.', 'rating-0.3'] }),
    cc('수비에 집중해 승부차기를 노린다', ['라인을 내리고 버텼다.', 'rating+0.2 sharp-1 stress+2'], { pv: '안정 우선 승부차기 가능' })
  ], { cond: ['school', '!pos:GK'], cd: 40, max: 5 }),
  ch('ys_school_transfer', Y, 2, [
    '학교 축구부의 훈련 환경이 아쉽다. 더 강한 학교의 감독이 전학을 제안했다. 하지만 새 학교에서 자리를 잡는다는 보장은 없다.',
    '친구들이 있는 지금 학교와 더 큰 무대를 약속하는 새 학교 사이에서 마음이 흔들린다.'
  ], [
    cc('강팀으로 전학한다', ['새 학교로 옮겼다. 연습 강도가 완전히 달랐다.', 'fx:school=HS morale+2 stress+4 fu:fu_career@10-26'], { chk: '50 ovr*0.25 hid.adapt*0.15', pv: '수준↑ 적응 부담', bad: ['적응에 시간이 걸린다. 초반에는 벤치를 지켰다.', 'fx:school=HS morale-4 stress+5 fu:fu_career@10-26'] }),
    cc('지금 학교에 남는다', ['익숙한 팀에서 에이스로 남기로 했다.', 'morale+2 hid.loyalty+2 hid.ambition-1'], { pv: '출전 안정' })
  ], { cond: ['school', '!schoolUni', 'ytRank>=6', 'ovr>=40'], cd: 100, max: 1, xg: 'school_move', tier: 'major' })
];
