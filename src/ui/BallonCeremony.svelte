<script lang="ts">
  import { josa } from '../engine/josa';
  import { store } from './store.svelte';
  import { dialog } from './dialog';
  import Icon from './Icon.svelte';
  import CountryBadge from './CountryBadge.svelte';
  import { getClub } from '../engine/data';

  const g = $derived(store.game!);
  const c = $derived(g.wld.ceremony);
  let step = $state(0);

  $effect(() => {
    void c?.s;
    step = 0;
    const t = window.setInterval(() => { if (step < 4) step += 1; }, g.auto ? 1100 : 1700);
    return () => window.clearInterval(t);
  });
  const place = [2, 1, 0];
</script>

{#if c}
  <div class="modal-bg" role="presentation">
    <div class="modal bl" role="dialog" aria-label="발롱도르 시상식" tabindex="-1" use:dialog={{ close: () => store.closeCeremony() }}>
      <div class="modal-h"><Icon name="trophy" size={18} /> {c.year} 발롱도르 시상식<span class="spacer"></span>{#if store.batchTotal > 1}<span class="tag">알림 {store.batchIndex} / {store.batchTotal}</span>{/if}</div>
      <div class="modal-b col" style="gap:10px">
        {#each place as idx, k}
          {#if step > k}
            <div class="slot" class:first={idx === 0}>
              <span class="rk">{idx + 1}위</span>
              <div class="grow col" style="gap:0">
                <b>{c.top[idx].name} <CountryBadge code={c.top[idx].country} /></b>
                <span class="faint">{getClub(c.top[idx].club).name}</span>
              </div>
            </div>
          {/if}
        {/each}
        {#if step >= 3}
          <div class="mine">
            {#if c.winnerIsPlayer}
              {josa(g.p.name, '이')} 발롱도르를 들어 올렸다!
            {:else if c.player}
              {josa(g.p.name, '은')} {c.player}위에 올랐다.
            {:else}
              이번에는 {g.p.name}의 이름이 후보 명단에 오르지 못했다.
            {/if}
          </div>
        {/if}
        <div class="row">
          <span class="spacer"></span>
          <button class="btn primary" data-autofocus onclick={() => store.closeCeremony()}>{step >= 3 ? '닫고 계속하기' : '건너뛰기'}</button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .bl { max-width: 460px; width: 92vw; }
  .slot { display: flex; align-items: center; gap: var(--s3); padding: var(--s3) var(--s4); border: 1px solid var(--line); border-radius: var(--r-md); background: var(--panel2); animation: pop 0.35s ease; }
  .slot.first { border-color: var(--g-great); background: color-mix(in srgb, var(--g-great) 14%, var(--panel2)); font-size: 16px; }
  .rk { font-weight: 900; color: var(--amber); width: 36px; }
  .mine { text-align: center; padding: var(--s2); font-weight: 700; }
</style>
