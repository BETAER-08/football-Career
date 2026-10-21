<script lang="ts">
  import { store } from './store.svelte';
  import { dialog } from './dialog';
  import Icon from './Icon.svelte';
  import { STAGE_TEXT } from '../engine/natsel';

  const m = $derived(store.activeModal);
  const title = $derived(m && m.kind === 'age' ? `${m.rec.year} ${m.rec.name}` : m && m.kind === 'squad' ? (m.stage === 'prelim' ? '대표팀 예비 명단 발표' : '대표팀 최종 명단 발표') : '');
</script>

{#if m && (m.kind === 'age' || m.kind === 'squad')}
  <div class="modal-bg" role="presentation" onclick={() => store.closeActive()}>
    <div class="modal rm" role="dialog" aria-label={title} tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={() => {}} use:dialog={{ close: () => store.closeActive() }}>
      <div class="modal-h"><Icon name={m.kind === 'age' ? 'trophy' : 'people'} size={18} /> {title}<span class="spacer"></span>{#if store.batchTotal > 1}<span class="tag">알림 {store.batchIndex} / {store.batchTotal}</span>{/if}</div>
      <div class="modal-b col" style="gap:var(--s3)">
        {#if m.kind === 'age'}
          <div class="res">{m.rec.result}</div>
          <div class="stats">
            <div><b class="mono">{m.rec.apps}</b><span>경기</span></div>
            <div><b class="mono">{m.rec.goals}</b><span>골</span></div>
            <div><b class="mono">{m.rec.assists}</b><span>도움</span></div>
          </div>
          {#if m.rec.awards.length}<div class="chips">{#each m.rec.awards as a}<span class="chip pct">{a}</span>{/each}</div>{/if}
        {:else}
          <div class="res">{STAGE_TEXT[m.stage]}</div>
          <div class="muted">{m.stage === 'prelim' ? '아직 최종 명단은 아니에요. 폼과 출전 시간을 유지하세요.' : '대표팀 소집 명단에 이름이 올랐어요.'}</div>
        {/if}
        <div class="row"><span class="spacer"></span><button class="btn primary" data-autofocus onclick={() => store.closeActive()}>확인</button></div>
      </div>
    </div>
  </div>
{/if}

<style>
  .rm { max-width: 460px; width: 92vw; }
  .res { font-size: 16px; font-weight: 800; }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--s2); }
  .stats div { display: flex; flex-direction: column; align-items: center; padding: var(--s2); border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--panel2); }
  .stats b { font-size: 18px; }
  .stats span { font-size: var(--fs-panel); color: var(--muted); }
</style>
