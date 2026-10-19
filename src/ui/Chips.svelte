<script lang="ts">
  import type { Chip } from '../engine/types';
  import { chipText, arrowChip } from './format';

  let { chips, preview = false }: { chips: Chip[]; preview?: boolean } = $props();
</script>

<div class="chips">
  {#each chips as c}
    {#if c.k.startsWith('성공 약')}
      <span class="chip pct">{c.k}</span>
    {:else}
      <span class="chip" class:up={c.d > 0 && !isBad(c.k)} class:down={c.d < 0 && !isBad(c.k) || (c.d > 0 && isBad(c.k))}>{preview ? arrowChip(c) : chipText(c)}</span>
    {/if}
  {/each}
</div>

<script lang="ts" module>
  const BAD = new Set(['스트레스', '피로', '번아웃 위험', '부채', '음주', '지출', '비용']);
  function isBad(k: string): boolean {
    return BAD.has(k);
  }
</script>
