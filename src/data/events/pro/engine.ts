import type { RawEvent } from '../../schema';

export const engineEvents: RawEvent[] = [
  {
    id: 'youth_final_release', kind: 'choice', phase: ['youth'], weight: 1, scheduledOnly: true, max: 5, cooldown: 0, group: 'release', exclusiveGroup: 'release_path',
    text: [
      '{coach} 감독이 조용히 불렀다. "1군 계약은 어렵겠다. 클럽은 계약 연장 없이 너를 놓아주기로 했다." 숙소 복도가 평소보다 길게 느껴졌다.',
      '구단 사무실에서 서류 한 장을 받았다. 유스 계약 종료 통보였다. {coach} 감독은 "다른 길이 있을 거다"라고만 했다.'
    ],
    note: 'youth_rate',
    choices: [
      {
        label: '하위 리그 입단 테스트에 도전한다', pv: '기회↑ 스트레스↑', check: '55 ovr*0.2 hid.pro*0.2',
        ok: { t: '짐을 싸서 여러 구단의 테스트를 돌기로 했다. 아직 끝난 게 아니다.', fx: 'fx:trialOffers stress+6' },
        bad: { t: '연락은 좀처럼 오지 않았다. 몇 주를 기다린 끝에야 작은 구단 한 곳이 테스트 기회를 주었다.', fx: 'fx:trialOffers stress+10 morale-5' }
      },
      { label: '축구를 그만둔다', pv: '진로 변경', ok: { t: '오랫동안 품어온 꿈을 접었다. 마지막으로 공을 만져 본 날이었다.', fx: 'fx:youthQuit' } }
    ]
  },
  {
    id: 'injury_early_return', kind: 'choice', phase: ['youth', 'pro'], weight: 1, scheduledOnly: true, max: 999, cooldown: 4,
    text: [
      '의료진이 진단 결과를 설명했다. 팀 사정상 조금 일찍 돌아올 수도 있지만 재발 위험이 따른다고 했다.',
      '{coach} 감독이 "무리하지는 마라"고 하면서도 복귀 날짜를 은근히 물었다.'
    ],
    note: 'inj_early',
    choices: [
      { label: '충분히 재활하고 돌아온다', pv: '건강↑ 재발 위험↓ 경기 감각↓', ok: { t: '서두르지 않고 재활 일정을 끝까지 소화하기로 했다. 대신 경기 감각이 한동안 무뎌졌다.', fx: 'fx:fullRehab sharp-3 rel.coach-2' } },
      {
        label: '조기 복귀를 감행한다', pv: '복귀 단축 재발 위험↑↑', check: '50 health*0.3 attr.recovery*1.5 hid.injuryProne*-0.2',
        great: { t: '몸이 의외로 잘 버텨 주었다. 예정보다 일찍 돌아와 팀의 신뢰를 얻었다.', fx: 'fx:earlyReturn morale+4 rel.coach+2' },
        ok: { t: '팀을 위해 예정보다 일찍 돌아오기로 했다. 몸이 보내는 신호에 귀를 기울여야 한다.', fx: 'fx:earlyReturn' },
        bad: { t: '서두른 복귀는 곧 통증으로 돌아왔다. 의무팀의 표정이 굳었다.', fx: 'fx:earlyReturn fx:reinjure morale-5' },
        worst: { t: '복귀 첫 훈련에서 같은 부위가 다시 탈이 났다. 재활을 처음부터 다시 해야 한다.', fx: 'fx:earlyReturn fx:reinjure health-8 morale-8 stress+6' }
      }
    ]
  },
  {
    id: 'nat_first_call', kind: 'choice', phase: ['pro'], weight: 1, scheduledOnly: true, max: 1, cooldown: 0,
    text: [
      '{nat} 소집 명단에 이름이 올랐다. {natcoach} 감독이 직접 전화를 걸어 합류를 요청했다.',
      '협회에서 소집 공문이 도착했다. 처음으로 {nat} 이름이 새겨진 유니폼을 입게 될 수도 있다.'
    ],
    choices: [
      {
        label: '기쁘게 응한다', pv: '명성↑ 피로↑ 소집 부담', check: '55 health*0.15 fatigue*-0.2 hid.bigGame*0.1',
        ok: { t: '가슴에 달린 엠블럼을 처음 만져 보았다. 모든 것이 낯설고 벅찼다.', fx: 'fx:natYes fameD+1.5 happy+6' },
        bad: { t: '긴장과 피로가 겹쳐 훈련에서 몸이 따라 주지 않았다. 감독의 표정이 굳었다.', fx: 'fx:natYes fatigue+8 morale-3 rel.natcoach-2' }
      },
      { label: '고사한다', pv: '감독 관계↑ 대표팀 감독 관계↓', ok: { t: '구단 일정과 몸 상태를 이유로 정중히 고사했다.', fx: 'fx:natNo' } }
    ]
  },
  {
    id: 'nat_call', kind: 'choice', phase: ['pro'], weight: 1, scheduledOnly: true, max: 999, cooldown: 3,
    text: [
      '{nat} 소집 기간이 다가왔다. {natcoach} 감독이 이번에도 명단에 이름을 올렸다.',
      'A매치 주간이다. {nat} 유니폼을 다시 입을 기회가 왔다.'
    ],
    choices: [
      {
        label: '합류한다', pv: '명성↑ 피로↑', check: '58 health*0.15 fatigue*-0.2 hid.bigGame*0.1',
        ok: { t: '짐을 챙겨 소집지로 향했다.', fx: 'fx:natYes' },
        bad: { t: '장거리 이동과 빡빡한 일정에 지쳐 소집 기간 내내 컨디션이 좋지 않았다.', fx: 'fx:natYes fatigue+8 morale-2 rel.natcoach-2' }
      },
      { label: '고사한다', pv: '감독 관계↑ 대표팀 감독 관계↓', ok: { t: '휴식과 구단 일정을 이유로 이번 소집은 사양했다.', fx: 'fx:natNo' } }
    ]
  },
  {
    id: 'retire_nudge', kind: 'choice', phase: ['pro'], weight: 1, scheduledOnly: true, max: 12, cooldown: 26, exclusiveGroup: 'retire_path',
    text: [
      '몸이 예전 같지 않다. 아침마다 무릎이 먼저 하루를 알려준다. 에이전트와 가족 사이에서 "이제 슬슬"이라는 말이 오간다.',
      '라커룸 막내들이 어느새 아들뻘이다. 계약서를 앞에 두고 {name:은} 한참 창밖을 바라보았다.'
    ],
    note: 'retire_age',
    choices: [
      { label: '은퇴한다', pv: '선수 생활 종료', ok: { t: '"여기까지 하겠습니다." 오랫동안 입에 담지 못한 말이 의외로 담담하게 나왔다.', fx: 'fx:retire=한_시대를_마무리하기로_했다.' } },
      {
        label: '한 시즌만 더 뛴다', pv: '출전↓ 부상 위험↑', check: '50 health*0.2 hid.pro*0.15 fatigue*-0.2',
        ok: { t: '마지막이 될지도 모를 시즌을 더 해 보기로 했다.', fx: 'morale+3' },
        bad: { t: '몸이 한계를 드러냈다. 부진과 잔부상이 겹치며 마음이 흔들렸다.', fx: 'morale-5 health-4 stress+5' },
        worst: { t: '시즌 도중 큰 부상을 입었다. 마지막 시즌은 병상에서 끝났다.', fx: 'fx:inj morale-8' }
      }
    ]
  },
  {
    id: 'fa_pressure', kind: 'choice', phase: ['pro'], weight: 1, scheduledOnly: true, max: 6, cooldown: 26,
    text: [
      '무적 신분으로 반년이 흘렀다. 걸려 오던 전화는 뜸해졌고 에이전트의 목소리도 조심스러워졌다.',
      '혼자 공을 차는 시간이 길어졌다. 가족 사이에서 "이제 다른 길도 생각해 보자"는 말이 나온다.'
    ],
    choices: [
      { label: '현역 생활을 마무리한다', pv: '선수 생활 종료', ok: { t: '"여기까지 하겠습니다." 오래 기다린 끝에 내린 결론이었다.', fx: 'fx:retire=새_팀을_찾지_못하고_현역을_마무리하기로_했다.' } },
      {
        label: '눈높이를 낮춰 어디든 문을 두드린다', pv: '제안↑ 연봉↓', check: '58 hid.pro*0.15 agent*0.2',
        ok: { t: '조건을 따지지 않고 연락을 돌렸다. 몇몇 구단이 응답했다.', fx: 'fx:offers=free stress+3' },
        bad: { t: '눈높이를 낮췄지만 반응은 미지근했다.', fx: 'morale-4 stress+5' }
      },
      { label: '개인 훈련을 이어가며 기다린다', pv: '경기 감각↑ 스트레스↑', ok: { t: '혼자서 몸을 만들며 기회를 기다리기로 했다.', fx: 'sharp+6 stress+4' } }
    ]
  },
  {
    id: 'deal_collapse_pro', kind: 'choice', phase: ['pro'], weight: 1, scheduledOnly: true, max: 99, cooldown: 26,
    text: [
      '{club:이} 이적 제안을 끝내 거절했다는 소식이 에이전트를 통해 전해졌다. 라커룸에서도 이야기가 새어 나간 눈치다.',
      '구단 간 협상이 결렬됐다. 새 팀을 향해 이미 마음이 기울어 있던 터라 훈련장에 서 있는 것조차 어색하다.'
    ],
    choices: [
      {
        label: '훈련에 건성으로 임하며 압박한다', pv: '이적 요청 접수↑ 감독 관계↓ 경기 감각↓', check: '45 hid.temper*0.2 hid.ambition*0.15 hid.pro*-0.25',
        ok: { t: '훈련 강도가 눈에 띄게 떨어졌다. 구단은 불편한 기색이었지만 결국 이적 요청서를 받아 들었다.', fx: 'fx:reqPush=soft sharp-4 rel.coach-6 hid.pro-1' },
        worst: { t: '훈련 불참이 이어지자 구단이 징계위원회를 열었다. 주급 몇 주 치의 벌금과 함께 1군 훈련 제외 통보가 내려왔다.', fx: 'fx:fine=4 sharp-8 morale-8 rel.coach-14 rel.fans-6 hid.pro-2' },
        bad: { t: '건성인 태도가 곧바로 감독 눈에 띄었다. 구단은 훈련 태만으로 벌금을 매겼고, 벤치로 밀렸다. 팬들의 시선도 차가워졌다.', fx: 'fx:fine=2 sharp-6 morale-6 rel.coach-10 rel.fans-5 hid.pro-1' }
      },
      {
        label: '공식 이적 요청서를 제출한다', pv: '이적 요청 접수↑ 감독 관계↓', check: '55 hid.ambition*0.15 agent*0.2',
        ok: { t: '"새로운 도전을 하고 싶습니다." 요청서를 낸 날, 구단은 적절한 제안이 오면 보내 주겠다고 한발 물러섰다.', fx: 'fx:reqPush=hard rel.coach-4' },
        bad: { t: '요청서는 접수됐지만 구단은 팔 생각이 없다고 못을 박았다. 분위기만 싸늘해졌다.', fx: 'fx:reqPush=hard morale-4 rel.coach-8 rel.fans-4' }
      },
      {
        label: '에이전트를 통해 언론에 불만을 흘린다', pv: '명성↑ 평판 논란↑', check: '50 agent*0.2 hid.controversy*0.15',
        ok: { t: '"선수가 떠나고 싶어 한다"는 기사가 쏟아졌다. 여론이 구단을 압박하기 시작했다.', fx: 'fameD+0.4 followers+10 rel.media+2 rel.coach-5 hid.controversy+2' },
        bad: { t: '불만을 흘린 사실이 구단에 알려졌다. 구단은 품위 손상 조항을 들어 벌금을 부과했고, 감독은 공개 석상에서 "프로답지 못하다"고 선을 그었다.', fx: 'fx:fine=3 morale-5 rel.coach-9 rel.fans-6 hid.controversy+3' }
      },
      {
        label: 'SNS에 의미심장한 글을 올린다', pv: '팔로워↑ 팬 관계↓', check: '50 hid.social*0.2 hid.controversy*0.1',
        ok: { t: '"때로는 떠나야 할 때를 안다." 짧은 게시물이 하루 만에 수만 번 공유됐다.', fx: 'followers+25 fameD+0.2 rel.fans-4 hid.controversy+2' },
        bad: { t: '게시물이 삭제됐다. 구단 SNS 규정 위반으로 벌금이 부과됐다는 이야기가 돌았다.', fx: 'fx:fine=1 followers+5 morale-3 rel.coach-5 rel.fans-6' }
      },
      {
        label: '프로답게 참고 훈련에 집중한다', pv: '감독 관계↑ 스트레스↑', ok: { t: '속은 쓰렸지만 훈련장에서는 평소처럼 달렸다. 감독은 말없이 어깨를 두드렸다.', fx: 'hid.pro+1 stress+4 rel.coach+4 sharp+2' }
      }
    ]
  },
  {
    id: 'deal_collapse_youth', kind: 'choice', phase: ['youth'], weight: 1, scheduledOnly: true, max: 99, cooldown: 26,
    text: [
      '다른 구단의 제안이 {club}의 반대로 무산됐다. 보낼 수 없다는 구단의 입장이 전해지자 숙소 분위기가 어수선해졌다.',
      '유스 이적 협상이 결렬됐다. 부모님은 걱정스러운 얼굴로 연락을 해 왔고, 에이전트는 방법을 찾아보겠다고만 했다.'
    ],
    choices: [
      {
        label: '부모님과 함께 구단에 직접 호소한다', pv: '구단 입장 변화 기대 감독 관계↓', check: '48 hid.family*0.15 hid.pro*0.15',
        ok: { t: '부모님이 구단 사무실을 찾아 사정을 설명했다. 구단은 다음 시장에서 다시 논의하겠다고 답했다.', fx: 'fx:reqPush=soft stress+3 rel.coach-3' },
        bad: { t: '구단은 "선수의 앞날을 위해 내린 결정"이라며 요청을 일축했다. 분위기만 어색해졌다.', fx: 'morale-4 rel.coach-6 rel.father-1' }
      },
      {
        label: '훈련 참가를 미루며 시위한다', pv: '경기 감각↓ 감독 관계↓', check: '45 hid.temper*0.2 hid.pro*-0.25',
        ok: { t: '며칠 훈련에 나가지 않자 구단이 면담을 요청했다. 이적 문제를 다시 검토하겠다는 말이 나왔다.', fx: 'fx:reqPush=soft sharp-4 rel.coach-8 hid.pro-1' },
        bad: { t: '감독은 "규율을 어기는 선수는 쓸 수 없다"며 한동안 명단에서 제외했다. 구단 규정에 따라 벌금도 부과됐다.', fx: 'fx:fine=1 sharp-7 morale-7 rel.coach-12 hid.pro-2' }
      },
      {
        label: '에이전트에게 다른 구단을 알아보게 한다', pv: '제안 기회↑', check: '50 agent*0.25 ovr*0.1',
        ok: { t: '에이전트가 발 빠르게 움직였다. 다음 시장에서 접촉할 구단 몇 곳이 윤곽을 드러냈다.', fx: 'agentSkill+1 stress+1' },
        bad: { t: '에이전트의 연락에 돌아오는 답이 신통치 않았다. 기다려야 할 것 같다.', fx: 'stress+4 morale-3' }
      },
      {
        label: '마음을 다잡고 지금 팀에서 증명한다', pv: '감독 관계↑ 경기 감각↑', ok: { t: '남은 시즌 더 많이 뛰고 더 많이 배우기로 했다. 코치진은 달라진 눈빛을 알아챘다.', fx: 'hid.pro+1 sharp+3 rel.coach+3 stress+2' }
      }
    ]
  }
];
