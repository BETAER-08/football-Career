import { registerAction } from './actions';
import { clamp } from './rng';
import { addLog, toast } from './log';
import { priceF } from './finance';
import { yearOf } from './time';
import { retirePlayer, endGame } from './lifecycle';
import { canStudy, startStudy, resignCoach } from './coach';
import { setPath, type PathId } from './postcareer';
import { getClub, getCountry } from './data';
import { makePerson, randomPos } from './relations';
import { ROLE_VAL } from './transfer';
import type { GameState, Role } from './types';

function pay(s: GameState, amount: number): void {
  const fromCash = Math.min(s.fin.cash, amount);
  s.fin.cash -= fromCash;
  s.fin.deposit = Math.max(0, s.fin.deposit - (amount - fromCash));
}

registerAction('deposit', (s, _c, amt, _g, eff) => {
  const fee = Math.round(amt * (1 - eff) * 0.1);
  s.fin.cash -= amt;
  s.fin.deposit += amt - fee;
  return fee > 0 ? [{ k: '예금', d: amt - fee, u: '만' }, { k: '반복 거래 수수료', d: -fee, u: '만' }] : [{ k: '예금', d: amt, u: '만' }];
});
registerAction('stock', (s, _c, amt, _g, eff) => {
  const fee = Math.round(amt * (1 - eff) * 0.1);
  s.fin.cash -= amt;
  s.fin.stocks += amt - fee;
  return fee > 0 ? [{ k: '주식', d: amt - fee, u: '만' }, { k: '반복 거래 수수료', d: -fee, u: '만' }] : [{ k: '주식', d: amt, u: '만' }];
});
registerAction('estate', (s, _c, amt) => {
  s.fin.cash -= amt;
  s.fin.realEstate += Math.round(amt * 0.97);
  return [{ k: '부동산', d: Math.round(amt * 0.97), u: '만' }];
});
registerAction('business', (s, _c, amt, grade) => {
  s.fin.cash -= amt;
  const mult = grade === 'great' ? 2.6 : grade === 'ok' ? 1.35 : grade === 'bad' ? 0.45 : 0.04;
  const v = Math.round(amt * mult);
  s.fin.business += v;
  return [{ k: '사업 지분', d: v, u: '만' }, { k: '투자 원금', d: -amt, u: '만' }];
});
registerAction('buyHome', (s) => {
  const cost = Math.round(15000 * priceF(s.p.country));
  pay(s, cost);
  s.fin.housing = 'own';
  s.fin.realEstate += Math.round(cost * 0.9);
  s.fin.livingTier = Math.max(s.fin.livingTier, 3);
  return [{ k: '부동산', d: Math.round(cost * 0.9), u: '만' }];
});
registerAction('rentHome', (s) => {
  s.fin.housing = 'rent';
});
registerAction('buyCar', (s) => {
  s.fin.car = Math.min(3, s.fin.car + 1);
});
registerAction('parentsHouse', (s) => {
  s.fin.parentsHouse = true;
  s.fin.realEstate += Math.round(10000 * priceF(s.p.country) * 0.9);
});
registerAction('supportFamily', (s) => {
  const wage = s.career.contract ? s.career.contract.wage : s.coach.contract ? s.coach.contract.wage : 1500;
  s.fin.familySupport = Math.max(600, Math.round(wage * 0.12));
});
registerAction('stopSupport', (s) => {
  s.fin.familySupport = 0;
});
registerAction('donate', (s, _c, amt) => {
  s.fin.cash -= amt;
  s.fame.dom = clamp(s.fame.dom + Math.min(2, amt / 6000), 0, 100);
  s.st.happy = clamp(s.st.happy + 3, 0, 100);
  if (s.people.fans) s.people.fans.rel = clamp(s.people.fans.rel + 3, -100, 100);
  return [{ k: '기부', d: -amt, u: '만' }];
});
registerAction('stadium', (s) => {
  s.fin.stadium = true;
  s.fame.dom = clamp(s.fame.dom + 3, 0, 100);
  s.fame.abroad = clamp(s.fame.abroad + 1, 0, 100);
  if (s.people.fans) s.people.fans.rel = clamp(s.people.fans.rel + 8, -100, 100);
});
registerAction('foundation', (s) => {
  s.fin.foundation = 1;
  s.fame.dom = clamp(s.fame.dom + 2, 0, 100);
  s.post.rep = clamp(s.post.rep + 3, 0, 100);
});
registerAction('luxury', (s, _c, _a, grade) => {
  s.st.happy = clamp(s.st.happy + 10, 0, 100);
  if (grade === 'bad' || grade === 'worst') {
    s.hid.pro = clamp(s.hid.pro - 3, 0, 100);
    s.st.stress = clamp(s.st.stress + 4, 0, 100);
    s.st.sleep = clamp(s.st.sleep - 4, 0, 100);
  }
});
registerAction('hireTrainer', (s) => { s.fin.trainer = 1; });
registerAction('dismissTrainer', (s) => { s.fin.trainer = 0; });
registerAction('hireNutri', (s) => { s.fin.nutritionist = 1; s.st.diet = clamp(s.st.diet + 8, 0, 100); });
registerAction('hirePsych', (s) => { s.fin.psychCoach = 1; s.st.stress = clamp(s.st.stress - 6, 0, 100); });
registerAction('camp', (s, _c, _a, grade) => {
  const g = grade === 'great' ? 0.35 : grade === 'ok' ? 0.22 : 0.08;
  const keys = (['shooting', 'passing', 'dribbling', 'pace', 'stamina', 'strength', 'composure', 'positioning'] as const);
  for (const k of keys) s.ab.a[k] = clamp(s.ab.a[k] + g * 0.5, 1, 20);
  s.st.fatigue = clamp(s.st.fatigue + (grade === 'bad' || grade === 'worst' ? 28 : 18), 0, 100);
});
registerAction('roleUp', (s, _c, _a, grade) => {
  const c = s.career.contract;
  if (!c) return;
  if (grade === 'great' || grade === 'ok') {
    const roles: Role[] = ['backup', 'prospect', 'rotation', 'starter'];
    c.role = roles[Math.min(3, ROLE_VAL[c.role] + 1)];
    if (s.people.coach) s.people.coach.rel = clamp(s.people.coach.rel + 3, -100, 100);
  }
});
registerAction('transferReq', (s) => {
  s.ev.flags.transfer_request = s.week;
  if (s.people.coach) s.people.coach.rel = clamp(s.people.coach.rel - 10, -100, 100);
  if (s.people.fans) s.people.fans.rel = clamp(s.people.fans.rel - 6, -100, 100);
});
registerAction('renewReq', (s, _c, _a, grade) => {
  const c = s.career.contract;
  if (!c) return;
  if (grade === 'great') { c.wage = Math.round(c.wage * 1.25); c.endW += 104; }
  else if (grade === 'ok') { c.wage = Math.round(c.wage * 1.1); c.endW += 52; }
});
registerAction('posChange', (s, _c, _a, grade) => {
  if (grade !== 'great' && grade !== 'ok') return;
  let best: string | null = null;
  let bv = 0;
  for (const [k, v] of Object.entries(s.ab.sec)) if ((v ?? 0) > bv) { bv = v ?? 0; best = k; }
  if (!best) return;
  const old = s.ab.pos;
  s.ab.sec[old] = 70;
  delete s.ab.sec[best as import('./types').Pos];
  s.ab.pos = best as import('./types').Pos;
  addLog(s, 'milestone', '포지션 변경', `주 포지션이 ${old}에서 ${best}(으)로 바뀌었다.`, []);
});
registerAction('declineNat', (s) => { s.ev.flags.nat_ignore = s.week; });
registerAction('coachLicense', (s) => {
  const st = canStudy(s);
  if (st.ok && st.key) startStudy(s, st.key);
});
registerAction('retire', (s, { rng }) => {
  retirePlayer(s, rng, '선수 생활을 마치기로 스스로 결정했다.');
});
registerAction('requestSigning', (s, { rng }, _a, grade) => {
  if (grade !== 'great' && grade !== 'ok') return;
  const id = s.coach.clubId;
  if (!id) return;
  const base = s.coach.squad.length ? Math.max(...s.coach.squad.map((p) => p.ovr)) : 60;
  const p = makePerson(rng, s.ev, 'player', getClub(id).country, { age: rng.int(21, 29), refYear: yearOf(s.week), job: '신입 선수', rel: 10, pos: randomPos(rng), ovr: Math.round(base + (grade === 'great' ? 5 : 2)), clubId: id });
  p.pot = p.ovr + 3;
  s.coach.squad.push(p);
  if (s.coach.squad.length > 14) s.coach.squad.shift();
  toast(s, `${p.name} 영입`);
});
registerAction('promoteYouth', (s, { rng }, _a, grade) => {
  const id = s.coach.clubId;
  if (!id || (grade !== 'great' && grade !== 'ok')) return;
  const base = s.coach.squad.length ? s.coach.squad.reduce((a, p) => a + p.ovr, 0) / s.coach.squad.length : 55;
  const p = makePerson(rng, s.ev, 'player', getClub(id).country, { age: rng.int(17, 20), refYear: yearOf(s.week), job: '유스 출신', rel: 15, pos: randomPos(rng), ovr: Math.round(base - 8), clubId: id });
  p.pot = Math.round(base + 6 + (grade === 'great' ? 6 : 0));
  s.coach.squad.push(p);
});
registerAction('changeTactic', (s, _c, _a, grade) => {
  const d = grade === 'great' ? 9 : grade === 'ok' ? 4 : grade === 'bad' ? -6 : -12;
  s.coach.standing = clamp(s.coach.standing + d, 0, 100);
});
registerAction('resign', (s, { rng }) => {
  resignCoach(s, rng);
});
registerAction('coachRetire', (s) => {
  endGame(s, '지도자 은퇴를 선언했다. 긴 축구 인생이 막을 내린다.');
});
registerAction('leaveFootball', (s) => {
  endGame(s, '축구계를 떠나기로 했다.');
});
function switchTo(s: GameState, rng: import('./rng').Rng, p: PathId): void {
  if (s.phase === 'coach' && s.coach.role !== 'none') resignCoach(s, rng);
  setPath(s, rng, p);
}
registerAction('toPundit', (s, { rng }) => switchTo(s, rng, 'pundit'));
registerAction('toAdmin', (s, { rng }) => switchTo(s, rng, 'admin'));
registerAction('toBusiness', (s, { rng }) => switchTo(s, rng, 'business'));
registerAction('toCoach', (s, { rng }) => switchTo(s, rng, 'coach'));
registerAction('studyLang', (s) => {
  const id = s.career.clubId || s.coach.clubId;
  const code = id ? getClub(id).country : s.p.country;
  const lang = code !== s.p.country ? getCountry(code).lang : '영어';
  s.life.lang[lang] = clamp((s.life.lang[lang] ?? 0) + 9, 0, 100);
  if (s.phase === 'coach') s.coach.skills.language = clamp(s.coach.skills.language + 3, 0, 100);
  return [{ k: `${lang} 숙련`, d: 9 }];
});
registerAction('enroll', (s) => {
  s.life.studying = true;
});
registerAction('quitHabit', (s, _c, _a, grade) => {
  if (grade === 'great' || grade === 'ok') {
    s.st.drink = 0;
    s.st.smoker = false;
  }
});
registerAction('checkup', (s) => {
  for (const k of Object.keys(s.st.chronic)) s.st.chronic[k] = Math.max(0, s.st.chronic[k] - 0.5);
});
