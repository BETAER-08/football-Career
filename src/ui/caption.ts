import { getClub } from '../engine/data';
import { STAGE_LABEL } from '../engine/stages';
import { swOf } from '../engine/time';
import type { GameState } from '../engine/types';

function matchWeek(s: GameState): boolean {
  const sw = swOf(s.week);
  if (s.phase === 'youth') {
    if (s.yt && s.yt.fixtures.some((f) => f.w === sw)) return true;
    return s.career.entry.step >= 2 && s.career.fixtures.some((f) => f.w === sw && f.kind !== 'friendly');
  }
  return s.career.fixtures.some((f) => f.w === sw && f.kind !== 'friendly');
}

export function captionOf(s: GameState): string {
  const idc = s.phase === 'coach' ? s.coach.clubId : s.career.clubId;
  const club = idc ? getClub(idc) : null;
  if (s.phase === 'postcareer') {
    return s.post.path === 'pundit' ? '방송국 해설 부스 · 생방송 준비 중' : s.post.path === 'admin' ? '구단 사무실 · 스카우팅 보고서를 정리하는 중' : s.post.path === 'business' ? `${s.p.hometown} · 사업을 챙기는 일상` : `${s.p.hometown} · 평온한 일상`;
  }
  if (!club) return `${s.p.hometown} · 새 소속을 기다리는 중`;
  const where = club.city;
  if (s.phase === 'coach') return `${where} · ${club.name} · ${matchWeek(s) ? '경기 주간 벤치' : '지도자 훈련장'}`;
  const injured = !!s.st.injury;
  if (injured) return `${where} · ${club.name} 재활실 · ${s.st.injury?.ko ?? ''}`;
  if (s.phase === 'youth') {
    const tag = STAGE_LABEL[s.career.youthStage];
    if (matchWeek(s)) {
      if (s.career.entry.step >= 2 && s.career.fixtures.some((f) => f.w === swOf(s.week) && f.kind !== 'friendly')) return `${where} · ${club.name} · 1군 경기 명단 합류`;
      return s.career.youthStage === 'RES' ? `${where} · ${club.name} 리저브 경기장 · 경기 주간` : `${where} · ${club.name} ${tag} · 유스 리그 경기 주간`;
    }
    if (s.career.entry.step >= 1 && swOf(s.week) % 2 === 0) return `${where} · ${club.name} 1군 훈련장 · 형들과 함께`;
    if (s.fin.housing === 'dorm' && swOf(s.week) % 3 === 0) return `${where} · ${club.name} 아카데미 숙소 · 동료 ${s.p.dorm ? 2 : 0}명과 함께`;
    return s.career.youthStage === 'RES' ? `${where} · ${club.name} 리저브 훈련장` : `${where} · ${club.name} ${tag} 유스 훈련장`;
  }
  return matchWeek(s) ? `${where} · ${club.name} · 경기 주간` : `${where} · ${club.name} 훈련장`;
}
