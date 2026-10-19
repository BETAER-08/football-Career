import type { GameState, Phase } from './types';
import { clamp } from './rng';
import { ageAt } from './time';

export interface FocusDef {
  id: string;
  label: string;
  effects: string;
  tech: number;
  phys: number;
  mental: number;
  growth: number;
  fatigue: number;
  hazard: number;
}

const F = (id: string, label: string, effects: string, tech: number, phys: number, mental: number, growth: number, fatigue: number, hazard: number): FocusDef => ({ id, label, effects, tech, phys, mental, growth, fatigue, hazard });

export const FOCUS_PLAYER: FocusDef[] = [
  F('tech', '기술 훈련', '기술↑ 피로↑', 1.38, 1, 1, 1, 0.9, 1),
  F('phys', '피지컬', '신체↑ 부상 위험↑', 1, 1.38, 1, 1, 1.2, 1.2),
  F('recover', '회복·관리', '부상 위험↓ 성장 조금↓', 1, 1, 1, 0.92, -3.4, 0.76),
  F('tactic', '전술 공부', '정신↑ 감독 관계↑', 1, 1, 1.35, 1, 0.2, 1),
  F('study', '학업', '학력↑ 성장↓', 0.9, 0.9, 1, 0.86, -0.5, 0.95),
  F('family', '가족', '가족 관계↑ 행복↑', 1, 1, 1, 0.96, -1, 0.95),
  F('social', '연애·사교', '관계↑ 피로 조금↑', 0.97, 0.97, 1, 0.97, 0.5, 1),
  F('money', '돈·브랜드', '수입↑ 팬 관계 변동', 0.95, 0.95, 1, 0.93, 0.4, 1),
  F('rest', '휴식', '스트레스↓ 경기 감각↓', 0.9, 0.9, 0.95, 0.88, -4.2, 0.7)
];

export const FOCUS_COACH: FocusDef[] = [
  F('tactics', '전술 연구', '전술↑ 피로↑', 1, 1, 1, 1, 0.5, 1),
  F('develop', '유망주 육성', '육성↑ 선수 관계↑', 1, 1, 1, 1, 0.5, 1),
  F('manage', '선수단 관리', '관리↑ 분위기↑', 1, 1, 1, 1, 0.3, 1),
  F('media', '미디어 활동', '미디어↑ 명성 변동', 1, 1, 1, 1, 0.2, 1),
  F('data', '데이터 분석', '데이터↑ 피로↑', 1, 1, 1, 1, 0.6, 1),
  F('license', '자격증 공부', '합격 확률↑ 피로↑', 1, 1, 1, 1, 0.6, 1),
  F('family', '가족', '가족 관계↑ 행복↑', 1, 1, 1, 1, -1, 1),
  F('rest', '휴식', '스트레스↓', 1, 1, 1, 1, -4, 1)
];

export const FOCUS_POST: FocusDef[] = [
  F('study', '전문성 쌓기', '전문성↑', 1, 1, 1, 1, 0.3, 1),
  F('network', '인맥 넓히기', '평판↑ 피로↑', 1, 1, 1, 1, 0.5, 1),
  F('media', '방송·SNS', '평판↑ 수입↑', 1, 1, 1, 1, 0.4, 1),
  F('business', '사업 챙기기', '수입↑ 변동', 1, 1, 1, 1, 0.5, 1),
  F('family', '가족', '가족 관계↑ 행복↑', 1, 1, 1, 1, -1, 1),
  F('health', '건강 관리', '건강↑ 스트레스↓', 1, 1, 1, 1, -3, 1),
  F('rest', '휴식', '스트레스↓', 1, 1, 1, 1, -4, 1)
];

export function focusList(phase: Phase): FocusDef[] {
  return phase === 'coach' ? FOCUS_COACH : phase === 'postcareer' ? FOCUS_POST : FOCUS_PLAYER;
}

export function focusDef(s: GameState): FocusDef {
  const l = focusList(s.phase);
  return l.find((f) => f.id === s.focus) ?? l[0];
}

export function defaultFocus(phase: Phase): string {
  return phase === 'coach' ? 'tactics' : phase === 'postcareer' ? 'study' : 'tech';
}

export function weeklyFocusEffects(s: GameState): void {
  const f = s.focus;
  const st = s.st;
  if (s.life.studying && ageAt(s.p.birth.y, s.week) >= 18) {
    s.life.eduProgress += 0.5 + (f === 'study' ? 0.4 : 0);
    if (s.life.eduProgress >= 170 && s.life.eduLevel < 3) {
      s.life.eduLevel = Math.max(2, s.life.eduLevel + 1);
      s.life.eduProgress = 0;
      s.life.studying = s.life.eduLevel < 3;
    }
  }
  if (s.phase === 'youth' || s.phase === 'pro') {
    switch (f) {
      case 'tactic': if (s.people.coach) s.people.coach.rel = clamp(s.people.coach.rel + 0.28, -100, 100); break;
      case 'study': s.life.eduProgress += 1.4 + s.hid.pro / 80; break;
      case 'family':
        for (const k of ['father', 'mother', 'sibling1', 'sibling2', 'sibling3']) if (s.people[k]) s.people[k].rel = clamp(s.people[k].rel + 0.32, -100, 100);
        st.happy = clamp(st.happy + 0.7, 0, 100);
        break;
      case 'social':
        for (const k of ['mate1', 'mate2', 'mate3', 'captain']) if (s.people[k]) s.people[k].rel = clamp(s.people[k].rel + 0.3, -100, 100);
        if (s.people.partner) s.people.partner.rel = clamp(s.people.partner.rel + 0.35, -100, 100);
        st.happy = clamp(st.happy + 0.5, 0, 100);
        st.stress = clamp(st.stress - 0.3, 0, 100);
        break;
      case 'money':
        s.fin.followers += Math.round(2 + s.fame.dom * 0.1);
        if (s.fin.sponsorYear < 100000) s.fin.sponsorYear += Math.round(10 + s.fame.dom * 3);
        if (s.people.fans) s.people.fans.rel = clamp(s.people.fans.rel + (s.st.form.length && s.st.form.reduce((a, b) => a + b, 0) / s.st.form.length > 6.6 ? 0.2 : -0.3), -100, 100);
        break;
      case 'rest':
        st.stress = clamp(st.stress - 2, 0, 100);
        st.sharp = clamp(st.sharp - 0.8, 0, 100);
        st.happy = clamp(st.happy + 0.3, 0, 100);
        break;
      case 'recover':
        st.health = clamp(st.health + 0.5, 0, 100);
        st.stress = clamp(st.stress - 0.5, 0, 100);
        break;
      default: break;
    }
  } else if (s.phase === 'coach') {
    switch (f) {
      case 'tactics': s.coach.skills.tactics = clamp(s.coach.skills.tactics + 0.06, 0, s.coach.cap); break;
      case 'develop': s.coach.skills.development = clamp(s.coach.skills.development + 0.06, 0, s.coach.cap); break;
      case 'manage': s.coach.skills.management = clamp(s.coach.skills.management + 0.06, 0, s.coach.cap); break;
      case 'media': s.coach.skills.media = clamp(s.coach.skills.media + 0.07, 0, s.coach.cap); s.coach.fame = clamp(s.coach.fame + 0.02, 0, 100); break;
      case 'data': s.coach.skills.data = clamp(s.coach.skills.data + 0.07, 0, s.coach.cap); break;
      case 'family':
        for (const k of ['father', 'mother', 'partner', 'child1', 'child2']) if (s.people[k]) s.people[k].rel = clamp(s.people[k].rel + 0.3, -100, 100);
        st.happy = clamp(st.happy + 0.7, 0, 100);
        break;
      case 'rest': st.stress = clamp(st.stress - 2, 0, 100); break;
      default: break;
    }
  } else if (s.phase === 'postcareer') {
    switch (f) {
      case 'study': s.post.skill = clamp(s.post.skill + 0.08, 0, 100); break;
      case 'network': case 'media': s.post.rep = clamp(s.post.rep + 0.08, 0, 100); s.fin.followers += 3; break;
      case 'business': s.fin.cash += 4; break;
      case 'family':
        for (const k of ['father', 'mother', 'partner', 'child1', 'child2']) if (s.people[k]) s.people[k].rel = clamp(s.people[k].rel + 0.3, -100, 100);
        st.happy = clamp(st.happy + 0.7, 0, 100);
        break;
      case 'health': st.health = clamp(st.health + 0.8, 0, 100); st.stress = clamp(st.stress - 1, 0, 100); break;
      case 'rest': st.stress = clamp(st.stress - 2, 0, 100); break;
      default: break;
    }
  }
}
