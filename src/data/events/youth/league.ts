import type { RawEvent } from '../../schema';
import { cc, ch, mo, pa } from '../helpers';

const Y: ('youth')[] = ['youth'];

export const youthLeague: RawEvent[] = [
  mo('ys_league_race', 'ytitle', Y, [
    '유스 리그 막바지, 선두권 세 팀이 승점 차 없이 달리고 있다. 오늘 경기는 사실상 결승이다. 후반 막판 1-1, 문전에서 공이 {name}에게 흘렀다.',
    '우승 경쟁이 걸린 유스 리그 경기. 상대 {opp}도 물러서지 않는다. 종료 직전 마지막 공격에서 {name} 앞에 공간이 열렸다.'
  ], [
    cc('직접 마무리한다', ['호흡을 고르고 발을 휘둘렀다.', 'rating+0.1'], {
      chk: '42 attr.finishing*2 attr.composure*2 hid.bigGame*0.2',
      great: ['공이 골망을 흔들었다! 벤치가 쏟아져 나왔다. 우승 경쟁에서 한 발 앞서 나갔다.', 'goal+1 rating+1.1 morale+9 rel.coach+3 rel.mates+3'],
      bad: ['슛은 수비 몸에 맞고 흘러나갔다. 승점 1이 아쉬웠다.', 'rating-0.3 morale-4']
    }),
    cc('옆의 동료에게 내준다', ['한 박자 늦게 패스를 밀어 주었다.', 'rating+0.2'], {
      chk: '58 attr.vision*2 attr.passing*1.5',
      great: ['동료가 침착하게 마무리했다. 도움이 기록됐다.', 'assist+1 rating+0.8 rel.mates+4 morale+6'],
      bad: ['패스가 한 발 짧았다. 수비가 먼저 걷어냈다.', 'rating-0.3']
    }),
    cc('시간을 끌며 승점을 지킨다', ['공을 코너 쪽으로 몰아 시간을 보냈다.', 'rating+0.2 rel.coach+1 stress+2'], { pv: '안정 우선 감독 관계↑' })
  ], { cond: ['!pos:GK', '!school'], cd: 40, max: 4 }),
  mo('ys_youth_derby', 'yderby', Y, [
    '유스 지역 더비. 같은 도시의 라이벌 구단 U팀이 상대다. 관중석의 가족들까지 목소리를 높인다. 균형이 깨지지 않은 채 후반이 흘러간다.',
    '유스 더비가 열렸다. 평소보다 태클이 거칠고 서로의 눈빛이 날카롭다. 중반 이후 {name}이(가) 공을 잡을 때마다 상대 선수가 달려든다.'
  ], [
    cc('도발에 응하지 않고 침착하게 플레이한다', ['심판 쪽만 보고 공에 집중했다.', 'rating+0.3 hid.pro+1'], {
      chk: '60 attr.composure*2 hid.temper*-0.2',
      great: ['상대의 거친 플레이를 피해 침착하게 공간을 만들었다. 결정적인 한 방이 나왔다.', 'goal+1 rating+0.9 morale+8'],
      bad: ['참으려 했지만 몇 번의 반칙에 흔들렸다.', 'rating-0.3 stress+3']
    }),
    cc('몸싸움으로 맞선다', ['어깨를 부딪치며 한 발도 물러서지 않았다.', 'rating+0.1'], {
      chk: '45 attr.strength*1.5 attr.aggression*1 attr.workRate*1',
      great: ['거친 경합에서 공을 따냈다. 팬들이 환호했다.', 'rating+0.8 morale+7 rel.fans+4'],
      bad: ['흥분한 탓에 경고를 받았다.', 'rating-0.5 stress+4']
    })
  ], { cond: ['!pos:GK'], cd: 30, max: 5 }),
  mo('ys_cup_final', 'yfinal', Y, [
    '유스 컵 결승전. 운동장에는 구단 직원과 부모님, 스카우트들의 시선이 가득하다. 90분은 팽팽했고 승부는 막판으로 향한다.',
    '대회 결승, 연령별 대표 스카우트가 지켜보는 경기다. 마지막 십 분, 감독이 {name}에게 마지막 지시를 내렸다.'
  ], [
    cc('승부를 걸고 전진한다', ['가진 모든 힘을 쥐어짜 앞으로 달려 나갔다.', 'rating+0.1 fatigue+3'], {
      chk: '40 attr.finishing*1.5 attr.dribbling*1 hid.bigGame*0.3 attr.composure*1',
      great: ['결정적인 장면을 만들었다. 결승전을 결정짓는 한 방이 나왔다.', 'goal+1 rating+1.3 morale+10 fameD+0.6'],
      bad: ['무리한 시도가 끊겼다. 역습이 이어졌다.', 'rating-0.4 morale-4']
    }),
    cc('동료를 믿고 기회를 만든다', ['한 발 뒤로 물러서 연결 고리를 맡았다.', 'rating+0.3'], {
      chk: '58 attr.passing*1.5 attr.vision*1.5 hid.bigGame*0.2',
      great: ['정확한 패스가 결승 골로 이어졌다.', 'assist+1 rating+1 morale+9 rel.mates+4'],
      bad: ['패스가 막혔다. 기회가 사라졌다.', 'rating-0.3']
    }),
    cc('수비 라인을 지키며 승부차기를 노린다', ['라인을 내리고 버텼다.', 'rating+0.2 sharp-1'], { pv: '안정 우선 승부차기 가능' })
  ], { cond: ['!school', '!pos:GK'], cd: 40, max: 4 }),
  mo('ys_gk_race', 'ytitle', Y, [
    '유스 리그 막바지, 선두 경쟁이 치열하다. 1-1 팽팽한 후반 막판, 상대 공격수가 문전에서 단독 찬스를 잡았다. 골문 앞에는 {name}뿐이다.',
    '우승 경쟁이 걸린 경기. 종료 직전 상대가 마지막 공격을 몰아쳤다. 골키퍼 {name}에게 모든 것이 달렸다.'
  ], [
    cc('각을 좁히며 앞으로 나온다', ['타이밍을 재고 과감하게 뛰쳐나왔다.', 'rating+0.1'], { chk: '45 attr.oneOnOne*3 attr.reflexes*1.5 hid.bigGame*0.2', great: ['슈팅을 몸으로 막아냈다! 벤치가 폭발했다. 우승 경쟁에서 한 발 앞서 나갔다.', 'rating+1.2 morale+9 rel.coach+3 rel.mates+3'], bad: ['타이밍이 빗나갔다. 공이 골망을 흔들었다.', 'rating-0.5 morale-5'] }),
    cc('제자리에서 반응한다', ['끝까지 슈팅 방향을 읽었다.', 'rating+0.2'], { chk: '55 attr.reflexes*2.5 attr.concentration*1', bad: ['손끝을 스친 공이 골대 안으로 들어갔다.', 'rating-0.3'] }),
    cc('수비수에게 큰 소리로 지시한다', ['라인을 정리하며 수비수들을 불렀다.', 'rating+0.2 rel.mates+2 stress+2'], { pv: '리더십 동료 관계↑' })
  ], { cond: ['pos:GK'], cd: 40, max: 4 }),
  mo('ys_gk_final', 'yfinal', Y, [
    '결승전. 승부는 막판까지 팽팽하다. 상대가 마지막 세트피스를 얻었다. 골문을 지키는 {name}에게 스탠드의 시선이 쏠렸다.',
    '대회 결승, 스카우트가 지켜보는 가운데 상대 에이스가 일대일로 돌진해 온다.'
  ], [
    cc('몸을 던져 막아낸다', ['과감하게 각을 좁히며 몸을 날렸다.', 'rating+0.1'], { chk: '45 attr.oneOnOne*3 attr.reflexes*2 hid.bigGame*0.25', great: ['슈퍼세이브! 결승전을 지켜낸 선방이었다.', 'rating+1.3 morale+10 fameD+0.6'], bad: ['타이밍이 늦었다. 공이 골대 안으로 들어갔다.', 'rating-0.5 morale-5'] }),
    cc('침착하게 방향을 읽는다', ['움직이지 않고 슈팅을 기다렸다.', 'rating+0.2'], { chk: '55 attr.reflexes*2 attr.composure*1.5', bad: ['방향이 빗나갔다.', 'rating-0.3'] })
  ], { cond: ['pos:GK'], cd: 40, max: 5 }),
  mo('ys_gk_derby', 'yderby', Y, [
    '유스 지역 더비. 거친 분위기 속에 상대 공격수의 압박이 거세다. 코너킥 상황에서 공중볼 경합이 벌어졌다.',
    '더비 매치. 상대 팬들의 야유가 이어진다. 높이 뜬 크로스가 골문 앞으로 날아든다.'
  ], [
    cc('나와서 펀칭한다', ['과감하게 뛰쳐나와 공을 쳐냈다.', 'rating+0.2'], { chk: '50 attr.aerial*2.5 attr.handling*1.5 hid.bigGame*0.15', great: ['공중볼을 완벽히 잡아냈다. 더비의 안전지대가 됐다.', 'rating+0.9 morale+7 rel.fans+4'], bad: ['공을 놓쳤다. 문전 혼전이 벌어졌다.', 'rating-0.4 morale-4'] }),
    cc('골라인을 지키며 대기한다', ['수비수를 믿고 골대 앞을 지켰다.', 'rating+0.2'], { chk: '58 attr.positioning*2 attr.concentration*1', bad: ['혼전 속에서 반응이 늦었다.', 'rating-0.3'] })
  ], { cond: ['pos:GK'], cd: 30, max: 5 }),
  ch('ys_jump_offer', Y, 1, [
    '시즌 중반, {coach} 감독이 면담을 요청했다. 지금 연령대에서는 이미 보여 줄 것을 다 보여 줬다는 평가다. 상위 연령 팀 감독이 합류를 원한다고 한다.',
    '또래들과의 경기에서 {name}의 격차가 눈에 띈다. 구단은 시즌 도중 상위 {stage} 위 연령 팀으로 올려 보내는 방안을 꺼냈다.'
  ], [
    cc('월반을 받아들인다', ['짐을 옮기고 새 라커룸으로 들어섰다. 몸싸움의 강도가 완전히 달랐다.', 'fx:jump=1 morale+4 stress+3 pot+0.4'], {
      pv: '성장↑↑ 사기↑ 스트레스↑',
      chk: '75 ovr*0.3 hid.adapt*0.15 hid.bigGame*0.1',
      bad: ['적응에 시간이 걸린다. 초반 벤치를 달구게 됐다.', 'fx:jump=1 morale-4 stress+5']
    }),
    cc('또래와 한 시즌을 더 보낸다', ['지금 팀의 주전으로 우승에 집중하기로 했다. 감독이 고개를 끄덕였다.', 'morale+3 rel.coach+3 hid.loyalty+1 sharp+2 hid.ambition-1'], { pv: '출전 안정↑' })
  ], { sched: true, cd: 0, max: 4, xg: 'jump', tier: 'major' }),
  ch('ys_jump_double', Y, 1, [
    '구단 유스 디렉터가 직접 찾아왔다. 이례적인 제안이다. 두 연령대를 건너뛰어 U19 팀에 합류하라는 것이다. 또래 수준을 한참 넘어섰다는 평가다.',
    '스카우트와 코칭스태프 회의 끝에 결론이 났다. {name}은(는) 또래와 뛰기에는 너무 앞서 있다는 것이다. 두 단계 월반이라는 파격적인 제안이 도착했다.'
  ], [
    cc('두 단계 월반을 받아들인다', ['형들 사이에서 가장 어린 선수가 됐다. 압박의 강도가 비교할 수 없다.', 'fx:jump=2 morale+2 stress+6 pot+0.6'], {
      pv: '성장↑↑↑ 사기↑ 스트레스↑',
      chk: '66 ovr*0.3 hid.adapt*0.15 hid.pro*0.1',
      bad: ['따라가기 벅차다. 첫 한 달은 벤치에서 보냈다.', 'fx:jump=2 morale-6 stress+7']
    }),
    cc('한 단계만 올라간다', ['무리하지 않기로 했다. 한 단계 위에서 균형을 잡아 가자는 합의다.', 'fx:jump=1 morale+4 stress+2 pot+0.3'], { pv: '성장↑↑' }),
    cc('지금 팀에 남는다', ['한 단계씩 밟아 가자는 부모님의 말에 고개를 끄덕였다.', 'morale+1 rel.coach+2 rel.father+2 hid.ambition-1'], { pv: '안정↑' })
  ], { sched: true, cd: 0, max: 1, xg: 'jump', tier: 'major' }),
  pa('ys_callup_one', Y, 1, [
    '오늘 경기는 한 단계 위 팀에 차출돼 치렀다. 같은 공인데 스피드와 압박이 한 배는 빠르다. 라커룸에서 형들이 어깨를 두드려 주었다.',
    '상위 연령 팀에 결원이 생겨 급하게 호출됐다. 낯선 등번호를 달고 처음 나선 경기에서 많은 것을 배웠다.'
  ], 'morale+4 sharp+3 attr.composure+0.1 hid.ambition+1', { sched: true, cd: 0, max: 1 }),
  ch('ys_squad_first', Y, 1, [
    '1군 경기 날, 처음으로 명단 18명 안에 이름이 올랐다. 벤치 끝에 앉아 90분을 지켜보았다. 코치가 몸을 풀라고 한 번 손짓했지만 교체 카드는 끝내 나오지 않았다.',
    '원정 버스에 처음으로 1군 선수들과 함께 올랐다. 번호가 적힌 유니폼이 {name}의 가방에 들어 있다. 출전은 아니어도 심장이 뛰었다.'
  ], [
    cc('벤치에서 경기 흐름을 눈에 새긴다', ['선수들의 위치 선정과 판단을 하나하나 머릿속에 담았다.', 'attr.positioning+0.15 attr.vision+0.1 hid.pro+1 rel.fcoach+2 fatigue+2'], { pv: '성장↑ 프로의식↑' }),
    cc('선배에게 조언을 구한다', ['경기가 끝난 뒤 주전 선수에게 다가가 질문을 던졌다.', 'rel.mates+3 rel.fcoach+1 morale+3'], {
      chk: '55 hid.social*0.2 hid.adapt*0.1',
      bad: ['어색한 분위기만 남았다. 다음에는 더 자연스러워야겠다.', 'morale-2']
    })
  ], { sched: true, cd: 0, max: 1, xg: 'first_team', tier: 'major' }),
  pa('ys_early_pro', Y, 1, [
    '이례적으로 이른 나이에 구단이 프로 계약을 검토한다는 소식이 전해졌다. 월반과 1군 훈련에서 보여 준 모습이 코칭스태프의 눈에 들었다.',
    '아직 17세 이전, 구단 사무실에서 먼저 면담을 요청했다. 또래보다 빨리 프로 계약서를 들여다보게 됐다.'
  ], 'morale+5 hid.ambition+1 fameD+0.3', { sched: true, cd: 0, max: 2 }),
  ch('ys_res_bench', Y, 3, [
    '리저브 경기 명단에서도 이름이 점점 뒤로 밀린다. 같은 포지션에 새로 들어온 유망주가 먼저 호명된다. 에이전트가 임대를 이야기한다.',
    '프로 계약서에 서명한 지 한참인데 1군은 멀고 리저브에서도 벤치가 길어졌다. 이대로는 성장이 멈출 것만 같다.'
  ], [
    cc('감독에게 출전 시간을 요구한다', ['면담에서 솔직히 말했다. 감독은 잠시 생각하더니 다음 경기 명단을 약속했다.', 'rel.coach-1 morale+2'], {
      chk: '45 rel.coach*0.3 hid.pro*0.15 ovr*0.15',
      great: ['감독이 약속을 지켰다. 이어진 경기에서 풀타임을 소화했다.', 'rel.coach+4 morale+6 sharp+4'],
      bad: ['"기다려라"는 한마디만 돌아왔다. 분위기가 어색해졌다.', 'rel.coach-4 morale-4']
    }),
    cc('이를 악물고 훈련에 매달린다', ['출전은 줄었지만 훈련량은 늘렸다. 기회는 준비한 사람에게 온다고 믿었다.', 'hid.pro+2 fatigue+4 attr.stamina+0.1 morale-2'], { pv: '프로의식↑ 피로↑' }),
    cc('하위 구단 이적을 알아본다', ['에이전트를 통해 다른 구단 제안을 탐색했다.', 'stress+2 hid.ambition+1 fx:offers=free'], { pv: '출전 기회 탐색' })
  ], { cond: ['stageIdx>=3', 'signed', 'ytShare<0.4'], cd: 52, max: 2, xg: 'res_bench', tier: 'minor' }),
  ch('ys_bteam_first', Y, 4, [
    'B팀 경기에서 처음으로 성인 선수들과 마주했다. 상대 수비수는 서른이 넘은 베테랑이다. 첫 터치부터 몸을 부딪쳐 온다.',
    '성인 리그의 하위 팀과 B팀 일정이 시작됐다. 상대 공격수의 노련한 움직임과 거친 몸싸움이 낯설다. 같은 90분인데 훨씬 길게 느껴진다.'
  ], [
    cc('몸싸움을 피하지 않고 맞선다', ['어깨를 낮추고 공을 지켰다. 한두 번 넘어졌지만 일어났다.', 'attr.strength+0.15 attr.workRate+0.15 stress+2 sharp+3'], {
      chk: '48 attr.strength*2 attr.aggression*1.5 attr.balance*1',
      great: ['베테랑을 상대로 공을 지켜냈다. 코치진이 눈여겨봤다.', 'rel.coach+3 morale+6 attr.strength+0.2'],
      bad: ['부딪칠 때마다 밀렸다. 정신적으로 큰 타격을 받았다.', 'morale-4 stress+4']
    }),
    cc('빠른 패스 플레이로 템포를 바꾼다', ['몸싸움을 피하고 한 번에 공을 돌렸다.', 'attr.passing+0.15 attr.vision+0.1 sharp+2 stress+2'], { pv: '기술↑ 몸싸움 약점 노출' })
  ], { cond: ['bteam', 'signed'], cd: 200, max: 1, xg: 'bteam', tier: 'minor' }),
  ch('nat_youth_refuse', ['youth', 'pro'], 1, [
    '연령별 월드컵 소집 명단에 이름이 올랐지만 구단이 차출에 난색을 보인다. 중요한 경기를 앞두고 주축 선수를 내줄 수 없다는 입장이다.',
    '협회가 소집 공문을 보냈지만 구단은 "시즌 일정이 우선"이라고 답했다. {coach} 감독은 말을 아꼈다.'
  ], [
    cc('구단의 뜻을 따른다', ['대표팀에는 양해를 구했다. 아쉬움이 컸지만 소속팀 경기에 집중하기로 했다.', 'rel.coach+3 morale-3 hid.loyalty+2'], { pv: '감독 관계↑ 소속팀 충성↑' }),
    cc('대표팀 합류를 요청한다', ['에이전트와 가족이 함께 구단을 설득했다.', 'fx:ageSquad=1 rel.coach-3 stress+3'], {
      chk: '40 ovr*0.2 hid.ambition*0.2 rel.coach*0.2 fameD*0.2', pv: '대표팀 합류 가능 감독 관계↓',
      bad: ['구단은 끝내 허락하지 않았다. 감독과의 관계만 서먹해졌다.', 'fx:ageSquad=0 rel.coach-6 morale-5']
    })
  ], { sched: true, cd: 0, max: 99, xg: 'age_call', tier: 'major' }),
  ch('ys_top_scout', Y, 1, [
    '{upclub}의 유스 디렉터가 직접 찾아왔다. 또래 중에서는 비교 대상이 없다는 평가와 함께 아카데미 입단을 제안했다.',
    '전국 스카우트들이 {name}의 경기를 보러 다닌다. {upclub}이(가) 이적을 서두르고 있다.'
  ], [
    cc('최상위 구단 아카데미로 옮긴다', ['짐을 꾸려 리그 최고의 아카데미에 들어갔다. 훈련 시설이 완전히 다르다.', 'fx:youthMove=top morale+6 fameD+0.5 stress+3 fu:fu_career@10-26'], { chk: '75 ovr*0.3 hid.adapt*0.15', pv: '성장↑↑ 사기↑ 스트레스↑', bad: ['적응이 쉽지 않다. 그래도 환경만큼은 최고였다.', 'fx:youthMove=top morale-2 stress+5 fu:fu_career@10-26'] }),
    cc('지금 팀에 남는다', ['이 팀에서 더 증명하기로 했다. 감독이 환히 웃었다.', 'rel.coach+4 hid.loyalty+2 hid.ambition-1'], { pv: '안정↑' })
  ], { sched: true, cd: 0, max: 2, xg: 'academy_move', tier: 'major', cond: ['upperClub'] }),
  pa('ys_squad_unused', Y, 2, [
    '1군 경기에 명단으로 동행했지만 끝내 이름이 불리지 않았다. 경기장 조명이 꺼진 뒤 혼자 라커룸에 남아 있었다.',
    '명단에는 올랐으나 교체 사인은 나오지 않았다. 팀이 이겨서 기뻤지만 내 경기는 아니었다는 생각이 지워지지 않았다.'
  ], 'morale-2 hid.ambition+1 sharp-1', { cond: ['ftSquad', '!debuted'], cd: 20, max: 3 }),
  pa('ys_train_up', Y, 2, [
    '1군 훈련 후반부, 주전급 선수와 맞붙은 미니게임에서 짧지만 인상적인 장면을 만들었다. {fcoach} 감독이 먼발치에서 이를 지켜보았다.',
    '1군 훈련장에서 처음 풀타임 연습경기를 소화했다. 몸은 무거웠지만 판단의 속도는 확실히 빨라졌다.'
  ], 'attr.composure+0.1 sharp+3 rel.fcoach+2', { cond: ['ftTrain', '!debuted'], cd: 20, max: 4 })
];
