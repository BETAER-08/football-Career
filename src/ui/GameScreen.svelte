<script lang="ts">
  import { onMount } from 'svelte';
  import { store } from './store.svelte';
  import TopBar from './TopBar.svelte';
  import LeftPanel from './LeftPanel.svelte';
  import CenterPanel from './CenterPanel.svelte';
  import RightPanel from './RightPanel.svelte';
  import LifeLog from './LifeLog.svelte';
  import ActionPanel from './ActionPanel.svelte';
  import SaveModal from './SaveModal.svelte';
  import { focusList } from '../engine/lifestyle';
  import Chips from './Chips.svelte';

  const g = $derived(store.game!);

  function onKey(e: KeyboardEvent) {
    const t = e.target as HTMLElement;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    if (e.code === 'Space') {
      e.preventDefault();
      store.togglePlay();
    } else if (e.key === '+' || e.key === '=') store.stepSpeed(1);
    else if (e.key === '-' || e.key === '_') store.stepSpeed(-1);
    else if (e.key === 'f' || e.key === 'F') store.cycleFocus(focusList(g.phase).map((x) => x.id));
    else if (e.key === 'a' || e.key === 'A') store.panel = store.panel === 'money' ? '' : 'money';
    else if (e.key === 'l' || e.key === 'L') store.panel = store.panel === 'log' ? '' : 'log';
    else if (e.key === 'Escape') store.panel = '';
  }
  onMount(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
</script>

<div class="game">
  <TopBar />
  {#if store.banner}<div class="banner">{store.banner} <button class="btn sm" onclick={() => (store.banner = '')}>닫기</button></div>{/if}
  <div class="cols">
    <aside class="l"><LeftPanel /></aside>
    <main class="c"><CenterPanel /></main>
    <aside class="r"><RightPanel /></aside>
  </div>
  <div class="toasts">
    {#each store.toasts as t (t.id)}
      <div class="toast"><span>{t.text}</span>{#if t.chips.length}<Chips chips={t.chips} />{/if}</div>
    {/each}
  </div>
</div>

{#if store.panel === 'log'}
  <div class="modal-bg" role="presentation" onclick={() => (store.panel = '')}>
    <div class="modal" role="dialog" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
      <div class="modal-h">인생 기록 전체 보기<span class="spacer"></span><button class="btn sm" onclick={() => (store.panel = '')}>닫기 (Esc)</button></div>
      <div class="modal-b"><LifeLog limit={1500} full={true} /></div>
    </div>
  </div>
{/if}
{#if store.panel === 'saves'}<SaveModal />{/if}

<style>
  .game { height: 100%; display: flex; flex-direction: column; }
  .cols { flex: 1; min-height: 0; display: grid; grid-template-columns: 360px minmax(0, 1fr) 400px; gap: 12px; padding: 12px; }
  .l, .c, .r { min-height: 0; min-width: 0; }
  .toasts { position: fixed; left: 50%; transform: translateX(-50%); bottom: 18px; display: flex; flex-direction: column; gap: 6px; align-items: center; z-index: 40; pointer-events: none; }
  .toast { background: color-mix(in srgb, var(--panel) 92%, #000); border: 1px solid var(--line); box-shadow: var(--shadow); border-radius: 10px; padding: 7px 14px; font-size: 13px; max-width: 560px; display: flex; gap: 10px; align-items: center; animation: pop 0.25s ease; }
  .banner { background: color-mix(in srgb, var(--amber) 18%, var(--panel)); padding: 6px 16px; font-size: 13px; border-bottom: 1px solid var(--line); }
  :global(.app.compact) .cols { grid-template-columns: 320px minmax(0, 1fr) 340px; gap: 8px; padding: 8px; }
</style>
