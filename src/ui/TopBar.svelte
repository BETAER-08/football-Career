<script lang="ts">
  import { onMount } from 'svelte';
  import { store } from './store.svelte';
  import { secPerYear, ageAt } from '../engine/time';
  import { agoText, dateLabel, seasonPhase, yearProgress } from './format';
  import { isMusicOn } from './audio';
  import Icon from './Icon.svelte';

  const g = $derived(store.game!);
  const age = $derived(ageAt(g.p.birth, g.week));
  const secs = $derived(Math.round(secPerYear(store.prefs.lengthMin) / (g.phase === 'postcareer' ? 2 : 1)));
  const prog = $derived(yearProgress(g));
  const speeds = [1, 2, 4, 8, 12, 16];
  const blocked = $derived(!!g.decision);
  const phase = $derived(seasonPhase(g));
  const week = $derived((g.week % 52) + 1);
  let nowMs = $state(Date.now());
  const savedText = $derived(store.saveFailed ? '저장 실패' : store.savedAt ? `저장됨 · ${agoText(nowMs - store.savedAt)}` : '저장 전');

  onMount(() => {
    const t = window.setInterval(() => (nowMs = Date.now()), 1000);
    return () => window.clearInterval(t);
  });
</script>

<div class="top">
  <div class="brand">태어난<br />김에 축구</div>
  <div class="grp">
    {#if blocked}
      <span class="wait"><Icon name="warn" size={16} /> 결정 대기 중</span>
    {:else}
      <button class="btn play" class:on={store.playing} disabled={g.ended} onclick={() => store.togglePlay()} title="재생 / 멈춤 (Space)" aria-label={store.playing ? '멈춤' : '재생'}>
        <Icon name={store.playing ? 'pause' : 'play'} size={16} />{store.playing ? '멈춤' : '재생'}
      </button>
    {/if}
    <button class="btn" disabled={blocked || g.ended} onclick={() => store.skipToDecision()} class:on={store.skipping} title="다음 결정이 생길 때까지 빠르게 진행">
      <Icon name={store.skipping ? 'stop' : 'fast'} size={16} />{store.skipping ? '스킵 중지' : '다음 결정까지'}
    </button>
  </div>
  <div class="div"></div>
  <div class="grp seg" role="group" aria-label="속도">
    {#each speeds as v}
      <button class="btn sm" class:on={store.speed === v} onclick={() => store.setSpeed(v)} aria-pressed={store.speed === v}>{v}×</button>
    {/each}
  </div>
  <div class="div"></div>
  <div class="grp prog">
    <div class="age mono" title="나이">{age}</div>
    <div class="info">
      <div class="line"><span class="mono">{dateLabel(g)}</span> · {week}주차 <span class="pill" data-tone={phase.tone}>{phase.label}</span></div>
      <div class="bar" title="1년 ≈ {secs}초"><i style="width:{prog * 100}%"></i></div>
    </div>
  </div>
  <div class="spacer"></div>
  <div class="div"></div>
  <div class="grp">
    <button class="btn icon" class:on={g.auto} onclick={() => store.toggleAuto()} title="자동 결정 {g.auto ? 'ON' : 'OFF'}" aria-pressed={g.auto} aria-label="자동 결정">
      <Icon name="auto" />{g.auto ? 'ON' : 'OFF'}
    </button>
    <button class="btn icon" class:on={store.prefs.music} onclick={() => store.toggleMusic()} title="음악 {store.prefs.music && isMusicOn() ? 'ON' : 'OFF'}" aria-pressed={store.prefs.music} aria-label="음악">
      <Icon name={store.prefs.music ? 'music' : 'musicOff'} />
    </button>
    <button class="btn save" class:bad={store.saveFailed} onclick={() => (store.panel = 'saves')} title="저장 · 나가기">
      <Icon name="save" /><span class="st">{savedText}</span>
    </button>
  </div>
</div>

<style>
  .top { display: flex; align-items: center; gap: var(--s3); padding: var(--s2) var(--s4); border-bottom: 1px solid var(--line); background: var(--panel); height: 68px; }
  .brand { font-weight: 800; color: var(--accent); letter-spacing: -0.01em; width: 76px; line-height: 1.15; font-size: var(--fs-sub); }
  .grp { display: flex; align-items: center; gap: var(--s2); }
  .div { width: 1px; align-self: stretch; margin: var(--s1) 0; background: var(--line); }
  .btn { display: inline-flex; align-items: center; gap: var(--s1); }
  .btn.play { min-width: 84px; justify-content: center; }
  .btn.icon { padding: var(--s2); }
  .wait { display: inline-flex; align-items: center; gap: var(--s1); min-width: 84px; justify-content: center; padding: var(--s2) var(--s3); border-radius: var(--r-sm); font-size: var(--fs-sub); font-weight: 700; color: var(--amber); border: 1px solid color-mix(in srgb, var(--amber) 55%, var(--line)); background: color-mix(in srgb, var(--amber) 10%, var(--panel)); }
  .age { font-size: var(--fs-age); font-weight: 700; line-height: 1; min-width: 64px; text-align: center; }
  .info { display: flex; flex-direction: column; gap: var(--s1); }
  .line { font-size: var(--fs-sub); color: var(--muted); display: flex; align-items: center; gap: var(--s2); white-space: nowrap; }
  .bar { height: 6px; background: var(--bg2); border-radius: 3px; overflow: hidden; width: 280px; }
  .bar i { display: block; height: 100%; background: var(--accent); transition: width 0.2s linear; }
  .pill[data-tone='accent'] { color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, var(--panel2)); border-color: color-mix(in srgb, var(--accent) 40%, var(--line)); }
  .pill[data-tone='amber'] { color: var(--amber); background: color-mix(in srgb, var(--amber) 14%, var(--panel2)); border-color: color-mix(in srgb, var(--amber) 40%, var(--line)); }
  .pill[data-tone='muted'] { color: var(--muted); background: var(--panel2); border-color: var(--line); }
  .save .st { font-size: var(--fs-panel); font-weight: 600; color: var(--muted); }
  .save.bad { border-color: var(--danger); }
  .save.bad .st { color: var(--danger); }
</style>
