<script lang="ts">
  let { points, color = 'var(--accent)', height = 64, format = (v: number) => v.toFixed(1) }: { points: { label: string; value: number }[]; color?: string; height?: number; format?: (v: number) => string } = $props();
  const W = 320;
  const lo = $derived(Math.min(...points.map((p) => p.value)));
  const hi = $derived(Math.max(...points.map((p) => p.value)));
  const span = $derived(Math.max(1e-6, hi - lo));
  const xy = $derived(points.map((p, i) => ({ x: points.length > 1 ? (i / (points.length - 1)) * (W - 8) + 4 : W / 2, y: height - 6 - ((p.value - lo) / span) * (height - 12) })));
  const d = $derived(xy.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
  let hover = $state(-1);
  let box: HTMLDivElement | undefined = $state();

  function move(e: PointerEvent) {
    if (!box || points.length < 1) return;
    const r = box.getBoundingClientRect();
    const t = (e.clientX - r.left) / Math.max(1, r.width);
    hover = Math.max(0, Math.min(points.length - 1, Math.round(t * (points.length - 1))));
  }
</script>

<div class="lc" bind:this={box} onpointermove={move} onpointerleave={() => (hover = -1)} role="img" aria-label="추이 차트">
  <svg viewBox="0 0 {W} {height}" preserveAspectRatio="none" style="height:{height}px">
    <path {d} fill="none" stroke={color} stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" />
    {#if hover >= 0 && xy[hover]}<line x1={xy[hover].x} x2={xy[hover].x} y1="0" y2={height} stroke="var(--faint)" stroke-dasharray="3 3" vector-effect="non-scaling-stroke" />{/if}
  </svg>
  {#if hover >= 0 && xy[hover]}
    <i class="dot" style="left:{(xy[hover].x / W) * 100}%;top:{xy[hover].y}px;background:{color}"></i>
    <span class="tip" style="left:{Math.min(78, Math.max(0, (xy[hover].x / W) * 100 - 8))}%"><b>{points[hover].label}</b> {format(points[hover].value)}</span>
  {/if}
</div>

<style>
  .lc { position: relative; background: var(--bg2); border-radius: var(--r-sm); }
  svg { width: 100%; display: block; }
  .dot { position: absolute; width: 8px; height: 8px; margin: -4px 0 0 -4px; border-radius: 50%; pointer-events: none; }
  .tip { position: absolute; top: -26px; padding: 2px var(--s2); border-radius: var(--r-sm); background: var(--bg); border: 1px solid var(--line); font-size: var(--fs-panel); white-space: nowrap; pointer-events: none; box-shadow: var(--shadow); }
  .tip b { color: var(--muted); margin-right: var(--s1); }
</style>
