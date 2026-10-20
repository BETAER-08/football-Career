import type { RawEvent } from '../../schema';
import { pa } from '../helpers';

const YP: ('youth' | 'pro')[] = ['youth', 'pro'];
const P: ('pro')[] = ['pro'];

export const flavorEvents: RawEvent[] = [
  pa('pl_snack', YP, 2, ['훈련 후 숙소 복도에 치킨 냄새가 퍼졌다. 한 조각만 먹겠다던 다짐은 오래가지 않았다.', '야식 주문을 말리던 {captain}도 결국 한 입 거들었다.'], 'diet-2 rel.mates+2 happy+2', { cond: [], cd: 40, max: 4 }),
  pa('pl_gaming', YP, 2, ['{mate1}이(가) 밤새 게임을 하자며 방문을 두드렸다. 이튿날 훈련장에서 모두가 하품을 했다.', '새벽까지 이어진 게임 소리에 복도 불이 켜졌다.'], 'sleep-3 rel.mates+2 happy+2', { cond: [], cd: 40, max: 4 }),
  pa('pl_holiday_card', P, 2, ['휴가 중인 동료들이 보낸 엽서가 라커룸 게시판에 줄줄이 붙었다. 어느 해변인지 맞히는 내기가 벌어졌다.', '쉬는 날 받은 휴양지 사진에 괜히 마음이 느긋해졌다.'], 'happy+2', { cond: ['offseason'], cd: 40, max: 4 }),
  pa('pl_late_night', P, 2, ['늦은 밤 호텔 로비에서 팀 동료들과 수다를 떨었다. 내일 경기를 잊은 듯 웃었다.', '원정 전날 밤, 룸서비스로 시킨 라면 한 그릇이 의외로 큰 위로가 됐다.'], 'rel.mates+2 happy+2 sleep-2', { cond: [], cd: 40, max: 4 }),
  pa('pl_party_afterglow', P, 2, ['우승 파티의 사진이 구단 계정에 올라왔다. 샴페인에 젖은 얼굴이 모두 웃고 있었다.', '파티 다음 날 라커룸에는 쉰 목소리가 가득했다.'], 'happy+3 rel.mates+2', { cond: ['form>=6.8'], cd: 40, max: 4 }),
  pa('pl_camp_story', P, 2, ['비시즌 캠프에서 있었던 일을 동료들이 돌아가며 이야기했다. 새벽 러닝에서 길을 잃은 {mate2}의 이야기가 제일 인기였다.', '캠프 사진이 구단 계정에 올라오자 팬들의 응원이 쏟아졌다.'], 'happy+2 rel.fans+1', { cond: ['preseason'], cd: 40, max: 4 })
];
