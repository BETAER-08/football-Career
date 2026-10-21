import type { RawEvent } from '../../schema';
import { cc, ch } from '../helpers';

const YP: ('youth' | 'pro')[] = ['youth', 'pro'];
const P: ('pro')[] = ['pro'];
const PC: ('pro' | 'coach' | 'postcareer')[] = ['pro', 'coach', 'postcareer'];

export const faceEvents: RawEvent[] = [
  ch('fc_reunion_opp', P, 3, [
    '다음 상대 팀 명단에 {oldmate}의 이름이 있다. 유스 시절 같은 방을 쓰던 친구가 이제는 적으로 마주 선다.',
    '경기 전 터널에서 {oldmate:과} 눈이 마주쳤다. 둘 다 웃었지만 오늘만큼은 봐주지 않기로 했다.'
  ], [
    cc('경기 전에 먼저 다가가 인사한다', ['어색함은 금세 녹았다. 경기 후 저녁을 먹기로 약속했다.', 'rel.mates+3 happy+3 sharp-2'], {
      chk: '55 hid.social*0.2 hid.pro*0.1 morale*0.1', pv: '추억 사기↑ 집중 위험',
      bad: ['수다가 길어져 경기 준비에 집중하지 못했다. 감독의 시선이 곱지 않다.', 'rel.coach-3 morale-3 sharp-3']
    }),
    cc('끝까지 모른 척하고 경기에 집중한다', ['눈길을 피한 채 경기에만 몰두했다. 이긴 뒤에도 마음 한구석이 허전했다.', 'sharp+2 happy-2 rel.mates-2'], { pv: '집중↑ 관계↓' })
  ], { cond: ['faceInLeague'], cd: 100, max: 2, xg: 'old_faces', tier: 'minor' }),
  ch('fc_wedding_invite', PC, 3, [
    '유스 시절의 동기 {oldmate}에게서 청첩장이 도착했다. 날짜가 마침 중요한 일정과 겹친다.',
    '"너만은 꼭 와야 해." {oldmate}의 결혼식 초대 전화였다. 오랜 친구들이 모두 모이는 자리다.'
  ], [
    cc('일정을 조정해 결혼식에 참석한다', ['오랜 친구들과 사진을 찍고 밤늦게까지 웃었다. 돌아오는 길에 마음이 따뜻했다.', 'rel.mates+4 happy+6 fatigue+4'], {
      chk: '55 hid.family*0.1 health*0.15 fatigue*-0.2', pv: '우정↑ 행복↑ 피로↑',
      bad: ['장거리 이동 끝에 컨디션이 무너졌다. 결혼식도, 다음 훈련도 엉망이었다.', 'fatigue+10 rel.coach-2 stress+3']
    }),
    cc('축전과 선물만 보낸다', ['아쉬운 마음을 담아 선물을 보냈다. 친구는 이해한다고 했지만 목소리가 서운했다.', 'rel.mates-3 happy-2 cashw-1'], { pv: '일정 보호 우정↓ 비용' })
  ], { cond: ['faceWedding'], cd: 120, max: 1, xg: 'old_faces', tier: 'minor' }),
  ch('fc_mate_coach', PC, 3, [
    '은퇴한 옛 동료 {oldmate:이} 지도자가 되었다며 연락을 해 왔다. "내 팀에 와서 얘기 좀 들려줄래?"',
    '뜻밖의 전화였다. 같은 라커룸을 쓰던 {oldmate:이} 이제는 코치 명찰을 달고 있다고 한다.'
  ], [
    cc('훈련장을 찾아가 후배들에게 조언한다', ['낯선 풍경이었지만 옛 동료와 나란히 서 있는 느낌이 묘했다. 후배들이 질문을 쏟아냈다.', 'rel.mates+5 happy+4 hid.social+1 fatigue+3'], {
      chk: '55 hid.social*0.2 attr.leadership*1', pv: '우정↑ 지도자 인맥',
      bad: ['얘기가 길어졌고 후배들의 반응은 시큰둥했다. 괜히 체면만 구겼다.', 'happy-2 stress+3']
    }),
    cc('바쁘다며 정중히 다음을 기약한다', ['"다음에 꼭." 전화를 끊고 한참 창밖을 바라봤다.', 'rel.mates-3 stress+2'], { pv: '일정 보호 우정↓' })
  ], { cond: ['faceCoach'], cd: 120, max: 1, xg: 'old_faces', tier: 'minor' }),
  ch('fc_rival_injury', YP, 3, [
    '라이벌 {oldrival:이} 큰 부상을 당했다는 소식이 들렸다. 같은 포지션을 놓고 다투던 사이였다.',
    '{oldrival}의 부상 기사를 보았다. 한동안 연락이 끊겼지만 마음 한구석이 복잡하다.'
  ], [
    cc('먼저 메시지를 보내 쾌유를 빈다', ['짧은 메시지에 곧 답장이 왔다. 오랜만에 경쟁이 아닌 이야기를 나눴다.', 'rel.rival+8 happy+2'], {
      chk: '50 hid.social*0.2 hid.pro*0.1', pv: '관계↑ 품격',
      bad: ['답이 오지 않았다. 괜히 보냈나 싶은 생각이 한동안 남았다.', 'happy-2 stress+2']
    }),
    cc('반응하지 않고 내 훈련에 집중한다', ['감정을 접고 훈련에 몰두했다. 이상하게 공이 무겁게 느껴졌다.', 'sharp+2 happy-2 rel.rival-2'], { pv: '집중↑ 마음 무거움' })
  ], { cond: ['rivalInjured'], cd: 100, max: 1, xg: 'old_faces', tier: 'minor' }),
  ch('fc_rival_team', P, 3, [
    '뜻밖의 소식이다. 라이벌 {oldrival:이} 같은 팀으로 이적해 왔다. 라커룸에서 마주친 첫 눈빛이 날카로웠다.',
    '{oldrival:이} 우리 클럽 유니폼을 입고 훈련장에 나타났다. 이제는 같은 편이면서 같은 자리를 노리는 사이다.'
  ], [
    cc('손을 내밀고 같은 팀으로서 시작한다', ['어색한 악수 뒤에 훈련이 이어졌다. 서로 이를 악물고 뛰었다.', 'rel.rival+8 morale+3 sharp+2'], {
      chk: '52 hid.social*0.15 hid.pro*0.15 rel.coach*0.1', pv: '관계↑ 경쟁 자극',
      bad: ['손을 잡았지만 훈련 내내 신경전이 이어졌다. 감독이 둘 사이를 지켜본다.', 'rel.rival-3 stress+4 rel.coach-2']
    }),
    cc('거리를 두고 실력으로만 대답한다', ['말을 섞지 않았다. 훈련에서만 서로를 뛰어넘으려 했다.', 'sharp+3 stress+3 rel.rival-3'], { pv: '경쟁 자극 스트레스↑' })
  ], { cond: ['rivalSameTeam'], cd: 100, max: 1, xg: 'old_faces', tier: 'minor' }),
  ch('fc_youthcoach_retire', YP, 3, [
    '유스 시절 {youthcoach} 감독이 은퇴한다는 소식을 들었다. 첫 공을 제대로 차 보게 해 준 분이다.',
    '{youthcoach} 감독의 은퇴 기사를 읽었다. 훈련장 모퉁이에서 건네던 조언들이 한꺼번에 떠올랐다.'
  ], [
    cc('은퇴식에 직접 찾아가 감사 인사를 전한다', ['낡은 훈련장에서 옛 제자들이 모였다. 감독은 말없이 어깨를 두드렸다.', 'happy+6 hid.loyalty+2 fatigue+4 rel.mates+2'], {
      chk: '55 hid.family*0.1 health*0.15 fatigue*-0.2', pv: '행복↑ 의리↑ 피로↑',
      bad: ['이동 중 일정이 꼬여 식이 끝난 뒤에야 도착했다. 인사도 제대로 못 했다.', 'happy-3 stress+4']
    }),
    cc('편지와 선물만 보낸다', ['마음을 담아 편지를 썼다. 답장은 짧았지만 따뜻했다.', 'happy+1 hid.loyalty-1 stress+1'], { pv: '일정 보호 아쉬움' })
  ], { cond: ['youthCoachRetire'], cd: 200, max: 1, xg: 'old_faces', tier: 'minor' })
];
