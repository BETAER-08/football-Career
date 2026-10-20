import type { RawEvent } from '../../schema';
import { cc, ch, pa, HELP_VIOLENCE } from '../helpers';

const Y: ('youth')[] = ['youth'];
const YP: ('youth' | 'pro')[] = ['youth', 'pro'];

export const youthChoice: RawEvent[] = [
  ch('yc_extra_practice', Y, 5, ['훈련이 끝났지만 {name}은(는) 공을 놓지 못했다. 몸은 이미 무겁다. 남아서 더 연습할까?', '운동장 불이 하나둘 꺼진다. 혼자 남아 공을 차면 한 뼘 더 자랄 것 같지만 피로가 쌓여 있다.'], [
    cc('남아서 연습한다', ['남은 시간 동안 터치와 슈팅을 다듬었다. 몸은 천근만근이지만 마음은 가볍다.', 'attr.firstTouch+0.2 attr.shooting+0.15 fatigue+8 hid.pro+1'], { chk: '55 hid.pro*0.3 fatigue*-0.3 health*0.1', bad: ['욕심이 지나쳤다. 허벅지가 뻐근하고 다음 날 훈련이 엉망이었다.', 'fatigue+12 morale-3'], worst: ['무리한 연습 끝에 허벅지 뒤쪽에서 찌릿한 통증이 올라왔다.', 'fx:inj=hamstring stress+4'] }),
    cc('일찍 들어가 쉰다', ['오늘은 쉬는 것도 훈련이라고 스스로 달랬다.', 'fatigue-8 stress-3 sharp-3 hid.pro-1'])
  ], { cond: [], cd: 26, max: 3, xg: 'training_load', tier: 'minor' }),
  ch('yc_exam_vs_train', Y, 4, ['시험 기간과 중요한 연습경기가 겹쳤다. 두 가지를 다 잘할 수는 없을 것 같다.', '내일 시험과 모레 경기. 오늘 밤 시간을 어디에 쓸지 결정해야 한다.'], [
    cc('시험공부에 집중한다', ['책상 앞에서 밤을 보냈다. 시험은 무난했지만 경기 감각은 조금 무뎌졌다.', 'edu+6 fatigue+3 sharp-3'], { chk: '55 hid.pro*0.2 sleep*0.2 fatigue*-0.2', pv: '학력↑ 경기 감각↓', bad: ['밤샘 공부에도 집중이 흐트러져 성적이 기대에 못 미쳤다.', 'edu-2 stress+4 fatigue+4'] }),
    cc('훈련과 경기를 우선한다', ['시험은 대충 넘겼다. 대신 경기에서는 몸이 가벼웠다.', 'sharp+4 edu-3 stress+3'], { pv: '경기 감각↑ 학력↓' })
  ], { cond: ['age<=17'], cd: 52, max: 4, xg: 'study', note: 'edu', tier: 'minor' }),
  ch('yc_scout_contact', Y, 3, ['낯선 구단 스카우트가 부모님을 통해 조심스럽게 접촉해 왔다. 더 큰 구단의 유스로 옮길 기회라고 했다.', '더 높은 수준의 구단에서 유스 이적 이야기가 흘러나왔다. {coach} 감독에게는 아직 말하지 않았다.'], [
    cc('이야기를 들어 본다', ['관계자와 직접 만났다. 훈련 참관 결과가 좋았다.', 'fx:youthMove=up flag:moved_up morale+6 stress+3 fu:fu_career@10-26'], { chk: '45 ovr*0.35 hid.ambition*0.1 hid.adapt*0.1', bad: ['테스트에서 기대한 인상을 남기지 못했다. 돌아오는 길이 길었다.', 'morale-6 stress+3 rel.coach-2 fu:fu_career@10-26'] }),
    cc('지금 팀에 남는다', ['이 팀에서 더 증명하기로 했다. {coach} 감독이 조용히 고개를 끄덕였다.', 'rel.coach+4 hid.loyalty+2 hid.ambition-2 morale-1 fu:fu_career@10-26'])
  ], { cond: ['age<=17', 'ovr>=44', '!flag:moved_up'], cd: 104, max: 1, xg: 'academy_move', note: 'scout', tier: 'major' }),
  ch('yc_skip_grade', Y, 3, ['상위 연령팀에서 {name}에게 월반 제안이 왔다. 수준 높은 경쟁이 기다리지만 몸싸움과 속도가 부담이다.', '{coach} 감독이 한 학년 위 팀에서 뛰어 보겠느냐고 물었다.'], [
    cc('월반을 받아들인다', ['형들 틈에서 뛰며 속도와 판단이 눈에 띄게 빨라졌다.', 'sharp+4 attr.pace+0.2 attr.strength+0.2 morale+4'], { chk: '48 ovr*0.4 attr.strength*1 hid.bigGame*0.1', bad: ['형들의 속도에 밀렸다. 몸이 따라오지 않아 자신감이 흔들렸다.', 'morale-6 stress+4'] }),
    cc('또래들과 계속 뛴다', ['익숙한 동료들 속에서 안정적으로 시즌을 보냈다.', 'happy+2 sharp-2 hid.ambition-1'])
  ], { cond: ['age<=17', 'ovr>=44'], cd: 52, max: 3, xg: 'academy_move', tier: 'minor' }),
  ch('yc_senior_pressure', Y, 2, ['숙소의 상하 관계가 점점 무거워지고 있다. 선배들의 권위적인 분위기에 신입들이 위축되어 있다.', '숙소 생활이 힘들어졌다. 일부 선배들의 지나친 군기 문화가 후배들의 입을 막고 있다.'], [
    cc('{coach} 감독에게 상황을 이야기한다', ['감독은 이야기를 진지하게 들었고 구단 차원의 조치가 이뤄졌다.', 'stress-8 rel.coach+4'], { chk: '55 rel.coach*0.25 hid.social*0.1', bad: ['이야기는 전해졌지만 분위기는 쉽게 바뀌지 않았다.', 'stress+6 happy-3'] }),
    cc('동기들과 함께 목소리를 낸다', ['여럿이 함께 의견을 내자 숙소 규칙이 정비됐다.', 'rel.mates+6 stress-4 flag:speak_up'], { chk: '45 hid.social*0.2 rel.mates*0.2', bad: ['시도는 했지만 오히려 눈 밖에 났다.', 'rel.captain-6 stress+6'] }),
    cc('참고 넘긴다', ['입을 다물었다. 시간이 해결해 주길 바랐지만 마음은 무거웠다.', 'stress+8 happy-5'])
  ], { cond: ['dorm', 'age<=17'], cd: 200, max: 1, xg: 'dorm_life', heavy: true, help: HELP_VIOLENCE, tier: 'minor' }),
  ch('yc_growth_pain', Y, 3, ['성장통으로 무릎이 욱신거린다. 훈련을 쉬어야 할까, 참고 뛸까?', '다리 뼈가 자라는 속도를 근육이 따라가지 못한다. 무릎 아래가 계속 쑤신다.'], [
    cc('쉬면서 치료받는다', ['의무팀 지시대로 며칠을 쉬었다. 통증이 가라앉았다.', 'health+3 sharp-3'], { pv: '건강↑ 경기 감각↓' }),
    cc('참고 훈련한다', ['통증을 눌러 두고 훈련을 이어 갔다.', 'attr.stamina+0.1 morale+2'], { chk: '45 hid.injuryProne*-0.25 health*0.2', bad: ['버티다가 발목까지 꺾이고 말았다.', 'fx:inj=ankle stress+3'] })
  ], { cond: ['age>=14', 'age<=17'], cd: 60, max: 3, xg: 'body', note: 'relative_age', tier: 'minor' }),
  ch('yc_position_try', Y, 3, ['{coach} 감독이 {name}에게 다른 포지션을 시험해 보자고 제안했다. 새로운 가능성일지도 모른다.', '연습경기에서 다른 자리에 세워졌다. 감독은 "한번 느껴 봐"라고만 했다.'], [
    cc('받아들여 본다', ['낯선 자리에서 새로운 시야를 얻었다. 부 포지션 숙련도가 늘었다.', 'fx:secPos=CM attr.firstTouch+0.1 rel.coach+3'], { chk: '50 attr.firstTouch*1 attr.vision*0.5 rel.coach*0.1', pv: '부 포지션↑ 감독 관계↑', bad: ['새 포지션이 어색했다. 감독도 고개를 갸웃했다.', 'morale-4 rel.coach-2'] }),
    cc('원래 포지션을 고집한다', ['"저는 여기가 제 자리입니다." 감독은 조금 아쉬운 표정이었다.', 'rel.coach-3 morale+1'])
  ], { cond: ['age<=17', '!pos:CM|GK'], cd: 100, max: 2, xg: 'position_role', tier: 'minor' }),
  ch('yc_agent_approach', YP, 3, ['에이전트라고 자신을 소개한 남자가 부모님께 접근해 왔다. "아이의 미래를 함께 설계하자"는 말이 번지르르하다.', '숙소 앞에서 처음 보는 어른이 명함을 내밀었다. 에이전트였다. 이미 몇 명의 선수와 일한다고 했다.'], [
    cc('계약한다', ['서류에 서명했다. 에이전트는 환하게 웃으며 악수를 청했다.', 'fx:newAgent'], { chk: '50 hid.thrift*0.15 attr.vision*0.3 rel.father*0.1', pv: '에이전트 영입 조항 분쟁 위험', great: ['꼼꼼히 읽고 질문한 덕에 조건이 유리하게 정리됐다. 에이전트도 선수를 다시 보게 됐다.', 'fx:newAgent=good rel.father+2'], bad: ['계약서 깊숙한 곳에 불리한 조항이 숨어 있었다. 수수료와 위약금 조항을 뒤늦게 읽은 부모님이 한숨을 쉬었다.', 'fx:newAgent=bad fx:agentFee=15 rel.father-3 stress+4'], worst: ['서명 직후 에이전트의 태도가 달라졌다. 일방적인 위약금 조항으로 큰 손해를 보았다.', 'fx:newAgent=bad fx:agentFee=20 cash-30 rel.father-6 stress+8'] }),
    cc('부모님과 먼저 상의한다', ['부모님은 신중했다. 몇 달 뒤 다시 이야기하기로 했다.', 'rel.father+3 rel.mother+2 fu:yc_agent_followup@10-22']),
    cc('정중히 거절한다', ['아직 이르다고 판단했다. 에이전트는 명함만 남겼다.', 'happy+1 val-2'])
  ], { cond: ['age>=15', 'ovr>=45', '!hasAgent'], cd: 104, max: 1, xg: 'agent', note: 'agent_fee', tier: 'major' }),
  pa('yc_agent_followup', YP, 1, ['몇 달 사이 에이전트가 다시 연락해 왔다. 부모님은 조건을 꼼꼼히 비교해 본 뒤 계약을 허락했다.', '가족회의 끝에 에이전트와 정식 계약을 맺었다. 수수료 조항은 부모님이 직접 고쳤다.'], 'fx:newAgent rel.father+2', { sched: true, max: 1, cond: ['!hasAgent'] }),
  ch('yc_social_first', YP, 3, ['첫 SNS 계정을 만들었다. 친구들이 팔로우하기 시작했다. 무엇을 올릴까?', '구단 공식 계정에 이름이 태그됐다. 이제 나도 계정을 키워 볼까?'], [
    cc('적극적으로 운영한다', ['훈련 장면과 일상을 올렸다. 팔로워가 눈에 띄게 늘었다.', 'followers+25 fameD+0.4'], { chk: '60 hid.controversy*-0.3 hid.pro*0.1', bad: ['장난으로 올린 사진이 구단 눈에 거슬렸다.', 'rel.coach-3 stress+3 followers+8'], worst: ['부적절한 댓글이 논란이 됐다. 구단이 주의를 주었다.', 'rel.coach-6 rel.media-4 stress+5'] }),
    cc('비공개로 조용히 쓴다', ['친구들과만 소통하는 공간으로 남겨 두었다.', 'stress-2 fameD-0.1 rel.mates-1'])
  ], { cond: ['age<=19'], cd: 104, max: 1, xg: 'social_media', note: 'media', tier: 'minor' }),
  ch('yc_training_fight', Y, 3, ['거친 태클 뒤 {rival}와(과) 몸싸움이 벌어질 뻔했다. 코치들이 달려오고 있다.', '연습경기 중 {rival}과(와) 얼굴을 붉혔다. 선수들이 둘러섰다.'], [
    cc('먼저 사과한다', ['고개를 숙이고 손을 내밀었다. {rival}도 어색하게 손을 잡았다.', 'rel.rival+4 rel.coach+2 morale-1'], { pv: '라이벌 관계↑' }),
    cc('끝까지 맞선다', ['한 걸음도 물러서지 않았다. 분위기가 험악해졌다.', 'rel.rival-6 morale+2 rel.coach-3'], { chk: '45 hid.temper*-0.3 attr.aggression*1', bad: ['선을 넘었다. 코치가 분을 삭이며 훈련에서 제외시켰다.', 'rel.coach-8 rel.captain-3 stress+4'] })
  ], { cond: [], cd: 52, max: 4, xg: 'locker_room', tier: 'minor' }),
  ch('yc_cheat_test', Y, 2, ['체력 테스트에서 동기가 반환점을 슬쩍 앞당겨 도는 것을 보았다. 다른 사람은 못 본 것 같다.', '셔틀런에서 동기가 몰래 구간을 줄였다. 눈이 마주쳤고 그는 시선을 피했다.'], [
    cc('코치에게 말한다', ['정직하게 말했다. 동기는 따가운 눈초리를 보냈지만 코치는 고개를 끄덕였다.', 'rel.coach+3 rel.mates-5'], { pv: '감독 관계↑ 동료 관계↓' }),
    cc('모른 척한다', ['못 본 척하기로 했다. 마음 한켠이 찜찜했다.', 'stress+2']),
    cc('나도 슬쩍 따라 한다', ['한 번 눈을 감자 마음이 흔들렸다. 기록은 좋아졌지만 개운하지 않았다.', 'attr.stamina+0.1 hid.pro-2'], { chk: '55 hid.pro*0.3', bad: ['들켰다. 코치의 실망한 얼굴이 오래 남았다.', 'rel.coach-8 morale-6 hid.pro-2'] })
  ], { cond: [], cd: 104, max: 1, xg: 'integrity', tier: 'minor' }),
  ch('yc_homesick_choice', Y, 3, ['집에 돌아가고 싶다는 생각이 며칠째 이어진다. 숙소 생활은 아직 서툴기만 하다.', '엄마가 해준 밥이 그립다. 숙소 창밖 불빛을 바라보다 눈시울이 붉어졌다.'], [
    cc('부모님과 길게 이야기한다', ['전화기 너머 어머니 목소리에 눈물이 났다. 한결 마음이 가벼워졌다.', 'rel.mother+5 stress-5 happy+2 sharp-3 rel.coach-2'], { pv: '가족 관계↑ 스트레스↓ 경기 감각↓ 감독 관계↓' }),
    cc('이를 악물고 버틴다', ['조금만 더 버티기로 했다. 어느 새 숙소가 집처럼 느껴지기 시작했다.', 'hid.pro+2 morale+3'], { chk: '50 hid.family*-0.2 hid.pro*0.2', bad: ['버티다 지쳐 훈련 중 집중이 흐트러졌다.', 'happy-8 stress+8'] }),
    cc('통학이 가능하도록 부탁한다', ['부모님과 구단이 상의해 고향에서 통학하기로 했다.', 'fx:moveHome rel.coach-2 happy+6'])
  ], { cond: ['dorm', 'age>=14', 'age<=16', 'hid.family>=50'], cd: 100, max: 1, xg: 'dorm_life', tier: 'minor' }),
  ch('yc_captaincy', Y, 2, ['{coach} 감독이 {name}에게 유스팀 주장 완장을 맡아 달라고 했다. 책임이 커지는 자리다.', '라커룸에서 주장 투표가 있었다. 동기들이 {name}의 이름을 적었다고 한다.'], [
    cc('수락한다', ['완장을 팔에 둘렀다. 어깨가 한껏 무거워졌지만 책임감이 자랐다.', 'attr.leadership+0.4 rel.coach+4 stress+3 rel.mates+2'], { chk: '55 attr.leadership*1.5 hid.social*0.15', bad: ['욕심이 앞서 동료들에게 잔소리가 늘었다. 분위기가 어색해졌다.', 'rel.mates-3 stress+5'] }),
    cc('사양한다', ['지금은 경기에만 집중하고 싶다고 했다.', 'stress-2 rel.coach-2 hid.ambition-1'])
  ], { cond: ['rel.coach>=8'], cd: 104, max: 1, xg: 'youth_captain', tier: 'minor' }),
  ch('yc_hide_pain', YP, 3, ['경기 중 근육 어딘가가 당긴다. 중요한 경기다. 말하면 빠져야 할지도 모른다.', '하프타임에 허벅지 뒤쪽이 뻣뻣해졌다. 의무팀에 알릴지 고민 중이다.'], [
    cc('숨기고 계속 뛴다', ['통증을 눌러 두고 끝까지 뛰었다. 팀이 이겼다.', 'morale+3 sharp+3'], { chk: '45 hid.injuryProne*-0.2 health*0.2', bad: ['경기 후 다리가 비명을 질렀다. 진단은 가벼운 근육 파열.', 'fx:inj=hamstring stress+4'] }),
    cc('의무팀에 알린다', ['즉시 교체돼 응급 처치를 받았다. 큰 문제는 아니었다.', 'health+2 rel.coach+1 sharp-3'])
  ], { cond: ['!injured'], cd: 40, max: 5, xg: 'injury_care', note: 'inj_early', tier: 'minor' }),
  ch('yc_youth_nat', YP, 2, ['연령별 대표팀 소집과 구단 중요 대회 일정이 겹쳤다. 어느 쪽에서 뛰어야 할까?', '대표팀 소집 공문과 구단의 대회 일정표가 같은 날짜를 가리킨다.'], [
    cc('대표팀을 선택한다', ['가슴의 엠블럼이 낯설고 자랑스러웠다. 구단 쪽은 아쉬워했다.', 'fameD+1 rel.coach-2 fatigue+5 flag:youth_nat'], { chk: '50 ovr*0.3 fatigue*-0.2 hid.bigGame*0.1', pv: '명성↑ 감독 관계↓', bad: ['소집 훈련에서 컨디션이 떨어져 기회를 살리지 못했다. 구단도 불만이다.', 'fatigue+8 rel.coach-3 morale-3'] }),
    cc('구단 대회에 집중한다', ['소속 팀과 함께하기로 했다. {coach} 감독이 환히 웃었다.', 'rel.coach+3 fameD-0.2'])
  ], { cond: ['age>=15', 'age<=19', 'ovr>=48'], cd: 104, max: 2, xg: 'national', tier: 'minor' }),
  ch('yc_teacher', Y, 3, ['담임 교사가 학업 문제로 면담을 요청했다. 출석 일수가 위태롭다고 한다.', '교무실로 불려 갔다. 선생님은 훈련을 존중하지만 졸업은 별개라고 했다.'], [
    cc('학업 비중을 늘린다', ['공부 시간을 늘렸다. 훈련 후 책상에 앉는 날이 많아졌다.', 'edu+6 sharp-3'], { pv: '학력↑ 경기 감각↓' }),
    cc('훈련을 이유로 양해를 구한다', ['선생님은 한숨을 쉬며 마지못해 넘어갔다. 부모님이 걱정했다.', 'edu-3 rel.mother-2 stress+3']),
    cc('부모님을 통해 조율한다', ['부모님이 학교와 구단을 오가며 일정을 조정했다.', 'rel.father+2 edu+2 stress+1'], { chk: '52 rel.father*0.1 rel.mother*0.1 hid.family*0.1', bad: ['조율이 길어지며 양쪽 모두와 서먹해졌다.', 'edu-2 rel.coach-2 stress+3'] })
  ], { cond: ['age<=17'], cd: 52, max: 3, xg: 'study', note: 'edu', tier: 'minor' }),
  ch('yc_first_love', YP, 3, ['같은 반 친구에게 자꾸 마음이 간다. 훈련 후 길에서 마주칠 때면 심장이 먼저 뛴다.', '친구들이 {name}을(를) 놀렸다. 마음에 두고 있는 사람이 있다는 것이 들통났다.'], [
    cc('용기 내어 고백한다', ['"사실 너를 좋아해." 한참의 침묵 뒤 상대가 웃으며 고개를 끄덕였다.', 'fx:romance happy+5'], { chk: '40 hid.social*0.3 fameD*0.2', bad: ['정중한 거절이었다. 하루 종일 얼굴을 못 들었다.', 'morale-4 stress+2'] }),
    cc('마음속에 접어 둔다', ['지금은 축구가 먼저라고 생각했다. 가슴 한켠이 시큰했다.', 'stress+1 hid.pro+1'])
  ], { cond: ['age>=15', 'age<=18', 'single'], cd: 104, max: 1, xg: 'romance', tier: 'minor' }),
  ch('yc_coach_conflict', Y, 3, ['두 코치가 서로 다른 지시를 내렸다. 한쪽은 직선적인 플레이, 다른 쪽은 점유를 강조한다.', '훈련 중 코치들의 요구가 엇갈렸다. 누구를 따라야 할지 혼란스럽다.'], [
    cc('{coach} 감독의 지시를 따른다', ['감독 말씀을 우선했다. 감독이 만족스러운 표정을 지었다.', 'rel.coach+4 hid.pro-1 morale-2'], { pv: '감독 관계↑ 사기↓' }),
    cc('다른 코치의 방식을 따른다', ['새로운 접근이 신선하게 느껴졌다.', 'attr.vision+0.2 attr.passing+0.15'], { chk: '50 rel.coach*0.1 attr.vision*1', bad: ['{coach} 감독이 눈살을 찌푸렸다. 그 뒤로 훈련이 불편해졌다.', 'rel.coach-6'] }),
    cc('두 분께 직접 물어본다', ['솔직하게 물었더니 두 코치가 쑥스러워하며 방식을 조율해 주었다.', 'attr.vision+0.1 rel.coach+2 stress-1 morale-2'])
  ], { cond: [], cd: 80, max: 2, xg: 'coach_relation', tier: 'minor', again: '지난번 감독과 부딪쳤을 때는 "{prev}" 쪽을 택했다.' }),
  ch('yc_release_scare', Y, 3, ['시즌 말 면담에서 {coach} 감독이 "내년에 한 번 더 지켜보겠다"고 말했다. 완곡하지만 분명한 경고였다.', '구단은 몇몇 유스 선수들의 재계약을 보류했다. 그 안에 {name}의 이름도 있었다.'], [
    cc('이 팀에서 끝까지 증명한다', ['이를 악물고 비시즌 훈련표를 짰다. 가족에게는 말하지 않았다.', 'hid.loyalty+2 hid.pro+2 stress+4 fatigue+4 fu:fu_career@10-26'], { chk: '48 hid.pro*0.3 rel.coach*0.2 fatigue*-0.2', pv: '프로의식↑ 스트레스↑', bad: ['아무리 애써도 결과가 따라오지 않았다. 감독은 말을 아꼈다.', 'stress+6 morale-5 fu:fu_career@10-26'] }),
    cc('다른 팀 테스트를 알아본다', ['에이전트와 지인을 통해 다른 구단 테스트 일정을 잡았다.', 'fx:youthMove=same stress+3 fu:fu_career@10-26'])
  ], { cond: ['age>=15', 'age<=18', 'pot<=62'], cd: 100, max: 1, xg: 'academy_move', note: 'youth_rate', tier: 'major' }),
  ch('yc_final_sub', YP, 2, ['토너먼트 결승 직전, 선발 명단에서 제외됐다. 믿기지 않았다.', '결승 선발 명단에 이름이 없었다. {coach} 감독은 눈을 마주치지 않았다.'], [
    cc('차분히 받아들인다', ['"준비하고 있겠습니다." 벤치에서 누구보다 크게 응원했다.', 'rel.coach+3 hid.pro+1 morale-3 stress+2'], { pv: '감독 관계↑ 사기↓ 스트레스↑' }),
    cc('감독에게 항의한다', ['용기를 내어 이유를 물었다.', 'morale+2 rel.coach-2'], { chk: '30 rel.coach*0.2 hid.temper*-0.15', bad: ['감정이 섞인 말이 오갔다. 분위기가 얼어붙었다.', 'rel.coach-8 morale-5'] })
  ], { cond: ['rel.coach<=20'], cd: 52, max: 3, xg: 'coach_relation', tier: 'minor' }),
  ch('yc_money_parent', Y, 2, ['아버지가 근무 일정을 바꿔 가며 경기장을 찾는 게 형편상 쉽지 않다고 털어놓았다.', '집안 사정이 좋지 않다. 어머니가 "괜찮다"고 말했지만 목소리가 가늘었다.'], [
    cc('모은 용돈을 보낸다', ['얼마 안 되는 돈이지만 마음을 담아 보냈다. 어머니는 말없이 흐느꼈다.', 'cash-10 rel.father+8 rel.mother+8 happy+2'], { pv: '가족 관계↑↑ 현금↓' }),
    cc('"걱정 마세요"라고만 한다', ['더 열심히 해야 한다는 마음만 커졌다.', 'rel.father+2 stress+3 hid.ambition+2'], { chk: '45 hid.family*0.2 rel.father*0.1 hid.social*0.1', bad: ['속마음을 숨겼다는 사실을 부모님이 눈치챘다. 서로 서운함만 쌓였다.', 'rel.father-3 rel.mother-3 stress+4'] })
  ], { cond: ['tier<=2', 'age<=18'], cd: 100, max: 2, xg: 'family_money', tier: 'minor' }),
  ch('yc_bad_game', Y, 4, ['시즌 최악의 경기를 했다. 패스는 끊기고 몸은 늦었다. 경기가 끝나고도 한참 동안 라커룸에 앉아 있었다.', '오늘 경기는 잊고 싶다. 코치가 지켜보고 있었다는 사실이 더 무겁게 다가온다.'], [
    cc('영상을 돌려 복기한다', ['영상을 돌려 보며 실수를 하나하나 짚었다. 아팠지만 남는 게 있었다.', 'attr.positioning+0.2 stress+2 hid.pro+1'], { pv: '성장↑ 스트레스↑' }),
    cc('친구들과 가볍게 푼다', ['동기들과 떡볶이를 먹으며 수다를 떨었다. 마음이 가벼워졌다.', 'stress-6 happy+3 rel.mates+2'], { chk: '50 hid.social*0.2 rel.mates*0.15', bad: ['웃음 뒤에 감정이 올라왔다. 괜한 말다툼이 터졌다.', 'rel.mates-3 stress+3'] }),
    cc('말없이 혼자 있는다', ['이어폰을 끼고 걸었다. 감정이 쉽게 가라앉지 않았다.', 'stress+4 hid.temper+1'])
  ], { cond: ['form<=5.8'], cd: 30, max: 4, xg: 'form_mental', tier: 'minor' }),
  ch('yc_dawn_session', Y, 3, ['{coach} 감독이 {name}에게 새벽 개인 훈련을 제안했다. 더 높은 곳을 노려 보라는 의미 같았다.', '"내일부터 새벽에 나와 볼래?" 감독의 눈빛이 진지했다.'], [
    cc('참여한다', ['새벽 공기 속에서 터치 훈련을 반복했다. 감독의 신뢰가 한 뼘 자랐다.', 'attr.firstTouch+0.2 attr.pace+0.1 fatigue+8 rel.coach+4'], { chk: '55 hid.pro*0.3 fatigue*-0.2', bad: ['몇 번은 좋았지만 결국 지쳐 쓰러졌다.', 'fatigue+14 morale-3 rel.coach+1'] }),
    cc('정중히 사양한다', ['체력 관리가 우선이라고 말했다. 감독은 웃으며 어깨를 두드렸다.', 'rel.coach-1 fatigue-3'])
  ], { cond: ['age<=17', 'rel.coach>=5'], cd: 100, max: 1, xg: 'training_load', tier: 'minor' }),
  ch('yc_big_match_nerves', YP, 3, ['큰 경기를 앞두고 긴장이 몰려온다. 손이 차갑고 심장이 쿵쿵거린다.', '결승전 아침, 식사가 넘어가지 않는다. 시간은 느리게도 빨리도 흐른다.'], [
    cc('호흡을 가다듬는다', ['심호흡을 하며 마음을 가라앉혔다. 휘슬이 울렸을 때는 오히려 차분했다.', 'attr.composure+0.2 sharp+3'], { chk: '50 hid.bigGame*0.35 attr.composure*1', bad: ['긴장은 풀리지 않았다. 킥오프와 함께 발이 무거웠다.', 'morale-3 stress+3'] }),
    cc('동료들과 함께 웃으며 푼다', ['장난을 치고 농담을 나눴다. 긴장이 조금씩 풀렸다.', 'rel.mates+3 stress-3 sharp-2 attr.composure-0.05'])
  ], { cond: [], cd: 40, max: 4, xg: 'form_mental', tier: 'minor' }),
  ch('yc_boarding_rule', Y, 2, ['숙소 사감이 외출 금지 규정을 어긴 동기들을 적발했다. 그중 한 명이 같이 가자고 했다고 증언해 달라고 부탁한다.', '동기가 몰래 외출했다가 걸렸다. 사감이 "너도 알고 있었지?" 하고 묻는다.'], [
    cc('사실대로 말한다', ['정직하게 이야기했다. 동기와 한동안 서먹했지만 사감은 믿어 주었다.', 'rel.mates-4 rel.coach+3 hid.pro+1'], { pv: '프로의식↑ 동료 관계↓' }),
    cc('모른다고 잡아뗀다', ['"저는 몰랐습니다." 사감은 의심스러운 표정이었다.', 'rel.mates+3 stress+3'], { chk: '50 hid.controversy*-0.2', bad: ['거짓말이 드러났다. 코치도 알게 되었다.', 'rel.coach-7 hid.pro-2'] })
  ], { cond: ['dorm', 'age<=18'], cd: 100, max: 1, xg: 'dorm_life', tier: 'minor' }),
  ch('yc_mentor_choice', YP, 2, ['1군 베테랑이 {name}에게 개인적으로 조언을 해 주겠다고 했다. 대신 방식이 꽤 엄격하다.', '선배가 "내 방식대로 따라오면 일 년 안에 달라질 것"이라고 말했다.'], [
    cc('멘토링을 받는다', ['선배의 훈련표를 따랐다. 몸은 힘들었지만 눈이 트이는 기분이었다.', 'attr.positioning+0.25 attr.composure+0.2 fatigue+6 hid.pro+2'], { chk: '55 hid.pro*0.25 hid.social*0.1', bad: ['선배의 방식은 너무 가혹했다. 몸이 지쳐 갔다.', 'fatigue+12 morale-4'] }),
    cc('내 방식대로 간다', ['고마움을 전하며 정중히 사양했다.', 'stress-1 morale-2 rel.coach-1'])
  ], { cond: ['ftTrain', 'age<=19'], cd: 100, max: 1, xg: 'coach_relation', tier: 'minor' }),
  ch('yc_trial_abroad', Y, 2, ['해외 구단 유스 테스트 초청장이 도착했다. 언어도 낯설고 기간도 길지만 가능성은 크다.', '해외의 한 구단이 유소년 입단 테스트를 제안했다. 부모님의 의견이 갈린다.'], [
    cc('도전한다', ['낯선 도시에서 일주일을 보냈다. 구단 관계자의 반응이 좋았다.', 'fx:youthMove=up fameA+1 hid.adapt+2 stress+4 fu:fu_career@10-26'], { chk: '35 ovr*0.4 hid.adapt*0.2', bad: ['테스트는 낙방이었지만 값진 경험이었다. 해외 무대의 속도를 느꼈다.', 'morale-3 hid.adapt+1 fu:fu_career@10-26'] }),
    cc('지금은 때가 아니다', ['더 준비하고 가겠다고 했다. 한동안 아쉬운 마음이 이어졌다.', 'stress-1 hid.ambition-2 fameA-0.2 fu:fu_career@10-26'])
  ], { cond: ['age<=17', 'ovr>=50', 'tier>=2'], cd: 200, max: 1, xg: 'academy_move', tier: 'major' })
];
