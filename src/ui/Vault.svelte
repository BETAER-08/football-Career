<script lang="ts">
  import { store } from './store.svelte';
  import { loadArchive, removeArchive, type ArchiveEntry } from './save';
  import type { GameState } from '../engine/types';
  import { getCountry } from '../engine/data';

  let list = $state<ArchiveEntry[]>(loadArchive());

  function open(e: ArchiveEntry) {
    const g = JSON.parse(e.state) as GameState;
    store.game = g;
    store.archived = true;
    store.baseline = e.baseline ?? [];
    store.screen = 'end';
  }
  function del(id: string) {
    removeArchive(id);
    list = loadArchive();
  }
</script>

<div class="vault">
  <div class="panel box">
    <div class="panel-h">지난 커리어 보관함 <span class="faint" style="font-weight:500">최대 50개</span><span class="spacer"></span><button class="btn sm" onclick={() => (store.screen = 'menu')}>메인 메뉴</button></div>
    <div class="panel-b scroll col" style="gap:8px;max-height:70vh">
      {#each list as e (e.id)}
        <div class="it">
          <div class="gr">{e.playerGrade === '프로 데뷔 실패' ? '실패' : e.playerGrade}</div>
          <div class="grow col" style="gap:1px">
            <b>{e.name} <span class="faint" style="font-weight:500">{getCountry(e.country).flag} {getCountry(e.country).ko} · {e.birthYear}년생 · {e.startClub}</span></b>
            <span class="muted" style="font-size:12.5px">{e.summary}{e.coachGrade ? ` · 지도자 ${e.coachGrade}` : ''} · 운명 코드 <span class="mono">{e.code}</span></span>
          </div>
          <button class="btn sm" onclick={() => open(e)}>다시 보기</button>
          <button class="btn sm danger" onclick={() => del(e.id)}>삭제</button>
        </div>
      {:else}
        <div class="muted">아직 끝난 커리어가 없어요.</div>
      {/each}
    </div>
  </div>
</div>

<style>
  .vault { height: 100%; display: grid; place-items: center; }
  .box { width: 840px; max-width: 94vw; }
  .it { display: flex; gap: 12px; align-items: center; padding: 8px 12px; background: var(--panel2); border: 1px solid var(--line); border-radius: 10px; }
  .gr { width: 56px; text-align: center; font-size: 22px; font-weight: 900; color: var(--amber); }
</style>
