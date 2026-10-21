<script lang="ts">
  import CountryBadge from './CountryBadge.svelte';
  import { store } from './store.svelte';
  import { getClub, getLeague, academyGrade } from '../engine/data';
  import { formatKRW, formatMarket } from '../engine/finance';
  import { ROLE_LABEL, type Offer } from '../engine/types';
  import { clubLvl } from '../engine/world';
  import { coachOfferLabel } from '../engine/coach';
  import { modeLabel } from '../engine/market';
  import { demandOdds } from '../engine/transfer';
  import Chips from './Chips.svelte';
  import { onMount, tick } from 'svelte';
  import Icon from './Icon.svelte';
  import { dialogCount } from './dialog';
  import { isIrreversible, pctRange } from './decisionRules';

  const g = $derived(store.game!);
  const d = $derived(g.decision);
  let demands = $state<{ wage: boolean; role: boolean; buyout: boolean }>({ wage: false, role: false, buyout: false });
  let picked = $state(-1);
  let armed = $state(-1);
  let hover = $state(-1);
  let root: HTMLElement | undefined = $state();
  let armTimer = 0;

  $effect(() => {
    void d?.uid;
    demands = { wage: false, role: false, buyout: false };
    picked = -1;
    armed = -1;
    hover = -1;
    void tick().then(() => root?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
  });

  function pick(i: number) {
    if (!d) return;
    const c = d.choices[i];
    if (!c || c.disabled) return;
    if (isIrreversible(d, c) && armed !== i) {
      armed = i;
      window.clearTimeout(armTimer);
      armTimer = window.setTimeout(() => (armed = -1), 4500);
      return;
    }
    window.clearTimeout(armTimer);
    armed = -1;
    store.choose(i);
  }

  function onKey(e: KeyboardEvent) {
    if (!d || d.kind === 'offer') return;
    if (dialogCount() > 0) return;
    const t = e.target as HTMLElement;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    const n = Number(e.key);
    if (n >= 1 && n <= d.choices.length) pick(n - 1);
  }
  onMount(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function lvlOf(o: Offer): number {
    return o.clubId.startsWith('NAT:') ? 4 : clubLvl(g, o.clubId);
  }
  function raiseText(o: Offer): string {
    const cur = g.career.contract ? g.career.contract.wage : 0;
    if (!cur) return '';
    const r = Math.round((o.wage / cur - 1) * 100);
    return `${r >= 0 ? '+' : ''}${r}%`;
  }
  function demandStr(): string {
    return [demands.wage ? 'wage' : '', demands.role ? 'role' : '', demands.buyout ? 'buyout' : ''].filter(Boolean).join(',');
  }
  const odds = $derived(picked >= 0 && d && d.offers[picked] && d.ref !== 'coachjob' ? demandOdds(g, d.offers[picked]) : null);
  function range(p: number): string {
    const lo = Math.max(1, Math.round(p * 100 - 4));
    const hi = Math.min(99, Math.round(p * 100 + 4));
    return `${lo}~${hi}%`;
  }
</script>

{#if d}
  <div class="panel card" class:heavy={d.heavy} bind:this={root}>
    <div class="panel-h"><span>{d.title}</span><span class="spacer"></span>{#if g.auto}<span class="tag">자동 결정 중</span>{/if}</div>
    <div class="panel-b col" style="gap:10px">
      {#if d.quote}<div class="quote">{d.quote}</div>{/if}
      <div class="txt">{d.text}</div>
      {#if d.ctx}<div class="mini-hint">{d.ctx}</div>{/if}
      {#if d.heavy && d.help}<div class="help">도움받을 곳 · {d.help}</div>{/if}

      {#if d.kind === 'offer'}
        <div class="offers">
          {#each d.offers as o, i}
            <div class="offer" class:sel={picked === i}>
              {#if d.ref === 'coachjob'}
                <div class="row"><b>{coachOfferLabel(o)}</b></div>
                <div class="muted" style="font-size:12px">계약 {o.years}년</div>
              {:else}
                {@const c = getClub(o.clubId)}
                <div class="row"><b class="ocl">{c.name}</b><span class="tag badge" data-mode={o.mode ?? 'transfer'}>{modeLabel(o)}</span><span class="tag"><CountryBadge code={c.country} name /></span><span class="tag">{getLeague(c.lg0).ko}</span><span class="tag">수준 {lvlOf(o)}</span>{#if o.yth || o.first}<span class="tag">아카데미 {academyGrade(c.acad)}등급</span>{/if}{#if o.mode === 'free'}<span class="tag">자유계약 · 이적료 없음</span>{:else if o.mode === 'pre'}<span class="tag">사전 계약 · 시즌 종료 후 합류</span>{/if}{#if o.trial}<span class="tag" style="color:var(--amber)">입단 테스트</span>{/if}</div>
                <div class="og">
                  <span>약속 역할 <b>{ROLE_LABEL[o.role]}</b></span><span>연봉 <b class="mono">{formatKRW(o.wage)}</b>{#if o.mode === 'renew' && g.career.contract && g.career.contract.wage > 0} <i class="mono">({raiseText(o)})</i>{/if}</span><span>{o.mode === 'renew' ? '새 계약 기간' : '기간'} <b>{o.years}년</b></span>
                  {#if o.mode === 'transfer' || o.mode === 'loan'}<span>{o.yth || (o.first && o.clubId !== g.career.clubId) ? '유스 보상금' : '이적료'} <b class="mono">{o.loan ? (o.optionFee ? `임대 · 옵션 ${formatMarket(o.optionFee)}` : '임대') : o.fee ? formatMarket(o.fee) : o.first && o.clubId === g.career.clubId ? '없음' : '협의'}</b></span>{:else if o.mode === 'free' || o.mode === 'pre'}<span>이적료 <b>없음</b></span>{/if}
                  <span>서명 보너스 <b class="mono">{formatKRW(o.signing)}</b></span><span>출전 보너스 <b class="mono">{formatKRW(o.appBonus)}</b></span><span>바이아웃 <b class="mono">{o.buyout ? formatMarket(o.buyout) : '없음'}</b></span>
                </div>
                <div class="muted" style="font-size:12px">감독 {o.coachName} · {o.coachStyle}{o.note ? ` · ${o.note}` : ''}</div>
              {/if}
              <div class="row" style="margin-top:6px">
                {#if picked === i && d.ref !== 'coachjob'}
                  {#if o.renego}
                    <span class="mini-hint">원래 조건으로만 계약할 수 있어요</span>
                  {:else}
                    <label class="dm"><input type="checkbox" bind:checked={demands.wage} /> 연봉 인상 요구{#if odds && demands.wage}<i class="mini-hint"> 성공 약 {range(odds.wage)}</i>{/if}</label>
                    {#if odds && odds.role === null}
                      <span class="dm off" title="이미 주전 보장">역할 상향 불가 · 이미 주전 보장</span>
                    {:else}
                      <label class="dm"><input type="checkbox" bind:checked={demands.role} /> 역할 상향 요구{#if odds && odds.role !== null}<i class="mini-hint"> 성공 약 {range(odds.role)}</i>{/if}</label>
                    {/if}
                    <label class="dm"><input type="checkbox" bind:checked={demands.buyout} /> 바이아웃 삽입{#if odds && demands.buyout}<i class="mini-hint"> 성공 약 {range(odds.buyout)}</i>{/if}</label>
                  {/if}
                {/if}
                <span class="spacer"></span>
                {#if d.ref !== 'coachjob' && picked !== i}<button class="btn sm" onclick={() => (picked = i)}>협상</button>{/if}
                <button class="btn primary sm" onclick={() => store.choose(i, picked === i && !o.renego ? demandStr() : '')}>{o.trial ? '테스트 응시' : d.ref === 'coachjob' ? '수락' : '서명'}</button>
              </div>
            </div>
          {/each}
        </div>
        {#if d.choices.length > d.offers.length}
          <button class="btn" onclick={() => store.choose(d.offers.length)}>{d.choices[d.choices.length - 1].label}</button>
        {/if}
      {:else}
        <div class="choices">
          {#each d.choices as c, i}
            {@const irr = isIrreversible(d, c)}
            {@const rg = c.pct !== null ? pctRange(c.pct) : null}
            <button class="choice" class:armed={armed === i} class:hov={hover === i} disabled={!!c.disabled} onclick={() => pick(i)} onmouseenter={() => (hover = i)} onmouseleave={() => (hover = -1)} onfocus={() => (hover = i)} onblur={() => (hover = -1)}>
              <span class="num mono">{i + 1}</span>
              <span class="grow col" style="gap:var(--s1);align-items:flex-start">
                <b>{c.label}</b>
                <span class="pv"><Chips chips={c.chips} preview /></span>
                {#if c.disabled}<span class="mini-hint">{c.disabled}</span>{/if}
                {#if armed === i}<span class="warn"><Icon name="warn" size={14} /> 되돌릴 수 없어요. 한 번 더 눌러 확정하세요.</span>{:else if irr}<span class="mini-hint"><Icon name="lock" size={12} /> 되돌릴 수 없는 선택</span>{/if}
              </span>
              {#if rg && c.pct !== null}
                <span class="odds" title="성공 확률 약 {rg[0]}~{rg[1]}%">
                  <span class="ob"><i class="band" style="left:{rg[0]}%;width:{rg[1] - rg[0]}%"></i></span>
                  <b class="mono">{rg[0]}~{rg[1]}%</b>
                </span>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .card { border: 2px solid var(--amber); box-shadow: 0 0 0 4px color-mix(in srgb, var(--amber) 16%, transparent), var(--shadow); animation: pop 0.3s ease; }
  .card.heavy { border-color: color-mix(in srgb, var(--info) 55%, var(--line)); }
  .quote { font-size: 12px; color: var(--g-none); border-left: 3px solid var(--g-none); padding: 2px var(--s2); background: color-mix(in srgb, var(--g-none) 8%, transparent); border-radius: 0 6px 6px 0; }
  .txt { font-size: 14.5px; line-height: 1.65; }
  .help { font-size: 12.5px; color: var(--info); background: color-mix(in srgb, var(--info) 8%, var(--panel)); border-radius: var(--r-sm); padding: var(--s2) var(--s3); }
  .choices { display: flex; flex-direction: column; gap: var(--s2); }
  .choice:disabled { opacity: 0.5; cursor: not-allowed; }
  .choice.armed { border-color: var(--danger); background: color-mix(in srgb, var(--danger) 12%, var(--panel2)); }
  .warn { display: inline-flex; align-items: center; gap: var(--s1); font-size: var(--fs-sub); color: var(--danger); font-weight: 700; }
  .pv { transition: transform 0.12s; transform-origin: left center; }
  .choice.hov .pv { transform: scale(1.08); }
  .choice.hov { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, var(--panel2)); }
  .odds { display: flex; flex-direction: column; align-items: flex-end; gap: var(--s1); width: 96px; flex: none; font-size: var(--fs-panel); }
  .ob { position: relative; width: 100%; height: 6px; border-radius: 3px; background: var(--bg2); overflow: hidden; }
  .band { position: absolute; top: 0; bottom: 0; background: var(--amber); }
  .choice { display: flex; gap: var(--s3); align-items: center; text-align: left; padding: var(--s3) var(--s3); border-radius: var(--r-md); background: var(--panel2); border: 1px solid var(--line); cursor: pointer; transition: border-color 0.12s, transform 0.06s; }
  .choice:hover { border-color: var(--accent); }
  .choice:active { transform: translateY(1px); }
  .num { width: 22px; height: 22px; display: grid; place-items: center; border-radius: var(--r-sm); background: var(--bg2); color: var(--muted); font-size: 12px; flex: none; }
  .offers { display: flex; flex-direction: column; gap: var(--s2); }
  .offer { padding: var(--s3) var(--s3); border: 1px solid var(--line); border-radius: var(--r-md); background: var(--panel2); }
  .offer.sel { border-color: var(--accent); }
  .badge { font-weight: 800; color: var(--accent); }
  .badge[data-mode='renew'] { color: var(--info); }
  .badge[data-mode='free'] { color: var(--amber); }
  .badge[data-mode='pre'] { color: #c58bff; }
  .badge[data-mode='loan'] { color: var(--faint); }
  .ocl { font-size: 16px; }
  .og { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px var(--s4); font-size: 12.5px; margin: 6px 0; color: var(--muted); }
  .dm { font-size: 12.5px; display: flex; align-items: center; gap: var(--s1); }
  .dm.off { color: var(--faint); }
</style>
