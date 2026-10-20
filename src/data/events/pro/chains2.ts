import type { RawEvent } from '../../schema';
import { cc, ch, pa, HELP_ADDICT } from '../helpers';

const P: ('pro')[] = ['pro'];
const YP: ('youth' | 'pro')[] = ['youth', 'pro'];
const K = 'chain-step' as const;

export const chains2: RawEvent[] = [
  pa('nc_1', P, 2, ['대표팀 명단 발표 후 {name}의 발탁을 둘러싼 논란이 일었다. "자격이 있는가"를 두고 커뮤니티가 갈렸다.', '대표팀 발탁 소식이 전해지자 일부 언론은 "시기상조"라고 지적했다. 소란이 만만치 않다.'], 'rel.media-3 stress+5 fu:nc_2@1-3', { kind: K, chain: 'nat_controversy', cond: ['caps<=2', 'fameD>=8', 'age>=18', 'lvl>=2', 'ovr>=45'], cd: 400, max: 1, note: 'nat_call' }),
  ch('nc_2', P, 1, ['소집 전 기자회견장. 기자들이 발탁 논란에 대한 입장을 물었다. 모든 카메라가 {name}을(를) 향하고 있다.', '대표팀 합류를 앞두고 언론이 발탁 이유를 캐묻는다.'], [
    cc('실력으로 증명하겠다고 답한다', ['"결과로 말씀드리겠습니다." 침착한 답변이 인상적이었다.', 'rel.media+3 rel.fans+2 stress+2 fu:nc_3@4-8'], { chk: '50 attr.composure*1 hid.bigGame*0.2', bad: ['긴장한 탓에 답이 어색했다. 인터뷰가 자꾸 회자됐다.', 'rel.media-3 stress+4 fu:nc_3b@4-8'] }),
    cc('논란에 정면으로 반박한다', ['단호한 어조로 반박했다. 일부는 박수를, 일부는 비판을 보냈다.', 'rel.fans+3 rel.media-4 stress+4 fu:nc_3@4-8'], { chk: '42 hid.controversy*-0.3', bad: ['반박이 과열되면서 대표팀 코칭스태프가 난처해했다.', 'rel.natcoach-6 rel.media-6 fu:nc_3b@4-8'] }),
    cc('말을 아낀다', ['"감독님의 선택을 존중합니다."', 'stress+1 fu:nc_3@4-8'])
  ], { kind: K, chain: 'nat_controversy', sched: true, max: 1 }),
  pa('nc_3', P, 1, ['대표팀 경기에서 {name}이(가) 제 몫을 해냈다. 논란은 박수 소리에 묻혔다. 기사 제목이 바뀌었다.', '데뷔전에서 안정적인 활약을 펼치며 의심을 일부 지웠다.'], 'fameD+1.5 rel.natcoach+5 rel.media+4 morale+6', { kind: K, chain: 'nat_controversy', sched: true, max: 1, cond: ['form>=6.4'] }),
  pa('nc_3b', P, 1, ['대표팀 경기에서 {name}의 활약은 아쉬웠다. 논란은 다시 불붙었다. 자신을 증명할 기회는 다음으로 미뤄졌다.', '소집 기간 내내 부진하며 비판이 이어졌다. 마음이 가라앉았다.'], 'rel.media-4 morale-5 stress+5', { kind: K, chain: 'nat_controversy', sched: true, max: 1, cond: ['form<6.4'] }),

  ch('ga_1', P, 2, ['원정 호텔에서 동료들이 카지노로 간다며 함께 가자고 했다. 가볍게 구경만 하자고 한다.', '동료의 지인이 운영하는 도박 모임이 있다고 한다. 가볍게 즐기는 정도라고 했다.'], [
    cc('따라가 본다', ['처음엔 호기심이었다. 칩 몇 개가 순식간에 불어났다. 묘한 짜릿함이 남았다.', 'rel.mates+2 cashw-1 happy+3 fu:ga_2@8-20'], { chk: '45 hid.pro*0.2 hid.thrift*0.15', pv: '위험 신호', bad: ['분위기에 휩쓸려 지갑이 가벼워졌다.', 'rel.mates+2 cashw-3 stress+4 fu:ga_2@6-14'] }),
    cc('구경만 한다', ['옆에서 웃으며 지켜봤지만 손은 대지 않았다.', 'rel.mates+1 happy-1 stress+1']),
    cc('거절한다', ['"난 쉬겠다." 동료들이 웃으며 손을 흔들었다.', 'hid.pro+1 stress-1 rel.mates-3'])
  ], { cond: ['hid.pro<=70', 'wage>=1500', 'age>=19'], cd: 400, max: 1, note: 'gambling', heavy: true, help: HELP_ADDICT, kind: K, chain: 'gambling', tier: 'major' }),
  ch('ga_2', P, 1, ['도박은 어느새 일상이 되었다. 잃은 돈을 되찾아야 한다는 생각이 머리를 떠나지 않는다. 계좌는 점점 비어 간다.', '새벽까지 이어진 판. 잃은 금액이 생각보다 커져 있다. 손이 떨렸다.'], [
    cc('여기서 멈추고 도움을 청한다', ['가까운 사람에게 털어놓고 전문 상담을 받기로 했다. 쉽지 않았지만 첫걸음을 뗐다.', 'stress+4 rel.mother+3 cashw-1 fu:ga_3a@8-20'], { pv: '회복 시작' }),
    cc('한 번만 더 만회하려 한다', ['"이번엔 달라." 그러나 결과는 더 나빴다.', 'cash-120 debt+60 stress+8 fu:ga_3b@6-16'], { chk: '25 hid.pro*0.15 hid.thrift*0.2', bad: ['빚이 늘고 말았다. 마음이 무너졌다.', 'cash-250 debt+150 stress+14 fu:ga_3b@6-16'] })
  ], { kind: K, chain: 'gambling', sched: true, max: 1, heavy: true, help: HELP_ADDICT, note: 'gambling' }),
  pa('ga_3a', P, 1, ['상담과 가족의 도움 덕분에 손을 뗐다. 쉽지 않은 시간이었지만 몸과 마음이 조금씩 안정되었다. 이제는 건강한 일상이 낯설지 않다.', '전문 치료와 주변의 지지로 위기를 넘겼다. 아침 공기가 달라졌다.'], 'stress-10 happy+6 rel.mother+5 hid.pro+3 hid.thrift+3', { kind: K, chain: 'gambling', sched: true, max: 1, heavy: true, help: HELP_ADDICT }),
  pa('ga_3b', P, 1, ['빚과 소문이 쌓였다. 구단이 경고했고 에이전트와 가족은 큰 충격에 빠졌다. 이제는 정말로 도움이 필요하다.', '결국 구단이 알게 되었다. 징계와 면담이 이어졌다. 삶이 크게 흔들린다.'], 'debt+80 stress+10 morale-8 rel.coach-6 rel.mother-3 happy-8 hid.pro-3', { kind: K, chain: 'gambling', sched: true, max: 1, heavy: true, help: HELP_ADDICT }),

  ch('sns_1', YP, 2, ['새벽에 감정이 앞서 SNS에 글을 올렸다. 일부 표현이 문제가 될 수 있다. 팔로워들의 반응이 뜨겁다.', '경기 후 홧김에 올린 글이 순식간에 퍼졌다. 알림이 멈추지 않는다.'], [
    cc('즉시 삭제하고 사과한다', ['글을 지우고 진심 어린 사과문을 올렸다. 여론이 일부 누그러졌다.', 'rel.fans-1 rel.media+1 stress+4 fu:sns_2@2-5'], { chk: '50 hid.controversy*-0.2 hid.pro*0.1', pv: '피해 최소화', bad: ['사과문이 오히려 논란을 키웠다.', 'rel.fans-4 rel.media-4 stress+6 fu:sns_2@2-5'] }),
    cc('그대로 둔다', ['"내 생각을 말한 것뿐이다." 논란이 점점 커졌다.', 'rel.fans-6 rel.media-6 followers+60 stress+6 fu:sns_2@1-3'])
  ], { cond: ['followers>=100', 'hid.controversy>=45', 'age>=15'], cd: 300, max: 1, note: 'media', kind: K, chain: 'sns_scandal', tier: 'major' }),
  ch('sns_2', YP, 1, ['구단이 {name}을(를) 불러 SNS 사용 문제를 짚었다. 징계 수위를 논의한다는 이야기도 나왔다.', '{coach} 감독이 면담을 요청했다. 표정이 평소보다 굳어 있다.'], [
    cc('책임을 인정하고 징계를 받아들인다', ['태도를 바로 잡겠다고 약속했다. 징계는 경고 수준에서 마무리됐다.', 'rel.coach+2 hid.pro+2 hid.controversy-3 cash-30'], { pv: '프로의식↑' }),
    cc('억울함을 호소한다', ['구단은 냉랭하게 반응했다. 벌금이 부과됐다.', 'rel.coach-5 cash-80 stress+4'], { chk: '40 hid.controversy*-0.3 rel.coach*0.2', bad: ['항변이 구단의 신뢰를 더 떨어뜨렸다.', 'rel.coach-8 stress+6 cash-150'] })
  ], { kind: K, chain: 'sns_scandal', sched: true, max: 1 }),
  pa('sns_apology', YP, 1, ['여론이 점차 가라앉았다. 이번 일로 말과 글의 무게를 새삼 느꼈다. 휴대폰 알림을 한동안 꺼 두었다.', '사과문이 받아들여졌고 댓글 분위기도 누그러졌다. 이후 SNS 사용에 훨씬 조심스러워졌다.'], 'hid.controversy-4 rel.fans+2 stress-3', { kind: K, chain: 'sns_scandal', sched: true, max: 4 }),

  pa('hs_1', P, 3, ['첫 겨울, 낯선 도시, 언어는 아직 서툴고 연락은 뜸해진다. 창밖의 눈을 바라보며 가족을 떠올렸다. 향수병이 찾아왔다.', '이국땅의 밤은 유난히 길다. 숙소 불을 끄고 누웠지만 눈이 감기지 않는다.'], 'happy-6 stress+5 sleep-4 fu:hs_2@3-8', { kind: K, chain: 'homesick', cond: ['abroad', 'hid.adapt<=60', 'age>=17'], cd: 300, max: 1, note: 'abroad_adapt' }),
  ch('hs_2', P, 1, ['향수병이 훈련과 경기에까지 영향을 주기 시작했다. 감독도 눈치를 챘다. 어떻게 극복할지 결정해야 한다.', '자꾸만 집 생각이 난다. 훈련 중에도 집중이 흐트러진다.'], [
    cc('가족을 초청한다', ['가족이 방문한 며칠 동안 마음이 놓였다.', 'happy+10 stress-8 rel.mother+4 cashw-2 fu:hs_3a@6-14'], { pv: '행복↑ 지출↑' }),
    cc('현지 친구를 사귀며 적응한다', ['팀 동료들과 식사를 하며 조금씩 마음을 열었다.', 'rel.mates+6 fx:langUp=6 hid.adapt+3 fu:hs_3a@8-18'], { chk: '45 hid.social*0.3 hid.adapt*0.2', bad: ['쉽지 않았다. 외로움은 더 깊어졌다.', 'happy-4 fu:hs_3b@6-14'] }),
    cc('귀국을 요청한다', ['구단에 사정을 이야기하고 이적을 요청했다.', 'stress+4 rel.coach-4 fu:hs_3b@2-6'])
  ], { kind: K, chain: 'homesick', sched: true, max: 1 }),
  pa('hs_3a', P, 1, ['시간이 지나면서 새 환경이 익숙해졌다. 이제는 이 도시가 제2의 고향처럼 느껴진다. 현지 언어로 농담을 던지는 날도 늘었다.', '향수병은 어느새 옅어졌다. 새 동료들은 가족 같은 존재가 되었다.'], 'happy+8 stress-6 hid.adapt+3 morale+4', { kind: K, chain: 'homesick', sched: true, max: 1 }),
  pa('hs_3b', P, 1, ['적응하지 못한 채 시간이 흘렀다. 구단과 에이전트가 새 팀을 찾기 시작했다. 돌아가야 할 때가 온 것 같다.', '결국 해외 생활을 정리하기로 했다. 짐을 싸는 마음은 아쉬움 반, 안도 반이었다.'], 'fx:offers=many happy-2 stress+3', { kind: K, chain: 'homesick', sched: true, max: 1 }),

  ch('sp_1', P, 2, ['글로벌 브랜드가 장기 후원 계약을 제안했다. 금액도 조건도 훌륭하다. 대신 이미지 관리 조항이 빡빡하다.', '유명 스포츠 브랜드가 {name}의 에이전트에게 파격적인 후원 제안을 보냈다.'], [
    cc('계약한다', ['후원 계약서에 사인했다. 광고 촬영 일정이 줄줄이 잡혔다.', 'sponsor+2500 followers+80 fameD+0.8 stress+2 fu:sp_2@16-40'], { chk: '45 agent*0.2 hid.controversy*-0.15', pv: '수입↑ 이미지 조항', bad: ['이미지 관리 조항 위반 시비로 위약금 협상이 시작됐다.', 'sponsor+1200 stress+6 rel.media-3 fu:sp_2@8-20'] }),
    cc('거절한다', ['자유로운 편이 낫다고 판단했다.', 'hid.pro+1 val-2 fameD-0.5'])
  ], { cond: ['fameD>=18', 'age>=19'], cd: 300, max: 1, kind: K, chain: 'sponsor_breach', tier: 'major' }),
  ch('sp_2', P, 1, ['후원사가 최근 논란과 부진을 이유로 경고 서한을 보냈다. 이미지 조항 위반이라는 주장이다.', '후원사 담당자가 급히 연락했다. "최근 이미지가 계약 취지와 다르다"는 이야기다.'], [
    cc('공개 사과하고 캠페인에 협조한다', ['기꺼이 사과하고 추가 촬영에 응했다. 후원사의 분위기가 풀렸다.', 'fatigue+4 rel.fans-1 fu:sp_3a@4-10'], { chk: '48 hid.controversy*-0.2 agent*0.2', bad: ['사과는 받아들여졌지만 신뢰는 회복되지 않았다.', 'fu:sp_3b@4-10'] }),
    cc('에이전트를 통해 법적으로 대응한다', ['에이전트가 변호사를 선임했다. 협상이 이어졌다.', 'cashw-2 stress+4 fu:sp_3b@4-10'], { chk: '40 agent*0.3', bad: ['협상은 평행선이었다.', 'fu:sp_3b@4-10'] })
  ], { kind: K, chain: 'sponsor_breach', sched: true, max: 1 }),
  pa('sp_3a', P, 1, ['후원 계약이 유지됐다. 오히려 조건이 일부 개선됐다. 이번 일로 이미지 관리의 중요성을 깨달았다.', '후원사가 신뢰를 회복했다며 계약을 연장했다.'], 'sponsor+500 hid.controversy-2 stress-3', { kind: K, chain: 'sponsor_breach', sched: true, max: 1 }),
  pa('sp_3b', P, 1, ['후원 계약이 일방적으로 파기됐다. 위약금 분쟁이 이어지며 수입이 줄었다. 에이전트가 새로운 후원사를 알아보고 있다.', '후원사와의 계약이 결국 종료됐다. 광고 수입이 사라졌다.'], 'sponsor-2500 cash-150 stress+6 rel.fans-2', { kind: K, chain: 'sponsor_breach', sched: true, max: 1 }),

  ch('is_1', P, 2, ['오랜 지인이 확실한 고수익 투자 상품을 소개했다. "친구니까 알려 주는 거야. 원금 보장에 월 5%야." 솔깃하지만 어딘가 미심쩍다.', '고향 선배가 새 사업 투자를 권했다. 수익률 이야기가 지나치게 좋다.'], [
    cc('소액만 투자한다', ['큰돈은 아니지만 일단 시험 삼아 넣어 보기로 했다.', 'cashy-0.08 fu:is_2@6-12'], { pv: '위험 낮음' }),
    cc('큰돈을 투자한다', ['"기회는 놓치면 안 된다." 목돈을 보냈다.', 'cashy-0.35 fu:is_2@6-12'], { chk: '30 hid.thrift*-0.2 agent*0.2 attr.vision*0.3', pv: '위험 높음 수익 기대↑ 사기 위험', great: ['계약서의 이상한 조항을 알아채고 전액이 아닌 일부만 넣고 빠져나왔다.', 'cashy-0.1 hid.thrift+2 fu:is_3a@4-8'], bad: ['달콤한 수익 설명 뒤에 숨은 허점이 보이지 않았다. 목돈이 곧바로 묶였다.', 'cashy-0.35 stress+6 fu:is_3b@3-8'], worst: ['연락이 끊기기까지 몇 주도 걸리지 않았다. 목돈 대부분이 사라졌다.', 'cashy-0.5 fx:fraudLoss=0.4 stress+10 hid.thrift+3'] }),
    cc('거절한다', ['"난 모르는 데는 투자 안 해." 상대는 서운해했다.', 'hid.thrift+2 rel.mates-2 happy-1'])
  ], { cond: ['cash>=3000', 'age>=20', 'hid.thrift<=70'], cd: 400, max: 1, note: 'broke', kind: K, chain: 'investment_scam', tier: 'major' }),
  ch('is_2', P, 1, ['첫 수익금이 정확히 약속된 날짜에 입금됐다. 투자 권유자가 "이번에 추가 투자하면 더 크게 불릴 수 있다"고 말한다.', '수익금이 제때 들어왔다. 믿음이 생겼다. 주변 지인들도 가입했다고 한다.'], [
    cc('추가 투자를 한다', ['수익에 눈이 멀었다. 더 큰 금액을 보냈다.', 'cashy-0.3 fu:is_3b@8-20'], { pv: '위험↑↑↑' }),
    cc('수익만 챙기고 빠진다', ['"충분히 벌었다." 투자금을 회수했다. 연락이 끊기기 전에 정리할 수 있었다.', 'cashy+0.05 hid.thrift+2 fu:is_3a@4-8'], { chk: '48 hid.thrift*0.2 agent*0.15 postSkill*0.1', bad: ['환매 요청이 지연됐다. 불안감이 커졌다.', 'stress+5 fu:is_3b@4-12'] })
  ], { kind: K, chain: 'investment_scam', sched: true, max: 1 }),
  pa('is_3a', P, 1, ['얼마 뒤 해당 투자 업체가 사기 혐의로 수사받는다는 뉴스가 나왔다. 일찍 빠져나온 덕분에 피해를 피했다. 가슴을 쓸어내렸다.', '투자 업체가 폐쇄되고 대표가 구속됐다. 다행히 이미 빠져나온 뒤였다.'], 'hid.thrift+3 stress-3', { kind: K, chain: 'investment_scam', sched: true, max: 1, note: 'broke' }),
  pa('is_3b', P, 1, ['투자 업체 대표가 잠적했다. 투자금은 돌려받을 길이 막막하다. 지인에게 속았다는 사실이 가장 아팠다.', '사기 사건이 터졌다. 수익금도 원금도 모두 사라졌다.'], 'fx:fraudLoss=0.45 stress+12 happy-8 hid.thrift+4', { kind: K, chain: 'investment_scam', sched: true, max: 1, note: 'broke' }),

  pa('dope_1', P, 1, ['도핑 검사 결과가 통보됐다. 시료에서 금지 성분이 미량 검출됐다는 내용이다. 머릿속이 하얘졌다.', '리그 사무국에서 도핑 양성 반응 통보가 도착했다. 기억을 더듬어 보지만 짚이는 것이 하나뿐이다.'], 'fx:doping stress+10 morale-8 fu:dope_2@1-2', { kind: K, chain: 'doping', sched: true, max: 2, note: 'doping' }),
  ch('dope_2', P, 1, ['소명할 기회가 주어졌다. 변호사는 오염된 보충제를 근거로 소명할 수 있다고 했다. 어떤 길을 택할 것인가?', '징계위원회가 소명서를 요구한다. 진실을 정직하게 밝혀야 한다.'], [
    cc('오염된 보충제를 근거로 소명한다', ['성분 분석 결과와 구매 기록을 제출했다.', 'cashw-3 stress+4 fu:dope_3a@4-8'], { chk: '45 hid.pro*0.2 agent*0.15', bad: ['소명이 받아들여지지 않았다.', 'fu:dope_3b@4-8'] }),
    cc('사실을 인정하고 처분을 받아들인다', ['정직하게 모든 것을 밝혔다. 징계 수위가 일부 감경됐다.', 'hid.pro+2 stress+4 fu:dope_3b@4-8'])
  ], { kind: K, chain: 'doping', sched: true, max: 2, note: 'doping' }),
  pa('dope_3a', P, 1, ['징계위원회가 소명을 받아들여 경고와 짧은 출전 정지로 마무리했다. 진실이 밝혀졌다는 사실에 안도했다.', '조사 결과 오염된 보충제가 확인됐다. 출전 정지는 짧게 끝났다.'], 'fx:banned=4 stress-6 rel.fans+2', { kind: K, chain: 'doping', sched: true, max: 2 }),
  pa('dope_3b', P, 1, ['장기 출전 정지가 확정됐다. 후원사는 이탈했고 팬들은 실망했다. 시간이 오래 걸리겠지만 다시 일어서야 한다.', '징계 결과가 발표됐다. 몇 달 동안 그라운드를 밟을 수 없다.'], 'fx:banned=26 sponsor-1000 val-25 fameD-5 rel.fans-10 rel.media-8 stress+8', { kind: K, chain: 'doping', sched: true, max: 2 }),

  ch('mt_1', YP, 3, ['베테랑 선수가 {name}에게 개인적인 멘토링을 제안했다. 식단, 수면, 훈련 습관까지 점검해 주겠다고 한다.', '팀 최고참이 {name}의 훈련 방식에 대해 이야기를 건넸다. 도와주겠다는 이야기였다.'], [
    cc('멘토링을 받는다', ['매일 함께 훈련하며 많은 것을 배웠다.', 'hid.pro+2 attr.positioning+0.2 attr.composure+0.15 rel.captain+4 fu:mt_2@16-30'], { chk: '55 hid.pro*0.2 hid.social*0.1', bad: ['멘토의 방식은 나와 잘 맞지 않았다.', 'stress+4 fu:mt_2@16-30'] }),
    cc('혼자 해 보겠다고 한다', ['고마움을 전하며 정중히 사양했다.', 'rel.captain-1'])
  ], { cond: ['age>=17', 'age<=24'], cd: 300, max: 1, kind: K, chain: 'mentor', tier: 'major' }),
  pa('mt_2', YP, 1, ['시즌이 흐르는 동안 멘토의 가르침은 {name}의 습관을 서서히 바꿨다. 지치지 않는 몸, 흔들리지 않는 마음. 달라졌다는 이야기가 들렸다.', '멘토와 함께한 훈련이 쌓이면서 경기 중 판단이 빨라졌다.'], 'attr.composure+0.2 attr.positioning+0.2 hid.pro+2 fu:mt_3@12-26', { kind: K, chain: 'mentor', sched: true, max: 1 }),
  ch('mt_3', YP, 1, ['멘토가 시즌 후 은퇴(혹은 이적)를 발표했다. 마지막 훈련 후 조용히 불러 한마디를 남겼다.', '멘토가 팀을 떠난다. 작별 인사가 다가오자 아쉬움이 몰려왔다.'], [
    cc('감사 편지를 쓴다', ['손으로 쓴 편지를 건네자 멘토는 말없이 어깨를 두드렸다.', 'rel.captain+8 happy+4 hid.loyalty+2 attr.leadership+0.2'], { chk: '55 hid.social*0.2 hid.loyalty*0.1', pv: '관계↑', bad: ['편지가 어색하게 읽혔다. 오히려 거리감이 커졌다.', 'rel.captain-2 stress+2'] }),
    cc('담담하게 인사한다', ['"그동안 감사했습니다." 짧은 인사였지만 진심이었다.', 'rel.captain+3 happy-2'])
  ], { kind: K, chain: 'mentor', sched: true, max: 1 }),

  pa('child_birth', YP, 1, ['{partner}이(가) 건강한 아이를 낳았다. 병원 복도에서 처음 아이를 안았을 때, 세상 모든 소리가 사라졌다.', '아이가 태어났다. 작고 따뜻한 손이 손가락을 쥐었다. 그 순간부터 모든 것이 달라졌다.'], 'fx:child hid.family+3 happy+8', { sched: true, max: 4, cond: ['married'] })
];
