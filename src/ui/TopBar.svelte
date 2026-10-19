<script lang="ts">
  import { store } from './store.svelte';
  import { secPerYear } from '../engine/time';
  import { ageOf, yearLabel, yearProgress } from './format';
  import { isMusicOn } from './audio';
  import { ageAt } from '../engine/time';

  const g = $derived(store.game!);
  const age = $derived(ageAt(g.p.birth.y, g.week));
  const secs = $derived(Math.round(secPerYear(store.prefs.lengthMin) / (g.phase === 'postcareer' ? 2 : 1)));
  const prog = $derived(yearProgress(g));
  const speeds = [1, 2, 4, 8, 12, 16];
  const blocked = $derived(!!g.decision);
  void ageOf;
</script>

<div class="top">
  <div class="brand">태어난 김에 축구</div>
  <div class="age mono">{age}</div>
  <div class="info col" style="gap:3px">
    <div class="line">{yearLabel(g)} · {g.p.name} · 1년 ≈ {secs}초{g.phase === 'postcareer' ? ' (은퇴 후 2배속)' : ''}</div>
    <div class="bar"><i style="width:{prog * 100}%"></i></div>
  </div>
  <div class="spacer"></div>
  <div class="ctrl row">
    <button class="btn" disabled={blocked || g.ended} onclick={() => store.togglePlay()} title="Space">{store.playing && !blocked ? '⏸ 멈춤' : '▶ 재생'}</button>
    <div class="seg">
      {#each speeds as v}
        <button class="btn sm" class:on={store.speed === v} onclick={() => store.setSpeed(v)}>{v}×</button>
      {/each}
    </div>
    <button class="btn" disabled={blocked || g.ended} onclick={() => store.skipToDecision()}>다음 결정까지 »</button>
    <button class="btn" class:on={g.auto} onclick={() => store.toggleAuto()} title="자동 결정">자동 결정 {g.auto ? 'ON' : 'OFF'}</button>
    <button class="btn" class:on={store.prefs.music} onclick={() => store.toggleMusic()} title="음악">{store.prefs.music && isMusicOn() ? '♪ 음악 ON' : '♪ 음악'}</button>
    <button class="btn" onclick={() => store.toggleTheme()} title="테마">{store.prefs.theme === 'dark' ? '☾' : '☀'}</button>
    <button class="btn" onclick={() => (store.panel = 'saves')}>저장 · 나가기</button>
  </div>
</div>

<style>
  .top { display: flex; align-items: center; gap: 16px; padding: 8px 16px; border-bottom: 1px solid var(--line); background: var(--panel); height: 68px; }
  .brand { font-weight: 800; color: var(--accent); letter-spacing: -0.01em; width: 128px; line-height: 1.15; }
  .age { font-size: 46px; font-weight: 700; line-height: 1; min-width: 70px; text-align: center; }
  .info { min-width: 280px; }
  .line { font-size: 13px; color: var(--muted); }
  .bar { height: 6px; background: var(--bg2); border-radius: 3px; overflow: hidden; width: 300px; }
  .bar i { display: block; height: 100%; background: var(--accent); transition: width 0.2s linear; }
  .ctrl { flex-wrap: nowrap; }
  .seg { display: flex; gap: 2px; background: var(--bg2); padding: 2px; border-radius: 8px; border: 1px solid var(--line); }
  .seg .btn { border: none; background: transparent; }
  .seg .btn.on { background: var(--accent); color: var(--accent-ink); }
</style>
