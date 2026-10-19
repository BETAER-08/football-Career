import type { RawEvent } from '../../schema';
import { cc, ch, pa } from '../helpers';

const P: ('pro')[] = ['pro'];
const K = 'chain-step' as const;

export const chains1: RawEvent[] = [
  ch('af_1', P, 3, ['에이전트 {agent}이(가) 재정 관리까지 맡아 주겠다고 제안했다. "선수는 운동만 하면 되잖아요." 위임장 한 장이면 된다.', '{agent}이(가) 세금과 투자까지 한 번에 관리해 주겠다고 했다. 믿음직하지만 서류가 많다.'], [
    cc('전부 맡긴다', ['서류에 서명했다. 신경 쓸 일이 확 줄었다.', 'rel.agent+4 stress-3 flag:af_trust fu:af_2@14-34'], { pv: '편의↑ 위험 숨어 있음' }),
    cc('일부만 맡긴다', ['세금 업무만 맡기고 나머지는 직접 챙기기로 했다.', 'rel.agent+1 hid.thrift+1']),
    cc('직접 관리한다', ['"돈은 제가 챙길게요." 에이전트는 어깨를 으쓱했다.', 'hid.thrift+2 rel.agent-1'])
  ], { kind: K, chain: 'agent_fraud', cond: ['hasAgent', 'age>=19', 'cash>=3000', 'agentSkill<=75'], cd: 400, max: 1, note: 'agent_fraud' }),
  ch('af_2', P, 1, ['통장 입출금 내역에 낯선 항목이 몇 건 눈에 띄었다. 에이전트가 관리하는 계좌다.', '명세서를 훑어보다 이상한 이체 내역을 발견했다. 설명 없이 반복된 금액들이다.'], [
    cc('{agent}에게 직접 묻는다', ['에이전트는 "수수료와 세금 문제"라고 얼버무렸다. 설명이 매끄럽지 않다.', 'rel.agent-6 stress+5 fu:af_3a@8-16'], { chk: '42 attr.vision*0.5 hid.thrift*0.2 hid.pro*0.1', great: ['정곡을 찌르는 질문에 에이전트가 당황했다. 해명 요구서에 서명을 받아 냈다.', 'rel.agent-8 stress+2 fu:af_3b@2-6'] }),
    cc('회계사에게 감사를 의뢰한다', ['전문가의 조사가 시작됐다. 비용은 들지만 마음이 놓인다.', 'cashw-2 stress+2 fu:af_3b@4-10'], { pv: '지출↑ 피해 최소화' }),
    cc('모른 척 넘어간다', ['괜한 의심이라 믿고 싶었다.', 'stress+3 fu:af_3a@10-22'])
  ], { kind: K, chain: 'agent_fraud', sched: true, cond: ['flag:af_trust', 'hasAgent'], max: 1 }),
  pa('af_3a', P, 1, ['에이전트가 사라졌다. 전화는 꺼져 있고 사무실은 비어 있다. 계좌에는 손쓸 수 없는 금액이 빠져나가 있었다.', '조사 결과 에이전트가 오랫동안 돈을 빼돌려 왔다는 사실이 드러났다.'], 'fx:agentFraud stress+12 morale-8 happy-8 fu:af_4@4-12', { kind: K, chain: 'agent_fraud', sched: true, max: 1, note: 'agent_fraud' }),
  pa('af_3b', P, 1, ['감사 결과 몇몇 이체가 부적절했음이 확인됐다. 피해는 일부에 그쳤고 에이전트와의 계약은 해지됐다.', '조사로 문제가 일찍 드러나 큰 손실은 막았다. 에이전트는 관계를 정리하겠다고 했다.'], 'fx:agentGone cashy-0.05 stress+4 fu:af_4@4-12', { kind: K, chain: 'agent_fraud', sched: true, max: 1 }),
  pa('af_4', P, 1, ['에이전트 사건이 언론에 보도됐다. 동료와 지인들이 위로를 건넸다. 이제는 돈을 다루는 일에 더 신중해졌다.', '한 차례 큰 일을 겪은 뒤 재정 관리 방식을 완전히 바꿨다. 이제 모든 서류를 직접 확인한다.'], 'hid.thrift+4 hid.pro+1 rel.media-2', { kind: K, chain: 'agent_fraud', sched: true, max: 1, note: 'broke' }),

  ch('rf_1', P, 3, ['{rival}이(가) 인터뷰에서 {name}을(를) 은근히 저격했다. 기사 제목이 신경을 건드린다.', '{rival}의 발언이 화제다. "누가 더 필요한 선수인지는 팬들이 안다"는 말이었다.'], [
    cc('같은 방식으로 맞받는다', ['언론을 통해 반박했다. 팬들이 편을 갈랐다.', 'rel.rival-8 rel.media+3 rel.fans+2 stress+4 fu:rf_2@6-14'], { pv: '긴장↑' }),
    cc('무시한다', ['흔들리지 않기로 했다. 하지만 마음 한구석이 불편했다.', 'stress+2 fu:rf_2@10-20']),
    cc('직접 만나 이야기한다', ['어색한 만남이었지만 서로의 입장을 들었다.', 'rel.rival+8 stress-2'], { chk: '40 hid.social*0.25 hid.temper*-0.2 rel.rival*0.1', bad: ['대화는 평행선이었다. 오히려 감정이 상했다.', 'rel.rival-4 stress+3 fu:rf_2@6-14'] })
  ], { kind: K, chain: 'rival_feud', cond: ['rel.rival<=-4', 'fameD>=6'], cd: 300, max: 1 }),
  ch('rf_2', P, 1, ['경기 중 {rival}과(와) 정면으로 맞부딪혔다. 두 선수 사이로 심판이 급히 들어왔다. 관중석이 술렁인다.', '{rival}과(와)의 신경전이 그라운드에서 폭발했다. 주변 선수들이 말리기 시작했다.'], [
    cc('먼저 손을 내민다', ['"그만하자." 짧은 한마디와 함께 악수를 청했다. {rival}은(는) 잠시 머뭇거렸다.', 'rel.rival+6 stress-3 fu:rf_3a@2-6'], { chk: '45 hid.temper*-0.25 attr.composure*1', bad: ['손을 뿌리쳤다. 분위기가 더 나빠졌다.', 'rel.rival-6 fu:rf_3b@2-6'] }),
    cc('끝까지 맞선다', ['한 걸음도 물러서지 않았다. 카드가 오갔다.', 'rel.rival-8 stress+4 fx:banned=3 fu:rf_3b@2-6'])
  ], { kind: K, chain: 'rival_feud', sched: true, max: 1 }),
  pa('rf_3a', P, 1, ['경기 후 {rival}이(가) 먼저 말을 걸었다. 서로에게 쌓였던 감정이 풀리는 데 오래 걸리지 않았다. 둘은 오랜 라이벌이자 서로를 인정하는 사이가 됐다.', '악연은 끝났다. {rival}과(와) 나눈 맥주 한 잔이 모든 앙금을 씻어 주었다.'], 'rel.rival+25 happy+5 fameD+0.4 hid.social+1', { kind: K, chain: 'rival_feud', sched: true, max: 1 }),
  pa('rf_3b', P, 1, ['{rival}과(와)의 갈등은 징계와 벌금으로 이어졌다. 팬들은 두 사람의 대결을 보며 열광했지만 구단은 곤혹스러워했다.', '충돌이 확대되면서 구단은 두 선수를 따로 불러 경고했다. 앙금은 쉽게 풀리지 않을 것 같다.'], 'rel.rival-20 rel.coach-4 stress+5 rel.fans+1 cash-40 fx:rivalNew', { kind: K, chain: 'rival_feud', sched: true, max: 1 }),

  ch('mf_1', P, 2, ['낯선 사내가 접근해 다음 경기 결과에 "협조"하면 큰돈을 주겠다고 속삭였다. 몇 번이고 거절해도 그의 눈은 포기하지 않는 듯했다.', '경기를 앞두고 휴대폰에 알 수 없는 번호로 메시지가 왔다. 승부조작을 암시하는 제안이었다.'], [
    cc('단호히 거절한다', ['"그런 일은 하지 않습니다." 사내는 말없이 사라졌다. 심장이 빠르게 뛰었다.', 'hid.pro+3 stress+4 fu:mf_2a@4-10'], { pv: '프로의식↑' }),
    cc('구단에 즉시 알린다', ['구단 보안팀이 즉시 조사에 착수했다. 리그 사무국과 수사기관의 협조가 이어졌다.', 'rel.coach+4 rel.director+4 stress+5 fu:mf_3c@8-20']),
    cc('제안을 받아들인다', ['"한 번만이다." 마음이 흔들렸다. 계좌에 첫 입금이 이뤄졌다.', 'cashw+10 hid.pro-5 stress+8 fu:mf_2b@2-6'], { pv: '위험 수위↑↑' })
  ], { kind: K, chain: 'match_fixing', cond: ['lvl<=3', 'age>=18', 'ovr>=35'], cd: 500, max: 1, heavy: true, help: '불법적인 제안을 받으면 구단·리그 사무국·수사기관에 즉시 알리는 것이 안전합니다. 혼자 고민하지 마세요.', note: 'match_fix' }),
  ch('mf_2a', P, 1, ['거절 이후에도 같은 번호에서 연락이 이어졌다. 협박성 메시지까지 섞여 있다. 불안감이 커졌다.', '정체를 알 수 없는 사람들이 숙소 근처에서 서성이는 것 같았다.'], [
    cc('구단과 경찰에 알린다', ['구단과 수사기관의 조사가 이어졌다. 오랜 불안이 마침내 걷혔다.', 'rel.coach+4 stress-4 fu:mf_3c@6-14'], { pv: '안전↑' }),
    cc('혼자 감당한다', ['혼자 끙끙 앓았다. 훈련 중에도 집중이 흐트러졌다.', 'stress+8 sharp-4 sleep-6'])
  ], { kind: K, chain: 'match_fixing', sched: true, max: 1, heavy: true, help: '위협을 받는다면 혼자 감당하지 말고 구단 보안팀·경찰·상담 기관에 도움을 요청하세요.' }),
  ch('mf_2b', P, 1, ['"다음 경기도 부탁한다." 사내가 더 큰 금액을 제시했다. 이미 한 번 선을 넘었다는 사실이 목을 조여 온다.', '돈을 받은 뒤 마음은 점점 무거워졌다. 이제 빠져나가기가 쉽지 않다.'], [
    cc('계속 협조한다', ['선을 넘었다. 이제는 돌아갈 곳이 없다.', 'cashw+15 hid.pro-6 stress+10 fu:mf_3b@6-16'], { pv: '위험 수위↑↑↑' }),
    cc('그만두고 자수를 고민한다', ['구단에 사실을 알리고 조사에 협조하기로 했다. 처벌은 피하기 어렵겠지만 더는 숨기지 않기로 했다.', 'stress+8 hid.pro+2 fu:mf_3b@4-10'])
  ], { kind: K, chain: 'match_fixing', sched: true, max: 1, heavy: true, help: '불법 행위에 연루되었다면 변호사와 상담하고 수사에 협조하는 것이 가장 안전합니다.' }),
  pa('mf_3b', P, 1, ['수사기관이 승부조작 정황을 포착했다. 구단은 즉각 {name}을(를) 분리 조치했다. 오랜 시간 쌓은 모든 것이 한순간에 무너졌다.', '조사 결과 승부조작 연루 사실이 확인됐다. 협회는 장기 출전 정지를 결정했다.'], 'fx:banned=40 fx:release val-60 fameD-15 rel.fans-30 rel.media-25 rel.coach-20 happy-20 stress+20 hid.controversy+5', { kind: K, chain: 'match_fixing', sched: true, max: 1, heavy: true, help: '큰 잘못을 저지른 뒤에도 책임을 지고 도움을 구하는 길은 있습니다. 가족과 전문가에게 이야기하세요.' }),
  pa('mf_3c', P, 1, ['당신의 신고 덕분에 승부조작 조직이 적발됐다. 리그와 구단은 감사를 표했고 팬들은 박수를 보냈다. 지키기 어려웠던 원칙이 빛났다.', '수사 결과 승부조작 조직이 검거됐다. 용기 있는 신고가 리그 전체를 지켰다는 평가가 나왔다.'], 'rel.fans+10 rel.media+8 fameD+2 hid.pro+4 happy+6', { kind: K, chain: 'match_fixing', sched: true, max: 1 }),

  ch('il_1', P, 3, ['같은 부위를 또 다쳤다. 이번에는 정말 수술이 필요할지도 모른다는 이야기가 나온다.', '재활을 끝낸 지 얼마 되지 않았는데 같은 자리에서 통증이 다시 올라왔다. 의무팀의 표정이 굳어 있다.'], [
    cc('수술을 받는다', ['수술은 성공적으로 끝났다. 긴 재활이 기다린다.', 'health-3 stress+4 fx:fullRehab fu:il_2@8-14'], { pv: '재발 위험↓ 장기 결장' }),
    cc('보존 치료를 선택한다', ['수술 대신 재활과 치료로 가기로 했다.', 'stress+3 fu:il_2@6-12'])
  ], { kind: K, chain: 'injury_loop', cond: ['injured', 'injweeks>=3', 'age>=19'], cd: 300, max: 2, note: 'inj_recur' }),
  ch('il_2', P, 1, ['재활 중 통증이 다시 올라왔다. 팀은 한창 바쁜 시기다. 서둘러 돌아오라는 눈치가 느껴진다.', '재활 센터 훈련은 지루하다. 몸이 거의 회복된 것 같은 착각이 든다.'], [
    cc('서두르지 않고 천천히 간다', ['더디지만 단단하게 회복해 나갔다.', 'health+3 stress+2 fx:fullRehab fu:il_3@10-20'], { pv: '재발 위험↓' }),
    cc('서둘러 복귀한다', ['감독의 기대에 부응하기 위해 일정을 앞당겼다.', 'fx:earlyReturn morale+3 rel.coach+3 fu:il_3@4-10'], { pv: '재발 위험↑↑' })
  ], { kind: K, chain: 'injury_loop', sched: true, max: 2, note: 'inj_early' }),
  ch('il_3', P, 1, ['다시 그라운드에 섰다. 몸의 반응이 예전 같지는 않지만 마음은 단단해졌다. 앞으로의 선수 생활에 대한 생각이 많아졌다.', '복귀 후 첫 경기. 몸이 낯설고 두렵다. 그래도 공을 차는 순간 모든 것이 선명해졌다.'], [
    cc('끝까지 해 보겠다', ['"포기하지 않겠습니다." 몸을 낮추고 다시 달렸다.', 'hid.pro+3 morale+4 attr.stamina+0.1'], { chk: '48 hid.pro*0.3 health*0.2 hid.injuryProne*-0.2', bad: ['몸이 다시 신호를 보냈다. 다음 재발 위험이 높다.', 'fx:inj=meniscus morale-6 stress+6'] }),
    cc('은퇴를 진지하게 고민한다', ['가족과 오랜 대화 끝에 앞으로의 방향을 놓고 고민이 이어졌다.', 'stress+4 rel.mother+3 fu:retire_nudge@8-20'], { pv: '선수 생활 전환점' })
  ], { kind: K, chain: 'injury_loop', sched: true, max: 2 }),

  pa('cb_1', P, 3, ['클럽 재정난 이야기가 흘러나왔다. 스폰서 이탈, 세금 체납, 임금 지급 지연. 라커룸에는 불안한 기운이 번졌다.', '월급이 하루 이틀 늦어지더니 이번 달엔 아예 입금되지 않았다. 구단 사무실 문은 굳게 닫혀 있다.'], 'fx:clubCrash stress+5 morale-3 fu:cb_2@4-8', { kind: K, chain: 'club_bankrupt', cond: ['lvl<=3', 'hasClub', '!flag:club_crash', 'age>=19'], cd: 500, max: 1, note: 'club_wages' }),
  ch('cb_2', P, 1, ['임금 체불이 몇 달째 이어졌다. 선수단 사이에서는 집단 행동 이야기까지 나왔다. 떠날 사람, 남을 사람이 갈리고 있다.', '구단은 곧 해결될 거라 말하지만 신뢰는 바닥이다.'], [
    cc('끝까지 남아 구단 정상화를 기다린다', ['남은 동료들과 서로 의지하며 버텼다.', 'rel.mates+6 rel.fans+4 hid.loyalty+3 stress+6 fu:cb_3a@8-20'], { chk: '45 hid.loyalty*0.3 cashy*0', great: ['남은 선수들의 호소가 지역 사회를 움직였다. 투자자가 나타났다.', 'rel.fans+8 stress+2 fu:cb_3a@4-10'], bad: ['구단은 끝내 버티지 못했다.', 'stress+8 fu:cb_3b@4-10'] }),
    cc('선수 노조에 호소한다', ['선수 노조가 중재에 나섰다. 일부 체불 임금이 확인됐다.', 'rel.mates+3 stress+3 fu:cb_3a@6-14'], { chk: '48 attr.leadership*1 rel.captain*0.1', bad: ['협상이 지지부진하게 이어졌다.', 'stress+5 fu:cb_3b@6-14'] }),
    cc('이적을 모색한다', ['에이전트를 통해 다른 구단 접촉을 시작했다.', 'fx:offers=many stress+3 rel.fans-4'])
  ], { kind: K, chain: 'club_bankrupt', sched: true, cond: ['flag:club_crash'], max: 1, note: 'club_wages' }),
  pa('cb_3a', P, 1, ['새 투자자가 나타나 구단 재정이 안정됐다. 체불 임금도 일부 지급됐다. 선수들은 서로를 끌어안았다.', '법원이 구단의 회생 절차를 승인했다. 임금 체불은 분할 지급으로 정리됐다.'], 'fx:wageCatchup fx:clubRecover morale+6 happy+4 stress-6', { kind: K, chain: 'club_bankrupt', sched: true, max: 1 }),
  pa('cb_3b', P, 1, ['구단이 끝내 해체 절차를 밟았다. 선수들은 계약 해지를 통보받았다. 체불 임금은 법적 절차로 넘어갔다.', '구단이 파산을 신청했다. 라커룸 짐을 챙겨 나오는 동안 아무도 말이 없었다.'], 'fx:clubRecover fx:release morale-8 stress+8 rel.fans-2', { kind: K, chain: 'club_bankrupt', sched: true, max: 1 }),

  pa('cc_1', P, 3, ['구단이 {coach} 감독을 경질했다. 지난 연패를 이유로 한 결정이었다. 곧 새 감독이 부임한다.', '성적 부진 끝에 {coach} 감독이 물러났다. 선수단 분위기가 어수선하다.'], 'fx:newCoach stress+2 fu:cc_2@1-3', { kind: K, chain: 'coach_change', cond: ['hasClub', 'form<=6.4', 'lvl>=2'], cd: 100, max: 4, note: 'coach_fired' }),
  ch('cc_2', P, 1, ['새 감독 {coach}이(가) 첫 면담에서 {name}에게 "네 역할을 다시 정해 보자"고 말했다. 이 자리에서의 인상이 중요하다.', '신임 {coach} 감독과의 첫 개별 면담. 서로 아직 서먹하다.'], [
    cc('적극적으로 자신을 어필한다', ['열정적으로 이야기했다. 감독의 눈이 반짝였다.', 'rel.coach+4 stress+2 fu:cc_3a@2-5'], { chk: '45 hid.ambition*0.2 ovr*0.4 hid.social*0.1', bad: ['지나친 어필이 오히려 거슬렸다. 감독이 고개를 갸웃했다.', 'rel.coach-3 fu:cc_3b@2-5'] }),
    cc('조용히 훈련으로 보여 주겠다고 한다', ['말수는 적었지만 훈련에서 최선을 다했다.', 'rel.coach+1 hid.pro+1 fu:cc_3a@3-8'], { chk: '45 ovr*0.4 hid.pro*0.2', bad: ['감독은 {name}을(를) 잘 파악하지 못한 듯했다. 기회가 줄어들었다.', 'fu:cc_3b@3-8'] }),
    cc('에이전트를 통해 의사를 전한다', ['에이전트가 구단과 감독에게 입장을 전달했다.', 'rel.agent+1 rel.coach-1 fu:cc_3b@3-8'])
  ], { kind: K, chain: 'coach_change', sched: true, max: 4 }),
  pa('cc_3a', P, 1, ['새 감독의 전술에서 {name}의 자리가 확실해졌다. 훈련장에서도 신뢰가 느껴진다.', '신임 감독은 {name}에게 핵심 역할을 맡겼다. 새 시즌이 기대된다.'], 'fx:role=starter morale+6 rel.coach+4', { kind: K, chain: 'coach_change', sched: true, max: 4 }),
  pa('cc_3b', P, 1, ['새 감독의 구상에서 {name}의 자리가 줄어들었다. 벤치에서 보내는 시간이 늘었다. 쉽지 않은 시간이 될 것이다.', '새로운 전술에서 {name}의 장점이 살아나지 않았다. 감독의 신뢰를 다시 얻어야 한다.'], 'fx:role=backup morale-6 stress+4 rel.coach-3', { kind: K, chain: 'coach_change', sched: true, max: 4 }),

  ch('mar_1', P, 2, ['결혼 후 첫 시즌이 시작됐다. 원정과 훈련 일정이 잦아 {partner}과(와) 보내는 시간이 줄었다. 서로 서운함이 스며들기 시작했다.', '신혼의 달콤함이 일정표 앞에서 흔들린다. {partner}이(가) 말없이 현관에 앉아 있었다.'], [
    cc('집과 가족에 더 신경 쓴다', ['훈련 후 곧장 집으로 돌아갔다. 서로의 이야기를 들어 주는 시간이 늘었다.', 'rel.partner+8 happy+4 sharp-1 fu:mar_2@20-40'], { pv: '연인 관계↑' }),
    cc('커리어에 더 집중한다', ['"이번 시즌만 지나면 괜찮아질 거야." 말은 그렇게 했지만 마음은 무거웠다.', 'rel.partner-6 stress+4 fu:mar_2@12-30'])
  ], { kind: K, chain: 'marriage', cond: ['married'], cd: 500, max: 1, note: 'divorce' }),
  ch('mar_2', P, 1, ['부부 사이의 갈등이 깊어졌다. 같은 이야기를 반복하다 침묵으로 끝나는 날이 늘었다.', '{partner}은(는) 말수가 줄고 {name}도 말을 아낀다. 서로를 위한 결정이 필요하다.'], [
    cc('부부 상담을 받아 본다', ['전문가 앞에서 처음으로 서로의 이야기를 들어 보았다.', 'rel.partner+6 stress-2 cashw-1 fu:mar_3a@8-20'], { chk: '52 rel.partner*0.3 hid.family*0.15', bad: ['상담은 서로의 상처를 더 선명하게 했다.', 'rel.partner-4 fu:mar_3b@6-16'] }),
    cc('일단 거리를 둔다', ['잠시 떨어져 시간을 갖기로 했다. 집이 낯설게 느껴졌다.', 'rel.partner-6 stress+5 fu:mar_3b@6-16']),
    cc('{partner}의 이야기를 끝까지 들어 준다', ['말을 자르지 않고 끝까지 들었다. 눈물이 오갔다.', 'rel.partner+8 happy+2 stress-2 fu:mar_3a@6-16'], { chk: '48 attr.composure*1 hid.family*0.15', bad: ['끝까지 듣다가 감정이 폭발했다.', 'rel.partner-6 stress+6 fu:mar_3b@6-16'] })
  ], { kind: K, chain: 'marriage', sched: true, cond: ['married'], max: 1, note: 'divorce' }),
  pa('mar_3a', P, 1, ['서로를 이해하게 되면서 부부 관계가 회복됐다. 함께한 시간이 쌓이며 둘 사이가 더 단단해졌다.', '긴 대화 끝에 서로의 마음을 확인했다. 다시 웃을 수 있는 아침이 돌아왔다.'], 'rel.partner+15 happy+8 stress-6 hid.family+2', { kind: K, chain: 'marriage', sched: true, max: 1 }),
  pa('mar_3b', P, 1, ['더 이상 같은 길을 걷기 어렵다는 결론에 이르렀다. 서류에 서명하는 손이 떨렸다. 이혼 소식은 짧게 보도됐다.', '조용한 이별이었다. 서로의 앞날을 존중하기로 했다.'], 'fx:divorce', { kind: K, chain: 'marriage', sched: true, max: 1, note: 'divorce' }),

  ch('pi_1', P, 2, ['고향에서 급한 연락이 왔다. 아버지가 병원에 입원하셨다고 한다. 구단 일정은 빠듯하다.', '어머니의 떨리는 목소리가 전화기 너머에서 들렸다. 아버지가 쓰러져 병원에 계시다고 했다.'], [
    cc('즉시 고향으로 간다', ['감독에게 사정을 말하고 곧장 짐을 쌌다. 병실의 아버지 손을 잡았다.', 'fx:parentIll rel.father+10 rel.mother+6 stress+6 sharp-4 rel.coach-2 fu:pi_2@2-5'], { pv: '가족 관계↑↑ 경기 감각↓' }),
    cc('치료비를 보내고 경기에 집중한다', ['가족이 괜찮다고 했다. 마음은 하루 종일 병원에 있었다.', 'fx:parentIll cashy-0.2 stress+8 rel.father+3 fu:pi_2@4-8'])
  ], { kind: K, chain: 'parent_illness', cond: ['age>=22', 'rel.father>=0', '!flag:parent_ill'], cd: 500, max: 1, heavy: true, help: '가족의 건강 문제는 큰 스트레스를 줍니다. 혼자 견디지 말고 가까운 사람이나 상담 기관의 도움을 받으세요.' }),
  ch('pi_2', P, 1, ['아버지의 치료는 길어지고 있다. 의사는 경과를 지켜봐야 한다고 말한다. 경기와 가족 사이에서 마음이 갈린다.', '병원 복도의 의자에 앉아 숨을 고르고 있다. 가족의 일상이 많이 달라졌다.'], [
    cc('자주 병원을 찾아간다', ['틈이 날 때마다 병원을 찾았다. 아버지가 힘없이 웃었다.', 'rel.father+8 stress+5 fatigue+6 fu:pi_3a@6-14'], { chk: '50 rel.father*0.2 health*0.1', bad: ['정성에도 불구하고 상태는 쉽게 호전되지 않았다.', 'stress+8 fu:pi_3b@4-10'] }),
    cc('더 좋은 병원과 치료를 지원한다', ['전문 병원으로 옮기고 치료를 지원했다.', 'cashy-0.4 rel.father+6 stress+4 fu:pi_3a@6-14'], { chk: '55 rel.father*0.15', bad: ['최선을 다했지만 쉽지 않은 상황이었다.', 'stress+8 fu:pi_3b@4-10'] })
  ], { kind: K, chain: 'parent_illness', sched: true, max: 1, heavy: true, help: '가족의 병환은 큰 부담입니다. 감정을 나눌 수 있는 사람이나 전문 상담 기관을 찾아보세요.' }),
  pa('pi_3a', P, 1, ['아버지가 천천히 회복하고 계신다. 병실에서 처음으로 웃으셨다. 오랜만에 마음이 가벼워졌다.', '아버지가 퇴원하셨다. 가족이 모두 모여 오랜만에 함께 식사했다.'], 'rel.father+10 happy+10 stress-10 hid.family+3', { kind: K, chain: 'parent_illness', sched: true, max: 1, heavy: true }),
  pa('pi_3b', P, 1, ['아버지가 세상을 떠나셨다. 장례식장에서 가족들과 함께 오랜 시간 말없이 앉아 있었다. 많은 말이 가슴속에 남았다.', '결국 이별의 날이 왔다. 마지막 인사를 마치고 오래 침묵했다.'], 'fx:parentPass=father unflag:parent_ill', { kind: K, chain: 'parent_illness', sched: true, max: 1, heavy: true, help: '큰 상실을 겪었을 때의 슬픔과 무기력은 자연스러운 반응입니다. 가족과 친구, 가까운 정신건강 상담 기관의 도움을 받으세요.', note: 'heavy_help' })
];
