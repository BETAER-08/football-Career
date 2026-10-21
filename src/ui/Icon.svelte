<script lang="ts">
  import { ICONS, type IconName } from './icons';

  let { name, size = 18, label = '' }: { name: IconName; size?: number; label?: string } = $props();
</script>

<svg class="ic" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : 'true'}>
  <path d={ICONS[name]} />
</svg>

<style>
  .ic { flex: none; display: inline-block; vertical-align: middle; }
</style>
