<script lang="ts">
  import type { Line } from '../engine/types';

  let { lines }: { lines?: Line[] } = $props();
</script>

{#if lines && lines.length}
  <div class="lines">
    {#each lines as l}
      <div class="line">
        <span class="ic" aria-hidden="true">{l.icon}</span>
        <div class="bd">
          <div class="who"><b>{l.name}</b><em>{l.rel}</em></div>
          <div class="say">“{l.text}”</div>
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .lines { display: flex; flex-direction: column; gap: var(--s2); }
  .line { display: flex; gap: var(--s2); align-items: flex-start; padding: var(--s2) var(--s3); border-radius: var(--r-md); background: color-mix(in srgb, var(--accent) 7%, var(--panel2)); border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent); }
  .ic { font-size: 18px; line-height: 1.3; }
  .bd { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .who { display: flex; gap: var(--s2); align-items: baseline; font-size: var(--fs-panel); }
  .who b { font-weight: 800; }
  .who em { font-style: normal; color: var(--muted); font-size: var(--fs-panel); }
  .say { font-size: var(--fs-body); line-height: 1.55; overflow-wrap: anywhere; }
</style>
