import { coachGrade } from './scoring';
import { DREAM_LABEL } from './goals';
import { dreamAchieved } from './dream';
import { getClub, getLeague } from './data';
import { netWorth } from './finance';
import { MILESTONES, isEpiPath } from './postcareer';
import { START_YEAR } from './time';
import type { AgeRec, AwardRec, CoachRec, GameState, LogEntry, NatMatch, Pos, TrophyRec } from './types';
import { josa } from './josa';

export const ARCHIVE_VERSION = 3;

export type SeasonRow = [number, number, string, string, number, number, number, number, number, number, number, number, number, number, number, number];

export interface EndData {
  version: number;
  name: string;
  en: string;
  country: string;
  birthYear: number;
  startClub: string;
  startClubId: string;
  startLvl: number;
  startLeague: string;
  pos: Pos;
  seed: string;
  cfgName: string;
  endReason: string;
  score: number;
  debuted: boolean;
  grade: string;
  percentile: number;
  coachGrade: string;
  peakFame: number;
  apps: number;
  goals: number;
  assists: number;
  avg: number;
  caps: number;
  natGoals: number;
  netWorth: number;
  peakValue: number;
  feeSum: number;
  feeMax: number;
  trophies: TrophyRec[];
  coachTrophies: TrophyRec[];
  awards: AwardRec[];
  clubs: { name: string; from: number; to: number; hue: number }[];
  clubNames: string[];
  seasons: SeasonRow[];
  coachRecs: CoachRec[];
  logs: LogEntry[];
  baseline: number[];
  dream: { id: string; label: string; achieved: boolean };
  epilogue: { path: string; ms: number; milestones: string[]; years: number; text: string } | null;
  ballons: number;
  podiums?: number;
  ageRecs?: AgeRec[];
  natMatches?: NatMatch[];
  youth?: { apps: number; goals: number; assists: number; avg: number; trophies: TrophyRec[]; awards: AwardRec[]; jumps: number; stage: string };
}

export function epilogueText(s: GameState): EndData['epilogue'] {
  const path = s.post.path;
  const endedPath = s.post.endedBy || path;
  if (!isEpiPath(endedPath)) return null;
  const n = s.post.ms[endedPath] ?? 0;
  const years = Math.round(s.post.epiWeeks / 52);
  const names = MILESTONES[endedPath].slice(0, n);
  const label = { pundit: '해설·방송', admin: '구단 행정', business: '사업' }[endedPath];
  const last = names.length ? names[names.length - 1] : '';
  const text = `${josa(s.p.name, '은')} 은퇴 후 ${label}의 길에서 ${years}년을 보냈다. ${names.length ? `${names.join(', ')}의 이정표를 지나 ${last}에 이르렀다.` : '뚜렷한 이정표를 남기지는 못했지만 자신의 속도로 일상을 지켰다.'} ${n >= 4 ? '네 개의 이정표를 모두 지난 뒤 조용히 축구 인생을 마무리했다.' : '그렇게 축구와 함께한 인생이 천천히 저물었다.'}`;
  return { path: endedPath, ms: n, milestones: names, years, text };
}

function youthSummary(s: GameState): NonNullable<EndData['youth']> {
  let apps = 0, goals = 0, assists = 0, rs = 0, rn = 0;
  const recs = [...s.career.ySeasons, ...(s.career.yCur.done ? [] : [s.career.yCur])];
  for (const r of recs) { apps += r.apps; goals += r.goals; assists += r.assists; rs += r.ratingSum; rn += r.ratingN; }
  return { apps, goals, assists, avg: rn ? rs / rn : 0, trophies: s.career.yTrophies, awards: s.career.yAwards, jumps: s.career.entry.jumps, stage: s.career.youthStage };
}

export function buildEndData(s: GameState, grade: string, percentile: number, baseline: number[]): EndData {
  const all = s.career.seasons;
  let apps = 0, goals = 0, assists = 0, rs = 0, rn = 0;
  for (const r of all) { apps += r.apps; goals += r.goals; assists += r.assists; rs += r.ratingSum; rn += r.ratingN; }
  const seasons: SeasonRow[] = all.map((r) => [r.s, r.year, r.clubName, r.leagueName, r.lvl, r.apps, r.starts, r.goals, r.assists, r.ratingN ? Math.round((r.ratingSum / r.ratingN) * 100) : 0, r.cs, r.yc, r.rc, r.injDays, r.pos, r.clubId ? getClub(r.clubId).color : -1]);
  const clubs = s.career.clubsHist.map((h) => ({ name: getClub(h.clubId).name, from: START_YEAR + h.fromS, to: h.toS >= 0 ? START_YEAR + h.toS : -1, hue: getClub(h.clubId).color }));
  const names: string[] = [];
  for (const c of clubs) if (!names.includes(c.name)) names.push(c.name);
  const keyLogs = s.log.filter((l) => l.star || l.mine).slice(-120).map((l) => ({ id: l.id, w: l.w, kind: l.kind, title: l.title.slice(0, 40), text: l.text.slice(0, 110), chips: [], star: l.star, grade: l.grade, mine: l.mine, dream: l.dream }));
  return {
    version: ARCHIVE_VERSION, name: s.p.name, en: s.p.en, country: s.p.country, birthYear: s.p.birth.y, startClub: getClub(s.p.startClubId).name, startClubId: s.p.startClubId,
    startLvl: s.p.startLvl, startLeague: getLeague(s.p.startLeagueId).ko, pos: s.ab.pos, seed: s.cfg.seed, cfgName: s.cfg.name, endReason: s.endReason, score: s.score,
    debuted: s.career.debuted, grade, percentile, coachGrade: s.coach.entered && s.coach.recs.length ? coachGrade(s.coach.peakFame) : '', peakFame: Math.round(s.coach.peakFame),
    apps, goals, assists, avg: rn ? rs / rn : 0, caps: s.nat.caps, natGoals: s.nat.goals, netWorth: netWorth(s), peakValue: s.fame.peakValue, feeSum: s.career.feeSum, feeMax: s.career.feeMax, trophies: s.career.trophies, coachTrophies: s.coach.trophies,
    awards: s.career.awards, clubs, clubNames: names, seasons, coachRecs: s.coach.recs.map((r) => ({ ...r })), logs: keyLogs, baseline: baseline.map((v) => Math.round(v * 10) / 10),
    dream: { id: s.dream, label: s.dream ? DREAM_LABEL[s.dream] : '', achieved: s.dream ? dreamAchieved(s, s.dream) : false }, epilogue: epilogueText(s), ballons: s.extra.ballon, podiums: s.extra.podium, ageRecs: s.nat.ageRecs, natMatches: s.nat.matches.slice(-60), youth: youthSummary(s)
  };
}
