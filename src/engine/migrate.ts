import { START_YEAR } from './time';
import { curOvr, rawForAnchored } from './attributes';
import { marketValue } from './finance';
import { initWorld } from './worldsim';
import { emptyRec } from './records';
import { openYouthRec, setupYouthSeason, settleToPro } from './yleague';
import type { GameState } from './types';

export const STATE_VERSION = 8;

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
  if (c.track === undefined) c.track = 'pro';
  if (c.signed === undefined) c.signed = !!c.debuted;
  if (c.transferReq === undefined) {
    const flag = (st.ev.flags as Record<string, number>).transfer_request;
    c.transferReq = flag === undefined ? -1 : flag;
    delete (st.ev.flags as Record<string, number>).transfer_request;
  }
  if (c.reqStance === undefined) c.reqStance = '';
  if (c.mkt === undefined) c.mkt = null;
  if (c.pre === undefined) c.pre = null;
  if (c.faPressureW === undefined) c.faPressureW = -1;
  if (c.reqDir === undefined) c.reqDir = '';
  if (!c.resCur) c.resCur = emptyRec(0, st.career.clubId, '', '', '', 2);
  if (!c.resSeasons) c.resSeasons = [];
  const pp = st.p as unknown as Record<string, unknown>;
  if (pp.startOvr === undefined) pp.startOvr = 0;
  if (!c.entry) c.entry = { step: 0, trainW: -1, squadW: -1, squadN: 0, jumps: 0, jumpW: -1, boostEnd: -1, callups: 0, callupSeason: -1, doubleJump: false, midChecked: -1 };
  if (!c.ySeasons) c.ySeasons = [];
  if (!c.yTrophies) c.yTrophies = [];
  if (!c.yAwards) c.yAwards = [];
  if (!c.yCur) c.yCur = emptyRec(0, st.career.clubId, '', '', '', 2);
  if (st.yt === undefined) st.yt = null;
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
  if (st.ab.dispAdj === undefined) st.ab.dispAdj = 10;
  if (st.ab.hFrac0 === undefined) st.ab.hFrac0 = Math.min(1, st.ab.height / st.p.finalHeight);
  if (st.ab.bmi0 === undefined) st.ab.bmi0 = st.ab.weight / ((st.ab.height / 100) * (st.ab.height / 100));
  if (!st.nat.ageRecs) st.nat.ageRecs = [];
  const nn = st.nat as unknown as Record<string, unknown>;
  if (nn.stage === undefined) nn.stage = 'none';
  if (nn.stageW === undefined) nn.stageW = -1;
  if (!nn.lastWhy) nn.lastWhy = [];
  if (!nn.matches) nn.matches = [];
  if (!nn.pool) nn.pool = {};
  if (!nn.poolS) nn.poolS = {};
  if (!nn.coachStyle) nn.coachStyle = 'attack';
  if (nn.coachUntil === undefined) nn.coachUntil = -1;
  if (!nn.mins10) nn.mins10 = [];
  if (nn.injEndW === undefined) nn.injEndW = -99;
  if (st.extra.podium === undefined) st.extra.podium = 0;
  if (!st.why) st.why = {};
  if (!st.recent) st.recent = [];
  if (v < 7) {
    const cc = st.career as unknown as Record<string, unknown>;
    if (cc.feeSum === undefined) cc.feeSum = 0;
    if (cc.feeMax === undefined) cc.feeMax = 0;
    const ww = st.wld as unknown as Record<string, unknown>;
    if (!ww.feeRec) ww.feeRec = { club: {}, league: {} };
    st.fame.value = marketValue(st);
    st.fame.peakValue = st.fame.value;
    st.snap.val = st.fame.value;
  }
  if (v < 8 || (st.ab as unknown as Record<string, unknown>).cap === undefined) {
    const old = Number(st.ab.pot);
    const cp = Math.min(99, Math.max(60, Number.isFinite(old) ? old : 70));
    st.ab.cap = Math.round(cp * 10) / 10;
    st.ab.pot = Math.round(rawForAnchored(st.ab.cap) * 10) / 10;
  }
  st.v = STATE_VERSION;
  if (st.phase === 'youth' && st.career.signed && st.career.clubId) settleToPro(st, null as never, '프로 선수단 등록');
  if (st.phase === 'youth' && st.career.clubId && !st.yt) {
    setupYouthSeason(st, true);
    openYouthRec(st);
  }
  return { ok: true, state: st };
}
