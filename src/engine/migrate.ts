import { START_YEAR } from './time';
import { curOvr } from './attributes';
import { initWorld } from './worldsim';
import type { GameState } from './types';

export const STATE_VERSION = 3;

export type Migrated = { ok: true; state: GameState } | { ok: false; reason: string };

export function migrateState(raw: unknown): Migrated {
  if (!raw || typeof raw !== 'object') return { ok: false, reason: '저장 형식이 올바르지 않아요' };
  const st = raw as GameState & Record<string, unknown>;
  if (!st.p || !st.ab || !st.career || !st.ev) return { ok: false, reason: '저장 형식이 올바르지 않아요' };
  const v = typeof st.v === 'number' ? st.v : 1;
  if (v > STATE_VERSION) return { ok: false, reason: '더 새로운 버전의 저장이에요' };
  if (!st.p.birth || st.p.birth.y !== START_YEAR - 14) return { ok: false, reason: '이전 버전 저장이라 이어할 수 없어요' };
  const c = st.career as unknown as Record<string, unknown>;
  if (c.youthStage === undefined) c.youthStage = 'U17';
  if (c.stageSeasons === undefined) c.stageSeasons = 0;
  if (c.scholar === undefined) c.scholar = 0;
  const ev = st.ev as unknown as Record<string, unknown>;
  if (!ev.actUse) ev.actUse = {};
  if (!ev.pendSrc) ev.pendSrc = {};
  if (!ev.last) ev.last = {};
  if (ev.logSeq === undefined) ev.logSeq = Math.max(1, ...st.log.map((l) => l.id + 1), ...st.toasts.map((x) => x.id + 1));
  if (!ev.bud) ev.bud = { s: -1, choiceT: 0, choiceN: 0, majorN: 0, minorN: 0, passT: 0, passN: 0, lastChoiceW: -99 };
  const post = st.post as unknown as Record<string, unknown>;
  if (!post.ms) post.ms = {};
  if (!post.msWeek) post.msWeek = {};
  if (post.lastAsk === undefined) post.lastAsk = -1;
  if (post.askCount === undefined) post.askCount = 0;
  if (post.endedBy === undefined) post.endedBy = '';
  if (post.epiWeeks === undefined) post.epiWeeks = 0;
  if (!st.wld) st.wld = initWorld(st.cfg.seed, st.people, st.p.startClubId, st.p.country, st.p.startLvl, START_YEAR);
  if (!st.reviews) st.reviews = [];
  if (st.pendingReview === undefined) st.pendingReview = -1;
  if (st.goals === undefined) st.goals = null;
  if (st.dream === undefined) st.dream = '';
  if (!st.dreamHits) st.dreamHits = [];
  if (!st.snap) st.snap = { ovr: curOvr(st.ab), val: st.fame.value, wage: 0, fame: 0, standing: st.coach.standing };
  if (!st.cues) st.cues = [];
  if (!st.why) st.why = {};
  if (!st.recent) st.recent = [];
  st.v = STATE_VERSION;
  return { ok: true, state: st };
}
