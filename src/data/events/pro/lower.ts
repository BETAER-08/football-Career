import type { RawEvent } from '../../schema';
import { cc, ch, pa } from '../helpers';

const YP: ('youth' | 'pro')[] = ['youth', 'pro'];
const P: ('pro')[] = ['pro'];

export const lowerLeague: RawEvent[] = [
  pa('ll_bus_trip', YP, 3, [
    '원정 버스에서 아홉 시간을 보냈다. 창밖은 어느새 어둠이다. 도착해서 짐을 푸는 순간에도 다리가 저렸다.',
    '낡은 구단 버스는 에어컨이 약했고 의자는 좁았다. 경기 전날 밤을 길 위에서 보냈다.',
    '먼 도시까지 하루 종일 도로 위였다. 휴게소 라면을 나눠 먹으며 서로의 어깨를 베고 잠이 들었다.'
  ], 'fatigue+6 sleep-4 rel.mates+2', { cond: ['lvl<=3'], cd: 40, max: 6 }),
  ch('ll_bus_night', YP, 3, [
    '내일 경기가 있는 도시까지 아직 다섯 시간이 남았다. 버스 안은 이미 조용하다. 이 시간을 어떻게 쓸까?',
    '밤샘 이동 중이다. 동료들은 카드판을 벌였고, 코치는 눈을 감았다.'
  ], [
    cc('이어폰을 끼고 잠을 청한다', ['좁은 의자에 몸을 접고 어떻게든 잠들었다. 내릴 때는 한결 가뿐했다.', 'sleep+4 fatigue-2'], {
      chk: '55 sleep*0.2 hid.pro*0.1 fatigue*-0.2', pv: '수면↑ 피로↓ 잠들지 못할 위험',
      bad: ['소음과 흔들림에 한숨도 못 잤다. 눈이 따갑다.', 'sleep-4 fatigue+5 stress+2']
    }),
    cc('동료들과 카드게임을 한다', ['웃음이 터지는 밤이었다. 친구가 한 명 더 생긴 기분이다.', 'rel.mates+4 happy+3 sleep-5 fatigue+4'], { pv: '동료 관계↑ 수면↓' })
  ], { cond: ['lvl<=3'], cd: 60, max: 3, xg: 'travel', tier: 'minor' }),
  ch('ll_second_job', P, 3, [
    '월급만으로는 생활비가 빠듯하다. 지인이 오전 아르바이트 자리를 소개했다. 훈련 전까지 몇 시간이면 끝난다고 한다.',
    '구단 급여가 오르지 않는 사이 월세가 올랐다. 동료 몇은 이미 오전에 다른 일을 하고 있다.'
  ], [
    cc('오전에 아르바이트를 한다', ['새벽같이 일어나 일을 마치고 훈련장으로 달려갔다. 돈은 들어왔지만 몸이 무겁다.', 'cashw+3 fatigue+6 happy+1'], {
      chk: '56 health*0.15 hid.pro*0.2 fatigue*-0.3', pv: '수입↑ 피로↑ 훈련 지장 위험',
      bad: ['일과 훈련을 오가다 몸이 한계에 닿았다. 코치가 눈치를 챘다.', 'fatigue+12 sharp-4 rel.coach-3']
    }),
    cc('축구에만 집중하고 절약한다', ['지출을 줄이고 도시락을 싸 다녔다. 마음은 편했지만 지갑은 가벼웠다.', 'hid.thrift+2 happy-3 stress+3'], { pv: '훈련 집중 생활 스트레스↑' })
  ], { cond: ['lvl<=3', 'wage<=2000'], cd: 80, max: 3, xg: 'side_income', tier: 'minor' }),
  pa('ll_small_crowd', YP, 3, [
    '관중석에 몇백 명뿐이다. 함성 대신 공 차는 소리가 선명하게 울려 퍼졌다.',
    '비 오는 평일 오후 경기. 가족과 서포터 몇 명이 전부인 스탠드에서 이름을 불러 주는 목소리가 또렷이 들렸다.',
    '텅 빈 스탠드를 바라보며 몸을 풀었다. 언젠가 이곳이 가득 차는 날을 상상했다.'
  ], 'morale-2 sharp-1 rel.fans+1', { cond: ['lvl<=3'], cd: 40, max: 6 }),
  ch('ll_club_finance', P, 3, [
    '구단 재정이 흔들린다는 소문이 돈다. 스폰서가 빠졌고, 사무국 직원들이 두 달째 월급을 받지 못했다고 한다.',
    '구단주가 선수단 앞에서 "잠시만 기다려 달라"고 말했다. 라커룸 분위기가 무겁다.'
  ], [
    cc('임금 분할 수령에 동의하며 구단과 협상한다', ['선수단 대표들과 함께 구단과 마주 앉았다. 완전한 해결은 아니지만 일정을 약속받았다.', 'rel.director+3 hid.loyalty+2 stress+3'], {
      chk: '52 rel.director*0.15 hid.social*0.1 hid.loyalty*0.1', pv: '구단 관계↑ 불안 지속',
      bad: ['협상은 길어졌고 약속은 모호했다. 불안만 커졌다.', 'stress+6 cashw-1 rel.director-3']
    }),
    cc('다른 구단 이적을 알아본다', ['에이전트와 지인을 통해 다른 구단의 의향을 물었다. 팬들의 시선은 곱지 않았다.', 'fx:offers=many rel.coach-4 rel.fans-3 stress+3'], { pv: '이적 제안↑ 팬 관계↓' })
  ], { cond: ['lvl<=3', 'hasClub'], cd: 100, max: 2, xg: 'club_trouble', tier: 'minor' }),
  pa('ll_wage_delay', P, 3, [
    '이번 달 급여가 열흘 늦게 들어왔다. 구단은 "행정 착오"라고 했지만 모두가 웃지 않았다.',
    '통장에 숫자가 찍히지 않은 채 월말이 지나갔다. 대신 감독이 "조금만 더 참아 달라"는 말을 반복했다.'
  ], 'stress+4 happy-3', { cond: ['lvl<=3', 'hasClub'], cd: 60, max: 3 }),
  ch('ll_scout_visit', YP, 3, [
    '오늘 관중석에 낯선 정장 차림 몇 명이 앉아 있다. 상위 리그 구단 스카우트라는 소문이 락커룸에 퍼졌다.',
    '경기 직전 코치가 귓속말로 알려 줬다. "오늘 위에서 사람들이 왔다. 신경 쓰지 마라."'
  ], [
    cc('평소처럼 최선을 다한다', ['긴장을 눌러 두고 하던 대로 뛰었다. 스카우트들이 수첩에 무언가를 적었다.', 'fameD+1 val+8 fx:offers=up'], {
      chk: '48 ovr*0.3 form*0.3 hid.bigGame*0.15', pv: '명성↑ 이적 제안↑ 부담 위험',
      great: ['그날 경기의 주인공은 단연 {name}이었다. 경기 후 에이전트의 전화가 쉬지 않았다.', 'fameD+2 val+15 fx:offers=up'],
      bad: ['부담이 몸을 굳게 했다. 평소답지 않은 경기였다.', 'morale-5 stress+4']
    }),
    cc('눈에 띄려고 개인 플레이를 시도한다', ['공을 놓치지 않고 홀로 돌파를 시도했다. 관중석에서 탄성과 한숨이 함께 나왔다.', 'fameD+1.5 val+10'], {
      chk: '32 hid.bigGame*0.2 attr.dribbling*1 attr.composure*0.8', pv: '명성↑↑ 동료 관계 위험',
      bad: ['무리한 플레이가 팀 흐름을 끊었다. 감독도 동료도 불만이다.', 'rel.coach-6 rel.mates-4 morale-4'],
      worst: ['거친 태클을 피하다 발목을 접질렸다.', 'fx:inj=ankle rel.coach-8']
    })
  ], { cond: ['lvl<=3', 'ovr>=38'], cd: 80, max: 3, xg: 'scout_attention', tier: 'minor' }),
  pa('ll_scout_rumor', YP, 3, [
    '경기장에 상위 리그 스카우트가 다녀갔다는 소문이 돌았다. 누구를 보러 왔는지는 아무도 모른다. 모두가 괜히 한 번 더 뛰었다.',
    '운동장 펜스 뒤에서 낯선 사람이 영상을 찍고 있었다. 팀원들 사이에서 며칠간 화제였다.'
  ], 'morale+3 fameD+0.4', { cond: ['lvl<=3'], cd: 40, max: 5 }),
  pa('ll_pitch', YP, 3, [
    '울퉁불퉁한 인조잔디 위에서 뛰었다. 공이 어디로 튈지 알 수 없다. 무릎이 먼저 반응했다.',
    '비가 오면 웅덩이가 생기는 홈구장이다. 터치가 길어질 때마다 발목에 신경이 곤두선다.'
  ], 'fatigue+3 attr.balance+0.05', { cond: ['lvl<=3'], cd: 52, max: 4 }),
  pa('ll_kit', YP, 2, [
    '구단이 새 유니폼 대신 지난 시즌 것을 그대로 쓰라고 했다. 이름표만 다시 붙였다. 불평하는 사람은 없었다.',
    '훈련복 사이즈가 맞지 않아 자비로 새로 샀다. 구단은 사정이 어렵다는 말만 되풀이했다.'
  ], 'hid.thrift+1 happy-1', { cond: ['lvl<=3'], cd: 60, max: 3 })
];
