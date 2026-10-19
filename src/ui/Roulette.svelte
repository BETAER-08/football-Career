<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { store } from './store.svelte';
  import { originFromSeed } from '../engine/player';
  import { allCountries, getClub, getCountry, getLeague, leaguesOf, academyGrade, allClubIds } from '../engine/data';
  import type { GameState } from '../engine/types';
  import { reelStop, click, chime } from './audio';
  import AdmitCard from './AdmitCard.svelte';

  const RH = 62;
  const STOP = [2000, 3000, 4000];
  const DEC = 1100;
  const V = 22;

  interface Reel { items: string[]; pos: number; target: number; stopped: boolean; decStart: number; decFrom: number; decDist: number; label: string }

  const cfg = store.pendingConfig;
  const origin = cfg ? originFromSeed({ ...cfg }) : null;
  const countries = allCountries();
  const allLeagueNames = countries.flatMap((c) => leaguesOf(c.code).map((l) => l.ko));
  const allClubNames = allClubIds().filter((_, i) => i % 3 === 0).map((id) => getClub(id).name);
  const labelOf = (c: { flag: string; ko: string }) => `${c.flag} ${c.ko}`;

  let gstate: GameState | null = $state(null);
  let reels = $state<Reel[]>([
    { items: countries.map(labelOf), pos: 0, target: 0, stopped: false, decStart: -1, decFrom: 0, decDist: 0, label: '국적' },
    { items: allLeagueNames, pos: 0, target: 0, stopped: false, decStart: -1, decFrom: 0, decDist: 0, label: '리그' },
    { items: allClubNames, pos: 0, target: 0, stopped: false, decStart: -1, decFrom: 0, decDist: 0, label: '구단' }
  ]);
  let started = $state(false);
  let skipped = $state(false);
  let captions = $state<string[]>(['', '', '']);
  let cardStep = $state(0);
  let ready = $state(false);
  let t0 = 0;
  let last = 0;
  let raf = 0;
  let swapped = [false, false, false];

  function mod(a: number, n: number): number {
    return ((a % n) + n) % n;
  }

  function targetFor(i: number): number {
    if (!origin) return 0;
    if (i === 0) return countries.findIndex((c) => c.code === origin.country);
    if (i === 1) return leaguesOf(origin.country).findIndex((l) => l.id === origin.leagueId);
    const lg = getLeague(origin.leagueId);
    return lg.clubIds.indexOf(origin.clubId);
  }

  function swapItems(i: number) {
    if (!origin || swapped[i]) return;
    swapped[i] = true;
    const r = reels[i];
    if (i === 1) r.items = leaguesOf(origin.country).map((l) => l.ko);
    if (i === 2) r.items = getLeague(origin.leagueId).clubIds.map((id) => getClub(id).name);
    r.pos = mod(r.pos, r.items.length);
    r.target = targetFor(i);
  }

  function caption(i: number): string {
    if (!origin) return '';
    if (i === 0) return `현역 프로 100명 중 ${origin.countryPct.toFixed(1)}명이 이 나라 국적`;
    if (i === 1) return `이 나라 유스 100명 중 약 ${origin.leaguePct.toFixed(origin.leaguePct < 1 ? 2 : 1)}명이 이 리그 구단에서 시작`;
    const c = getClub(origin.clubId);
    return `${c.city} · 아카데미 ${academyGrade(c.acad)}등급 · 시설 ${c.facil}점`;
  }

  function finalize(i: number) {
    const r = reels[i];
    r.stopped = true;
    r.pos = r.target;
    captions[i] = caption(i);
    reelStop(i);
  }

  function frame(now: number) {
    const dt = Math.min(60, now - last);
    last = now;
    const t = now - t0;
    for (let i = 0; i < 3; i++) {
      const r = reels[i];
      if (r.stopped) continue;
      if (i > 0 && !reels[i - 1].stopped && t >= STOP[i - 1] && !swapped[i]) swapItems(i);
      if (i > 0 && reels[i - 1].stopped) swapItems(i);
      const n = r.items.length;
      if (r.decStart < 0) {
        r.pos = mod(r.pos + (V * dt) / 1000, n);
        const needItems = i === 0 || swapped[i];
        if (t >= STOP[i] - DEC && needItems) {
          r.decStart = t;
          r.decFrom = r.pos;
          let d = mod(r.target - r.pos, n);
          while (d < 6) d += n;
          r.decDist = d;
        }
      } else {
        const k = Math.min(1, (t - r.decStart) / DEC);
        const e = 1 - Math.pow(1 - k, 3);
        r.pos = mod(r.decFrom + r.decDist * e, n);
        if (k >= 1) finalize(i);
      }
    }
    reels = reels;
    if (reels.every((r: Reel) => r.stopped)) {
      done();
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function done() {
    cancelAnimationFrame(raf);
    window.setTimeout(() => { ready = true; revealCard(); }, 2200);
  }

  function revealCard() {
    if (!cfg || !origin) return;
    gstate = store.create({ ...cfg }, origin);
    cardStep = 0;
    chime();
    let k = 0;
    const tick = () => {
      k++;
      cardStep = k;
      if (k < 6) window.setTimeout(tick, 650);
    };
    window.setTimeout(tick, 400);
  }

  function start() {
    started = true;
    reels[0].target = targetFor(0);
    click();
    t0 = performance.now();
    last = t0;
    raf = requestAnimationFrame(frame);
  }

  function skip() {
    skipped = true;
    reels[0].target = targetFor(0);
    cancelAnimationFrame(raf);
    for (let i = 0; i < 3; i++) {
      swapped[i] = true;
      if (i === 1) reels[1].items = leaguesOf(origin!.country).map((l) => l.ko);
      if (i === 2) reels[2].items = getLeague(origin!.leagueId).clubIds.map((id) => getClub(id).name);
      reels[i].target = targetFor(i);
      finalize(i);
    }
    reels = reels;
    started = true;
    done();
  }

  function begin() {
    if (gstate) store.begin(gstate, origin);
  }

  onMount(() => {
    if (!cfg) store.screen = 'setup';
  });
  onDestroy(() => cancelAnimationFrame(raf));

  function rows(r: Reel): { text: string; y: number; blur: number; hi: boolean }[] {
    const n = r.items.length;
    const base = Math.floor(r.pos);
    const frac = r.pos - base;
    const out = [];
    for (let k = -2; k <= 3; k++) {
      const idx = mod(base + k, n);
      const y = (k - frac) * RH;
      const fast = !r.stopped && r.decStart < 0;
      out.push({ text: r.items[idx], y, blur: fast ? 3 : Math.abs(y) < RH * 0.5 ? 0 : 0.8, hi: Math.abs(y) < RH * 0.5 });
    }
    return out;
  }
</script>

<div class="stage">
  {#if !ready}
    <div class="slot panel">
      <div class="panel-h" style="justify-content:center">입단 룰렛 · 결과는 이미 정해져 있어요 {#if cfg}<span class="tag">{cfg.mode === 'daily' ? '오늘의 운명' : cfg.mode === 'code' ? '운명 코드' : '일반'}</span>{/if}</div>
      <div class="reels">
        {#each reels as r, i}
          <div class="reel-col">
            <div class="reel-label">{r.label}</div>
            <div class="reel" class:stopped={r.stopped}>
              <div class="hl"></div>
              {#each rows(r) as row}
                <div class="item" class:hi={row.hi} style="transform: translateY({row.y + RH}px); filter: blur({row.blur}px)">{row.text}</div>
              {/each}
              <div class="shade top"></div><div class="shade bot"></div>
            </div>
            <div class="cap">{captions[i]}</div>
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
          <button class="btn primary big" onclick={begin}>유스 생활 시작</button>
        {:else}
          <button class="btn" onclick={() => (cardStep = 9)}>한 번에 보기</button>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .stage { height: 100%; display: grid; place-items: center; overflow: auto; padding: 18px; }
  .slot { width: 1080px; max-width: 100%; }
  .reels { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; padding: 18px; }
  .reel-col { display: flex; flex-direction: column; gap: 8px; align-items: center; }
  .reel-label { font-weight: 800; color: var(--muted); letter-spacing: 0.1em; }
  .reel { position: relative; width: 100%; height: 186px; overflow: hidden; border-radius: 12px; background: var(--bg2); border: 2px solid var(--line); box-shadow: inset 0 0 24px rgba(0, 0, 0, 0.35); }
  .reel.stopped { border-color: var(--accent); box-shadow: inset 0 0 24px rgba(0, 0, 0, 0.25), 0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent); }
  .item { position: absolute; left: 0; right: 0; top: 0; height: 62px; display: grid; place-items: center; font-size: 20px; font-weight: 800; padding: 0 12px; text-align: center; color: var(--muted); }
  .item.hi { color: var(--text); }
  .hl { position: absolute; left: 0; right: 0; top: 62px; height: 62px; border-top: 1px solid var(--accent); border-bottom: 1px solid var(--accent); background: color-mix(in srgb, var(--accent) 7%, transparent); z-index: 2; pointer-events: none; }
  .shade { position: absolute; left: 0; right: 0; height: 40px; z-index: 3; pointer-events: none; }
  .shade.top { top: 0; background: linear-gradient(var(--bg2), transparent); }
  .shade.bot { bottom: 0; background: linear-gradient(transparent, var(--bg2)); }
  .cap { min-height: 40px; text-align: center; font-size: 12.5px; color: var(--amber); animation: pop 0.4s ease; }
  .big { padding: 10px 28px; font-size: 15px; }
  .card-wrap { width: 720px; max-width: 100%; }
</style>
