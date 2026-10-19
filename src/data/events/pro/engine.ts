import type { RawEvent } from '../../schema';

export const engineEvents: RawEvent[] = [
  {
    id: 'youth_final_release', kind: 'choice', phase: ['youth'], weight: 1, scheduledOnly: true, max: 5, cooldown: 0, group: 'release',
    text: [
      '{coach} 감독이 조용히 불렀다. "1군 계약은 어렵겠다. 클럽은 계약 연장 없이 너를 놓아주기로 했다." 숙소 복도가 평소보다 길게 느껴졌다.',
      '구단 사무실에서 서류 한 장을 받았다. 유스 계약 종료 통보였다. {coach} 감독은 "다른 길이 있을 거다"라고만 했다.'
    ],
    note: 'youth_rate',
    choices: [
      { label: '하위 리그 입단 테스트에 도전한다', pv: '기회↑ 스트레스↑', ok: { t: '짐을 싸서 여러 구단의 테스트를 돌기로 했다. 아직 끝난 게 아니다.', fx: 'fx:trialOffers stress+6' } },
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
      { label: '충분히 재활하고 돌아온다', pv: '건강↑ 재발 위험↓', ok: { t: '서두르지 않고 재활 일정을 끝까지 소화하기로 했다.', fx: 'fx:fullRehab' } },
      { label: '조기 복귀를 감행한다', pv: '복귀 단축 재발 위험↑↑', ok: { t: '팀을 위해 예정보다 일찍 돌아오기로 했다. 몸이 보내는 신호에 귀를 기울여야 한다.', fx: 'fx:earlyReturn' } }
    ]
  },
  {
    id: 'nat_first_call', kind: 'choice', phase: ['pro'], weight: 1, scheduledOnly: true, max: 1, cooldown: 0,
    text: [
      '{nat} 소집 명단에 이름이 올랐다. {natcoach} 감독이 직접 전화를 걸어 합류를 요청했다.',
      '협회에서 소집 공문이 도착했다. 처음으로 {nat} 이름이 새겨진 유니폼을 입게 될 수도 있다.'
    ],
    choices: [
      { label: '기쁘게 응한다', pv: '명성↑ 피로↑', ok: { t: '가슴에 달린 엠블럼을 처음 만져 보았다. 모든 것이 낯설고 벅찼다.', fx: 'fx:natYes fameD+1.5 happy+6' } },
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
      { label: '합류한다', pv: '명성↑ 피로↑', ok: { t: '짐을 챙겨 소집지로 향했다.', fx: 'fx:natYes' } },
      { label: '고사한다', pv: '감독 관계↑ 대표팀 감독 관계↓', ok: { t: '휴식과 구단 일정을 이유로 이번 소집은 사양했다.', fx: 'fx:natNo' } }
    ]
  },
  {
    id: 'retire_nudge', kind: 'choice', phase: ['pro'], weight: 1, scheduledOnly: true, max: 12, cooldown: 26,
    text: [
      '몸이 예전 같지 않다. 아침마다 무릎이 먼저 하루를 알려준다. 에이전트와 가족 사이에서 "이제 슬슬"이라는 말이 오간다.',
      '라커룸 막내들이 어느새 아들뻘이다. 계약서를 앞에 두고 {name}은(는) 한참 창밖을 바라보았다.'
    ],
    note: 'retire_age',
    choices: [
      { label: '은퇴한다', pv: '선수 생활 종료', ok: { t: '"여기까지 하겠습니다." 오랫동안 입에 담지 못한 말이 의외로 담담하게 나왔다.', fx: 'fx:retire=한_시대를_마무리하기로_했다.' } },
      { label: '한 시즌만 더 뛴다', pv: '출전↓ 부상 위험↑', ok: { t: '마지막이 될지도 모를 시즌을 더 해 보기로 했다.', fx: 'morale+3' } }
    ]
  }
];
