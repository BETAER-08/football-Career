<script lang="ts">
  let { values, width = 96, height = 28, tone = 'accent' }: { values: number[]; width?: number; height?: number; tone?: 'accent' | 'down' | 'muted' } = $props();
  const pts = $derived.by(() => {
    if (values.length < 2) return '';
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const span = Math.max(1, hi - lo);
    return values.map((v, i) => `${(i / (values.length - 1)) * (width - 4) + 2},${height - 3 - ((v - lo) / span) * (height - 6)}`).join(' ');
  });
  const last = $derived(pts ? pts.split(' ').pop()!.split(',') : ['0', '0']);
</script>

<svg {width} {height} viewBox="0 0 {width} {height}" aria-hidden="true">
  {#if pts}
    <polyline points={pts} fill="none" stroke="var(--{tone === 'accent' ? 'accent' : tone === 'down' ? 'down' : 'muted'})" stroke-width="1.75" stroke-linejoin="round" stroke-linecap="round" />
    <circle cx={last[0]} cy={last[1]} r="2.5" fill="var(--{tone === 'accent' ? 'accent' : tone === 'down' ? 'down' : 'muted'})" />
  {/if}
</svg>
