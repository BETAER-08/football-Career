<script lang="ts">
  import { store } from './store.svelte';
  import { loadArchive } from './save';
  import { onMount } from 'svelte';
  import { click } from './audio';

  let importing = $state(false);
  let text = $state('');
  let err = $state('');
  let info = $state(false);
  const archiveCount = $derived(loadArchive().length);

  function doImport() {
    const r = store.importText(text);
    if (!r) {
      importing = false;
      text = '';
    } else err = r;
  }
  function exportLegacy() {
    if (store.legacy) store.downloadText(store.legacy.raw, '태어난김에축구_이전저장.json');
  }
  onMount(() => store.refreshSaved());
  function onFile(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    f.text().then((t) => { text = t; });
  }
</script>

<div class="menu">
  <div class="hero">
    <div class="logo">
      <span class="ball"></span>
      <h1>태어난 김에 축구</h1>
    </div>
    <p class="sub">14세, 2026년 7월. 국적도 리그도 구단도 룰렛이 정한다.<br />한 번뿐인 축구 인생을 실시간으로 산다.</p>
    <div class="btns">
      <button class="btn primary big" onclick={() => { click(); store.screen = 'setup'; }}>새로 입단하기</button>
      {#if store.hasSaved && !store.legacy}
        <button class="btn big" onclick={() => { click(); store.loadSaved(); }}>이어하기</button>
      {/if}
      {#if store.legacy}
        <div class="legacy">이전 버전 저장이라 이어할 수 없어요 <span class="faint">({store.legacy.reason})</span> <button class="btn sm" onclick={exportLegacy}>내보내기</button></div>
      {/if}
      <button class="btn big" onclick={() => (importing = true)}>저장 가져오기</button>
      <button class="btn big" onclick={() => { store.screen = 'vault'; }}>지난 커리어 보관함 ({archiveCount})</button>
      <button class="btn ghost" onclick={() => (info = true)}>확률과 보정 안내</button>
    </div>
    <div class="foot"><button class="btn sm ghost" onclick={() => store.toggleTheme()}>{store.prefs.theme === 'dark' ? '라이트 테마' : '다크 테마'}</button></div>
  </div>
</div>

{#if importing}
  <div class="modal-bg" role="presentation" onclick={() => (importing = false)}>
    <div class="modal" style="max-width:560px" role="dialog" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
      <div class="modal-h">저장 가져오기</div>
      <div class="modal-b col">
        <input type="file" accept=".json,application/json" onchange={onFile} />
        <textarea rows="6" placeholder="내보낸 저장 JSON을 붙여넣어 주세요" bind:value={text}></textarea>
        {#if err}<div class="down">{err}</div>{/if}
        <div class="row"><span class="spacer"></span><button class="btn" onclick={() => (importing = false)}>닫기</button><button class="btn primary" onclick={doImport}>가져오기</button></div>
      </div>
    </div>
  </div>
{/if}

{#if info}
  <div class="modal-bg" role="presentation" onclick={() => (info = false)}>
    <div class="modal" style="max-width:640px" role="dialog" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
      <div class="modal-h">확률과 보정 안내</div>
      <div class="modal-b col">
        <p>국가·리그·구단 데이터와 국가별 수치(인프라, 경제, 대표팀 기준, 현역 프로 선수 수, 빅리그 선수 수)는 <b>추정치</b>이며 실제와 다를 수 있습니다.</p>
        <p>부상 빈도, 은퇴 나이, 이혼율 같은 확률은 가능한 한 실제 통계에 가깝게 맞췄습니다.</p>
        <p>시작 분포는 상위 리그 구단일수록 U15 아카데미 보유율과 선수단 규모가 크다는 점을 반영해, 국가 안에서 (수준별 구단 수 × U15 보유율 × U15 선수단 규모)에 비례하게 뽑습니다.</p>
        <p><b>유일한 예외</b>: 유스에서 1군 프로 계약으로 이어지는 확률은 <b>게임성을 위해 실제보다 높게 보정</b>했습니다. (실제 아카데미 입단자의 성인 프로 데뷔율은 대체로 10~25%)</p>
        <p>점수는 절대 성과가 아니라 같은 나라, 같은 수준의 출발선에서 시작한 유망주들과 비교한 백분위로 매깁니다.</p>
        <button class="btn primary" onclick={() => (info = false)}>확인</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .menu { height: 100%; display: grid; place-items: center; background: radial-gradient(1200px 600px at 50% -10%, color-mix(in srgb, var(--accent) 14%, transparent), transparent), var(--bg); }
  .hero { text-align: center; max-width: 640px; }
  .logo { display: flex; align-items: center; justify-content: center; gap: 14px; }
  h1 { font-size: 46px; margin: 0; letter-spacing: -0.02em; }
  .ball { width: 38px; height: 38px; border-radius: 50%; background: conic-gradient(from 20deg, #fff 0 20%, #111 0 28%, #fff 0 48%, #111 0 56%, #fff 0 76%, #111 0 84%, #fff 0); box-shadow: 0 0 0 3px var(--accent); animation: spin 8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .sub { color: var(--muted); font-size: 16px; margin: 14px 0 28px; }
  .btns { display: flex; flex-direction: column; gap: 10px; align-items: center; }
  .legacy { font-size: 12.5px; max-width: 280px; padding: 8px 10px; border: 1px solid var(--amber); border-radius: 8px; color: var(--amber); }
  .big { width: 280px; padding: 12px 16px; font-size: 15px; }
  .foot { margin-top: 28px; }
</style>
