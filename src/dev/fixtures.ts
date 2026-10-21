import { newGame, tickState, autoWeek, resolveDecision } from '../engine/game';
import { autoDecide } from '../engine/auto';
import { rngOf } from '../engine/world';
import { pushDecision } from '../engine/events';
import { ensureContent } from '../engine/content';
import type { Decision, GameState } from '../engine/types';

export type FixtureName = 'youth' | 'decision' | 'irreversible' | 'injury' | 'fa' | 'coach' | 'modals';

export const FIXTURES: { id: FixtureName; label: string }[] = [
  { id: 'youth', label: '유스' },
  { id: 'decision', label: '결정 대기' },
  { id: 'irreversible', label: '되돌릴 수 없는 결정' },
  { id: 'injury', label: '부상' },
  { id: 'fa', label: 'FA' },
  { id: 'coach', label: '지도자' },
  { id: 'modals', label: '모달 대기열' }
];

function base(weeks: number): GameState {
  ensureContent();
  const s = newGame({ seed: 'dev-ui-fixture', name: '', pos: 'random', mode: 'normal', code: '', lengthMin: 60 });
  let guard = 0;
  while (s.week < weeks && !s.ended && guard++ < 4000) {
    let dg = 0;
    while (s.decision && dg++ < 20) {
      const { idx, demands } = autoDecide(s, rngOf(s), s.decision);
      resolveDecision(s, idx, demands, false);
    }
    autoWeek(s);
    if (!tickState(s)) break;
  }
  while (s.decision) {
    const { idx, demands } = autoDecide(s, rngOf(s), s.decision);
    resolveDecision(s, idx, demands, false);
  }
  s.toasts.length = 0;
  return s;
}

function synthetic(s: GameState, irreversible: boolean): Decision {
  return {
    uid: s.ev.nextId++,
    kind: irreversible ? 'retire' : 'event',
    ref: irreversible ? 'retire_nudge' : 'dev_demo',
    title: irreversible ? '은퇴를 고민하다' : '감독이 면담을 요청했다',
    text: irreversible ? '몸이 예전 같지 않다. 이대로 그라운드를 떠날지 한 번 더 뛸지 정해야 한다.' : '훈련이 끝난 뒤 감독이 조용히 불러 세웠다. 요즘 팀 분위기와 내 위치에 대해 이야기하고 싶다고 한다.',
    choices: irreversible
      ? [
          { label: '은퇴한다', chips: [{ k: '행복', d: 5 }, { k: '명성', d: -2 }], pct: null, disabled: '' },
          { label: '한 시즌만 더 뛴다', chips: [{ k: '피로', d: 6 }, { k: '명성', d: 1 }], pct: 55, disabled: '' }
        ]
      : [
          { label: '솔직하게 출전 시간을 요구한다', chips: [{ k: '감독 관계', d: 4 }, { k: '스트레스', d: 3 }], pct: 48, disabled: '' },
          { label: '묵묵히 훈련에 집중하겠다고 답한다', chips: [{ k: '프로의식', d: 2 }, { k: '행복', d: -1 }], pct: null, disabled: '' },
          { label: '에이전트와 상의해 보겠다고 한다', chips: [{ k: '이적 제안', d: 1 }], pct: 70, disabled: '' }
        ],
    w: s.week,
    heavy: false,
    help: '',
    ctx: '',
    offers: []
  };
}

export function buildFixture(name: FixtureName): GameState {
  if (name === 'decision') {
    const s = base(110);
    pushDecision(s, synthetic(s, false));
    return s;
  }
  if (name === 'irreversible') {
    const s = base(110);
    pushDecision(s, synthetic(s, true));
    return s;
  }
  if (name === 'injury') {
    const s = base(90);
    s.st.injury = { id: 'hamstring', ko: '햄스트링 부상', part: '허벅지', weeksLeft: 6, total: 8, early: false, recurrence: false };
    s.st.fatigue = 72;
    s.st.morale = 34;
    return s;
  }
  if (name === 'fa') {
    const s = base(110);
    s.phase = 'pro';
    s.career.clubId = '';
    s.career.signed = true;
    s.career.contract = null;
    s.career.freeAgentW = s.week - 9;
    return s;
  }
  if (name === 'coach') {
    const s = base(110);
    s.phase = 'coach';
    s.coach.entered = true;
    s.coach.role = 'manager';
    s.coach.clubId = s.p.startClubId;
    s.coach.fame = 42;
    s.coach.peakFame = 48;
    s.coach.standing = 64;
    s.coach.licenses = { C: 1, B: 1, A: 0, P: 0 };
    s.coach.skills = { tactics: 55, development: 48, leadership: 52, management: 50, media: 40, data: 44, language: 35 };
    s.p.birth = { ...s.p.birth, y: s.p.birth.y - 22 };
    return s;
  }
  return base(60);
}
