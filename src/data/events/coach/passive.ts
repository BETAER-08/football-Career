import type { RawEvent } from '../../schema';
import { pa } from '../helpers';

const C: ('coach')[] = ['coach'];
const J = 'coachRole:manager|assistant|youthCoach';
const M = 'coachRole:manager';

export const coachPassive: RawEvent[] = [
  pa('co_p_drill', C, 4, ['오늘 훈련은 계획대로 착착 진행됐다. 선수들의 움직임에서 전술이 몸에 배는 것이 보였다.', '새벽 훈련장. 콘을 하나씩 놓으며 하루를 시작했다. 선수들의 호흡이 맞아 갔다.', '훈련장에 이른 아침부터 콘이 줄지어 서 있었다. 선수들의 압박 타이밍이 눈에 띄게 맞아 갔다.', '세트피스 반복 훈련이 마침내 먹혔다. 동선이 하나의 그림처럼 맞아떨어졌다.'], 'tactics+0.05 morale+1', { cond: [J], cd: 26, max: 10 }),
  pa('co_p_video', C, 3, ['밤늦게까지 상대 팀 경기 영상을 돌려 보았다. 약점이 서서히 윤곽을 드러냈다.', '분석관이 새로 만든 데이터 리포트를 가져왔다. 숫자가 이야기를 들려주기 시작했다.', '분석관과 새벽까지 영상을 돌려 보며 상대의 전환 패턴을 정리했다.', '태블릿 속 히트맵이 상대 약점을 선명하게 보여 주었다. 훈련 계획표를 다시 짰다.'], 'data+0.08 tactics+0.04 fatigue+2', { cond: [J], cd: 26, max: 10 }),
  pa('co_p_star_praise', C, 3, ['{star:이} 훈련 후 기자들에게 "감독님 덕분에 많이 성장했다"고 말했다.', '핵심 선수 {star:이} 감독에 대한 신뢰를 공개적으로 밝혔다.'], 'standing+1 rel.media+1', { cond: [M], cd: 20, max: 40 }),
  pa('co_p_talent', C, 3, ['유스 훈련을 지켜보다 눈에 띄는 재능을 발견했다. 터치와 시야가 또래보다 한 발 앞선다.', '유스 코치가 "꼭 지켜봐야 할 아이"라며 선수 한 명을 추천했다.'], 'development+0.1 coachFame+0.05', { cond: [J], cd: 20, max: 40 }),
  pa('co_p_press_praise', C, 3, ['지역 신문이 팀의 변화를 호평하며 감독의 리더십을 높이 평가했다.', '언론이 "{name} 감독의 마법"이라는 제목의 기사를 실었다.'], 'standing+2 coachFame+0.2 rel.media+3', { cond: [M, 'standing>=60'], cd: 16, max: 40 }),
  pa('co_p_press_critic', C, 3, ['언론이 팀의 부진을 감독의 전술 탓으로 돌렸다. 비판 기사를 읽는 손이 무겁다.', '지역 방송 해설가가 "감독의 전술은 한계에 이르렀다"고 혹평했다.'], 'standing-2 coachFame-0.2 stress+3', { cond: [M, 'standing<=40'], cd: 16, max: 40, note: 'coach_fired' }),
  pa('co_p_staff', C, 3, ['코칭스태프 회의가 길게 이어졌다. 각자의 의견이 부딪혔지만 마지막엔 하나의 계획으로 정리됐다.', '수석코치와 분석관, 피지컬 코치가 모여 시즌 계획을 다듬었다.', '코치진 점심 회의에서 훈련 부하를 놓고 의견이 갈렸다. 서로 양보하며 일정을 조율했다.', '골키퍼 코치와 피지컬 코치가 시즌 후반 계획을 함께 설계했다.'], 'management+0.06 leadership+0.04', { cond: [J], cd: 30, max: 8 }),
  pa('co_p_board_dinner', C, 2, ['단장과의 저녁 식사 자리. 구단의 중장기 계획에 대해 솔직한 이야기가 오갔다.', '구단주가 직접 자리를 마련해 감독의 구상을 경청했다.'], 'rel.director+2 rel.owner+1', { cond: [M], cd: 40, max: 20 }),
  pa('co_p_chant', C, 3, ['경기장에 감독의 이름을 연호하는 노래가 울려 퍼졌다. 코끝이 찡했다.', '서포터즈가 "{name}!"을 외치며 응원가를 불렀다.'], 'standing+1 happy+3 rel.fans+3', { cond: [M, 'standing>=55'], cd: 30, max: 20 }),
  pa('co_p_protest', C, 3, ['경기 후 서포터즈가 현수막을 펼쳤다. "{name} 나가라." 분노가 가득한 구호가 귀에 박혔다.', '팬들이 훈련장 앞에서 감독 교체를 요구하는 시위를 벌였다.'], 'standing-3 stress+5 rel.fans-4', { cond: [M, 'standing<=35'], cd: 30, max: 10, note: 'coach_fired' }),
  pa('co_p_injury_report', C, 3, ['의무팀이 핵심 선수의 부상 소식을 전했다. 복귀까지 몇 주가 걸린다. 전술 구상을 다시 짜야 한다.', '훈련 중 {star:이} 쓰러졌다. 전술 플랜을 수정해야 한다.'], 'stress+2 standing-0.5', { cond: [M], cd: 16, max: 40, note: 'inj_freq' }),
  pa('co_p_scout', C, 3, ['스카우트팀이 새로운 후보 리스트를 올렸다. 데이터와 영상이 정리된 보고서다.', '해외 출장에서 돌아온 스카우터가 흥미로운 선수를 소개했다.'], 'data+0.08 rel.director+1', { cond: [M], cd: 16, max: 40 }),
  pa('co_p_book', C, 3, ['오랜만에 전술 서적을 펼쳤다. 낡은 이론이 새로운 문제를 해결하는 열쇠가 되었다.', '선배 감독의 책을 읽으며 밑줄을 쳤다. 해답은 때로 오래된 책 속에 있다.'], 'tactics+0.12', { cond: [J], cd: 20, max: 40 }),
  pa('co_p_clinic', C, 2, ['지도자 세미나에 참석했다. 세계적인 감독의 강연이 시선을 사로잡았다. 노트가 빼곡해졌다.', '코칭 클리닉에서 다른 나라 지도자들과 의견을 나눴다.'], 'tactics+0.15 media+0.05 coachFame+0.1', { cond: [J], cd: 40, max: 20 }),
  pa('co_p_family', C, 3, ['오랜만에 가족과 저녁을 함께했다. 축구 이야기가 단 한마디도 나오지 않았다.', '일요일 아침, 가족과 산책을 나왔다. 숨 쉬는 법을 다시 배운 기분이다.', '오랜만에 가족과 영화관에 갔다. 팝콘을 나눠 먹으며 모든 걸 잊었다.', '주말 오후, 아이와 공원에서 공을 차 주었다. 평소와 다른 얼굴로 웃고 있다는 걸 느꼈다.'], 'happy+4 stress-5', { cd: 30, max: 8 }),
  pa('co_p_sleepless', C, 3, ['경기 전날 밤, 잠이 오지 않았다. 천장을 바라보며 스스로 전술을 몇 번이나 되짚었다.', '새벽까지 불을 켜 둔 채 영상을 돌려 보았다. 잠은 오지 않았다.'], 'stress+3 sleep-3', { cond: [J], cd: 16, max: 40, note: 'burnout' }),
  pa('co_p_cup_draw', C, 2, ['컵 대회 대진이 발표됐다. 강호와 맞붙게 됐다. 선수들의 눈빛이 달라졌다.', '대진 추첨 결과에 라커룸이 술렁였다.'], 'morale+1', { cond: [J], cd: 40, max: 20, note: 'cup_upset' }),
  pa('co_p_assistant', C, 3, ['수석코치가 새로운 세트피스 아이디어를 내놓았다. 훈련에서 시험해 보니 의외로 잘 맞았다.', '코치진의 제안을 받아들였더니 팀의 움직임이 한결 매끄러워졌다.'], 'tactics+0.08 management+0.05', { cond: [M], cd: 16, max: 40 }),
  pa('co_p_rival_coach', C, 2, ['라이벌 팀 감독이 {name}의 전술에 대해 한마디 했다. 기자들이 기다렸다는 듯 반응을 물었다.', '상대 감독이 기자회견에서 {name:을} 은근히 비꼬았다.'], 'coachFame+0.1 stress+2 rel.media+1', { cond: [M], cd: 40, max: 20 }),
  pa('co_p_streak', C, 3, ['연승 행진이 이어지고 있다. 팀 분위기는 최고조다. 기자회견장에서도 질문이 부드러워졌다.', '리그 선두권을 달리며 팬들의 기대가 커졌다. 부담감도 같이 자란다.'], 'standing+2 coachFame+0.3 morale+3', { cond: [M, 'standing>=65'], cd: 20, max: 20 }),
  pa('co_p_birthday', C, 2, ['선수단이 감독의 생일을 깜짝 축하했다. 라커룸에서 합창이 터졌다.', '선수단이 케이크를 들고 훈련장에 나타났다. 감독은 쑥스럽게 웃었다.'], 'happy+4 management+0.05 morale+2', { cond: [J], cd: 52, max: 10 }),
  pa('co_p_signing', C, 2, ['신입 선수가 도착했다. 라커룸의 새 얼굴에 모두의 이목이 쏠렸다. 경쟁의 기운이 도는 훈련장이다.', '구단이 영입한 새 선수와 첫인사를 나눴다.'], 'standing+1 development+0.05', { cond: [M, 'window'], cd: 20, max: 30 }),
  pa('co_p_graduate', C, 3, ['유스 출신 선수가 성인팀 데뷔전에서 좋은 모습을 보였다. 감독으로서 가장 뿌듯한 순간 중 하나다.', '키워 낸 선수가 1군에서 자리를 잡았다. 코칭스태프가 손뼉을 쳤다.'], 'development+0.12 coachFame+0.15 rel.fans+2', { cond: [J], cd: 30, max: 30 }),
  pa('co_p_sold', C, 2, ['핵심 선수 {star:이} 더 큰 구단으로 이적했다. 구단은 환호했지만 감독은 전술 구상을 처음부터 다시 짰다.', '구단이 {star:을} 매각했다. 아쉬움이 컸지만 새로운 기회가 되었다.'], 'stress+3 rel.director-1 development+0.05', { cond: [M, 'window'], cd: 40, max: 20, note: 'transfer_value' }),
  pa('co_p_license_class', C, 2, ['자격증 과정 수업에서 동료 지도자들과 토론을 벌였다. 서로의 아이디어가 자극이 되었다.', '교육장에서 선배 지도자들의 경험담을 들었다. 현장의 지혜가 묻어 있었다.'], 'tactics+0.06 leadership+0.04', { cond: ['license>=0'], cd: 20, max: 30, note: 'coach_lic' }),
  pa('co_p_rumor', C, 2, ['다른 구단이 {name}에게 관심이 있다는 소문이 돌았다. 에이전트의 전화가 늘었다.', '언론이 "{name} 감독, 빅클럽 후보 중 하나"라고 보도했다.'], 'coachFame+0.3 stress+2', { cond: ['coachFame>=30'], cd: 52, max: 10 }),
  pa('co_p_quiet', C, 3, ['조용한 한 주였다. 훈련, 회의, 휴식. 일상의 리듬이 팀을 단단하게 했다.', '아무 사건 없는 한 주. 감독으로서 가장 고마운 시간이었다.', '경기 없는 한 주. 훈련 강도를 낮추고 선수들과 가벼운 대화를 나눴다.', '아무 사건도 없이 훈련표만 채워졌다. 감독에게는 이런 주가 선물이다.'], 'stress-2 happy+1', { cond: [J], cd: 26, max: 6 }),
  pa('co_p_pitch', C, 2, ['훈련장 잔디를 직접 살폈다. 작은 개선이 팀의 컨디션을 바꿀 수 있다.', '구단 시설 관리자와 훈련장 보수 문제를 의논했다.'], 'management+0.04', { cond: [J], cd: 30, max: 20 }),
  pa('co_p_academy_visit', C, 2, ['아카데미 연령별 팀을 둘러보며 지도자들에게 철학을 공유했다. 코치들의 눈빛이 진지했다.', '유소년 훈련을 참관하며 일관된 철학이 얼마나 중요한지 되새겼다.'], 'development+0.1 leadership+0.04', { cond: [J], cd: 40, max: 20 }),
  pa('co_p_mind_game', C, 2, ['상대 감독이 경기 전 심리전을 걸어왔다. 선수들에게 "신경 쓰지 말고 우리 축구를 하자"고 말했다.', '기자회견에서 상대의 도발이 이어졌다. 담담하게 응수했다.'], 'leadership+0.05 morale+1', { cond: [M], cd: 40, max: 20 }),
  pa('co_p_travel', C, 2, ['원정 버스 안에서 선수들과 영상을 함께 보며 농담을 주고받았다. 팀이 한결 가까워졌다.', '장거리 원정길, 코치들과 나눈 대화가 큰 영감을 주었다.'], 'management+0.05 happy+1', { cond: [J], cd: 30, max: 20 }),
  pa('co_p_foreign_player', C, 2, ['외국인 선수가 팀 문화에 적응하는 모습이 눈에 띄었다. 통역 없이도 농담이 통했다.', '새로 온 외국인 선수가 팀 동료들과 식당에서 어울렸다.'], 'management+0.05 happy+1', { cond: [M], cd: 40, max: 20 })
];
