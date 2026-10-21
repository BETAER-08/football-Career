<script lang="ts">
  import { countryCode3, countryColors, readableOn } from './pixel/palette';
  import { getCountry } from '../engine/data';

  let { code, name = false }: { code: string; name?: boolean } = $props();
  const col = $derived(countryColors(code));
  const label = $derived(countryCode3(code));
  const ko = $derived(name ? getCountry(code).ko : '');
</script>

<span class="cc" title={getCountry(code).ko}><b class="code" style="background:{col.primary};color:{readableOn(col.primary)};box-shadow:inset 0 -2px 0 {col.secondary}">{label}</b>{#if name}<span>{ko}</span>{/if}</span>

<style>
  .cc { display: inline-flex; align-items: center; gap: var(--s1); }
  .code { font-family: var(--mono); font-size: var(--fs-panel); font-weight: 700; letter-spacing: 0.06em; padding: 0 var(--s2); border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.2); line-height: 1.5; }
</style>
