import type { GameState } from '../engine/types';

const KEY = 'bornToPlay.save.v1';
const ARCHIVE = 'bornToPlay.archive.v1';
const PREF = 'bornToPlay.pref.v1';

export interface ArchiveEntry {
  id: string;
  savedAt: number;
  name: string;
  country: string;
  birthYear: number;
  startClub: string;
  playerGrade: string;
  coachGrade: string;
  summary: string;
  code: string;
  state: string;
  baseline: number[];
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

export function saveGame(s: GameState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
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
  return JSON.stringify({ app: 'born-to-play', v: 1, state: s });
}

export function importSave(text: string): GameState | null {
  try {
    const obj = JSON.parse(text) as { app?: string; state?: GameState } | GameState;
    const st = (obj as { state?: GameState }).state ?? (obj as GameState);
    if (!st || typeof st !== 'object' || !('p' in st) || !('ab' in st) || !('career' in st)) return null;
    return st;
  } catch {
    return null;
  }
}

export function loadArchive(): ArchiveEntry[] {
  try {
    const raw = localStorage.getItem(ARCHIVE);
    return raw ? (JSON.parse(raw) as ArchiveEntry[]) : [];
  } catch {
    return [];
  }
}

export function pushArchive(e: ArchiveEntry): boolean {
  try {
    const list = loadArchive().filter((x) => x.id !== e.id);
    list.unshift(e);
    while (list.length > 50) list.pop();
    localStorage.setItem(ARCHIVE, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function removeArchive(id: string): void {
  try {
    localStorage.setItem(ARCHIVE, JSON.stringify(loadArchive().filter((x) => x.id !== id)));
  } catch {
    return;
  }
}
