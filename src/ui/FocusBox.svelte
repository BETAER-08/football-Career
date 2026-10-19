<script lang="ts">
  import { store } from './store.svelte';
  import { focusList } from '../engine/lifestyle';
  import { getClub, getCountry } from '../engine/data';
  import { ageAt, seasonOf } from '../engine/time';
  import { roleLabel } from '../engine/coach';
  import ActionPanel from './ActionPanel.svelte';

  const g = $derived(store.game!);
  const list = $derived(focusList(g.phase));
  const idc = $derived(g.phase === 'coach' ? g.coach.clubId : g.career.clubId);
  const club = $derived(idc ? getClub(idc) : null);
  const ident = $derived.by(() => {
    const s = g;
    const country = club ? getCountry(club.country).ko : getCountry(s.p.country).ko;
    if (s.phase === 'youth') return `유스 ${Math.max(1, seasonOf(s.week) + 1)}년차 · ${club?.name ?? '무적'} · ${country}`;
    if (s.phase === 'pro') return `프로 ${Math.max(1, seasonOf(s.week) - Math.max(0, s.career.debutW >= 0 ? seasonOf(s.career.debutW) : 0) + 1)}년차 · ${club?.name ?? '무적'} · ${country}`;
    if (s.phase === 'coach') return `지도자 ${s.coach.coachSeasons + 1}년차 · ${roleLabel(s.coach.role)}${club ? ' · ' + club.name : ''} · ${country}`;
    return `은퇴 후 ${Math.max(1, ageAt(s.p.birth.y, s.week) - s.career.retireAge + 1)}년차 · ${country}`;
  });
  let confirm = $state('');

  const retireAction = $derived(g.phase === 'coach' ? { id: 'coach_retire', label: '지도자 은퇴' } : g.phase === 'postcareer' ? { id: 'leave_football', label: '축구계를 떠난다' } : { id: 'retire_now', label: '은퇴 선언' });
</script>

<div class="panel">
  <div class="panel-h">
    <span>올해의 초점</span>
    <span class="ident">{ident}</span>
    <span class="spacer"></span>
    <span class="faint" style="font-weight:500">언제든 바꿀 수 있어요</span>
  </div>
  <div class="panel-b col" style="gap:10px">
    <div class="foc">
      {#each list as f}
        <button class="fc" class:on={g.focus === f.id} onclick={() => store.setFocus(f.id)} title="F 키로 순환">
          <b>{f.label}</b>
          <span>{f.effects}</span>
        </button>
      {/each}
    </div>
    <div class="row" style="flex-wrap:wrap">
      <button class="btn" onclick={() => (store.panel = 'money')}>돈 쓰기 · 투자</button>
      <button class="btn" onclick={() => (store.panel = 'career')}>커리어</button>
      <button class="btn" onclick={() => (store.panel = 'life')}>삶</button>
      <span class="spacer"></span>
      <button class="btn danger sm" onclick={() => (confirm = retireAction.id)}>{retireAction.label}</button>
    </div>
    {#if confirm}
      <div class="confirm">
        <b>{retireAction.label}</b>
        <span>정말로 {retireAction.label}할까요? 되돌릴 수 없어요.</span>
        <span class="spacer"></span>
        <button class="btn sm" onclick={() => (confirm = '')}>취소</button>
        <button class="btn danger sm" onclick={() => { store.act(confirm); confirm = ''; }}>확인하고 진행</button>
      </div>
    {/if}
  </div>
</div>
{#if store.panel === 'money' || store.panel === 'career' || store.panel === 'life'}
  <ActionPanel group={store.panel} />
{/if}

<style>
  .ident { font-weight: 600; color: var(--text); font-size: 12.5px; margin-left: 6px; }
  .foc { display: grid; grid-template-columns: repeat(auto-fill, minmax(116px, 1fr)); gap: 6px; }
  .fc { text-align: left; border: 1px solid var(--line); background: var(--panel2); border-radius: 9px; padding: 6px 9px; cursor: pointer; display: flex; flex-direction: column; gap: 1px; transition: border-color 0.12s, transform 0.06s; }
  .fc:hover { border-color: var(--faint); }
  .fc.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--panel2)); }
  .fc b { font-size: 13px; }
  .fc span { font-size: 11px; color: var(--muted); }
  .confirm { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: color-mix(in srgb, var(--danger) 10%, var(--panel)); border: 1px solid var(--danger); border-radius: 8px; font-size: 13px; }
</style>
