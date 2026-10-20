import type { RawEvent } from '../../schema';
import { cc, ch, pa } from '../helpers';

const P: ('pro')[] = ['pro'];

export const proChoice2: RawEvent[] = [
  ch('kr_mil_notice', P, 6, ['병무청에서 입영 통지서가 도착했다. 축구 인생에서 가장 큰 공백이 될 수 있는 결정의 순간이다. 김천 상무에서 뛰며 복무할 수도, 국제대회 메달로 면제를 노릴 수도 있다.', '대한민국 남자라면 피할 수 없는 문제다. 군 문제를 어떻게 풀지 결정해야 한다.'], [
    cc('김천 상무에 입대한다', ['{name}은(는) 머리를 짧게 깎고 김천 상무 유니폼을 입었다. 78주의 복무가 시작된다.', 'fx:enlist happy-4 stress+4'], { pv: '약 1년 반 복무 출전 기회 유지 행복↓ 스트레스↑' }),
    cc('입대를 연기한다', ['법이 허용하는 범위에서 입대를 미루기로 했다. 시간이 많지는 않다.', 'fx:milDefer fu:kr_mil_notice@40-60 stress+4']),
    cc('국제대회 메달에 도전한다', ['대표팀 선발과 메달이 필요하다. 쉽지 않은 길이지만 성공하면 커리어에 큰 도움이 된다.', 'fx:milDefer fu:kr_mil_notice@52-80 hid.ambition+2'], { chk: '28 ovr*0.4 fameD*0.3 caps*0.8', great: ['대표팀에서 입상에 성공해 병역 특례를 받았다!', 'fx:exempt'], bad: ['선발에서 밀렸다. 이제는 입대를 준비해야 한다.', 'morale-8 stress+6 fu:kr_mil_force@12-24'] })
  ], { cond: ['country:KR', 'mil:pending', 'age>=24', 'age<=28', '!flag:mil_defer'], cd: 0, max: 1, xg: 'military', note: 'military', tier: 'major' }),
  pa('kr_mil_force', P, 1, ['더는 연기할 수 없다. 입영 통지서를 받고 짐을 싸야 한다. 김천 상무가 마지막 기회다.', '병역 이행 시기가 다가왔다. 담담히 군복을 받았다.'], 'fx:enlist stress+4', { sched: true, max: 1, cond: ['mil:pending'] }),
  ch('pc_nat_snub', P, 3, ['대표팀 명단에 이름이 없었다. 최근 폼을 생각하면 아쉬운 결과다. 기자가 소감을 묻는다.', '대표팀 소집 명단 발표. {name}의 이름은 끝내 나오지 않았다.'], [
    cc('"감독의 선택을 존중한다"고 말한다', ['성숙한 반응이었다. 팬들은 박수를 보냈다.', 'rel.fans+3 rel.media+3 hid.pro+1 morale-4 fameD-0.3 fu:fu_career@10-26'], { pv: '팬 관계↑ 사기↓ 명성↓' }),
    cc('불만을 공개적으로 드러낸다', ['솔직한 불만이 인터뷰에 실렸다. 대표팀 감독이 반응했다.', 'rel.natcoach-10 rel.fans+2 stress+3 fu:fu_career@10-26'], { chk: '45 hid.controversy*-0.3', bad: ['발언이 논란이 되면서 대표팀 합류가 더 멀어졌다.', 'rel.natcoach-15 rel.media-6 stress+6 fu:fu_career@10-26'] }),
    cc('훈련에 몰두한다', ['이를 악물고 자기 일에 집중했다.', 'attr.stamina+0.1 hid.pro+1 stress+2 fu:fu_career@10-26'])
  ], { cond: ['natGap>=-6', 'natGap<=4', 'sinceCall>=26', 'form>=6.8', 'age>=18'], cd: 100, max: 2, xg: 'national', note: 'nat_call', tier: 'major' }),
  ch('pc_loan_talk', P, 3, ['{coach} 감독이 {name}에게 임대를 조심스럽게 언급했다. 출전 시간을 얻기 위한 선택일 수 있다.', '구단이 {name}의 성장을 위해 임대를 제안할 의향이 있다고 한다.'], [
    cc('임대를 받아들인다', ['임대처에서 꾸준히 뛰며 경험을 쌓기로 했다.', 'fx:offers=loan morale+2 fu:fu_career@10-26'], { chk: '55 ovr*0.2 hid.adapt*0.1 rel.coach*0.1', pv: '출전↑ 소속 변경', bad: ['임대 구단에서 기대한 출전 기회를 얻지 못했다.', 'fx:offers=loan morale-5 rel.coach-2 fu:fu_career@10-26'] }),
    cc('팀에 남아 경쟁한다', ['"여기서 증명하겠습니다." 감독은 쓴웃음을 지었다.', 'hid.loyalty+2 rel.coach+1 sharp-3 morale-2 fu:fu_career@10-26']),
    cc('에이전트와 상의한다', ['에이전트가 가능한 선택지를 정리해 주었다.', 'rel.agent+2 stress+1 fu:fu_career@10-26'])
  ], { cond: ['age<=24', 'role:backup|prospect', 'lvl>=3'], cd: 150, max: 2, xg: 'transfer_talk', note: 'loan', tier: 'major' }),
  ch('pc_contract_stall', P, 3, ['재계약 협상이 지지부진하다. 구단은 기다리라고 하고 에이전트는 서두르지 말라고 한다. 다른 구단의 관심도 있다.', '계약 만료가 다가온다. 구단의 제안은 마음에 차지 않는다.'], [
    cc('조건을 받아들이고 서명한다', ['서명을 마치자 마음이 편해졌다. 연봉은 소폭 인상됐다.', 'fx:clubOpt=extend stress-4 rel.director+3 val-3 hid.ambition-2 fu:fu_club@8-20'], { pv: '안정↑ 시장가치↓' }),
    cc('협상을 버틴다', ['시간이 지나면서 구단이 조건을 올렸다.', 'fx:clubOpt=raise rel.director-2 stress+3 fu:fu_club@8-20'], { chk: '42 ovr*0.4 agent*0.25 rel.coach*0.1', bad: ['구단이 협상을 끊었다. 마음이 불안해졌다.', 'rel.director-6 morale-5 stress+5 fu:fu_club@8-20'] }),
    cc('다른 구단과 접촉한다', ['에이전트가 비공개로 몇몇 구단의 관심을 알아봤다.', 'fx:offers=many rel.coach-3 stress+2 fu:fu_club@8-20'])
  ], { cond: ['contractLeft<=30', 'contractLeft>0', 'hasClub'], cd: 100, max: 3, xg: 'contract', note: 'contract_len', tier: 'major' }),
  ch('pc_degree_offer', P, 2, ['선수 노조가 대학 학위 연계 프로그램을 소개했다. 은퇴 후를 준비할 수 있지만 시간이 많이 든다.', '구단 교육 담당이 선수들을 위한 학업 병행 과정을 안내했다.'], [
    cc('등록한다', ['주 몇 시간씩 강의를 들으며 새로운 세계를 만난다.', 'edu+8 fx:studyDegree stress+3 postSkill+2'], { chk: '55 hid.pro*0.2 stress*-0.2 fatigue*-0.2', pv: '학력↑ 스트레스↑', bad: ['과목과 훈련 일정이 겹쳐 학업을 따라가기 벅찼다.', 'stress+5 fatigue+5'] }),
    cc('지금은 경기에 집중한다', ['언젠가 공부할 날이 오겠지.', 'stress-1 happy-1 hid.ambition-1'])
  ], { cond: ['edu<2', 'age>=19'], cd: 150, max: 2, xg: 'education', note: 'edu', tier: 'minor' }),
  ch('pc_language_class', P, 3, ['현지 언어가 아직 서툴러 라커룸 대화가 반쯤 겉돈다. 통역에 의존할 것인가, 직접 배울 것인가.', '구단이 언어 수업을 제안했다. 훈련 후 두 시간이 걸린다.'], [
    cc('수업에 참여한다', ['힘들었지만 몇 주 뒤 팀 동료들과 농담을 주고받을 수 있었다.', 'fx:langUp=10 hid.adapt+2 rel.mates+3 fatigue+4'], { chk: '50 hid.adapt*0.3 hid.social*0.1', pv: '언어↑ 해외 적응↑', bad: ['수업을 따라가지 못해 위축됐다.', 'fatigue+4 stress+3 happy-2'] }),
    cc('통역에 의존한다', ['편하긴 했지만 대화의 깊이는 얕았다.', 'rel.mates-1'])
  ], { cond: ['abroad'], cd: 100, max: 2, xg: 'education', note: 'abroad_adapt', tier: 'minor' }),
  ch('pc_slump', P, 4, ['골이 터지지 않는 시기가 길어졌다. 패스가 어긋나고 시야가 좁아진다. 어떻게 극복할까?', '슬럼프가 길어지고 있다. 모든 터치가 어색하게 느껴진다.'], [
    cc('심리 상담을 받는다', ['상담사와의 대화에서 무엇이 마음을 누르는지 정리됐다.', 'stress-10 attr.composure+0.15 happy+3 cashw-1'], { pv: '스트레스↓' }),
    cc('훈련량을 늘려 돌파한다', ['더 뛰고 더 때렸다. 몸이 먼저 반응했다.', 'attr.firstTouch+0.1 attr.shooting+0.1 fatigue+8'], { chk: '50 hid.pro*0.25 fatigue*-0.25', bad: ['과한 훈련이 오히려 독이 됐다.', 'fatigue+12 morale-4'] }),
    cc('동료들과 어울려 기분 전환한다', ['웃고 떠들다 보니 한결 가벼워졌다.', 'happy+4 rel.mates+3 stress-5 drink+4'])
  ], { cond: ['form<=5.6', 'ovr>=40'], cd: 50, max: 4, xg: 'form_mental', note: 'burnout', tier: 'minor', again: '지난번 슬럼프 때는 "{prev}"(으)로 버텼다.' }),
  ch('pc_return_pressure', P, 3, ['부상에서 복귀할 시점이 다가오자 감독이 은근히 복귀 일정을 압박한다. 몸은 아직 불안하다.', '의무팀은 "조금 더"라고 하고 감독은 "이번 경기"를 이야기한다.'], [
    cc('의무팀의 일정을 따른다', ['조급해하지 않고 재활을 마무리했다.', 'health+3 rel.coach-1 fx:fullRehab'], { pv: '재발 위험↓' }),
    cc('감독의 요청에 응한다', ['팀을 위해 서둘러 복귀했다.', 'fx:earlyReturn morale+3 rel.coach+3'], { chk: '48 health*0.3 attr.recovery*1.5 hid.injuryProne*-0.2', pv: '재발 위험↑↑', bad: ['서두른 복귀가 통증으로 돌아왔다. 의무팀은 고개를 저었다.', 'fx:earlyReturn fx:reinjure morale-5'] })
  ], { cond: ['injured', 'injweeks<=5', 'injweeks>=1'], cd: 40, max: 8, xg: 'injury_care', note: 'inj_early', tier: 'minor' }),
  ch('pc_rehab_choice', P, 3, ['장기 재활이 필요하다. 어디서 어떻게 재활할지 고민이 길어진다.', '긴 재활 일정을 앞두고 선택지가 주어졌다.'], [
    cc('구단 재활센터에서 한다', ['익숙한 환경에서 단계별로 진행했다.', 'health+3 rel.coach+1'], { chk: '55 hid.pro*0.2 health*0.1', pv: '안정적', bad: ['재활이 더디게 진행됐다. 초조함이 커졌다.', 'stress+4 morale-3'] }),
    cc('해외 전문 클리닉에 간다', ['해외 클리닉은 첨단 장비와 노하우를 갖추고 있었다.', 'health+6 fatigue-5 cashw-6 stress+2'], { pv: '회복↑ 지출↑↑' }),
    cc('집에서 가족과 보낸다', ['가족 곁에서 마음이 편해졌다.', 'happy+5 rel.mother+4 health+1 sharp-4 rel.coach-3'])
  ], { cond: ['injured', 'injweeks>=8'], cd: 100, max: 4, xg: 'injury_care', note: 'inj_acl', tier: 'minor' }),
  ch('pc_rival_olive', P, 2, ['{rival}이(가) 어색한 표정으로 다가와 지난 일을 사과하겠다고 했다.', '{rival}이(가) 훈련 후 먼저 말을 걸었다. "저번 일은 내 잘못이야."'], [
    cc('사과를 받아들인다', ['"서로 열심히 하자." 어색한 악수가 오갔다.', 'rel.rival+10 stress-3'], { chk: '50 hid.social*0.15 rel.rival*0.2', pv: '라이벌 관계↑', bad: ['사과가 진심이 아니었음을 곧 알게 됐다. 뒤끝만 남았다.', 'rel.rival-6 stress+4'] }),
    cc('아직은 마음을 열지 못한다', ['"시간이 필요해." 짧은 침묵이 흘렀다.', 'rel.rival+1 stress+1'])
  ], { cond: ['rel.rival<=-8'], cd: 150, max: 1, xg: 'rival', tier: 'minor' }),
  ch('pc_big_tease', P, 3, ['빅클럽이 {name}에게 관심이 있다는 보도가 나왔다. 에이전트는 확인해 주지 않고 구단은 부인한다.', '해외 빅클럽 스카우트가 경기를 지켜보았다는 소문이 돌았다.'], [
    cc('에이전트에게 알아보게 한다', ['비공식 접촉이 이어졌다. 제안이 올지는 알 수 없다.', 'fx:offers=up rel.agent+2 stress+2 fu:fu_career@10-26'], { chk: '45 agent*0.2 fameD*0.2 form*0.2', bad: ['소문이 언론에 흘러 팬들의 비난을 샀다.', 'rel.fans-5 stress+4 fu:fu_career@10-26'] }),
    cc('경기에만 집중한다', ['"소문은 소문일 뿐입니다." 평소처럼 훈련했다.', 'hid.pro+1 stress-1 val-2 fameD-0.3 fu:fu_career@10-26'])
  ], { cond: ['lvl>=3', 'fameD>=15', 'form>=7', 'hasAgent'], cd: 100, max: 3, xg: 'transfer_talk', tier: 'major' }),
  ch('pc_dating_public', P, 2, ['연인과의 사이가 언론에 알려질 기세다. 먼저 공개할까, 조용히 둘까?', '파파라치가 {partner}과(와) 함께 있는 모습을 찍었다고 한다.'], [
    cc('SNS에서 먼저 공개한다', ['공개한 뒤 오히려 마음이 가벼워졌다.', 'followers+40 rel.partner+4 rel.fans+1 happy+3'], { chk: '55 hid.controversy*-0.2 rel.partner*0.1', bad: ['팬들 사이에서 의견이 갈렸다. 악플도 달렸다.', 'rel.fans-3 stress+4 rel.partner-2'] }),
    cc('조용히 둔다', ['사생활은 지키기로 했다. 다행히 보도는 흐지부지됐다.', 'stress+1'])
  ], { cond: ['dating', 'fameD>=12'], cd: 150, max: 1, xg: 'romance', tier: 'minor' }),
  ch('pc_wedding_plan', P, 2, ['오래 사귀어 온 {partner}과(와) 결혼 이야기가 나왔다. 양가 가족도 기대하는 눈치다.', '시즌이 끝나가는 시점. 프러포즈를 준비할 수 있을 것 같다.'], [
    cc('청혼한다', ['반지를 꺼내자 {partner}은(는) 환하게 웃었다.', 'fx:marry'], { chk: '52 rel.partner*0.3 hid.family*0.1', bad: ['"조금 더 시간이 필요해." 눈빛이 흔들렸다.', 'rel.partner-5 stress+4'] }),
    cc('조금 더 미룬다', ['지금은 커리어에 집중하고 싶다고 했다.', 'rel.partner-3 stress+1'])
  ], { cond: ['dating', 'age>=22'], cd: 100, max: 2, xg: 'romance', tier: 'minor' }),
  ch('pc_boot_deal', P, 2, ['두 개의 용품 브랜드가 후원 제안을 해 왔다. A사는 금액이 크고 B사는 장기 파트너십을 강조한다.', '용품 후원 계약을 고민한다. 계약 기간과 금액이 다르다.'], [
    cc('A사의 높은 금액을 택한다', ['계약금이 높았다. 대신 계약 기간이 짧다.', 'sponsor+2200 stress+1 fu:fu_money@12-30'], { chk: '45 agent*0.25 hid.thrift*-0.1 hid.pro*0.1', pv: '수입↑', bad: ['계약 조건 해석을 두고 분쟁이 생겼다. 금액 일부가 보류됐다.', 'sponsor-1000 stress+4 rel.media-2 fu:fu_money@12-30'], worst: ['분쟁이 길어져 소송 직전까지 갔다. 합의금과 변호사 비용만 남았다.', 'sponsor-2200 cashw-3 stress+8 rel.media-4 fu:fu_money@12-30'] }),
    cc('B사의 장기 계약을 택한다', ['장기 계약으로 이미지가 안정적으로 쌓였다.', 'sponsor+1200 fameD+0.3 rel.fans+1 fu:fu_money@12-30'], { chk: '48 agent*0.25 hid.pro*0.1', bad: ['독점 조항 때문에 다른 후원 기회를 놓쳤다. 계약 해석을 두고 공방이 이어졌다.', 'sponsor-600 rel.fans-1 stress+3 fu:fu_money@12-30'], worst: ['계약 조항 위반을 이유로 브랜드가 후원금을 일부 환수하겠다고 통보했다.', 'sponsor-1200 cashw-2 stress+6 fu:fu_money@12-30'] }),
    cc('둘 다 거절한다', ['후원 없이 직접 신발을 사기로 했다.', 'hid.thrift+1 val-2 fameD-0.3 fu:fu_money@12-30'])
  ], { cond: ['fameD>=14'], cd: 100, max: 3, xg: 'sponsor', tier: 'major' }),
  ch('pc_streaming', P, 2, ['동료가 함께 게임 방송을 해 보자고 제안했다. 인기가 오를 수도 있지만 시간과 말실수가 걱정이다.', '개인 방송 제안이 들어왔다. 팬들과 직접 소통할 수 있는 기회다.'], [
    cc('도전한다', ['처음엔 어색했지만 팬들과 웃으며 이야기를 나눴다.', 'followers+60 rel.fans+4 fatigue+3 sponsor+300'], { chk: '55 hid.social*0.3 hid.controversy*-0.25', bad: ['부주의한 말이 논란이 됐다.', 'rel.fans-5 rel.coach-3 stress+4'] }),
    cc('하지 않는다', ['지금은 경기에만 집중하겠다고 말했다.', 'rel.coach+1 followers-3 fameD-0.3'])
  ], { cond: ['age<=30', 'followers>=100', 'fameD>=12'], cd: 150, max: 1, xg: 'social_media', note: 'media', tier: 'minor' }),
  ch('pc_book_offer', P, 2, ['출판사가 {name}의 자서전 출간을 제안했다. 아직 이르다는 생각도 들지만 이야기가 쌓였다.', '자서전 출간 제안이 도착했다. 대필 작가가 이미 정해져 있다고 한다.'], [
    cc('수락한다', ['인터뷰와 정리를 거쳐 책이 나왔다. 책을 받아든 순간 감회가 깊었다.', 'cashw+6 fameD+1 followers+50 stress+3 fu:fu_money@12-30'], { chk: '55 hid.controversy*-0.2 hid.social*0.1 fameD*0.2', pv: '수입↑ 명성↑', bad: ['대필 작가와의 이견으로 원고가 늦어졌다. 출판사가 불만이다.', 'stress+6 cashw-1 fu:fu_money@12-30'] }),
    cc('아직 이르다고 사양한다', ['"은퇴하고 나서 이야기하겠습니다."', 'hid.pro+1 fameD-0.5 fu:fu_money@12-30'])
  ], { cond: ['fameD>=40', 'age>=26'], cd: 200, max: 1, xg: 'publishing', tier: 'major' }),
  ch('pc_hometown_fund', P, 2, ['고향 아마추어 클럽이 재정난으로 해체 위기에 놓였다. {name}이(가) 후원해 주면 살아날 수 있다.', '어릴 적 첫 소속 팀이 후원자를 찾는다는 소식을 들었다.'], [
    cc('후원한다', ['클럽이 되살아났다. 아이들이 환호하며 이름을 외쳤다.', 'cashy-0.25 happy+6 rel.fans+4 fameD+0.5'], { chk: '50 hid.thrift*-0.1 hid.family*0.1', pv: '행복↑ 명성↑ 현금↓', bad: ['후원금 사용처 논란이 일었다. 기사가 부정확하게 나갔다.', 'rel.media-3 stress+4'] }),
    cc('응원 메시지만 보낸다', ['직접 도울 형편은 아니라고 사양했다.', 'stress+1 rel.fans-2'])
  ], { cond: ['cash>=4000', 'age>=22'], cd: 150, max: 1, xg: 'family_money', tier: 'minor' }),
  ch('pc_fan_abuse', P, 2, ['원정 경기에서 상대 팬들이 {name}을(를) 향해 모욕적인 구호를 외쳤다. 모두가 들었다.', '원정 관중석에서 선수들을 겨냥한 모욕적인 구호가 쏟아졌다.'], [
    cc('심판에게 알려 경기를 중단시킨다', ['경기가 일시 중단됐다. 구단과 리그는 조사를 약속했다.', 'rel.coach+2 rel.fans+4 stress+3'], { chk: '50 hid.pro*0.15 hid.bigGame*0.15', pv: '팬 관계↑', bad: ['항의가 받아들여지지 않았다. 감정이 앞서 경기에 집중하지 못했다.', 'stress+6 rel.coach-2'] }),
    cc('경기에 집중한다', ['이를 악물고 뛰었다. 경기 후 마음이 쉬이 가라앉지 않았다.', 'stress+6 hid.pro+1']),
    cc('경기 후 구단에 정식으로 보고한다', ['구단 법무팀이 사안을 정리해 공식 대응했다.', 'rel.coach+2 stress+2'])
  ], { cond: ['lvl>=3'], cd: 150, max: 2, xg: 'press', heavy: true, help: '차별적이거나 모욕적인 언행을 겪었다면 혼자 감당하지 말고 구단·협회의 상담 창구, 가까운 사람, 전문 기관에 도움을 요청할 수 있습니다.', tier: 'minor' }),
  ch('pc_training_snub', P, 3, ['{coach} 감독이 훈련에서 {name}을(를) 주전조에서 뺐다. 이유는 말해 주지 않았다.', '훈련 조 편성에서 두 주째 비주전 조에 이름이 올라 있다.'], [
    cc('감독에게 이유를 묻는다', ['감독은 전술 변화와 체력 안배를 이유로 들었다.', 'rel.coach+1 stress-1'], { chk: '46 rel.coach*0.25 hid.pro*0.1', bad: ['"스스로 알아야지." 대답은 쌀쌀했다.', 'rel.coach-4 stress+3'] }),
    cc('훈련으로 증명한다', ['말 대신 가장 먼저 나와 가장 늦게 남았다.', 'hid.pro+2 attr.stamina+0.1 fatigue+5']),
    cc('에이전트를 통해 구단에 의견을 전한다', ['에이전트가 구단에 입장을 전했다. 분위기가 미묘해졌다.', 'rel.agent+1 rel.coach-3'])
  ], { cond: ['role:rotation|backup', 'rel.coach<=20'], cd: 80, max: 4, xg: 'coach_relation', tier: 'minor', again: '훈련에서 소외됐던 지난번에는 "{prev}" 쪽을 택했다.' }),
  ch('pc_homecoming', P, 2, ['고향 클럽이 {name}의 복귀를 타진했다. 연봉은 낮지만 고향 팬들의 기대는 크다.', '고향의 오랜 팬들이 {name}의 복귀를 청원하는 서명을 모으고 있다.'], [
    cc('귀향 가능성을 열어 둔다', ['에이전트가 고향 클럽과 이야기를 시작했다.', 'fx:offers=many rel.agent+1 happy+3 fu:fu_career@10-26'], { chk: '48 agent*0.2 hid.family*0.1 fameD*0.1', pv: '이적 제안', bad: ['귀향설이 보도되며 현 구단 팬들이 등을 돌렸다.', 'rel.fans-6 rel.coach-3 stress+4 fu:fu_career@10-26'] }),
    cc('지금은 때가 아니다', ['"언젠가는 돌아가겠습니다."', 'rel.fans+1 happy-3 hid.family-1 fu:fu_career@10-26'])
  ], { cond: ['age>=28', 'hid.family>=50', 'abroad'], cd: 150, max: 2, xg: 'homecoming', tier: 'major' }),
  ch('pc_nutrition_supp', P, 2, ['팀 동료가 효과가 좋다며 보충제를 권했다. 성분표를 확인할 수도 있다.', '새 보충제를 사용해 보라는 권유를 받았다. 도핑 검사가 걱정된다.'], [
    cc('팀 닥터에게 먼저 확인한다', ['닥터가 성분을 조사해 문제가 될 만한 성분이 있음을 알려 주었다.', 'rel.coach+1 hid.pro+1 stress+2'], { pv: '안전 스트레스↑' }),
    cc('그냥 먹어 본다', ['한동안 컨디션이 좋아진 듯했다. 그러나 검사 결과를 기다리는 마음은 불안했다.', 'sharp+2 stress+3 fu:dope_1@8-16'], { chk: '62 hid.pro*0.25 hid.controversy*-0.2', bad: ['도핑 검사에서 금지 성분이 검출됐다.', 'fx:banned=12 fu:dope_1@2-4 stress+10'] })
  ], { cond: ['age>=20'], cd: 150, max: 1, xg: 'training_load', note: 'doping', tier: 'minor' }),
  ch('pc_coach_lunch', P, 2, ['{coach} 감독이 점심에 따로 불러 가볍게 이야기를 나누자고 했다. 분위기가 편안하다.', '감독과의 식사 자리. 전술과 개인적 고민이 오갔다.'], [
    cc('솔직하게 고민을 털어놓는다', ['감독은 의외로 따뜻하게 들어 주었다.', 'rel.coach+6 stress-4'], { chk: '55 rel.coach*0.2', bad: ['이야기가 엇나갔다. 감독이 말을 아꼈다.', 'rel.coach-1 stress+2'] }),
    cc('형식적인 대화만 한다', ['무난한 대화로 시간을 보냈다.', 'rel.coach+1 morale-2'])
  ], { cond: ['rel.coach>=-10'], cd: 80, max: 4, xg: 'coach_relation', tier: 'minor' }),
  ch('pc_foreign_interest', P, 3, ['{name}의 활약에 해외 구단이 관심을 보인다는 보도가 나왔다. 구단은 이적료가 맞아야 한다고 한다.', '에이전트가 "해외 진출이 가능할지도 모른다"고 귀띔했다.'], [
    cc('에이전트에게 협상을 맡긴다', ['에이전트가 분주히 움직였다. 몇 주 뒤 결과가 나올 것이다.', 'fx:offers=up rel.agent+2 stress+2 fu:fu_career@10-26'], { chk: '45 agent*0.3 fameD*0.2 form*0.2', pv: '이적 제안↑', bad: ['협상이 길어지며 구단과의 신뢰에 금이 갔다.', 'rel.coach-4 rel.fans-3 stress+4 fu:fu_career@10-26'] }),
    cc('지금 팀에 집중한다', ['"우선은 현재 팀에서 성과를 내겠습니다."', 'rel.coach+2 rel.fans+2 hid.loyalty+1 val-3 fameA-0.3 fu:fu_career@10-26'])
  ], { cond: ['window', 'fameD>=12', 'form>=6.9', 'lvl>=3', 'hasAgent'], cd: 80, max: 3, xg: 'transfer_talk', tier: 'major' }),
  ch('pc_rich_teammate', P, 2, ['부유한 동료가 별장 파티에 초대했다. 화려하지만 낯선 세계다.', '고급 승용차를 타고 다니는 동료가 파티에 함께 가자고 한다.'], [
    cc('초대를 받아들인다', ['화려한 파티에서 새로운 사람들을 만났다.', 'fameD+0.3 happy+4 drink+4 cashw-1'], { chk: '55 hid.pro*0.2 hid.thrift*0.2', bad: ['과소비 분위기에 휩쓸려 큰돈을 쓰고 말았다.', 'cash-80 stress+3'] }),
    cc('정중히 거절한다', ['"다음에 가겠습니다." 조용히 집에서 쉬었다.', 'hid.thrift+1 stress-2 rel.mates-3'])
  ], { cond: ['age>=20', 'wage>=3000'], cd: 100, max: 3, xg: 'locker_room', tier: 'minor' }),
  ch('pc_surprise_trial', P, 2, ['어린 선수가 선발 자리를 위협하고 있다. 감독도 눈여겨보는 눈치다.', '유스에서 올라온 신예가 {name}의 포지션에서 맹활약했다.'], [
    cc('멘토 역할을 자처한다', ['후배에게 조언을 아끼지 않았다. 팀 분위기가 좋아졌다.', 'rel.mates+4 rel.coach+2 attr.leadership+0.15'], { chk: '50 attr.leadership*1 hid.social*0.15', pv: '팀 분위기↑', bad: ['도와준 후배가 오히려 자리를 가져갔다.', 'rel.coach-2 morale-4 sharp-2'] }),
    cc('경쟁심을 불태운다', ['더 일찍 나와 더 열심히 훈련했다.', 'hid.ambition+2 fatigue+5 attr.positioning+0.1'])
  ], { cond: ['age>=24', 'role:starter|rotation'], cd: 100, max: 3, xg: 'transfer_talk', tier: 'minor' })
];
