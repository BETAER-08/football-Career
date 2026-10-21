<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { store } from './store.svelte';
  import { originFromSeed } from '../engine/player';
  import { getClub, academyGrade } from '../engine/data';
  import type { GameState } from '../engine/types';
  import { reelStop, click, chime, tick } from './audio';
  import AdmitCard from './AdmitCard.svelte';
  import { CELL_H, GAP_MS, REDUCED_STEP_MS, buildFullPlan, fitSize, motionAt, stripOffset, tickIntervalOk, type ReelCell } from './reel';

  type Phase = 'wait' | 'spin' | 'stop';

  const cfg = store.pendingConfig;
  const origin = cfg ? originFromSeed({ ...cfg }) : null;
  const plan = origin && cfg ? buildFullPlan(origin, cfg.seed) : null;
  const labels = ['국적', '리그', '구단'];

  let gstate: GameState | null = $state(null);
  let phase = $state<Phase[]>(['wait', 'wait', 'wait']);
  let started = $state(false);
  let skipped = $state(false);
  let captions = $state<string[]>(['', '', '']);
  let cardStep = $state(0);
  let ready = $state(false);
  let strips: (HTMLElement | undefined)[] = $state([undefined, undefined, undefined]);
  let veils: (HTMLElement | undefined)[] = $state([undefined, undefined, undefined]);
  let startAt = [-1, -1, -1];
  let nextStart = 0;
  let lastCell = [0, 0, 0];
  let lastTick = 0;
  let raf = 0;
  let timers: number[] = [];

  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function caption(i: number): string {
    if (!origin) return '';
    if (i === 0) return `현재 전 세계 U15 유스 선수 100명 중 ${origin.countryPct.toFixed(1)}명이 이 나라 국적`;
    if (i === 1) return `이 나라 U15 선수 100명 중 약 ${origin.leaguePct.toFixed(origin.leaguePct < 1 ? 2 : 1)}명이 이 리그 구단 소속`;
    const c = getClub(origin.clubId);
    return `${c.city} · 아카데미 ${academyGrade(c.acad)}등급 · 시설 ${c.facil}점 · 이 리그 U15 선수 100명 중 약 ${origin.clubPct.toFixed(origin.clubPct < 1 ? 2 : 1)}명이 이 구단`;
  }

  function place(i: number, pos: number) {
    const el = strips[i];
    if (el) el.style.transform = `translate3d(0, ${stripOffset(pos)}px, 0)`;
  }

  function veil(i: number, v: number) {
    const el = veils[i];
    if (el) el.style.opacity = String(Math.max(0, Math.min(0.9, v)));
  }

  function finalize(i: number) {
    if (!plan || phase[i] === 'stop') return;
    phase[i] = 'stop';
    place(i, plan.reels[i].resultAt);
    veil(i, 0);
    captions[i] = caption(i);
    reelStop(i);
  }

  function beginReel(i: number, now: number) {
    startAt[i] = now;
    lastCell[i] = 0;
    phase[i] = 'spin';
  }

  function frame(now: number) {
    if (!plan) return;
    for (let i = 0; i < 3; i++) {
      if (phase[i] === 'wait' && startAt[i] < 0 && ((i === 0 && nextStart > 0 && now >= nextStart) || (i > 0 && phase[i - 1] === 'stop' && nextStart > 0 && now >= nextStart))) {
        beginReel(i, now);
        nextStart = 0;
      }
      if (phase[i] !== 'spin') continue;
      if (!strips[i]) continue;
      const m = motionAt(now - startAt[i], plan.reels[i].resultAt);
      place(i, m.pos);
      veil(i, m.speed * 0.85);
      const cell = Math.floor(m.pos + 0.5);
      if (cell !== lastCell[i]) {
        lastCell[i] = cell;
        if (tickIntervalOk(now, lastTick)) {
          lastTick = now;
          tick(m.speed);
        }
      }
      if (m.done) {
        finalize(i);
        if (i < 2) nextStart = now + GAP_MS;
      }
    }
    if (phase.every((p) => p === 'stop')) {
      done();
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function done() {
    cancelAnimationFrame(raf);
    timers.push(window.setTimeout(() => { ready = true; revealCard(); }, 2200));
  }

  function revealCard() {
    if (!cfg || !origin) return;
    gstate = store.create({ ...cfg }, origin);
    cardStep = 0;
    chime();
    let k = 0;
    const step = () => {
      k++;
      cardStep = k;
      if (k < 6) timers.push(window.setTimeout(step, 650));
    };
    timers.push(window.setTimeout(step, 400));
  }

  function start() {
    if (!plan) return;
    started = true;
    click();
    if (reduced) {
      for (let i = 0; i < 3; i++) {
        timers.push(window.setTimeout(() => {
          phase[i] = 'spin';
          requestAnimationFrame(() => finalize(i));
          if (i === 2) done();
        }, REDUCED_STEP_MS * (i + 1)));
      }
      return;
    }
    nextStart = performance.now() + 30;
    raf = requestAnimationFrame(frame);
  }

  function skip() {
    if (!plan) return;
    skipped = true;
    cancelAnimationFrame(raf);
    timers.forEach((t) => clearTimeout(t));
    timers = [];
    for (let i = 0; i < 3; i++) if (phase[i] === 'wait') phase[i] = 'spin';
    requestAnimationFrame(() => {
      for (let i = 0; i < 3; i++) finalize(i);
      done();
    });
  }

  function begin() {
    if (gstate) store.begin(gstate, origin);
  }

  onMount(() => {
    if (!cfg) store.screen = 'setup';
  });
  onDestroy(() => {
    cancelAnimationFrame(raf);
    timers.forEach((t) => clearTimeout(t));
  });

  const avail = (c: ReelCell) => (c.kind === 'country' ? 215 : c.kind === 'league' ? 280 : 250);
</script>

<div class="stage">
  {#if !ready}
    <div class="slot panel">
      <div class="panel-h" style="justify-content:center">입단 룰렛 · 결과는 이미 정해져 있어요 {#if cfg}<span class="tag">{cfg.mode === 'daily' ? '오늘의 운명' : cfg.mode === 'code' ? '운명 코드' : '일반'}</span>{/if}</div>
      <div class="reels">
        {#each labels as label, i}
          <div class="reel-col">
            <div class="reel-label">{label}</div>
            <div class="reel" class:stopped={phase[i] === 'stop'} class:flash={phase[i] === 'stop' && started && !skipped && !reduced}>
              <div class="hl"></div>
              {#if phase[i] === 'wait' || !plan}
                <div class="wait" style="animation-delay:{i * 0.35}s">?</div>
              {:else}
                <div class="strip" bind:this={strips[i]} style="transform: translate3d(0, {CELL_H}px, 0)">
                  {#each plan.reels[i].cells as cell, ci}
                    <div class="cell">
                      <div class="inner" class:pop={phase[i] === 'stop' && ci === plan.reels[i].resultAt}>
                        {#if cell.kind === 'country'}
                          <span class="code" style="background:{cell.bg};color:{cell.fg}">{cell.code3}</span>
                          <span class="nm" style="font-size:{fitSize(cell.name, avail(cell))}px">{cell.name}</span>
                        {:else if cell.kind === 'league'}
                          <span class="col">
                            <span class="nm" style="font-size:{fitSize(cell.name, avail(cell))}px">{cell.name}</span>
                            <span class="lvl">{cell.level}</span>
                          </span>
                        {:else}
                          <span class="dot" style="background:{cell.color}"></span>
                          <span class="nm" style="font-size:{fitSize(cell.name, avail(cell))}px">{cell.name}</span>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
                <div class="veil" bind:this={veils[i]}></div>
              {/if}
              <div class="shade top"></div><div class="shade bot"></div>
            </div>
            <div class="cap">{#if captions[i]}<span class="rise">{captions[i]}</span>{/if}</div>
          </div>
        {/each}
      </div>
      <div class="row" style="justify-content:center;padding:14px">
        {#if !started}
          <button class="btn primary big" onclick={start}>입단하기 (룰렛 돌리기)</button>
          <button class="btn" onclick={() => (store.screen = 'setup')}>뒤로</button>
        {:else if !skipped}
          <button class="btn" onclick={skip}>건너뛰기</button>
        {/if}
      </div>
      <div class="mini-hint" style="text-align:center;padding-bottom:10px">다시 돌리기는 없어요. 한 번뿐인 인생입니다.</div>
    </div>
  {:else if gstate}
    <div class="card-wrap">
      <AdmitCard s={gstate} revealStep={cardStep} />
      <div class="row" style="justify-content:center;margin-top:14px">
        {#if cardStep >= 5}
          <button class="btn primary big" disabled={!gstate.dream} onclick={begin}>{gstate.dream ? '유스 생활 시작' : '인생의 꿈을 골라 주세요'}</button>
        {:else}
          <button class="btn" onclick={() => (cardStep = 9)}>한 번에 보기</button>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .stage { height: 100%; display: grid; place-items: center; overflow: auto; padding: var(--s4); }
  .slot { width: 1080px; max-width: 100%; }
  .reels { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--s4); padding: var(--s4); }
  .reel-col { display: flex; flex-direction: column; gap: var(--s2); align-items: center; min-width: 0; }
  .reel-label { font-weight: 800; color: var(--muted); letter-spacing: 0.1em; }
  .reel { position: relative; width: 100%; height: 186px; overflow: hidden; border-radius: var(--r-lg); background: var(--bg2); border: 2px solid var(--line); box-shadow: inset 0 0 24px rgba(0, 0, 0, 0.35); contain: paint; }
  .reel.stopped { border-color: var(--accent); box-shadow: inset 0 0 24px rgba(0, 0, 0, 0.25), 0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent); }
  .reel.flash { animation: flash 0.5s ease-out 1; }
  .strip { position: absolute; left: 0; right: 0; top: 0; will-change: transform; }
  .cell { height: 62px; display: grid; place-items: center; padding: 0 var(--s3); }
  .inner { display: flex; align-items: center; justify-content: center; gap: var(--s3); max-width: 100%; font-weight: 800; color: var(--text); white-space: nowrap; }
  .inner.pop { animation: pop-cell 0.25s ease-out 1; }
  .col { display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .nm { line-height: 1.15; }
  .code { font-size: 13px; font-weight: 800; letter-spacing: 0.06em; padding: var(--s1) var(--s2); border-radius: var(--r-sm); border: 1px solid rgba(255, 255, 255, 0.25); font-family: 'IBM Plex Mono', monospace; }
  .lvl { font-size: var(--fs-panel); font-weight: 700; color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 55%, transparent); border-radius: 999px; padding: 1px var(--s2); }
  .dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.35); flex: none; }
  .wait { position: absolute; left: 0; right: 0; top: 62px; height: 62px; display: grid; place-items: center; font-size: 30px; font-weight: 800; color: var(--muted); opacity: 0.5; filter: blur(1.5px); animation: sway 1.9s ease-in-out infinite; will-change: transform; }
  .veil { position: absolute; inset: 0; opacity: 0; pointer-events: none; z-index: 2; overflow: hidden; }
  .veil::before { content: ''; position: absolute; left: 0; right: 0; top: -14px; bottom: 0; background: repeating-linear-gradient(180deg, rgba(255, 255, 255, 0) 0 5px, rgba(255, 255, 255, 0.2) 5px 9px, rgba(255, 255, 255, 0) 9px 14px); animation: streak 0.08s linear infinite; will-change: transform; }
  .hl { position: absolute; left: 0; right: 0; top: 62px; height: 62px; border-top: 1px solid var(--accent); border-bottom: 1px solid var(--accent); background: color-mix(in srgb, var(--accent) 7%, transparent); z-index: 1; pointer-events: none; }
  .shade { position: absolute; left: 0; right: 0; height: 40px; z-index: 3; pointer-events: none; }
  .shade.top { top: 0; background: linear-gradient(var(--bg2), transparent); }
  .shade.bot { bottom: 0; background: linear-gradient(transparent, var(--bg2)); }
  .cap { min-height: 40px; text-align: center; font-size: 12.5px; color: var(--amber); }
  .rise { display: inline-block; animation: rise 0.3s ease-out 1; }
  .big { padding: var(--s3) var(--s5); font-size: 15px; }
  .card-wrap { width: 720px; max-width: 100%; }
  @keyframes streak { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(0, 14px, 0); } }
  @keyframes sway { 0%, 100% { transform: translate3d(0, -6px, 0); } 50% { transform: translate3d(0, 6px, 0); } }
  @keyframes flash { 0% { border-color: #fff; box-shadow: inset 0 0 24px rgba(0, 0, 0, 0.25), 0 0 18px 4px var(--accent); } 100% { border-color: var(--accent); } }
  @keyframes pop-cell { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
  @keyframes rise { from { opacity: 0; transform: translate3d(0, 14px, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }
  @media (prefers-reduced-motion: reduce) {
    .wait, .veil::before, .reel.flash, .inner.pop, .rise { animation: none; }
  }
</style>
