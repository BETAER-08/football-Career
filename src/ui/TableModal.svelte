<script lang="ts">
  import { store } from './store.svelte';
  import { getClub, getLeague } from '../engine/data';
  import { clubLeagueId, ranking } from '../engine/world';
  import { progressLeaders } from '../engine/review';
  import { youthLeaders, youthRanking } from '../engine/yleague';
  import { STAGE_LABEL } from '../engine/stages';

  const g = $derived(store.game!);
  const idc = $derived(g.phase === 'coach' ? g.coach.clubId : g.career.clubId);
  const lgId = $derived(idc ? clubLeagueId(g, idc) : '');
  const rt = $derived(lgId ? g.world.leagues[lgId] : undefined);
  const rank = $derived(rt ? ranking(g, lgId) : []);
  const yt = $derived(g.phase === 'youth' ? g.yt : null);
  let scope = $state<'y' | 'f'>('y');
  const useY = $derived(!!yt && scope === 'y');
  const yRank = $derived(yt ? youthRanking(yt) : []);
  const lead = $derived(useY ? youthLeaders(g) : lgId && rt ? progressLeaders(g, lgId) : null);
  const stageTag = $derived(STAGE_LABEL[g.career.youthStage]);
  let tab = $state<'t' | 'g' | 'a'>('t');
</script>

<div class="modal-bg" role="presentation" onclick={() => (store.tableOpen = false)}>
  <div class="modal" style="max-width:640px;width:94vw" role="dialog" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
    <div class="modal-h">{useY && yt ? yt.name : lgId ? getLeague(lgId).ko : '리그'} 순위<span class="spacer"></span>
      {#if yt}
        <button class="btn sm" class:on={scope === 'y'} onclick={() => (scope = 'y')}>내 유스 리그</button>
        <button class="btn sm" class:on={scope === 'f'} onclick={() => (scope = 'f')}>1군 리그</button>
      {/if}
      <button class="btn sm" class:on={tab === 't'} onclick={() => (tab = 't')}>순위표</button>
      <button class="btn sm" class:on={tab === 'g'} onclick={() => (tab = 'g')}>득점</button>
      <button class="btn sm" class:on={tab === 'a'} onclick={() => (tab = 'a')}>도움</button>
      <button class="btn sm" onclick={() => (store.tableOpen = false)}>닫기</button>
    </div>
    <div class="modal-b scroll">
      {#if useY && yt && tab === 't'}
        <table>
          <thead><tr><th>#</th><th>팀</th><th>경기</th><th>승점</th><th>득실</th></tr></thead>
          <tbody>
            {#each yRank as id, i}
              {@const t = yt.table[id]}
              <tr class:me={id === idc}><td class="mono">{i + 1}</td><td>{getClub(id).name} {stageTag}</td><td class="mono">{t[3]}</td><td class="mono">{t[0]}</td><td class="mono">{t[1] - t[2] >= 0 ? '+' : ''}{t[1] - t[2]}</td></tr>
            {/each}
          </tbody>
        </table>
        <div class="mini-hint">{stageTag} 유스 리그 · {yt.ids.length}팀 {yt.games}경기{yt.groups > 1 ? ` · ${yt.groups}개 조 중 ${yt.group + 1}번째` : ''}</div>
      {:else if !rt && !useY}
        <div class="muted">소속 리그가 없어요.</div>
      {:else if tab === 't' && rt}
        <table>
          <thead><tr><th>#</th><th>팀</th><th>경기</th><th>승점</th><th>득실</th></tr></thead>
          <tbody>
            {#each rank as id, i}
              {@const t = rt.table[id]}
              <tr class:me={id === idc}><td class="mono">{i + 1}</td><td>{getClub(id).name}</td><td class="mono">{t[3]}</td><td class="mono">{t[0]}</td><td class="mono">{t[1] - t[2] >= 0 ? '+' : ''}{t[1] - t[2]}</td></tr>
            {/each}
          </tbody>
        </table>
      {:else if lead}
        <table>
          <tbody>
            {#each tab === 'g' ? lead.scorers : lead.assisters as l, i}
              <tr class:me={l.me}><td class="mono">{i + 1}</td><td>{l.name}</td><td class="faint">{l.club}</td><td class="mono">{l.v}</td></tr>
            {/each}
          </tbody>
        </table>
        <div class="mini-hint">{useY ? '유스 리그 팀 득점에서 추정한 값이에요.' : '시즌 진행률에 비례해 계산한 값이에요.'}</div>
      {/if}
    </div>
  </div>
</div>

<style>
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  th { text-align: left; color: var(--faint); font-weight: 600; padding: 3px 6px; border-bottom: 1px solid var(--line); }
  td { padding: 3px 6px; border-bottom: 1px solid color-mix(in srgb, var(--line) 50%, transparent); }
  tr.me td { background: color-mix(in srgb, var(--accent) 18%, transparent); font-weight: 800; }
</style>
