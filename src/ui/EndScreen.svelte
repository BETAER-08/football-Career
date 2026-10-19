<script lang="ts">
  import { onMount } from 'svelte';
  import { store } from './store.svelte';
  import { summarize, summaryText, renderShareCard } from './share';
  import { getClub, getCountry } from '../engine/data';
  import { formatKRW, netWorth } from '../engine/finance';
  import { START_YEAR } from '../engine/time';
  import { percentileOf } from '../engine/scoring';

  const g = $derived(store.game!);
  const pg = $derived(store.grade());
  const sum = $derived(summarize(g, pg.grade, pg.percentile));
  let cv: HTMLCanvasElement | undefined = $state();
  let copied = $state('');
  const text = $derived(summaryText(g, sum));
  const dist = $derived(store.baseline);
  const bins = $derived.by(() => {
    const n = 20;
    if (!dist.length) return [] as number[];
    const mx = Math.max(...dist, g.score, 1);
    const out = new Array(n).fill(0);
    for (const v of dist) out[Math.min(n - 1, Math.floor((v / mx) * n))]++;
    return out;
  });
  const maxScore = $derived(Math.max(...dist, g.score, 1));
  const mine = $derived(Math.min(0.995, g.score / maxScore));
  const hasCoach = $derived(g.coach.entered && g.coach.recs.length > 0);

  $effect(() => {
    void sum;
    if (cv) renderShareCard(g, sum, cv);
  });
  onMount(() => { if (cv) renderShareCard(g, sum, cv); });

  function copyText() {
    navigator.clipboard?.writeText(text).then(() => (copied = '요약을 복사했어요.'), () => (copied = '복사에 실패했어요.'));
  }
  function download() {
    if (!cv) return;
    const a = document.createElement('a');
    a.href = cv.toDataURL('image/png');
    a.download = `태어난김에축구_${g.p.name}.png`;
    a.click();
  }
  function again() {
    store.pendingConfig = { seed: g.cfg.seed, name: g.cfg.name, pos: g.cfg.pos, mode: 'code', code: g.cfg.seed, lengthMin: store.prefs.lengthMin };
    store.screen = 'roulette';
  }
  void percentileOf;
</script>

<div class="end scroll">
  <div class="wrap">
    <div class="head">
      <div class="gr">{pg.grade === '프로 데뷔 실패' ? '데뷔 실패' : pg.grade}</div>
      <div class="col" style="gap:2px">
        <h1>{g.p.name}</h1>
        <div class="muted">{getCountry(g.p.country).flag} {getCountry(g.p.country).ko} · {g.p.birth.y}년생 · {getClub(g.p.startClubId).name}에서 시작</div>
        <div class="muted">{g.endReason}</div>
        {#if pg.percentile}<div>같은 출발선 상위 <b>{Math.max(1, Math.round(100 - pg.percentile))}%</b></div>{/if}
        {#if sum.coachGrade}<div>지도자 등급 <b>{sum.coachGrade}</b> · 최고 명성 {Math.round(g.coach.peakFame)}</div>{/if}
      </div>
    </div>

    <div class="grid">
      <div class="panel"><div class="panel-h">통산 기록</div><div class="panel-b col" style="gap:4px">
        <div class="kv"><span>경기</span><span class="mono">{sum.apps}</span></div>
        <div class="kv"><span>골 · 도움</span><span class="mono">{sum.goals} · {sum.assists}</span></div>
        <div class="kv"><span>평균 평점</span><span class="mono">{sum.avg ? sum.avg.toFixed(2) : '-'}</span></div>
        <div class="kv"><span>A매치</span><span class="mono">{g.nat.caps}경기 {g.nat.goals}골</span></div>
        <div class="kv"><span>최종 순자산</span><span class="mono up">{formatKRW(netWorth(g))}</span></div>
        <div class="kv"><span>선수 시절 최고 시장가치</span><span class="mono">{formatKRW(g.fame.peakValue)}</span></div>
      </div></div>
      <div class="panel"><div class="panel-h">트로피 · 개인상</div><div class="panel-b col" style="gap:3px;max-height:220px;overflow:auto">
        {#each g.career.trophies as t}<div>🏆 {t.year} {t.name} <span class="faint">· {t.club}</span></div>{/each}
        {#each g.coach.trophies as t}<div>🏆 {t.year} {t.name} <span class="faint">· 감독 · {t.club}</span></div>{/each}
        {#each g.career.awards as a}<div>🏅 {a.year} {a.name}</div>{/each}
        {#if !g.career.trophies.length && !g.career.awards.length && !g.coach.trophies.length}<div class="muted">기록된 트로피와 개인상이 없어요.</div>{/if}
      </div></div>
      <div class="panel"><div class="panel-h">거쳐 간 구단</div><div class="panel-b col" style="gap:3px;max-height:220px;overflow:auto">
        {#each g.career.clubsHist as h}<div>{getClub(h.clubId).name} <span class="faint">· {START_YEAR + h.fromS}{h.toS >= 0 ? '~' + (START_YEAR + h.toS) : ''}</span></div>{/each}
        {#each g.coach.recs.filter((r) => !r.clubId.startsWith('NAT')) as r}<div>{r.clubName} <span class="faint">· 지도자 {r.year} · {r.role}</span></div>{/each}
      </div></div>
    </div>

    <div class="panel"><div class="panel-h">같은 출발선 분포 <span class="faint" style="font-weight:500">({getCountry(g.p.country).ko} · 수준 {g.p.startLvl} · {g.ab.pos} · 200회 시뮬레이션)</span></div>
      <div class="panel-b">
        {#if bins.length}
          <div class="hist">
            {#each bins as b, i}<div class="bar" style="height:{(b / Math.max(...bins)) * 100}%"></div>{/each}
            <div class="me" style="left:{mine * 100}%"><span>나</span></div>
          </div>
          <div class="mini-hint">점수 {g.score.toFixed(1)} · 분포 최고 {maxScore.toFixed(0)}</div>
        {:else}
          <div class="muted">분포를 계산 중이에요… {Math.round(store.baselineProgress * 100)}%</div>
        {/if}
      </div>
    </div>

    <div class="panel"><div class="panel-h">공유 카드</div>
      <div class="panel-b col" style="gap:10px;align-items:center">
        <canvas bind:this={cv} class="share"></canvas>
        <div class="row" style="flex-wrap:wrap;justify-content:center">
          <button class="btn" onclick={download}>PNG 저장</button>
          <button class="btn" onclick={copyText}>텍스트 요약 복사</button>
          {#if copied}<span class="muted">{copied}</span>{/if}
        </div>
        <pre class="sum">{text}</pre>
        <div class="row">운명 코드 <b class="mono code">{g.cfg.seed}</b></div>
      </div>
    </div>

    <div class="row" style="justify-content:center;gap:12px;padding:18px 0 40px">
      <button class="btn primary big" onclick={again}>같은 운명 다시 하기</button>
      <button class="btn big" onclick={() => (store.screen = 'setup')}>새로 입단하기</button>
      <button class="btn big" onclick={() => (store.screen = 'vault')}>지난 커리어 보관함</button>
      <button class="btn big" onclick={() => (store.screen = 'menu')}>메인 메뉴</button>
    </div>
    <div class="faint" style="text-align:center;font-size:12px">{hasCoach ? '' : ''}</div>
  </div>
</div>

<style>
  .end { height: 100%; }
  .wrap { max-width: 1100px; margin: 0 auto; padding: 28px 20px; display: flex; flex-direction: column; gap: 14px; }
  .head { display: flex; gap: 24px; align-items: center; padding: 18px 22px; border-radius: 14px; border: 1px solid var(--line); background: linear-gradient(120deg, color-mix(in srgb, var(--accent) 14%, var(--panel)), var(--panel)); }
  .gr { font-size: 64px; font-weight: 900; color: var(--amber); min-width: 150px; text-align: center; letter-spacing: -0.03em; }
  h1 { margin: 0; font-size: 32px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .hist { position: relative; height: 130px; display: flex; align-items: flex-end; gap: 3px; border-bottom: 1px solid var(--line); }
  .bar { flex: 1; background: color-mix(in srgb, var(--info) 70%, var(--panel)); border-radius: 3px 3px 0 0; min-height: 2px; }
  .me { position: absolute; bottom: 0; top: 0; width: 2px; background: var(--amber); }
  .me span { position: absolute; top: -2px; left: 4px; font-size: 12px; font-weight: 800; color: var(--amber); }
  .share { width: 100%; max-width: 720px; border-radius: 12px; border: 1px solid var(--line); }
  .sum { white-space: pre-wrap; background: var(--bg2); border: 1px solid var(--line); border-radius: 10px; padding: 10px 14px; font-family: var(--font); font-size: 13px; width: 100%; max-width: 720px; margin: 0; }
  .code { background: var(--bg2); padding: 2px 10px; border-radius: 6px; }
  .big { padding: 10px 20px; font-size: 14px; }
</style>
