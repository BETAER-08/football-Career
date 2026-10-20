import type { RawEvent } from '../schema';
import { pa } from './helpers';

const YP: ('youth' | 'pro')[] = ['youth', 'pro'];
const P: ('pro')[] = ['pro'];
const C: ('coach')[] = ['coach'];
const PC: ('postcareer')[] = ['postcareer'];

const fu = { sched: true, cd: 0, max: 99 };

export const followups: RawEvent[] = [
  pa('fu_career', YP, 1, [
    '시간이 지나서야 그때의 선택이 길을 열어 주었다는 걸 알게 됐다. 돌아보면 이 시기가 커리어의 방향을 정한 때였다.',
    '그때 내린 결정이 서서히 결실을 맺는다. 낯설던 환경도 이제는 익숙하다.'
  ], 'morale+3 hid.ambition+1', { ...fu, textBad: [
    '그때의 선택은 쉽지 않은 후폭풍으로 돌아왔다. 한동안 마음이 무거웠지만 배운 것도 있다.',
    '돌이켜 보면 다른 길이 더 나았을지도 모른다. 하지만 되돌릴 수는 없다.'
  ], fxBad: 'morale-3 stress+3' }),
  pa('fu_club', P, 1, [
    '구단과의 관계에서 그때의 선택이 좋은 방향으로 이어졌다. 코칭스태프가 달라진 시선으로 대한다.',
    '계약과 역할을 두고 내린 결정이 무난하게 자리를 잡았다. 마음이 한결 편하다.'
  ], 'morale+3 rel.coach+2', { ...fu, textBad: [
    '그때의 선택 이후 구단과의 공기가 서먹해졌다. 라커룸에서도 미묘한 시선이 느껴진다.',
    '결정의 여파가 뒤늦게 돌아왔다. 감독과의 대화가 눈에 띄게 줄었다.'
  ], fxBad: 'morale-3 rel.coach-3 stress+2' }),
  pa('fu_money', P, 1, [
    '그때 계약한 조건이 시간이 지나며 제 값을 하기 시작했다. 통장이 조금씩 두둑해졌다.',
    '돈과 관련된 결정이 의외로 깔끔하게 마무리됐다. 마음의 짐이 덜어졌다.'
  ], 'happy+2 cashw+2', { ...fu, textBad: [
    '그때의 계약에서 놓친 부분이 뒤늦게 문제가 됐다. 정리하는 데 시간과 돈이 들었다.',
    '결정의 대가가 뒤늦게 청구서로 돌아왔다. 다음엔 더 꼼꼼히 보기로 했다.'
  ], fxBad: 'stress+3 cashw-2' }),
  pa('fu_coach', C, 1, [
    '그때의 결단이 팀에 서서히 스며들었다. 선수들도 달라진 분위기를 느낀다.',
    '구단 수뇌부가 그때의 대응을 다시 언급했다. 평가는 나쁘지 않았다.'
  ], 'standing+2 coachFame+0.3', { ...fu, textBad: [
    '그때의 선택은 라커룸과 구단에 앙금을 남겼다. 아직도 그 이야기가 가끔 오간다.',
    '결정의 여파로 구단 내 입지가 흔들렸다. 만회할 기회를 찾아야 한다.'
  ], fxBad: 'standing-3 stress+3' }),
  pa('fu_post', PC, 1, [
    '그때의 선택이 새로운 일상의 든든한 바탕이 됐다. 주변 사람들도 달라진 모습을 알아본다.',
    '시간이 지나자 그때의 결정이 옳았다는 확신이 든다.'
  ], 'happy+3 postRep+0.3', { ...fu, textBad: [
    '그때의 선택은 생각보다 많은 수고를 요구했다. 후회와 보람이 섞여 있다.',
    '결정의 여파가 이어지며 한동안 마음고생을 했다.'
  ], fxBad: 'stress+3 postRep-0.3' })
];
