<script lang="ts">
  import { store } from './store.svelte';
  import { dateOf, fmtDate } from '../engine/time';
  import Chips from './Chips.svelte';
  import type { LogEntry } from '../engine/types';

  let { limit = 60, full = false }: { limit?: number; full?: boolean } = $props();
  const g = $derived(store.game!);
  let filter = $state<'all' | 'star' | 'choice' | 'event' | 'match'>('all');
  const list = $derived.by(() => {
    let l = g.log;
    if (filter === 'star') l = l.filter((e) => e.star);
    else if (filter === 'choice') l = l.filter((e) => e.kind === 'choice' || e.kind === 'moment' || e.kind === 'chain');
    else if (filter === 'event') l = l.filter((e) => e.kind === 'passive' || e.kind === 'system' || e.kind === 'milestone');
    else if (filter === 'match') l = l.filter((e) => e.kind === 'match');
    const out: LogEntry[] = [];
    for (let i = l.length - 1; i >= 0 && out.length < limit; i--) out.push(l[i]);
    return out;
  });
  const kindColor: Record<string, string> = { passive: 'var(--info)', choice: 'var(--amber)', system: 'var(--faint)', match: 'var(--accent)', milestone: '#c58bff', chain: '#ff8bd0', moment: '#ff9d5a' };
  const kindLabel: Record<string, string> = { passive: '사건', choice: '선택', system: '기록', match: '경기', milestone: '이정표', chain: '이야기', moment: '순간' };

  function star(e: LogEntry) {
    e.star = !e.star;
    store.notify();
  }
</script>

<div class="panel" class:fullp={full}>
  <div class="panel-h">
    <span>인생 기록</span>
    <span class="spacer"></span>
    {#each [['all', '전체'], ['star', '★ 즐겨찾기'], ['choice', '선택'], ['event', '사건'], ['match', '경기']] as [k, label]}
      <button class="btn sm" class:on={filter === k} onclick={() => (filter = k as typeof filter)}>{label}</button>
    {/each}
    {#if !full}<button class="btn sm" onclick={() => (store.panel = 'log')} title="L">전체 보기</button>{/if}
  </div>
  <div class="logs" class:scroll={full}>
    {#each list as e (e.id)}
      <div class="entry" style="--kc:{kindColor[e.kind]}">
        <div class="rail"></div>
        <div class="grow col" style="gap:3px">
          <div class="row" style="gap:6px">
            <span class="kind">{kindLabel[e.kind]}</span>
            <span class="date mono">{fmtDate(dateOf(e.w))}</span>
            {#if e.title}<b class="ttl">{e.title}</b>{/if}
            <span class="spacer"></span>
            <button class="star" class:on={e.star} onclick={() => star(e)} aria-label="즐겨찾기">{e.star ? '★' : '☆'}</button>
          </div>
          <div class="body">{e.text}</div>
          {#if e.chips.length}<Chips chips={e.chips} />{/if}
          {#if e.heavy && e.help}<div class="help">도움받을 곳 · {e.help}</div>{/if}
          {#if e.note}<div class="note">{e.note}</div>{/if}
        </div>
      </div>
    {:else}
      <div class="muted" style="padding:16px">아직 기록이 없어요.</div>
    {/each}
  </div>
</div>

<style>
  .logs { display: flex; flex-direction: column; }
  .fullp .logs { max-height: 70vh; }
  .entry { display: flex; gap: 10px; padding: 9px 12px; border-bottom: 1px solid color-mix(in srgb, var(--line) 60%, transparent); animation: pop 0.25s ease; }
  .entry:last-child { border-bottom: none; }
  .rail { width: 3px; border-radius: 2px; background: var(--kc); flex: none; }
  .kind { font-size: 10.5px; font-weight: 800; color: var(--kc); letter-spacing: 0.04em; }
  .date { font-size: 11px; color: var(--faint); }
  .ttl { font-size: 13px; }
  .body { font-size: 13.5px; line-height: 1.6; white-space: pre-line; }
  .note { font-size: 11.5px; color: var(--faint); }
  .help { font-size: 12px; color: var(--info); }
  .star { background: none; border: none; cursor: pointer; color: var(--faint); font-size: 15px; padding: 0 2px; }
  .star.on { color: var(--amber); }
</style>
