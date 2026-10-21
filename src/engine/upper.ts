import { allCountries, getClub, leaguesOf } from './data';
import { clubLvl, ensureCountry } from './world';
import { hasAcademy } from './yleague';
import { ageAt, seasonOf } from './time';
import { foreignAllowed } from './transfer';
import { hashString } from './rng';
import type { GameState, YouthStage } from './types';

export type UpperMode = 'event' | 'market';

const cache = new Map<string, string[]>();

function stageOk(s: GameState, mode: UpperMode): boolean {
  if (s.phase !== 'youth' || !s.career.clubId || s.career.retired || s.career.track !== 'pro') return false;
  const st: YouthStage = s.career.youthStage;
  const age = ageAt(s.p.birth, s.week);
  if (mode === 'event') return (st === 'U15' || st === 'U17') && age <= 16;
  return st === 'U19' || st === 'RES' || age >= 17;
}

export function upperClubIds(s: GameState, mode: UpperMode, abroad: boolean): string[] {
  if (!stageOk(s, mode)) return [];
  const own = s.career.clubId;
  const ownC = getClub(own);
  const cur = clubLvl(s, own);
  if (mode === 'event' && cur >= 6) return [];
  const stage = s.career.youthStage;
  const key = `${s.cfg.seed}|${seasonOf(s.week)}|${own}|${stage}|${mode}|${abroad ? 1 : 0}|${s.career.scholar}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const age = ageAt(s.p.birth, s.week);
  const codes = abroad ? allCountries().map((c) => c.code).filter((c) => c !== ownC.country && foreignAllowed(s, c, age)) : [ownC.country];
  const out: { id: string; lvl: number; acad: number }[] = [];
  for (const code of codes) {
    ensureCountry(s, code);
    for (const lg of leaguesOf(code)) {
      for (const id of lg.clubIds) {
        if (id === own || !hasAcademy(id, stage === 'RES' ? 'U19' : stage)) continue;
        const c = getClub(id);
        const lvl = clubLvl(s, id);
        const better = lvl > cur || (lvl === cur && c.acad >= ownC.acad + 10) || (mode === 'market' && cur >= 6 && lvl === 6);
        if (better) out.push({ id, lvl, acad: c.acad });
      }
    }
  }
  out.sort((a, b) => b.lvl - a.lvl || b.acad - a.acad || (a.id < b.id ? -1 : 1));
  const ids = out.map((x) => x.id);
  if (cache.size > 400) cache.clear();
  cache.set(key, ids);
  return ids;
}

export function hasUpperClub(s: GameState, abroad: boolean): boolean {
  return upperClubIds(s, 'event', abroad).length > 0;
}

export function upperClubPick(s: GameState, abroad: boolean): string {
  const ids = upperClubIds(s, 'event', abroad);
  if (!ids.length) return '';
  const top = ids.slice(0, Math.min(ids.length, 6));
  return top[hashString(`${s.cfg.seed}|${seasonOf(s.week)}|${s.career.clubId}|${abroad ? 1 : 0}`) % top.length];
}
