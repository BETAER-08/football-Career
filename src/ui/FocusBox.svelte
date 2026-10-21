<script lang="ts">
  import { store } from './store.svelte';
  import { focusList } from '../engine/lifestyle';
  import { getClub, getCountry } from '../engine/data';
  import { ageAt, seasonOf } from '../engine/time';
  import { roleLabel } from '../engine/coach';
  import { STAGE_LABEL } from '../engine/stages';
  import ActionPanel from './ActionPanel.svelte';
  import Icon from './Icon.svelte';
  import { allActions, actionStatus } from '../engine/actions';
  import type { IconName } from './icons';

  const g = $derived(store.game!);
  const list = $derived(focusList(g.phase));
  const idc = $derived(g.phase === 'coach' ? g.coach.clubId : g.career.clubId);
  const club = $derived(idc ? getClub(idc) : null);
  const ident = $derived.by(() => {
    const s = g;
    const country = club ? getCountry(club.country).ko : getCountry(s.p.country).ko;
    if (s.phase === 'youth') return `유스 ${Math.max(1, seasonOf(s.week) + 1)}년차 · ${STAGE_LABEL[s.career.youthStage]} · ${club?.name ?? '무적'} · ${country}`;
    if (s.phase === 'pro') return `프로 ${Math.max(1, seasonOf(s.week) - Math.max(0, s.career.debutW >= 0 ? seasonOf(s.career.debutW) : 0) + 1)}년차 · ${club?.name ?? '무적'} · ${country}`;
    if (s.phase === 'coach') return `지도자 ${s.coach.coachSeasons + 1}년차 · ${roleLabel(s.coach.role)}${club ? ' · ' + club.name : ''} · ${country}`;
    return `은퇴 후 ${Math.max(1, ageAt(s.p.birth, s.week) - s.career.retireAge + 1)}년차 · ${country}`;
  });
  let confirm = $state('');

  function effectParts(text: string): { t: string; dir: 'up' | 'down' | '' }[] {
    return text.split(/(?<=[↑↓])\s*/).filter(Boolean).map((seg) => {
      const last = seg[seg.length - 1];
      if (last === '↑') return { t: seg.slice(0, -1).trim(), dir: 'up' as const };
      if (last === '↓') return { t: seg.slice(0, -1).trim(), dir: 'down' as const };
      return { t: seg.trim(), dir: '' as const };
    });
  }

  const groups: { id: 'money' | 'career' | 'life'; label: string; icon: IconName }[] = [
    { id: 'money', label: '돈 · 투자', icon: 'money' },
    { id: 'career', label: '커리어', icon: 'career' },
    { id: 'life', label: '삶', icon: 'life' }
  ];
  const ready = $derived(Object.fromEntries(groups.map((gr) => [gr.id, allActions().filter((a) => a.group === gr.id && a.phase.includes(g.phase)).map((a) => actionStatus(g, a)).filter((x) => x.enabled).length])) as Record<string, number>);

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
    <div class="foc" role="radiogroup" aria-label="올해의 초점">
      {#each list as f}
        <button class="fc" class:on={g.focus === f.id} role="radio" aria-checked={g.focus === f.id} onclick={() => store.setFocus(f.id)} title="F 키로 순환">
          <b>{#if g.focus === f.id}<Icon name="check" size={14} />{/if}{f.label}</b>
          <span class="fx">{#each effectParts(f.effects) as e}<em class={e.dir}>{e.t}{#if e.dir}<Icon name={e.dir} size={12} />{/if}</em>{/each}</span>
        </button>
      {/each}
    </div>
    <div class="acts">
      {#each groups as gr}
        <button class="btn act" class:on={store.panel === gr.id} onclick={() => (store.panel = store.panel === gr.id ? '' : gr.id)}>
          <Icon name={gr.icon} size={18} />{gr.label}
          {#if ready[gr.id] > 0}<span class="cnt" title="지금 할 수 있는 행동">{ready[gr.id]}</span>{/if}
        </button>
      {/each}
      <button class="btn danger sm retire" onclick={() => (confirm = retireAction.id)}>{retireAction.label}</button>
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
  .ident { font-weight: 600; color: var(--text); font-size: var(--fs-sub); margin-left: var(--s2); }
  .foc { display: grid; grid-template-columns: repeat(auto-fill, minmax(124px, 1fr)); gap: var(--s2); }
  .fc { text-align: left; border: 1px solid var(--line); background: var(--panel2); border-radius: var(--r-md); padding: var(--s2) var(--s3); cursor: pointer; display: flex; flex-direction: column; gap: var(--s1); transition: border-color 0.12s, background 0.12s; }
  .fc:hover { border-color: var(--faint); }
  .fc.on { border-color: var(--accent); background: var(--accent); color: var(--accent-ink); }
  .fc b { font-size: var(--fs-sub); display: flex; align-items: center; gap: var(--s1); }
  .fx { display: flex; flex-wrap: wrap; gap: 0 var(--s2); font-size: var(--fs-panel); color: var(--muted); }
  .fx em { font-style: normal; display: inline-flex; align-items: center; }
  .fx em.up { color: var(--up); }
  .fx em.down { color: var(--down); }
  .fc.on .fx, .fc.on .fx em { color: var(--accent-ink); }
  .acts { display: grid; grid-template-columns: repeat(3, 1fr) auto; gap: var(--s2); align-items: stretch; }
  .act { display: inline-flex; align-items: center; justify-content: center; gap: var(--s2); position: relative; padding: var(--s2) var(--s3); }
  .cnt { min-width: 20px; height: 20px; padding: 0 var(--s1); border-radius: 999px; background: var(--accent); color: var(--accent-ink); font-size: var(--fs-panel); font-weight: 800; display: inline-grid; place-items: center; }
  .confirm { display: flex; align-items: center; gap: var(--s3); padding: var(--s2) var(--s3); background: color-mix(in srgb, var(--danger) 10%, var(--panel)); border: 1px solid var(--danger); border-radius: var(--r-sm); font-size: var(--fs-sub); }
</style>
