import { Rng, hashString } from './rng';
import { rngOf } from './world';
import { ageAt, swOf } from './time';
import { windowNow, isPreseason, isOffseason, isSeasonEnd, hasWinterBreak, calKindOf, calOf } from './calendar';
import { createState, originFromSeed } from './player';
import { ensureContent } from './content';
import { growWeek } from './growth';
import { weeklyFocusEffects, defaultFocus } from './lifestyle';
import { weeklyFinance } from './finance';
import { advanceInjury, startInjury, injuryHazard, injuryEndsCareer } from './health';
import { INJURY_BY_ID } from '../data/injuries';
import { addLog, toast } from './log';
import { openSeason, matchesThisWeek, playFixtureToday, intlWindow, tournamentWeek, endSeason, trainingWeekLoad, snapSeason } from './season';
import { expireContracts, weeklyUnattached, youthStep, forceRetireCheck, retirePlayer, endGame, upBiasUpdate, retirePressure } from './lifecycle';
import { rollWeekly, resolveEventChoice, applyMomentContext, pushDecision, getEvent, eventsLoaded, buildDecision, markFired } from './events';
import { resolveOffer } from './offers';
import { marketWeek } from './market';
import { coachWeekly, coachSeasonEnd, acceptCoachJob } from './coach';
import { postWeekly, setPath, type PathId } from './postcareer';
import { ageTournamentWeek } from './agecomp';
import { youthSeasonReview } from './youth';
import { entryWeekly, listedThisWeek, midSeasonJump, settleCheck, youthToday } from './yleague';
import { midSeasonSummary } from './summary';
import { buildCoachReview, patchCoachReview, patchYouthReview } from './review';
import { ceremonyWeek, worldSeasonEnd } from './worldsim';
import { makeGoals } from './goals';
import { runAction } from './actions';
import { autoDecide, autoFocus, autoActionId } from './auto';
import { updateRole, leaveToFree, makeOfferFor, joinClub } from './transfer';
import type { Decision, GameConfig, GameState, InputRec, ResultPanel } from './types';
import { clamp } from './rng';
import { getClub } from './data';
import { clubLvl } from './world';
import { curOvr } from './attributes';
import { setCondEnv } from './fx';
import { hasUpperClub } from './upper';
import { isCosmetic } from './flags';
import { josa } from './josa';

setCondEnv({
  clubLvl: (s) => {
    if (s.phase === 'coach' && s.coach.clubId) return clubLvl(s, s.coach.clubId);
    return s.career.clubId ? clubLvl(s, s.career.clubId) : 1;
  },
  ovr: (s) => curOvr(s.ab),
  abroad: (s) => {
    const id = s.phase === 'coach' ? s.coach.clubId : s.career.clubId;
    return !!id && getClub(id).country !== s.p.country;
  },
  hasWindow: (s) => windowNow(s),
  preseason: (s) => isPreseason(s),
  offseason: (s) => isOffseason(s),
  seasonEnd: (s) => isSeasonEnd(s),
  winterBreak: (s) => hasWinterBreak(s),
  springAutumn: (s) => calKindOf(s) === 'sa',
  upperClub: (s) => hasUpperClub(s, false),
  upperAbroad: (s) => hasUpperClub(s, true)
});

export function newGame(cfg: GameConfig, forced?: import('./roulette').RouletteResult): GameState {
  ensureContent();
  const origin = forced ?? originFromSeed(cfg);
  const { state } = createState(cfg, origin);
  state.focus = defaultFocus('youth');
  state.goals = makeGoals(state);
  return state;
}

function injuryWeek(s: GameState, rng: Rng, age: number, weekMins: number): void {
  if (s.st.injury) {
    const r = advanceInjury(s, rng);
    if (r === 'recovered') toast(s, '부상에서 복귀했다.');
    return;
  }
  if (s.st.recur && s.week >= s.st.recur.w) {
    const id = s.st.recur.id;
    s.st.recur = null;
    const inj = startInjury(s, rng, id, age);
    inj.recurrence = true;
    addLog(s, 'system', '부상 재발', `${josa(inj.ko, '이')} 재발했다. 복귀까지 ${inj.total}주.`, []);
    if (injuryEndsCareer(s, rng, id, age)) retirePlayer(s, rng, `${INJURY_BY_ID[id].ko}의 재발 끝에 더는 뛸 수 없었다.`, true);
    return;
  }
  const share = clamp(weekMins / 90, 0, 1.4);
  const h = injuryHazard(s, share) * (s.focus === 'phys' ? 1.2 : s.focus === 'recover' ? 0.76 : s.focus === 'rest' ? 0.7 : 1);
  if (rng.next() < h) {
    const inj = startInjury(s, rng, null, age);
    if (inj.weeksLeft >= 2 || inj.id === 'acl') toast(s, `${inj.ko} (${inj.part}) — ${inj.total}주 결장`);
    addLog(s, 'system', '부상', `${inj.ko} (${inj.part}). 복귀까지 약 ${inj.total}주.`, []);
    if (injuryEndsCareer(s, rng, inj.id, age)) {
      retirePlayer(s, rng, `${inj.ko}의 후유증으로 더는 선수 생활을 이어갈 수 없었다.`, true);
      return;
    }
    if (inj.total >= 4 && !s.decision && !s.career.retired) {
      const def = getEvent('injury_early_return');
      s.decCtx = {};
      markFired(s, def);
      pushDecision(s, buildDecision(s, rng, def));
    }
  }
}

function playerWeek(s: GameState, rng: Rng): void {
  const sw = swOf(s.week);
  const age = ageAt(s.p.birth, s.week);
  if (sw === 0 && s.week > 0) {
    openSeason(s);
    if (s.life.mil === 'serving' && s.week >= s.life.milEnd) returnFromMilitary(s, rng);
  }
  if (age >= 18 && s.life.studying && s.life.eduLevel === 0) {
    s.life.eduLevel = Math.max(s.life.eduLevel, 1);
    s.life.studying = false;
    s.life.eduProgress = 0;
    if (s.focus === 'study') s.focus = 'tech';
  }
  if (s.phase === 'youth' && s.life.studying) s.life.eduProgress += 0.6;
  weeklyFocusEffects(s);
  trainingWeekLoad(s);
  growWeek(s, rng, age);
  weeklyFinance(s, rng);
  const beforeMins = s.career.cur.mins + s.career.yCur.mins;
  if (s.career.clubId) {
    ageTournamentWeek(s, rng, sw);
    const todays = matchesThisWeek(s, sw);
    const suspended = s.ev.flags.suspended !== undefined && s.week - s.ev.flags.suspended <= 1;
    for (const fx of todays) {
      if (suspended && fx.kind === 'league') {
        s.career.cur.avail += 1;
        continue;
      }
      playFixtureToday(s, rng, fx, s.phase === 'youth');
    }
    delete s.ev.flags.suspended;
    if (s.phase === 'youth') youthToday(s, rng, sw, listedThisWeek(s) || s.ev.flags.intlAway === s.week);
  } else {
    s.st.sharp = clamp(s.st.sharp - 1, 20, 100);
  }
  if (!s.career.retired) injuryWeek(s, rng, age, s.career.cur.mins + s.career.yCur.mins - beforeMins);
  if (s.career.retired) return;
  if (s.career.clubId) {
    marketWeek(s, rng);
    intlWindow(s, rng, sw);
    tournamentWeek(s, rng, sw);
  } else weeklyUnattached(s, rng);
  youthStep(s, rng, age);
  if (s.career.retired) return;
  if (s.phase === 'youth') {
    settleCheck(s, rng);
    if (s.phase === 'youth') {
      entryWeekly(s, rng, age);
      const mid = calOf(s).midSeason;
      if (sw > mid && sw <= mid + 5) midSeasonJump(s, rng);
    }
  }
  militaryWeek(s, rng);
  if (sw === 25) ceremonyWeek(s);
  midSeasonSummary(s, rng);
  rollWeekly(s, rng);
  if (sw === 51) {
    upBiasUpdate(s);
    endSeason(s, rng);
    youthSeasonReview(s, rng);
    patchYouthReview(s);
    retirePressure(s, rng, age + 0);
    expireContracts(s, rng);
    forceRetireCheck(s, rng, age + 0);
    if (!s.career.retired && s.career.clubId && s.career.contract) updateRole(s);
  }
}

function militaryWeek(s: GameState, rng: Rng): void {
  if (s.life.mil === 'serving' && s.week >= s.life.milEnd) returnFromMilitary(s, rng);
}

function returnFromMilitary(s: GameState, rng: Rng): void {
  s.life.mil = 'done';
  const parent = s.career.contract?.loanFrom;
  addLog(s, 'milestone', '전역', '병역 의무를 마치고 전역했다.', [], { star: true });
  if (parent) {
    const o = makeOfferFor(s, rng, parent, 'milreturn', { renew: true });
    leaveToFree(s, '전역');
    if (o) joinClub(s, rng, { ...o, years: 2 }, '전역 복귀');
  }
}

export function tickState(s: GameState): boolean {
  if (s.ended || s.decision) return false;
  const rng = rngOf(s);
  if (!eventsLoaded()) throw new Error('events not loaded');
  switch (s.phase) {
    case 'youth':
    case 'pro':
      playerWeek(s, rng);
      break;
    case 'coach': {
      const age = ageAt(s.p.birth, s.week);
      weeklyFocusEffects(s);
      trainingWeekLoad(s);
      weeklyFinance(s, rng);
      coachWeekly(s, rng);
      midSeasonSummary(s, rng);
      rollWeekly(s, rng);
      if (swOf(s.week) === 0 && s.week > 0) snapSeason(s);
      if (swOf(s.week) === 25) ceremonyWeek(s);
      if (swOf(s.week) === 51) {
        buildCoachReview(s);
        worldSeasonEnd(s);
        coachSeasonEnd(s, rng);
        patchCoachReview(s);
      }
      if (age >= 75) endGame(s, '75세에 이르렀다. 긴 축구 인생이 막을 내린다.');
      break;
    }
    case 'postcareer': {
      weeklyFocusEffects(s);
      trainingWeekLoad(s);
      weeklyFinance(s, rng);
      postWeekly(s, rng);
      rollWeekly(s, rng);
      if (swOf(s.week) === 25) ceremonyWeek(s);
      if (swOf(s.week) === 51) {
        worldSeasonEnd(s);
        s.fame.dom = clamp(s.fame.dom * 0.95, 0, 100);
        s.post.rep = clamp(s.post.rep * 0.985, 0, 100);
      }
      break;
    }
  }
  s.week += 1;
  if (!s.ended && ageAt(s.p.birth, s.week) >= 75) endGame(s, '75세에 이르렀다. 긴 축구 인생이 막을 내린다.');
  return true;
}

export function pushInput(s: GameState, rec: Omit<InputRec, 'w'>): void {
  s.inputs.push({ w: s.week, ...rec });
}

export function setFocusInput(s: GameState, id: string): void {
  s.focus = id;
  pushInput(s, { t: 'focus', a: id, b: 0, c: '' });
}

export function resolveDecision(s: GameState, idx: number, demands = '', record = true): ResultPanel | null {
  const d = s.decision;
  if (!d) return null;
  const rng = rngOf(s);
  if (record) pushInput(s, { t: d.kind === 'offer' ? 'offer' : 'choice', a: d.ref, b: idx, c: demands });
  let panel: ResultPanel;
  s.decision = null;
  s.decCtx = s.decCtx ?? {};
  if (d.kind === 'offer') {
    if (d.ref === 'coachjob') {
      const o = d.offers[idx];
      if (!o) {
        panel = { title: '제안을 거절했다', grade: 'none', roll: 0, need: 100, text: '지금은 때가 아니라고 판단했다.', changes: [], later: false, w: s.week };
      } else {
        acceptCoachJob(s, rng, o);
        panel = { title: '부임', grade: 'ok', roll: 0, need: 100, text: '새로운 자리에서 지도자의 새 장이 시작된다.', changes: [], later: false, w: s.week };
      }
    } else {
      panel = resolveOffer(s, rng, d, idx, demands);
      if (panel.grade !== 'ok' && panel.grade !== 'great') {
        const o = d.offers[idx];
        const pick = o ? `${getClub(o.clubId).name} 제안 수락` : d.choices[d.choices.length - 1]?.label ?? '제안 거절';
        addLog(s, 'system', panel.title, panel.text, panel.changes, { mine: true, grade: panel.grade, pick, result: panel.text, roll: panel.roll, need: panel.need });
      }
    }
  } else if (d.kind === 'career' && d.ref === 'path') {
    const paths: PathId[] = ['coach', 'pundit', 'admin', 'business', 'left'];
    setPath(s, rng, paths[idx]);
    panel = { title: '새로운 길', grade: 'none', roll: 0, need: 100, text: ['지도자의 길을 걷기로 했다.', '해설위원석에 앉게 된다.', '구단 행정 쪽으로 방향을 잡았다.', '사업에 도전하기로 했다.', '축구계를 떠나기로 했다.'][idx], changes: [], later: false, w: s.week };
  } else {
    panel = resolveEventChoice(s, rng, d, idx);
    if (d.kind === 'moment') {
      applyMomentContext(s);
      if (isCosmetic() && (panel.grade === 'great' || panel.grade === 'ok')) {
        const cur = s.career.cur;
        const b = cur.best ?? { w: s.week, rating: 0, line: '', comp: '', goals: 0, assists: 0, mins: 0, result: '' };
        if (panel.grade === 'great' || !b.momentText) cur.best = { ...b, momentText: `${d.text.split('\n')[0]} ${panel.text}` };
      }
    }
  }
  s.result = panel;
  if (!s.decision && s.decQueue.length) s.decision = s.decQueue.shift() as Decision;
  return panel;
}

export function actionInput(s: GameState, id: string, amount = 0): ResultPanel | null {
  const rng = rngOf(s);
  const p = runAction(s, rng, id, amount);
  if (p) {
    pushInput(s, { t: 'action', a: id, b: amount, c: '' });
    s.result = p;
  }
  return p;
}

export function autoStep(s: GameState): void {
  const rng = rngOf(s);
  let guard = 0;
  while (s.decision && guard++ < 12 && !s.ended) {
    const d = s.decision;
    const { idx, demands } = autoDecide(s, rng, d);
    resolveDecision(s, idx, demands, false);
  }
}

export function autoWeek(s: GameState): void {
  if (!s.auto) return;
  const rng = rngOf(s);
  if (s.week % 4 === 0) {
    s.focus = autoFocus(s, rng);
    const a = autoActionId(s, rng);
    if (a) runAction(s, rng, a.id, a.amount);
  }
}

export function stateHash(s: GameState): string {
  const copy = { ...s, log: [] as unknown[], toasts: [] as unknown[], result: null, inputs: [] as unknown[] };
  const str = JSON.stringify(copy);
  let h1 = hashString(str);
  let h2 = hashString(str.length + ':' + str.slice(0, str.length >> 1));
  h1 = (h1 ^ (h2 << 1)) >>> 0;
  h2 = (h2 ^ (h1 >>> 3)) >>> 0;
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0') + ':' + str.length;
}

export function runBot(cfg: GameConfig, forced: import('./roulette').RouletteResult | undefined, until: (s: GameState) => boolean, maxWeeks = 52 * 70): GameState {
  const s = newGame(cfg, forced);
  s.auto = true;
  let guard = 0;
  while (!s.ended && guard++ < maxWeeks) {
    autoStep(s);
    if (until(s)) break;
    autoWeek(s);
    if (!tickState(s)) autoStep(s);
  }
  return s;
}

export function replay(cfg: GameConfig, inputs: InputRec[], weeks: number): GameState {
  const s = newGame(cfg);
  let i = 0;
  let guard = 0;
  while (guard++ < weeks * 4 + 100 && !s.ended) {
    while (i < inputs.length && inputs[i].w === s.week) {
      const r = inputs[i++];
      if (r.t === 'focus') s.focus = r.a;
      else if (r.t === 'choice' || r.t === 'offer') resolveDecision(s, r.b, r.c, false);
      else if (r.t === 'action') {
        const rng = rngOf(s);
        runAction(s, rng, r.a, r.b);
      } else if (r.t === 'auto') s.auto = r.b === 1;
    }
    if (s.week >= weeks) break;
    if (s.auto) autoStep(s);
    if (s.decision) break;
    if (s.auto) autoWeek(s);
    tickState(s);
  }
  return s;
}

