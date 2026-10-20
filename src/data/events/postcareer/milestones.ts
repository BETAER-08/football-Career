import type { RawEvent } from '../../schema';
import { cc, ch } from '../helpers';

const PC: ('postcareer')[] = ['postcareer'];

export const milestoneEvents: RawEvent[] = [
  ch('ms_pun_1', PC, 30, [
    '지역 방송국이 고정 해설 자리를 제안했다. 매주 같은 시간에 마이크 앞에 앉아야 한다.',
    '객원 출연이 이어지자 지역 방송 PD가 정식 출연 계약서를 내밀었다.'
  ], [
    cc('고정 출연 계약을 맺는다', ['첫 정규 방송 날, 큐 사인과 함께 빨간 불이 켜졌다. 어느새 목소리가 안정되어 있었다.', 'fx:msUp postRep+0.8 happy+4'], {
      chk: '55 postSkill*0.25 postRep*0.2 hid.social*0.1', pv: '이정표 달성 수입↑',
      bad: ['첫 방송에서 말이 꼬였다. 제작진은 "다음 기회에"라고 했다.', 'fx:msDelay stress+4 postRep-0.3']
    }),
    cc('아직 준비가 안 됐다며 미룬다', ['"조금 더 배우고 오겠습니다." PD가 아쉬운 표정으로 서류를 거뒀다.', 'fx:msDelay postRep-0.4 hid.ambition-1'], { pv: '시간 벌기 기회 지연' })
  ], { cond: ['path:pundit', 'msN==0', 'pathWeeks>=8', 'postSkill>=12', 'sinceMs>=26'], cd: 26, max: 8, xg: 'milestone', tier: 'minor' }),
  ch('ms_pun_2', PC, 30, [
    '전국 방송사가 해설위원 자리를 제안했다. 이름값과 입담 모두를 시험받는 자리다.',
    '메이저 방송국에서 오디션 연락이 왔다. 대본 없이 90분을 이어 가야 한다.'
  ], [
    cc('전국 방송 오디션에 도전한다', ['카메라가 돌아가자 선수 시절의 기억이 말이 되어 흘러나왔다. 심사위원들이 고개를 끄덕였다.', 'fx:msUp postRep+1.2 fameD+0.5 happy+5'], {
      chk: '50 postSkill*0.25 postRep*0.25 fameD*0.1', pv: '이정표 달성 명성↑',
      bad: ['긴장이 풀리지 않아 후반부에 말이 막혔다. 결과는 보류였다.', 'fx:msDelay stress+5 postRep-0.4']
    }),
    cc('지금 자리에서 더 쌓고 다음에 도전한다', ['안정적인 자리를 지키기로 했다. 기회가 다시 올지는 모른다.', 'fx:msDelay postRep-0.3 stress-1'], { pv: '안정 기회 지연' })
  ], { cond: ['path:pundit', 'msN==1', 'pathYears>=2', 'postSkill>=25', 'postRep>=18', 'sinceMs>=26'], cd: 26, max: 8, xg: 'milestone', tier: 'minor' }),
  ch('ms_pun_3', PC, 30, [
    '대륙 대회 결승 중계 캐스터 자리에 {name}의 이름이 올랐다. 수십 개 나라가 함께 보는 생방송이다.',
    '중계 PD가 "결승전은 당신이 맡아 줬으면 한다"고 말했다. 부담이 몰려왔다.'
  ], [
    cc('결승 중계석에 앉는다', ['킥오프 휘슬과 함께 마이크를 잡았다. 마지막 골 장면에서 목소리가 떨렸다. 시청자들이 오래 기억할 중계였다.', 'fx:msUp postRep+1.5 fameD+0.8 happy+7'], {
      chk: '48 postSkill*0.25 postRep*0.25 stress*-0.2', pv: '이정표 달성 명성↑↑',
      bad: ['결정적 장면에서 선수 이름을 잘못 불렀다. SNS가 한동안 시끄러웠다.', 'fx:msDelay stress+8 postRep-0.8']
    }),
    cc('부담스럽다며 정중히 사양한다', ['"아직은 제 자리가 아닌 것 같습니다." 제작진은 다른 해설자를 찾았다.', 'fx:msDelay postRep-0.5 hid.ambition-2'], { pv: '부담 회피 기회 지연' })
  ], { cond: ['path:pundit', 'msN==2', 'pathYears>=5', 'postSkill>=42', 'postRep>=35', 'sinceMs>=26'], cd: 26, max: 8, xg: 'milestone', tier: 'minor' }),
  ch('ms_pun_4', PC, 30, [
    '월드컵 메인 해설 자리를 맡아 달라는 제안이 왔다. 해설가라면 누구나 꿈꾸는 무대다.',
    '월드컵 중계팀 구성이 발표됐다. 메인 해설 이름 옆에 {name}이(가) 적혀 있다.'
  ], [
    cc('월드컵 메인 해설을 맡는다', ['개막전 마이크 앞에서 숨을 길게 내쉬었다. 한 달 내내 수많은 사람이 {name}의 목소리와 함께 경기를 봤다.', 'fx:msUp postRep+2 fameD+1.2 happy+9'], {
      chk: '46 postSkill*0.25 postRep*0.25 fameD*0.1', pv: '마지막 이정표 명성↑↑↑',
      bad: ['대회 초반 돌발 발언이 논란이 되어 일부 경기에서 배제됐다.', 'fx:msDelay stress+7 postRep-0.8']
    }),
    cc('후배에게 자리를 양보한다', ['"이번엔 후배가 맡는 게 맞습니다." 방송가에서는 의외라는 반응이 나왔다.', 'fx:msDelay postRep+0.2 hid.ambition-3 happy-1'], { pv: '양보 이정표 지연' })
  ], { cond: ['path:pundit', 'msN==3', 'pathYears>=9', 'postSkill>=60', 'postRep>=55', 'sinceMs>=26'], cd: 26, max: 8, xg: 'milestone', tier: 'minor' }),
  ch('ms_adm_1', PC, 30, [
    '구단이 정식 스카우트 채용 의사를 전해 왔다. 견습 기간 동안 쓴 리포트가 호평을 받았다.',
    '스카우트 부서장이 "이제 정식 직함을 줘도 되겠다"며 면담을 요청했다.'
  ], [
    cc('정식 스카우트로 계약한다', ['명함에 처음 직함이 찍혔다. 주말마다 낯선 경기장을 도는 삶이 시작됐다.', 'fx:msUp postSkill+1 happy+4'], {
      chk: '55 postSkill*0.25 postRep*0.2 hid.social*0.1', pv: '이정표 달성 수입↑',
      bad: ['면담에서 평가 기준에 대한 질문에 답이 막혔다. 채용은 보류됐다.', 'fx:msDelay stress+4 postRep-0.3']
    }),
    cc('견습 기간을 더 늘려 달라고 한다', ['조금 더 배우고 싶다고 말했다. 부서장은 고개를 끄덕였지만 기회가 사라질 수도 있다.', 'fx:msDelay postRep-0.4 hid.ambition-1'], { pv: '준비 기회 지연' })
  ], { cond: ['path:admin', 'msN==0', 'pathWeeks>=8', 'postSkill>=12', 'sinceMs>=26'], cd: 26, max: 8, xg: 'milestone', tier: 'minor' }),
  ch('ms_adm_2', PC, 30, [
    '테크니컬 디렉터 자리가 비었다. 스카우트팀과 아카데미를 함께 이끌 사람이 필요하다는 이야기다.',
    '단장이 {name}을(를) 따로 불렀다. "선수단 구성의 큰 그림을 함께 그려 보자."'
  ], [
    cc('테크니컬 디렉터 자리를 받아들인다', ['책상 위에 선수단 구성표가 펼쳐졌다. 숫자와 사람의 이야기가 함께 보이기 시작했다.', 'fx:msUp postSkill+1.5 postRep+0.8'], {
      chk: '50 postSkill*0.3 postRep*0.2', pv: '이정표 달성 연봉↑',
      bad: ['첫 보고에서 구단 철학과 맞지 않는다는 지적을 받았다. 자리는 보류됐다.', 'fx:msDelay stress+5 postRep-0.4']
    }),
    cc('현장 스카우트로 더 남겠다고 한다', ['현장에 남기로 했다. 책상보다 경기장이 편한 사람이다.', 'fx:msDelay postRep-0.3 happy+1'], { pv: '현장 유지 기회 지연' })
  ], { cond: ['path:admin', 'msN==1', 'pathYears>=3', 'postSkill>=35', 'sinceMs>=26'], cd: 26, max: 8, xg: 'milestone', tier: 'minor' }),
  ch('ms_adm_3', PC, 30, [
    '단장이 자리를 떠난다는 소식과 함께 구단주가 후임으로 {name}을(를) 거론했다.',
    '구단주가 단장직을 제안했다. 이적료, 임금, 감독 선임을 모두 책임져야 한다.'
  ], [
    cc('단장직을 수락한다', ['취임 첫날 책상 위에는 이적 후보 명단과 재정 보고서가 쌓여 있었다. 책임의 무게가 어깨에 얹혔다.', 'fx:msUp postSkill+2 postRep+1.2 happy+5'], {
      chk: '48 postSkill*0.3 postRep*0.25', pv: '이정표 달성 연봉↑↑',
      bad: ['이사회 면접에서 재정 계획이 설득력을 얻지 못했다. 단장직은 보류됐다.', 'fx:msDelay stress+6 postRep-0.5']
    }),
    cc('아직 이르다며 사양한다', ['"조금 더 현장을 보고 싶습니다." 구단주는 다른 후보를 알아보겠다고 했다.', 'fx:msDelay postRep-0.5 hid.ambition-2'], { pv: '신중함 기회 지연' })
  ], { cond: ['path:admin', 'msN==2', 'pathYears>=7', 'postSkill>=55', 'postRep>=35', 'sinceMs>=26'], cd: 26, max: 8, xg: 'milestone', tier: 'minor' }),
  ch('ms_adm_4', PC, 30, [
    '협회 임원 선거 출마 권유와 해외 구단 단장 제안이 같은 주에 도착했다. 어느 쪽도 쉽게 오지 않는 기회다.',
    '축구협회 관계자와 해외 구단 대리인이 동시에 연락해 왔다. 마지막 도전이 될지도 모른다.'
  ], [
    cc('협회 임원에 도전한다', ['선거 운동은 쉽지 않았지만 현장의 목소리를 전했다. 결국 임원단에 이름이 올랐다.', 'fx:msUp postSkill+2 postRep+2 happy+6'], {
      chk: '46 postSkill*0.25 postRep*0.3 fameD*0.1', pv: '마지막 이정표 정치적 부담',
      bad: ['표 대결에서 아깝게 졌다. 정치의 벽은 높았다.', 'fx:msDelay stress+6 happy-4']
    }),
    cc('해외 구단 단장직을 수락한다', ['낯선 도시, 낯선 언어. 새 사무실에서 새 팀의 구성표를 펼쳤다.', 'fx:msUp postSkill+2 postRep+1.5 stress+5 fx:langUp=8'], {
      chk: '44 postSkill*0.3 postRep*0.2 hid.adapt*0.2', pv: '마지막 이정표 해외 적응',
      bad: ['언어와 문화의 벽을 넘지 못하고 협상이 결렬됐다.', 'fx:msDelay stress+7 postRep-0.4']
    }),
    cc('지금 자리에서 마무리한다', ['"여기까지가 제 자리입니다." 담담한 목소리로 말했다.', 'fx:msDelay postRep-0.3 happy+1 hid.ambition-3'], { pv: '현재 유지 이정표 지연' })
  ], { cond: ['path:admin', 'msN==3', 'pathYears>=11', 'postSkill>=70', 'postRep>=50', 'sinceMs>=26'], cd: 26, max: 8, xg: 'milestone', tier: 'minor' }),
  ch('ms_biz_1', PC, 30, [
    '동네 상가 한 칸이 나왔다. 아이들에게 축구를 가르치는 교실을 열어 볼까 하는 생각이 든다.',
    '지인이 체육관 자리를 소개했다. 월세는 부담되지만 유소년 수업을 열 수 있는 공간이다.'
  ], [
    cc('축구 교실을 개업한다', ['첫 수업 날 아이들이 공을 안고 줄지어 들어왔다. 간판에 이름이 걸렸다.', 'fx:msUp postSkill+1 happy+5 business+800'], {
      chk: '50 postSkill*0.2 hid.thrift*-0.1 hid.social*0.15', pv: '이정표 달성 사업',
      bad: ['수강생이 좀처럼 모이지 않아 첫 달 적자가 컸다. 개업은 일단 미뤘다.', 'fx:msDelay stress+5 cashw-2']
    }),
    cc('조금 더 준비하고 나중에 연다', ['임대 계약서를 도로 접었다. 놓친 기회일지도 모른다.', 'fx:msDelay hid.ambition-1 postRep-0.2'], { pv: '신중함 기회 지연' })
  ], { cond: ['path:business', 'msN==0', 'pathWeeks>=8', 'cash>=1500', 'sinceMs>=26'], cd: 26, max: 8, xg: 'milestone', tier: 'minor' }),
  ch('ms_biz_2', PC, 30, [
    '수강생이 늘어 대기자가 생겼다. 다른 동네에 분점을 낼 수 있겠다는 이야기가 나온다.',
    '학부모들이 "우리 동네에도 열어 달라"고 요청했다. 지점 확장을 고민할 때다.'
  ], [
    cc('지점을 확장한다', ['두 번째 교실이 문을 열었다. 코치 채용과 관리가 새로운 숙제가 됐다.', 'fx:msUp postSkill+1.5 happy+4 business+2000'], {
      chk: '48 postSkill*0.3 hid.thrift*-0.1 hid.social*0.1', pv: '이정표 달성 매출↑',
      bad: ['새 지점의 입지가 좋지 않아 적자가 이어졌다. 확장 계획은 보류했다.', 'fx:msDelay stress+6 cashw-3']
    }),
    cc('지금 규모를 유지한다', ['무리하지 않기로 했다. 안정이 소중한 때다.', 'fx:msDelay postRep-0.2 stress-1'], { pv: '안정 기회 지연' })
  ], { cond: ['path:business', 'msN==1', 'pathYears>=3', 'postSkill>=25', 'business>=1', 'sinceMs>=26'], cd: 26, max: 8, xg: 'milestone', tier: 'minor' }),
  ch('ms_biz_3', PC, 30, [
    '지역 유소년 대회 후원사가 아카데미 설립을 제안했다. 시설과 코칭 인력, 장학 제도까지 준비해야 한다.',
    '"아카데미를 세워 보시죠." 지자체와 후원사가 손을 내밀었다.'
  ], [
    cc('유소년 아카데미를 설립한다', ['개원식 날 어린 선수들이 유니폼을 입고 줄을 섰다. 오래 그려 온 그림이 현실이 됐다.', 'fx:msUp postSkill+2 postRep+1.2 happy+7 business+5000'], {
      chk: '46 postSkill*0.3 postRep*0.2 hid.thrift*-0.1', pv: '이정표 달성 명성↑',
      bad: ['인가와 시설 문제로 개원이 한참 미뤄졌다. 자금만 묶였다.', 'fx:msDelay stress+7 cashw-4']
    }),
    cc('규모를 줄여 교실 형태로 운영한다', ['큰 판은 접고 현재 사업을 단단히 하기로 했다.', 'fx:msDelay postRep-0.3 happy+1'], { pv: '안정 기회 지연' })
  ], { cond: ['path:business', 'msN==2', 'pathYears>=6', 'postSkill>=42', 'net>=15000', 'sinceMs>=26'], cd: 26, max: 8, xg: 'milestone', tier: 'minor' }),
  ch('ms_biz_4', PC, 30, [
    '재정난에 빠진 하부리그 구단이 새 주인을 찾고 있다. 구단을 직접 운영해 보는 일은 늘 꿈이었다.',
    '지인이 소규모 구단 지분 인수 이야기를 꺼냈다. 위험도 크지만 의미도 크다.'
  ], [
    cc('구단 지분을 인수한다', ['인수 서명을 마친 날 팬들이 정문 앞에서 박수를 보냈다. 구단 운영이라는 새로운 책임이 시작됐다.', 'fx:msUp postSkill+2 postRep+2 happy+9 cashy-0.5'], {
      chk: '44 postSkill*0.3 postRep*0.2 hid.thrift*-0.1', pv: '마지막 이정표 큰 투자',
      bad: ['실사 과정에서 숨은 부채가 드러나 협상이 결렬됐다.', 'fx:msDelay stress+8 cashw-3']
    }),
    cc('투자를 접고 현재 사업에 집중한다', ['"분수에 맞게 가자." 그렇게 마음을 접었다.', 'fx:msDelay happy-1 postRep-0.4'], { pv: '안정 기회 지연' })
  ], { cond: ['path:business', 'msN==3', 'pathYears>=10', 'postSkill>=58', 'net>=40000', 'sinceMs>=26'], cd: 26, max: 8, xg: 'milestone', tier: 'minor' }),
  ch('epi_wrap', PC, 1, [
    '이정표를 하나둘 지나온 시간을 돌아보았다. 이제 축구 인생을 마무리해도 좋을지 마음이 묻는다.',
    '오랜 시간이 흘렀다. 이 길을 어디까지 걸어갈지, 이쯤에서 내려놓을지 조용히 생각했다.'
  ], [
    cc('마무리한다', ['"여기까지 하겠습니다." 오랜 축구 인생에 고요하게 마침표를 찍었다.', 'fx:epiEnd'], { pv: '축구 인생 종료' }),
    cc('조금 더 이어 간다', ['"조금만 더." 다음에 다시 이 질문을 마주할 것이다.', 'fx:epiAsk happy+2'], {
      chk: '50 postRep*0.15 stress*-0.2 happy*0.2', pv: '5년 뒤 다시 묻는다',
      bad: ['이어 가겠다고 했지만 마음 한구석이 무거웠다.', 'fx:epiAsk stress+4 happy-2']
    })
  ], { sched: true, cd: 0, max: 99, xg: 'epi_wrap', tier: 'minor' })
];
