<script lang="ts">
  import { onMount } from 'svelte';
  import { store } from './store.svelte';
  import { summaryText, renderShareCard } from './share';
  import { getCountry } from '../engine/data';
  import { formatKRW } from '../engine/finance';
  import { START_YEAR } from '../engine/time';
  import type { EndData } from '../engine/enddata';

  const d = $derived(store.end as EndData);
  let cv: HTMLCanvasElement | undefined = $state();
  let copied = $state('');
  const text = $derived(summaryText(d));
  const dist = $derived(store.baseline);
  const bins = $derived.by(() => {
    const n = 20;
    if (!dist.length) return [] as number[];
    const mx = Math.max(...dist, d.score, 1);
    const out = new Array(n).fill(0);
    for (const v of dist) out[Math.min(n - 1, Math.floor((v / mx) * n))]++;
    return out;
  });
  const maxScore = $derived(Math.max(...dist, d.score, 1));
  const mine = $derived(Math.min(0.995, d.score / maxScore));

  $effect(() => {
    void d;
    if (cv) renderShareCard(d, cv);
  });
  onMount(() => { if (cv) renderShareCard(d, cv); });

  function copyText() {
    navigator.clipboard?.writeText(text).then(() => (copied = '요약을 복사했어요.'), () => (copied = '복사에 실패했어요.'));
  }
  function download() {
    if (!cv) return;
    const a = document.createElement('a');
    a.href = cv.toDataURL('image/png');
    a.download = `태어난김에축구_${d.name}.png`;
    a.click();
  }
  function again() {
    store.pendingConfig = { seed: d.seed, name: d.cfgName, pos: d.pos, mode: 'code', code: d.seed, lengthMin: store.prefs.lengthMin };
    store.screen = 'roulette';
  }
</script>

<div class="end scroll">
  <div class="wrap">
    <div class="head">
      <div class="gr">{d.grade === '프로 데뷔 실패' ? '데뷔 실패' : d.grade}</div>
      <div class="col" style="gap:2px">
        <h1>{d.name}</h1>
        <div class="muted">{getCountry(d.country).flag} {getCountry(d.country).ko} · {d.birthYear}년생 · {d.startClub}에서 시작</div>
        <div class="muted">{d.endReason}</div>
        {#if d.percentile}<div>같은 출발선 상위 <b>{Math.max(1, Math.round(100 - d.percentile))}%</b></div>{/if}
        {#if d.coachGrade}<div>지도자 등급 <b>{d.coachGrade}</b> · 최고 명성 {d.peakFame}</div>{/if}
        {#if d.dream.id}<div>인생의 꿈 <b>{d.dream.label}</b> — <span class={d.dream.achieved ? 'up' : 'down'}>{d.dream.achieved ? '이뤘다 ✓' : '이루지 못했다 ✗'}</span></div>{/if}
      </div>
    </div>

    {#if store.archiveFail}
      <div class="fail">보관함에 저장하지 못했어요. 결과 카드 이미지와 텍스트 복사로 남겨 주세요. <button class="btn sm" onclick={() => store.exportNow()}>지금 내보내기</button></div>
    {/if}

    <div class="grid">
      <div class="panel"><div class="panel-h">통산 기록</div><div class="panel-b col" style="gap:4px">
        <div class="kv"><span>경기</span><span class="mono">{d.apps}</span></div>
        <div class="kv"><span>골 · 도움</span><span class="mono">{d.goals} · {d.assists}</span></div>
        <div class="kv"><span>평균 평점</span><span class="mono">{d.avg ? d.avg.toFixed(2) : '-'}</span></div>
        <div class="kv"><span>A매치</span><span class="mono">{d.caps}경기 {d.natGoals}골</span></div>
        <div class="kv"><span>최종 순자산</span><span class="mono up">{formatKRW(d.netWorth)}</span></div>
        <div class="kv"><span>선수 시절 최고 시장가치</span><span class="mono">{formatKRW(d.peakValue)}</span></div>
      </div></div>
      <div class="panel"><div class="panel-h">트로피 · 개인상</div><div class="panel-b col" style="gap:3px;max-height:220px;overflow:auto">
        {#each d.trophies as t}<div>🏆 {t.year} {t.name} <span class="faint">· {t.club}</span></div>{/each}
        {#each d.coachTrophies as t}<div>🏆 {t.year} {t.name} <span class="faint">· 감독 · {t.club}</span></div>{/each}
        {#each d.awards as a}<div>🏅 {a.year} {a.name}</div>{/each}
        {#if !d.trophies.length && !d.awards.length && !d.coachTrophies.length}<div class="muted">기록된 트로피와 개인상이 없어요.</div>{/if}
      </div></div>
      <div class="panel"><div class="panel-h">거쳐 간 구단</div><div class="panel-b col" style="gap:3px;max-height:220px;overflow:auto">
        {#each d.clubs as h}<div>{h.name} <span class="faint">· {h.from}{h.to >= 0 ? '~' + h.to : ''}</span></div>{/each}
        {#each d.coachRecs.filter((r) => !r.clubId.startsWith('NAT')) as r}<div>{r.clubName} <span class="faint">· 지도자 {r.year} · {r.role}</span></div>{/each}
      </div></div>
    </div>

    {#if d.epilogue}
      <div class="panel"><div class="panel-h">은퇴 후의 삶</div>
        <div class="panel-b col" style="gap:6px">
          <div class="row" style="flex-wrap:wrap"><span class="tag">{{ pundit: '해설·방송', admin: '구단 행정', business: '사업' }[d.epilogue.path]}</span><span class="tag">{d.epilogue.years}년</span><span class="tag">이정표 {d.epilogue.ms}/4</span></div>
          {#each d.epilogue.milestones as m, i}<div>✔ {i + 1}. {m}</div>{/each}
          <div class="muted">{d.epilogue.text}</div>
        </div>
      </div>
    {/if}

    <div class="panel"><div class="panel-h">같은 출발선 분포 <span class="faint" style="font-weight:500">({getCountry(d.country).ko} · 수준 {d.startLvl} · {d.pos} · 200회 시뮬레이션)</span></div>
      <div class="panel-b">
        {#if bins.length}
          <div class="hist">
            {#each bins as b, i}<div class="bar" style="height:{(b / Math.max(...bins)) * 100}%"></div>{/each}
            <div class="me" style="left:{mine * 100}%"><span>나</span></div>
          </div>
          <div class="mini-hint">점수 {d.score.toFixed(1)} · 분포 최고 {maxScore.toFixed(0)}</div>
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
        <div class="row">운명 코드 <b class="mono code">{d.seed}</b></div>
      </div>
    </div>

    <div class="row" style="justify-content:center;gap:12px;padding:18px 0 40px">
      <button class="btn primary big" onclick={again}>같은 운명 다시 하기</button>
      <button class="btn big" onclick={() => (store.screen = 'setup')}>새로 입단하기</button>
      <button class="btn big" onclick={() => (store.screen = 'vault')}>지난 커리어 보관함</button>
      <button class="btn big" onclick={() => (store.screen = 'menu')}>메인 메뉴</button>
    </div>
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
  .fail { padding: 10px 14px; border: 1px solid var(--amber); border-radius: 10px; color: var(--amber); font-size: 13px; }
  .share { width: 100%; max-width: 720px; border-radius: 12px; border: 1px solid var(--line); }
  .sum { white-space: pre-wrap; background: var(--bg2); border: 1px solid var(--line); border-radius: 10px; padding: 10px 14px; font-family: var(--font); font-size: 13px; width: 100%; max-width: 720px; margin: 0; }
  .code { background: var(--bg2); padding: 2px 10px; border-radius: 6px; }
  .big { padding: 10px 20px; font-size: 14px; }
</style>
