import { Rng } from './rng';
import { getClub } from './data';
import { addLog } from './log';
import { seasonOf } from './time';
import { buildClubPeople, setupClubSeason } from './transfer';
import { changeYouthClub } from './yleague';
import { scholarWage } from './youth';
import { STAGE_LABEL } from './stages';
import type { GameState } from './types';

export function moveYouthTo(s: GameState, rng: Rng, id: string, text: string, scholarship: boolean): void {
  const cs = getClub(id);
  s.career.clubsHist[s.career.clubsHist.length - 1].toS = seasonOf(s.week);
  s.career.clubId = id;
  s.career.clubsHist.push({ clubId: id, fromS: seasonOf(s.week), toS: -1 });
  if (s.career.contract) s.career.contract.clubId = id;
  buildClubPeople(s, rng, id, false);
  setupClubSeason(s, id, true);
  if (s.phase === 'youth') changeYouthClub(s);
  s.career.cur.clubId = id;
  s.career.cur.clubName = cs.name;
  s.p.dorm = true;
  s.fin.housing = 'dorm';
  if (scholarship) s.career.scholar = 1;
  if (s.career.scholar === 1 && s.career.contract) s.career.contract.wage = scholarWage(s, false);
  addLog(s, 'milestone', '유스 이적', text || `${cs.name} ${STAGE_LABEL[s.career.youthStage]} 팀으로 옮겼다.`, [], { star: true });
}
