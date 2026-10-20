<script lang="ts">
  import { store } from './store.svelte';
  import { dateOf, fmtDate } from '../engine/time';
  import Chips from './Chips.svelte';
  import type { Grade, LogEntry } from '../engine/types';

  let { limit = 60, full = false }: { limit?: number; full?: boolean } = $props();
  const g = $derived(store.game!);
  let scope = $state<'mine' | 'world' | 'all'>('mine');
  let filter = $state<'all' | 'star' | 'choice' | 'event' | 'match'>('all');
  let onlyMine = $state(false);

  const byId = $derived(new Map(g.log.map((e) => [e.id, e])));
  const follows = $derived.by(() => {
    const m = new Map<number, number[]>();
    for (const e of g.log) if (e.from) m.set(e.from, [...(m.get(e.from) ?? []), e.id]);
    return m;
  });

  const list = $derived.by(() => {
    let l = g.log;
    if (scope === 'mine') l = l.filter((e) => e.kind !== 'world');
    else if (scope === 'world') l = l.filter((e) => e.kind === 'world');
    if (onlyMine) l = l.filter((e) => e.mine || e.from);
    if (scope !== 'world') {
      if (filter === 'star') l = l.filter((e) => e.star);
      else if (filter === 'choice') l = l.filter((e) => e.kind === 'choice' || e.kind === 'moment' || e.kind === 'chain');
      else if (filter === 'event') l = l.filter((e) => e.kind === 'passive' || e.kind === 'system' || e.kind === 'milestone');
      else if (filter === 'match') l = l.filter((e) => e.kind === 'match');
    }
    const out: LogEntry[] = [];
    for (let i = l.length - 1; i >= 0 && out.length < limit; i--) out.push(l[i]);
    return out;
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
    if (f !== undefined) document.getElementById(`log-${f}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function ctxLine(e: LogEntry): string {
    const i = e.text.indexOf('\n→');
    return i > 0 ? e.text.slice(0, i) : '';
  }
  function star(e: LogEntry) {
    e.star = !e.star;
    store.notify();
  }
</script>

<div class="panel" class:fullp={full}>
  <div class="panel-h">
    <span>인생 기록</span>
    <span class="spacer"></span>
    {#each [['mine', '내 기록'], ['world', '세계'], ['all', '전체']] as [k, label]}
      <button class="btn sm" class:on={scope === k} onclick={() => (scope = k as typeof scope)}>{label}</button>
    {/each}
    <label class="own" title="내가 고른 선택과 그 후속 결과만 모아 봅니다"><input type="checkbox" bind:checked={onlyMine} /> 내 선택만 보기</label>
    {#if !full}<button class="btn sm" onclick={() => (store.panel = 'log')} title="L">전체 보기</button>{/if}
  </div>
  {#if scope !== 'world'}
    <div class="sub">
      {#each [['all', '전체'], ['star', '★ 즐겨찾기'], ['choice', '선택'], ['event', '사건'], ['match', '경기']] as [k, label]}
        <button class="btn sm" class:on={filter === k} onclick={() => (filter = k as typeof filter)}>{label}</button>
      {/each}
    </div>
  {/if}
  <div class="logs" class:scroll={full}>
    {#each list as e (e.id)}
      {@const lk = linkId(e)}
      <div class="entry" id="log-{e.id}" class:mine={isChoice(e)} class:fu={!!e.from} data-g={e.grade ?? ''} style="--kc:{kindColor[e.kind]};--band:{bandOf(e)}">
        <div class="rail"></div>
        <div class="grow col" style="gap:3px">
          <div class="row" style="gap:6px">
            {#if isChoice(e)}<span class="badge">내 선택</span>{/if}
            <span class="kind">{kindLabel[e.kind]}</span>
            {#if e.tier}<span class="tier" class:y={e.tier !== 'f'}>{e.tier === 'f' ? '1군' : e.tier === 'r' ? '리저브' : '유스'}</span>{/if}
            <span class="date mono">{fmtDate(dateOf(e.w))}</span>
            {#if lk}<span class="dot" style="color:{hue(lk)}" title="이어지는 선택과 결과">●</span>{/if}
            {#if e.title && !isChoice(e)}<b class="ttl">{e.title}</b>{/if}
            {#if e.dream}<span class="dreamstar" title="인생의 꿈과 관련된 일">✦</span>{/if}
            {#if follows.has(e.id)}<button class="link" onclick={() => jump(e)}>↻ 후속 보기</button>{/if}
            <span class="spacer"></span>
            <button class="star" class:on={e.star} onclick={() => star(e)} aria-label="즐겨찾기">{e.star ? '★' : '☆'}</button>
          </div>
          {#if e.quote}<div class="quote">↻ {e.quote}</div>{/if}
          {#if isChoice(e)}
            <div class="sum">
              선택: <b>{e.pick}</b> → {e.result}
              {#if e.grade && e.grade !== 'none' && e.roll !== undefined}<span class="gr" style="color:var(--band)">({gradeLabel[e.grade]} · 굴림 {e.roll} / 필요 {e.need})</span>{/if}
            </div>
            {#if ctxLine(e)}<div class="ctx">{ctxLine(e)}</div>{/if}
          {:else}
            <div class="body">{e.text}</div>
          {/if}
          {#if e.chips.length}<Chips chips={e.chips} />{/if}
          {#if e.heavy && e.help}<div class="help">도움받을 곳 · {e.help}</div>{/if}
          {#if e.note}<div class="note">{e.note}</div>{/if}
        </div>
      </div>
    {:else}
      <div class="muted" style="padding:16px">아직 기록이 없어요.</div>
    {/each}
  </div>
</div>

<style>
  .logs { display: flex; flex-direction: column; }
  .fullp .logs { max-height: calc(70vh / var(--z, 1)); }
  .sub { display: flex; gap: 6px; padding: 6px 12px; border-bottom: 1px solid var(--line); flex-wrap: wrap; }
  .own { font-size: 12px; display: inline-flex; gap: 4px; align-items: center; color: var(--muted); cursor: pointer; }
  .entry { display: flex; gap: 10px; padding: 9px 12px; border-bottom: 1px solid color-mix(in srgb, var(--line) 60%, transparent); animation: pop 0.25s ease; }
  .entry:last-child { border-bottom: none; }
  .rail { width: 3px; border-radius: 2px; background: var(--kc); flex: none; }
  .entry.mine, .entry.fu { background: color-mix(in srgb, var(--band) 9%, transparent); }
  .entry.mine .rail, .entry.fu .rail { width: 4px; background: var(--band); }
  .badge { font-size: 10.5px; font-weight: 800; padding: 0 7px; border-radius: 999px; background: var(--band); color: var(--bg); }
  .tier { font-size: 10px; font-weight: 800; padding: 0 5px; border-radius: 8px; border: 1px solid var(--line); color: var(--muted); }
  .tier.y { color: var(--info); border-color: color-mix(in srgb, var(--info) 50%, var(--line)); }
  .kind { font-size: 10.5px; font-weight: 800; color: var(--kc); letter-spacing: 0.04em; }
  .date { font-size: 11px; color: var(--faint); }
  .ttl { font-size: 13px; }
  .dot { font-size: 10px; }
  .dreamstar { color: var(--amber); font-weight: 800; }
  .link { background: none; border: none; color: var(--info); font-size: 11.5px; cursor: pointer; padding: 0; }
  .quote { font-size: 11.5px; color: var(--g-none); }
  .sum { font-size: 13.5px; line-height: 1.6; }
  .gr { font-weight: 700; font-size: 12px; }
  .ctx { font-size: 12px; color: var(--faint); }
  .body { font-size: 13.5px; line-height: 1.6; white-space: pre-line; }
  .note { font-size: 11.5px; color: var(--faint); }
  .help { font-size: 12px; color: var(--info); }
  .entry.mine .sum b { font-weight: 800; }
  .entry[data-g='worst'] .sum b { font-weight: 900; }
  .entry[data-g='worst'] .badge { font-weight: 900; }
  .star { background: none; border: none; cursor: pointer; color: var(--faint); font-size: 15px; padding: 0 2px; }
  .star.on { color: var(--amber); }
</style>
