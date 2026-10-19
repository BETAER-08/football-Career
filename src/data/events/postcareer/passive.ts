import type { RawEvent } from '../../schema';
import { pa } from '../helpers';

const PC: ('postcareer')[] = ['postcareer'];

export const postPassive: RawEvent[] = [
  pa('po_p_live', PC, 4, ['첫 생방송 해설. 카메라의 빨간 불이 켜지자 입이 바짝 말랐다. 그래도 어느새 경기를 읽는 내 목소리가 들렸다.', '방송 부스에 앉아 경기를 보며 감정을 짚어 내려갔다. 선수 시절의 감각이 말이 되어 흘러나왔다.'], 'postRep+0.3 postSkill+0.2 fatigue+2', { cond: ['path:pundit'], cd: 10, max: 99 }),
  pa('po_p_viral', PC, 2, ['해설 중 던진 한마디가 큰 화제가 됐다. 클립이 SNS에서 퍼졌다.', '재치 있는 해설이 팬들 사이에서 인기를 끌었다. 방송국이 새로운 코너를 제안했다.'], 'postRep+0.6 followers+40 happy+3', { cond: ['path:pundit', 'postSkill>=15'], cd: 40, max: 10, note: 'pundit_bias' }),
  pa('po_p_scout_trip', PC, 3, ['스카우트 출장길. 낯선 도시의 작은 경기장에서 숨은 재능을 발견했다. 메모장에 이름을 적었다.', '비행기, 기차, 렌터카. 스카우터의 하루는 길고 조용하다.'], 'postSkill+0.3 fatigue+3', { cond: ['path:admin'], cd: 10, max: 99 }),
  pa('po_p_report', PC, 3, ['스카우팅 리포트를 단장에게 제출했다. 데이터와 감각이 어우러진 보고서라는 평가를 받았다.', '내 추천 선수가 1군 훈련에 합류했다. 보고서를 쓴 보람이 있었다.'], 'postSkill+0.2 postRep+0.1', { cond: ['path:admin'], cd: 12, max: 60 }),
  pa('po_p_biz_good', PC, 3, ['사업 분기 실적이 좋았다. 직원들과 함께 작은 축하 파티를 열었다.', '신규 거래처가 생기며 매출이 오랜만에 상승했다.'], 'cashy+0.04 happy+3 postSkill+0.1', { cond: ['path:business'], cd: 14, max: 60 }),
  pa('po_p_biz_bad', PC, 3, ['사업 경기가 얼어붙었다. 장부를 들여다보는 시간이 길어졌다.', '핵심 거래처가 계약을 해지했다. 자금 흐름이 빠듯하다.'], 'cashy-0.03 stress+3', { cond: ['path:business'], cd: 14, max: 60, note: 'econ_crisis' }),
  pa('po_p_legend', PC, 3, ['레전드 매치에 초청받았다. 옛 동료들과 함께 뛰자 몸은 느려졌지만 마음은 다시 열여섯 살이 되었다.', '은퇴한 선수들이 모여 자선 경기를 열었다. 관중석 박수가 따뜻했다.'], 'happy+6 postRep+0.4 fameD+0.4 fatigue+3', { cond: ['fameD>=12'], cd: 26, max: 30 }),
  pa('po_p_farewell', PC, 2, ['구단이 은퇴식을 열어 주었다. 경기장 대형 화면에 지난 날의 영상이 흘렀다. 팬들의 박수가 한참 이어졌다.', '은퇴 기념 경기가 열렸다. 마지막으로 그라운드를 한 바퀴 돌았다.'], 'happy+10 postRep+0.8 rel.fans+6', { cond: ['fameD>=15', 'lvlmax>=3'], cd: 520, max: 1 }),
  pa('po_p_reunion', PC, 3, ['옛 동료들과 오랜만에 저녁 식사를 했다. 이야기는 끝이 없었다.', '동기 모임에서 다 같이 옛날 영상을 보며 웃음을 터뜨렸다.'], 'happy+4 stress-3', { cd: 20, max: 40 }),
  pa('po_p_knee', PC, 3, ['날씨가 흐리면 무릎이 먼저 안다. 선수 시절의 몸이 남긴 영수증이다.', '계단을 오르다 무릎이 시큰거렸다. 선수 시절의 훈장이다.'], 'health-2 stress+1', { cd: 26, max: 40, note: 'veteran' }),
  pa('po_p_fan', PC, 3, ['거리에서 팬이 다가와 "당신의 경기를 보며 자랐어요"라고 말했다. 가슴이 뭉클해졌다.', '낯선 팬이 오래된 유니폼을 내밀며 사인을 부탁했다.'], 'happy+3 postRep+0.1', { cond: ['fameD>=8'], cd: 20, max: 40 }),
  pa('po_p_kids', PC, 3, ['아이가 축구공을 안고 달려왔다. "아빠, 공 차자." 운동장에서의 시간이 어느 경기보다 소중했다.', '아이의 학교 운동회에서 달리기를 하다 숨이 찼다. 아이가 박수를 쳤다.'], 'happy+5 stress-4', { cond: ['children>=1'], cd: 20, max: 40 }),
  pa('po_p_vacation', PC, 3, ['가족과 바닷가에서 며칠을 보냈다. 훈련 일정 없는 휴가는 이렇게 느린 것이었구나.', '해가 지는 모래사장에서 아무 생각 없이 앉아 있었다.'], 'happy+5 stress-6 health+1', { cd: 26, max: 40 }),
  pa('po_p_charity', PC, 2, ['자선 만찬에서 인사 말씀을 했다. 모금액이 목표치를 넘었다.', '유소년 후원 행사에 얼굴을 비췄다. 아이들이 사인을 받으려 줄을 섰다.'], 'happy+3 postRep+0.3', { cond: ['fameD>=10'], cd: 40, max: 20 }),
  pa('po_p_hof', PC, 2, ['구단 명예의 전당에 이름이 올랐다. 벽에 새겨진 이름을 한참 바라보았다.', '리그가 선정한 레전드 명단에 이름이 올랐다.'], 'happy+8 postRep+1', { cond: ['lvlmax>=4', 'fameD>=20'], cd: 520, max: 1 }),
  pa('po_p_doc', PC, 2, ['방송사가 {name}의 인생을 다룬 다큐멘터리를 제작했다. 오랜 기억이 화면 속에서 펼쳐졌다.', '다큐멘터리 방영 후 팬들이 다시 몰려왔다.'], 'postRep+0.8 followers+60 happy+4', { cond: ['fameD>=35'], cd: 520, max: 1 }),
  pa('po_p_youth_clinic', PC, 3, ['지역 유소년 클리닉에서 아이들에게 기본기를 가르쳤다. 아이들의 눈이 반짝였다.', '유소년 훈련에서 {name}의 옛 이야기를 들려주었다. 아이들이 집중해서 들었다.'], 'postSkill+0.2 happy+3', { cd: 26, max: 40 }),
  pa('po_p_gym', PC, 3, ['동네 헬스장에서 땀을 흘렸다. 몸이 예전 같지 않지만 오히려 개운했다.', '러닝머신 위에서 오랜만에 숨이 찼다. 건강이 가장 큰 자산이라는 걸 새삼 느꼈다.'], 'health+3 stress-3', { cd: 20, max: 40 }),
  pa('po_p_tax', PC, 2, ['연말 정산 시기. 세금 신고서를 앞에 두고 회계사와 한참 상담했다.', '재산세와 소득세 고지서가 한꺼번에 날아왔다.'], 'stress+2', { cond: ['net>=5000'], cd: 52, max: 20 }),
  pa('po_p_anniv', PC, 2, ['옛 소속 구단 창단 기념 행사에 초대받았다. 구단 관계자들이 반갑게 맞이했다.', '구단 창립 기념일. 레전드 선수 자격으로 시구에 나섰다.'], 'postRep+0.3 happy+3', { cond: ['lvlmax>=3', 'fameD>=8'], cd: 52, max: 20 }),
  pa('po_p_quiet', PC, 4, ['특별한 일 없는 평범한 한 주. 장을 보고 요리하며 아무 일도 없다는 것에 감사했다.', '조용한 하루하루가 흘러갔다. 축구 없는 일상이 낯설고 편안했다.'], 'stress-2 happy+1', { cd: 8, max: 99 }),
  pa('po_p_old_rival', PC, 2, ['옛 라이벌이 연락을 해 왔다. 오랫동안 서로를 인정하지 못했던 사이였지만 이제는 웃으며 이야기했다.', '은퇴 후 우연히 {rival}과(와) 마주쳤다. 어색한 악수가 따뜻한 포옹으로 바뀌었다.'], 'happy+4 stress-2', { cd: 52, max: 6 }),
  pa('po_p_coach_visit', PC, 2, ['옛 지도자가 안부 전화를 했다. "자네라면 좋은 지도자가 될 거야."', '은사가 먼저 연락해 왔다. 지도자의 길을 권하는 이야기였다.'], 'happy+3 hid.ambition+1', { cond: ['!path:coach'], cd: 52, max: 6 }),
  pa('po_p_market', PC, 2, ['주식 시장이 요동쳤다. 포트폴리오를 들여다보는 시간이 길어졌다.', '경제 뉴스가 연일 시끄럽다. 자산 가치가 조금씩 흔들린다.'], 'stress+2', { cond: ['net>=3000'], cd: 40, max: 20, note: 'econ_crisis' })
];
