<script lang="ts">
  import { store } from './store.svelte';
  import Chips from './Chips.svelte';
  import Icon from './Icon.svelte';
  import type { Toast } from '../engine/types';

  const TTL = 5000;
  type Tone = 'normal' | 'good' | 'bad' | 'world';
  const timers = new Map<number, { left: number; started: number; handle: number }>();

  function toneOf(t: Toast): Tone {
    if (/(세계|발롱도르|월드컵|챔피언스|대륙)/.test(t.text) && t.chips.length === 0) return 'world';
    let sum = 0;
    for (const c of t.chips) sum += c.d;
    if (sum > 0) return 'good';
    if (sum < 0) return 'bad';
    return 'normal';
  }

  function start(id: number, ms: number) {
    const prev = timers.get(id);
    if (prev) window.clearTimeout(prev.handle);
    timers.set(id, { left: ms, started: performance.now(), handle: window.setTimeout(() => { timers.delete(id); store.dismissToast(id); }, ms) });
  }

  function pause(id: number) {
    const t = timers.get(id);
    if (!t) return;
    window.clearTimeout(t.handle);
    timers.set(id, { ...t, left: Math.max(600, t.left - (performance.now() - t.started)), handle: 0 });
  }

  function resume(id: number) {
    const t = timers.get(id);
    if (t) start(id, t.left);
  }

  $effect(() => {
    for (const t of store.toasts) if (!timers.has(t.id)) start(t.id, TTL);
    for (const id of [...timers.keys()]) if (!store.toasts.some((t) => t.id === id)) {
      const t = timers.get(id);
      if (t) window.clearTimeout(t.handle);
      timers.delete(id);
    }
  });

  function open(t: Toast) {
    store.focusLogForToast(t);
    store.dismissToast(t.id);
  }
</script>

<div class="toasts" aria-live="polite">
  {#each store.toasts as t (t.id)}
    {@const tone = toneOf(t)}
    <div class="toast" data-tone={tone} role="status" onmouseenter={() => pause(t.id)} onmouseleave={() => resume(t.id)}>
      <button class="body" onclick={() => open(t)} title="인생 기록에서 보기">
        <span class="tx">{t.text}</span>
        {#if t.chips.length}<Chips chips={t.chips} />{/if}
      </button>
      <button class="x" onclick={() => store.dismissToast(t.id)} aria-label="닫기"><Icon name="close" size={14} /></button>
    </div>
  {/each}
</div>

<style>
  .toasts { position: fixed; right: var(--s4); bottom: var(--s4); z-index: 80; display: flex; flex-direction: column; gap: var(--s2); width: 340px; pointer-events: none; }
  .toast { pointer-events: auto; display: flex; align-items: flex-start; gap: var(--s2); padding: var(--s2) var(--s3); border-radius: var(--r-md); background: var(--panel); border: 1px solid var(--line); border-left: 4px solid var(--info); box-shadow: var(--shadow); animation: pop 0.25s ease; }
  .toast[data-tone='good'] { border-left-color: var(--accent); }
  .toast[data-tone='bad'] { border-left-color: var(--danger); }
  .toast[data-tone='world'] { border-left-color: #c58bff; }
  .body { flex: 1; text-align: left; background: none; border: none; cursor: pointer; padding: 0; display: flex; flex-direction: column; gap: var(--s1); color: var(--text); font-size: var(--fs-sub); }
  .x { background: none; border: none; cursor: pointer; color: var(--faint); padding: 0; }
</style>
