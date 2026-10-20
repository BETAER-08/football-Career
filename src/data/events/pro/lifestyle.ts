import type { RawEvent } from '../../schema';
import { cc, ch, pa, HELP_ADDICT } from '../helpers';

const YP: ('youth' | 'pro')[] = ['youth', 'pro'];
const P: ('pro')[] = ['pro'];

export const lifestyleEvents: RawEvent[] = [
  ch('pc_smoke_offer', YP, 2, ['스트레스가 쌓인 밤, 동료가 담배를 권했다. "한 대만 피워 봐, 머리가 맑아져."', '경기 후 뒷문 근처에서 몇몇 동료가 담배를 피우고 있었다. 한 개비를 내민다.'], [
    cc('한 대 피워 본다', ['매캐한 연기가 폐 속으로 들어왔다. 순간의 안정감이 오히려 불안했다.', 'stress-3 fx:lifestyle=smoke hid.pro-1 rel.mates+1'], { chk: '45 hid.pro*0.3', bad: ['한 번이 두 번이 되고 습관이 되어 가고 있다.', 'stress-3 fx:lifestyle=smoke hid.pro-2 health-2'] }),
    cc('거절한다', ['"난 괜찮아." 몸에 해로운 건 하지 않기로 했다.', 'hid.pro+1 rel.mates-1'])
  ], { cond: ['age>=18', '!smoker', 'hid.pro<=65', 'stress>=45'], cd: 200, max: 1, xg: 'smoking', note: 'smoking', tier: 'minor' }),
  ch('pc_drink_habit', P, 3, ['저녁마다 한두 잔이 어느새 습관이 되었다. 몸이 보내는 신호가 하나둘 늘었다.', '경기 후 술자리가 잦아졌다. 아침 컨디션이 갈수록 나빠진다.'], [
    cc('스스로 줄이기로 한다', ['주 중 금주를 선언했다. 첫 주가 가장 길었다.', 'drink-12 sleep+5 hid.pro+1 stress+2'], { chk: '48 hid.pro*0.3 drink*-0.2', bad: ['며칠 버티지 못하고 다시 손이 갔다.', 'drink+2 morale-3'] }),
    cc('전문가의 도움을 받는다', ['상담과 치료 프로그램이 시작됐다.', 'drink-20 stress-4 cashw-1 happy+2'], { pv: '건강↑' }),
    cc('그대로 지낸다', ['"이 정도는 괜찮아." 스스로를 달랬다.', 'drink+4 health-2 fatigue+3'])
  ], { cond: ['drink>=40'], cd: 100, max: 4, xg: 'nightlife', note: 'alcohol', heavy: true, help: HELP_ADDICT, tier: 'minor' }),
  ch('pc_sleep_clinic', P, 3, ['잠을 설친 지 오래다. 팀 닥터가 수면 클리닉 상담을 권했다.', '밤마다 뒤척이다 새벽이 온다. 훈련 때 몸이 무겁다.'], [
    cc('수면 클리닉에서 상담한다', ['수면 위생과 호흡법을 배웠다. 몇 주 뒤 단잠이 돌아왔다.', 'sleep+14 stress-4 cashw-2'], { pv: '수면↑' }),
    cc('수면제에 의존한다', ['잠은 오지만 아침은 몽롱했다.', 'sleep+4 fatigue+4 hid.pro-1'], { chk: '48 hid.pro*0.2', bad: ['약에 대한 의존이 걱정되기 시작했다.', 'sleep-2 stress+4'] })
  ], { cond: ['sleep<=40'], cd: 80, max: 4, xg: 'injury_care', note: 'sleep', tier: 'minor' }),
  pa('pc_quit_smoke', P, 2, ['담배를 끊은 지 몇 주. 아침에 계단을 오를 때 숨이 한결 가벼웠다.', '금연이 이어지면서 훈련 후 회복이 눈에 띄게 빨라졌다.'], 'health+3 attr.stamina+0.1', { cond: ['!smoker', 'flag:quit_smoke'], cd: 40, max: 3 }),
  ch('yc_smoke_peer', YP, 2, ['동기들이 숙소 뒤편에서 몰래 담배를 피우고 있었다. 함께 가자고 눈짓한다.', '선배 몇몇이 담배를 권하며 "한번쯤은 괜찮다"고 웃었다.'], [
    cc('거절한다', ['"난 안 해." 어색했지만 마음은 편했다.', 'hid.pro+1 rel.mates-1'], { pv: '프로의식↑' }),
    cc('분위기에 휩쓸려 한 모금 피운다', ['기침이 났다. 몸이 먼저 거부했다.', 'rel.mates+3 health-1 hid.pro-1 fx:lifestyle=smoke'], { chk: '55 hid.pro*0.3', bad: ['한 번이 습관이 되었다. 아침 달리기에서 숨이 찼다.', 'hid.pro-2 attr.stamina-0.1 fx:lifestyle=smoke'] })
  ], { cond: ['age>=15', 'age<=18', '!smoker'], cd: 200, max: 1, xg: 'smoking', note: 'smoking', tier: 'minor' })
];
