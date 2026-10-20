import type { RawEvent } from '../../schema';
import { cc, mo } from '../helpers';

const YP: ('youth' | 'pro')[] = ['youth', 'pro'];
const P: ('pro')[] = ['pro'];
const D: ('youth' | 'pro')[] = ['youth', 'pro'];

export const moments: RawEvent[] = [
  mo('m_debut_att', 'debut', D, ['프로 데뷔전. 후반 교체 투입 직후 단독 돌파 기회가 왔다. 골키퍼와 1대1이다. 모든 시선이 {name}에게 쏠렸다.', '떨리는 데뷔전. 수비 뒤 공간으로 침투 패스가 정확히 떨어졌다. 골문 앞에는 골키퍼뿐이다.'], [
    cc('직접 슈팅한다', ['호흡을 가다듬고 오른발을 힘껏 휘둘렀다.', 'rating+0.2'], { chk: '48 attr.finishing*3 attr.composure*2 hid.bigGame*0.15', great: ['공이 골망을 흔들었다! 데뷔전 데뷔골이다. 경기장이 터져 나갈 듯 환호했다.', 'goal+1 rating+1.1 fameD+1 morale+8'], bad: ['슛은 골키퍼 정면으로 향했다. 아쉬움이 컸다.', 'rating-0.3 morale-3'], worst: ['긴장한 발끝이 공을 헛맞혔다. 관중석에서 탄식이 터졌다.', 'rating-0.8 morale-7'] }),
    cc('동료에게 패스한다', ['한 박자 늦게 옆으로 밀어 주었다. 동료가 침착하게 마무리했다.', 'assist+1 rating+0.6 rel.mates+3'], { chk: '65 attr.vision*2 attr.passing*1 hid.bigGame*0.1', bad: ['패스가 수비에 차단됐다. 기회가 사라졌다.', 'rating-0.3'] }),
    cc('칩슛으로 골키퍼를 넘긴다', ['공을 살짝 띄웠다. 골키퍼 머리 위로 포물선이 그려졌다.', 'rating+0.2'], { chk: '36 attr.finishing*2 attr.composure*2.5 hid.bigGame*0.2', great: ['공이 골대 안으로 사뿐히 떨어졌다. 짜릿한 데뷔골!', 'goal+1 rating+1.2 fameD+1.2 morale+9'], bad: ['공이 골대를 넘어갔다. 하늘만 쳐다봤다.', 'rating-0.4 morale-4'] })
  ], { cond: ['pos:ST|LW|RW|AM'], max: 5 }),
  mo('m_debut_mid', 'debut', D, ['프로 데뷔전. 중원에서 공을 잡았다. 앞에는 수비 한 명, 측면에는 동료가 열려 있다. 빠르게 판단해야 한다.', '교체로 투입되자마자 공이 {name}에게 흘러왔다. 경기 템포가 아마추어와는 다르다.'], [
    cc('날카로운 전진 패스를 시도한다', ['수비 사이를 가르는 패스를 시도했다.', 'rating+0.2'], { chk: '48 attr.vision*2.5 attr.passing*2 hid.bigGame*0.1', great: ['패스가 수비 사이를 가르고 동료에게 정확히 연결됐다. 슈팅까지 이어진 어시스트!', 'assist+1 rating+1 morale+7 fameD+0.6'], bad: ['패스가 길었다. 상대의 역습이 시작됐다.', 'rating-0.4 morale-3'] }),
    cc('안전하게 횡패스로 연결한다', ['안정적인 패스로 경기 템포를 조절했다.', 'rating+0.3 morale+2'], { chk: '75 attr.passing*1.5 attr.composure*1', bad: ['사소한 패스 미스로 공을 빼앗겼다.', 'rating-0.2'] }),
    cc('드리블로 직접 전진한다', ['몸을 틀어 수비를 제치고 공간을 만들었다.', 'rating+0.2'], { chk: '40 attr.dribbling*2.5 attr.agility*1 attr.balance*1', bad: ['드리블이 막혀 공을 빼앗겼다.', 'rating-0.4'] })
  ], { cond: ['pos:CM|DM|LB|RB'], max: 5 }),
  mo('m_debut_def', 'debut', D, ['프로 데뷔전. 상대 에이스가 {name}에게 돌진한다. 한 번의 판단이 실점으로 이어질 수 있다.', '교체 투입되자마자 상대의 빠른 역습이 시작됐다. 최종 수비 라인에 {name}밖에 없다.'], [
    cc('몸을 던져 태클한다', ['타이밍을 재고 발을 뻗었다.', 'rating+0.2'], { chk: '45 attr.tackling*3 attr.positioning*1.5 hid.bigGame*0.1', great: ['정확한 태클로 공을 걷어내고 역습을 끊었다. 관중석이 박수를 보냈다.', 'rating+1 morale+7 fameD+0.4'], bad: ['타이밍이 늦었다. 반칙으로 경고를 받았다.', 'rating-0.5 morale-3'] }),
    cc('거리를 두고 지연시킨다', ['섣불리 태클하지 않고 동료들이 돌아올 시간을 벌었다.', 'rating+0.4'], { chk: '65 attr.positioning*2 attr.concentration*1', bad: ['지연 과정에서 슈팅 기회를 내줬다.', 'rating-0.2'] })
  ], { cond: ['pos:CB'], max: 5 }),
  mo('m_debut_gk', 'debut', D, ['프로 데뷔전. 교체로 장갑을 끼자마자 상대 에이스의 날카로운 슈팅이 날아왔다. 골문 앞의 {name}에게 모든 시선이 쏠렸다.', '떨리는 데뷔전. 상대가 문전에서 단독 찬스를 잡았다. 골키퍼 {name}이(가) 나서야 한다.'], [
    cc('각을 좁히며 몸을 던진다', ['타이밍을 재고 앞으로 나와 몸을 날렸다.', 'rating+0.2'], { chk: '48 attr.oneOnOne*3 attr.reflexes*2 hid.bigGame*0.15', great: ['공을 정확히 걷어냈다. 데뷔전 슈퍼세이브에 관중석이 박수를 보냈다.', 'rating+1.1 morale+8 fameD+0.5'], bad: ['타이밍이 늦었다. 공이 골망을 흔들었다.', 'rating-0.5 morale-4'] }),
    cc('제자리를 지키며 반응한다', ['침착하게 슈팅 방향을 읽었다.', 'rating+0.3'], { chk: '55 attr.reflexes*2.5 attr.concentration*1', bad: ['공은 손끝을 스치고 골대 안으로 들어갔다.', 'rating-0.3'] })
  ], { cond: ['pos:GK'], max: 5 }),
  mo('m_derby_a', 'derby', P, ['지역 더비. 팽팽한 0-0 상황, 경기장 분위기는 터질 듯하다. 후반 막판 역습 기회에서 공이 {name}에게 흘렀다.', '더비 매치 후반 추가시간. 상대 문전 앞에서 공이 {name}의 발끝에 닿았다.'], [
    cc('과감한 슈팅을 한다', ['모든 것을 걸고 슈팅했다.', 'rating+0.1'], { chk: '40 attr.shooting*2 attr.composure*2 hid.bigGame*0.25', great: ['공이 골망을 갈랐다! 더비의 영웅이 탄생했다. 경기장이 흔들렸다.', 'goal+1 rating+1.3 fameD+2 rel.fans+10 morale+10'], bad: ['슛이 막혔다. 더비의 아쉬움이 오래갔다.', 'rating-0.3 morale-4'] }),
    cc('안정적인 패스로 기회를 이어 간다', ['동료에게 연결하며 공격 흐름을 이었다.', 'rating+0.3'], { chk: '65 attr.passing*1.5 attr.vision*1', great: ['동료가 마무리해 어시스트가 기록됐다.', 'assist+1 rating+0.8 rel.mates+3'] })
  ], { cond: ['pos:ST|LW|RW|AM|CM'], max: 8 }),
  mo('m_derby_b', 'derby', P, ['더비 매치. 상대 팬들의 야유가 거세다. 이런 분위기에서 한 번의 터치가 승패를 가를 수 있다.', '더비전의 열기가 최고조에 달했다. 상대 에이스를 막아 세워야 하는 순간이 다가왔다.'], [
    cc('몸싸움을 걸어 흐름을 끊는다', ['적극적인 몸싸움으로 상대의 템포를 흔들었다.', 'rating+0.2'], { chk: '45 attr.aggression*1.5 attr.strength*1.5 attr.tackling*1.5', great: ['과감한 압박으로 공을 빼앗아 팀 공격의 기점이 됐다.', 'rating+0.9 rel.fans+4 morale+5'], bad: ['과한 반칙으로 경고를 받았다.', 'rating-0.4 rel.coach-1'] }),
    cc('침착하게 자리를 지킨다', ['규율을 지키며 수비 블록을 유지했다.', 'rating+0.3 rel.coach+1 morale-1 fameD-0.1'])
  ], { cond: ['pos:CB|DM|LB|RB'], max: 8 }),
  mo('m_final_att', 'final', P, ['결승전. 한 점 차 승부, 경기 종료 직전 상대 문전에서 기회가 왔다. 마지막 장면이 될지도 모른다.', '결승 연장 후반. 상대 골키퍼와 단둘이 마주했다. 숨소리조차 들리지 않는다.'], [
    cc('강하게 마무리한다', ['모든 힘을 오른발에 실었다.', 'rating+0.1'], { chk: '42 attr.finishing*2.5 attr.composure*2 hid.bigGame*0.35', great: ['공이 그물을 흔들었다! 결승골. 모든 순간이 슬로모션처럼 흘렀다.', 'goal+1 rating+1.4 fameD+3 rel.fans+10 morale+12'], bad: ['슛이 골대를 비껴갔다. 고개를 떨궜다.', 'rating-0.4 morale-6 stress+4'] }),
    cc('동료에게 연결한다', ['더 좋은 위치의 동료에게 정확히 패스했다.', 'rating+0.3'], { chk: '62 attr.vision*2 attr.passing*1.5 hid.bigGame*0.1', great: ['동료가 결승골을 넣었다. 환호 속에서 서로를 끌어안았다.', 'assist+1 rating+0.9 rel.mates+4'] })
  ], { cond: ['pos:ST|LW|RW|AM|CM'], max: 8 }),
  mo('m_final_def', 'final', P, ['결승전. 경기 막판 상대가 마지막 총공세에 나섰다. 크로스가 박스 안으로 날아든다. {name}이(가) 책임져야 한다.', '결승 종료 직전, 상대의 코너킥. 한 번의 실수가 모든 것을 날릴 수 있다.'], [
    cc('몸을 던져 헤더로 걷어낸다', ['높이 뛰어올라 머리로 공을 걷어냈다.', 'rating+0.2'], { chk: '45 attr.heading*2.5 attr.jumping*1.5 attr.positioning*1.5 hid.bigGame*0.2', great: ['결정적 클리어링으로 실점 위기를 막아 냈다. 승리가 확정됐다.', 'rating+1.2 fameD+1.5 rel.fans+6 morale+9'], bad: ['공을 놓치고 말았다. 상대의 슈팅이 이어졌다.', 'rating-0.6 morale-6'] }),
    cc('침착하게 라인을 유지한다', ['규율 있게 라인을 지켰다.', 'rating+0.3 rel.coach+1'], { chk: '62 attr.positioning*1.5 attr.concentration*1.5', bad: ['마크를 놓친 순간이 있었다. 간신히 위기를 넘겼다.', 'rating-0.2'] })
  ], { cond: ['pos:CB|LB|RB|DM'], max: 8 }),
  mo('m_final_gk', 'final', P, ['결승전. 상대 에이스가 일대일로 돌진해 온다. 골키퍼 {name}에게 모든 것이 달려 있다.', '결승 막판 상대 공격수가 골문 앞으로 돌파했다. 판단의 순간이다.'], [
    cc('과감하게 뛰쳐나가 각을 좁힌다', ['타이밍을 맞춰 빠르게 전진했다.', 'rating+0.1'], { chk: '45 attr.oneOnOne*3 attr.reflexes*2 hid.bigGame*0.2', great: ['슈팅을 몸으로 막아 냈다! 슈퍼 세이브가 승리를 지켰다.', 'rating+1.5 fameD+2 rel.fans+8 morale+10'], bad: ['타이밍이 어긋났다. 슈팅이 골망을 흔들었다.', 'rating-0.8 morale-6'] }),
    cc('끝까지 버티며 반응한다', ['중앙에서 침착하게 슈팅을 기다렸다.', 'rating+0.2'], { chk: '52 attr.reflexes*2.5 attr.positioning*1.5', great: ['반사 신경으로 슈팅을 쳐냈다.', 'rating+1.0 morale+6'], bad: ['슈팅이 손끝을 스쳐 골문으로 들어갔다.', 'rating-0.5'] })
  ], { cond: ['pos:GK'], max: 8 }),
  mo('m_shootout_k', 'shootout', YP, ['승부차기. {name}이(가) 키커로 나서야 한다. 11미터 앞에서 정적이 흐른다. 방향과 강도를 선택해야 한다.', '승부차기 마지막 키커로 지명됐다. 팀의 운명이 걸린 순간이다.'], [
    cc('왼쪽 모서리에 강하게 찬다', ['골키퍼의 반대 방향을 노렸다.', 'rating+0.1'], { chk: '62 attr.penalties*2 attr.composure*1.5 hid.bigGame*0.3', great: ['공이 골망을 흔들었다. 팀이 환호했다.', 'rating+0.7 morale+6 rel.mates+4'], bad: ['골키퍼가 정확히 읽었다. 슈팅이 막혔다.', 'rating-0.7 morale-8 stress+6'] }),
    cc('중앙으로 가볍게 찬다', ['골키퍼가 먼저 몸을 던질 것이라 믿고 가운데를 노렸다.', 'rating+0.1'], { chk: '58 attr.composure*2 attr.penalties*1.2 hid.bigGame*0.3', great: ['골키퍼가 한쪽으로 쏠렸다. 공은 정중앙으로 들어갔다.', 'rating+0.7 morale+6'], bad: ['골키퍼가 제자리에서 공을 막았다.', 'rating-0.7 morale-8 stress+6'] }),
    cc('오른쪽 낮게 깔아 찬다', ['정확한 코스를 노려 낮게 깔았다.', 'rating+0.1'], { chk: '60 attr.penalties*2.2 attr.shooting*0.8 hid.bigGame*0.25', great: ['공이 골대 구석에 박혔다.', 'rating+0.7 morale+6 rel.mates+3'], bad: ['공이 골대를 맞고 나왔다. 고개를 숙였다.', 'rating-0.7 morale-8 stress+6'] })
  ], { cond: ['!pos:GK'], max: 12, note: 'shootout' }),
  mo('m_shootout_gk', 'shootout', YP, ['승부차기. 골문 앞에 선 {name}에게 모든 것이 달려 있다. 키커의 눈빛과 발 모양을 살핀다.', '승부차기에서 골키퍼 {name}이(가) 골문을 지킨다. 상대 키커가 공을 내려놓았다.'], [
    cc('한쪽을 정해 먼저 몸을 던진다', ['직감을 믿고 몸을 날렸다.', 'rating+0.1'], { chk: '28 attr.reflexes*2 attr.penalties*0 hid.bigGame*0.2', great: ['공을 막아 냈다! 동료들이 달려와 {name}을(를) 덮쳤다.', 'rating+1.2 fameD+1 morale+10'], bad: ['반대 방향으로 날았다. 공이 골망을 흔들었다.', 'rating-0.3 morale-4'] }),
    cc('끝까지 기다렸다 반응한다', ['키커의 발끝을 끝까지 지켜보았다.', 'rating+0.1'], { chk: '24 attr.reflexes*2.5 attr.concentration*1.2 hid.bigGame*0.2', great: ['발끝의 방향을 읽고 정확히 막아 냈다.', 'rating+1.2 morale+10'], bad: ['반응이 한 박자 늦었다. 골이 들어갔다.', 'rating-0.3 morale-4'] })
  ], { cond: ['pos:GK'], max: 12, note: 'shootout' }),
  mo('m_relegation_a', 'relegation', P, ['강등 결정전. 이기면 생존, 지면 강등이다. 후반 중반 흔들리는 분위기 속에서 {name}에게 공이 왔다.', '잔류를 건 마지막 경기. 관중의 불안한 침묵이 경기장을 뒤덮었다.'], [
    cc('팀을 이끌며 앞으로 나선다', ['과감히 전진하며 공격을 풀어 나갔다.', 'rating+0.1'], { chk: '48 attr.leadership*1.5 hid.bigGame*0.3 attr.composure*1', great: ['{name}의 한 방이 분위기를 바꿨다. 팀이 승리를 가져왔다.', 'rating+1.1 rel.fans+8 morale+9 fameD+1'], bad: ['무리한 전진이 역습의 빌미가 됐다.', 'rating-0.5 morale-5 stress+5'] }),
    cc('수비적으로 안정을 찾는다', ['실수를 줄이고 팀의 안정을 우선했다.', 'rating+0.3 rel.coach+1 morale-1 fameD-0.1'])
  ], { max: 6 }),
  mo('m_relegation_b', 'relegation', P, ['생존이 걸린 마지막 경기. 후반 막판 프리킥이 주어졌다. 득점하면 극적인 잔류다.', '강등권 탈출 마지막 기회. 세트피스에서 키커로 지명됐다.'], [
    cc('직접 슈팅을 시도한다', ['공을 놓고 수비벽을 응시했다.', 'rating+0.1'], { chk: '36 attr.freeKicks*2.5 attr.composure*1.5 hid.bigGame*0.3', great: ['공이 수비벽을 넘어 골망을 흔들었다! 잔류가 확정됐다.', 'goal+1 rating+1.3 fameD+2 rel.fans+10 morale+12'], bad: ['공이 벽에 막혔다. 마지막 기회가 사라졌다.', 'rating-0.4 morale-6'] }),
    cc('크로스를 올린다', ['박스 안으로 정확한 크로스를 올렸다.', 'rating+0.2'], { chk: '48 attr.crossing*2.5 attr.vision*1', great: ['머리로 받은 동료가 골망을 흔들었다. 극적인 어시스트!', 'assist+1 rating+0.9 morale+7'] })
  ], { cond: ['!pos:GK'], max: 6 }),
  mo('m_intl_debut_a', 'intl_debut', P, ['대표팀 데뷔전. 애국가가 울려 퍼진다. 가슴에 새겨진 엠블럼이 무겁게 느껴졌다. 첫 터치가 {name}의 대표팀 커리어를 결정한다.', '처음으로 {nat} 유니폼을 입고 그라운드에 섰다. 관중의 함성이 몸을 울린다.'], [
    cc('과감하게 첫 슈팅을 노린다', ['첫 기회에서 망설이지 않았다.', 'rating+0.1'], { chk: '42 attr.shooting*2 attr.composure*2 hid.bigGame*0.3', great: ['공이 골망을 갈랐다! 대표팀 데뷔골이다.', 'goal+1 rating+1.3 fameD+2 morale+10'], bad: ['공이 골대를 벗어났다. 조금 더 침착해야 했다.', 'rating-0.3 morale-3'] }),
    cc('팀 플레이에 집중한다', ['단순하고 정확한 플레이로 기본에 충실했다.', 'rating+0.4 rel.natcoach+2 morale-1 fameD-0.2'])
  ], { cond: ['pos:ST|LW|RW|AM|CM'], max: 1 }),
  mo('m_intl_debut_b', 'intl_debut', P, ['대표팀 데뷔전. 수비진의 일원으로 첫 경기에 나섰다. 상대 공격수의 속도가 낯설다.', '{nat} 유니폼을 입고 서는 수비 라인. 모든 판단이 국제 경기의 무게로 다가온다.'], [
    cc('적극적인 대인 마크를 시도한다', ['과감하게 몸을 붙였다.', 'rating+0.1'], { chk: '45 attr.marking*2.5 attr.tackling*1.5 hid.bigGame*0.2', great: ['상대 에이스를 완벽히 봉쇄했다. 대표팀 감독이 엄지를 세웠다.', 'rating+1 rel.natcoach+6 fameD+1.5'], bad: ['한 번 뚫리며 위기를 허용했다.', 'rating-0.4'] }),
    cc('안정적으로 라인을 지킨다', ['실수를 줄이고 라인을 정돈했다.', 'rating+0.4 rel.natcoach+2 morale-1 fameD-0.2'])
  ], { cond: ['pos:CB|LB|RB|DM|GK'], max: 1 })
];
