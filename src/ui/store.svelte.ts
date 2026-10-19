import { newGame, tickState, resolveDecision, setFocusInput, actionInput, autoStep, autoWeek, pushInput } from '../engine/game';
import { ensureContent } from '../engine/content';
import { secPerYear, swOf } from '../engine/time';
import { defaultFocus } from '../engine/lifestyle';
import { playerGrade, coachGrade, percentileOf } from '../engine/scoring';
import type { Decision, GameConfig, GameState, ResultPanel, Toast } from '../engine/types';
import type { RouletteResult } from '../engine/roulette';
import { clearSave, exportSave, hasSave, importSave, loadGame, loadPrefs, pushArchive, saveGame, savePrefs, type Prefs } from './save';
import { setMusic, chime, click } from './audio';
import { getClub } from '../engine/data';
import { formatKRW } from '../engine/finance';
import { netWorth } from '../engine/finance';
import BaselineWorker from './baseline.worker?worker';

export type Screen = 'menu' | 'setup' | 'roulette' | 'card' | 'game' | 'end' | 'vault';

class Store {
  screen = $state<Screen>('menu');
  game = $state.raw<GameState | null>(null);
  origin = $state.raw<RouletteResult | null>(null);
  prefs = $state<Prefs>(loadPrefs());
  playing = $state(false);
  speed = $state(1);
  toasts = $state<Toast[]>([]);
  banner = $state('');
  result = $state.raw<ResultPanel | null>(null);
  panel = $state<'' | 'money' | 'career' | 'life' | 'log' | 'info' | 'saves'>('');
  pendingConfig = $state.raw<GameConfig | null>(null);
  relSnap = $state.raw<Record<string, number>>({});
  private relSnapWeek = -99;
  baseline = $state.raw<number[]>([]);
  baselineProgress = $state(0);
  skipping = $state(false);
  hasSaved = $state(hasSave());
  archived = $state(false);
  private acc = 0;
  private last = 0;
  private timer: number | null = null;
  private lastSave = 0;
  private seenToast = 0;
  private worker: Worker | null = null;

  constructor() {
    ensureContent();
    this.speed = this.prefs.speed;
    this.applyTheme();
  }

  applyTheme(): void {
    document.documentElement.dataset.theme = this.prefs.theme;
  }

  toggleTheme(): void {
    this.prefs.theme = this.prefs.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme();
    savePrefs(this.prefs);
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
    if (this.game) this.game = { ...this.game };
  }

  begin(state: GameState, origin: RouletteResult | null): void {
    this.game = state;
    this.origin = origin;
    this.result = null;
    this.toasts = [];
    this.seenToast = 0;
    this.archived = false;
    this.playing = true;
    this.skipping = false;
    this.screen = 'game';
    this.startBaseline();
    this.startLoop();
    this.saveNow();
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
    const post = g.phase === 'postcareer' ? 2 : 1;
    return base / this.speed / post;
  }

  frame(): void {
    const now = performance.now();
    const dt = Math.min(250, now - this.last);
    this.last = now;
    const g = this.game;
    if (!g || this.screen !== 'game') return;
    if (g.ended) {
      this.playing = false;
      this.finish();
      return;
    }
    if (g.decision && g.auto) {
      autoStep(g);
      this.notify();
    }
    if (g.decision || (!this.playing && !this.skipping)) return;
    this.acc += this.skipping ? 1e9 : dt;
    let n = 0;
    const phase = g.phase;
    const limit = this.skipping ? 150 : 40;
    const wms = this.weekMs();
    while ((this.skipping || this.acc >= wms) && n < limit) {
      if (!this.skipping) this.acc -= wms;
      if (g.auto) autoWeek(g);
      if (!tickState(g)) break;
      n++;
      if (g.auto && g.decision) autoStep(g);
      if (g.decision || g.ended || g.phase !== phase) {
        this.skipping = false;
        if (g.decision) this.playing = false;
        break;
      }
    }
    if (this.skipping && n >= limit) this.acc = 0;
    if (n > 0) {
      this.snapRel();
      this.pullToasts();
      this.notify();
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

  pullToasts(): void {
    const g = this.game;
    if (!g) return;
    const fresh = g.toasts.filter((t) => t.id > this.seenToast);
    if (!fresh.length) return;
    this.seenToast = fresh[fresh.length - 1].id;
    for (const t of fresh) {
      this.toasts = [...this.toasts.slice(-3), t];
      window.setTimeout(() => { this.toasts = this.toasts.filter((x) => x.id !== t.id); }, 5200);
    }
    g.toasts.length = 0;
  }

  togglePlay(): void {
    const g = this.game;
    if (!g || g.ended) return;
    if (g.decision) return;
    this.playing = !this.playing;
    this.skipping = false;
    click();
  }

  setSpeed(v: number): void {
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
    this.skipping = true;
    this.playing = true;
    click();
  }

  toast(text: string): void {
    const t: Toast = { id: Date.now() + Math.random(), w: 0, text, chips: [] };
    this.toasts = [...this.toasts.slice(-3), t];
    window.setTimeout(() => { this.toasts = this.toasts.filter((x) => x.id !== t.id); }, 3200);
  }

  choose(idx: number, demands = ''): void {
    const g = this.game;
    if (!g || !g.decision) return;
    const r = resolveDecision(g, idx, demands);
    this.showResult(r);
    if (!g.decision && !g.ended) this.playing = true;
    chime();
    this.pullToasts();
    this.notify();
    this.saveNow();
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
    this.notify();
    return p;
  }

  toggleAuto(): void {
    const g = this.game;
    if (!g) return;
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
    const ok = saveGame({ ...g, log: g.log.slice(-900) });
    if (ok) this.hasSaved = true;
    else if (!this.banner) this.banner = '저장 공간을 사용할 수 없어요. 저장 내보내기를 사용해 주세요.';
  }

  loadSaved(): boolean {
    const g = loadGame();
    if (!g) return false;
    this.begin(g, null);
    return true;
  }

  exportText(): string {
    return this.game ? exportSave(this.game) : '';
  }

  importText(text: string): boolean {
    const g = importSave(text);
    if (!g) return false;
    this.begin(g, null);
    return true;
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
    this.playing = false;
    this.skipping = false;
    this.screen = 'end';
    if (!this.archived) {
      this.archived = true;
      const pg = this.grade();
      pushArchive({
        id: g.cfg.seed + ':' + g.p.birth.m + g.p.birth.d + ':' + g.week,
        savedAt: Date.now(),
        name: g.p.name,
        country: g.p.country,
        birthYear: g.p.birth.y,
        startClub: getClub(g.p.startClubId).name,
        playerGrade: pg.grade,
        coachGrade: this.coachGradeText(),
        summary: `${g.career.seasons.length}시즌 · ${formatKRW(netWorth(g))}`,
        code: this.fateCode(),
        state: JSON.stringify({ ...g, log: g.log.slice(-600) }),
        baseline: [...this.baseline]
      });
    }
    clearSave();
    this.hasSaved = false;
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
    this.playing = false;
    this.skipping = false;
    this.screen = 'menu';
  }

  dayPhase(): number {
    return (performance.now() / 1000 / 30) % 1;
  }

  seasonSw(): number {
    return this.game ? swOf(this.game.week) : 0;
  }
}

export const store = new Store();
export type { Decision };
