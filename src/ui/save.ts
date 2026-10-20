import type { GameState } from '../engine/types';
import { ARCHIVE_VERSION, type EndData } from '../engine/enddata';
import { STATE_VERSION, migrateState } from '../engine/migrate';

const KEY = 'bornToPlay.save.v1';
const ARCHIVE = 'bornToPlay.archive.v1';
const PREF = 'bornToPlay.pref.v1';
const QUOTA_CHARS = 4_200_000;
export const ENTRY_LIMIT = 30_000;

export interface ArchiveEntry {
  id: string;
  version: number;
  savedAt: number;
  name: string;
  country: string;
  birthYear: number;
  startClub: string;
  playerGrade: string;
  coachGrade: string;
  summary: string;
  code: string;
  data: EndData;
}

export interface LegacyEntry {
  id: string;
  savedAt?: number;
  name?: string;
  country?: string;
  birthYear?: number;
  startClub?: string;
  playerGrade?: string;
  coachGrade?: string;
  summary?: string;
  code?: string;
  state?: string;
}

export type AnyEntry = ArchiveEntry | LegacyEntry;

export function isCurrent(e: AnyEntry): e is ArchiveEntry {
  return (e as ArchiveEntry).version === ARCHIVE_VERSION && !!(e as ArchiveEntry).data;
}

export interface Prefs { theme: 'dark' | 'light'; music: boolean; speed: number; lengthMin: 30 | 60 | 90; autoDecide: boolean }

export const defaultPrefs: Prefs = { theme: 'dark', music: false, speed: 1, lengthMin: 60, autoDecide: false };

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREF);
    if (!raw) return { ...defaultPrefs };
    return { ...defaultPrefs, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    return { ...defaultPrefs };
  }
}

export function savePrefs(p: Prefs): void {
  try {
    localStorage.setItem(PREF, JSON.stringify(p));
  } catch {
    return;
  }
}

export function slimState(s: GameState): GameState {
  const keep = s.reviews.length - 6;
  const reviews = s.reviews.map((r, i) => (i < keep ? { ...r, table: [], scorers: [], assisters: [], clubPoy: [] } : r));
  return {
    ...s,
    log: s.log.slice(-900),
    reviews,
    hist: s.hist.slice(-60),
    recent: s.recent.slice(-14),
    wld: { ...s.wld, ballon: s.wld.ballon.slice(-12), tourn: s.wld.tourn.slice(-8), champs: { s: s.wld.champs.s, leagues: s.wld.champs.leagues, cups: {}, cont: s.wld.champs.cont } },
    toasts: [],
    cues: [],
    inputs: s.inputs.slice(-400)
  };
}

export function stateBytes(s: GameState): number {
  return JSON.stringify({ version: STATE_VERSION, state: slimState(s) }).length;
}

export function saveGame(s: GameState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: STATE_VERSION, savedAt: Date.now(), state: slimState(s) }));
    return true;
  } catch {
    return false;
  }
}

export type LoadResult = { kind: 'none' } | { kind: 'ok'; state: GameState } | { kind: 'legacy'; raw: string; reason: string };

function parseSave(raw: string): LoadResult {
  try {
    const obj = JSON.parse(raw) as { version?: number; state?: unknown } | GameState;
    const inner = (obj as { state?: unknown }).state ?? obj;
    const m = migrateState(inner);
    if (m.ok) return { kind: 'ok', state: m.state };
    return { kind: 'legacy', raw, reason: m.reason };
  } catch {
    return { kind: 'legacy', raw, reason: '저장 데이터를 읽을 수 없어요' };
  }
}

export function loadGame(): LoadResult {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { kind: 'none' };
    return parseSave(raw);
  } catch {
    return { kind: 'none' };
  }
}

export function hasSave(): boolean {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    return;
  }
}

export function exportSave(s: GameState): string {
  return JSON.stringify({ app: 'born-to-play', version: STATE_VERSION, state: slimState(s) });
}

export function importSave(text: string): LoadResult {
  return parseSave(text);
}

export function loadArchive(): AnyEntry[] {
  try {
    const raw = localStorage.getItem(ARCHIVE);
    return raw ? (JSON.parse(raw) as AnyEntry[]) : [];
  } catch {
    return [];
  }
}

function otherChars(): number {
  let n = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k !== ARCHIVE) n += k.length + (localStorage.getItem(k) ?? '').length;
    }
  } catch {
    return 0;
  }
  return n;
}

export function trimEntry(e: ArchiveEntry): ArchiveEntry {
  let cur = e;
  let guard = 0;
  while (JSON.stringify(cur).length > ENTRY_LIMIT && guard++ < 120) {
    const d = cur.data;
    if (d.logs.length > 0) cur = { ...cur, data: { ...d, logs: d.logs.slice(Math.max(1, Math.ceil(d.logs.length * 0.15))) } };
    else if (d.baseline.length > 60) cur = { ...cur, data: { ...d, baseline: d.baseline.filter((_, i) => i % 2 === 0) } };
    else break;
  }
  return cur;
}

export interface PushResult { ok: boolean; evicted: number; bytes: number }

export function pushArchive(entry: ArchiveEntry): PushResult {
  const e = trimEntry(entry);
  const text = JSON.stringify(e);
  const list = loadArchive().filter((x) => x.id !== e.id);
  let evicted = 0;
  const base = otherChars();
  while (list.length > 0 && base + JSON.stringify(list).length + text.length > QUOTA_CHARS) {
    list.pop();
    evicted++;
  }
  while (list.length > 49) {
    list.pop();
    evicted++;
  }
  for (;;) {
    try {
      localStorage.setItem(ARCHIVE, JSON.stringify([e, ...list]));
      return { ok: true, evicted, bytes: text.length };
    } catch {
      if (list.length === 0) return { ok: false, evicted, bytes: text.length };
      list.pop();
      evicted++;
    }
  }
}

export function removeArchive(id: string): void {
  try {
    localStorage.setItem(ARCHIVE, JSON.stringify(loadArchive().filter((x) => x.id !== id)));
  } catch {
    return;
  }
}

export function exportEntry(e: AnyEntry): string {
  return JSON.stringify({ app: 'born-to-play-archive', entry: e });
}
