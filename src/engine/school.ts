import { SCHOOLS, schoolsOf, type SchoolKind } from '../data/schools';
import { Rng, clamp } from './rng';
import { curOvr } from './attributes';
import { getClub, getLeague, leaguesOf } from './data';
import { addLog } from './log';
import { getCal } from './calibration';
import { ageAt, seasonOf } from './time';
import { emptyRec } from './records';
import { buildClubPeople, fallbackOffer, genOffers, makeOfferFor } from './transfer';
import { presentOffers } from './offers';
import { fireEvent, getEvent } from './events';
import { changeYouthClub } from './yleague';
import { isSchoolStage } from './stages';
import { clubLvl } from './world';
import type { GameState, Offer } from './types';
import { josa } from './josa';

export function hasSchoolPath(country: string, kind: SchoolKind): boolean {
  return country === 'US' ? kind === 'UNI' : country === 'KR' || country === 'JP' ? true : false;
}

export function schoolInfo(id: string) {
  return SCHOOLS.find((x) => x.id === id);
}

export function pickSchool(s: GameState, rng: Rng, kind: SchoolKind, country: string): string {
  const list = schoolsOf(country, kind).slice().sort((a, b) => b.st0 - a.st0);
  const ovr = curOvr(s.ab);
  const score = ovr + 0.3 * (s.ab.pot - ovr) + s.fame.dom / 10;
  const p = clamp((score - 38) / 22, 0, 1);
  const idx = clamp(Math.round((1 - p) * (list.length - 1) + rng.normal(0, list.length * 0.12)), 0, list.length - 1);
  return list[idx].id;
}

export function enterSchool(s: GameState, rng: Rng, kind: SchoolKind): void {
  const country = s.career.clubId && !s.career.clubId.includes(':S:') ? getClub(s.career.clubId).country : s.p.country;
  if (!hasSchoolPath(country, kind)) return;
  const id = pickSchool(s, rng, kind, country);
  const sch = getClub(id);
  const season = seasonOf(s.week);
  if (s.career.clubId) s.career.clubsHist[s.career.clubsHist.length - 1].toS = season;
  s.career.clubId = id;
  s.ev.flags.schoolEntered = s.week;
  s.career.contract = null;
  s.career.track = 'school';
  s.career.youthStage = kind;
  s.career.stageSeasons = 0;
  s.career.scholar = 0;
  s.career.freeAgentW = -1;
  s.career.clubsHist.push({ clubId: id, fromS: season, toS: -1 });
  s.career.cur = emptyRec(season, id, sch.name, '', '', 2);
  s.career.fixtures.length = 0;
  buildClubPeople(s, rng, id, false);
  s.people.coach.job = kind === 'HS' ? '고교 감독' : '대학 감독';
  if (kind === 'UNI') {
    s.life.studying = true;
    s.life.eduLevel = Math.max(s.life.eduLevel, 2);
  }
  changeYouthClub(s);
  const info = schoolInfo(id);
  addLog(s, 'milestone', kind === 'HS' ? '고교 축구부 입단' : '대학 축구부 입단', `${sch.name} ${kind === 'HS' ? '축구부' : '축구부'}에 들어갔다.${info && info.tier === 0 ? ' 전국에서 손꼽히는 명문이다.' : ''}`, [], { star: true });
}

function judgeScore(s: GameState, rng: Rng): number {
  const ovr = curOvr(s.ab);
  const cur = s.career.yCur;
  const avg = cur.ratingN >= 5 ? cur.ratingSum / cur.ratingN : 6.3;
  const info = schoolInfo(s.career.clubId);
  const tierBonus = info ? (info.tier === 0 ? 2 : info.tier === 1 ? 0 : -2) : 0;
  const trophies = s.career.yTrophies.filter((t) => t.club === getClub(s.career.clubId).name).length;
  return ovr + 0.4 * (s.ab.pot - ovr) + getCal().youthBoost + rng.normal(0, 2.5) + tierBonus + trophies * 1.2 + (avg - 6.3) * 2 + s.fame.dom / 20 + s.nat.youthCaps * 0.4;
}

function offersFor(s: GameState, rng: Rng): Offer[] {
  let offers = genOffers(s, rng, 'first', rng.int(1, 3));
  if (!offers.length) {
    const fb = fallbackOffer(s, rng, 'first');
    if (fb) { fb.trial = false; offers = [fb]; }
  }
  return offers;
}

function draftOffers(s: GameState, rng: Rng, pick: number): Offer[] {
  const top = leaguesOf('US')[0];
  const ids = top.clubIds;
  const offers: Offer[] = [];
  const o = makeOfferFor(s, rng, ids[(pick - 1) % ids.length], 'first', { first: true });
  if (o) offers.push(o);
  if (!offers.length) {
    const fb = fallbackOffer(s, rng, 'first');
    if (fb) { fb.trial = false; offers.push(fb); }
  }
  return offers;
}

export function schoolSeasonEnd(s: GameState, rng: Rng): void {
  const stage = s.career.youthStage;
  if (!isSchoolStage(stage) || s.career.retired) return;
  const age = ageAt(s.p.birth, s.week);
  const country = getClub(s.career.clubId).country;
  s.career.stageSeasons += 1;
  if (stage === 'HS') {
    if (age < 18) return;
    s.life.eduLevel = Math.max(s.life.eduLevel, 1);
    const pass = judgeScore(s, rng) >= 60;
    if (pass) {
      addLog(s, 'milestone', '프로 입단 제안', `${getClub(s.career.clubId).name} 졸업을 앞두고 프로 구단들이 입단을 제안했다.`, [], { star: true });
      presentOffers(s, offersFor(s, rng), 'first', '프로 입단 제안', '고교 졸업과 함께 프로 입단 제안이 도착했다.', s.career.rejectCount < 2);
    } else if (hasSchoolPath(country, 'UNI')) fireEvent(s, rng, getEvent('ys_after_hs'));
    else fireEvent(s, rng, getEvent('ys_after_uni'));
    return;
  }
  if (age >= 22) {
    s.life.eduLevel = Math.max(s.life.eduLevel, 3);
    s.life.studying = false;
  }
  if (age < 20) return;
  const score = judgeScore(s, rng);
  if (age >= 22 || (age >= 21 && country === 'US')) {
    if (score >= 60) {
      if (country === 'US') {
        const pick = clamp(Math.round(1 + (score - 60) * -1.6 + 18 + rng.normal(0, 5)), 1, 60);
        fireEvent(s, rng, getEvent('ys_draft_day'));
        addLog(s, 'milestone', 'MLS 슈퍼드래프트', `${pick}순위로 지명됐다.`, [], { star: true });
        presentOffers(s, draftOffers(s, rng, pick), 'first', 'MLS 슈퍼드래프트', `${pick}순위 지명을 받았다. 입단 제안이 도착했다.`, true);
      } else presentOffers(s, offersFor(s, rng), 'first', '프로 입단 제안', '대학 졸업과 함께 프로 입단 제안이 도착했다.', true);
    } else if (country === 'US') fireEvent(s, rng, getEvent('ys_undrafted'));
    else fireEvent(s, rng, getEvent('ys_after_uni'));
    return;
  }
  if (score >= 64 && rng.chance(0.5)) {
    fireEvent(s, rng, getEvent('ys_college_dropout'));
    presentOffers(s, offersFor(s, rng), 'first', '프로 입단 제안', '재학 중 프로 구단이 입단을 제안했다.', true);
  }
}

export function dualRegister(s: GameState, rng: Rng): void {
  const top = leaguesOf('JP')[0];
  const id = rng.pick(top.clubIds);
  const club = getClub(id);
  const season = seasonOf(s.week);
  const rec = emptyRec(season, id, club.name, top.id, getLeague(top.id).ko, clubLvl(s, id));
  const apps = rng.int(1, 3);
  rec.apps = apps;
  rec.avail = apps;
  rec.mins = rng.int(12, 40) * apps;
  rec.ratingN = apps;
  rec.ratingSum = apps * clamp(6 + rng.normal(0, 0.5), 5, 7.5);
  rec.goals = rng.chance(0.12) ? 1 : 0;
  rec.done = true;
  s.career.seasons.push(rec);
  if (!s.career.debuted) {
    s.career.debuted = true;
    s.career.debutW = s.week;
    s.ev.flags.pro_debut = s.week;
  }
  s.fame.dom = clamp(s.fame.dom + 1.2, 0, 100);
  addLog(s, 'milestone', '2종 등록 J리그 출전', `${josa(s.p.name, '이')} ${club.name} 1군 경기에 2종 등록 선수로 나섰다. 1군 데뷔로 기록된다.`, [], { star: true });
}
