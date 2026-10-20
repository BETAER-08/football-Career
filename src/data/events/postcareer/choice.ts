import type { RawEvent } from '../../schema';
import { cc, ch } from '../helpers';

const PC: ('postcareer')[] = ['postcareer'];

export const postChoice: RawEvent[] = [
  ch('po_c_legend_match', PC, 3, ['유럽 레전드 매치 초청장이 도착했다. 큰 규모의 자선 경기다. 몸은 예전 같지 않지만 마음은 이미 그라운드에 있다.', '레전드 매치에 출전해 달라는 요청이 왔다.'], [
    cc('참가한다', ['모처럼 유니폼을 다시 입었다. 관중의 환호가 몸을 따뜻하게 했다.', 'happy+8 postRep+0.8 fameD+0.4 fatigue+5'], { chk: '55 health*0.2', bad: ['경기 중 근육이 놀랐다. 한동안 걷기가 힘들었다.', 'health-6 fx:inj=calf'] }),
    cc('정중히 사양한다', ['"몸을 챙겨야 할 나이입니다."', 'happy+1 postRep-0.5 rel.fans-3'])
  ], { cond: ['fameD>=15'], cd: 52, max: 4, xg: 'legend_events', tier: 'minor' }),
  ch('po_c_coach_offer', PC, 3, ['옛 소속 구단이 코칭스태프 합류를 제안했다. 직접 후배들을 이끌 수 있는 기회다.', '지도자 길을 권하는 제안이 들어왔다. 자격증 과정부터 다시 시작해야 한다.'], [
    cc('지도자의 길로 들어선다', ['새로운 시작이었다. 책과 훈련장을 오가는 날들이 이어졌다.', 'fx:goCoach hid.ambition+2 fu:fu_post@10-30'], { chk: '50 postSkill*0.15 postRep*0.15', pv: '지도자 과정', bad: ['현장은 선수 시절과 달랐다. 첫 달부터 시행착오가 이어졌다.', 'fx:goCoach hid.ambition+2 stress+5 fu:fu_post@10-30'] }),
    cc('지금 하는 일을 이어 간다', ['"조금 더 생각해 보겠습니다."', 'stress-1 postRep-1 hid.ambition-1 fu:fu_post@10-30'])
  ], { cond: ['!path:business', 'lvlmax>=2'], cd: 104, max: 3, xg: 'post_career_switch', tier: 'major' }),
  ch('po_c_biz_partner', PC, 3, ['동업을 제안하는 사람이 나타났다. 사업 아이디어는 좋지만 믿을 만한 사람인지 판단이 서지 않는다.', '지인이 동업을 제안했다. 투자금은 크고 위험도 만만치 않다.'], [
    cc('동업을 수락한다', ['함께 사업을 시작했다. 결과는?', 'cashy-0.25'], { chk: '38 postSkill*0.3 hid.thrift*-0.1', great: ['사업이 순조롭게 성장했다.', 'business+2500 happy+6'], bad: ['동업자가 자금을 가지고 사라졌다.', 'fx:fraudLoss=0.3 stress+10'] }),
    cc('정중히 거절한다', ['"저는 혼자 하겠습니다."', 'hid.thrift+1 postRep-0.2 stress+1'])
  ], { cond: ['cash>=3000', '!path:left'], cd: 100, max: 3, xg: 'post_business', tier: 'minor' }),
  ch('po_c_family_move', PC, 2, ['가족이 해외로 이주하자고 제안했다. 새로운 환경에서 새 출발을 하자는 의견이다.', '아이의 교육을 위해 외국 이주 이야기가 나왔다.'], [
    cc('이주를 결정한다', ['낯선 도시로 삶의 터전을 옮겼다. 새로운 시작이었다.', 'happy+4 stress+4 fx:langUp=6 rel.partner+3'], { chk: '50 hid.adapt*0.2 hid.family*0.1', pv: '새 환경', bad: ['낯선 환경에 적응하지 못해 가족 모두가 힘들어했다.', 'happy-3 stress+8 fx:langUp=3'] }),
    cc('지금 사는 곳에 남는다', ['익숙한 환경을 지키기로 했다.', 'happy+2 postRep-0.3 stress+1'])
  ], { cond: ['children>=1'], cd: 200, max: 1, xg: 'post_life', tier: 'minor' }),
  ch('po_c_health', PC, 3, ['건강검진 결과가 마음에 걸린다. 관절과 심혈관 수치가 예전 같지 않다.', '선수 시절의 후유증이 한꺼번에 몰려오는 느낌이다.'], [
    cc('정밀 검사를 받고 생활을 바꾼다', ['운동과 식단을 새로 짰다. 몸이 서서히 나아졌다.', 'health+8 stress-3 cashw-1 happy+2'], { chk: '55 health*0.2 hid.pro*0.1', pv: '건강↑', bad: ['검진 결과가 예상보다 나빠 놀랐다. 치료 일정이 빠듯하다.', 'stress+6 health+2 cashw-1'] }),
    cc('이대로 지낸다', ['"아직은 괜찮아." 마음 한구석이 불안하다.', 'stress+3 health-3'])
  ], { cond: ['health<=75'], cd: 100, max: 4, xg: 'post_life', tier: 'minor' }),
  ch('po_c_young_mentor', PC, 3, ['유망주 한 명이 멘토링을 요청해 왔다. 시간을 내야 하지만 뜻깊은 일이다.', '후배 선수가 은퇴 후의 인생 조언을 구했다.'], [
    cc('멘토가 되어 준다', ['정기적으로 만나며 경험을 나눴다. 그 아이가 성장하는 모습이 뿌듯했다.', 'happy+5 postRep+0.5 postSkill+0.2'], { chk: '55 hid.social*0.2', pv: '평판↑', bad: ['조언이 기대에 못 미쳤다. 유망주가 곧 흥미를 잃었다.', 'happy-1 postRep-0.2'] }),
    cc('시간이 없다며 사양한다', ['아쉬워하는 목소리가 들렸다.', 'stress+1'])
  ], { cond: ['fameD>=10'], cd: 80, max: 5, xg: 'legend_events', tier: 'minor' }),
  ch('po_c_book_memoir', PC, 3, ['출판사가 자서전 출간을 제안했다. 이제야 이야기를 털어놓을 수 있을 것 같다.', '출간 제안서가 도착했다.'], [
    cc('집필에 나선다', ['쓰는 동안 오래 묻어 둔 이야기들이 올라왔다. 책은 큰 반향을 일으켰다.', 'postRep+1 cashw+6 happy+4 stress+3'], { chk: '50 postRep*0.2 hid.controversy*-0.1', pv: '평판↑ 수입↑', bad: ['솔직한 서술이 논란이 됐다. 인터뷰 요청이 쏟아졌다.', 'postRep-1 stress+6 rel.media-4'] }),
    cc('사양한다', ['"아직은 말하지 않아도 될 이야기도 있다."', 'stress-1 postRep-0.5'])
  ], { cond: ['fameD>=30'], cd: 300, max: 1, xg: 'post_media', tier: 'minor' }),
  ch('po_c_foundation', PC, 2, ['유소년 재단 설립을 도와 달라는 요청이 왔다. 어릴 적 받았던 도움을 돌려줄 때다.', '지역 유소년 클럽이 재단 설립을 제안했다.'], [
    cc('이사로 참여한다', ['재단 이사회에 합류했다. 장학생들의 편지가 가슴을 울렸다.', 'happy+6 postRep+1 cashw-2'], { chk: '55 postSkill*0.15 hid.pro*0.1', pv: '평판↑ 행복↑', bad: ['재단 운영을 둘러싼 갈등이 생겼다.', 'happy-2 stress+5'] }),
    cc('후원만 한다', ['금전적 지원만 약속했다.', 'happy+2 cashw-1'])
  ], { cond: ['fameD>=15', 'cash>=3000'], cd: 200, max: 1, xg: 'legend_events', tier: 'minor' }),
  ch('po_c_scout_dilemma', PC, 2, ['스카우트로서 추천한 선수와 인맥으로 얽힌 선수 중 하나를 골라야 한다. 구단 내부 압박이 있다.', '구단이 "누구를 영입할지" 의견을 구했다. 객관적 평가와 인맥이 충돌한다.'], [
    cc('데이터와 평가에 따라 추천한다', ['소신을 지켰다. 구단은 이 선택을 존중했다.', 'postSkill+0.5 postRep+0.5'], { chk: '48 postSkill*0.3', bad: ['추천한 선수가 기대에 못 미쳤다.', 'postRep-0.5'] }),
    cc('인맥을 고려해 타협한다', ['내부 사정을 감안해 조율했다.', 'postRep+0.1 postSkill-0.1'])
  ], { cond: ['path:admin'], cd: 100, max: 4, xg: 'post_admin', tier: 'minor' }),
  ch('po_c_leave_ponder', PC, 2, ['요즘 들어 축구와 거리를 두고 싶다는 생각이 든다. 오랜 시간 몸담았던 세계가 이제는 조금 지친다.', '문득 "이제 정말 다른 삶을 살아 볼까" 하는 생각이 스쳤다.'], [
    cc('축구계를 떠날 결심을 굳힌다', ['오랜 고민 끝에 새 삶을 선택했다.', 'happy+6 stress-8 fx:retire=축구계를_떠나기로_결심했다.'], { pv: '축구 인생 종료' }),
    cc('조금 더 머물러 본다', ['"조금 더 해 보자."', 'stress+1'], { chk: '50 stress*-0.3 happy*0.2', bad: ['머물수록 피로가 쌓였다.', 'stress+6 happy-3'] })
  ], { cond: ['age>=50', 'stress>=60'], cd: 100, max: 2, xg: 'post_career_switch', tier: 'minor' }),
  ch('po_c_old_coach', PC, 2, ['은사 감독이 후임 코치 자리를 제안했다. 은사의 뒤를 잇는 일은 영광이자 부담이다.', '존경하던 지도자가 자신의 팀에 합류해 달라고 요청했다.'], [
    cc('합류한다', ['은사 밑에서 배우며 지도자 생활을 시작했다.', 'fx:goCoach hid.loyalty+1 fu:fu_post@10-30'], { chk: '50 postSkill*0.15 hid.loyalty*0.1', pv: '지도자 과정', bad: ['은사의 팀은 기대와 달리 혼란스러웠다.', 'fx:goCoach hid.loyalty+1 stress+6 fu:fu_post@10-30'] }),
    cc('감사 인사를 전하고 사양한다', ['"제 길을 가겠습니다." 은사는 환하게 웃었다.', 'happy+1 hid.loyalty-2 fu:fu_post@10-30'])
  ], { cond: ['!path:coach', 'lvlmax>=3'], cd: 200, max: 1, xg: 'post_career_switch', tier: 'major' }),
  ch('po_c_doc_consent', PC, 2, ['방송사가 인생을 다룬 다큐 촬영을 요청했다. 사적인 부분까지 공개해야 한다.', '제작진이 가족 인터뷰까지 요청해 왔다.'], [
    cc('전부 공개한다', ['솔직한 이야기가 큰 공감을 얻었다.', 'postRep+1 followers+60 happy+3'], { chk: '50 hid.controversy*-0.15 postRep*0.1', bad: ['예상치 못한 부분이 논란이 됐다.', 'rel.media-3 stress+5'] }),
    cc('일부만 허락한다', ['민감한 부분은 빼기로 했다.', 'postRep+0.3 stress+2 rel.media-2'])
  ], { cond: ['fameD>=35'], cd: 300, max: 1, xg: 'post_media', tier: 'minor' })
];
