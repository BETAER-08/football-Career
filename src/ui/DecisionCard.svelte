<script lang="ts">
  import { store } from './store.svelte';
  import { getClub, getCountry, getLeague, academyGrade } from '../engine/data';
  import { formatKRW, formatMarket } from '../engine/finance';
  import { ROLE_LABEL, type Offer } from '../engine/types';
  import { clubLvl } from '../engine/world';
  import { coachOfferLabel } from '../engine/coach';
  import { modeLabel } from '../engine/market';
  import { demandOdds } from '../engine/transfer';
  import Chips from './Chips.svelte';
  import { onMount } from 'svelte';

  const g = $derived(store.game!);
  const d = $derived(g.decision);
  let demands = $state<{ wage: boolean; role: boolean; buyout: boolean }>({ wage: false, role: false, buyout: false });
  let picked = $state(-1);

  $effect(() => {
    void d?.uid;
    demands = { wage: false, role: false, buyout: false };
    picked = -1;
  });

  function onKey(e: KeyboardEvent) {
    if (!d || d.kind === 'offer') return;
    const n = Number(e.key);
    if (n >= 1 && n <= d.choices.length) store.choose(n - 1);
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
  <div class="panel card" class:heavy={d.heavy}>
    <div class="panel-h"><span>{d.title}</span><span class="spacer"></span>{#if g.auto}<span class="tag">자동 결정 중</span>{/if}</div>
    <div class="panel-b col" style="gap:10px">
      {#if d.quote}<div class="quote">↻ {d.quote}</div>{/if}
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
                <div class="row"><b class="ocl">{c.name}</b><span class="tag badge" data-mode={o.mode ?? 'transfer'}>{modeLabel(o)}</span><span class="tag">{getCountry(c.country).flag} {getCountry(c.country).ko}</span><span class="tag">{getLeague(c.lg0).ko}</span><span class="tag">수준 {lvlOf(o)}</span>{#if o.yth || o.first}<span class="tag">아카데미 {academyGrade(c.acad)}등급</span>{/if}{#if o.mode === 'free'}<span class="tag">자유계약 · 이적료 없음</span>{:else if o.mode === 'pre'}<span class="tag">사전 계약 · 시즌 종료 후 합류</span>{/if}{#if o.trial}<span class="tag" style="color:var(--amber)">입단 테스트</span>{/if}</div>
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
            <button class="choice" onclick={() => store.choose(i)}>
              <span class="num mono">{i + 1}</span>
              <span class="grow col" style="gap:4px;align-items:flex-start"><b>{c.label}</b><Chips chips={c.chips} preview /></span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .card { border-color: color-mix(in srgb, var(--amber) 55%, var(--line)); animation: pop 0.3s ease; }
  .card.heavy { border-color: color-mix(in srgb, var(--info) 55%, var(--line)); }
  .quote { font-size: 12px; color: var(--g-none); border-left: 3px solid var(--g-none); padding: 2px 8px; background: color-mix(in srgb, var(--g-none) 8%, transparent); border-radius: 0 6px 6px 0; }
  .txt { font-size: 14.5px; line-height: 1.65; }
  .help { font-size: 12.5px; color: var(--info); background: color-mix(in srgb, var(--info) 8%, var(--panel)); border-radius: 8px; padding: 6px 10px; }
  .choices { display: flex; flex-direction: column; gap: 8px; }
  .choice { display: flex; gap: 12px; align-items: center; text-align: left; padding: 10px 12px; border-radius: 10px; background: var(--panel2); border: 1px solid var(--line); cursor: pointer; transition: border-color 0.12s, transform 0.06s; }
  .choice:hover { border-color: var(--accent); }
  .choice:active { transform: translateY(1px); }
  .num { width: 22px; height: 22px; display: grid; place-items: center; border-radius: 6px; background: var(--bg2); color: var(--muted); font-size: 12px; flex: none; }
  .offers { display: flex; flex-direction: column; gap: 8px; }
  .offer { padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--panel2); }
  .offer.sel { border-color: var(--accent); }
  .badge { font-weight: 800; color: var(--accent); }
  .badge[data-mode='renew'] { color: var(--info); }
  .badge[data-mode='free'] { color: var(--amber); }
  .badge[data-mode='pre'] { color: #c58bff; }
  .badge[data-mode='loan'] { color: var(--faint); }
  .ocl { font-size: 16px; }
  .og { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px 14px; font-size: 12.5px; margin: 6px 0; color: var(--muted); }
  .dm { font-size: 12.5px; display: flex; align-items: center; gap: 4px; }
  .dm.off { color: var(--faint); }
</style>
