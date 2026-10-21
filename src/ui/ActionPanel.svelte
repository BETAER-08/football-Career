<script lang="ts">
  import { store } from './store.svelte';
  import { allActions, actionStatus } from '../engine/actions';
  import { formatKRW } from '../engine/finance';
  import Chips from './Chips.svelte';
  import type { ResultPanel } from '../engine/types';

  let { group }: { group: 'money' | 'career' | 'life' } = $props();
  const g = $derived(store.game!);
  const title = $derived({ money: '돈 쓰기 · 투자', career: '커리어', life: '삶' }[group]);
  const items = $derived(allActions().filter((a) => a.group === group && a.phase.includes(g.phase)).map((a) => actionStatus(g, a)));
  let confirmId = $state('');
  let last = $state<ResultPanel | null>(null);

  function run(id: string, amount = 0) {
    const r = store.act(id, amount);
    last = r;
    confirmId = '';
  }
  function amounts(): number[] {
    const c = Math.floor(g.fin.cash);
    return [0.1, 0.25, 0.5, 1].map((p) => Math.floor(c * p)).filter((v) => v >= 10);
  }
</script>

<div class="modal-bg" role="presentation" onclick={() => (store.panel = '')}>
  <div class="modal" role="dialog" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
    <div class="modal-h">{title}<span class="spacer"></span><span class="mini-hint">현금 {formatKRW(g.fin.cash)} · 예금 {formatKRW(g.fin.deposit)}</span><button class="btn sm" onclick={() => (store.panel = '')}>닫기</button></div>
    <div class="modal-b col" style="gap:8px">
      {#if last}
        <div class="res">
          <b>{last.title}</b>
          {#if last.grade !== 'none'}<span class="tag">{{ great: '대성공', ok: '성공', bad: '실패', worst: '대실패', none: '' }[last.grade]} · 굴린 값 {last.roll} / 필요 {last.need}</span>{/if}
          <div>{last.text}</div>
          <Chips chips={last.changes} />
        </div>
      {/if}
      {#each items as it}
        <div class="act" class:off={!it.enabled}>
          <div class="grow col" style="gap:3px">
            <div class="row"><b>{it.def.label}</b>{#if it.cdLeft > 0}<span class="tag">쿨타임 {it.cdLeft}주</span>{/if}{#if it.def.cooldown > 0 && it.cdLeft === 0}<span class="tag">쿨타임 {it.def.cooldown}주</span>{/if}{#if it.cost > 0 && it.def.param !== 'amount'}<span class="tag">비용 {formatKRW(it.cost)}</span>{/if}</div>
            <div class="muted" style="font-size:12.5px">{it.def.desc}</div>
            <Chips chips={it.chips} preview />
            {#if !it.enabled}<div class="why">{it.reason}</div>{/if}
          </div>
          <div class="col" style="gap:4px;align-items:flex-end">
            {#if it.def.param === 'amount'}
              <div class="row" style="flex-wrap:wrap;justify-content:flex-end;max-width:300px">
                {#each amounts() as a}
                  <button class="btn sm" disabled={!it.enabled} onclick={() => run(it.def.id, a)}>{formatKRW(a)}</button>
                {/each}
              </div>
            {:else if it.def.confirm}
              {#if confirmId === it.def.id}
                <div class="row"><span class="down" style="font-size:12px">되돌릴 수 없어요</span><button class="btn sm" onclick={() => (confirmId = '')}>취소</button><button class="btn danger sm" onclick={() => run(it.def.id)}>확인하고 실행</button></div>
              {:else}
                <button class="btn danger sm" disabled={!it.enabled} onclick={() => (confirmId = it.def.id)}>실행</button>
              {/if}
            {:else}
              <button class="btn sm primary" disabled={!it.enabled} onclick={() => run(it.def.id)}>실행</button>
            {/if}
          </div>
        </div>
      {:else}
        <div class="muted">지금 할 수 있는 항목이 없어요.</div>
      {/each}
    </div>
  </div>
</div>

<style>
  .act { display: flex; gap: var(--s3); padding: var(--s3) var(--s3); border: 1px solid var(--line); border-radius: var(--r-md); background: var(--panel2); }
  .act.off { opacity: 0.6; }
  .why { font-size: 12px; color: var(--amber); }
  .res { padding: var(--s3) var(--s3); border: 1px solid var(--accent); border-radius: var(--r-md); background: color-mix(in srgb, var(--accent) 8%, var(--panel)); display: flex; flex-direction: column; gap: var(--s1); }
</style>
