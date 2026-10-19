import type { RawEvent } from '../../schema';
import { cc, ch, HELP_ADDICT } from '../helpers';

const C: ('coach')[] = ['coach'];
const M = 'coachRole:manager';
const J = 'coachRole:manager|assistant|youthCoach';

export const coachChoice: RawEvent[] = [
  ch('co_c_star_demand', C, 4, ['핵심 선수 {star}이(가) 선발 출전 보장을 공개적으로 요구했다. 팀의 중심이지만 요구를 받아들이면 다른 선수들이 흔들릴 수 있다.', '{star}이(가) 에이전트를 통해 선발 보장과 역할 확대를 요구했다.'], [
    cc('요구를 받아들인다', ['"앞으로도 중심은 너다." 선수는 환히 웃었지만 일부 선수들의 눈빛이 달라졌다.', 'rel.captain-4 management-0.1 standing+2 stress+2'], { pv: '스타 만족 팀 분위기↓' }),
    cc('단호하게 거절한다', ['"선발은 훈련에서 정한다." 라커룸이 술렁였다.', 'leadership+0.2 standing-2 stress+3'], { chk: '46 leadership*0.4 management*0.3 rel.owner*0.1', bad: ['선수와 관계가 틀어졌다. 언론이 불화설을 보도했다.', 'standing-6 rel.media-3 stress+6'] }),
    cc('역할 확대를 약속하되 선발은 보장하지 않는다', ['절충안으로 합의했다. 서로 한 발씩 물러났다.', 'management+0.15 stress+1'], { chk: '52 management*0.4 leadership*0.2', bad: ['선수는 약속이 부족하다고 느꼈다.', 'standing-2 stress+3'] })
  ], { cond: [M], cd: 80, max: 4 }),
  ch('co_c_captain_conflict', C, 3, ['주장과 핵심 선수 사이에 불화가 생겼다. 라커룸 분위기가 팽팽하다.', '훈련 중 두 베테랑이 설전을 벌였다. 코치진이 말렸지만 앙금이 남았다.'], [
    cc('두 선수를 따로 불러 중재한다', ['각자의 이야기를 끝까지 들었다. 서로의 오해가 풀렸다.', 'management+0.2 leadership+0.1 standing+2'], { chk: '50 management*0.4 leadership*0.3', bad: ['중재가 역효과를 냈다. 선수들은 더 서먹해졌다.', 'standing-3 stress+4'] }),
    cc('팀 규율로 엄하게 다스린다', ['벌금과 경고로 분위기를 잡았다. 긴장이 팽팽해졌다.', 'leadership+0.1 standing-1 stress+2']),
    cc('시간이 해결해 주길 기다린다', ['일단 지켜보기로 했다. 며칠 뒤 분위기는 조금 가라앉았다.', 'stress+2'], { chk: '48 management*0.2', bad: ['갈등이 곪아 경기력에도 영향을 주었다.', 'standing-4'] })
  ], { cond: [M], cd: 80, max: 3 }),
  ch('co_c_board_pressure', C, 3, ['이사회가 특정 선수 영입을 사실상 지시했다. 감독의 구상과는 맞지 않는 선수다.', '구단 임원들이 "투자 가치가 높은 선수"를 영입하라고 압박했다.'], [
    cc('이사회의 뜻을 받아들인다', ['"구단의 방침이라면 따르겠습니다." 선수는 팀에 합류했다.', 'rel.director+4 rel.owner+3 standing-1 tactics-0.1'], { pv: '구단 관계↑ 전술 부담↑' }),
    cc('감독의 철학을 이유로 거절한다', ['분명하게 선을 그었다. 회의실 공기가 얼어붙었다.', 'leadership+0.2 coachFame+0.1 rel.director-5 rel.owner-4'], { chk: '42 coachFame*0.3 standing*0.25 leadership*0.2', bad: ['이사회는 고집으로 받아들였다. 입지가 크게 흔들렸다.', 'standing-8 rel.director-8'] }),
    cc('협상하며 대안을 제시한다', ['데이터와 영상을 근거로 대안을 제시했다. 이사회가 수긍했다.', 'management+0.2 data+0.1 rel.director+2'], { chk: '48 data*0.35 management*0.25 media*0.1' })
  ], { cond: [M], cd: 100, max: 3 }),
  ch('co_c_owner_interfere', C, 2, ['구단주가 직접 선수 기용에 대해 의견을 전했다. 특정 선수를 선발로 쓰라는 요구다.', '구단주가 경기 전 라커룸에 나타나 전술에 대해 한마디 했다.'], [
    cc('정중히 따른다', ['"알겠습니다." 구단주는 흡족해했지만 코치들은 불편해했다.', 'rel.owner+5 standing+2 leadership-0.1 tactics-0.1'], { pv: '구단주 관계↑ 권위↓' }),
    cc('감독 고유 권한임을 분명히 한다', ['"선수 선발은 저에게 맡겨 주십시오." 단호한 태도에 구단주가 말을 삼켰다.', 'leadership+0.2 rel.owner-4'], { chk: '45 standing*0.3 coachFame*0.2', bad: ['구단주가 크게 화를 냈다. 입지가 위태로워졌다.', 'standing-9 rel.owner-10 stress+6'] })
  ], { cond: [M], cd: 120, max: 2 }),
  ch('co_c_formation', C, 4, ['부진이 이어지자 전술 변화를 고민하게 됐다. 포메이션을 바꿀까, 기존 철학을 고수할까?', '상대 팀 분석 결과 우리 약점이 드러났다. 전술 변화를 고려할 때다.'], [
    cc('포메이션을 과감하게 바꾼다', ['선수들에게 새 전술을 설명하고 훈련에 들어갔다.', 'tactics+0.15'], { chk: '48 tactics*0.4 data*0.15 leadership*0.1', great: ['전술 변화가 적중했다. 팀이 완전히 달라졌다.', 'standing+8 coachFame+0.4 tactics+0.3'], bad: ['변화가 혼란을 불렀다. 팀의 정체성이 흔들렸다.', 'standing-5 stress+4'] }),
    cc('기존 철학을 고수한다', ['"우리 축구를 믿는다." 선수들이 서로를 바라보며 고개를 끄덕였다.', 'leadership+0.1 stress+2'], { chk: '50 standing*0.2 leadership*0.2', bad: ['결과가 따라오지 않으면서 비판이 거세졌다.', 'standing-4'] })
  ], { cond: [M, 'standing<=55'], cd: 40, max: 6 }),
  ch('co_c_rotation', C, 3, ['일정이 빡빡하다. 로테이션을 돌릴지 주전을 고수할지 결정해야 한다.', '주중 경기와 주말 경기가 연이어 있다. 선수들의 피로가 눈에 띈다.'], [
    cc('로테이션을 가동한다', ['주전 일부를 쉬게 하고 백업을 투입했다.', 'management+0.1 standing-1 development+0.1'], { chk: '50 management*0.3 data*0.15', great: ['백업들이 기대 이상으로 활약했다. 팀 깊이가 증명됐다.', 'standing+4 development+0.2 rel.captain+2'], bad: ['조합이 어색해 승점을 놓쳤다.', 'standing-4'] }),
    cc('주전을 그대로 기용한다', ['최상의 조합으로 승부를 걸었다.', 'standing+1 stress+2'], { chk: '55 management*0.2', bad: ['과로한 주전이 쓰러졌다. 부상자가 늘었다.', 'standing-3 stress+4'] })
  ], { cond: [M], cd: 60, max: 6 }),
  ch('co_c_youth_debut', C, 3, ['유스 출신 신예가 훈련에서 두각을 나타냈다. 1군 데뷔시킬까?', '코칭스태프가 "이제 기회를 줄 때"라며 유망주를 추천했다.'], [
    cc('데뷔시킨다', ['{star}이(가) 감독의 믿음에 보답했다. 팬들이 환호했다.', 'development+0.2 coachFame+0.15 rel.fans+3'], { chk: '48 development*0.35 management*0.1', great: ['대단한 활약이었다. 팀이 새로운 스타를 얻었다.', 'development+0.4 coachFame+0.4 standing+4'], bad: ['경험 부족이 드러났다. 선수도 큰 상처를 입었다.', 'standing-3 development-0.1'] }),
    cc('조금 더 기다린다', ['"준비가 되었을 때 기회를 주겠다."', 'management+0.05'])
  ], { cond: [J], cd: 60, max: 6 }),
  ch('co_c_media_blast', C, 3, ['기자회견에서 기자가 날카롭게 감독의 퇴진 가능성을 물었다. 모든 카메라가 감독을 향한다.', '기자가 "경질설에 대한 입장은?"이라고 물었다.'], [
    cc('차분하고 단호하게 대답한다', ['"저는 제 일에 집중합니다." 짧고 단단한 대답이 인상적이었다.', 'media+0.15 coachFame+0.1 standing+1'], { chk: '50 media*0.4 standing*0.1', bad: ['긴장한 탓에 말이 꼬였다. 기사 제목이 뽑혔다.', 'media-0.1 standing-2 stress+3'] }),
    cc('기자에게 정면으로 맞선다', ['날 선 반박이 오갔다. 영상이 퍼졌다.', 'coachFame+0.1 rel.media-5 stress+3'], { chk: '40 media*0.3 leadership*0.2', bad: ['감정적인 대응이 문제가 되었다. 구단 홍보팀이 수습에 나섰다.', 'standing-4 rel.media-8 rel.owner-3'] }),
    cc('질문을 피하고 다음 경기 이야기로 넘긴다', ['"다음 경기에 대해 이야기합시다."', 'media+0.02 rel.media-2'])
  ], { cond: [M, 'standing<=50'], cd: 80, max: 4, note: 'coach_fired' }),
  ch('co_c_scout_sign', C, 3, ['스카우트가 낯선 리그의 선수를 강력히 추천했다. 데이터는 좋지만 직접 본 적은 없다.', '스카우트팀이 저비용 고효율 영입 후보를 제시했다. 리스크가 있다.'], [
    cc('영입을 요청한다', ['구단과 협상을 시작했다. 결과는?', 'data+0.1'], { chk: '45 data*0.4 rel.director*0.2', great: ['영입이 성공적이었다. 선수는 곧바로 팀의 핵심이 됐다.', 'standing+5 data+0.2 rel.director+4'], bad: ['선수는 적응에 실패했다. 영입 실패라는 비판이 나왔다.', 'standing-3 rel.director-3'] }),
    cc('직접 확인 후에 결정한다', ['출장을 다녀온 뒤 신중하게 판단하기로 했다.', 'data+0.05 fatigue+4'])
  ], { cond: [M, 'window'], cd: 80, max: 4 }),
  ch('co_c_budget', C, 2, ['구단이 이번 시즌 이적 예산을 줄인다고 통보했다. 선수단 보강이 쉽지 않다.', '재정 건전화를 이유로 영입 예산이 삭감됐다.'], [
    cc('유스를 적극 활용한다', ['예산 대신 유스와 육성으로 승부를 걸기로 했다.', 'development+0.2 standing-1 rel.director+3'], { chk: '48 development*0.4', bad: ['어린 선수들의 경험 부족이 성적에 영향을 주었다.', 'standing-4'] }),
    cc('구단에 예산 증액을 요구한다', ['구단 수뇌부와 협상에 나섰다.', 'management+0.1'], { chk: '40 rel.director*0.25 coachFame*0.2 standing*0.15', bad: ['요구는 받아들여지지 않았고 관계가 어색해졌다.', 'rel.director-6 standing-3'], great: ['구단이 일부 예산을 되돌려 주었다.', 'standing+3 rel.director+3'] })
  ], { cond: [M], cd: 100, max: 3 }),
  ch('co_c_assistant_clash', C, 3, ['수석코치와 전술 의견 충돌이 생겼다. 서로의 자존심이 걸려 있다.', '코치진 회의가 격해졌다. 의견 차이가 감정으로 번졌다.'], [
    cc('수석코치의 의견을 받아들인다', ['"그 방향이 맞을 수도 있겠군요." 코치진의 분위기가 좋아졌다.', 'management+0.15 rel.captain+1'], { chk: '55 tactics*0.2 leadership*0.1', bad: ['받아들인 전술이 팀과 맞지 않았다.', 'standing-3'] }),
    cc('감독의 권한으로 결정한다', ['"결정은 내가 한다." 단호했지만 분위기는 싸늘해졌다.', 'leadership+0.1 management-0.05 stress+2']),
    cc('두 안을 모두 시험해 본다', ['훈련에서 두 전술을 시험했다. 선수들의 반응이 갈렸다.', 'tactics+0.1 data+0.1'])
  ], { cond: [M], cd: 80, max: 3 }),
  ch('co_c_injured_star', C, 3, ['핵심 선수 {star}이(가) 중요한 경기를 앞두고 부상 회복 단계에 있다. 의무팀은 신중을 권한다.', '리그 우승 경쟁이 한창이다. 핵심 선수의 복귀 시점을 놓고 고민이 길어진다.'], [
    cc('완전히 회복할 때까지 쉬게 한다', ['"장기적으로 보자." 선수는 고개를 끄덕였다.', 'management+0.1 standing-1'], { pv: '재발 위험↓' }),
    cc('기용을 강행한다', ['큰 경기에 핵심 선수를 투입했다.', 'standing+2 stress+3'], { chk: '45 management*0.2 data*0.1', bad: ['{star}이(가) 경기 중 다시 쓰러졌다. 시즌 아웃 판정이 내려졌다.', 'standing-6 management-0.1 stress+6'] })
  ], { cond: [M], cd: 60, max: 4, note: 'inj_early' }),
  ch('co_c_discipline', C, 3, ['선수 한 명이 새벽까지 이어진 술자리로 문제를 일으켰다. 팀 규율을 어떻게 다룰지 결정해야 한다.', '핵심 선수가 훈련에 지각하고 구단 규율을 어겼다.'], [
    cc('엄격한 징계를 내린다', ['출전 정지와 벌금을 결정했다. 팀 규율이 한층 단단해졌다.', 'leadership+0.2 standing+1 stress+2'], { pv: '규율↑' }),
    cc('개인 면담으로 풀어 간다', ['선수와 긴 이야기를 나눴다. 눈물이 오갔다.', 'management+0.2 rel.captain+1'], { chk: '50 management*0.3 leadership*0.2', bad: ['선수는 같은 일을 반복했다. 신뢰가 흔들렸다.', 'standing-3 leadership-0.1'] }),
    cc('모르는 척 넘어간다', ['"한 번은 눈감아 주자." 분위기가 느슨해졌다.', 'leadership-0.15 standing-2'])
  ], { cond: [M], cd: 80, max: 4, heavy: true, help: HELP_ADDICT }),
  ch('co_c_fans_protest', C, 2, ['팬들이 훈련장 앞에서 항의 집회를 열었다. 선수단과 직접 대화를 요구한다.', '서포터즈 대표가 감독과의 면담을 요청했다.'], [
    cc('직접 나가 팬들의 이야기를 듣는다', ['팬들과 마주 앉아 한 시간 넘게 이야기를 나눴다. 분위기가 한결 누그러졌다.', 'rel.fans+6 media+0.1 stress+3'], { chk: '48 media*0.3 leadership*0.2', bad: ['분위기가 격해졌다. 일부가 야유를 퍼부었다.', 'rel.fans-4 stress+6 standing-3'] }),
    cc('구단 대변인에게 맡긴다', ['"구단이 공식 입장을 낼 것입니다."', 'rel.fans-2 stress-1'])
  ], { cond: [M, 'standing<=50'], cd: 100, max: 3 }),
  ch('co_c_derby_motiv', C, 3, ['더비를 앞두고 선수단 분위기가 팽팽하다. 어떤 방식으로 동기부여를 줄까?', '지역 더비가 일주일 앞이다. 라커룸에서 한마디 해야 한다.'], [
    cc('뜨거운 연설로 투지를 끌어올린다', ['라커룸이 울릴 만큼 목소리를 높였다. 선수들의 눈빛이 달라졌다.', 'leadership+0.15 morale+4'], { chk: '48 leadership*0.4 media*0.1', bad: ['과열된 분위기가 오히려 경기를 어렵게 했다.', 'standing-3'] }),
    cc('차분히 전술에 집중하게 한다', ['"이기려면 냉정해야 한다." 침착한 분위기로 경기에 나섰다.', 'tactics+0.1 standing+1'])
  ], { cond: [M], cd: 80, max: 4 }),
  ch('co_c_halftime', C, 3, ['하프타임, 0-2로 끌려가고 있다. 라커룸의 분위기는 가라앉았다.', '전반전 부진으로 팬들의 야유를 들으며 라커룸으로 들어왔다.'], [
    cc('선수들을 다그친다', ['"이게 우리 실력이냐!" 라커룸이 뜨거워졌다. 후반 선수들의 눈빛이 달라졌다.', 'leadership+0.1 morale+2'], { chk: '45 leadership*0.4', great: ['선수들이 되살아났다. 극적인 역전이었다.', 'standing+6 coachFame+0.3'], bad: ['선수들이 더 위축됐다. 후반에도 무너졌다.', 'standing-4'] }),
    cc('차분히 전술을 수정한다', ['보드에 선을 그으며 전술을 조정했다.', 'tactics+0.1'], { chk: '48 tactics*0.4 data*0.1', great: ['정확한 수정이 경기 흐름을 바꿨다.', 'standing+5 coachFame+0.3 tactics+0.2'], bad: ['수정이 오히려 균형을 무너뜨렸다.', 'standing-3'] })
  ], { cond: [M], cd: 60, max: 6 }),
  ch('co_c_other_club', C, 3, ['더 큰 구단이 {name}에게 접촉해 왔다. 지금 팀과의 계약은 아직 남아 있다.', '에이전트가 더 높은 수준의 구단이 관심이 있다고 알렸다.'], [
    cc('협상 테이블에 앉아 본다', ['비밀리에 이야기를 나눴다. 소문이 새어 나갔다.', 'fx:coachOffers=more rel.owner-3 stress+3'], { pv: '제안↑ 구단 관계↓' }),
    cc('지금 팀에 집중한다', ['"저는 이 팀에서 할 일이 남았습니다."', 'rel.owner+3 rel.fans+2 standing+2'])
  ], { cond: [M, 'coachFame>=25', 'standing>=55'], cd: 100, max: 4 }),
  ch('co_c_contract_ext', C, 2, ['구단이 계약 연장을 제안했다. 조건은 괜찮지만 장기 계약은 부담이 되기도 한다.', '이사회가 재계약 의사를 밝혔다. 기간은 길지만 위약 조건이 걸려 있다.'], [
    cc('연장 계약에 서명한다', ['안정적인 기반 위에서 일을 이어 가기로 했다.', 'standing+4 rel.owner+3 stress-3'], { pv: '안정↑' }),
    cc('현 계약을 유지한다', ['"시즌이 끝난 뒤에 이야기하죠."', 'stress+1'])
  ], { cond: [M, 'standing>=55'], cd: 100, max: 3, note: 'coach_tenure' }),
  ch('co_c_family_time', C, 3, ['아이의 학예회와 중요한 경기 일정이 겹쳤다. 두 곳 모두 가고 싶은 마음이 간절하다.', '가족이 "이번 주말만큼은 같이 있자"고 말했다. 하지만 경기가 있다.'], [
    cc('가족과 시간을 보낸다', ['경기를 코치에게 맡기고 가족 곁을 지켰다. 마음이 따뜻해졌다.', 'happy+8 stress-6 rel.partner+5 standing-1'], { pv: '행복↑ 경기 부담' }),
    cc('경기에 집중한다', ['가족에게 사과했다. 이해해 주었지만 서운함이 남았다.', 'rel.partner-4 stress+3 standing+1'])
  ], { cond: [J, 'dating'], cd: 80, max: 4 }),
  ch('co_c_data_team', C, 2, ['구단이 데이터 분석팀 확대를 검토 중이다. 예산 일부를 이쪽에 쓸 수도 있다.', '분석관이 새로운 분석 시스템 도입을 제안했다.'], [
    cc('투자를 요청한다', ['데이터 분석팀을 꾸리기로 했다. 비용이 크지만 장기적으로 이득이 될 것이다.', 'data+0.3 rel.director+1 cashw-0'], { chk: '45 data*0.3 rel.director*0.2', bad: ['구단은 시기상조라며 반대했다.', 'rel.director-2'] }),
    cc('현 인력으로 해결한다', ['지금 있는 자원으로 최선을 다하기로 했다.', 'data+0.05'])
  ], { cond: [M], cd: 100, max: 2 }),
  ch('co_c_book_deal', C, 2, ['출판사가 {name}의 전술 철학을 담은 책을 내자고 제안했다. 이름을 알릴 좋은 기회다.', '지도서 출간 제안이 도착했다.'], [
    cc('집필에 나선다', ['밤마다 책상 앞에 앉았다. 책이 나오자 서점가에서 화제가 되었다.', 'coachFame+1 media+0.3 cashw+4 stress+3'], { pv: '명성↑ 수입↑' }),
    cc('사양한다', ['"아직은 쌓을 때"라고 판단했다.', 'tactics+0.05'])
  ], { cond: ['coachFame>=40'], cd: 200, max: 1 }),
  ch('co_c_tv_offer', C, 2, ['방송국이 해설위원 겸 게스트 출연을 제안했다. 비시즌이나 휴직 중에 도움이 될 수 있다.', '방송사가 {name}에게 분석 프로그램 패널을 맡아 달라고 했다.'], [
    cc('출연한다', ['방송 출연은 새로운 경험이었다. 시청자 반응이 좋았다.', 'media+0.3 coachFame+0.3 cashw+2 fatigue+3'], { chk: '48 media*0.3', bad: ['말이 어색했다. 반응이 신통치 않았다.', 'media+0.05 stress+2'] }),
    cc('거절한다', ['지도자 업무에만 집중하겠다고 했다.', 'tactics+0.03'])
  ], { cond: ['coachFame>=25'], cd: 100, max: 3 }),
  ch('co_c_youth_policy', C, 3, ['구단이 육성과 성적 중 무엇을 우선할지 감독에게 물었다. 대답에 따라 구단의 운영이 달라질 수 있다.', '이사회가 "장기 육성과 단기 성적 중 선택하라"고 요청했다.'], [
    cc('육성을 우선한다', ['어린 선수들을 키우며 장기 프로젝트를 밀어붙였다.', 'development+0.3 standing-2 rel.director+2'], { pv: '육성↑ 성적↓' }),
    cc('성적을 우선한다', ['즉시 전력감으로 승부를 걸기로 했다.', 'standing+2 development-0.1']),
    cc('절충안을 제시한다', ['균형 잡힌 운영 철학을 제시했다.', 'management+0.15'], { chk: '50 management*0.3 data*0.1', bad: ['모호하다는 평을 받았다.', 'standing-1'] })
  ], { cond: [M], cd: 150, max: 2 }),
  ch('co_c_scandal', C, 2, ['핵심 선수의 사생활 스캔들이 터졌다. 기자들이 구단에 몰려들었다.', '언론이 선수 한 명의 스캔들을 대서특필했다. 라커룸이 술렁였다.'], [
    cc('선수를 공개적으로 감싼다', ['"선수의 사생활은 우리가 지킨다." 선수는 감사해했다.', 'management+0.1 rel.captain+2 rel.media-2'], { pv: '선수 신뢰↑' }),
    cc('구단 징계위원회에 맡긴다', ['"구단 규정에 따라 처리하겠다." 선수는 서운해했다.', 'leadership+0.1 standing+1']),
    cc('선수를 제외하고 팀을 정비한다', ['논란을 정리하기 위해 선수를 한동안 제외했다.', 'leadership+0.1 standing-1 stress+2'])
  ], { cond: [M], cd: 100, max: 3, note: 'media' }),
  ch('co_c_match_fix', C, 2, ['정체를 알 수 없는 인물이 감독에게 접근해 경기 결과를 조정해 달라고 제안했다. 금액이 엄청나다.', '수상한 연락이 감독에게 직접 전달됐다. 승부조작 제의로 보인다.'], [
    cc('즉시 구단과 리그에 신고한다', ['신고는 곧바로 수사로 이어졌다. 리그가 깊이 감사를 전했다.', 'coachFame+1.5 rel.owner+5 rel.fans+4 rel.media+4'], { pv: '명성↑ 안전' }),
    cc('무시한다', ['"관심 없다." 전화를 끊었다. 하지만 찜찜한 마음은 남았다.', 'stress+4'])
  ], { cond: [M], cd: 300, max: 1, heavy: true, help: '불법적인 제안을 받았다면 구단·리그·수사기관에 즉시 알리세요.', note: 'match_fix' }),
  ch('co_c_bonding', C, 2, ['시즌 중반 팀 빌딩 캠프를 열까 고민 중이다. 비용이 들고 훈련 시간이 줄어든다.', '선수들이 함께 쉬는 시간을 원한다. 캠프를 제안했다.'], [
    cc('캠프를 연다', ['2박 3일 동안 선수단이 함께 웃고 떠들었다. 분위기가 달라졌다.', 'management+0.2 morale+5 rel.captain+3 stress-4'], { chk: '55 management*0.3', bad: ['캠프가 일정에 방해가 되었다는 지적이 나왔다.', 'standing-2'] }),
    cc('훈련에 집중한다', ['시간이 없다. 훈련에 집중하기로 했다.', 'tactics+0.05'])
  ], { cond: [M], cd: 100, max: 3 }),
  ch('co_c_cup_priority', C, 3, ['컵 대회와 리그 경기가 겹쳤다. 두 마리 토끼를 모두 잡기는 어렵다.', '컵 대회 8강과 리그 중요한 경기가 같은 주에 놓였다.'], [
    cc('컵 대회에 집중한다', ['주전급을 컵 대회에 투입했다. 우승 가능성이 올랐다.', 'standing+1 stress+2'], { chk: '48 tactics*0.3 data*0.1', great: ['컵 대회에서 기적 같은 승리를 거뒀다.', 'standing+5 coachFame+0.4'], bad: ['컵 대회에서 탈락하고 말았다. 리그 경기에서도 손해를 봤다.', 'standing-4'] }),
    cc('리그를 우선한다', ['컵 대회는 2군급으로 치렀다. 리그에 집중했다.', 'standing+2 rel.fans-1'])
  ], { cond: [M], cd: 80, max: 4, note: 'cup_upset' }),
  ch('co_c_veteran_role', C, 2, ['노장 선수가 출전 시간이 줄어든 것에 불만을 표했다. 라커룸의 영향력이 큰 선수다.', '팀 최고참이 감독에게 면담을 요청했다.'], [
    cc('역할을 설명하고 멘토 역할을 맡긴다', ['베테랑은 처음엔 불편해했지만 곧 후배들을 이끄는 리더가 됐다.', 'management+0.15 leadership+0.1 rel.captain+3'], { chk: '50 management*0.3 leadership*0.2', bad: ['베테랑은 끝내 서운함을 감추지 못했다.', 'standing-2 rel.captain-3'] }),
    cc('출전 기회를 늘려 준다', ['요구를 받아들여 출전 시간을 늘렸다.', 'rel.captain+4 standing-1'])
  ], { cond: [M], cd: 80, max: 3 }),
  ch('co_c_gk_swap', C, 2, ['주전 골키퍼가 부진하다. 백업 골키퍼로 교체할지 결정해야 한다.', '실수가 이어지는 골키퍼를 두고 코치진 의견이 갈렸다.'], [
    cc('백업 골키퍼를 기용한다', ['과감히 교체를 단행했다. 새 골키퍼가 안정감을 보였다.', 'development+0.1 standing+2'], { chk: '48 tactics*0.3 development*0.2', bad: ['교체는 오히려 불안을 키웠다.', 'standing-4'] }),
    cc('믿음을 주고 기다린다', ['"한 번 더 기회를 주겠다."', 'management+0.1 rel.captain+1'], { chk: '50 management*0.2', bad: ['실수가 반복되면서 결국 불안이 커졌다.', 'standing-3'] })
  ], { cond: [M], cd: 80, max: 3 }),
  ch('co_c_asst_poach', C, 2, ['다른 구단이 우리 수석코치를 영입하려 한다. 코치진의 핵심이다.', '수석코치가 이직 제안을 받았다고 털어놓았다.'], [
    cc('붙잡기 위해 대우를 높인다', ['구단과 협의해 대우를 개선했다. 수석코치가 남기로 했다.', 'management+0.1 rel.director-1'], { chk: '45 rel.director*0.2 management*0.2', bad: ['구단이 반대해 수석코치가 떠났다.', 'tactics-0.1 standing-2'] }),
    cc('웃으며 보내 준다', ['"더 큰 기회를 잡아라." 코치는 감사하며 떠났다.', 'leadership+0.1 management+0.05 stress+2'])
  ], { cond: [M, 'coachFame>=20'], cd: 120, max: 2 }),
  ch('co_c_player_leave', C, 3, ['{star}이(가) 이적을 요청했다. 구단은 매각에 열려 있다. 팀 전력에 손실이 크다.', '핵심 선수 {star}이(가) 더 큰 무대를 원한다고 밝혔다.'], [
    cc('이적을 허용한다', ['"행운을 빈다." 선수는 고개를 숙였다. 구단이 두둑한 이적료를 챙겼다.', 'management+0.1 rel.director+3 standing-2'], { pv: '구단 관계↑ 전력↓' }),
    cc('설득해 잔류시킨다', ['긴 대화 끝에 선수가 남기로 했다. 대신 역할과 대우를 약속했다.', 'leadership+0.15 rel.captain+2'], { chk: '48 leadership*0.3 management*0.2', bad: ['선수의 마음은 이미 떠난 뒤였다. 불편한 분위기가 이어졌다.', 'standing-3 rel.captain-3'] })
  ], { cond: [M, 'window'], cd: 80, max: 4 }),
  ch('co_c_language', C, 2, ['외국인 선수들과 소통이 원활하지 않다. 전술 지시가 제대로 전달되지 않는다.', '언어 문제로 라커룸이 겉돌고 있다.'], [
    cc('언어 수업을 병행한다', ['코치진과 선수 모두 언어 수업을 받았다. 조금씩 소통이 늘었다.', 'langSkill+6 management+0.1 stress+2'], { pv: '언어↑' }),
    cc('통역에 의존한다', ['통역사를 늘렸다. 편하긴 하지만 한계가 있다.', 'management-0.05'])
  ], { cond: [M, 'abroad'], cd: 100, max: 3 }),
  ch('co_c_burnout', C, 3, ['몸과 마음이 지쳤다. 휴식 없이 이어진 시즌이 감독을 짓누른다.', '밤마다 잠을 설치고 식욕도 줄었다. 번아웃의 징조다.'], [
    cc('코치에게 맡기고 며칠 쉰다', ['짧은 휴식이었지만 마음이 가벼워졌다.', 'stress-14 burnout-14 happy+4 standing-1'], { pv: '스트레스↓' }),
    cc('상담을 받는다', ['전문가와 이야기하며 감정이 정리됐다.', 'stress-12 burnout-12 cashw-0'], { pv: '번아웃↓' }),
    cc('참고 일을 이어 간다', ['"조금만 더 버티자."', 'stress+4 burnout+6'], { chk: '48 health*0.2 hid.pro*0.2', bad: ['몸이 신호를 보냈다. 쓰러지기 직전이었다.', 'health-8 stress+8'] })
  ], { cond: [J, 'stress>=65'], cd: 60, max: 6, note: 'burnout' }),
  ch('co_c_rival_mind', C, 2, ['라이벌 팀 감독이 "우리가 우승 후보"라며 도발했다. 기자들이 반응을 요구한다.', '상대 감독의 도발 발언이 큰 화제가 되었다.'], [
    cc('웃어넘긴다', ['"그런 말에는 신경 쓰지 않습니다." 여유가 느껴졌다.', 'media+0.1 coachFame+0.1'], { chk: '48 media*0.3', bad: ['여유가 지나쳐 무시한다는 인상을 주었다.', 'rel.media-2'] }),
    cc('정면으로 응수한다', ['날카로운 대응이 기사 제목이 되었다.', 'coachFame+0.2 rel.fans+3 stress+2'], { chk: '42 media*0.3 leadership*0.2', bad: ['지나친 발언이 문제가 되었다.', 'standing-2 rel.media-4'] })
  ], { cond: [M], cd: 80, max: 3 }),
  ch('co_c_mentor', C, 2, ['은사 감독이 연락을 해 왔다. 조언을 들을 수 있는 자리가 마련됐다.', '존경하는 선배 지도자가 식사 자리를 제안했다.'], [
    cc('찾아가 조언을 구한다', ['선배의 경험담이 가슴에 새겨졌다. 노트 한 권이 가득 찼다.', 'tactics+0.2 leadership+0.15 coachFame+0.1'], { pv: '성장↑' }),
    cc('일정을 이유로 미룬다', ['시즌이 끝나고 보자고 했다. 아쉬움이 남았다.', 'stress+1'])
  ], { cond: [J], cd: 100, max: 2 }),
  ch('co_c_nat_hint', C, 3, ['협회 관계자가 대표팀 감독 후보로 {name}의 이름을 언급했다. 소문이 번지고 있다.', '언론이 "차기 국가대표 감독 후보"로 {name}을(를) 거론했다.'], [
    cc('관심을 숨기지 않는다', ['"기회가 온다면 영광일 것"이라고 말했다.', 'coachFame+0.4 rel.owner-3 fx:coachOffers=more'], { pv: '제안↑ 구단 관계↓' }),
    cc('현재 팀에 집중하겠다고 선을 긋는다', ['"저는 이 팀 감독입니다."', 'rel.owner+3 rel.fans+2'])
  ], { cond: ['license>=4', 'coachFame>=55'], cd: 150, max: 2 }),
  ch('co_c_losing_run', C, 4, ['5경기 연속 무승. 라커룸 분위기가 무겁다. 변화를 줘야 할 시점이다.', '연패가 길어지고 있다. 팬들의 인내심이 한계에 이르렀다.'], [
    cc('훈련 강도를 높인다', ['고강도 훈련으로 선수들을 다그쳤다. 몸이 무거워졌다.', 'leadership+0.1 morale-2 standing-1'], { chk: '45 leadership*0.3 management*0.2', great: ['선수들이 정신을 차렸다. 분위기가 완전히 바뀌었다.', 'standing+6'], bad: ['훈련 강도가 부상자를 늘렸다.', 'standing-4 stress+4'] }),
    cc('휴식과 대화로 분위기를 바꾼다', ['선수들과 식사하며 이야기를 나눴다. 긴장이 풀렸다.', 'management+0.15 morale+4'], { chk: '48 management*0.3', bad: ['여유가 지나치다는 비판이 나왔다.', 'standing-3'] }),
    cc('전술을 완전히 바꾼다', ['대대적인 수정에 들어갔다. 선수들이 혼란스러워했다.', 'tactics+0.15'], { chk: '45 tactics*0.4 data*0.1', great: ['새 전술이 제대로 먹혔다. 연승이 시작됐다.', 'standing+7 tactics+0.3'], bad: ['혼란만 커졌다.', 'standing-5'] })
  ], { cond: [M, 'standing<=40'], cd: 60, max: 5, note: 'coach_fired' }),
  ch('co_c_injury_crisis', C, 3, ['부상자가 속출했다. 선발 라인업을 구성할 인원조차 빠듯하다.', '핵심 선수들이 한꺼번에 이탈했다. 유스 선수들을 불러올려야 한다.'], [
    cc('유스 선수들을 대거 기용한다', ['어린 선수들이 기회를 얻어 필사적으로 뛰었다.', 'development+0.2 standing-1'], { chk: '48 development*0.4', great: ['유스 선수들이 기대 이상의 활약을 펼쳤다. 새로운 스타 탄생!', 'standing+4 development+0.4 coachFame+0.3'], bad: ['경험 부족이 드러났다.', 'standing-4'] }),
    cc('베테랑 선수를 긴급 영입한다', ['급히 베테랑을 영입했다. 경험이 팀을 안정시켰다.', 'standing+2 rel.director-1'])
  ], { cond: [M], cd: 80, max: 3, note: 'inj_freq' }),
  ch('co_c_wage_arrears', C, 2, ['구단 재정난으로 선수단 월급이 밀렸다. 선수들이 집단 항의를 하겠다고 한다.', '임금 체불로 선수단 분위기가 흉흉하다.'], [
    cc('선수단 편에서 구단과 협상한다', ['선수들을 대표해 구단 수뇌부와 담판을 지었다. 일부 체불이 해결됐다.', 'leadership+0.2 rel.captain+4 rel.owner-4 standing+1'], { chk: '45 leadership*0.3 rel.director*0.15', bad: ['협상이 결렬됐다.', 'standing-3 rel.owner-6'] }),
    cc('구단 입장을 설득한다', ['"조금만 더 기다려 달라." 선수들은 불만을 드러냈다.', 'rel.owner+3 rel.captain-4 standing-2'])
  ], { cond: [M], cd: 200, max: 1, note: 'club_wages' }),
  ch('co_c_new_stadium', C, 2, ['구단이 새 경기장을 짓는다고 발표했다. 건설 기간 동안 홈구장이 임시로 바뀐다.', '경기장 보수 공사로 홈경기를 중립지에서 치른다.'], [
    cc('선수단에게 긍정적으로 설명한다', ['"더 좋은 환경을 위한 과정이다." 선수들이 고개를 끄덕였다.', 'leadership+0.1 morale+2'], { chk: '50 leadership*0.3 media*0.1', bad: ['선수들은 불편함을 감추지 못했다.', 'standing-2'] }),
    cc('팀 일정에는 영향이 없다고 못 박는다', ['"어디서든 우리 축구를 한다."', 'tactics+0.05'])
  ], { cond: [M], cd: 200, max: 1 }),
  ch('co_c_sleep_staff', C, 2, ['피지컬 코치가 선수들의 수면과 회복 프로그램을 도입하자고 제안했다. 훈련 시간은 줄어든다.', '스포츠 과학팀이 야간 숙소 관리 시스템을 제안했다.'], [
    cc('도입한다', ['회복 중심 프로그램이 시행됐다. 부상이 눈에 띄게 줄었다.', 'management+0.15 data+0.1 standing+1'], { pv: '부상↓' }),
    cc('기존 방식을 유지한다', ['익숙한 방식을 지키기로 했다.', 'stress-1'])
  ], { cond: [M], cd: 150, max: 1, note: 'sleep' }),
  ch('co_c_academy_closure', C, 2, ['구단이 재정 문제로 아카데미 일부 부문을 축소하자고 제안했다. 육성 철학과 충돌한다.', '아카데미 예산 삭감 이야기가 나왔다.'], [
    cc('반대하며 설득한다', ['아카데미의 가치를 설명했다. 구단이 부분적으로 물러섰다.', 'development+0.1 rel.director-3'], { chk: '45 development*0.3 coachFame*0.15', bad: ['구단은 예산 삭감을 강행했다.', 'rel.director-5 stress+4'] }),
    cc('수용하고 대안을 마련한다', ['"받아들이되 핵심 연령층은 지키자."', 'management+0.1 rel.director+3'])
  ], { cond: [M], cd: 200, max: 1 }),
  ch('co_c_ref_complaint', C, 2, ['경기 후 오심에 분노가 치밀었다. 심판 판정에 대한 공식 항의를 할지 고민이다.', '결정적인 오심으로 승점을 잃었다. 감독의 한마디가 큰 파장을 일으킬 수 있다.'], [
    cc('공식 항의서를 제출한다', ['구단 이름으로 항의서를 제출했다. 협회가 조사를 약속했다.', 'rel.fans+3 rel.owner+1'], { chk: '48 media*0.2 coachFame*0.2', bad: ['협회로부터 경고와 벌금을 받았다.', 'standing-2 rel.owner-2'] }),
    cc('감정을 누르고 넘어간다', ['"심판도 사람입니다." 의연한 모습이 칭찬받았다.', 'media+0.05 stress+3'])
  ], { cond: [M], cd: 80, max: 3 }),
  ch('co_c_pre_season', C, 3, ['프리시즌 계획을 짜야 한다. 강도 높은 훈련 캠프를 열지, 친선경기 위주로 갈지 선택해야 한다.', '새 시즌 준비를 위한 일정이 책상 위에 놓여 있다.'], [
    cc('강도 높은 훈련 캠프', ['체력 위주의 고강도 캠프를 열었다. 선수들이 지쳤지만 몸 상태는 올라왔다.', 'management+0.1 standing+1'], { chk: '50 management*0.2 data*0.15', bad: ['과한 훈련으로 부상자가 생겼다.', 'standing-2'] }),
    cc('친선경기 위주로 전술 완성', ['여러 경기를 통해 전술 조합을 점검했다.', 'tactics+0.15'])
  ], { cond: [M, 'sw<=6'], cd: 40, max: 20 }),
  ch('co_c_press_leak', C, 2, ['구단 내부 사정이 기사로 새어 나갔다. 코칭스태프 중 누군가 기자에게 말한 것이 분명하다.', '훈련 전술이 경기 전에 보도됐다. 정보 유출을 의심할 수밖에 없다.'], [
    cc('전원에게 입단속을 시키고 조사한다', ['코칭스태프와 선수단을 모아 단호히 경고했다. 분위기가 한동안 얼어붙었다.', 'leadership+0.1 management-0.05 standing+1 stress+3'], { chk: '48 leadership*0.3 management*0.2', bad: ['범인은 찾지 못했고 서로를 의심하는 분위기만 남았다.', 'standing-3 stress+4'] }),
    cc('모른 척하고 전술을 바꾼다', ['유출된 정보를 역이용해 전술을 바꿨다. 상대가 헛다리를 짚었다.', 'tactics+0.15 standing+2'], { chk: '45 tactics*0.4 data*0.1', bad: ['급한 변경이 혼란을 불렀다.', 'standing-3'] })
  ], { cond: [M], cd: 100, max: 2, note: 'media' })
];
