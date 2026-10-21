import { getCountry } from '../engine/data';
import { formatKRW } from '../engine/finance';
import { countryCode3 } from './pixel/palette';
import type { EndData } from '../engine/enddata';

export function summaryText(d: EndData): string {
  const c = getCountry(d.country);
  const lines = [
    `[태어난 김에 축구] ${d.name} (${c.ko} ${countryCode3(d.country)}, ${d.birthYear}년생)`,
    `시작: ${d.startClub} · 선수 등급 ${d.grade}${d.percentile ? ` (같은 출발선 상위 ${Math.max(1, Math.round(100 - d.percentile))}%)` : ''}${d.coachGrade ? ` · 지도자 ${d.coachGrade}` : ''}`,
    `통산 ${d.apps}경기 ${d.goals}골 ${d.assists}도움 · 평균 평점 ${d.avg ? d.avg.toFixed(2) : '-'} · A매치 ${d.caps}`,
    `트로피 ${d.trophies.length + d.coachTrophies.length} · 개인상 ${d.awards.length} · 최종 순자산 ${formatKRW(d.netWorth)}`,
    `거친 구단: ${d.clubNames.slice(0, 6).join(' → ')}${d.clubNames.length > 6 ? ' …' : ''}`
  ];
  if (d.dream.id) lines.push(`인생의 꿈: ${d.dream.label} — ${d.dream.achieved ? '이뤘다' : '이루지 못했다'}`);
  if (d.epilogue) lines.push(`은퇴 후: ${d.epilogue.milestones.length}/4 이정표 · ${d.epilogue.years}년`);
  lines.push(`운명 코드: ${d.seed}`);
  return lines.join('\n');
}

export function renderShareCard(d: EndData, cv: HTMLCanvasElement): void {
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
  g.fillText(d.name, 56, 160);
  const c = getCountry(d.country);
  g.fillStyle = '#8d96ab';
  g.font = '500 26px Pretendard, sans-serif';
  g.fillText(`${countryCode3(d.country)} ${c.ko} · ${d.birthYear}년생 · ${d.startClub}에서 출발`, 56, 205);
  g.fillStyle = '#ffb84d';
  g.font = '800 150px Pretendard, sans-serif';
  g.fillText(d.grade, 56, 370);
  g.fillStyle = '#e7eaf2';
  g.font = '600 28px Pretendard, sans-serif';
  g.fillText(d.percentile ? `같은 출발선 상위 ${Math.max(1, Math.round(100 - d.percentile))}%` : '프로 데뷔에는 이르지 못했어요', 56, 412);
  if (d.coachGrade) g.fillText(`지도자 등급 ${d.coachGrade}`, 56, 450);
  if (d.dream.id) {
    g.fillStyle = d.dream.achieved ? '#3ddc84' : '#8d96ab';
    g.font = '600 24px Pretendard, sans-serif';
    g.fillText(`꿈: ${d.dream.label} ${d.dream.achieved ? '✓' : '✗'}`, 56, 488);
  }
  const stats: [string, number][] = [['경기', d.apps], ['골', d.goals], ['도움', d.assists], ['트로피', d.trophies.length + d.coachTrophies.length], ['개인상', d.awards.length], ['A매치', d.caps]];
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
    g.fillText(k, x + 16, y + 86);
  });
  g.fillStyle = '#8d96ab';
  g.font = '500 22px Pretendard, sans-serif';
  g.fillText(`거친 구단: ${d.clubNames.slice(0, 5).join(' → ')}${d.clubNames.length > 5 ? ' …' : ''}`, 640, 400);
  g.fillText(`최종 순자산 ${formatKRW(d.netWorth)}`, 640, 436);
  const total = Math.max(1, d.seasons.length + 1);
  const cw = Math.min(26, (W - 112) / total);
  d.seasons.forEach((r, i) => {
    g.fillStyle = r[15] >= 0 ? `hsl(${r[15]} 55% 42%)` : 'rgba(255,255,255,0.08)';
    g.fillRect(56 + i * (cw + 2), 520, cw, cw);
  });
  g.fillStyle = '#5f687c';
  g.font = '500 20px IBM Plex Mono, monospace';
  g.fillText(`FATE CODE ${d.seed}`, 56, 600);
}
