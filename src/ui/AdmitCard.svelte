<script lang="ts">
  import { onMount } from 'svelte';
  import type { GameState } from '../engine/types';
  import { POS_LABEL } from '../engine/types';
  import { getClub, getCountry } from '../engine/data';
  import { academyGrade } from '../engine/data';
  import { drawAvatar } from './pixel/avatar';
  import { mrz, seed32 } from './format';

  let { s, revealStep = 99 }: { s: GameState; revealStep?: number } = $props();
  let cv: HTMLCanvasElement | undefined = $state();
  const club = $derived(getClub(s.p.startClubId));
  const country = $derived(getCountry(s.p.country));
  const [l1, l2] = $derived(mrz(s));
  const kids = ['mate1', 'mate2', 'mate3'];
  const incomeLabels = ['매우 어려움', '넉넉하지 않음', '평범함', '여유로움', '매우 부유함'];
  const footLabel = { R: '오른발', L: '왼발', B: '양발' };
  const growLabel = { early: '조숙형', normal: '보통', late: '만성형' };
  const supportText = $derived(s.p.supportive >= 75 ? '축구를 전폭적으로 지지한다' : s.p.supportive >= 50 ? '응원하지만 걱정도 많다' : '공부를 더 바란다');

  onMount(() => {
    if (!cv) return;
    const g = cv.getContext('2d');
    if (g) drawAvatar(g, 96, 12, seed32(s.cfg.seed), s.p.country, `hsl(${club.color} 65% 48%)`);
  });
</script>

<div class="card">
  <div class="band"><span>선수 기록 · {s.p.country} · 2026</span><span class="mono">REG-{String(seed32(s.cfg.seed) % 1000000).padStart(6, '0')}</span></div>
  <div class="body">
    <div class="top">
      <div class="photo"><canvas bind:this={cv} width="96" height="96" class="pixel"></canvas></div>
      <div class="col grow" style="gap:2px">
        <div class="name">{s.p.name} <span class="en" title="원어 표기">{s.p.en}</span></div>
        <div class="muted">{s.p.birth.y}.{String(s.p.birth.m).padStart(2, '0')}.{String(s.p.birth.d).padStart(2, '0')}생 · 12세 · {country.flag} {country.ko}</div>
        <div class="muted">고향 {s.p.hometown}{s.p.dorm ? ' · 유스 숙소 생활' : ' · 집에서 통학'}</div>
        <div class="muted">{POS_LABEL[s.ab.pos]} · {footLabel[s.p.foot]}잡이 · {growLabel[s.p.growth]} · {s.p.build} 체형</div>
      </div>
    </div>
    {#if revealStep >= 1}
      <div class="sect reveal" style="--d:0ms">
        <b>가정</b>
        <div class="kv"><span>아버지</span><span title={s.people.father.en}>{s.people.father.name} ({2026 - s.people.father.birthYear}세 · {s.people.father.job})</span></div>
        <div class="kv"><span>어머니</span><span title={s.people.mother.en}>{s.people.mother.name} ({2026 - s.people.mother.birthYear}세 · {s.people.mother.job})</span></div>
        <div class="kv"><span>형제자매</span><span>{Object.keys(s.people).filter((k) => k.startsWith('sibling')).length}명</span></div>
        <div class="kv"><span>소득 분위</span><span>{'●'.repeat(s.p.incomeTier)}{'○'.repeat(5 - s.p.incomeTier)} {incomeLabels[s.p.incomeTier - 1]}</span></div>
        <div class="kv"><span>축구 경험자</span><span>{s.p.famExp}</span></div>
        <div class="kv"><span>부모의 성향</span><span>{supportText}</span></div>
      </div>
    {/if}
    {#if revealStep >= 2}
      <div class="sect reveal" style="--d:0ms">
        <b>신체</b>
        <div class="kv"><span>현재</span><span>{s.ab.height}cm · {s.ab.weight}kg</span></div>
        <div class="kv"><span>예상 최종 키</span><span>약 {Math.round(s.p.finalHeight / 2) * 2 - 2}~{Math.round(s.p.finalHeight / 2) * 2 + 2}cm</span></div>
      </div>
    {/if}
    {#if revealStep >= 3}
      <div class="sect reveal" style="--d:0ms">
        <b>구단 · {club.name}</b>
        <div class="kv"><span>연고 · 아카데미 등급 · 시설</span><span>{club.city} · {academyGrade(club.acad)}등급 · {club.facil}점</span></div>
        <div class="kv"><span>유스 감독</span><span title={s.people.coach.en}>{s.people.coach.name} · {s.people.coach.style}</span></div>
        <div class="kv"><span>동기</span><span>{kids.map((k) => `${s.people[k].name} (${s.people[k].pos})`).join(' · ')}</span></div>
      </div>
    {/if}
    {#if revealStep >= 4}
      <div class="sect reveal" style="--d:0ms">
        <b>스카우트들 사이의 소문</b>
        <div class="rumor">"{s.p.rumor.replace(/^"|"$/g, '')}"</div>
      </div>
    {/if}
    {#if revealStep >= 5}
      <div class="sect reveal" style="--d:0ms">
        <b>입단 전 이야기</b>
        <ul>{#each s.p.story as line}<li>{line.replaceAll('{name}', s.p.name)}</li>{/each}</ul>
      </div>
    {/if}
  </div>
  <div class="mrz mono"><div>{l1}</div><div>{l2}</div></div>
</div>

<style>
  .card { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; box-shadow: var(--shadow); width: 100%; }
  .band { display: flex; justify-content: space-between; padding: 8px 16px; background: color-mix(in srgb, var(--accent) 22%, var(--panel2)); font-weight: 800; font-size: 12px; letter-spacing: 0.04em; }
  .body { padding: 14px 16px 10px; display: flex; flex-direction: column; gap: 10px; }
  .top { display: flex; gap: 14px; }
  .photo { width: 96px; height: 96px; background: repeating-linear-gradient(45deg, var(--bg2), var(--bg2) 6px, var(--panel2) 6px, var(--panel2) 12px); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
  .name { font-size: 22px; font-weight: 800; }
  .en { font-size: 12px; color: var(--faint); font-weight: 500; margin-left: 6px; }
  .sect { display: flex; flex-direction: column; gap: 3px; padding-top: 8px; border-top: 1px dashed var(--line); font-size: 12.5px; }
  .reveal { animation: pop 0.4s ease both; }
  ul { margin: 0; padding-left: 18px; color: var(--muted); }
  .rumor { color: var(--amber); font-style: italic; }
  .mrz { padding: 6px 16px 10px; font-size: 12px; letter-spacing: 0.1em; color: var(--faint); background: var(--bg2); border-top: 1px solid var(--line); line-height: 1.3; word-break: break-all; }
</style>
