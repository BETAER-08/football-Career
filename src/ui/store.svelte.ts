import { newGame, resolveDecision, setFocusInput, actionInput, autoStep, pushInput } from '../engine/game';
import { ensureContent } from '../engine/content';
import { secPerYear, swOf } from '../engine/time';
import { defaultFocus } from '../engine/lifestyle';
import { playerGrade, coachGrade, percentileOf } from '../engine/scoring';
import type { AgeRec, Decision, GameConfig, GameState, NatStage, ResultPanel, Toast } from '../engine/types';
import type { RouletteResult } from '../engine/roulette';
import { clearSave, exportSave, hasSave, importSave, loadGame, loadPrefs, pushArchive, saveGame, savePrefs, exportEntry, type Prefs, type ArchiveEntry } from './save';
import { setMusic, chime, click, sfx } from './audio';
import { ARCHIVE_VERSION, buildEndData, type EndData } from '../engine/enddata';
import { isEpiPath } from '../engine/postcareer';
import { getClub } from '../engine/data';
import { formatKRW } from '../engine/finance';
import { netWorth } from '../engine/finance';
import { beginSkip, cancelSkip, endSkip, newPlayState, settle, stepPlayback, type PlayState } from './playback';
import BaselineWorker from './baseline.worker?worker';

export type ModalItem =
  | { key: string; kind: 'review'; idx: number; engine: boolean }
  | { key: string; kind: 'ceremony' }
  | { key: string; kind: 'age'; rec: AgeRec }
  | { key: string; kind: 'squad'; stage: NatStage };

export type Screen = 'menu' | 'setup' | 'roulette' | 'card' | 'game' | 'end' | 'vault';

class Store {
  screen = $state<Screen>('menu');
  game = $state.raw<GameState | null>(null);
  origin = $state.raw<RouletteResult | null>(null);
  prefs = $state<Prefs>(loadPrefs());
  ps = $state<PlayState>(newPlayState(1));
  toasts = $state<Toast[]>([]);
  banner = $state('');
  bannerExport = $state(false);
  legacy = $state.raw<{ raw: string; reason: string } | null>(null);
  end = $state.raw<EndData | null>(null);
  archiveFail = $state(false);
  modalQueue = $state.raw<ModalItem[]>([]);
  batchTotal = $state(0);
  batchIndex = $state(1);
  private modalTimer: number | null = null;
  private seenAge = 0;
  private seenStage: NatStage = 'none';
  tableOpen = $state(false);
  private epiSpeedFor = '';
  result = $state.raw<ResultPanel | null>(null);
  panel = $state<'' | 'money' | 'career' | 'life' | 'log' | 'info' | 'saves'>('');
  pendingConfig = $state.raw<GameConfig | null>(null);
  relSnap = $state.raw<Record<string, number>>({});
  private relSnapWeek = -99;
  baseline = $state.raw<number[]>([]);
  baselineProgress = $state(0);
  hasSaved = $state(hasSave());
  archived = $state(false);
  tutorialOpen = $state(false);
  private tutorialResume = false;
  savedAt = $state(0);
  logFocus = $state(0);
  saveFailed = $state(false);
  private pendingNotify = false;
  private lastFlush = 0;
  private last = 0;
  private timer: number | null = null;
  private lastSave = 0;
  private seenToast = 0;
  private worker: Worker | null = null;

  get playing(): boolean {
    return this.ps.playing;
  }

  set playing(v: boolean) {
    this.ps.playing = v;
  }

  get speed(): number {
    return this.ps.speed;
  }

  set speed(v: number) {
    this.ps.speed = v;
  }

  get activeModal(): ModalItem | null {
    return this.modalQueue[0] ?? null;
  }

  get reviewOpen(): boolean {
    return this.activeModal?.kind === 'review';
  }

  get ceremonyOpen(): boolean {
    return this.activeModal?.kind === 'ceremony';
  }

  get reviewIdx(): number {
    const m = this.activeModal;
    return m && m.kind === 'review' ? m.idx : -1;
  }

  get skipping(): boolean {
    return this.ps.skipping;
  }

  constructor() {
    ensureContent();
    this.ps.speed = this.prefs.speed;
  }

  toggleMusic(): void {
    this.prefs.music = !this.prefs.music;
    setMusic(this.prefs.music);
    savePrefs(this.prefs);
  }

  setLength(m: 30 | 60 | 90): void {
    this.prefs.lengthMin = m;
    savePrefs(this.prefs);
  }

  notify(): void {
    this.pendingNotify = false;
    this.lastFlush = performance.now();
    if (this.game) this.game = { ...this.game };
  }

  notifySoon(): void {
    if (this.pendingNotify) return;
    const wait = Math.max(0, 83 - (performance.now() - this.lastFlush));
    if (wait === 0) {
      this.notify();
      return;
    }
    this.pendingNotify = true;
    window.setTimeout(() => {
      if (this.pendingNotify) this.notify();
    }, wait);
  }

  begin(state: GameState, origin: RouletteResult | null): void {
    this.game = state;
    this.origin = origin;
    this.result = null;
    this.toasts = [];
    this.seenToast = 0;
    this.archived = false;
    this.archiveFail = false;
    this.end = null;
    this.clearModals();
    this.syncSeen(state);
    this.epiSpeedFor = '';
    cancelSkip(this.ps);
    this.ps.resume = null;
    this.ps.acc = 0;
    this.playing = true;
    this.screen = 'game';
    this.startBaseline();
    this.startLoop();
    this.saveNow();
    if (!this.prefs.tutorialSeen) this.openTutorial();
  }

  create(cfg: GameConfig, forced: RouletteResult): GameState {
    const s = newGame(cfg, forced);
    s.focus = defaultFocus('youth');
    return s;
  }

  startBaseline(): void {
    const g = this.game;
    if (!g) return;
    this.baseline = [];
    this.baselineProgress = 0;
    try {
      if (this.worker) this.worker.terminate();
      const w = new BaselineWorker();
      this.worker = w;
      w.onmessage = (e: MessageEvent<{ progress?: number; done?: boolean; scores?: number[] }>) => {
        if (e.data.progress !== undefined) this.baselineProgress = e.data.progress;
        if (e.data.done && e.data.scores) {
          this.baseline = e.data.scores;
          this.baselineProgress = 1;
        }
      };
      w.postMessage({ country: g.p.country, level: g.p.startLvl, pos: g.ab.pos, n: 200, seed: g.cfg.seed });
    } catch {
      this.baseline = [];
    }
  }

  startLoop(): void {
    if (this.timer !== null) return;
    this.last = performance.now();
    this.timer = window.setInterval(() => this.frame(), 40);
  }

  weekMs(): number {
    const g = this.game;
    if (!g) return 1000;
    const base = (secPerYear(this.prefs.lengthMin) * 1000) / 52;
    const post = g.phase === 'postcareer' && g.post.path === 'none' ? 2 : 1;
    return base / this.speed / post;
  }

  frame(): void {
    const now = performance.now();
    const dt = Math.min(250, now - this.last);
    this.last = now;
    const g = this.game;
    if (!g || this.screen !== 'game') return;
    if (g.ended) {
      endSkip(this.ps, 'ended');
      this.playing = false;
      this.finish();
      return;
    }
    if (g.decision && g.auto) {
      autoStep(g);
      this.notify();
    }
    this.checkModals(g);
    if (this.tutorialOpen) return;
    if (this.activeModal) {
      if (this.ps.skipping) endSkip(this.ps, 'modal');
      return;
    }
    if (g.decision) {
      if (this.ps.skipping) endSkip(this.ps, 'decision');
      return;
    }
    if (!this.ps.playing && !this.ps.skipping) return;
    const res = stepPlayback(this.ps, g, dt, this.weekMs());
    const n = res.weeks;
    if (res.ended) {
      this.last = performance.now();
      if (res.ended === 'quiet') this.toast('1년 동안 결정할 일이 없었어요');
    }
    if (n > 0) {
      this.snapRel();
      this.pullToasts();
      this.pullCues();
      this.notifySoon();
      if (performance.now() - this.lastSave > 2000 || g.decision) this.saveNow();
    }
    if (g.ended) this.finish();
  }

  snapRel(): void {
    const g = this.game;
    if (!g || g.week - this.relSnapWeek < 26) return;
    this.relSnapWeek = g.week;
    this.relSnap = Object.fromEntries(Object.entries(g.people).map(([k, p]) => [k, p.rel]));
  }

  clearModals(): void {
    if (this.modalTimer !== null) window.clearTimeout(this.modalTimer);
    this.modalTimer = null;
    this.modalQueue = [];
    this.batchTotal = 0;
    this.batchIndex = 1;
  }

  syncSeen(g: GameState): void {
    this.seenAge = g.nat.ageRecs.length;
    this.seenStage = g.nat.stage;
  }

  pushModal(item: ModalItem): void {
    if (this.modalQueue.some((m) => m.key === item.key)) return;
    this.modalQueue = [...this.modalQueue, item];
    this.batchTotal += 1;
    if (this.modalQueue.length === 1) this.activate();
  }

  private activate(): void {
    if (this.modalTimer !== null) window.clearTimeout(this.modalTimer);
    this.modalTimer = null;
    const g = this.game;
    const m = this.activeModal;
    if (!g || !m) return;
    if (m.kind === 'review' && !g.auto) this.playing = false;
    if (g.auto) this.modalTimer = window.setTimeout(() => this.closeActive(), m.kind === 'review' || m.kind === 'ceremony' ? 8000 : 2500);
  }

  closeActive(): void {
    const g = this.game;
    const m = this.activeModal;
    if (!m) return;
    if (this.modalTimer !== null) window.clearTimeout(this.modalTimer);
    this.modalTimer = null;
    if (g) {
      if (m.kind === 'review' && m.engine) g.pendingReview = -1;
      if (m.kind === 'ceremony') g.wld.ceremonyDue = false;
    }
    this.modalQueue = this.modalQueue.slice(1);
    if (this.modalQueue.length) {
      this.batchIndex += 1;
      this.activate();
    } else {
      this.batchTotal = 0;
      this.batchIndex = 1;
      if (g) settle(this.ps, g, false, m.kind === 'review');
    }
    this.notify();
  }

  checkModals(g: GameState): void {
    if (g.pendingReview >= 0) {
      const idx = g.reviews.length - 1;
      this.pushModal({ key: `review:${idx}:engine`, kind: 'review', idx, engine: true });
    }
    if (g.wld.ceremonyDue) this.pushModal({ key: `ceremony:${g.wld.ceremony?.s ?? 0}`, kind: 'ceremony' });
    if (g.nat.ageRecs.length > this.seenAge) {
      for (let i = this.seenAge; i < g.nat.ageRecs.length; i++) this.pushModal({ key: `age:${i}`, kind: 'age', rec: g.nat.ageRecs[i] });
      this.seenAge = g.nat.ageRecs.length;
    } else if (g.nat.ageRecs.length < this.seenAge) this.seenAge = g.nat.ageRecs.length;
    if (g.nat.stage !== this.seenStage) {
      const rank = { none: 0, prelim: 1, called: 2, starter: 3 };
      if (rank[g.nat.stage] > rank[this.seenStage] && g.nat.stage !== 'none') this.pushModal({ key: `squad:${g.week}:${g.nat.stage}`, kind: 'squad', stage: g.nat.stage });
      this.seenStage = g.nat.stage;
    }
  }

  openReviewAt(i: number): void {
    this.pushModal({ key: `review:${i}:manual`, kind: 'review', idx: i, engine: false });
  }

  closeReview(): void {
    this.closeActive();
  }

  closeCeremony(): void {
    this.closeActive();
  }

  pullCues(): void {
    const g = this.game;
    if (!g || !g.cues.length) return;
    if (this.prefs.music) for (const c of new Set(g.cues)) sfx(c);
    g.cues.length = 0;
  }

  pullToasts(): void {
    const g = this.game;
    if (!g) return;
    const fresh = g.toasts.filter((t) => t.id > this.seenToast);
    if (!fresh.length) return;
    this.seenToast = fresh[fresh.length - 1].id;
    for (const t of fresh) {
      this.toasts = [...this.toasts.slice(-2), t];
    }
    g.toasts.length = 0;
  }

  togglePlay(): void {
    const g = this.game;
    if (!g || g.ended) return;
    if (g.decision) return;
    cancelSkip(this.ps);
    this.playing = !this.playing;
    click();
  }

  setSpeed(v: number): void {
    cancelSkip(this.ps);
    this.speed = v;
    this.prefs.speed = v;
    savePrefs(this.prefs);
    this.toast(`${v}× 속도로 흘러가요`);
  }

  stepSpeed(dir: number): void {
    const list = [1, 2, 4, 8, 12, 16];
    const i = Math.max(0, Math.min(list.length - 1, list.indexOf(this.speed) + dir));
    this.setSpeed(list[i]);
  }

  skipToDecision(): void {
    const g = this.game;
    if (!g || g.decision || g.ended) return;
    if (cancelSkip(this.ps)) {
      this.last = performance.now();
      click();
      return;
    }
    beginSkip(this.ps);
    this.last = performance.now();
    click();
  }

  focusLogForToast(t: Toast): void {
    const g = this.game;
    if (!g) return;
    const same = g.log.filter((e) => e.w === t.w);
    const key = t.text.replace(/\s+/g, '').slice(0, 8);
    const hit = same.find((e) => (e.title + e.text).replace(/\s+/g, '').includes(key)) ?? same[same.length - 1] ?? g.log[g.log.length - 1];
    if (!hit) return;
    this.panel = '';
    this.logFocus = hit.id;
  }

  openTutorial(): void {
    this.tutorialResume = this.ps.playing;
    this.ps.playing = false;
    cancelSkip(this.ps);
    this.tutorialOpen = true;
  }

  closeTutorial(): void {
    this.tutorialOpen = false;
    if (!this.prefs.tutorialSeen) {
      this.prefs.tutorialSeen = true;
      savePrefs(this.prefs);
    }
    const g = this.game;
    if (this.tutorialResume && g && !g.decision) this.ps.playing = true;
    this.tutorialResume = false;
  }

  dismissToast(id: number): void {
    this.toasts = this.toasts.filter((x) => x.id !== id);
  }

  toast(text: string): void {
    const t: Toast = { id: Date.now() + Math.random(), w: 0, text, chips: [] };
    this.toasts = [...this.toasts.slice(-2), t];
  }

  choose(idx: number, demands = ''): void {
    const g = this.game;
    if (!g || !g.decision) return;
    const r = resolveDecision(g, idx, demands);
    this.showResult(r);
    settle(this.ps, g, this.activeModal !== null, true);
    chime();
    this.pullToasts();
    this.pullCues();
    this.epiSpeed(g);
    this.notify();
    this.saveNow();
  }

  epiSpeed(g: GameState): void {
    if (g.phase === 'postcareer' && isEpiPath(g.post.path) && this.epiSpeedFor !== g.post.path) {
      this.epiSpeedFor = g.post.path;
      this.speed = 4;
      this.toast('에필로그 진로라 기본 배속을 4×로 맞췄어요');
    }
  }

  private resultTimer: number | null = null;

  showResult(r: ResultPanel | null): void {
    this.result = r;
    if (this.resultTimer !== null) window.clearTimeout(this.resultTimer);
    if (r) this.resultTimer = window.setTimeout(() => { this.result = null; }, 9000);
  }

  dismissResult(): void {
    this.result = null;
  }

  setFocus(id: string): void {
    const g = this.game;
    if (!g) return;
    if (g.auto) {
      g.auto = false;
      pushInput(g, { t: 'auto', a: '', b: 0, c: '' });
      this.toast('직접 정하기로 했어요');
    }
    setFocusInput(g, id);
    this.notify();
  }

  cycleFocus(list: string[]): void {
    const g = this.game;
    if (!g) return;
    const i = list.indexOf(g.focus);
    this.setFocus(list[(i + 1) % list.length]);
  }

  act(id: string, amount = 0): ResultPanel | null {
    const g = this.game;
    if (!g) return null;
    const p = actionInput(g, id, amount);
    if (p) {
      this.showResult(p);
      chime();
    }
    this.pullToasts();
    this.pullCues();
    this.notify();
    return p;
  }

  toggleAuto(): void {
    const g = this.game;
    if (!g) return;
    cancelSkip(this.ps);
    g.auto = !g.auto;
    pushInput(g, { t: 'auto', a: '', b: g.auto ? 1 : 0, c: '' });
    this.toast(g.auto ? '자동 결정을 켰어요' : '자동 결정을 껐어요');
    if (g.auto && g.decision) autoStep(g);
    this.notify();
  }

  saveNow(): void {
    const g = this.game;
    if (!g) return;
    this.lastSave = performance.now();
    const ok = saveGame(g);
    this.saveFailed = !ok;
    if (ok) {
      this.hasSaved = true;
      this.savedAt = Date.now();
    } else if (!this.banner) {
      this.banner = '저장 공간을 사용할 수 없어요. 지금 내보내 두세요.';
      this.bannerExport = true;
    }
  }

  refreshSaved(): void {
    this.hasSaved = hasSave();
    const r = loadGame();
    this.legacy = r.kind === 'legacy' ? { raw: r.raw, reason: r.reason } : null;
  }

  loadSaved(): boolean {
    const r = loadGame();
    if (r.kind === 'legacy') {
      this.legacy = { raw: r.raw, reason: r.reason };
      return false;
    }
    if (r.kind !== 'ok') return false;
    this.begin(r.state, null);
    return true;
  }

  exportText(): string {
    return this.game ? exportSave(this.game) : '';
  }

  importText(text: string): string {
    const r = importSave(text);
    if (r.kind === 'ok') {
      this.begin(r.state, null);
      return '';
    }
    if (r.kind === 'legacy') {
      this.legacy = { raw: r.raw, reason: r.reason };
      return `${r.reason}. 내보내기만 할 수 있어요.`;
    }
    return '저장 파일을 읽을 수 없어요';
  }

  downloadText(text: string, name: string): void {
    const blob = new Blob([text], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  exportNow(): void {
    if (this.end) {
      this.downloadText(JSON.stringify({ app: 'born-to-play-archive', data: this.end }), `태어난김에축구_${this.end.name}.json`);
    } else if (this.game) {
      this.downloadText(this.exportText(), `태어난김에축구_${this.game.p.name}.json`);
    }
  }

  grade(): { grade: string; percentile: number } {
    const g = this.game;
    if (!g) return { grade: '-', percentile: 0 };
    return playerGrade(g, this.baseline);
  }

  coachGradeText(): string {
    const g = this.game;
    if (!g || !g.coach.entered || g.coach.recs.length === 0) return '';
    return coachGrade(g.coach.peakFame);
  }

  finish(): void {
    const g = this.game;
    if (!g) return;
    endSkip(this.ps, 'ended');
    this.clearModals();
    const pg = this.grade();
    const data = buildEndData(g, pg.grade, pg.percentile, this.baseline);
    this.end = data;
    this.screen = 'end';
    if (!this.archived) {
      this.archived = true;
      const entry: ArchiveEntry = {
        id: g.cfg.seed + ':' + g.p.birth.m + g.p.birth.d + ':' + g.week,
        version: ARCHIVE_VERSION,
        savedAt: Date.now(),
        name: g.p.name,
        country: g.p.country,
        birthYear: g.p.birth.y,
        startClub: getClub(g.p.startClubId).name,
        playerGrade: pg.grade,
        coachGrade: this.coachGradeText(),
        summary: `${g.career.seasons.length}시즌 · ${formatKRW(netWorth(g))}`,
        code: this.fateCode(),
        data
      };
      const r = pushArchive(entry);
      this.archiveFail = !r.ok;
    }
    clearSave();
    this.hasSaved = false;
  }

  showEntry(e: ArchiveEntry): void {
    this.end = e.data;
    this.baseline = e.data.baseline;
    this.archived = true;
    this.archiveFail = false;
    this.screen = 'end';
  }

  exportEntryText(e: ArchiveEntry): string {
    return exportEntry(e);
  }

  fateCode(): string {
    const g = this.game;
    if (!g) return '';
    return g.cfg.seed;
  }

  percentile(score: number): number {
    return percentileOf(score, this.baseline);
  }

  quitToMenu(): void {
    this.saveNow();
    endSkip(this.ps, 'ended');
    this.screen = 'menu';
  }

  seasonSw(): number {
    return this.game ? swOf(this.game.week) : 0;
  }
}

export const store = new Store();
export type { Decision };
