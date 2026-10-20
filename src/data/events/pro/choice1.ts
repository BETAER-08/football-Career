import type { RawEvent } from '../../schema';
import { cc, ch, pa } from '../helpers';

const P: ('pro')[] = ['pro'];
const YP: ('youth' | 'pro')[] = ['youth', 'pro'];

export const proChoice1: RawEvent[] = [
  ch('pc_tattoo', P, 3, ['팔뚝에 의미 있는 문구를 새기고 싶다는 생각이 오래전부터 있었다. 몇몇 동료가 타투샵을 소개해 주었다.', '라커룸에서 타투 이야기가 한창이다. {name}도 오래 고민하던 도안이 있다.'], [
    cc('새긴다', ['도안은 마음에 들었다. SNS에 올리자 반응이 갈렸다.', 'followers+20 happy+4 fameD+0.2'], { chk: '65 hid.controversy*-0.25 hid.pro*0.1', bad: ['도안이 구설에 올랐다. 구단에서 짧게 주의를 받았다.', 'rel.media-3 rel.coach-2 stress+2'] }),
    cc('하지 않는다', ['신중하게 생각해 보기로 했다.', 'stress-1 followers-2 rel.mates-1'])
  ], { cond: ['age>=18'], cd: 200, max: 1, xg: 'tattoo', tier: 'minor' }),
  ch('pc_family_return', P, 3, ['해외 생활이 길어지자 가족이 귀국을 이야기하기 시작했다. "이제 그만 돌아와도 되지 않겠니." 마음이 흔들린다.', '낯선 도시의 밤이 길다. 가족과의 거리가 점점 더 크게 다가온다.'], [
    cc('조금 더 버텨 본다', ['아직 해야 할 일이 남았다고 말했다. 가족은 고개를 끄덕였지만 목소리는 아쉬웠다.', 'hid.pro+1 stress+4 rel.mother-2'], { chk: '45 hid.adapt*0.25 hid.family*-0.2', bad: ['버티기엔 너무 외로웠다. 훈련 때 집중이 흐트러졌다.', 'happy-8 stress+6'] }),
    cc('가족을 초청한다', ['가족이 한 달간 머물렀다. 식탁이 다시 따뜻해졌다.', 'happy+8 stress-6 rel.mother+4 cashw-2'], { pv: '행복↑ 가족 관계↑ 지출↑' }),
    cc('귀국을 요청한다', ['구단에 사정을 이야기하고 이적 의사를 전했다.', 'fx:offers=many rel.coach-4 rel.fans-3 happy+3'])
  ], { cond: ['abroad', 'hid.family>=50'], cd: 104, max: 2, xg: 'homecoming', note: 'abroad_adapt', tier: 'minor' }),
  ch('pc_tv_offer', P, 3, ['방송국에서 축구 예능과 해설 프로그램 게스트 출연을 제안했다. 대중에게 얼굴을 알릴 기회지만 훈련 일정이 빠듯하다.', '방송국 PD가 직접 찾아와 출연을 요청했다.'], [
    cc('출연한다', ['카메라 앞에서 떨렸지만 재치 있는 입담이 화제가 됐다.', 'followers+40 fameD+0.8 fatigue+4 rel.media+3'], { chk: '55 hid.social*0.3 hid.controversy*-0.15', bad: ['말실수가 편집돼 기사로 퍼졌다. 구단이 주의를 주었다.', 'rel.fans-3 rel.coach-3 stress+4'], great: ['예상 밖의 입담으로 인기가 치솟았다. 후원사도 관심을 보였다.', 'followers+120 fameD+2 sponsor+500 rel.media+6'] }),
    cc('거절한다', ['훈련과 경기에 집중하겠다고 답했다. {coach} 감독이 만족해했다.', 'rel.coach+2 fameD-0.5 cashw-1'])
  ], { cond: ['fameD>=14'], cd: 52, max: 4, xg: 'press', tier: 'minor' }),
  ch('pc_captain_armband', P, 2, ['{coach} 감독이 {name}에게 주장 완장을 맡길 생각이 있다고 말했다. 책임이 크지만 팀에서 인정받는다는 뜻이다.', '라커룸 투표에서 {name}이(가) 가장 많은 표를 받았다.'], [
    cc('수락한다', ['주장 완장을 팔에 둘렀다. 모든 결정이 한층 무거워졌다.', 'attr.leadership+0.5 rel.coach+4 rel.captain+3 stress+4 fameD+0.5 fx:trait=+leaderT'], { chk: '55 attr.leadership*1.5 hid.social*0.1 rel.coach*0.1', bad: ['책임이 부담으로 바뀌었다. 팀이 부진하자 시선이 따가웠다.', 'stress+8 morale-3'] }),
    cc('사양한다', ['"지금은 제 플레이에 집중하고 싶습니다." 감독은 이해한다고 했다.', 'stress-2 rel.coach-3 attr.leadership-0.05'])
  ], { cond: ['age>=24', 'role:starter', 'rel.coach>=10'], cd: 150, max: 1, xg: 'position_role', tier: 'minor' }),
  ch('pc_teammate_conflict', P, 3, ['{mate}와(과) 팀 동료 {captain} 사이에 언쟁이 벌어졌다. 라커룸 분위기가 얼어붙었다.', '훈련장에서 동료 두 명이 서로 소리를 질렀다. 주변 선수들이 눈치를 보고 있다.'], [
    cc('중재에 나선다', ['두 사람을 따로 불러 이야기를 들었다. 시간이 걸렸지만 응어리가 풀렸다.', 'rel.mates+4 rel.captain+3 attr.leadership+0.2 stress+2'], { chk: '50 attr.leadership*1 rel.captain*0.1', bad: ['나서서 말릴수록 오히려 불씨가 번졌다.', 'rel.mates-3 stress+4'] }),
    cc('거리를 둔다', ['일단은 지켜보기로 했다. 며칠 뒤 분위기는 저절로 가라앉았다.', 'stress+1'])
  ], { cd: 50, max: 4, xg: 'locker_room', tier: 'minor', again: '동료와 갈등했던 지난번에는 "{prev}" 쪽을 택했다.' }),
  ch('pc_new_role', P, 3, ['{coach} 감독이 전술 변화를 위해 {name}에게 새 역할을 제안했다. 익숙하지 않지만 출전 기회가 늘어날 수도 있다.', '새로운 포지션 실험 이야기가 나왔다. {coach} 감독의 눈빛은 진지했다.'], [
    cc('받아들인다', ['새로운 자리는 낯설었지만 시야가 넓어졌다.', 'fx:secPos=CM attr.firstTouch+0.1 rel.coach+3 sharp+2 fu:fu_club@8-20'], { chk: '50 attr.vision*1 rel.coach*0.15', bad: ['새 역할에 적응하지 못해 평점이 떨어졌다.', 'morale-4 rel.coach-1 fu:fu_club@8-20'] }),
    cc('원래 포지션을 고수한다', ['"제가 가장 잘하는 건 여기입니다." 감독은 조금 아쉬워했다.', 'rel.coach-3 fu:fu_club@8-20'])
  ], { cond: ['!pos:GK', 'age>=19'], cd: 100, max: 2, xg: 'position_role', tier: 'major' }),
  ch('pc_fan_confront', P, 3, ['훈련 후 귀가하는 길에 몇몇 팬이 다가와 부진을 따졌다. 격앙된 분위기였다.', '마트에서 마주친 팬이 "요즘 왜 그래요?"라며 목소리를 높였다.'], [
    cc('차분히 듣고 사과한다', ['팬의 이야기를 끝까지 듣고 고개를 숙였다. 분위기가 누그러졌다.', 'rel.fans+3 stress+2'], { pv: '팬 관계↑' }),
    cc('정중히 자리를 피한다', ['"죄송합니다. 더 열심히 하겠습니다." 서둘러 차에 올랐다.', 'stress+3']),
    cc('감정적으로 받아친다', ['순간 참지 못하고 맞받아쳤다. 영상이 퍼졌다.', 'rel.fans-8 rel.media-5 rel.coach-3 stress+6'], { chk: '30 hid.temper*-0.4', bad: ['영상이 크게 퍼져 구단이 공식 입장을 냈다.', 'rel.fans-14 rel.media-8 rel.coach-6 stress+10 fu:sns_apology@2-4'] })
  ], { cond: ['form<=5.8', 'fameD>=8'], cd: 100, max: 2, xg: 'press', note: 'fan', tier: 'minor' }),
  ch('pc_public_criticism', P, 3, ['경기 후 {coach} 감독이 기자회견에서 {name}의 플레이를 공개적으로 비판했다. 기사 제목이 불편하다.', '감독이 "일부 선수의 태도가 아쉬웠다"고 말했다. 모두가 {name}을(를) 바라보았다.'], [
    cc('감독을 직접 찾아가 이야기한다', ['면담에서 서로의 입장을 확인했다. 감독이 "내 표현이 지나쳤다"고 사과했다.', 'rel.coach+4 stress-3'], { chk: '48 rel.coach*0.25 hid.pro*0.15', bad: ['면담은 평행선이었다. 사이가 더 어색해졌다.', 'rel.coach-5 stress+4'] }),
    cc('SNS에 반박 글을 올린다', ['감정이 앞서 반박 글을 올렸다. 논란이 크게 번졌다.', 'rel.coach-10 rel.media+2 followers+40 stress+6 fu:sns_apology@2-5'], { pv: '감독 관계↓↓' }),
    cc('묵묵히 훈련으로 답한다', ['말 대신 그라운드에서 보여 주기로 했다.', 'hid.pro+2 stress+3 sharp+2'])
  ], { cond: ['form<=6', 'rel.coach<=15'], cd: 100, max: 2, xg: 'form_mental', tier: 'minor', again: '공개 비판을 받았던 지난번에는 "{prev}" 쪽을 택했다.' }),
  ch('pc_rest_request', P, 3, ['연전의 피로가 쌓였다. 몸이 보내는 신호를 무시하기 어렵다. 휴식을 요청해 볼까?', '무릎이 뻐근하고 다리가 무겁다. 의무팀도 휴식을 권했다.'], [
    cc('감독에게 휴식을 요청한다', ['"한 경기 쉬어도 좋다"는 답을 받았다. 몸이 가벼워졌다.', 'fatigue-18 health+3 sharp-3 rel.coach+1'], { chk: '50 rel.coach*0.2 health*-0.15', bad: ['감독은 "지금은 안 된다"고 했다. 몸이 더 무거워졌다.', 'rel.coach-2 stress+3'] }),
    cc('참고 계속 뛴다', ['"괜찮습니다." 이를 악물고 경기에 나섰다.', 'fatigue+6 hid.pro+1'], { chk: '45 hid.injuryProne*-0.25 fatigue*-0.3', bad: ['과로가 부상으로 이어졌다.', 'fx:inj=calf stress+4'] })
  ], { cond: ['fatigue>=62', '!injured'], cd: 30, max: 4, xg: 'training_load', note: 'inj_freq', tier: 'minor' }),
  ch('pc_house_advice', P, 2, ['에이전트가 괜찮은 부동산 매물이 있다며 투자를 권했다. 지역 개발 호재가 있다고 한다.', '동료의 소개로 부동산 투자 설명회에 다녀왔다. 설득력은 있어 보였다.'], [
    cc('투자한다', ['계약서에 서명했다. 자산이 하나 더 늘었다.', 'cashy-0.4 stress+1'], { chk: '50 hid.thrift*-0.1 agent*0.2', bad: ['시장이 얼어붙어 가치가 떨어졌다.', 'morale-3'] }),
    cc('거절한다', ['서두르지 않기로 했다.', 'hid.thrift+1 val-1 stress+2'])
  ], { cond: ['wage>=5000', 'cash>=3000'], cd: 104, max: 2, xg: 'family_money', tier: 'minor' }),
  ch('pc_stock_tip', P, 3, ['동료가 확실한 종목이 있다며 주식 정보를 흘렸다. "이번엔 틀림없어."', '라커룸에서 투자 이야기가 한창이다. 모두 수익을 자랑한다.'], [
    cc('따라서 투자한다', ['소액을 넣어 보기로 했다.', 'cashy-0.1 fx:econ=2'], { chk: '45 hid.thrift*0.1 agent*0.1', bad: ['종목이 급락했다. 동료들도 말이 없었다.', 'fx:econ=-5 stress+3'], great: ['정말로 크게 올랐다. 동료들은 한턱 쏘라고 했다.', 'cashy+0.15 happy+4'] }),
    cc('듣기만 한다', ['남의 정보는 믿지 않기로 했다.', 'hid.thrift+1 rel.mates-2'])
  ], { cond: ['cash>=2000', 'age>=19'], cd: 80, max: 4, xg: 'family_money', note: 'econ_crisis', tier: 'minor' }),
  ch('pc_endorsement', P, 3, ['글로벌 브랜드가 {name}에게 광고 모델 제안을 했다. 계약금은 크지만 이미지 관리가 필요하다.', '광고 대행사가 찾아와 새 캠페인 모델을 제안했다.'], [
    cc('계약한다', ['촬영 일정이 빡빡했지만 광고는 성공적이었다.', 'sponsor+1500 followers+60 fatigue+4 fameD+0.8'], { chk: '48 fameD*0.5 agent*0.2 hid.controversy*-0.1', bad: ['협상이 길어졌고 광고 이미지가 기대에 못 미쳤다.', 'sponsor+400 stress+3'] }),
    cc('거절한다', ['지금은 축구에 집중하고 싶다고 했다.', 'hid.pro+1 fameD-0.5 followers-2'])
  ], { cond: ['fameD>=18'], cd: 104, max: 4, xg: 'sponsor', tier: 'minor' }),
  ch('pc_charity_match', P, 2, ['자선 경기에 초청을 받았다. 쉬는 날이지만 뜻깊은 행사다.', '아이들을 돕는 자선 경기 초대장이 도착했다.'], [
    cc('참가한다', ['웃음 가득한 하루였다. 아이들과 공을 차며 오랜만에 순수한 즐거움을 느꼈다.', 'happy+6 rel.fans+4 fameD+0.4 fatigue+4'], { chk: '55 health*0.15 fatigue*-0.2', pv: '행복↑ 팬 관계↑', bad: ['행사 중 어깨를 부딪혀 통증이 생겼다.', 'fatigue+8 health-2 morale-2'] }),
    cc('정중히 거절한다', ['일정이 빡빡하다는 이유로 양해를 구했다.', 'stress-1 rel.fans-3 fameD-0.3'])
  ], { cond: ['fameD>=8'], cd: 80, max: 5, xg: 'charity', tier: 'minor' }),
  ch('pc_wage_dispute', P, 3, ['최근 활약에 비해 연봉이 낮다는 생각이 든다. 구단에 인상을 요구해 볼까?', '에이전트가 "지금이 협상할 때"라고 말했다. 하지만 구단 사정도 복잡하다.'], [
    cc('연봉 인상을 요구한다', ['구단과 협상이 이어졌다. 결과는?', 'rel.director-1 stress+3 fu:fu_club@8-20'], { chk: '36 ovr*0.4 agent*0.25 rel.coach*0.1', great: ['구단이 요구를 대부분 받아들였다.', 'fx:clubOpt=raise morale+5 rel.agent+3 fu:fu_club@8-20'], bad: ['구단은 "시기상조"라며 거절했다. 분위기가 어색해졌다.', 'morale-5 rel.coach-2 stress+4 fu:fu_club@8-20'] }),
    cc('참고 기다린다', ['시즌이 끝날 때까지 기다리기로 했다.', 'stress+1 fu:fu_club@8-20'])
  ], { cond: ['role:starter|rotation', 'form>=6.8', 'wage>=1000', 'contractLeft>26'], cd: 100, max: 3, xg: 'contract', tier: 'major', again: '연봉을 두고 협상했던 지난번에는 "{prev}" 쪽을 택했다.' }),
  ch('pc_boo_response', P, 2, ['홈 경기에서 야유가 나왔다. 관중석을 올려다보며 {name}은(는) 잠시 호흡을 골랐다.', '교체 지시를 받고 나오는 길, 스탠드에서 야유가 쏟아졌다.'], [
    cc('박수로 응답한다', ['관중을 향해 박수를 쳤다. 일부 팬들이 놀라 야유를 멈췄다.', 'rel.fans+3 stress+2'], { chk: '50 hid.social*0.2 hid.controversy*-0.2', bad: ['박수가 비꼬는 것으로 받아들여졌다.', 'rel.fans-5'] }),
    cc('고개를 숙이고 나간다', ['말없이 터널로 들어갔다.', 'stress+3 morale-3'])
  ], { cond: ['form<=5.8'], cd: 80, max: 3, xg: 'form_mental', note: 'fan', tier: 'minor' }),
  ch('pc_derby_talk', P, 3, ['더비를 앞두고 기자가 상대 팀을 도발하는 질문을 던졌다. 대답 하나가 분위기를 바꿀 수 있다.', '더비 매치 전 기자회견에서 상대 선수의 발언에 대한 의견을 물었다.'], [
    cc('도발적으로 맞받는다', ['기사 제목이 뜨거워졌다. 팬들은 환호했고 상대 팬들은 분노했다.', 'rel.fans+5 rel.media+2 stress+3'], { chk: '50 hid.bigGame*0.25 hid.controversy*-0.1', bad: ['지나친 발언이 문제가 됐다. 구단이 주의를 주었다.', 'rel.coach-3 rel.media-4 stress+4'] }),
    cc('말을 아낀다', ['"경기장에서 이야기하겠습니다."', 'rel.coach+2 stress-1 rel.fans-3 fameD-0.2'])
  ], { cond: ['lvl>=3', 'fameD>=8'], cd: 100, max: 4, xg: 'press', tier: 'minor' }),
  ch('pc_best_friend_leaves', P, 2, ['가장 친했던 동료 {mate}이(가) 다른 구단으로 이적한다고 알려 왔다. 라커룸 옆자리가 허전해질 것 같다.', '{mate}이(가) 더 큰 무대로 간다. 기쁘면서도 마음 한구석이 서운하다.'], [
    cc('진심으로 축하해 준다', ['"잘 가. 꼭 성공해라." 짧은 포옹이 오래 남았다.', 'rel.mates+4 happy+1 hid.loyalty+1'], { chk: '50 hid.social*0.2 hid.loyalty*0.1', pv: '동료 관계↑', bad: ['축하 인사가 어색했다. 서운함이 새어 나오고 말았다.', 'rel.mates-2 stress+3'] }),
    cc('티 나지 않게 서운함을 삼킨다', ['웃으며 보냈지만 훈련장은 한동안 조용했다.', 'stress+3 morale-2'])
  ], { cond: ['rel.mate1>=25'], cd: 100, max: 2, xg: 'locker_room', tier: 'minor' }),
  ch('pc_youth_advice', P, 2, ['유스 출신 후배가 진로 고민을 털어놓았다. {name}의 이야기를 듣고 싶다고 한다.', '고향 후배가 메시지를 보냈다. 프로가 되고 싶은데 어떻게 해야 하냐는 질문이다.'], [
    cc('시간을 내어 멘토링해 준다', ['후배에게 연습 방법과 마음가짐을 알려 주었다. 오랜만에 가슴이 따뜻해졌다.', 'happy+4 hid.social+1 fameD+0.2 fatigue+3'], { chk: '50 hid.social*0.2 attr.leadership*1', pv: '행복↑ 명성↑', bad: ['말이 길어져 후배에게 오히려 부담만 줬다.', 'rel.mates-2 fatigue+3'] }),
    cc('바쁘다며 짧게 답한다', ['"열심히 해 봐." 그뿐이었다.', 'stress+1 rel.mates-3 fameD-0.2'])
  ], { cond: ['age>=24'], cd: 100, max: 3, xg: 'charity', tier: 'minor' }),
  ch('pc_partner_demand', P, 3, ['{partner}이(가) 요즘 잦은 원정과 훈련 때문에 함께할 시간이 없다고 속상해했다.', '{partner}과(와) 저녁 약속을 취소한 것이 벌써 세 번째다.'], [
    cc('휴일을 온전히 함께 보낸다', ['하루를 오롯이 둘만의 시간으로 채웠다. 서로의 웃음이 돌아왔다.', 'rel.partner+8 happy+5 sharp-2'], { chk: '55 rel.partner*0.15 hid.family*0.15', pv: '연인 관계↑', bad: ['기대가 컸던 만큼 작은 말다툼에도 크게 서운해졌다.', 'rel.partner-4 stress+3'] }),
    cc('일에 집중해야 한다고 말한다', ['"곧 시즌이 끝나." 말이 끝나자 분위기가 서늘해졌다.', 'rel.partner-8 stress+4'])
  ], { cond: ['partnered'], cd: 60, max: 4, xg: 'romance', tier: 'minor' }),
  ch('pc_painkiller', P, 3, ['결승전 직전, 발목이 시큰거린다. 팀 닥터가 진통 주사를 제안했다. 뛸 수는 있지만 위험이 있다고 한다.', '중요한 경기를 앞두고 몸 상태가 완전하지 않다. 진통 주사를 맞으면 뛸 수 있다.'], [
    cc('주사를 맞고 출전한다', ['통증이 잦아든 채로 경기를 소화했다. 결과는 좋았지만 몸은 경고를 보내고 있었다.', 'sharp+3 morale+3'], { chk: '50 health*0.3 hid.injuryProne*-0.25', bad: ['경기 후 통증이 폭발했다. 부상이 악화되어 오래 쉬게 됐다.', 'fx:inj=ankle morale-6 stress+6'] }),
    cc('결장을 받아들인다', ['아쉽지만 몸을 우선했다. 감독은 고개를 끄덕였다.', 'health+3 morale-3 rel.coach+1'])
  ], { cond: ['health<=82', '!injured'], cd: 100, max: 3, xg: 'injury_care', note: 'inj_early', tier: 'minor' }),
  ch('pc_second_opinion', P, 2, ['의무팀의 진단 결과가 마음에 걸린다. 다른 병원의 의견을 들어 볼 수도 있다.', '무릎 상태에 대한 진단이 엇갈린다. 더 정확한 진단이 필요하다.'], [
    cc('외부 전문의에게 진료받는다', ['정밀 검사에서 정확한 원인을 찾았다. 치료 방향이 명확해졌다.', 'health+4 cashw-1 stress-2'], { chk: '50 health*0.1 agent*0.1', pv: '건강↑ 지출↑', bad: ['외부 의견이 의무팀 소견과 달라 혼란만 커졌다.', 'stress+5 rel.coach-3'] }),
    cc('구단 의무팀을 믿는다', ['구단 의무팀의 계획을 따르기로 했다.', 'rel.coach+1 health-1 stress+2'])
  ], { cond: ['injured', 'injweeks>=4'], cd: 100, max: 3, xg: 'injury_care', tier: 'minor' }),
  ch('pc_press_leak', P, 2, ['기자가 은밀히 접촉해 구단 내부 소식을 알려 주면 보답하겠다고 했다. 유혹적이지만 위험하다.', '{reporter}이(가) 라커룸 분위기에 대한 내밀한 이야기를 듣고 싶어 한다.'], [
    cc('정중히 거절한다', ['"그건 제가 할 말이 아닙니다." 기자는 쓴웃음을 지었다.', 'hid.pro+1 rel.coach+1 rel.media-1'], { pv: '프로의식↑' }),
    cc('조금만 알려 준다', ['사소한 이야기라 생각했다. 하지만 기사에는 훨씬 크게 실렸다.', 'rel.media+4 rel.coach-6 rel.captain-4 stress+5'], { chk: '40 hid.controversy*-0.3 hid.pro*0.2', bad: ['소식이 구단에 알려졌다. 큰 징계는 피했지만 신뢰가 깨졌다.', 'rel.coach-10 rel.captain-8 morale-6'] })
  ], { cond: ['fameD>=10'], cd: 150, max: 2, xg: 'press', note: 'media', tier: 'minor' }),
  ch('pc_ref_dispute', P, 3, ['경기 중 석연치 않은 판정이 나왔다. 감정이 올라온다. 심판에게 항의할까?', '결정적인 오심에 분노가 치밀었다. 주위의 동료들도 심판을 에워쌌다.'], [
    cc('강하게 항의한다', ['항의가 거세졌다. 결국 경고를 받았다.', 'rel.fans+2 rel.coach-1 stress+3'], { chk: '40 hid.temper*-0.4 attr.composure*1', bad: ['선을 넘었다. 퇴장 판정을 받았다.', 'fx:banned=8 rel.coach-5 morale-5'] }),
    cc('참고 경기에 집중한다', ['호흡을 가다듬고 다음 플레이에 집중했다.', 'attr.composure+0.1 hid.pro+1 stress+3'])
  ], { cond: ['hid.temper>=40'], cd: 40, max: 6, xg: 'integrity', tier: 'minor' }),
  ch('pc_alcohol_ban', P, 2, ['{coach} 감독이 선수단에 음주 금지령을 내렸다. 하지만 동료들은 몰래 모임을 갖자고 한다.', '시즌 중 술자리 금지 방침이 정해졌다. 동기들이 슬쩍 눈짓을 보낸다.'], [
    cc('감독의 지시를 따른다', ['모임에는 가지 않았다. 몸이 가볍고 평판도 올랐다.', 'rel.coach+3 hid.pro+1 drink-4 rel.mates-1'], { pv: '프로의식↑' }),
    cc('몰래 참석한다', ['분위기는 좋았지만 다음 날 훈련이 힘들었다.', 'rel.mates+4 drink+8 fatigue+6'], { chk: '55 hid.controversy*-0.2 hid.pro*0.2', bad: ['소문이 감독 귀에 들어갔다. 벌금이 부과됐다.', 'cash-30 rel.coach-6 morale-3'] })
  ], { cond: ['age>=18'], cd: 100, max: 2, xg: 'nightlife', note: 'alcohol', tier: 'minor' }),
  ch('pc_set_piece', P, 3, ['세트피스 키커 자리를 두고 팀 내 의견이 갈렸다. {name}은(는) 키커를 자청해 볼 수 있다.', '프리킥 얻은 위치가 좋다. 키커로 나서고 싶다.'], [
    cc('키커 자리를 요청한다', ['감독이 기회를 주었다. 첫 시도는?', 'attr.freeKicks+0.1 attr.penalties+0.1'], { chk: '45 attr.freeKicks*2 attr.penalties*0.5', great: ['완벽한 궤적이 골문 구석으로 꽂혔다. 이후 키커 자리는 {name}의 몫이 됐다.', 'goal+0 morale+6 rel.coach+3 rel.fans+3 fx:trait=+fkSpec'], bad: ['킥은 수비벽을 때리고 말았다. 동료들이 아쉬운 표정을 지었다.', 'morale-3 rel.captain-1'] }),
    cc('다른 선수에게 양보한다', ['팀을 위한 선택이었다.', 'rel.mates+1 morale-3 fameD-0.1'])
  ], { cond: ['!pos:GK', 'attr.freeKicks>=9'], cd: 150, max: 2, xg: 'position_role', tier: 'minor' }),
  ch('pc_shirt_number', P, 2, ['새 시즌 등번호를 정해야 한다. 어떤 번호를 받을까?', '용품 담당이 등번호 희망표를 내밀었다. 고민이 길어졌다.'], [
    cc('좋아하는 번호를 고집한다', ['오랜 애착이 있던 번호를 받았다. 마음이 안정됐다.', 'morale+3 hid.loyalty+1'], { chk: '65 rel.captain*0.1', bad: ['원하는 번호는 선배가 갖고 있었다. 눈치가 보였다.', 'rel.mates-2'] }),
    cc('감독이 주는 번호를 받는다', ['"어떤 번호든 제 것으로 만들겠습니다."', 'rel.coach+2 morale-2 followers-1'])
  ], { cond: ['preseason', 'age>=18'], cd: 200, max: 2, xg: 'club_identity', tier: 'minor' }),
  ch('pc_media_training', P, 2, ['구단이 미디어 트레이닝 교육을 마련했다. 하루 종일 걸린다.', '구단 홍보팀이 선수들에게 인터뷰 교육을 제안했다.'], [
    cc('성실하게 참여한다', ['말을 조심스럽고 간결하게 하는 법을 배웠다.', 'rel.media+2 attr.composure+0.1 hid.controversy-2'], { chk: '55 hid.controversy*-0.2 hid.pro*0.2', pv: '언론 관계↑', bad: ['교육 내용이 머리에 들어오지 않았다. 하루가 길었다.', 'fatigue+4 stress+2'] }),
    cc('요령껏 빠진다', ['개인 훈련이 있다는 핑계로 빠져나왔다.', 'stress-1 hid.controversy+1 rel.media-2 rel.director-2'])
  ], { cond: ['fameD>=5'], cd: 200, max: 1, xg: 'press', note: 'media', tier: 'minor' }),
  ch('pc_teammate_loan', P, 3, ['동료 {mate}이(가) 조심스럽게 큰돈을 빌려 달라고 했다. 사정이 급해 보인다.', '라커룸에서 {mate}이(가) 다급한 표정으로 도움을 청했다. 사업이 어려워졌다고 한다.'], [
    cc('빌려준다', ['큰 부담이 되는 금액이지만 믿기로 했다. 시간이 지나면 어떻게 될까.', 'cashy-0.25 rel.mates+10 fu:loan_repay@12-36'], { chk: '50 rel.mates*0.2 hid.thrift*-0.1', pv: '동료 관계↑↑ 현금↓ 상환 불이행 위험', bad: ['돈을 건넨 뒤 동료와 연락이 뜸해졌다. 상환 약속은 흐지부지됐다.', 'cashy-0.25 rel.mates-5 stress+4'], worst: ['동료는 어느새 구단을 떠났다. 돈도, 연락도 돌아오지 않았다.', 'cashy-0.25 rel.mates-12 stress+6 hid.thrift+3'] }),
    cc('정중히 거절한다', ['"미안하다. 돈 거래는 하지 않기로 했어." 분위기가 서늘해졌다.', 'rel.mates-6 hid.thrift+1'])
  ], { cond: ['cash>=3000', 'rel.mate1>=15'], cd: 100, max: 2, xg: 'family_money', tier: 'major' }),
  pa('loan_repay', P, 1, ['{mate}이(가) 빌린 돈의 일부를 갚았다. 오래 걸렸지만 약속을 지켰다. 마음이 편해졌다.', '{mate}이(가) 봉투를 건넸다. "덕분에 살았다." 관계가 한층 단단해졌다.'], 'cashy+0.15 rel.mates+4', { sched: true, max: 3 }),
  ch('pc_family_business', P, 2, ['아버지가 작은 사업을 확장하고 싶다며 조심스럽게 도움을 청했다. 거절하기도 어려운 이야기다.', '가족이 새로운 가게 이야기를 꺼냈다. 목돈이 필요하다고 한다.'], [
    cc('투자해 준다', ['"잘되면 같이 웃자고요." 아버지의 눈가가 촉촉해졌다.', 'cashy-0.3 rel.father+8 rel.mother+4 hid.family+1 fu:fu_money@12-30'], { chk: '45 hid.thrift*-0.1', pv: '가족 관계↑ 현금↓', bad: ['사업은 기대만큼 풀리지 않았다. 아버지가 미안해했다.', 'rel.father+3 stress+4 fu:fu_money@12-30'] }),
    cc('정중히 사양한다', ['"차라리 생활비를 드릴게요." 아버지는 웃으며 고개를 끄덕였다.', 'rel.father-1 fu:fu_money@12-30'])
  ], { cond: ['cash>=5000', 'age>=20'], cd: 150, max: 2, xg: 'family_money', tier: 'major' }),
  ch('pc_sibling_dream', YP, 2, ['동생이 {name}처럼 선수가 되고 싶다고 했다. 어떻게 도와줄 수 있을까?', '{sibling}이(가) 유소년 클럽에 지원하고 싶다고 한다. 응원이 필요한 순간이다.'], [
    cc('직접 훈련을 도와준다', ['공을 같이 차며 어린 시절이 떠올랐다. 동생이 활짝 웃었다.', 'rel.sibling1+8 happy+5 fatigue+3'], { chk: '55 hid.family*0.15 health*0.1 fatigue*-0.2', pv: '가족 관계↑', bad: ['욕심에 무리하게 시켰다가 동생이 다치고 말았다.', 'rel.sibling1-4 stress+4 fatigue+4'] }),
    cc('현실적인 조언을 해 준다', ['"쉬운 길은 아니야." 동생이 고개를 끄덕였다.', 'rel.sibling1+2 stress+1 rel.sibling1-1 happy-1'])
  ], { cond: ['rel.sibling1>=10', 'age>=18'], cd: 150, max: 1, xg: 'charity', tier: 'minor' }),
  ch('pc_agent_switch', P, 2, ['최근 에이전트가 연락도 뜸하고 협상도 성과가 없다. 다른 에이전트의 접근이 있었다.', '에이전트의 실적이 아쉽다. 새로운 에이전트가 더 좋은 조건을 제시했다.'], [
    cc('에이전트를 바꾼다', ['기존 에이전트와 이별하고 새 에이전트와 계약했다. 위약금이 조금 발생했다.', 'fx:newAgent cashw-2 stress+3'], { chk: '50 agent*0.2 hid.social*0.1', pv: '협상력 변동', bad: ['새 에이전트는 기대에 못 미쳤고 위약금 분쟁까지 생겼다.', 'fx:newAgent=bad cashw-3 stress+5'] }),
    cc('현재 에이전트를 믿는다', ['신뢰를 지키기로 했다.', 'rel.agent+4 val-2 stress+2'])
  ], { cond: ['hasAgent', 'agentSkill<=45'], cd: 150, max: 2, xg: 'agent', note: 'agent_fee', tier: 'minor' }),
  ch('pc_party_photos', P, 2, ['동료의 생일 파티 사진이 SNS에 올라왔다. {name}의 모습도 찍혀 있다. 구단이 알게 되면 곤란할 수도 있다.', '파티장에서 찍힌 사진이 떠돌고 있다. 다음 날 경기가 있는 밤이었다.'], [
    cc('게시물 삭제를 요청한다', ['정중히 요청해 사진은 내려갔다. 가슴을 쓸어내렸다.', 'rel.mates-1 stress+1'], { chk: '60 rel.mates*0.2' }),
    cc('감독에게 먼저 이야기한다', ['솔직히 말하자 감독은 "다음엔 주의하라"며 넘어갔다.', 'rel.coach+1 hid.pro+1 rel.mates-3 stress+2']),
    cc('그냥 둔다', ['큰일은 없을 거라 생각했지만 며칠 뒤 기사가 났다.', 'rel.media-3 rel.coach-3 stress+3'], { chk: '55 hid.controversy*-0.2', bad: ['큰 논란으로 번졌다.', 'rel.fans-5 rel.coach-6 cash-50'] })
  ], { cond: ['drink>=15', 'fameD>=8'], cd: 100, max: 2, xg: 'nightlife', note: 'media', tier: 'minor' }),
  ch('pc_sick_child_visit', P, 2, ['팬 가족이 투병 중인 아이를 위해 {name}의 방문을 요청했다. 일정은 빠듯하지만 의미 있는 일이다.', '병원에서 아이가 {name}을(를) 보고 싶어 한다는 연락이 왔다.'], [
    cc('시간을 내어 방문한다', ['아이의 눈이 반짝였다. 짧은 만남이었지만 오래 마음에 남았다.', 'happy+5 rel.fans+5 fameD+0.4 hid.family+1'], { chk: '60 hid.social*0.15 hid.family*0.1 fatigue*-0.2', pv: '행복↑ 팬 관계↑', bad: ['일정이 빠듯해 병원에 늦게 도착했다. 가족이 괜찮다고 했지만 마음이 편치 않았다.', 'fatigue+6 rel.coach-2 stress+3'] }),
    cc('사인한 유니폼만 보낸다', ['일정상 어려워 유니폼과 편지를 보냈다.', 'rel.fans+2 rel.media-2 hid.family-1'])
  ], { cond: ['fameD>=12'], cd: 150, max: 2, xg: 'charity', heavy: true, help: '아프거나 힘든 일을 겪는 사람을 마주하면 감정이 크게 흔들릴 수 있습니다. 감정이 무겁다면 가까운 사람이나 전문 상담 기관과 나눠 보세요.', tier: 'minor' }),
  ch('pc_academy_visit', P, 2, ['모교 유소년팀에서 {name}의 방문을 요청했다. 후배들 앞에서 이야기를 해 달라고 한다.', '고향 유소년 클럽이 초청했다. 아이들의 눈빛이 기대로 가득하다.'], [
    cc('방문해 이야기를 들려준다', ['아이들이 쏟아내는 질문에 땀을 뺐다. 의외로 가르치는 일이 즐거웠다.', 'happy+5 hid.social+1 fameD+0.3 rel.fans+2 postSkill+1'], { chk: '60 hid.social*0.2 hid.pro*0.1 fatigue*-0.2', pv: '행복↑ 지도 감각↑', bad: ['즉석 질문에 말문이 막혔다. 모교 후배들의 반응이 시큰둥했다.', 'happy-2 stress+3 fatigue+4'] }),
    cc('일정을 이유로 정중히 거절한다', ['아쉽지만 훗날을 기약했다.', 'stress-1 rel.fans-2 fameD-0.2'])
  ], { cond: ['age>=22', 'fameD>=10'], cd: 150, max: 3, xg: 'charity', tier: 'minor' })
];
