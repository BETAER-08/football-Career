import type { GameState } from '../engine/types';
import { getClub, getCountry } from '../engine/data';
import { formatKRW, netWorth } from '../engine/finance';
import { coachGrade } from '../engine/scoring';

export interface EndSummary {
  grade: string;
  percentile: number;
  coachGrade: string;
  apps: number;
  goals: number;
  assists: number;
  avg: number;
  trophies: number;
  awards: number;
  clubs: string[];
  caps: number;
}

export function summarize(s: GameState, grade: string, percentile: number): EndSummary {
  const all = s.career.seasons;
  let apps = 0, goals = 0, assists = 0, rs = 0, rn = 0;
  for (const r of all) { apps += r.apps; goals += r.goals; assists += r.assists; rs += r.ratingSum; rn += r.ratingN; }
  const clubs: string[] = [];
  for (const h of s.career.clubsHist) { const n = getClub(h.clubId).name; if (!clubs.includes(n)) clubs.push(n); }
  return {
    grade, percentile, coachGrade: s.coach.entered && s.coach.recs.length ? coachGrade(s.coach.peakFame) : '', apps, goals, assists, avg: rn ? rs / rn : 0,
    trophies: s.career.trophies.length + s.coach.trophies.length, awards: s.career.awards.length, clubs, caps: s.nat.caps
  };
}

export function summaryText(s: GameState, sum: EndSummary): string {
  const c = getCountry(s.p.country);
  const lines = [
    `⚽ 태어난 김에 축구 — ${s.p.name} (${c.flag} ${c.ko}, ${s.p.birth.y}년생)`,
    `시작: ${getClub(s.p.startClubId).name} · 선수 등급 ${sum.grade}${sum.percentile ? ` (같은 출발선 상위 ${Math.max(1, Math.round(100 - sum.percentile))}%)` : ''}${sum.coachGrade ? ` · 지도자 ${sum.coachGrade}` : ''}`,
    `통산 ${sum.apps}경기 ${sum.goals}골 ${sum.assists}도움 · 평균 평점 ${sum.avg ? sum.avg.toFixed(2) : '-'} · A매치 ${sum.caps}`,
    `트로피 ${sum.trophies} · 개인상 ${sum.awards} · 최종 순자산 ${formatKRW(netWorth(s))}`,
    `거친 구단: ${sum.clubs.slice(0, 6).join(' → ')}${sum.clubs.length > 6 ? ' …' : ''}`,
    `운명 코드: ${s.cfg.seed}`
  ];
  return lines.join('\n');
}

export function renderShareCard(s: GameState, sum: EndSummary, cv: HTMLCanvasElement): void {
  const W = 1200;
  const H = 630;
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d');
  if (!g) return;
  const grad = g.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#0f1a14');
  grad.addColorStop(1, '#10162a');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(61,220,132,0.12)';
  for (let i = 0; i < 12; i++) g.fillRect(0, 40 + i * 50, W, 24);
  g.fillStyle = '#3ddc84';
  g.font = '800 30px Pretendard, sans-serif';
  g.fillText('태어난 김에 축구', 56, 70);
  g.fillStyle = '#e7eaf2';
  g.font = '800 64px Pretendard, sans-serif';
  g.fillText(s.p.name, 56, 160);
  const c = getCountry(s.p.country);
  g.fillStyle = '#8d96ab';
  g.font = '500 26px Pretendard, sans-serif';
  g.fillText(`${c.flag} ${c.ko} · ${s.p.birth.y}년생 · ${getClub(s.p.startClubId).name}에서 출발`, 56, 205);
  g.fillStyle = '#ffb84d';
  g.font = '800 150px Pretendard, sans-serif';
  g.fillText(sum.grade, 56, 370);
  g.fillStyle = '#e7eaf2';
  g.font = '600 28px Pretendard, sans-serif';
  g.fillText(sum.percentile ? `같은 출발선 상위 ${Math.max(1, Math.round(100 - sum.percentile))}%` : '프로 데뷔에는 이르지 못했어요', 56, 412);
  if (sum.coachGrade) g.fillText(`지도자 등급 ${sum.coachGrade}`, 56, 450);
  const stats = [['경기', sum.apps], ['골', sum.goals], ['도움', sum.assists], ['트로피', sum.trophies], ['개인상', sum.awards], ['A매치', sum.caps]];
  stats.forEach(([k, v], i) => {
    const x = 640 + (i % 3) * 180;
    const y = 120 + Math.floor(i / 3) * 120;
    g.fillStyle = 'rgba(255,255,255,0.06)';
    g.fillRect(x, y, 160, 100);
    g.fillStyle = '#e7eaf2';
    g.font = '800 44px IBM Plex Mono, monospace';
    g.fillText(String(v), x + 16, y + 56);
    g.fillStyle = '#8d96ab';
    g.font = '500 20px Pretendard, sans-serif';
    g.fillText(String(k), x + 16, y + 86);
  });
  g.fillStyle = '#8d96ab';
  g.font = '500 22px Pretendard, sans-serif';
  g.fillText(`거친 구단: ${sum.clubs.slice(0, 5).join(' → ')}${sum.clubs.length > 5 ? ' …' : ''}`, 640, 400);
  g.fillText(`최종 순자산 ${formatKRW(netWorth(s))}`, 640, 436);
  const total = Math.max(1, s.hist.length + 1);
  const cw = Math.min(26, (W - 112) / total);
  for (let i = 0; i < s.hist.length; i++) {
    const rec = s.career.seasons.filter((r) => r.s === s.hist[i].s).pop();
    g.fillStyle = rec ? `hsl(${getClub(rec.clubId).color} 55% 42%)` : 'rgba(255,255,255,0.08)';
    g.fillRect(56 + i * (cw + 2), 520, cw, cw);
  }
  g.fillStyle = '#5f687c';
  g.font = '500 20px IBM Plex Mono, monospace';
  g.fillText(`FATE CODE ${s.cfg.seed}`, 56, 600);
}
