<script lang="ts">
  import { store } from './store.svelte';
  import { loadArchive, removeArchive, isCurrent, exportEntry, type AnyEntry } from './save';
  import { getCountry } from '../engine/data';

  let list = $state<AnyEntry[]>(loadArchive());

  function del(id: string) {
    removeArchive(id);
    list = loadArchive();
  }
  function exp(e: AnyEntry) {
    store.downloadText(exportEntry(e), `태어난김에축구_보관_${e.name ?? e.id}.json`);
  }
</script>

<div class="vault">
  <div class="panel box">
    <div class="panel-h">지난 커리어 보관함 <span class="faint" style="font-weight:500">최대 50개 · 항목당 약 30KB 이하</span><span class="spacer"></span><button class="btn sm" onclick={() => (store.screen = 'menu')}>메인 메뉴</button></div>
    <div class="panel-b scroll col" style="gap:8px;max-height:calc(70vh / var(--z, 1))">
      {#each list as e (e.id)}
        <div class="it">
          <div class="gr">{(e.playerGrade ?? '-') === '프로 데뷔 실패' ? '실패' : (e.playerGrade ?? '-')}</div>
          <div class="grow col" style="gap:1px">
            <b>{e.name ?? '이름 없음'} <span class="faint" style="font-weight:500">{e.country ? `${getCountry(e.country).flag} ${getCountry(e.country).ko}` : ''}{e.birthYear ? ` · ${e.birthYear}년생` : ''}{e.startClub ? ` · ${e.startClub}` : ''}</span></b>
            <span class="muted" style="font-size:12.5px">{e.summary ?? ''}{e.coachGrade ? ` · 지도자 ${e.coachGrade}` : ''}{e.code ? ' · 운명 코드 ' : ''}<span class="mono">{e.code ?? ''}</span></span>
            {#if !isCurrent(e)}<span class="old">이전 버전 보관 항목이라 열람할 수 없어요. 내보내기만 가능합니다.</span>{/if}
          </div>
          {#if isCurrent(e)}<button class="btn sm" onclick={() => store.showEntry(e)}>다시 보기</button>{/if}
          <button class="btn sm" onclick={() => exp(e)}>내보내기</button>
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
  .box { width: 880px; max-width: 94vw; }
  .it { display: flex; gap: var(--s3); align-items: center; padding: var(--s2) var(--s3); background: var(--panel2); border: 1px solid var(--line); border-radius: var(--r-md); }
  .gr { width: 56px; text-align: center; font-size: 22px; font-weight: 900; color: var(--amber); }
  .old { font-size: 12px; color: var(--amber); }
</style>
