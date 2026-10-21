<script lang="ts">
  import { onMount } from 'svelte';
  import { store } from './store.svelte';
  import { dateOf, fmtDate, seasonLabel, seasonOf } from '../engine/time';
  import Chips from './Chips.svelte';
  import Lines from './Lines.svelte';
  import DecisionCard from './DecisionCard.svelte';
  import Icon from './Icon.svelte';
  import type { Grade, LogEntry } from '../engine/types';

  let { limit = 1500, full = false }: { limit?: number; full?: boolean } = $props();
  const g = $derived(store.game!);
  type Filter = 'all' | 'mine' | 'match' | 'deal' | 'world';
  let filter = $state<Filter>('all');
  let onlyStar = $state(false);
  let query = $state('');
  let scroller: HTMLDivElement | undefined = $state();
  let scrollTop = $state(0);
  let viewH = $state(480);
  let ver = $state(0);
  let flash = $state(0);
  const heights = new Map<string, number>();
  let raf = 0;
  const BUFFER = 20;
  const EST = 96;
  const DEAL = /(이적|계약|입단|재계약|방출|임대|사전 계약|바이아웃|FA)/;

  const byId = $derived(new Map(g.log.map((e) => [e.id, e])));
  const follows = $derived.by(() => {
    const m = new Map<number, number[]>();
    for (const e of g.log) if (e.from) m.set(e.from, [...(m.get(e.from) ?? []), e.id]);
    return m;
  });

  const list = $derived.by(() => {
    let l = g.log;
    if (filter === 'world') l = l.filter((e) => e.kind === 'world');
    else {
      if (filter !== 'all') l = l.filter((e) => e.kind !== 'world');
      if (filter === 'mine') l = l.filter((e) => e.mine || e.from);
      else if (filter === 'match') l = l.filter((e) => e.kind === 'match');
      else if (filter === 'deal') l = l.filter((e) => DEAL.test(e.title) || DEAL.test(e.text));
    }
    if (onlyStar) l = l.filter((e) => e.star);
    const q = query.trim().toLowerCase();
    if (q) l = l.filter((e) => `${e.title} ${e.text} ${e.pick ?? ''} ${e.result ?? ''}`.toLowerCase().includes(q));
    const out: LogEntry[] = [];
    for (let i = l.length - 1; i >= 0 && out.length < limit; i--) out.push(l[i]);
    return out;
  });

  function seasonTitle(sn: number): string {
    const rec = [...g.career.seasons, ...g.career.ySeasons, g.career.cur, g.career.yCur].find((r) => r && r.s === sn && r.clubName);
    if (!rec) return seasonLabel(sn);
    const pos = rec.pos > 0 ? ` · 리그 ${rec.pos}위` : '';
    return `${seasonLabel(sn)} · ${rec.clubName}${pos}`;
  }

  type Row = { key: string; head?: string; season: number; e?: LogEntry };
  const rows = $derived.by(() => {
    const out: Row[] = [];
    let cur = -1;
    for (const e of list) {
      const sn = seasonOf(e.w);
      if (sn !== cur) {
        cur = sn;
        out.push({ key: `h-${sn}`, head: seasonTitle(sn), season: sn });
      }
      out.push({ key: `e-${e.id}`, season: sn, e });
    }
    return out;
  });

  const offsets = $derived.by(() => {
    void ver;
    let sum = 0;
    let n = 0;
    for (const h of heights.values()) {
      sum += h;
      n++;
    }
    const avg = n ? sum / n : EST;
    const o = new Array<number>(rows.length + 1);
    o[0] = 0;
    for (let i = 0; i < rows.length; i++) o[i + 1] = o[i] + (heights.get(rows[i].key) ?? avg);
    return o;
  });

  function indexAt(y: number): number {
    let lo = 0;
    let hi = rows.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (offsets[mid + 1] <= y) lo = mid + 1;
      else hi = mid;
    }
    return Math.min(lo, Math.max(0, rows.length - 1));
  }

  const first = $derived(indexAt(scrollTop));
  const range = $derived({ a: Math.max(0, first - BUFFER), b: Math.min(rows.length, indexAt(scrollTop + viewH) + BUFFER + 1) });
  const slice = $derived(rows.slice(range.a, range.b));
  const topPad = $derived(offsets[range.a] ?? 0);
  const botPad = $derived(Math.max(0, (offsets[rows.length] ?? 0) - (offsets[range.b] ?? 0)));
  const pinned = $derived(rows[first] ? seasonTitle(rows[first].season) : '');

  function measure(node: HTMLElement, key: string) {
    const ro = new ResizeObserver(() => {
      const h = node.offsetHeight;
      if (heights.get(key) !== h) {
        heights.set(key, h);
        if (!raf) raf = requestAnimationFrame(() => { raf = 0; ver++; });
      }
    });
    ro.observe(node);
    return { destroy: () => ro.disconnect() };
  }

  function onScroll() {
    if (scroller) scrollTop = scroller.scrollTop;
  }

  export function jumpTo(id: number) {
    filter = 'all';
    onlyStar = false;
    query = '';
    void Promise.resolve().then(() => {
      const idx = rows.findIndex((r) => r.e && r.e.id === id);
      if (idx < 0 || !scroller) return;
      scroller.scrollTop = Math.max(0, offsets[idx] - 8);
      scrollTop = scroller.scrollTop;
      flash = id;
      window.setTimeout(() => (flash = 0), 1600);
    });
  }

  $effect(() => {
    const id = store.logFocus;
    if (id > 0 && (full || store.panel === '')) {
      store.logFocus = 0;
      jumpTo(id);
    }
  });

  onMount(() => {
    if (!scroller) return;
    viewH = scroller.clientHeight;
    const ro = new ResizeObserver(() => scroller && (viewH = scroller.clientHeight));
    ro.observe(scroller);
    return () => ro.disconnect();
  });

  const kindColor: Record<string, string> = { passive: 'var(--info)', choice: 'var(--amber)', system: 'var(--faint)', match: 'var(--accent)', milestone: '#c58bff', chain: '#ff8bd0', moment: '#ff9d5a', world: '#79c0ff' };
  const kindLabel: Record<string, string> = { passive: '사건', choice: '선택', system: '기록', match: '경기', milestone: '이정표', chain: '이야기', moment: '순간', world: '세계' };
  const gradeColor: Record<Grade, string> = { great: 'var(--g-great)', ok: 'var(--g-ok)', bad: 'var(--g-bad)', worst: 'var(--g-worst)', none: 'var(--g-none)' };
  const gradeLabel: Record<Grade, string> = { great: '대성공', ok: '성공', bad: '실패', worst: '대실패', none: '' };
  const LINKS = ['#ff8bd0', '#9d8bff', '#4fd1c5', '#ffb84d', '#7fd36e', '#ff7a7a'];

  function bandOf(e: LogEntry): string {
    if (e.mine) return gradeColor[e.grade ?? 'none'];
    if (e.from) {
      const o = byId.get(e.from);
      return o && o.grade ? gradeColor[o.grade] : 'var(--g-none)';
    }
    return kindColor[e.kind];
  }
  const isChoice = (e: LogEntry) => !!e.mine;
  const hue = (id: number) => LINKS[id % LINKS.length];
  function linkId(e: LogEntry): number {
    return e.from ?? (follows.has(e.id) ? e.id : 0);
  }
  function jump(e: LogEntry) {
    const f = follows.get(e.id)?.[0];
    if (f !== undefined) jumpTo(f);
  }
  function ctxLine(e: LogEntry): string {
    const i = e.text.indexOf('\n→');
    return i > 0 ? e.text.slice(0, i) : '';
  }
  function star(e: LogEntry) {
    e.star = !e.star;
    store.notify();
  }
  const filters: [Filter, string][] = [['all', '전체'], ['mine', '내 선택'], ['match', '경기'], ['deal', '이적·계약'], ['world', '세계']];
</script>

<div class="panel" class:fullp={full}>
  <div class="panel-h">
    <span>인생 기록</span>
    <span class="spacer"></span>
    <label class="srch"><Icon name="search" size={14} /><input type="text" placeholder="검색" bind:value={query} aria-label="기록 검색" /></label>
    <button class="btn sm icon" class:on={onlyStar} onclick={() => (onlyStar = !onlyStar)} title="즐겨찾기만 보기" aria-pressed={onlyStar}><Icon name="star" size={14} /></button>
    {#if !full}<button class="btn sm" onclick={() => (store.panel = 'log')} title="L">전체 보기</button>{/if}
  </div>
  <div class="sub seg" role="group" aria-label="기록 필터">
    {#each filters as [k, label]}
      <button class="btn sm" class:on={filter === k} aria-pressed={filter === k} onclick={() => (filter = k)}>{label}</button>
    {/each}
  </div>
  {#if rows.length}<div class="pin" aria-hidden="true">{pinned}</div>{/if}
  {#if !full}
    {#if store.game?.decision}
      <div class="slot"><DecisionCard /></div>
    {/if}
  {/if}
  <div class="logs scroll" bind:this={scroller} onscroll={onScroll}>
    <div style="height:{topPad}px"></div>
    {#each slice as r (r.key)}
      {#if r.head}
        <div class="head" class:dup={r.key === rows[0]?.key} use:measure={r.key}>{r.head}</div>
      {:else if r.e}
        {@const e = r.e}
        {@const lk = linkId(e)}
        <div class="entry" use:measure={r.key} id="log-{e.id}" class:mine={isChoice(e)} class:fu={!!e.from} class:flash={flash === e.id} data-g={e.grade ?? ''} style="--kc:{kindColor[e.kind]};--band:{bandOf(e)}">
          <div class="rail"></div>
          <div class="grow col" style="gap:var(--s1)">
            <div class="row" style="gap:var(--s2)">
              {#if e.star}<span class="starred" title="즐겨찾기"><Icon name="star" size={14} /></span>{/if}
              {#if isChoice(e)}<span class="badge">내 선택</span>{/if}
              <span class="kind">{kindLabel[e.kind]}</span>
              {#if e.tier}<span class="tier" class:y={e.tier !== 'f'}>{e.tier === 'f' ? '1군' : e.tier === 'r' ? '리저브' : '유스'}</span>{/if}
              <span class="date mono">{fmtDate(dateOf(e.w))}</span>
              {#if lk}<span class="dot" style="color:{hue(lk)}" title="이어지는 선택과 결과">●</span>{/if}
              {#if e.title && !isChoice(e)}<b class="ttl">{e.title}</b>{/if}
              {#if e.dream}<span class="dreamstar" title="인생의 꿈과 관련된 일"><Icon name="star" size={12} /></span>{/if}
              {#if follows.has(e.id)}<button class="link" onclick={() => jump(e)}>후속 보기</button>{/if}
              <span class="spacer"></span>
              <button class="star" class:on={e.star} onclick={() => star(e)} aria-label="즐겨찾기" aria-pressed={!!e.star}><Icon name="star" size={14} /></button>
            </div>
            {#if e.quote}<div class="quote">{e.quote}</div>{/if}
            {#if isChoice(e)}
              <div class="sum">
                선택: <b>{e.pick}</b> → {e.result}
                {#if e.grade && e.grade !== 'none' && e.roll !== undefined}<span class="gr" style="color:var(--band)">({gradeLabel[e.grade]} · 굴림 {e.roll} / 필요 {e.need})</span>{/if}
              </div>
              {#if ctxLine(e)}<div class="ctx">{ctxLine(e)}</div>{/if}
            {:else}
              <div class="body">{e.text}</div>
            {/if}
            <Lines lines={e.lines} />
            {#if e.chips.length}<Chips chips={e.chips} />{/if}
            {#if e.heavy && e.help}<div class="help">도움받을 곳 · {e.help}</div>{/if}
            {#if e.note}<div class="note">{e.note}</div>{/if}
          </div>
        </div>
      {/if}
    {/each}
    <div style="height:{botPad}px"></div>
    {#if !rows.length}<div class="muted" style="padding:var(--s4)">아직 기록이 없어요.</div>{/if}
  </div>
</div>

<style>
  .slot { flex: none; border-bottom: 1px solid var(--line); background: color-mix(in srgb, var(--amber) 7%, var(--panel)); border-left: 3px solid var(--amber); }
  .slot :global(.panel) { background: transparent; border: none; border-radius: 0; box-shadow: none; animation: none; }
  .slot :global(.panel-h) { border-bottom: none; padding-bottom: 0; }
  .sub { margin: var(--s2) var(--s3); align-self: flex-start; }
  .entry { display: flex; gap: var(--s3); padding: 9px var(--s3); border-bottom: 1px solid color-mix(in srgb, var(--line) 60%, transparent); }
  .entry:last-child { border-bottom: none; }
  .rail { width: 3px; border-radius: var(--r-sm); background: var(--kc); flex: none; }
  .entry.mine, .entry.fu { background: color-mix(in srgb, var(--band) 9%, transparent); }
  .entry.mine .rail, .entry.fu .rail { width: 4px; background: var(--band); }
  .badge { font-size: var(--fs-panel); font-weight: 800; padding: 0 7px; border-radius: 999px; background: var(--band); color: var(--bg); }
  .tier { font-size: var(--fs-panel); font-weight: 800; padding: 0 5px; border-radius: var(--r-sm); border: 1px solid var(--line); color: var(--muted); }
  .tier.y { color: var(--info); border-color: color-mix(in srgb, var(--info) 50%, var(--line)); }
  .kind { font-size: var(--fs-panel); font-weight: 800; color: var(--kc); letter-spacing: 0.04em; }
  .date { font-size: var(--fs-panel); color: var(--faint); }
  .ttl { font-size: 13px; }
  .dot { font-size: var(--fs-panel); }
  .dreamstar { color: var(--amber); font-weight: 800; }
  .link { background: none; border: none; color: var(--info); font-size: var(--fs-panel); cursor: pointer; padding: 0; }
  .quote { font-size: var(--fs-panel); color: var(--g-none); }
  .sum { font-size: 13.5px; line-height: 1.6; }
  .gr { font-weight: 700; font-size: 12px; }
  .ctx { font-size: 12px; color: var(--faint); }
  .body { font-size: 13.5px; line-height: 1.6; white-space: pre-line; }
  .note { font-size: var(--fs-panel); color: var(--faint); }
  .help { font-size: 12px; color: var(--info); }
  .entry.mine .sum b { font-weight: 800; }
  .entry[data-g='worst'] .sum b { font-weight: 900; }
  .entry[data-g='worst'] .badge { font-weight: 900; }
  .star { background: none; border: none; cursor: pointer; color: var(--faint); padding: 0 2px; display: inline-flex; }
  .star.on { color: var(--amber); }
  .panel:not(.fullp) { display: flex; flex-direction: column; }
  .logs { height: 520px; position: relative; }
  .panel:not(.fullp) .logs { flex: 1; height: auto; min-height: 320px; }
  .fullp .logs { height: calc(70vh / var(--z, 1)); }
  .head.dup { display: none; }
  .pin { flex: none; padding: var(--s1) var(--s3); background: color-mix(in srgb, var(--accent) 18%, var(--panel2)); border-bottom: 1px solid var(--line); font-size: var(--fs-panel); font-weight: 800; letter-spacing: 0.04em; }
  .head { padding: var(--s2) var(--s3); background: var(--panel2); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); font-size: var(--fs-panel); font-weight: 800; color: var(--muted); letter-spacing: 0.04em; }
  .srch { display: inline-flex; align-items: center; gap: var(--s1); color: var(--muted); }
  .srch input { width: 120px; padding: var(--s1) var(--s2); font-size: var(--fs-panel); }
  .btn.icon { display: inline-flex; align-items: center; }
  .starred { color: var(--amber); display: inline-flex; }
  .entry.flash { animation: flashbg 1.6s ease; }
  @keyframes flashbg { 0%, 60% { background: color-mix(in srgb, var(--amber) 28%, transparent); } 100% { background: transparent; } }
</style>
