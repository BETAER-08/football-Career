import type { RawEvent } from '../../schema';
import { cc, ch } from '../helpers';

const PC: ('postcareer')[] = ['postcareer'];

export const postChoice: RawEvent[] = [
  ch('po_c_legend_match', PC, 3, ['유럽 레전드 매치 초청장이 도착했다. 큰 규모의 자선 경기다. 몸은 예전 같지 않지만 마음은 이미 그라운드에 있다.', '레전드 매치에 출전해 달라는 요청이 왔다.'], [
    cc('참가한다', ['모처럼 유니폼을 다시 입었다. 관중의 환호가 몸을 따뜻하게 했다.', 'happy+8 postRep+0.8 fameD+0.4 fatigue+5'], { chk: '55 health*0.2', bad: ['경기 중 근육이 놀랐다. 한동안 걷기가 힘들었다.', 'health-6 fx:inj=calf'] }),
    cc('정중히 사양한다', ['"몸을 챙겨야 할 나이입니다."', 'happy+1'])
  ], { cond: ['fameD>=15'], cd: 52, max: 10 }),
  ch('po_c_takeover', PC, 2, ['지인이 소규모 구단 인수 이야기를 꺼냈다. 구단을 직접 운영해 보는 일은 늘 꿈이었지만 위험도 만만치 않다.', '재정난에 빠진 지역 구단이 새 구단주를 찾고 있다.'], [
    cc('투자해서 지분을 확보한다', ['큰돈을 걸었다. 새 일이 시작됐다.', 'cashy-0.6 business+4000 postSkill+0.5 stress+4'], { chk: '38 postSkill*0.3 postRep*0.2 agent*0.1', great: ['구단 운영이 뜻밖에 잘 풀렸다. 지역 사회의 박수를 받았다.', 'business+4000 postRep+1 happy+8'], bad: ['구단 재정은 생각보다 심각했다. 손실이 커졌다.', 'business-3000 stress+8'] }),
    cc('거절한다', ['"사업은 신중해야 합니다."', 'hid.thrift+1'])
  ], { cond: ['net>=20000'], cd: 200, max: 1, note: 'club_wages' }),
  ch('po_c_coach_offer', PC, 3, ['옛 소속 구단이 코칭스태프 합류를 제안했다. 직접 후배들을 이끌 수 있는 기회다.', '지도자 길을 권하는 제안이 들어왔다. 자격증 과정부터 다시 시작해야 한다.'], [
    cc('지도자의 길로 들어선다', ['새로운 시작이었다. 책과 훈련장을 오가는 날들이 이어졌다.', 'fx:goCoach hid.ambition+2'], { pv: '지도자 과정' }),
    cc('지금 하는 일을 이어 간다', ['"조금 더 생각해 보겠습니다."', 'stress-1'])
  ], { cond: ['!path:business', 'lvlmax>=2'], cd: 104, max: 3 }),
  ch('po_c_tv_contract', PC, 3, ['방송국이 재계약을 제안했다. 출연료는 오르지만 출연 횟수가 늘어난다.', '방송사에서 더 큰 자리를 제안했다. 시간이 많이 든다.'], [
    cc('조건을 받아들인다', ['수입이 늘었지만 일정이 빡빡해졌다.', 'postRep+0.5 cashw+3 fatigue+3'], { pv: '수입↑ 피로↑' }),
    cc('협상을 시도한다', ['조건을 조율하며 시간을 벌었다.', 'postSkill+0.1'], { chk: '45 postRep*0.3 postSkill*0.2', great: ['방송사가 조건을 크게 올렸다.', 'postRep+1 cashw+6'], bad: ['협상은 결렬됐다.', 'postRep-0.5'] })
  ], { cond: ['path:pundit', 'postRep>=15'], cd: 104, max: 4 }),
  ch('po_c_biz_partner', PC, 3, ['동업을 제안하는 사람이 나타났다. 사업 아이디어는 좋지만 믿을 만한 사람인지 판단이 서지 않는다.', '지인이 동업을 제안했다. 투자금은 크고 위험도 만만치 않다.'], [
    cc('동업을 수락한다', ['함께 사업을 시작했다. 결과는?', 'cashy-0.25'], { chk: '38 postSkill*0.3 hid.thrift*-0.1', great: ['사업이 순조롭게 성장했다.', 'business+2500 happy+6'], bad: ['동업자가 자금을 가지고 사라졌다.', 'fx:fraudLoss=0.3 stress+10'] }),
    cc('정중히 거절한다', ['"저는 혼자 하겠습니다."', 'hid.thrift+1'])
  ], { cond: ['cash>=3000', '!path:left'], cd: 100, max: 3 }),
  ch('po_c_family_move', PC, 2, ['가족이 해외로 이주하자고 제안했다. 새로운 환경에서 새 출발을 하자는 의견이다.', '아이의 교육을 위해 외국 이주 이야기가 나왔다.'], [
    cc('이주를 결정한다', ['낯선 도시로 삶의 터전을 옮겼다. 새로운 시작이었다.', 'happy+4 stress+4 fx:langUp=6 rel.partner+3'], { pv: '새 환경' }),
    cc('지금 사는 곳에 남는다', ['익숙한 환경을 지키기로 했다.', 'happy+2'])
  ], { cond: ['children>=1'], cd: 200, max: 1 }),
  ch('po_c_health', PC, 3, ['건강검진 결과가 마음에 걸린다. 관절과 심혈관 수치가 예전 같지 않다.', '선수 시절의 후유증이 한꺼번에 몰려오는 느낌이다.'], [
    cc('정밀 검사를 받고 생활을 바꾼다', ['운동과 식단을 새로 짰다. 몸이 서서히 나아졌다.', 'health+8 stress-3 cashw-1 happy+2'], { pv: '건강↑' }),
    cc('이대로 지낸다', ['"아직은 괜찮아." 마음 한구석이 불안하다.', 'stress+3 health-3'])
  ], { cond: ['health<=75'], cd: 100, max: 4 }),
  ch('po_c_young_mentor', PC, 3, ['유망주 한 명이 멘토링을 요청해 왔다. 시간을 내야 하지만 뜻깊은 일이다.', '후배 선수가 은퇴 후의 인생 조언을 구했다.'], [
    cc('멘토가 되어 준다', ['정기적으로 만나며 경험을 나눴다. 그 아이가 성장하는 모습이 뿌듯했다.', 'happy+5 postRep+0.5 postSkill+0.2'], { pv: '평판↑' }),
    cc('시간이 없다며 사양한다', ['아쉬워하는 목소리가 들렸다.', 'stress+1'])
  ], { cond: ['fameD>=10'], cd: 80, max: 5 }),
  ch('po_c_fa_board', PC, 2, ['축구협회 임원 선거 출마를 권유받았다. 리그 발전을 위해 일할 기회지만 정치적인 부담이 크다.', '협회 관계자가 임원직을 제안했다.'], [
    cc('도전한다', ['선거 운동은 쉽지 않았다. 하지만 새로운 세계를 배웠다.', 'fx:adminBoost=4 stress+6 postRep+1'], { chk: '36 postRep*0.4 postSkill*0.2 fameD*0.2', great: ['협회 임원으로 선출됐다.', 'fx:adminBoost=10 happy+6'], bad: ['낙선했다. 정치의 벽은 높았다.', 'happy-4 stress+4'] }),
    cc('정치와는 거리를 둔다', ['"저는 현장이 편합니다."', 'stress-1'])
  ], { cond: ['postRep>=30', 'age>=40'], cd: 200, max: 1 }),
  ch('po_c_overseas_gm', PC, 2, ['해외 구단이 단장 직을 제안했다. 새로운 도전이지만 언어와 문화가 낯설다.', '해외 클럽이 테크니컬 디렉터로 초청했다.'], [
    cc('수락한다', ['낯선 환경에서 새로운 일을 시작했다.', 'fx:adminBoost=5 stress+6 fx:langUp=8'], { chk: '40 postSkill*0.3 postRep*0.2', bad: ['환경 적응에 실패했다.', 'stress+8 happy-4'] }),
    cc('거절한다', ['"가족과 가까이 있고 싶습니다."', 'rel.partner+1'])
  ], { cond: ['path:admin', 'postRep>=35'], cd: 150, max: 2 }),
  ch('po_c_book_memoir', PC, 3, ['출판사가 자서전 출간을 제안했다. 이제야 이야기를 털어놓을 수 있을 것 같다.', '출간 제안서가 도착했다.'], [
    cc('집필에 나선다', ['쓰는 동안 오래 묻어 둔 이야기들이 올라왔다. 책은 큰 반향을 일으켰다.', 'postRep+1 cashw+6 happy+4 stress+3'], { pv: '평판↑ 수입↑' }),
    cc('사양한다', ['"아직은 말하지 않아도 될 이야기도 있다."', 'stress-1'])
  ], { cond: ['fameD>=30'], cd: 300, max: 1 }),
  ch('po_c_foundation', PC, 2, ['유소년 재단 설립을 도와 달라는 요청이 왔다. 어릴 적 받았던 도움을 돌려줄 때다.', '지역 유소년 클럽이 재단 설립을 제안했다.'], [
    cc('이사로 참여한다', ['재단 이사회에 합류했다. 장학생들의 편지가 가슴을 울렸다.', 'happy+6 postRep+1 cashw-2'], { pv: '평판↑ 행복↑' }),
    cc('후원만 한다', ['금전적 지원만 약속했다.', 'happy+2 cashw-1'])
  ], { cond: ['fameD>=15', 'cash>=3000'], cd: 200, max: 1 }),
  ch('po_c_scout_dilemma', PC, 2, ['스카우트로서 추천한 선수와 인맥으로 얽힌 선수 중 하나를 골라야 한다. 구단 내부 압박이 있다.', '구단이 "누구를 영입할지" 의견을 구했다. 객관적 평가와 인맥이 충돌한다.'], [
    cc('데이터와 평가에 따라 추천한다', ['소신을 지켰다. 구단은 이 선택을 존중했다.', 'postSkill+0.5 postRep+0.5'], { chk: '48 postSkill*0.3', bad: ['추천한 선수가 기대에 못 미쳤다.', 'postRep-0.5'] }),
    cc('인맥을 고려해 타협한다', ['내부 사정을 감안해 조율했다.', 'postRep+0.1 postSkill-0.1'])
  ], { cond: ['path:admin'], cd: 100, max: 4 }),
  ch('po_c_leave_ponder', PC, 2, ['요즘 들어 축구와 거리를 두고 싶다는 생각이 든다. 오랜 시간 몸담았던 세계가 이제는 조금 지친다.', '문득 "이제 정말 다른 삶을 살아 볼까" 하는 생각이 스쳤다.'], [
    cc('축구계를 떠날 결심을 굳힌다', ['오랜 고민 끝에 새 삶을 선택했다.', 'happy+6 stress-8 fx:retire=축구계를_떠나기로_결심했다.'], { pv: '축구 인생 종료' }),
    cc('조금 더 머물러 본다', ['"조금 더 해 보자."', 'stress+1'])
  ], { cond: ['age>=50', 'stress>=60'], cd: 100, max: 2 }),
  ch('po_c_old_coach', PC, 2, ['은사 감독이 후임 코치 자리를 제안했다. 은사의 뒤를 잇는 일은 영광이자 부담이다.', '존경하던 지도자가 자신의 팀에 합류해 달라고 요청했다.'], [
    cc('합류한다', ['은사 밑에서 배우며 지도자 생활을 시작했다.', 'fx:goCoach hid.loyalty+1'], { pv: '지도자 과정' }),
    cc('감사 인사를 전하고 사양한다', ['"제 길을 가겠습니다." 은사는 환하게 웃었다.', 'happy+1'])
  ], { cond: ['!path:coach', 'lvlmax>=3'], cd: 200, max: 1 }),
  ch('po_c_doc_consent', PC, 2, ['방송사가 인생을 다룬 다큐 촬영을 요청했다. 사적인 부분까지 공개해야 한다.', '제작진이 가족 인터뷰까지 요청해 왔다.'], [
    cc('전부 공개한다', ['솔직한 이야기가 큰 공감을 얻었다.', 'postRep+1 followers+60 happy+3'], { chk: '50 hid.controversy*-0.15 postRep*0.1', bad: ['예상치 못한 부분이 논란이 됐다.', 'rel.media-3 stress+5'] }),
    cc('일부만 허락한다', ['민감한 부분은 빼기로 했다.', 'postRep+0.3'])
  ], { cond: ['fameD>=35'], cd: 300, max: 1 })
];
