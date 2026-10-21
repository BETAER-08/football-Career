<script lang="ts">
  import { onMount } from 'svelte';
  import { store } from './store.svelte';
  import Chips from './Chips.svelte';
  import Lines from './Lines.svelte';
  import Icon from './Icon.svelte';
  import { dialogCount } from './dialog';

  const r = $derived(store.result);
  const labels = { great: '대성공', ok: '성공', bad: '실패', worst: '대실패', none: '결과' } as const;
  const tone = $derived(r ? ({ great: 'var(--g-great)', ok: 'var(--g-ok)', bad: 'var(--g-bad)', worst: 'var(--g-worst)', none: 'var(--g-none)' }[r.grade]) : '');
  const check = $derived(!!r && r.grade !== 'none' && r.need > 0 && r.need < 100);
  let btn: HTMLButtonElement | undefined = $state();

  function onKey(e: KeyboardEvent) {
    if (!r || e.key !== 'Enter' || dialogCount() > 0) return;
    const t = e.target as HTMLElement;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.tagName === 'BUTTON')) return;
    e.preventDefault();
    store.dismissResult();
  }

  onMount(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  $effect(() => {
    if (r && btn) btn.scrollIntoView({ block: 'nearest' });
  });
</script>

{#if r}
  <div class="panel res" style="--tone:{tone}" role="status">
    <div class="band"><b>{labels[r.grade]}</b><span>{r.title}</span></div>
    <div class="panel-b col" style="gap:var(--s3)">
      <div class="txt">{r.text}</div>
      <Lines lines={r.lines} />
      {#if check}
        <div class="ruler" aria-label="굴린 값 {r.roll}, 필요한 값 {r.need}">
          <div class="track">
            <i class="zone" style="width:{r.need}%"></i>
            <i class="mark" style="left:{Math.min(99, Math.max(1, r.roll))}%"></i>
            {#each [0, 25, 50, 75, 100] as t}<i class="tick" style="left:{t}%"></i>{/each}
          </div>
          <div class="legend"><span>굴린 값 <b class="mono">{r.roll}</b></span><span>필요한 값 <b class="mono">{r.need}</b> 미만</span></div>
        </div>
      {/if}
      <Chips chips={r.changes} />
      {#if r.later}<div class="mini-hint"><Icon name="clock" size={12} /> 이 선택은 나중에 다시 돌아올 수 있어요.</div>{/if}
      <div class="row"><span class="spacer"></span><button class="btn primary" bind:this={btn} onclick={() => store.dismissResult()}>계속 <span class="kbd">Enter</span></button></div>
    </div>
  </div>
{/if}

<style>
  .res { border-color: var(--tone); animation: pop 0.25s ease; overflow: hidden; }
  .band { display: flex; align-items: center; gap: var(--s3); padding: var(--s2) var(--s3); background: color-mix(in srgb, var(--tone) 22%, var(--panel2)); border-bottom: 1px solid var(--tone); font-size: var(--fs-sub); }
  .band b { color: var(--tone); font-weight: 800; letter-spacing: 0.04em; }
  .txt { font-size: var(--fs-body); line-height: 1.65; }
  .ruler { display: flex; flex-direction: column; gap: var(--s1); }
  .track { position: relative; height: 12px; border-radius: 6px; background: color-mix(in srgb, var(--g-bad) 35%, var(--bg2)); overflow: hidden; }
  .zone { position: absolute; left: 0; top: 0; bottom: 0; background: color-mix(in srgb, var(--g-ok) 70%, var(--bg2)); }
  .mark { position: absolute; top: -2px; bottom: -2px; width: 4px; margin-left: -2px; background: var(--text); border-radius: 2px; box-shadow: 0 0 0 2px var(--bg); }
  .tick { position: absolute; bottom: 0; height: 4px; width: 1px; background: rgba(255, 255, 255, 0.35); }
  .legend { display: flex; justify-content: space-between; font-size: var(--fs-panel); color: var(--muted); }
  .kbd { font-size: var(--fs-panel); padding: 0 var(--s1); border: 1px solid color-mix(in srgb, var(--accent-ink) 40%, transparent); border-radius: 4px; margin-left: var(--s1); }
</style>
