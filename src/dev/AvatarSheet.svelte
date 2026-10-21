<script lang="ts">
  import { onMount } from 'svelte';
  import { allCountries } from '../engine/data';
  import { clubKit, countryColors } from '../ui/pixel/palette';
  import { drawAvatar, resolveLook, type AvatarLook, type OutfitSpec } from '../ui/pixel/avatar';

  const ages = [14, 20, 32, 50, 65];
  const codes = allCountries().map((c) => c.code);
  const rows = Array.from({ length: 20 }, (_, i) => ({ seed: 1000 + i * 7919, country: codes[i % codes.length] }));
  const outfits: { label: string; spec: OutfitSpec }[] = [
    { label: '단색', spec: { kind: 'kit', kit: { ...clubKit('a', 10), pattern: 0, collar: 0 } } },
    { label: '세로 줄무늬', spec: { kind: 'kit', kit: { ...clubKit('a', 210), pattern: 1, collar: 1 } } },
    { label: '가로 띠', spec: { kind: 'kit', kit: { ...clubKit('a', 120), pattern: 2, collar: 2 } } },
    { label: '어깨 배색', spec: { kind: 'kit', kit: { ...clubKit('a', 40), pattern: 3, collar: 0 } } },
    { label: '대표팀', spec: { kind: 'kit', kit: countryColors('KR') } },
    { label: '트레이닝 재킷', spec: { kind: 'jacket', kit: clubKit('b', 220) } },
    { label: '정장', spec: { kind: 'suit' } },
    { label: '셔츠', spec: { kind: 'shirt' } },
    { label: '무지 티', spec: { kind: 'tee' } }
  ];
  const moods = [20, 55, 90];

  let canvases: Record<string, HTMLCanvasElement | undefined> = $state({});

  function look(seed: number, country: string, age: number, spec: OutfitSpec, morale = 55): AvatarLook {
    return resolveLook({ seed, country, age, morale, outfit: spec });
  }

  onMount(() => {
    rows.forEach((r, i) => {
      ages.forEach((a) => {
        const cv = canvases[`a${i}-${a}`];
        if (cv) drawAvatar(cv, look(r.seed, r.country, a, { kind: 'kit', kit: clubKit(`club${i}`, (i * 53) % 360) }), 3);
      });
    });
    outfits.forEach((o, i) => {
      const cv = canvases[`o${i}`];
      if (cv) drawAvatar(cv, look(5000, 'KR', 24, o.spec), 3);
    });
    moods.forEach((m, i) => {
      const cv = canvases[`m${i}`];
      if (cv) drawAvatar(cv, look(31, 'BR', 24, { kind: 'tee' }, m), 3);
    });
  });
</script>

<div class="sheet">
  <h1>아바타 확인 (개발 전용)</h1>
  <div class="grid">
    {#each rows as r, i}
      <div class="row">
        <span class="tag">{r.country} · {r.seed}</span>
        {#each ages as a}
          <figure><canvas class="pixel" bind:this={canvases[`a${i}-${a}`]}></canvas><figcaption>{a}세</figcaption></figure>
        {/each}
      </div>
    {/each}
  </div>
  <h2>의상</h2>
  <div class="line">
    {#each outfits as o, i}
      <figure><canvas class="pixel" bind:this={canvases[`o${i}`]}></canvas><figcaption>{o.label}</figcaption></figure>
    {/each}
  </div>
  <h2>표정 (사기 20 / 55 / 90)</h2>
  <div class="line">
    {#each moods as m, i}
      <figure><canvas class="pixel" bind:this={canvases[`m${i}`]}></canvas><figcaption>{m}</figcaption></figure>
    {/each}
  </div>
</div>

<style>
  .sheet { padding: 20px; color: var(--text); background: var(--bg); min-height: 100vh; }
  .grid { display: grid; grid-template-columns: repeat(2, max-content); gap: 8px 40px; }
  .row { display: flex; gap: 6px; align-items: center; }
  .tag { width: 110px; font-size: 11px; color: var(--muted); }
  .line { display: flex; gap: 8px; flex-wrap: wrap; }
  figure { margin: 0; text-align: center; font-size: 11px; color: var(--muted); }
</style>
